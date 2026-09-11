import { Copy, Trash2 } from 'lucide-react';
import type { Segment } from '../domain/schema';
import type { Translator } from '../i18n/messages';
import { assetLabels } from '../i18n/sceneLabels';
import { NumberField, TextField } from './Fields';
import { SceneAppearance } from './SceneAppearance';
export function SegmentInspector({
  segment,
  onChange,
  onDelete,
  onDuplicate,
  t,
}: {
  segment: Segment;
  onChange: (patch: Partial<Segment>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  t: Translator;
}) {
  return (
    <aside className="panel inspector">
      <div className="inspector-body" key={segment.id}>
        <div className="section-eyebrow">{t('segmentProperties')}</div>
        <h3>{t(assetLabels[segment.kind])}</h3>
        <p className="field-help">
          {t(segment.kind === 'zone' ? 'zoneNote' : 'referenceNote')} {t('sharedSegments')}
        </p>
        <TextField
          label={t('segmentName')}
          value={segment.name}
          onChange={(name) => onChange({ name })}
        />
        <fieldset className="geometry-fields" disabled={segment.locked}>
          <div className="field-grid">
            {(['width', 'length'] as const).map((key) => (
              <NumberField
                key={key}
                label={t(key)}
                value={segment[key]}
                onChange={(value) => onChange({ [key]: value! })}
                required
                min={0.05}
                max={1000}
                unit="m"
                t={t}
              />
            ))}
          </div>
          <div className="field-grid">
            {(['x', 'y'] as const).map((key) => (
              <NumberField
                key={key}
                label={t(key === 'x' ? 'positionX' : 'positionY')}
                value={segment[key]}
                onChange={(value) => onChange({ [key]: value! })}
                required
                min={-1000}
                max={1000}
                unit="m"
                t={t}
              />
            ))}
          </div>
          <NumberField
            label={t('rotation')}
            value={segment.rotation}
            onChange={(rotation) => onChange({ rotation: rotation! })}
            required
            max={359.999}
            unit="°"
            t={t}
          />
          {segment.kind !== 'zone' && (
            <div className="field-grid">
              <NumberField
                label={t('height')}
                value={segment.height}
                onChange={(height) => onChange({ height: height! })}
                required
                min={0.015}
                max={100}
                unit="m"
                t={t}
              />
              <NumberField
                label={t('elevation')}
                value={segment.elevation}
                onChange={(elevation) => onChange({ elevation: elevation! })}
                required
                min={-100}
                max={100}
                unit="m"
                t={t}
              />
            </div>
          )}
        </fieldset>
        <SceneAppearance color={segment.color} locked={segment.locked} onChange={onChange} t={t} />
        <div className="section-row">
          <button className="text-button" onClick={onDuplicate}>
            <Copy size={15} />
            {t('duplicateObject')}
          </button>
          <button
            className="icon-button"
            disabled={segment.locked}
            aria-label={t('deleteObject')}
            title={t('deleteObject')}
            onClick={onDelete}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
