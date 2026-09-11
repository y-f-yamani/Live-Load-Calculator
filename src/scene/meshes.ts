import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import type { Floor, Machine, Segment } from '../domain/schema';
import { PALETTE, floorTiles, worldRotation, type Selection } from '../domain/scene';

function material(
  color: THREE.ColorRepresentation,
  extra: THREE.MeshStandardMaterialParameters = {},
) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.12, ...extra });
}
function box(
  group: THREE.Group,
  size: [number, number, number],
  position: [number, number, number],
  mat: THREE.Material,
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

/** Functional simplified equipment silhouettes; dimensions come from the shared model. */
export function loadMesh(load: Machine): THREE.Group {
  const group = new THREE.Group();
  const { width: w, length: d, height: h } = load;
  const body = material(PALETTE[load.color]);
  const dark = material('#344a55');
  const steel = material('#aab9bd', { metalness: 0.55 });
  if (load.kind === 'rack') {
    for (const x of [-1, 1])
      for (const z of [-1, 1])
        box(group, [0.06, h, 0.06], [x * (w / 2 - 0.03), h / 2, z * (d / 2 - 0.03)], body);
    for (const y of [0.08, h / 3, (h * 2) / 3, h - 0.04])
      box(group, [w, 0.07, d], [0, y, 0], steel);
  } else if (load.kind === 'pallet') {
    const plinth = Math.min(0.15, h * 0.25);
    for (const x of [-0.35, 0, 0.35])
      box(group, [w * 0.13, plinth, d], [w * x, plinth / 2, 0], dark);
    box(group, [w, plinth * 0.35, d], [0, plinth, 0], body);
    box(
      group,
      [w * 0.9, Math.max(0.01, h - plinth * 1.2), d * 0.9],
      [0, (h + plinth * 1.2) / 2, 0],
      body,
    );
    for (const x of [-0.27, 0.27])
      box(group, [w * 0.025, h - plinth, d * 0.91], [w * x, (h + plinth) / 2, 0], steel);
  } else if (load.kind === 'tank') {
    const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 40), body);
    cylinder.scale.set(w, h * 0.88, d);
    cylinder.position.y = h * 0.56;
    cylinder.castShadow = true;
    cylinder.receiveShadow = true;
    group.add(cylinder);
    for (const y of [0.2, 0.75]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.503, 0.012, 6, 48), steel);
      ring.rotation.x = Math.PI / 2;
      ring.scale.set(w, d, Math.min(w, d));
      ring.position.y = h * y;
      group.add(ring);
    }
  } else if (load.kind === 'machine') {
    box(group, [w, h * 0.12, d], [0, h * 0.1, 0], dark);
    box(group, [w * 0.94, h * 0.78, d * 0.9], [0, h * 0.56, 0], body);
    box(
      group,
      [w * 0.55, h * 0.5, 0.025],
      [-w * 0.1, h * 0.6, -d * 0.451],
      material('#173e49', { metalness: 0.5, roughness: 0.3 }),
    );
    box(group, [w * 0.15, h * 0.19, 0.055], [w * 0.33, h * 0.7, -d * 0.47], dark);
    box(
      group,
      [w * 0.08, h * 0.09, 0.065],
      [w * 0.33, h * 0.72, -d * 0.48],
      material('#91d5c6', { emissive: '#164534' }),
    );
  } else box(group, [w, h, d], [0, h / 2, 0], body);
  for (const support of load.supports) {
    // Markers are schematic, not bearing-patch representations.
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.085, 0.11, 12), dark);
    foot.position.set(support.x, 0.055, support.y);
    group.add(foot);
  }
  place(group, load, 0);
  return group;
}

export function segmentMesh(segment: Segment): THREE.Group {
  const group = new THREE.Group();
  const mat = material(
    PALETTE[segment.color],
    segment.kind === 'zone' ? { transparent: true, opacity: 0.18, depthWrite: false } : {},
  );
  if (segment.kind === 'zone') {
    box(group, [segment.width, 0.012, segment.length], [0, 0.015, 0], mat);
    const shape = new THREE.BoxGeometry(segment.width, 0.012, segment.length);
    const edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(shape),
      new THREE.LineBasicMaterial({
        color: PALETTE[segment.color],
        transparent: true,
        opacity: 0.7,
      }),
    );
    shape.dispose();
    edge.position.y = 0.022;
    group.add(edge);
  } else if (segment.kind === 'beam') {
    box(
      group,
      [segment.width, segment.height * 0.13, segment.length],
      [0, segment.height * 0.065, 0],
      mat,
    );
    box(
      group,
      [segment.width, segment.height * 0.13, segment.length],
      [0, segment.height * 0.935, 0],
      mat,
    );
    box(
      group,
      [segment.width * 0.16, segment.height, segment.length],
      [0, segment.height / 2, 0],
      mat,
    );
  } else
    box(group, [segment.width, segment.height, segment.length], [0, segment.height / 2, 0], mat);
  place(group, segment, segment.kind === 'zone' ? 0 : segment.elevation);
  return group;
}

