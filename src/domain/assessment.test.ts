import { describe, expect, it } from 'vitest';
import { assess } from './assessment';
import { createProject } from './defaults';
import { documentedFixture, documentAll } from '../test/fixtures';

describe('documented comparisons', () => {
  it('keeps the example incomplete, with assumed reactions and no invented capacity', () => {
    const p = createProject();
    const result = assess(p, p.scenarios[0]);
    expect(result.status).toBe('incomplete');
    expect(result.evidence.percent).toBe(0);
    expect(result.issues).toContain('equalAssumption');
    expect(result.checks.every((c) => c.state === 'unassessed')).toBe(true);
  });
  it('allows only scope-limited comparisons from a fully documented fixture', () => {
    const { project, scenario } = documentedFixture();
    expect(assess(project, scenario).status).toBe('within');
    expect(assess(project, scenario).checks[0].ratio).toBeCloseTo(0.980665);
  });
  it('retains a known exceedance when other evidence is missing', () => {
    const { project, scenario } = documentedFixture();
    scenario.review.supportLimit = 4;
    documentAll(project, scenario);
    scenario.evidence.path.state = 'unknown';
    expect(assess(project, scenario).status).toBe('exceeds');
    expect(assess(project, scenario).evidence.percent).toBe(90);
  });
  it('100% evidence does not override a failed structural comparison', () => {
    const { project, scenario } = documentedFixture();
    scenario.review.totalLimit = 10;
    documentAll(project, scenario);
    const r = assess(project, scenario);
    expect(r.evidence.percent).toBe(100);
    expect(r.status).toBe('exceeds');
  });
  it.each(['x', 'mass', 'rotation'] as const)(
    'invalidates recorded limits after %s changes',
    (key) => {
      const { project, scenario, machine } = documentedFixture();
      machine[key] = machine[key]! + 1;
      const r = assess(project, scenario);
      expect(r.status).toBe('outsideScope');
      expect(r.issues).toContain('reviewStale');
      expect(r.checks.every((c) => c.state === 'unassessed')).toBe(true);
    },
  );
  it.each(['site', 'codeBasis', 'name'] as const)(
    'invalidates limits when assessment identity %s changes',
    (key) => {
      const { project, scenario } = documentedFixture();
      project[key] += ' changed';
      expect(assess(project, scenario).reviewCurrent).toBe(false);
    },
  );
  it('a UDL sign alone cannot establish support capacity', () => {
    const p = createProject();
    p.floor.udlRating = 1000;
    expect(assess(p, p.scenarios[0]).checks[0].state).toBe('unassessed');
  });
  it('keeps dynamics unassessed even with all input evidence documented', () => {
    const { project, scenario, machine } = documentedFixture();
    machine.operation = 'rotating';
    documentAll(project, scenario);
    const r = assess(project, scenario);
    expect(r.evidence.percent).toBe(100);
    expect(r.status).toBe('incomplete');
    expect(r.issues).toContain('dynamicUnassessed');
    expect(r.checks.every((c) => c.state === 'unassessed')).toBe(true);
  });
  it('rejects an undersized contact area for the supplied support limit', () => {
    const { project, scenario, machine } = documentedFixture();
    machine.supports[0].area = 0.005;
    documentAll(project, scenario);
    const r = assess(project, scenario);
    expect(r.status).toBe('outsideScope');
    expect(r.checks[0].state).toBe('unassessed');
  });
  it('does not compare assumed equal reactions against supplier support limits', () => {
    const { project, scenario, machine } = documentedFixture();
    machine.reactionMode = 'equal';
    documentAll(project, scenario);
    expect(assess(project, scenario).checks[0].state).toBe('unassessed');
  });
  it('does not compare overlapping machines', () => {
    const { project, scenario, machine } = documentedFixture();
    const copy = structuredClone(machine);
    copy.id = 'another';
    scenario.machines.push(copy);
    documentAll(project, scenario);
    const r = assess(project, scenario);
    expect(r.issues).toContain('machineOverlap');
    expect(r.checks.every((c) => c.state === 'unassessed')).toBe(true);
  });
});
