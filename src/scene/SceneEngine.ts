import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import type { Floor, Machine, LoadKind, SegmentKind } from '../domain/schema';
import {
  createLoad,
  createSegment,
  normalizedRotation,
  snapCoordinate,
  type SceneTransform,
  type Selection,
} from '../domain/scene';
import { addObjectLabel, disposeTree, floorMesh, loadMesh, segmentMesh } from './meshes';
import { machineDemand } from '../domain/calculations';
import { formatNumber } from '../domain/numbers';
import { translate, type Locale } from '../i18n/messages';
import { planRotationFromQuaternion } from './transforms';

export type EditorTool = 'move' | 'rotate' | 'resize' | 'orbit';
export type AssetPreset = { type: 'load'; kind: LoadKind } | { type: 'segment'; kind: SegmentKind };
export type SceneModel = {
  floor: Floor;
  machines: Machine[];
  selection: Selection;
  tool: EditorTool;
  snap: boolean;
  labels: boolean;
  locale: Locale;
  placing: AssetPreset | null;
  onSelect: (selection: Selection) => void;
  onTransform: (selection: Selection, patch: Partial<SceneTransform>) => void;
  onPlace: (x: number, y: number) => void;
  onCancelPlacement: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
};

type Drag = {
  node: THREE.Group;
  selection: Selection;
  dx: number;
  dz: number;
  start: THREE.Vector3;
  pointerId: number;
};

/** Imperative WebGL boundary. React owns persisted data; gestures commit once on release. */
export class SceneEngine {
  private renderer: THREE.WebGLRenderer;
  private labels = new CSS2DRenderer();
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(42, 1, 0.05, 10000);
  private orbit: OrbitControls;
  private transform: TransformControls;
  private observer: ResizeObserver;
  private appearanceObserver: MutationObserver;
  private frame: number | null = null;
  private model: SceneModel;
  private objects: THREE.Group[] = [];
  private floor: THREE.Group | null = null;
  private ghost: THREE.Group | null = null;
  private outline = new THREE.Box3Helper(new THREE.Box3(), '#218d73');
  private ray = new THREE.Raycaster();
  private drag: Drag | null = null;
  private transforming = false;
  private cancelledTransform = false;
  private transformPointerId: number | null = null;
  private signature = '';
  private disposed = false;
  private listeners = new AbortController();
  private selectedNode: THREE.Group | null = null;

  constructor(
    private host: HTMLElement,
    model: SceneModel,
    onError: () => void,
  ) {
    this.model = model;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.renderer.domElement.tabIndex = 0;
    this.renderer.domElement.setAttribute('aria-label', '3D editor');
    this.host.append(this.renderer.domElement, this.labels.domElement);
    this.labels.domElement.className = 'three-label-layer';
    this.labels.domElement.style.pointerEvents = 'none';
    this.orbit = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbit.enableDamping = true;
    this.orbit.dampingFactor = 0.12;
    this.orbit.maxPolarAngle = Math.PI * 0.88;
    this.orbit.minDistance = 0.5;
    this.orbit.maxDistance = 4000;
    this.orbit.addEventListener('change', this.requestRender);
    this.transform = new TransformControls(this.camera, this.renderer.domElement);
    this.transform.setSize(0.8);
    this.scene.add(this.transform.getHelper());
    this.transform.addEventListener('change', this.requestRender);
    this.transform.addEventListener('mouseDown', () => {
      this.transforming = true;
      this.cancelledTransform = false;
      this.orbit.enabled = false;
    });
    this.transform.addEventListener('objectChange', () => {
      this.updateOutline();
      this.requestRender();
    });
    this.transform.addEventListener('mouseUp', () => {
      const node = this.selectedNode;
      this.transforming = false;
      this.orbit.enabled = true;
      if (this.cancelledTransform || !node) {
        this.signature = '';
        this.update(this.model);
        return;
      }
      const selection = node.userData.selection as Selection;
      const source = this.findModel(selection);
      if (!source) return;
      this.model.onTransform(
        selection,
        this.model.tool === 'rotate'
          ? { rotation: planRotationFromQuaternion(node.quaternion) }
          : {
              width: Math.max(0.05, Math.min(1000, source.width * node.scale.x)),
              length: Math.max(0.05, Math.min(1000, source.length * node.scale.z)),
              height: Math.max(0.015, Math.min(100, source.height * node.scale.y)),
            },
      );
      // Even a no-op gesture must reset transient scale/rotation to the stored model.
      this.signature = '';
      this.update(this.model);
    });
    this.scene.add(new THREE.HemisphereLight('#ecf8ff', '#67776f', 2.4));
    const sun = new THREE.DirectionalLight('#fff3df', 3.1);
    sun.position.set(model.floor.width * 0.25, 22, -model.floor.length * 0.3);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.0005;
    const span = Math.max(model.floor.width, model.floor.length) * 1.2;
    Object.assign(sun.shadow.camera, {
      left: -span,
      right: span,
      top: span,
      bottom: -span,
      far: 3000,
    });
    sun.target.position.set(model.floor.width / 2, 0, model.floor.length / 2);
    this.scene.add(sun, sun.target);
    const fill = new THREE.DirectionalLight('#c5e0f7', 1.2);
    fill.position.set(-10, 10, 20);
    this.scene.add(fill);
    this.outline.visible = false;
    this.scene.add(this.outline);
    const canvas = this.renderer.domElement;
    const options = { capture: true, signal: this.listeners.signal };
    canvas.addEventListener('pointerdown', this.pointerDown, options);
    canvas.addEventListener('pointermove', this.pointerMove, options);
    canvas.addEventListener('pointerup', this.pointerUp, options);
    canvas.addEventListener('pointercancel', this.pointerCancel, options);
    canvas.addEventListener('lostpointercapture', this.lostCapture, options);
    canvas.addEventListener('keydown', this.keyDown, options);
    canvas.addEventListener(
      'webglcontextlost',
      (event) => {
        event.preventDefault();
        if (!this.disposed) onError();
      },
      { signal: this.listeners.signal },
    );
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(host);
    this.appearanceObserver = new MutationObserver(() => {
      this.signature = '';
      this.update(this.model);
    });
    this.appearanceObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    this.resize();
    this.update(model);
    this.preset('perspective');
  }

