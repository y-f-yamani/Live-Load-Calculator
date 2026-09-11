import { describe, expect, it } from 'vitest';
import { evidenceIds } from './schema';
import { scoreEvidence } from './evidence';
import { documentedFixture, documentAll } from '../test/fixtures';

describe('evidence completeness', () => {
  it('reports exact 0/70/100 percentages from ten fixed groups', () => {
    const { project, scenario } = documentedFixture();
    expect(scoreEvidence(project, scenario).percent).toBe(100);
    for (const key of evidenceIds.slice(0, 3)) scenario.evidence[key].state = 'unknown';
    expect(scoreEvidence(project, scenario).percent).toBe(70);
    for (const key of evidenceIds) scenario.evidence[key].state = 'unknown';
    expect(scoreEvidence(project, scenario).percent).toBe(0);
  });
  it.each(['estimated', 'conflicting'] as const)(
    '%s data earns no documentation points',
    (state) => {
      const { project, scenario } = documentedFixture();
      scenario.evidence.supports.state = state;
      expect(scoreEvidence(project, scenario).percent).toBe(90);
    },
  );
  it('requires a reference and current scope rather than a checkbox alone', () => {
    const { project, scenario } = documentedFixture();
    scenario.evidence.path.source = '   ';
    scenario.evidence.geometry.signature = '';
    expect(scoreEvidence(project, scenario).percent).toBe(80);
  });
  it('does not award points for assumed reactions even with an evidence source', () => {
    const { project, scenario, machine } = documentedFixture();
    machine.reactionMode = 'equal';
    documentAll(project, scenario);
    expect(
      scoreEvidence(project, scenario).groups.find((g) => g.key === 'supports')!.complete,
    ).toBe(false);
  });
  it('changing relevant mass makes previous supporting evidence stale', () => {
    const { project, scenario, machine } = documentedFixture();
    machine.contents = 100;
    expect(scoreEvidence(project, scenario).groups.find((g) => g.key === 'machine')!.current).toBe(
      false,
    );
  });
});
