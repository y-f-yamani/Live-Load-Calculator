import type { Project, Scenario } from '../domain/schema';
import { assess } from '../domain/assessment';
import { machineDemand } from '../domain/calculations';
import { formatNumber } from '../domain/numbers';
import { translate, evidenceLabels, type Locale, type MessageKey } from '../i18n/messages';
import { assetLabels } from '../i18n/sceneLabels';

export function Report({
  project,
  scenario,
  languages,
  date,
}: {
  project: Project;
  scenario: Scenario;
  languages: Locale[];
  date: Date;
}) {
  const result = assess(project, scenario);
  return (
    <div className="print-only">
      {languages.map((locale) => {
        const t = translate(locale);
        const f = (n: number | null) => formatNumber(n, locale, 6);
        return (
          <article
            className="report-document"
            lang={locale}
            dir={locale === 'ar' ? 'rtl' : 'ltr'}
            key={locale}
          >
            <header>
              <strong>{t('app')}</strong>
              <span>
                {t('reportDate')}: {date.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-GB')}
              </span>
            </header>
            <h1>{t('reportTitle')}</h1>
            <h2>
              {project.name} · {scenario.name}
            </h2>
            {project.isExample && (
              <p className="report-alert">
                {t('sample')} — {t('sampleNote')}
              </p>
            )}
            <p>
              {t('site')}: {project.site || '—'} · {t('codeBasis')}: {project.codeBasis || '—'}
            </p>
            <p>
              <strong>
                {t('assessment')}: {t(result.status)}
              </strong>
            </p>
            <p>
              {t('confidence')}: {result.evidence.percent}% — {result.evidence.count}{' '}
              {t('documentedCount')}. {t('confidenceHelp')}
            </p>
            <p className="report-alert">
              {t('engineeringNote')} {t('reportScope')}
            </p>
            <h2>{t('plan')}</h2>
            <p>
              {t('floorType')}: {t(project.floor.type)} · {f(project.floor.width)} ×{' '}
              {f(project.floor.length)} m · {t('backgroundLoad')}: {f(scenario.backgroundLoad)}{' '}
              kN/m² · {t('udlRating')}: {f(project.floor.udlRating)} kN/m²
            </p>
            <svg
              className="report-plan"
              viewBox={`-1 -1 ${project.floor.width + 2} ${project.floor.length + 2}`}
              style={{ direction: 'ltr' }}
              aria-label={t('plan')}
            >
              <rect
                width={project.floor.width}
                height={project.floor.length}
                fill="#f5f7f7"
                stroke="#657c81"
                strokeWidth=".04"
              />
              {project.floor.beams.map((beam) => (
                <line
                  key={beam.id}
                  x1={beam.axis === 'x' ? beam.position : 0}
                  y1={beam.axis === 'y' ? beam.position : 0}
                  x2={beam.axis === 'x' ? beam.position : project.floor.width}
                  y2={beam.axis === 'y' ? beam.position : project.floor.length}
                  stroke="#647b83"
                  strokeDasharray=".15 .1"
                  strokeWidth=".07"
                />
              ))}
              {project.floor.segments.map((segment) => (
                <rect
                  key={segment.id}
                  transform={`translate(${segment.x} ${segment.y}) rotate(${segment.rotation})`}
                  x={-segment.width / 2}
                  y={-segment.length / 2}
                  width={segment.width}
                  height={segment.length}
                  fill={segment.kind === 'zone' ? '#e0e9f2' : '#b7c1c9'}
                  fillOpacity=".5"
                  stroke="#647b83"
                  strokeWidth=".04"
                  strokeDasharray={segment.kind === 'zone' ? '.15 .1' : undefined}
                />
              ))}
              {project.floor.openings.map((o) => (
                <rect
                  key={o.id}
                  x={o.x}
                  y={o.y}
                  width={o.width}
                  height={o.length}
                  fill="white"
                  stroke="#b54833"
                  strokeWidth=".05"
                />
              ))}
              {scenario.machines.map((m, i) => (
                <g key={m.id} transform={`translate(${m.x} ${m.y}) rotate(${m.rotation})`}>
                  <rect
                    x={-m.width / 2}
                    y={-m.length / 2}
                    width={m.width}
                    height={m.length}
                    fill="#cce6de"
                    stroke="#286b5c"
                    strokeWidth=".05"
                  />
                  {m.supports.map((s) => (
                    <circle key={s.id} cx={s.x} cy={s.y} r=".07" fill="#153f38" />
                  ))}
                  <text textAnchor="middle" fontSize=".28" y=".1" fill="#153f38">
                    M{i + 1}
                  </text>
                </g>
              ))}
            </svg>
            <p>{t('helpScope')}</p>
            <h2>{t('reportInputs')}</h2>
            <table>
              <thead>
                <tr>
                  <th>{t('machine')}</th>
                  <th>
                    {t('operatingMass')} + {t('contents')} (kg)
                  </th>
                  <th>{t('force')} (kN)</th>
                  <th>X / Y / °</th>
                  <th>{t('operation')}</th>
                </tr>
              </thead>
              <tbody>
                {scenario.machines.map((m, i) => (
                  <tr key={m.id}>
                    <td>
                      M{i + 1} · {m.name}
                      <br />
                      {t(assetLabels[m.kind])}
                      <br />
                      {f(m.width)} × {f(m.length)} m · {t('objectHeight')}: {f(m.height)} m
                    </td>
                    <td>
                      {f(m.mass)} + {f(m.contents)}
                    </td>
                    <td>{f(machineDemand(m).force)}</td>
                    <td dir="ltr">
                      {f(m.x)} / {f(m.y)} / {f(m.rotation)}
                    </td>
                    <td>
                      {t(m.operation)}
                      <br />
                      {t(m.reactionMode)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {project.floor.segments.length > 0 && (
              <section>
                <h2>{t('referenceList')}</h2>
                <p>
                  {t('referenceNote')} {t('zoneNote')}
                </p>
                <table>
                  <thead>
                    <tr>
                      <th>{t('segmentName')}</th>
                      <th>{t('objectType')}</th>
                      <th>
                        {t('width')} × {t('length')} × {t('height')} (m)
                      </th>
                      <th>X / Y / °</th>
                      <th>{t('elevation')} (m)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.floor.segments.map((segment) => (
                      <tr key={segment.id}>
                        <td>{segment.name}</td>
                        <td>{t(assetLabels[segment.kind])}</td>
                        <td dir="ltr">
                          {f(segment.width)} × {f(segment.length)} × {f(segment.height)}
                        </td>
                        <td dir="ltr">
                          {f(segment.x)} / {f(segment.y)} / {f(segment.rotation)}
                        </td>
                        <td>{f(segment.elevation)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}
            {scenario.machines.map((m, i) => {
              const d = machineDemand(m);
              return (
                <section key={m.id}>
                  <h3>
                    M{i + 1} · {m.name} — {t(m.supportType)}
                  </h3>
                  {d.isAssumed && <p className="report-alert">{t('equalNote')}</p>}
                  <table>
                    <thead>
                      <tr>
                        <th>{t('support')}</th>
                        <th>
                          {t('offsetX')} / {t('offsetY')} (m)
                        </th>
                        <th>{t('area')} (m²)</th>
                        <th>{t('reaction')} (kN)</th>
                        <th>{t('contactPressure')} (kPa)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {m.supports.map((s, j) => (
                        <tr key={s.id}>
                          <td>{j + 1}</td>
                          <td>
                            {f(s.x)} / {f(s.y)}
                          </td>
                          <td>{f(s.area)}</td>
                          <td>{f(d.reactions[j])}</td>
                          <td>{f(d.pressures[j])}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p>
                    {t('footprintAverage')}: {f(d.averagePressure)} kPa. {t('udlHelp')}
                  </p>
                </section>
              );
            })}
            <h2>{t('reportLimits')}</h2>
            <p>{scenario.review.reference || t('missingReview')}</p>
            <p>
              {t('minArea')}: {f(scenario.review.minContactArea)} m².{' '}
              {result.reviewCurrent ? t('scopeCurrent') : t('scopeNeeded')}
            </p>
            <p>
              {t('confirmScope')} {t('scopeNote')} {t('limitHelp')}
            </p>
            <table>
              <thead>
                <tr>
                  <th>{t('checkedLimits')}</th>
                  <th>{t('demand')} (kN)</th>
                  <th>{t('limit')} (kN)</th>
                  <th>{t('assessment')}</th>
                </tr>
              </thead>
              <tbody>
                {result.checks.map((c) => (
                  <tr key={c.key}>
                    <td>{t(c.key)}</td>
                    <td>{f(c.demand)}</td>
                    <td>{f(c.limit)}</td>
                    <td>
                      {t(
                        c.state === 'unassessed'
                          ? 'unassessed'
                          : c.state === 'exceeds'
                            ? 'exceededCheck'
                            : 'withinCheck',
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h2>{t('nextSteps')}</h2>
            <ul>
              {result.issues.map((issue) => (
                <li key={issue}>{t(issue as MessageKey)}</li>
              ))}
            </ul>
            <h2>{t('reportSources')}</h2>
            <p>{t('evidenceDisclosure')}</p>
            <table>
              <thead>
                <tr>
                  <th>{t('evidence')}</th>
                  <th>{t('state')}</th>
                  <th>{t('source')}</th>
                </tr>
              </thead>
              <tbody>
                {result.evidence.groups.map((g) => (
                  <tr key={g.key}>
                    <td>{t(evidenceLabels[g.key][0])}</td>
                    <td>
                      {g.complete
                        ? t('credited')
                        : g.evidence.state === 'documented' && !g.current
                          ? t('stale')
                          : t(g.evidence.state)}
                      {!g.eligible && <p>{t('eligibleMissing')}</p>}
                    </td>
                    <td>
                      {g.evidence.source || '—'}
                      <p>{g.evidence.note}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <footer>
              {t('version')}: static-load-1.0 · {t('rubric')}: {result.evidence.version} · Schema{' '}
              {project.schemaVersion}
            </footer>
          </article>
        );
      })}
    </div>
  );
}
