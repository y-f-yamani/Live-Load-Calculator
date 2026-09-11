import { useState } from 'react';
import {
  Box,
  Factory,
  Layers3,
  Warehouse,
  Cylinder,
  SquareDashed,
  PanelTop,
  Columns3,
  StretchHorizontal,
} from 'lucide-react';
import { loadKinds, segmentKinds } from '../domain/schema';
import { assetLabels } from '../i18n/sceneLabels';
import type { Translator } from '../i18n/messages';
import type { AssetPreset } from '../scene/SceneEngine';

const icons = {
  machine: Factory,
  pallet: Layers3,
  rack: Warehouse,
  tank: Cylinder,
  block: Box,
  zone: SquareDashed,
  wall: PanelTop,
  beam: StretchHorizontal,
  column: Columns3,
};
export function ObjectLibrary({
  placing,
  onChoose,
  t,
}: {
  placing: AssetPreset | null;
  onChoose: (asset: AssetPreset) => void;
  t: Translator;
}) {
  const [tab, setTab] = useState<'load' | 'segment'>('load');
  return (
    <section className="panel object-library">
      <h3>{t('objectLibrary')}</h3>
      <div className="segmented">
        <button
          className={tab === 'load' ? 'selected' : ''}
          aria-pressed={tab === 'load'}
          onClick={() => setTab('load')}
        >
          {t('loadsTab')}
        </button>
        <button
          className={tab === 'segment' ? 'selected' : ''}
          aria-pressed={tab === 'segment'}
          onClick={() => setTab('segment')}
        >
          {t('segmentsTab')}
        </button>
      </div>
      <div className="asset-grid">
        {(tab === 'load' ? loadKinds : segmentKinds).map((kind) => {
          const Icon = icons[kind];
          const asset = { type: tab, kind } as AssetPreset;
          return (
            <button
              key={kind}
              draggable
              className={`asset-tile ${placing?.kind === kind ? 'selected' : ''}`}
              aria-pressed={placing?.kind === kind}
              onClick={() => onChoose(asset)}
              onDragStart={(event) => {
                event.dataTransfer.setData('application/x-live-load-asset', JSON.stringify(asset));
                event.dataTransfer.effectAllowed = 'copy';
              }}
            >
              <Icon size={25} strokeWidth={1.5} />
              <span>{t(assetLabels[kind])}</span>
            </button>
          );
        })}
      </div>
      <p className="field-help">{t('libraryHint')}</p>
      {tab === 'segment' && <p className="field-help">{t('referenceNote')}</p>}
    </section>
  );
}
