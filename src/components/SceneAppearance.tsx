import { LockKeyhole, LockKeyholeOpen } from 'lucide-react';
import { sceneColors, type SceneColor } from '../domain/schema';
import { PALETTE } from '../domain/scene';
import type { Translator } from '../i18n/messages';
export function SceneAppearance({
  color,
  locked,
  onChange,
  t,
}: {
  color: SceneColor;
  locked: boolean;
  onChange: (patch: { color?: SceneColor; locked?: boolean }) => void;
  t: Translator;
}) {
  return (
    <div className="scene-appearance">
      <div className="section-row">
        <h3>{t('appearance')}</h3>
        <button
          className="text-button"
          aria-pressed={locked}
          onClick={() => onChange({ locked: !locked })}
        >
          {locked ? <LockKeyhole size={15} /> : <LockKeyholeOpen size={15} />}
          {t(locked ? 'unlockObject' : 'lockObject')}
        </button>
      </div>
      <div className="color-palette">
        {sceneColors.map((value) => (
          <button
            key={value}
            style={{ background: PALETTE[value] }}
            className={value === color ? 'selected' : ''}
            aria-label={t(value)}
            title={t(value)}
            aria-pressed={value === color}
            onClick={() => onChange({ color: value })}
          />
        ))}
      </div>
    </div>
  );
}
