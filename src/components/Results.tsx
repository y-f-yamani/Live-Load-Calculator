import {
  ArrowUpRight,
  CircleAlert,
  ClipboardCheck,
  ShieldCheck,
  ArrowRight,
  Info,
} from 'lucide-react';
import { assess } from '../domain/assessment';
import type { Project, Scenario } from '../domain/schema';
import { formatNumber } from '../domain/numbers';
import type { Locale, MessageKey, Translator } from '../i18n/messages';

export function Results({
  project,
  scenario,
  locale,
  t,
  onEvidence,
}: {
  project: Project;
  scenario: Scenario;
  locale: Locale;
  t: Translator;
  onEvidence: () => void;
}) {
  const result = assess(project, scenario);
  const statusBody = `${result.status}Body` as MessageKey;
  return (
    <aside className="results-column">
      <section className={`assessment-card status-${result.status}`} aria-live="polite">
        <div className="section-eyebrow">
          <ShieldCheck size={16} />
          {t('assessment')}
        </div>
        <div className="status-heading">
          {result.status === 'within' ? <ClipboardCheck size={25} /> : <CircleAlert size={25} />}
          <h2>{t(result.status)}</h2>
        </div>
        <p>{t(statusBody)}</p>
        <span className="scope-pill">{t('static')}</span>
      </section>
      <section className="panel confidence-card">
        <div className="section-row">
          <h3>{t('confidence')}</h3>
          <Info size={16} className="muted" />
        </div>
        <div className="confidence-number">
          <strong>
            {formatNumber(result.evidence.percent, locale, 0)}
            <span>%</span>
          </strong>
          <span>{t('completeness')}</span>
        </div>
        <div
          className="evidence-segments"
          role="progressbar"
          aria-label={t('completeness')}
          aria-valuenow={result.evidence.percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {result.evidence.groups.map((group) => (
            <span key={group.key} className={group.complete ? 'filled' : ''} />
          ))}
        </div>
        <p className="small-count">
          {formatNumber(result.evidence.count, locale, 0)} {t('documentedCount')}
        </p>
        <p className="field-help">{t('confidenceHelp')}</p>
        <button className="text-button" onClick={onEvidence}>
          {t('viewEvidence')}
          <ArrowUpRight size={16} />
        </button>
      </section>
      <section className="panel checks-card">
        <h3>{t('checkedLimits')}</h3>
        {result.checks.map((check) => (
          <div className="check-row" key={check.key}>
            <div>
              <span>{t(check.key)}</span>
              <small className={`check-state ${check.state}`}>
                {t(
                  check.state === 'within'
                    ? 'withinCheck'
                    : check.state === 'exceeds'
                      ? 'exceededCheck'
                      : 'unassessed',
                )}
              </small>
            </div>
            <div dir="ltr" className="check-values">
              {formatNumber(check.demand, locale)}{' '}
              <small>/ {formatNumber(check.limit, locale)} kN</small>
            </div>
          </div>
        ))}
        <p className="field-help">
          {t('demand')} / {t('limit')}
        </p>
      </section>
      <section className="next-card">
        <h3>{t('nextSteps')}</h3>
        <ul>
          {result.issues.slice(0, 4).map((issue) => (
            <li key={issue}>
              <ArrowRight size={14} />
              <span>{t(issue as MessageKey)}</span>
            </li>
          ))}
          {result.issues.length === 0 && <li>{t('noIssues')}</li>}
        </ul>
      </section>
    </aside>
  );
}
