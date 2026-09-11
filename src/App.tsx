import { useEffect, useRef, useState } from 'react';
import {
  Layers3,
  LayoutDashboard,
  Files,
  GitCompareArrows,
  Download,
  Upload,
  Printer,
  Sun,
  Moon,
  Monitor,
  ChevronDown,
  Plus,
  Copy,
  Box,
  ArrowDownToLine,
  CircleHelp,
  X,
  Trash2,
  ShieldCheck,
  Check,
  FilePlus2,
} from 'lucide-react';
import { createMachine, createProject, newId } from './domain/defaults';
import type { Machine, Project, Scenario } from './domain/schema';
import { scenarioDemand, machineDemand } from './domain/calculations';
import { formatNumber } from './domain/numbers';
import { downloadProject, loadProject, parseProject, saveProject } from './infrastructure/storage';
import { translate, type Locale } from './i18n/messages';
import { usePreferences, type Theme } from './hooks/usePreferences';
import { useAssessmentTool } from './hooks/useAssessmentTool';
import { FloorPlan } from './components/FloorPlan';
import { Inspector } from './components/Inspector';
import { Results } from './components/Results';
import { EvidenceView } from './components/EvidenceView';
import { CompareView } from './components/CompareView';
import { Report } from './components/Report';

export default function App() {
  const [initial] = useState(loadProject);
  const [project, setProject] = useState<Project>(() => initial.project ?? createProject());
  const [selectedId, setSelectedId] = useState(project.scenarios[0].machines[0].id);
  const [view, setView] = useState<'workspace' | 'evidence' | 'compare'>('workspace');
  const [saveError, setSaveError] = useState(false);
  const [savingPaused, setSavingPaused] = useState(initial.error);
  const [notice, setNotice] = useState(initial.error ? 'recovered' : '');
  const [reportLanguage, setReportLanguage] = useState<Locale | 'both'>('en');
  const [printDate, setPrintDate] = useState(new Date());
  const helpDialog = useRef<HTMLDialogElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const { locale, setLocale, theme, setTheme } = usePreferences();
  const t = translate(locale);
  const scenario = project.scenarios.find((s) => s.id === project.activeScenarioId)!;
  const machine = scenario.machines.find((m) => m.id === selectedId) ?? scenario.machines[0];
  const demand = scenarioDemand(scenario, project.floor);
  const selectedDemand = machineDemand(machine);
  useAssessmentTool(project);
  useEffect(() => {
    if (savingPaused) return;
    const timer = setTimeout(() => setSaveError(!saveProject(project)), 450);
    const flush = () => saveProject(project);
    window.addEventListener('pagehide', flush);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pagehide', flush);
    };
  }, [project, savingPaused]);

  const patchScenario = (patch: Partial<Scenario>) =>
    setProject((p) => ({
      ...p,
      scenarios: p.scenarios.map((s) => (s.id === p.activeScenarioId ? { ...s, ...patch } : s)),
    }));
  const patchMachine = (id: string, patch: Partial<Machine>) =>
    setProject((p) => ({
      ...p,
      scenarios: p.scenarios.map((s) =>
        s.id === p.activeScenarioId
          ? { ...s, machines: s.machines.map((m) => (m.id === id ? { ...m, ...patch } : m)) }
          : s,
      ),
    }));
  const duplicate = () => {
    if (project.scenarios.length >= 12) return;
    const copy = structuredClone(scenario);
    copy.id = newId();
    copy.name = `${scenario.name} · ${t('copied')}`.slice(0, 160);
    // Copies retain source references; a separate scope declaration is required.
    copy.review.scopeConfirmed = false;
    copy.review.signature = '';
    setProject((p) => ({ ...p, scenarios: [...p.scenarios, copy], activeScenarioId: copy.id }));
  };
  const validDrafts = () => {
    const invalid = document.querySelector<HTMLInputElement>('[aria-invalid="true"]');
    if (invalid) {
      invalid.focus();
      setNotice('unsavedInput');
      return false;
    }
    return true;
  };
  const selectScenario = (id: string) => {
    if (!validDrafts()) return;
    setProject((p) => ({ ...p, activeScenarioId: id }));
  };
  const print = () => {
    if (!validDrafts()) return;
    setPrintDate(new Date());
    requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
  };
  return (
    <>
      <div className="application">
        <header className="app-header">
          <a
            className="brand"
            href="#workspace"
            onClick={(e) => {
              e.preventDefault();
              setView('workspace');
            }}
          >
            <span className="brand-symbol">
              <Layers3 size={23} strokeWidth={1.6} />
            </span>
            <span>
              <strong>
                {t('app')}
                <span className="brand-dot">.</span>
              </strong>
              <small>{t('appSubtitle')}</small>
            </span>
          </a>
          <nav className="main-nav" aria-label={t('workspace')}>
            {(
              [
                { id: 'workspace', icon: LayoutDashboard },
                { id: 'evidence', icon: Files },
                { id: 'compare', icon: GitCompareArrows },
              ] as const
            ).map(({ id, icon: Icon }) => (
              <button
                key={id}
                className={view === id ? 'active' : ''}
                aria-current={view === id ? 'page' : undefined}
                onClick={() => {
                  if (validDrafts()) setView(id);
                }}
              >
                <Icon size={16} />
                {t(id)}
              </button>
            ))}
          </nav>
          <div className="header-preferences">
            <button
              className="language-button"
              aria-label={t('language')}
              onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
            >
              {locale === 'en' ? 'العربية' : 'English'}
            </button>
            <div className="theme-control">
              {theme === 'dark' ? (
                <Moon size={16} />
              ) : theme === 'light' ? (
                <Sun size={16} />
              ) : (
                <Monitor size={16} />
              )}
              <select
                aria-label={t('theme')}
                value={theme}
                onChange={(e) => setTheme(e.target.value as Theme)}
              >
                <option value="system">{t('system')}</option>
                <option value="light">{t('light')}</option>
                <option value="dark">{t('dark')}</option>
              </select>
              <ChevronDown size={12} />
            </div>
            <button
              className="icon-button"
              aria-label={t('help')}
              title={t('help')}
              onClick={() => helpDialog.current?.showModal()}
            >
              <CircleHelp size={20} />
            </button>
          </div>
        </header>
        <div className="project-bar">
          <div className="project-identity">
            <span className="project-monogram">LL</span>
            <div>
              <strong>{project.name || t('blankName')}</strong>
              <small>
                <Check size={12} />
                {savingPaused ? t('savingPaused') : saveError ? t('saveFailed') : t('local')}
              </small>
            </div>
          </div>
          <div className="project-actions">
            <button
              className="icon-button"
              title={t('newProject')}
              aria-label={t('newProject')}
              onClick={() => {
                if (validDrafts() && window.confirm(t('newConfirm'))) {
                  setProject(createProject(false));
                  setSavingPaused(false);
                  setNotice('');
                  setView('workspace');
                }
              }}
            >
              <FilePlus2 size={18} />
            </button>
            <button
              className="button ghost"
              onClick={() => {
                if (validDrafts()) fileInput.current?.click();
              }}
            >
              <Upload size={16} />
              <span>{t('importProject')}</span>
            </button>
            <button
              className="button ghost"
              onClick={() => {
                if (validDrafts()) {
                  try {
                    downloadProject(project);
                  } catch {
                    setNotice('exportFailed');
                  }
                }
              }}
            >
              <Download size={16} />
              <span>{t('exportProject')}</span>
            </button>
            <button className="button primary" onClick={print}>
              <Printer size={16} />
              <span>{t('report')}</span>
            </button>
          </div>
          <input
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            className="visually-hidden"
            aria-label={t('importProject')}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              if (file.size > 2_000_000) {
                setNotice('fileTooLarge');
                return;
              }
              try {
                const next = parseProject(await file.text());
                setProject(next);
                setSavingPaused(false);
                setView('workspace');
                setNotice('');
              } catch {
                setNotice('importFailed');
              }
            }}
          />
        </div>
        {notice && (
          <div className="notice" role="alert">
            <span>{t(notice as Parameters<typeof t>[0])}</span>
            <button className="icon-button" aria-label={t('close')} onClick={() => setNotice('')}>
              <X size={16} />
            </button>
          </div>
        )}
        <main id="workspace">
          <div className="layout-bar">
            <div className="scenario-selector">
              <label htmlFor="scenario">{t('scenario')}</label>
              <select
                id="scenario"
                value={scenario.id}
                onChange={(e) => selectScenario(e.target.value)}
              >
                {project.scenarios.map((s) => (
                  <option value={s.id} key={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <button
                className="icon-button"
                title={t('addScenario')}
                aria-label={t('addScenario')}
                disabled={project.scenarios.length >= 12}
                onClick={duplicate}
              >
                <Copy size={16} />
              </button>
            </div>
            <div className="report-locale">
              <label htmlFor="report-language">{t('reportLanguage')}</label>
              <select
                id="report-language"
                value={reportLanguage}
                onChange={(e) => setReportLanguage(e.target.value as typeof reportLanguage)}
              >
                <option value="en">English</option>
                <option value="ar">العربية</option>
                <option value="both">{t('bilingual')}</option>
              </select>
            </div>
          </div>
          {view === 'workspace' && (
            <>
              <div className="workspace-heading">
                <div>
                  <div className="section-eyebrow">{t('appSubtitle')}</div>
                  <h1>{t('heading')}</h1>
                  <p>{t('intro')}</p>
                </div>
                <div className="floor-area">
                  <span>{t('grossArea')}</span>
                  <strong>
                    {formatNumber(project.floor.width * project.floor.length, locale)}{' '}
                    <small>m²</small>
                  </strong>
                </div>
              </div>
              {project.isExample && (
                <div className="sample-banner">
                  <span className="example-badge">{t('sample')}</span>
                  <p>{t('sampleNote')}</p>
                  <button onClick={() => setProject((p) => ({ ...p, isExample: false }))}>
                    {t('clearExample')}
                    <ArrowDownToLine size={14} />
                  </button>
                </div>
              )}
              <div className="workspace-grid">
                <Inspector
                  project={project}
                  scenario={scenario}
                  machine={machine}
                  onMachine={(patch) => patchMachine(machine.id, patch)}
                  onFloor={(patch) =>
                    setProject((p) => ({ ...p, floor: { ...p.floor, ...patch } }))
                  }
                  onScenario={patchScenario}
                  onProject={(patch) => setProject((p) => ({ ...p, ...patch }))}
                  t={t}
                />
                <div className="canvas-column">
                  <div className="metrics-row">
                    <div className="metric-card">
                      <span>{t('totalMachine')}</span>
                      <strong>
                        {formatNumber(demand.machineForce, locale)}
                        <small>kN</small>
                      </strong>
                      <p>
                        {scenario.machines.length} {t('machineCount')}
                      </p>
                    </div>
                    <div className="metric-card">
                      <span>{t('peakSupport')}</span>
                      <strong>
                        {formatNumber(demand.peakReaction, locale)}
                        <small>kN</small>
                      </strong>
                      <p>
                        {demand.machines.some((m) => m.isAssumed)
                          ? t('estimatedBadge')
                          : t('reaction')}
                      </p>
                    </div>
                    <div className="metric-card">
                      <span>{t('totalApplied')}</span>
                      <strong>
                        {formatNumber(demand.totalForce, locale)}
                        <small>kN</small>
                      </strong>
                      <p>
                        {t('backgroundLoad')} + {t('machines')}
                      </p>
                    </div>
                  </div>
                  <FloorPlan
                    floor={project.floor}
                    machines={scenario.machines}
                    selectedId={machine.id}
                    onSelect={setSelectedId}
                    onMove={(id, x, y) =>
                      patchMachine(id, {
                        x: Math.max(-1000, Math.min(1000, x)),
                        y: Math.max(-1000, Math.min(1000, y)),
                      })
                    }
                    onRotate={(id) => {
                      const m = scenario.machines.find((s) => s.id === id)!;
                      patchMachine(id, { rotation: (m.rotation + 90) % 360 });
                    }}
                    locale={locale}
                    t={t}
                  />
                  <section className="panel machine-list">
                    <div className="section-row">
                      <h3>
                        {t('machines')}{' '}
                        <span className="count-badge">{scenario.machines.length}</span>
                      </h3>
                      <button
                        className="text-button"
                        disabled={scenario.machines.length >= 30}
                        onClick={() => {
                          const m = createMachine(
                            `${t('machine')} ${String(scenario.machines.length + 1).padStart(2, '0')}`,
                          );
                          m.x = Math.min(project.floor.width / 2, machine.x + machine.width + 0.5);
                          m.y = Math.min(project.floor.length / 2, machine.y);
                          patchScenario({ machines: [...scenario.machines, m] });
                          setSelectedId(m.id);
                        }}
                      >
                        <Plus size={16} />
                        {t('addMachine')}
                      </button>
                    </div>
                    {scenario.machines.map((m, index) => (
                      <div
                        key={m.id}
                        className={`machine-list-row ${m.id === machine.id ? 'selected' : ''}`}
                      >
                        <button onClick={() => setSelectedId(m.id)}>
                          <span className="machine-list-icon">
                            <Box size={19} />
                          </span>
                          <span>
                            <strong>{m.name || t('blankName')}</strong>
                            <small dir="ltr">
                              M{String(index + 1).padStart(2, '0')} · {m.width} × {m.length} m
                            </small>
                          </span>
                          <span className="machine-list-load" dir="ltr">
                            {formatNumber(machineDemand(m).force, locale)} <small>kN</small>
                          </span>
                        </button>
                        <button
                          className="icon-button"
                          disabled={scenario.machines.length === 1}
                          aria-label={`${t('removeMachine')}: ${m.name}`}
                          onClick={() => {
                            if (window.confirm(t('deleteMachineConfirm')))
                              patchScenario({
                                machines: scenario.machines.filter((item) => item.id !== m.id),
                              });
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </section>
                  <div className="selected-summary">
                    <span>
                      {t('selected')}: <strong>{machine.name}</strong>
                    </span>
                    <span>
                      {t('footprintAverage')}:{' '}
                      <strong>{formatNumber(selectedDemand.averagePressure, locale)} kPa</strong>
                    </span>
                  </div>
                </div>
                <Results
                  project={project}
                  scenario={scenario}
                  locale={locale}
                  t={t}
                  onEvidence={() => setView('evidence')}
                />
              </div>
            </>
          )}
          {view === 'evidence' && (
            <EvidenceView
              project={project}
              scenario={scenario}
              onScenario={patchScenario}
              onProject={(patch) => setProject((p) => ({ ...p, ...patch }))}
              locale={locale}
              t={t}
            />
          )}
          {view === 'compare' && (
            <CompareView
              project={project}
              locale={locale}
              t={t}
              onSelect={(id) => {
                selectScenario(id);
                setView('workspace');
              }}
              onDuplicate={duplicate}
              onDelete={(id) => {
                if (project.scenarios.length > 1 && window.confirm(t('deleteConfirm')))
                  setProject((p) => {
                    const scenarios = p.scenarios.filter((s) => s.id !== id);
                    return {
                      ...p,
                      scenarios,
                      activeScenarioId:
                        p.activeScenarioId === id ? scenarios[0].id : p.activeScenarioId,
                    };
                  });
              }}
            />
          )}
          <footer className="app-footer">
            <span>
              <ShieldCheck size={16} />
              {t('engineeringNote')}
            </span>
            <small>LIVE LOAD / v0.1.0</small>
          </footer>
        </main>
        <dialog
          ref={helpDialog}
          className="help-dialog"
          onClick={(e) => {
            if (e.target === e.currentTarget) helpDialog.current?.close();
          }}
        >
          <div className="section-row">
            <h2>{t('helpTitle')}</h2>
            <button
              className="icon-button"
              aria-label={t('close')}
              onClick={() => helpDialog.current?.close()}
            >
              <X size={20} />
            </button>
          </div>
          {(['help1', 'help2', 'help3', 'help4', 'helpScope'] as const).map((key) => (
            <p key={key}>{t(key)}</p>
          ))}
          <p className="inline-warning">{t('confidenceHelp')}</p>
        </dialog>
      </div>
      <Report
        project={project}
        scenario={scenario}
        languages={reportLanguage === 'both' ? ['en', 'ar'] : [reportLanguage]}
        date={printDate}
      />
    </>
  );
}
