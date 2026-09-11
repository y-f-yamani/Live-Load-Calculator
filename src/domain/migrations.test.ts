import { afterEach, describe, expect, it, vi } from 'vitest';
import { documentedFixture } from '../test/fixtures';
import { migrateProject } from './migrations';
import { loadProject, saveProject } from '../infrastructure/storage';

function legacyFixture() {
  const { project } = documentedFixture();
  const legacy: Record<string, unknown> = structuredClone(project);
  legacy.schemaVersion = 1;
  const floor = legacy.floor as Record<string, unknown>;
  delete floor.segments;
  for (const scenario of legacy.scenarios as { machines: Record<string, unknown>[] }[])
    for (const m of scenario.machines) {
      delete m.kind;
      delete m.height;
      delete m.color;
      delete m.locked;
    }
  return legacy;
}
afterEach(() => vi.unstubAllGlobals());
describe('v1 project migration', () => {
  it('preserves IDs, unknowns, loads, coordinates and references while invalidating review', () => {
    const old = legacyFixture();
    const original = JSON.stringify(old);
    const next = migrateProject(old);
    expect(next.schemaVersion).toBe(2);
    expect(next.floor.segments).toEqual([]);
    const oldScenarios = old.scenarios as typeof next.scenarios;
    expect(next.scenarios[0].machines[0]).toMatchObject(oldScenarios[0].machines[0]);
    expect(next.scenarios[0].review).toMatchObject({
      ...oldScenarios[0].review,
      signature: '',
      scopeConfirmed: false,
    });
    for (const [key, evidence] of Object.entries(next.scenarios[0].evidence))
      expect(evidence).toEqual({
        ...oldScenarios[0].evidence[key as keyof (typeof oldScenarios)[0]['evidence']],
        signature: '',
      });
    expect(JSON.stringify(old)).toBe(original);
  });
  it('validates the legacy format before migrating and rejects future versions', () => {
    expect(() => migrateProject({ ...legacyFixture(), undocumented: true })).toThrow();
    expect(() => migrateProject({ ...legacyFixture(), schemaVersion: 3 })).toThrow();
  });
  it('retains the original browser save after upgrade and prefers the current format', () => {
    const original = JSON.stringify(legacyFixture());
    const records = new Map([['live-load.project.v1', original]]);
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => records.get(key) ?? null,
      setItem: (key: string, value: string) => records.set(key, value),
    });
    const result = loadProject();
    expect(result.migrated).toBe(true);
    expect(result.project).not.toBeNull();
    expect(saveProject(result.project!)).toBe(true);
    expect(records.get('live-load.project.v1')).toBe(original);
    expect(loadProject().migrated).toBeUndefined();
    records.set('live-load.project.v2', '{bad');
    expect(loadProject().error).toBe(true);
    expect(records.get('live-load.project.v1')).toBe(original);
  });
});
