import { ArrowUpRight, Copy, Trash2 } from 'lucide-react';
import { assess } from '../domain/assessment';
import type { Project } from '../domain/schema';
import { formatNumber } from '../domain/numbers';
import type { Locale, Translator } from '../i18n/messages';

export function CompareView({
  project,
  locale,
  t,
  onSelect,
  onDuplicate,
  onDelete,
}: {
  project: Project;
  locale: Locale;
  t: Translator;
  onSelect: (id: string) => void;
  onDuplicate: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <section className="compare-page">
      <div className="page-intro">
        <div>
          <h1>{t('compareHeading')}</h1>
          <p>{t('compareIntro')}</p>
        </div>
        <button
          className="button primary"
          disabled={project.scenarios.length >= 12}
          onClick={onDuplicate}
        >
          <Copy size={17} />
          {t('addScenario')}
        </button>
      </div>
      <div className="comparison-grid">
        {project.scenarios.map((scenario) => {
          const result = assess(project, scenario);
          return (
            <article className="panel scenario-card" key={scenario.id}>
              <div className="section-row">
                <h2>{scenario.name}</h2>
                {scenario.id === project.activeScenarioId && (
                  <span className="tiny-tag">{t('active')}</span>
                )}
              </div>
              <p className={`status-label ${result.status}`}>{t(result.status)}</p>
              <dl>
                <div>
                  <dt>{t('totalMachine')}</dt>
                  <dd>
                    {formatNumber(result.demand.machineForce, locale)} <small>kN</small>
                  </dd>
                </div>
                <div>
                  <dt>{t('peakSupport')}</dt>
                  <dd>
                    {formatNumber(result.demand.peakReaction, locale)} <small>kN</small>
                  </dd>
                </div>
                <div>
                  <dt>{t('totalApplied')}</dt>
                  <dd>
                    {formatNumber(result.demand.totalForce, locale)} <small>kN</small>
                  </dd>
                </div>
                <div>
                  <dt>{t('confidence')}</dt>
                  <dd>
                    {formatNumber(result.evidence.percent, locale, 0)}
                    <small>%</small>
                  </dd>
                </div>
              </dl>
              <p className="field-help">{t('confidenceHelp')}</p>
              <div className="scenario-actions">
                <button className="text-button" onClick={() => onSelect(scenario.id)}>
                  {t('openLayout')}
                  <ArrowUpRight size={16} />
                </button>
                <button
                  className="icon-button danger"
                  disabled={project.scenarios.length <= 1}
                  aria-label={`${t('deleteScenario')}: ${scenario.name}`}
                  onClick={() => onDelete(scenario.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
