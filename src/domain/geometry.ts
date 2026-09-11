import type { Floor, Machine } from './schema';
export type Point = { x: number; y: number };
const EPS = 1e-8;

export function transform(point: Point, machine: Pick<Machine, 'x' | 'y' | 'rotation'>): Point {
  const angle = (machine.rotation * Math.PI) / 180;
  return {
    x: machine.x + point.x * Math.cos(angle) - point.y * Math.sin(angle),
    y: machine.y + point.x * Math.sin(angle) + point.y * Math.cos(angle),
  };
}

export function corners(
  machine: Pick<Machine, 'width' | 'length' | 'x' | 'y' | 'rotation'>,
): Point[] {
  return [
    { x: -machine.width / 2, y: -machine.length / 2 },
    { x: machine.width / 2, y: -machine.length / 2 },
    { x: machine.width / 2, y: machine.length / 2 },
    { x: -machine.width / 2, y: machine.length / 2 },
  ].map((p) => transform(p, machine));
}

/** Separating-axis test for convex footprints. Touching edges do not overlap. */
export function polygonsOverlap(a: Point[], b: Point[]): boolean {
  for (const polygon of [a, b]) {
    for (let i = 0; i < polygon.length; i++) {
      const next = polygon[(i + 1) % polygon.length];
      const normal = { x: -(next.y - polygon[i].y), y: next.x - polygon[i].x };
      const pa = a.map((p) => p.x * normal.x + p.y * normal.y);
      const pb = b.map((p) => p.x * normal.x + p.y * normal.y);
      if (Math.max(...pa) <= Math.min(...pb) + EPS || Math.max(...pb) <= Math.min(...pa) + EPS)
        return false;
    }
  }
  return true;
}

export function placementIssues(machine: Machine, floor: Floor): string[] {
  const points = [...corners(machine), ...machine.supports.map((s) => transform(s, machine))];
  const issues: string[] = [];
  if (
    points.some(
      (p) => p.x < -EPS || p.y < -EPS || p.x > floor.width + EPS || p.y > floor.length + EPS,
    )
  )
    issues.push('outsideFloor');
  for (const opening of floor.openings) {
    const box = [
      { x: opening.x, y: opening.y },
      { x: opening.x + opening.width, y: opening.y },
      { x: opening.x + opening.width, y: opening.y + opening.length },
      { x: opening.x, y: opening.y + opening.length },
    ];
    if (
      polygonsOverlap(corners(machine), box) ||
      machine.supports.some((s) => {
        const p = transform(s, machine);
        return (
          p.x > opening.x &&
          p.x < opening.x + opening.width &&
          p.y > opening.y &&
          p.y < opening.y + opening.length
        );
      })
    )
      issues.push('overOpening');
  }
  return [...new Set(issues)];
}
