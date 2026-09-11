import { Check, FileText, AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import type { Evidence, EvidenceId, Project, Scenario } from '../domain/schema';
import { scoreEvidence, evidenceSignature, reviewSignature } from '../domain/evidence';
import { evidenceLabels, type Locale, type Translator } from '../i18n/messages';
import { formatNumber } from '../domain/numbers';
import { NumberField, TextField } from './Fields';

export function EvidenceView({
  project,
  scenario,
  onScenario,
  onProject,
  locale,
  t,
}: {
  project: Project;
  scenario: Scenario;
  onScenario: (patch: Partial<Scenario>) => void;
  onProject: (patch: Partial<Project>) => void;
  locale: Locale;
  t: Translator;
}) {
  const score = scoreEvidence(project, scenario);
  const setEvidence = (key: EvidenceId, patch: Partial<Evidence>) =>
    onScenario({
      evidence: { ...scenario.evidence, [key]: { ...scenario.evidence[key], ...patch } },
    });
  const review = scenario.review;
  return (
    <div className="evidence-page">
      <div className="page-intro">
        <div>
          <h1>{t('evidenceHeading')}</h1>
          <p>{t('evidenceIntro')}</p>
        </div>
        <div className="evidence-summary">
          <strong>{formatNumber(score.percent, locale, 0)}%</strong>
          <span>
            {t('completeness')}
            <small>
              {formatNumber(score.count, locale, 0)} {t('documentedCount')}
            </small>
          </span>
        </div>
      </div>
      <div className="evidence-layout">
        <div className="evidence-list">
          <section className="panel project-fields">
            <TextField
              label={t('projectName')}
              value={project.name}
              onChange={(name) => onProject({ name })}
            />
            <TextField
              label={t('site')}
              value={project.site}
              onChange={(site) => onProject({ site })}
            />
            <TextField
              label={t('codeBasis')}
              value={project.codeBasis}
              maxLength={500}
              onChange={(codeBasis) => onProject({ codeBasis })}
            />
            <p className="field-help">{t('codeHelp')}</p>
          </section>
          {score.groups.map(({ key, complete, current, eligible, evidence }, index) => (
            <details key={key} className={`evidence-item panel ${complete ? 'complete' : ''}`}>
              <summary>
                <span className="evidence-icon">
                  {complete ? <Check size={19} /> : <FileText size={18} />}
                </span>
                <div>
                  <span className="evidence-index">{String(index + 1).padStart(2, '0')}</span>
                  <strong>{t(evidenceLabels[key][0])}</strong>
                  <small>
                    {complete
                      ? t('credited')
                      : evidence.state === 'documented' && !current
                        ? t('stale')
                        : t(evidence.state)}
                  </small>
                </div>
                <span className="evidence-points" dir="ltr">
                  {complete ? '10' : '0'} / 10
                </span>
              </summary>
              <div className="evidence-item-body">
                <p>{t(evidenceLabels[key][1])}</p>
                <div className="field">
                  <label htmlFor={`state-${key}`}>{t('state')}</label>
                  <select
                    id={`state-${key}`}
                    value={evidence.state}
                    onChange={(e) =>
                      setEvidence(key, { state: e.target.value as Evidence['state'] })
                    }
                  >
                    {(['unknown', 'estimated', 'documented', 'conflicting'] as const).map(
                      (state) => (
                        <option key={state} value={state}>
                          {t(state)}
                        </option>
                      ),
                    )}
                  </select>
                </div>
                <TextField
                  label={t('source')}
                  value={evidence.source}
                  maxLength={2000}
                  placeholder={t('sourcePlaceholder')}
                  onChange={(source) => setEvidence(key, { source, signature: '' })}
                />
                <div className="field">
                  <label htmlFor={`notes-${key}`}>{t('notes')}</label>
                  <textarea
                    id={`notes-${key}`}
                    value={evidence.note}
                    maxLength={4000}
                    placeholder={t('notePlaceholder')}
                    onChange={(e) => setEvidence(key, { note: e.target.value, signature: '' })}
                  />
                </div>
                {!eligible && (
                  <p className="inline-warning">
                    <AlertCircle size={16} />
                    {t('eligibleMissing')}
                  </p>
                )}
                <button
                  className="button secondary"
                  disabled={!eligible || !evidence.source.trim() || evidence.state !== 'documented'}
                  onClick={() =>
                    setEvidence(key, { signature: evidenceSignature(key, project, scenario) })
                  }
                >
                  <RefreshCw size={15} />
                  {t('markCurrent')}
                </button>
              </div>
            </details>
          ))}
        </div>
        <aside className="evidence-sidebar">
          <section className="panel limits-card">
            <div className="section-eyebrow">
              <ShieldCheck size={16} />
              {t('reviewedLimits')}
            </div>
            <p>{t('limitsIntro')}</p>
            <TextField
              label={t('reviewReference')}
              value={review.reference}
              maxLength={2000}
              placeholder={t('sourcePlaceholder')}
              onChange={(reference) => onScenario({ review: { ...review, reference } })}
            />
            <NumberField
              label={t('supportLimit')}
              value={review.supportLimit}
              onChange={(supportLimit) => onScenario({ review: { ...review, supportLimit } })}
              min={0.000001}
              unit="kN"
              t={t}
            />
            <NumberField
              label={t('minArea')}
              value={review.minContactArea}
              onChange={(minContactArea) => onScenario({ review: { ...review, minContactArea } })}
              min={0.000001}
              unit="m²"
              t={t}
            />
            <NumberField
              label={t('totalLimit')}
              value={review.totalLimit}
              onChange={(totalLimit) => onScenario({ review: { ...review, totalLimit } })}
              min={0.000001}
              unit="kN"
              t={t}
            />
            <p className="field-help">{t('limitHelp')}</p>
            <label className="scope-checkbox">
              <input
                type="checkbox"
                checked={
                  review.scopeConfirmed && review.signature === reviewSignature(project, scenario)
                }
                disabled={!review.reference.trim()}
                onChange={(e) =>
                  onScenario({
                    review: {
                      ...review,
                      scopeConfirmed: e.target.checked,
                      signature: e.target.checked ? reviewSignature(project, scenario) : '',
                    },
                  })
                }
              />
              <span>{t('confirmScope')}</span>
            </label>
            <p className="field-help">{t('scopeNote')}</p>
          </section>
          <div className="plain-note">
            <AlertCircle size={18} />
            <p>
              {t('confidenceHelp')} {t('evidenceDisclosure')}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
