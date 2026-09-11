import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Move,
  RotateCw,
  Scaling,
  Orbit,
  Focus,
  Maximize2,
  Copy,
  Trash2,
  X,
} from 'lucide-react';
import { z } from 'zod';
import { loadKinds, segmentKinds } from '../domain/schema';
import {
  SceneEngine,
  type SceneModel,
  type AssetPreset,
  type EditorTool,
} from '../scene/SceneEngine';
import { translate } from '../i18n/messages';
import { assetLabels } from '../i18n/sceneLabels';

const assetSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('load'), kind: z.enum(loadKinds) }).strict(),
  z.object({ type: z.literal('segment'), kind: z.enum(segmentKinds) }).strict(),
]);
type Props = {
  model: SceneModel;
  onTool: (tool: EditorTool) => void;
  onLabels: (show: boolean) => void;
  onSnap: (snap: boolean) => void;
  onUse2d: () => void;
  onDropAsset: (asset: AssetPreset, x: number, y: number) => void;
  onAddAtCenter: () => void;
};
export default function ThreeScene({
  model,
  onTool,
  onLabels,
  onSnap,
  onUse2d,
  onDropAsset,
  onAddAtCenter,
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLElement>(null);
  const engine = useRef<SceneEngine | null>(null);
  const latest = useRef(model);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const t = translate(model.locale);
  useEffect(() => {
    latest.current = model;
    engine.current?.update(model);
  }, [model]);
  useEffect(() => {
    if (!host.current) return;
    let instance: SceneEngine | undefined;
    try {
      instance = new SceneEngine(host.current, latest.current, () => setFailed(true));
      engine.current = instance;
    } catch {
      setFailed(true);
    }
    return () => {
      instance?.dispose();
      engine.current = null;
    };
  }, [attempt]);
  useEffect(() => {
    if (failed) {
      engine.current?.dispose();
      engine.current = null;
    }
  }, [failed]);
  return (
    <section className="plan-card three-card" ref={card}>
      <div className="plan-toolbar">
        <div className="plan-title">
          <Box size={18} />
          <strong>{t('threeTitle')}</strong>
          <span className="tiny-tag" dir="ltr">
            3D · m
          </span>
        </div>
        <div className="scene-actions">
          <label className="inline-check">
            <input
              type="checkbox"
              checked={model.labels}
              onChange={(e) => onLabels(e.target.checked)}
            />
            {t('showLabels')}
          </label>
          <button
            className="icon-button"
            title={t('fullscreen')}
            aria-label={t('fullscreen')}
            onClick={() => {
              if (document.fullscreenElement) void document.exitFullscreen();
              else void card.current?.requestFullscreen?.().catch(() => {});
            }}
          >
            <Maximize2 size={17} />
          </button>
        </div>
      </div>
      <div className="three-tools">
        <div className="segmented">
          {(
            [
              { id: 'move', icon: Move, label: 'moveTool' },
              { id: 'rotate', icon: RotateCw, label: 'rotateTool' },
              { id: 'resize', icon: Scaling, label: 'resizeTool' },
              { id: 'orbit', icon: Orbit, label: 'orbitTool' },
            ] as const
          ).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              className={model.tool === id ? 'selected' : ''}
              aria-pressed={model.tool === id}
              onClick={() => onTool(id)}
            >
              <Icon size={15} />
              {t(label)}
            </button>
          ))}
        </div>
        <div className="scene-actions">
          <button
            className="icon-button"
            title={t('focusSelected')}
            aria-label={t('focusSelected')}
            onClick={() => engine.current?.preset('focus')}
          >
            <Focus size={17} />
          </button>
          <button
            className="icon-button"
            title={t('duplicateObject')}
            aria-label={t('duplicateObject')}
            onClick={model.onDuplicate}
          >
            <Copy size={17} />
          </button>
          <button
            className="icon-button"
            title={t('deleteObject')}
            aria-label={t('deleteObject')}
            onClick={model.onDelete}
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>
      <div className="three-stage">
        <div
          className="three-viewport"
          ref={host}
          role="group"
          aria-label={t('threeHint')}
          onDragOver={(event) => {
            if (event.dataTransfer.types.includes('application/x-live-load-asset')) {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'copy';
            }
          }}
          onDrop={(event) => {
            const raw = event.dataTransfer.getData('application/x-live-load-asset');
            if (!raw || raw.length > 1000) return;
            event.preventDefault();
            try {
              const asset = assetSchema.parse(JSON.parse(raw));
              const point = engine.current?.pointAt(event.clientX, event.clientY);
              if (point) onDropAsset(asset, point.x, point.z);
            } catch {
              /* Ignore unrelated or malformed drag payloads. */
            }
          }}
        />
        {failed && (
          <div className="three-fallback" role="status">
            <Box size={38} />
            <p>{t('webglUnavailable')}</p>
            <div className="scene-actions">
              <button className="button primary" onClick={onUse2d}>
                {t('use2d')}
              </button>
              <button
                className="button ghost"
                onClick={() => {
                  setFailed(false);
                  setAttempt((value) => value + 1);
                }}
              >
                {t('retry3d')}
              </button>
            </div>
          </div>
        )}
        {model.placing && (
          <div className="placement-ribbon" role="status">
            <span>
              {t('placing')}: <strong>{t(assetLabels[model.placing.kind])}</strong>
            </span>
            <button className="text-button" onClick={onAddAtCenter}>
              {t('addAtCenter')}
            </button>
            <button
              className="icon-button"
              aria-label={t('cancel')}
              onClick={model.onCancelPlacement}
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
      <div className="plan-footer">
        <div className="camera-presets">
          {(
            [
              { id: 'perspective', label: 'perspective' },
              { id: 'top', label: 'topView' },
              { id: 'front', label: 'frontView' },
            ] as const
          ).map(({ id, label }) => (
            <button key={id} onClick={() => engine.current?.preset(id)}>
              {t(label)}
            </button>
          ))}
        </div>
        <label className="inline-check">
          <input type="checkbox" checked={model.snap} onChange={(e) => onSnap(e.target.checked)} />
          {t('snap')}
        </label>
      </div>
      <div className="plan-note">
        {t(model.tool === 'rotate' || model.tool === 'resize' ? 'transformHint' : 'threeHint')}
        <span>{t('threeScope')}</span>
      </div>
    </section>
  );
}