function place(group: THREE.Group, object: Machine | Segment, elevation: number) {
  group.position.set(object.x, elevation, object.y);
  group.rotation.y = worldRotation(object.rotation);
}

export function addObjectLabel(
  group: THREE.Group,
  selection: Selection,
  name: string,
  height: number,
) {
  group.userData.selection = selection;
  const element = document.createElement('div');
  element.className = 'three-object-label';
  element.textContent = name;
  const label = new CSS2DObject(element);
  label.position.set(0, height + 0.25, 0);
  group.add(label);
  return label;
}

export function floorMesh(floor: Floor, dark: boolean): THREE.Group {
  const group = new THREE.Group();
  const tileGeometries = floorTiles(floor).map((tile) =>
    new THREE.BoxGeometry(tile.width, 0.18, tile.length).translate(
      tile.x + tile.width / 2,
      -0.09,
      tile.y + tile.length / 2,
    ),
  );
  if (tileGeometries.length) {
    const merged = mergeGeometries(tileGeometries);
    tileGeometries.forEach((geometry) => geometry.dispose());
    const mesh = new THREE.Mesh(merged, material(dark ? '#3b515b' : '#d9e2e3'));
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  const gridPoints: THREE.Vector3[] = [];
  const gridStep = Math.max(1, Math.ceil(Math.max(floor.width, floor.length) / 80));
  // Segment each grid line at opening boundaries to keep holes visibly empty.
  for (const tile of floorTiles(floor)) {
    for (let x = Math.ceil(tile.x / gridStep) * gridStep; x <= tile.x + tile.width; x += gridStep)
      gridPoints.push(
        new THREE.Vector3(x, 0.003, tile.y),
        new THREE.Vector3(x, 0.003, tile.y + tile.length),
      );
    for (let y = Math.ceil(tile.y / gridStep) * gridStep; y <= tile.y + tile.length; y += gridStep)
      gridPoints.push(
        new THREE.Vector3(tile.x, 0.003, y),
        new THREE.Vector3(tile.x + tile.width, 0.003, y),
      );
  }
  const lines = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(gridPoints),
    new THREE.LineBasicMaterial({
      color: dark ? '#607982' : '#aebfc4',
      transparent: true,
      opacity: 0.45,
    }),
  );
  group.add(lines);
  const outlinePoints = [
    new THREE.Vector3(0, 0.005, 0),
    new THREE.Vector3(floor.width, 0.005, 0),
    new THREE.Vector3(floor.width, 0.005, floor.length),
    new THREE.Vector3(0, 0.005, floor.length),
    new THREE.Vector3(0, 0.005, 0),
  ];
  group.add(
    new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(outlinePoints),
      new THREE.LineBasicMaterial({ color: dark ? '#89a7b0' : '#617e88' }),
    ),
  );
  for (const beam of floor.beams) {
    const mat = material(dark ? '#687e8a' : '#8d9da7');
    box(
      group,
      beam.axis === 'x' ? [0.13, 0.18, floor.length] : [floor.width, 0.18, 0.13],
      beam.axis === 'x'
        ? [beam.position, -0.28, floor.length / 2]
        : [floor.width / 2, -0.28, beam.position],
      mat,
    );
  }
  return group;
}

export function disposeTree(root: THREE.Object3D) {
  const materials = new Set<THREE.Material>();
  root.traverse((object) => {
    if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
      object.geometry.dispose();
      (Array.isArray(object.material) ? object.material : [object.material]).forEach((mat) =>
        materials.add(mat),
      );
    }
    if (object instanceof CSS2DObject) object.element.remove();
  });
  materials.forEach((mat) => mat.dispose());
  root.removeFromParent();
}
