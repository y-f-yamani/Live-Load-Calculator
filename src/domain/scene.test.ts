import { describe, expect, it } from 'vitest';
import { createProject } from './defaults';
import {
  createLoad,
  createSegment,
  floorTiles,
  normalizedRotation,
  planToWorld,
  resizeLoad,
  segmentIssues,
  worldToPlan,
} from './scene';
import { loadKinds, projectSchema } from './schema';
import { scenarioDemand } from './calculations';
import { documentAll, documentedFixture } from '../test/fixtures';
import { physicalSignature, reviewSignature, scoreEvidence } from './evidence';
import { parseProject, serializeProject } from '../infrastructure/storage';

describe('shared scene model', () => {
  it('maps plan Y to world Z without mirroring Arabic coordinates', () => {
    expect(planToWorld(3, 7, -2)).toEqual([3, -2, 7]);
    expect(worldToPlan(3, 7)).toEqual({ x: 3, y: 7 });
  });
  it('keeps every weighted object in total demand and defaults all weights to unknown', () => {
    const p = createProject(false);
    const scenario = p.scenarios[0];
    scenario.machines = loadKinds.map((kind) => createLoad(kind, kind, p.floor));
    expect(scenarioDemand(scenario, p.floor).machineForce).toBeNull();
    scenario.machines.forEach((m) => {
      expect(m.mass).toBeNull();
      expect(m.contents).toBeNull();
      m.mass = 1000;
      m.contents = 0;
    });
    expect(scenarioDemand(scenario, p.floor).machineForce).toBeCloseTo(49.03325, 6);
  });
  it('does not infer load or capacity from structural references', () => {
    const p = createProject();
    const before = scenarioDemand(p.scenarios[0], p.floor);
    p.floor.segments.push(createSegment('beam', 'Existing', p.floor));
    expect(scenarioDemand(p.scenarios[0], p.floor)).toEqual(before);
    expect(p.floor.udlRating).toBeNull();
  });
  it('resizes support offsets proportionally while preserving reactions, area and mass', () => {
    const { machine } = documentedFixture();
    const original = structuredClone(machine);
    const next = resizeLoad(machine, { width: machine.width * 2 });
    expect(next.mass).toBe(machine.mass);
    next.supports.forEach((support, i) => {
      expect(support.x).toBe(machine.supports[i].x * 2);
      expect(support.y).toBe(machine.supports[i].y);
      expect(support.area).toBe(machine.supports[i].area);
      expect(support.reaction).toBe(machine.supports[i].reaction);
    });
    expect(machine).toEqual(original);
  });
  it('preserves exact support offsets and evidence after appearance changes', () => {
    const { project, scenario, machine } = documentedFixture();
    const signature = physicalSignature(project, scenario);
    scenario.machines[0] = resizeLoad(machine, { color: 'blue', locked: true });
    expect(scenario.machines[0].supports).toBe(machine.supports);
    expect(physicalSignature(project, scenario)).toBe(signature);
    expect(scoreEvidence(project, scenario).percent).toBe(100);
  });
  it('keeps documented scope current through serialization including floor segments', () => {
    const { project, scenario } = documentedFixture();
    project.floor.segments.push(createSegment('zone', 'منطقة', project.floor));
    documentAll(project, scenario);
    const next = parseProject(serializeProject(project));
    const s = next.scenarios[0];
    expect(s.review.signature).toBe(reviewSignature(next, s));
    expect(scoreEvidence(next, s).percent).toBe(100);
    next.floor.segments[0].color = 'rose';
    next.floor.segments[0].locked = true;
    expect(scoreEvidence(next, s).percent).toBe(100);
    next.floor.segments[0].x += 1;
    expect(s.review.signature).not.toBe(reviewSignature(next, s));
  });
  it('flags a wall intersection, ignores a reference below the slab, and flags outside zones', () => {
    const p = createProject();
    const m = p.scenarios[0].machines[0];
    const wall = { ...createSegment('wall', 'wall', p.floor), x: m.x, y: m.y };
    p.floor.segments = [wall];
    expect(segmentIssues(p.floor, [m])).toContain('referenceCollision');
    wall.elevation = -wall.height;
    expect(segmentIssues(p.floor, [m])).toEqual([]);
    p.floor.segments = [{ ...createSegment('zone', 'zone', p.floor), x: -1 }];
    expect(segmentIssues(p.floor, [m])).toContain('zoneOutside');
  });
  it('tiles only solid floor for overlapping openings and total void', () => {
    const p = createProject();
    p.floor.width = 10;
    p.floor.length = 10;
    p.floor.openings = [
      { id: 'a', x: 1, y: 1, width: 3, length: 3 },
      { id: 'b', x: 2, y: 2, width: 3, length: 3 },
    ];
    expect(floorTiles(p.floor).reduce((sum, tile) => sum + tile.width * tile.length, 0)).toBe(86);
    p.floor.openings = [{ id: 'a', x: 0, y: 0, width: 10, length: 10 }];
    expect(floorTiles(p.floor)).toEqual([]);
  });
  it('normalizes tiny and multiple-turn angles into a schema-valid rotation', () => {
    const p = createProject();
    for (const angle of [-0.0001, -0.001, 360, 720, -90, 359.9999]) {
      p.scenarios[0].machines[0].rotation = normalizedRotation(angle);
      expect(projectSchema.safeParse(p).success).toBe(true);
    }
  });
  it('rejects duplicate segment IDs, unknown kinds and impossible dimensions', () => {
    const p = createProject();
    const segment = createSegment('wall', 'Wall', p.floor);
    p.floor.segments = [segment, { ...segment }];
    expect(projectSchema.safeParse(p).success).toBe(false);
    p.floor.segments = [segment];
    segment.height = 0;
    expect(projectSchema.safeParse(p).success).toBe(false);
    expect(
      projectSchema.safeParse({
        ...p,
        floor: { ...p.floor, segments: [{ ...segment, height: 2, kind: 'invented' }] },
      }).success,
    ).toBe(false);
  });
});
