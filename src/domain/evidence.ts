import { evidenceIds, type EvidenceId, type Project, type Scenario } from './schema';
import { machineDemand } from './calculations';
export const RUBRIC_VERSION = 'evidence-1.0';

export function physicalSignature(project: Project, scenario: Scenario): string {
  return JSON.stringify({
    identity: [project.name, project.site, project.codeBasis],
    floor: project.floor,
    machines: scenario.machines,
    backgroundLoad: scenario.backgroundLoad,
  });
}

export function reviewSignature(project: Project, scenario: Scenario): string {
  const { reference, supportLimit, minContactArea, totalLimit } = scenario.review;
  return JSON.stringify([
    physicalSignature(project, scenario),
    reference,
    supportLimit,
    minContactArea,
    totalLimit,
  ]);
}

export function evidenceSignature(key: EvidenceId, project: Project, scenario: Scenario): string {
  const values: Record<EvidenceId, unknown> = {
    identity: [project.name, project.site, project.codeBasis],
    geometry: [
      project.floor,
      scenario.machines.map((m) => [
        m.id,
        m.x,
        m.y,
        m.width,
        m.length,
        m.rotation,
        m.supports.map((s) => [s.x, s.y]),
      ]),
    ],
    construction: project.floor,
    capacity: reviewSignature(project, scenario),
    path: physicalSignature(project, scenario),
    machine: scenario.machines.map((m) => [m.id, m.mass, m.contents]),
    supports: scenario.machines.map((m) => [
      m.id,
      m.mass,
      m.contents,
      m.supportType,
      m.reactionMode,
      m.supports,
    ]),
    concurrent: [scenario.backgroundLoad, project.floor, scenario.machines],
    operation: scenario.machines.map((m) => [m.id, m.mass, m.contents, m.operation]),
    installation: physicalSignature(project, scenario),
  };
  return JSON.stringify(values[key]);
}

export function evidenceEligibility(
  key: EvidenceId,
  project: Project,
  scenario: Scenario,
): boolean {
  switch (key) {
    case 'identity':
      return !!project.site.trim() && !!project.codeBasis.trim();
    case 'construction':
      return project.floor.type !== 'unknown';
    case 'capacity':
      return (
        !!scenario.review.reference.trim() &&
        scenario.review.supportLimit !== null &&
        scenario.review.minContactArea !== null &&
        scenario.review.totalLimit !== null &&
        scenario.review.scopeConfirmed &&
        scenario.review.signature === reviewSignature(project, scenario)
      );
    case 'machine':
      return scenario.machines.every((m) => m.mass !== null && m.contents !== null);
    case 'supports':
      return scenario.machines.every(
        (m) =>
          m.reactionMode === 'specified' &&
          machineDemand(m).balanced &&
          m.supports.every((s) => s.area !== null && s.reaction !== null),
      );
    case 'concurrent':
      return scenario.backgroundLoad !== null;
    case 'operation':
      return scenario.machines.every((m) => m.operation !== 'unknown');
    default:
      return true;
  }
}

export function scoreEvidence(project: Project, scenario: Scenario) {
  const groups = evidenceIds.map((key) => {
    const evidence = scenario.evidence[key];
    const current = evidence.signature === evidenceSignature(key, project, scenario);
    const eligible = evidenceEligibility(key, project, scenario);
    const complete =
      evidence.state === 'documented' && !!evidence.source.trim() && current && eligible;
    return { key, complete, current, eligible, evidence };
  });
  const count = groups.filter((group) => group.complete).length;
  return { percent: count * 10, count, total: 10, groups, version: RUBRIC_VERSION };
}
