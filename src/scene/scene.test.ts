import { describe, expect, it } from 'vitest';
import { Euler, Mesh, Quaternion, Raycaster, Vector3 } from 'three';
import { createProject } from '../domain/defaults';
import { worldRotation } from '../domain/scene';
import { transform } from '../domain/geometry';
import { floorMesh, loadMesh, disposeTree } from './meshes';
import { planRotationFromQuaternion } from './transforms';

describe('Three geometry integration without WebGL', () => {
  it.each([0, 45, 90, 120, 180, 225, 270, 315, 359.999])(
    'round-trips rotation %s through quaternions',
    (degrees) => {
      const q = new Quaternion().setFromEuler(new Euler(0, worldRotation(degrees), 0));
      expect(planRotationFromQuaternion(q)).toBeCloseTo(degrees, 3);
    },
  );
  it('matches 2D support coordinates with rotated 3D coordinates', () => {
    const machine = createProject().scenarios[0].machines[0];
    machine.rotation = 135;
    const mesh = loadMesh(machine);
    mesh.updateMatrixWorld(true);
    for (const support of machine.supports) {
      const expected = transform(support, machine);
      const actual = mesh.localToWorld(new Vector3(support.x, 0, support.y));
      expect(actual.x).toBeCloseTo(expected.x, 8);
      expect(actual.z).toBeCloseTo(expected.y, 8);
    }
    disposeTree(mesh);
  });
  it('raycasts solid slab but passes through real floor openings', () => {
    const p = createProject();
    p.floor.openings = [{ id: 'hole', x: 4, y: 4, width: 2, length: 2 }];
    const floor = floorMesh(p.floor, false);
    floor.updateMatrixWorld(true);
    const hit = (x: number, y: number) =>
      new Raycaster(new Vector3(x, 10, y), new Vector3(0, -1, 0))
        .intersectObject(floor, true)
        .filter((result) => result.object instanceof Mesh);
    expect(hit(2, 2).length).toBeGreaterThan(0);
    expect(hit(5, 5)).toHaveLength(0);
    disposeTree(floor);
  });
});
