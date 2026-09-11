import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createProject } from '../domain/defaults';
import { loadProject, parseProject, saveProject, serializeProject } from './storage';

describe('project boundary and persistence', () => {
  let records: Map<string, string>;
  beforeEach(() => {
    records = new Map();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => records.get(key) ?? null,
      setItem: (key: string, value: string) => records.set(key, value),
    });
  });
  afterEach(() => vi.unstubAllGlobals());
  it('round-trips the complete project without losing unknowns', () => {
    const p = createProject(false);
    expect(parseProject(serializeProject(p))).toEqual(p);
  });
  it('rejects unknown schema versions, duplicate IDs, extra computed results and invalid active IDs', () => {
    const p = createProject();
    expect(() => parseProject(JSON.stringify({ ...p, schemaVersion: 2 }))).toThrow();
    expect(() =>
      parseProject(JSON.stringify({ ...p, scenarios: [p.scenarios[0], p.scenarios[0]] })),
    ).toThrow();
    expect(() => parseProject(JSON.stringify({ ...p, score: 100 }))).toThrow();
    expect(() => parseProject(JSON.stringify({ ...p, activeScenarioId: 'missing' }))).toThrow();
  });
  it('rejects negative weight, impossible areas and non-finite imported values', () => {
    const p = createProject();
    p.scenarios[0].machines[0].mass = -1;
    expect(() => parseProject(JSON.stringify(p))).toThrow();
    p.scenarios[0].machines[0].mass = 2000;
    p.scenarios[0].machines[0].supports[0].area = 0;
    expect(() => parseProject(JSON.stringify(p))).toThrow();
    expect(() =>
      parseProject(serializeProject(createProject()).replace('2000', '1e309')),
    ).toThrow();
  });
  it('rejects out-of-bound openings and duplicate support IDs', () => {
    const p = createProject();
    p.floor.openings = [{ id: 'a', x: 17, y: 0, width: 2, length: 1 }];
    expect(() => serializeProject(p)).toThrow();
    p.floor.openings = [];
    p.scenarios[0].machines[0].supports[1].id = p.scenarios[0].machines[0].supports[0].id;
    expect(() => serializeProject(p)).toThrow();
  });
  it('uses the same size ceiling for exports and imports', () => {
    expect(() => parseProject(' '.repeat(2_000_001))).toThrow('2 MB');
    const p = createProject();
    for (const e of Object.values(p.scenarios[0].evidence)) e.signature = 'x'.repeat(199999);
    p.scenarios[0].review.signature = 'x'.repeat(199999);
    expect(() => serializeProject(p)).toThrow('2 MB');
  });
  it('saves and loads valid data', () => {
    const p = createProject();
    expect(saveProject(p)).toBe(true);
    expect(loadProject().project).toEqual(p);
  });
  it('preserves malformed saved data when loading fails', () => {
    records.set('live-load.project.v1', '{bad');
    expect(loadProject()).toEqual({ project: null, error: true });
    expect(records.get('live-load.project.v1')).toBe('{bad');
  });
  it('surfaces storage errors without throwing', () => {
    vi.stubGlobal('localStorage', {
      getItem() {
        throw new Error('blocked');
      },
      setItem() {
        throw new Error('quota');
      },
    });
    expect(loadProject().error).toBe(true);
    expect(saveProject(createProject())).toBe(false);
  });
});
