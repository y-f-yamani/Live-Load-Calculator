import { createMachine, createSupports, newId } from './defaults';
import type { Floor, LoadKind, Machine, SceneColor, Segment, SegmentKind } from './schema';
import { corners, polygonsOverlap } from './geometry';

export type Selection = { type: 'load' | 'segment'; id: string };
export type SceneTransform = Pick<Machine, 'x' | 'y' | 'width' | 'length' | 'height' | 'rotation'>;
export const PALETTE: Record<SceneColor, string> = {
  teal: '#289a83',
  blue: '#528dc4',
  amber: '#c89042',
  violet: '#8c73b6',
  slate: '#728797',
  rose: '#c67983',
};

export function planToWorld(x: number, y: number, elevation = 0): [number, number, number] {
  return [x, elevation, y];
}
export function worldToPlan(x: number, z: number) {
  return { x, y: z };
}
export function worldRotation(degrees: number) {
  return (-degrees * Math.PI) / 180;
}
export function normalizedRotation(degrees: number) {
  return (Math.round((((degrees % 360) + 360) % 360) * 1000) % 360000) / 1000;
}
export function snapCoordinate(value: number, snap: boolean) {
  const step = snap ? 0.25 : 0.01;
  return Math.max(-1000, Math.min(1000, Math.round(value / step) * step));
}

export function createLoad(kind: LoadKind, name: string, floor: Floor): Machine {
  const sizes: Record<LoadKind, [number, number, number, SceneColor]> = {
    machine: [2.4, 1.8, 1.7, 'teal'],
    pallet: [1.2, 1, 0.8, 'amber'],
    rack: [2.5, 1.2, 2.7, 'blue'],
    tank: [1.6, 1.6, 2.2, 'violet'],
    block: [1.5, 1.2, 1.1, 'slate'],
  };
  const [width, length, height, color] = sizes[kind];
  const load = {
    ...createMachine(name),
    kind,
    width,
    length,
    height,
    color,
    x: floor.width / 2,
    y: floor.length / 2,
  };
  load.supports = createSupports(width, length, kind === 'pallet' || kind === 'block' ? 1 : 4);
  load.supportType = kind === 'pallet' || kind === 'block' ? 'base' : 'feet';
  // No preset implies an operating mass, a contact area or supplier reactions.
  return load;
}

export function createSegment(kind: SegmentKind, name: string, floor: Floor): Segment {
  const sizes: Record<SegmentKind, [number, number, number, number, SceneColor]> = {
    zone: [Math.min(4, floor.width), Math.min(3, floor.length), 0.015, 0, 'blue'],
    wall: [0.2, Math.min(5, floor.length), 2.5, 0, 'slate'],
    beam: [0.25, Math.min(6, floor.length), 0.35, -0.55, 'slate'],
    column: [0.35, 0.35, 3, -3, 'slate'],
  };
  const [width, length, height, elevation, color] = sizes[kind];
  return {
    id: newId(),
    name,
    kind,
    width,
    length,
    height,
    elevation,
    color,
    x: floor.width / 2,
    y: floor.length / 2,
    rotation: 0,
    locked: false,
  };
}

/** Resizing changes support offsets proportionally, never weight or contact area. */
export function resizeLoad(machine: Machine, patch: Partial<Machine>): Machine {
  const width = patch.width ?? machine.width;
  const length = patch.length ?? machine.length;
  if (width === machine.width && length === machine.length) return { ...machine, ...patch };
  return {
    ...machine,
    ...patch,
    supports:
      patch.supports ??
      machine.supports.map((support) => ({
        ...support,
        x: width === machine.width ? support.x : support.x * (width / machine.width),
        y: length === machine.length ? support.y : support.y * (length / machine.length),
      })),
  };
}

export function segmentIssues(floor: Floor, machines: Machine[]): string[] {
  const issues: string[] = [];
  for (const segment of floor.segments) {
    if (segment.kind === 'zone') {
      if (
        corners(segment).some((p) => p.x < 0 || p.y < 0 || p.x > floor.width || p.y > floor.length)
      )
        issues.push('zoneOutside');
    } else if (
      segment.elevation + segment.height > 1e-8 &&
      machines.some(
        (machine) =>
          segment.elevation < machine.height && polygonsOverlap(corners(segment), corners(machine)),
      )
    )
      issues.push('referenceCollision');
  }
  return [...new Set(issues)];
}

/** Union-aware floor tiling leaves real voids even when rectangular openings overlap. */
export function floorTiles(
  floor: Floor,
): { x: number; y: number; width: number; length: number }[] {
  const xs = [
    ...new Set([0, floor.width, ...floor.openings.flatMap((o) => [o.x, o.x + o.width])]),
  ].sort((a, b) => a - b);
  const ys = [
    ...new Set([0, floor.length, ...floor.openings.flatMap((o) => [o.y, o.y + o.length])]),
  ].sort((a, b) => a - b);
  const tiles: ReturnType<typeof floorTiles> = [];
  for (let j = 0; j < ys.length - 1; j++) {
    let start: number | null = null;
    for (let i = 0; i < xs.length - 1; i++) {
      const x = (xs[i] + xs[i + 1]) / 2;
      const y = (ys[j] + ys[j + 1]) / 2;
      const solid = !floor.openings.some(
        (o) => x > o.x && x < o.x + o.width && y > o.y && y < o.y + o.length,
      );
      if (solid && start === null) start = xs[i];
      if (start !== null && (!solid || i === xs.length - 2)) {
        const end = solid ? xs[i + 1] : xs[i];
        tiles.push({ x: start, y: ys[j], width: end - start, length: ys[j + 1] - ys[j] });
        start = null;
      }
    }
  }
  return tiles;
}
