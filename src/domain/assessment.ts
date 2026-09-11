import type { Project, Scenario } from './schema';
import { scenarioDemand } from './calculations';
import { reviewSignature, scoreEvidence } from './evidence';
import { corners, placementIssues, polygonsOverlap } from './geometry';
import { segmentIssues } from './scene';

export type Check = {
  key: 'supportCheck' | 'combinedCheck';
  state: 'unassessed' | 'within' | 'exceeds';
  demand: number | null;
  limit: number | null;
  ratio: number | null;
};
export type AssessmentStatus = 'incomplete' | 'outsideScope' | 'exceeds' | 'within';

export function assess(project: Project, scenario: Scenario) {
  const demand = scenarioDemand(scenario, project.floor);
  const evidence = scoreEvidence(project, scenario);
  const issues: string[] = segmentIssues(project.floor, scenario.machines);
  for (const machine of scenario.machines) {
    issues.push(...placementIssues(machine, project.floor));
    if (machine.operation !== 'static') issues.push('dynamicUnassessed');
  }
  for (let i = 0; i < scenario.machines.length; i++) {
    for (let j = i + 1; j < scenario.machines.length; j++) {
      if (polygonsOverlap(corners(scenario.machines[i]), corners(scenario.machines[j])))
        issues.push('machineOverlap');
    }
  }
  if (demand.machineForce === null) issues.push('missingWeight');
  if (demand.backgroundForce === null) issues.push('missingConcurrent');
  if (demand.machines.some((m) => !m.balanced)) issues.push('reactionsUnresolved');
  if (demand.machines.some((m) => m.isAssumed)) issues.push('equalAssumption');
  const review = scenario.review;
  const reviewCurrent =
    review.scopeConfirmed && review.signature === reviewSignature(project, scenario);
  if (review.scopeConfirmed && !reviewCurrent) issues.push('reviewStale');
  if (!review.reference.trim() || !review.scopeConfirmed) issues.push('missingReview');
  const validScope =
    !!review.reference.trim() &&
    reviewCurrent &&
    !issues.some((issue) =>
      [
        'outsideFloor',
        'overOpening',
        'machineOverlap',
        'dynamicUnassessed',
        'referenceCollision',
        'zoneOutside',
      ].includes(issue),
    );
  const supportedReactions = scenario.machines.every(
    (m, i) => m.reactionMode === 'specified' && demand.machines[i].balanced,
  );
  const contactValid =
    review.minContactArea !== null &&
    scenario.machines.every((m) =>
      m.supports.every((s) => s.area !== null && s.area >= review.minContactArea!),
    );
  if (review.minContactArea !== null && !contactValid) issues.push('contactOutsideScope');
  const makeCheck = (
    key: Check['key'],
    value: number | null,
    limit: number | null,
    valid: boolean,
  ): Check => ({
    key,
    demand: value,
    limit,
    state:
      !valid || value === null || limit === null
        ? 'unassessed'
        : value > limit
          ? 'exceeds'
          : 'within',
    ratio: valid && value !== null && limit !== null ? value / limit : null,
  });
  const checks = [
    makeCheck(
      'supportCheck',
      demand.peakReaction,
      review.supportLimit,
      validScope && supportedReactions && contactValid,
    ),
    makeCheck('combinedCheck', demand.totalForce, review.totalLimit, validScope),
  ];
  // A known applicable exceedance must remain visible even when other evidence is absent.
  const status: AssessmentStatus = checks.some((c) => c.state === 'exceeds')
    ? 'exceeds'
    : issues.some((issue) =>
          [
            'outsideFloor',
            'overOpening',
            'machineOverlap',
            'reviewStale',
            'contactOutsideScope',
            'referenceCollision',
            'zoneOutside',
          ].includes(issue),
        )
      ? 'outsideScope'
      : checks.every((c) => c.state === 'within') && evidence.count === 10
        ? 'within'
        : 'incomplete';
  return { status, issues: [...new Set(issues)], demand, evidence, checks, reviewCurrent };
}
