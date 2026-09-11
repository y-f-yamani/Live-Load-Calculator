import { evidenceIds, type EvidenceId, type Project, type Scenario } from './schema';
import { machineDemand } from './calculations';
export const RUBRIC_VERSION = 'evidence-1.0';

/** Stable across import validation and object construction order. */
function signature(value: unknown): string {
  return JSON.stringify(value, (_key, item: unknown) => {
    if (item && typeof item === 'object' && !Array.isArray(item))
      return Object.fromEntries(
        Object.entries(item).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
      );
    return item;
  });
}

function withoutAppearance(value: object) {
  const copy: Record<string, unknown> = { ...value };
  delete copy.color;
  delete copy.locked;
  return copy;
}

function floorContext(project: Project) {
  return { ...project.floor, segments: project.floor.segments.map(withoutAppearance) };
}

export function physicalSignature(project: Project, scenario: Scenario): string {
  return signature({
    identity: [project.name, project.site, project.codeBasis],
    floor: floorContext(project),
    machines: scenario.machines.map(withoutAppearance),
    backgroundLoad: scenario.backgroundLoad,
  });
}

export function reviewSignature(project: Project, scenario: Scenario): string {
  const { reference, supportLimit, minContactArea, totalLimit } = scenario.review;
  return signature([
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
      floorContext(project),
      scenario.machines.map((m) => [
        m.id,
        m.x,
        m.y,
        m.width,
        m.length,
        m.rotation,
        m.height,
        m.supports.map((s) => [s.x, s.y]),
      ]),
    ],
    construction: floorContext(project),
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
    concurrent: [
      scenario.backgroundLoad,
      floorContext(project),
      scenario.machines.map(withoutAppearance),
    ],
    operation: scenario.machines.map((m) => [m.id, m.mass, m.contents, m.operation]),
    installation: physicalSignature(project, scenario),
  };
  return signature(values[key]);
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