  private findModel(selection: Selection) {
    return selection.type === 'load'
      ? this.model.machines.find((m) => m.id === selection.id)
      : this.model.floor.segments.find((s) => s.id === selection.id);
  }

  update(model: SceneModel) {
    this.model = model;
    this.renderer.domElement.setAttribute('aria-label', translate(model.locale)('threeHint'));
    if (this.disposed || this.drag || this.transforming) return;
    const dark = document.documentElement.dataset.theme === 'dark';
    const signature = JSON.stringify([model.floor, model.machines, model.locale, dark]);
    this.scene.background = new THREE.Color(dark ? '#172730' : '#eaf0f2');
    if (signature !== this.signature) {
      this.signature = signature;
      this.transform.detach();
      this.selectedNode = null;
      this.objects.forEach(disposeTree);
      this.objects = [];
      if (this.floor) disposeTree(this.floor);
      this.floor = floorMesh(model.floor, dark);
      this.scene.add(this.floor);
      model.machines.forEach((load, index) => {
        const node = loadMesh(load);
        addObjectLabel(
          node,
          { type: 'load', id: load.id },
          `M${String(index + 1).padStart(2, '0')} · ${load.name} · ${formatNumber(machineDemand(load).force, model.locale)} kN`,
          load.height,
        );
        this.objects.push(node);
        this.scene.add(node);
      });
      model.floor.segments.forEach((segment) => {
        const node = segmentMesh(segment);
        addObjectLabel(
          node,
          { type: 'segment', id: segment.id },
          segment.name,
          segment.kind === 'zone' ? 0.01 : segment.height,
        );
        this.objects.push(node);
        this.scene.add(node);
      });
    }
    this.objects.forEach((node) =>
      node.traverse((child) => {
        if ('element' in child && child.element instanceof HTMLElement)
          child.visible = model.labels;
      }),
    );
    this.selectedNode =
      this.objects.find((node) => {
        const s = node.userData.selection as Selection;
        return s.type === model.selection.type && s.id === model.selection.id;
      }) ?? null;
    const selected = this.findModel(model.selection);
    if (
      this.selectedNode &&
      selected &&
      !selected.locked &&
      (model.tool === 'resize' || model.tool === 'rotate') &&
      !model.placing
    ) {
      this.transform.attach(this.selectedNode);
      this.transform.setMode(model.tool === 'resize' ? 'scale' : 'rotate');
      this.transform.setSpace('local');
      this.transform.showX = model.tool === 'resize';
      this.transform.showY = true;
      this.transform.showZ = model.tool === 'resize';
      this.transform.showE = false;
      this.transform.showXYZE = false;
      this.transform.setRotationSnap(model.snap ? Math.PI / 12 : null);
      this.transform.setScaleSnap(model.snap ? 0.1 : null);
    } else this.transform.detach();
    this.updateOutline();
    if (this.ghost) {
      disposeTree(this.ghost);
      this.ghost = null;
    }
    if (model.placing) {
      this.ghost =
        model.placing.type === 'load'
          ? loadMesh(createLoad(model.placing.kind, '', model.floor))
          : segmentMesh(createSegment(model.placing.kind, '', model.floor));
      this.ghost.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.castShadow = false;
          const mats = Array.isArray(object.material) ? object.material : [object.material];
          mats.forEach((mat) => {
            mat.transparent = true;
            mat.opacity = 0.3;
            mat.depthWrite = false;
          });
        }
      });
      this.scene.add(this.ghost);
    }
    this.renderer.domElement.style.cursor = model.placing
      ? 'crosshair'
      : model.tool === 'move'
        ? 'grab'
        : 'default';
    this.requestRender();
  }

  pointAt(clientX: number, clientY: number) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.ray.setFromCamera(
      new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      ),
      this.camera,
    );
    return this.ray.ray.intersectPlane(
      new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
      new THREE.Vector3(),
    );
  }

  private pointerDown = (event: PointerEvent) => {
    if (this.drag || this.transforming) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    if (event.button !== 0 || this.disposed) return;
    if (this.model.tool === 'rotate' || this.model.tool === 'resize')
      this.transformPointerId = event.pointerId;
    const point = this.pointAt(event.clientX, event.clientY);
    if (!point) return;
    if (this.model.placing) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.model.onPlace(
        snapCoordinate(point.x, this.model.snap),
        snapCoordinate(point.z, this.model.snap),
      );
      return;
    }
    if (this.transform.axis && (this.model.tool === 'rotate' || this.model.tool === 'resize')) {
      this.transformPointerId = event.pointerId;
      return;
    }
    const hits = this.ray.intersectObjects(this.objects, true);
    const obstruction = this.floor
      ? this.ray.intersectObject(this.floor, true).find((hit) => hit.object instanceof THREE.Mesh)
      : undefined;
    if (hits[0] && obstruction && hits[0].distance > obstruction.distance + 0.01) return;
    let node: THREE.Object3D | null = hits[0]?.object ?? null;
    while (node && !node.userData.selection) node = node.parent;
    if (!node) return;
    const selection = node.userData.selection as Selection;
    this.model.onSelect(selection);
    const source = this.findModel(selection);
    if (this.model.tool !== 'move' || !source || source.locked) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    this.renderer.domElement.focus();
    this.selectedNode = node as THREE.Group;
    this.drag = {
      node: node as THREE.Group,
      selection,
      dx: point.x - node.position.x,
      dz: point.z - node.position.z,
      start: node.position.clone(),
      pointerId: event.pointerId,
    };
    this.orbit.enabled = false;
    this.renderer.domElement.setPointerCapture(event.pointerId);
    this.renderer.domElement.style.cursor = 'grabbing';
    this.updateOutline();
  };

  private pointerMove = (event: PointerEvent) => {
    if (!this.drag && !this.ghost) return;
    const point = this.pointAt(event.clientX, event.clientY);
    if (!point) return;
    if (this.ghost) {
      this.ghost.position.x = snapCoordinate(point.x, this.model.snap);
      this.ghost.position.z = snapCoordinate(point.z, this.model.snap);
      this.requestRender();
    }
    if (!this.drag || event.pointerId !== this.drag.pointerId) return;
    event.stopImmediatePropagation();
    this.drag.node.position.x = snapCoordinate(point.x - this.drag.dx, this.model.snap);
    this.drag.node.position.z = snapCoordinate(point.z - this.drag.dz, this.model.snap);
    this.updateOutline();
    this.requestRender();
  };

  private releaseDrag(cancel: boolean) {
    const drag = this.drag;
    if (!drag) return;
    this.drag = null;
    this.orbit.enabled = true;
    if (this.renderer.domElement.hasPointerCapture(drag.pointerId))
      this.renderer.domElement.releasePointerCapture(drag.pointerId);
    if (cancel) drag.node.position.copy(drag.start);
    else
      this.model.onTransform(drag.selection, { x: drag.node.position.x, y: drag.node.position.z });
    this.renderer.domElement.style.cursor = 'grab';
    this.signature = '';
    this.update(this.model);
  }
  private pointerUp = (event: PointerEvent) => {
    if (this.drag?.pointerId === event.pointerId) {
      event.stopImmediatePropagation();
      this.releaseDrag(false);
    }
  };
  private pointerCancel = () => {
    this.releaseDrag(true);
    if (this.transforming) {
      this.cancelledTransform = true;
      this.transform.reset();
      // Disconnect clears the control's active move listener even after pointercancel.
      this.transform.disconnect();
      if (
        this.transformPointerId !== null &&
        this.renderer.domElement.hasPointerCapture(this.transformPointerId)
      )
        this.renderer.domElement.releasePointerCapture(this.transformPointerId);
      this.transform.pointerUp(null);
      this.transform.connect(this.renderer.domElement);
      this.transformPointerId = null;
    }
  };
  private lostCapture = () => {
    if (this.drag) this.releaseDrag(true);
  };

  private keyDown = (event: KeyboardEvent) => {
    const selected = this.findModel(this.model.selection);
    if (event.key === 'Escape') {
      this.model.onCancelPlacement();
      this.pointerCancel();
      return;
    }
    if (!selected || selected.locked) return;
    const delta: Record<string, [number, number]> = {
      ArrowLeft: [-0.25, 0],
      ArrowRight: [0.25, 0],
      ArrowUp: [0, -0.25],
      ArrowDown: [0, 0.25],
    };
    if (delta[event.key]) {
      event.preventDefault();
      this.model.onTransform(this.model.selection, {
        x: snapCoordinate(selected.x + delta[event.key][0], true),
        y: snapCoordinate(selected.y + delta[event.key][1], true),
      });
    }
    if (event.key.toLowerCase() === 'r') {
      event.preventDefault();
      this.model.onTransform(this.model.selection, {
        rotation: normalizedRotation(selected.rotation + 15),
      });
    }
    if (event.key === 'Delete') {
      event.preventDefault();
      this.model.onDelete();
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
      event.preventDefault();
      this.model.onDuplicate();
    }
  };

  private updateOutline() {
    this.outline.visible = !!this.selectedNode && !this.model.placing;
    if (this.selectedNode) {
      this.selectedNode.updateMatrixWorld(true);
      this.outline.box.setFromObject(this.selectedNode);
    }
  }

  preset(view: 'perspective' | 'top' | 'front' | 'focus') {
    const span = Math.max(this.model.floor.width, this.model.floor.length);
    const target = new THREE.Vector3(this.model.floor.width / 2, 0, this.model.floor.length / 2);
    if (view === 'focus' && this.selectedNode) {
      const bounds = new THREE.Box3().setFromObject(this.selectedNode);
      bounds.getCenter(target);
      const size = Math.max(...bounds.getSize(new THREE.Vector3()).toArray(), 2);
      this.camera.position.copy(target).add(new THREE.Vector3(size * 1.5, size * 1.4, size * 1.5));
    } else if (view === 'top')
      this.camera.position.copy(target).add(new THREE.Vector3(0, span * 1.65, 0.001));
    else if (view === 'front')
      this.camera.position.copy(target).add(new THREE.Vector3(0, span * 0.14, -span * 1.6));
    else
      this.camera.position
        .copy(target)
        .add(new THREE.Vector3(span * 0.78, span * 0.85, span * 0.92));
    this.orbit.target.copy(target);
    this.orbit.update();
    this.requestRender();
  }

  private resize() {
    if (this.disposed) return;
    const { width, height } = this.host.getBoundingClientRect();
    this.renderer.setSize(Math.max(width, 1), Math.max(height, 1));
    this.labels.setSize(Math.max(width, 1), Math.max(height, 1));
    this.camera.aspect = Math.max(width, 1) / Math.max(height, 1);
    this.camera.updateProjectionMatrix();
    this.requestRender();
  }
  private requestRender = () => {
    if (this.frame !== null || this.disposed) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = null;
      if (this.disposed) return;
      this.orbit.update();
      this.renderer.render(this.scene, this.camera);
      this.labels.render(this.scene, this.camera);
    });
  };
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.listeners.abort();
    this.observer.disconnect();
    this.appearanceObserver.disconnect();
    this.orbit.dispose();
    this.transform.dispose();
    this.objects.forEach(disposeTree);
    if (this.floor) disposeTree(this.floor);
    if (this.ghost) disposeTree(this.ghost);
    this.outline.geometry.dispose();
    (this.outline.material as THREE.Material).dispose();
    this.scene.traverse((object) => {
      if (object instanceof THREE.DirectionalLight) object.shadow.dispose();
    });
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
    this.labels.domElement.remove();
  }
}
