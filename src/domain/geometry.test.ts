import { describe, expect, it } from 'vitest';
import { createProject } from './defaults';
import { corners, placementIssues, polygonsOverlap, transform } from './geometry';

describe('floor geometry', () => {
  it('transforms supports and corners about the same machine center', () => {
    const point = transform({ x: 1, y: 0.5 }, { x: 5, y: 4, rotation: 90 });
    expect(point.x).toBeCloseTo(4.5);
    expect(point.y).toBeCloseTo(5);
  });
  it('checks rotated boundaries, not just the machine center', () => {
    const p = createProject();
    p.floor.width = 10;
    p.floor.length = 8;
    const m = p.scenarios[0].machines[0];
    m.width = 2;
    m.length = 1;
    m.x = 9.5;
    m.y = 4;
    m.supports = [];
    expect(placementIssues(m, p.floor)).toContain('outsideFloor');
    m.rotation = 90;
    expect(placementIssues(m, p.floor)).toEqual([]);
  });
  it('detects openings crossed by a footprint', () => {
    const p = createProject();
    const m = p.scenarios[0].machines[0];
    p.floor.openings = [{ id: 'o', x: m.x, y: m.y, width: 0.5, length: 0.5 }];
    expect(placementIssues(m, p.floor)).toContain('overOpening');
  });
  it('checks support locations outside the machine body', () => {
    const p = createProject();
    const m = p.scenarios[0].machines[0];
    m.supports[0].x = 100;
    expect(placementIssues(m, p.floor)).toContain('outsideFloor');
  });
  it('allows touching footprints but identifies overlap', () => {
    const a = createProject().scenarios[0].machines[0];
    a.width = 2;
    const b = structuredClone(a);
    b.x += 2;
    expect(polygonsOverlap(corners(a), corners(b))).toBe(false);
    b.x -= 0.1;
    expect(polygonsOverlap(corners(a), corners(b))).toBe(true);
  });
});
