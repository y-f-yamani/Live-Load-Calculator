import { lazy, Suspense, useEffect, useRef, useState } from 'react';
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
  Undo2,
  Redo2,
  LockKeyhole,
} from 'lucide-react';
import { createProject, newId } from './domain/defaults';
import type { Machine, Scenario, Segment } from './domain/schema';
import {
  createLoad,
  createSegment,
  resizeLoad,
  snapCoordinate,
  type Selection,
  type SceneTransform,
} from './domain/scene';
import { useProjectHistory } from './hooks/useProjectHistory';
import type { AssetPreset, EditorTool } from './scene/SceneEngine';
import { assetLabels } from './i18n/sceneLabels';
import { ObjectLibrary } from './components/ObjectLibrary';
import { SegmentInspector } from './components/SegmentInspector';
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

const ThreeScene = lazy(() => import('./components/ThreeScene'));

export default function App() {
  const [initial] = useState(loadProject);
  const { project, setProject, canUndo, canRedo, undo, redo } = useProjectHistory(
    () => initial.project ?? createProject(),
  );
  const [selectedId, setSelectedId] = useState(project.scenarios[0].machines[0].id);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');
  const [editorTool, setEditorTool] = useState<EditorTool>('move');
  const [placing, setPlacing] = useState<AssetPreset | null>(null);
  const [snap, setSnap] = useState(true);
  const [labels, setLabels] = useState(true);
  const [view, setView] = useState<'workspace' | 'evidence' | 'compare'>('workspace');
  const [saveError, setSaveError] = useState(false);
  const [savingPaused, setSavingPaused] = useState(initial.error);
  const [notice, setNotice] = useState(
    initial.error ? 'recovered' : initial.migrated ? 'migratedProject' : '',
  );
  const [reportLanguage, setReportLanguage] = useState<Locale | 'both'>('en');
  const [printDate, setPrintDate] = useState(new Date());
  const helpDialog = useRef<HTMLDialogElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const { locale, setLocale, theme, setTheme } = usePreferences();
  const t = translate(locale);
  const scenario = project.scenarios.find((s) => s.id === project.activeScenarioId)!;
  const machine = scenario.machines.find((m) => m.id === selectedId) ?? scenario.machines[0];
  const segment = project.floor.segments.find((s) => s.id === selectedSegmentId);
  const selection: Selection = segment
    ? { type: 'segment', id: segment.id }
    : { type: 'load', id: machine.id };
  const selectObject = (next: Selection) => {
    if (!validDrafts()) return;
    setSelectedSegmentId(next.type === 'segment' ? next.id : null);
    if (next.type === 'load') setSelectedId(next.id);
  };
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
          ? { ...s, machines: s.machines.map((m) => (m.id === id ? resizeLoad(m, patch) : m)) }
          : s,
      ),
    }));
  const patchSegment = (id: string, patch: Partial<Segment>) =>
    setProject((p) => ({
      ...p,
      floor: {
        ...p.floor,
        segments: p.floor.segments.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      },
    }));
  const transformObject = (target: Selection, patch: Partial<SceneTransform>) => {
    if (!validDrafts()) return;
    if (target.type === 'load') {
      const item = scenario.machines.find((m) => m.id === target.id);
      if (item && !item.locked) patchMachine(target.id, patch);
    } else {
      const item = project.floor.segments.find((s) => s.id === target.id);
      if (item && !item.locked)
        patchSegment(target.id, item.kind === 'zone' ? { ...patch, height: item.height } : patch);
    }
  };
  const addAsset = (asset: AssetPreset, x: number, y: number) => {
    if (!validDrafts()) return;
    if (
      (asset.type === 'load' && scenario.machines.length >= 30) ||
      (asset.type === 'segment' && project.floor.segments.length >= 40)
    ) {
      setNotice('placementLimit');
      return;
    }
    const position = { x: snapCoordinate(x, snap), y: snapCoordinate(y, snap) };
    if (asset.type === 'load') {
      const item = {
        ...createLoad(
          asset.kind,
          `${t(assetLabels[asset.kind])} ${scenario.machines.length + 1}`,
          project.floor,
        ),
        ...position,
      };
      patchScenario({ machines: [...scenario.machines, item] });
      selectObject({ type: 'load', id: item.id });
    } else {
      const item = {
        ...createSegment(
          asset.kind,
          `${t(assetLabels[asset.kind])} ${project.floor.segments.length + 1}`,
          project.floor,
        ),
        ...position,
      };
      setProject((p) => ({ ...p, floor: { ...p.floor, segments: [...p.floor.segments, item] } }));
      selectObject({ type: 'segment', id: item.id });
    }
    setPlacing(null);
  };
  const duplicateObject = () => {
    if (!validDrafts()) return;
    if (segment) {
      if (project.floor.segments.length >= 40) {
        setNotice('placementLimit');
        return;
      }
      const item = {
        ...structuredClone(segment),
        id: newId(),
        name: `${segment.name} · ${t('copied')}`.slice(0, 160),
        x: snapCoordinate(segment.x + 0.5, snap),
        y: snapCoordinate(segment.y + 0.5, snap),
        locked: false,
      };
      setProject((p) => ({ ...p, floor: { ...p.floor, segments: [...p.floor.segments, item] } }));
      selectObject({ type: 'segment', id: item.id });
    } else {
      if (scenario.machines.length >= 30) {
        setNotice('placementLimit');
        return;
      }
      const item = {
        ...structuredClone(machine),
        id: newId(),
        name: `${machine.name} · ${t('copied')}`.slice(0, 160),
        x: snapCoordinate(machine.x + 0.5, snap),
        y: snapCoordinate(machine.y + 0.5, snap),
        locked: false,
        supports: machine.supports.map((s) => ({ ...s, id: newId() })),
      };
      patchScenario({ machines: [...scenario.machines, item] });
      selectObject({ type: 'load', id: item.id });
    }
  };
  const deleteObject = () => {
    if (!validDrafts()) return;
    if (segment) {
      if (!segment.locked && window.confirm(t('deleteSegmentConfirm'))) {
        setProject((p) => ({
          ...p,
          floor: { ...p.floor, segments: p.floor.segments.filter((s) => s.id !== segment.id) },
        }));
        setSelectedSegmentId(null);
      }
    } else if (
      !machine.locked &&
      scenario.machines.length > 1 &&
      window.confirm(t('deleteMachineConfirm'))
    ) {
      patchScenario({ machines: scenario.machines.filter((m) => m.id !== machine.id) });
    }
  };
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
                <div className="editor-sidebar">
                  <ObjectLibrary
                    placing={placing}
                    onChoose={(asset) => {
                      if (validDrafts()) {
                        setPlacing(asset);
                        setViewMode('3d');
                      }
                    }}
                    t={t}
                  />
                  {segment ? (
                    <SegmentInspector
                      segment={segment}
                      onChange={(patch) => patchSegment(segment.id, patch)}
                      onDelete={deleteObject}
                      onDuplicate={duplicateObject}
                      t={t}
                    />
                  ) : (
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
                  )}
                </div>
                <div className="canvas-column">
                  <div className="editor-view-bar">
                    <div className="segmented">
                      {(['3d', '2d'] as const).map((mode) => (
                        <button
                          key={mode}
                          className={viewMode === mode ? 'selected' : ''}
                          aria-pressed={viewMode === mode}
                          onClick={() => {
                            if (validDrafts()) {
                              setViewMode(mode);
                              setPlacing(null);
                            }
                          }}
                        >
                          {t(mode === '3d' ? 'view3d' : 'view2d')}
                        </button>
                      ))}
                    </div>
                    <div className="scene-actions">
                      <button
                        className="icon-button"
                        disabled={!canUndo}
                        title={t('undo')}
                        aria-label={t('undo')}
                        onClick={() => {
                          if (validDrafts()) undo();
                        }}
                      >
                        <Undo2 size={18} />
                      </button>
                      <button
                        className="icon-button"
                        disabled={!canRedo}
                        title={t('redo')}
                        aria-label={t('redo')}
                        onClick={() => {
                          if (validDrafts()) redo();
                        }}
                      >
                        <Redo2 size={18} />
                      </button>
                    </div>
                  </div>
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
                  {viewMode === '3d' ? (
                    <Suspense
                      fallback={
                        <div className="panel three-loading" role="status">
                          {t('loading3d')}
                        </div>
                      }
                    >
                      <ThreeScene
                        model={{
                          floor: project.floor,
                          machines: scenario.machines,
                          selection,
                          tool: editorTool,
                          snap,
                          labels,
                          locale,
                          placing,
                          onSelect: selectObject,
                          onTransform: transformObject,
                          onPlace: (x, y) => {
                            if (placing) addAsset(placing, x, y);
                          },
                          onCancelPlacement: () => setPlacing(null),
                          onDelete: deleteObject,
                          onDuplicate: duplicateObject,
                        }}
                        onTool={setEditorTool}
                        onLabels={setLabels}
                        onSnap={setSnap}
                        onUse2d={() => setViewMode('2d')}
                        onDropAsset={addAsset}
                        onAddAtCenter={() => {
                          if (placing)
                            addAsset(placing, project.floor.width / 2, project.floor.length / 2);
                        }}
                      />
                    </Suspense>
                  ) : (
                    <FloorPlan
                      floor={project.floor}
                      machines={scenario.machines}
                      selectedId={segment ? '' : machine.id}
                      onSelect={(id) => selectObject({ type: 'load', id })}
                      selectedSegmentId={segment?.id}
                      onSelectSegment={(id) => selectObject({ type: 'segment', id })}
                      onMove={(id, x, y) =>
                        transformObject(
                          { type: 'load', id },
                          {
                            x: Math.max(-1000, Math.min(1000, x)),
                            y: Math.max(-1000, Math.min(1000, y)),
                          },
                        )
                      }
                      onRotate={(id) => {
                        if (segment && !id) {
                          transformObject(
                            { type: 'segment', id: segment.id },
                            { rotation: (segment.rotation + 90) % 360 },
                          );
                          return;
                        }
                        const m = scenario.machines.find((s) => s.id === id);
                        if (m)
                          transformObject(
                            { type: 'load', id },
                            { rotation: (m.rotation + 90) % 360 },
                          );
                      }}
                      locale={locale}
                      t={t}
                    />
                  )}
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
                          addAsset(
                            { type: 'load', kind: 'machine' },
                            project.floor.width / 2,
                            project.floor.length / 2,
                          );
                        }}
                      >
                        <Plus size={16} />
                        {t('addMachine')}
                      </button>
                    </div>
                    {scenario.machines.map((m, index) => (
                      <div
                        key={m.id}
                        className={`machine-list-row ${!segment && m.id === machine.id ? 'selected' : ''}`}
                      >
                        <button onClick={() => selectObject({ type: 'load', id: m.id })}>
                          <span className="machine-list-icon">
                            <Box size={19} />
                          </span>
                          <span>
                            <strong>
                              {m.name || t('blankName')} {m.locked && <LockKeyhole size={12} />}
                            </strong>
                            <small dir="ltr">
                              M{String(index + 1).padStart(2, '0')} · {m.width} × {m.length} ×{' '}
                              {m.height} m
                            </small>
                          </span>
                          <span className="machine-list-load" dir="ltr">
                            {formatNumber(machineDemand(m).force, locale)} <small>kN</small>
                          </span>
                        </button>
                        <button
                          className="icon-button"
                          disabled={scenario.machines.length === 1 || m.locked}
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
                  {project.floor.segments.length > 0 && (
                    <section className="panel machine-list">
                      <div className="section-row">
                        <h3>
                          {t('referenceList')}{' '}
                          <span className="count-badge">{project.floor.segments.length}</span>
                        </h3>
                      </div>
                      <p className="field-help">{t('sharedSegments')}</p>
                      {project.floor.segments.map((item) => (
                        <div
                          key={item.id}
                          className={`machine-list-row ${segment?.id === item.id ? 'selected' : ''}`}
                        >
                          <button onClick={() => selectObject({ type: 'segment', id: item.id })}>
                            <span className="machine-list-icon">
                              <Layers3 size={19} />
                            </span>
                            <span>
                              <strong>
                                {item.name || t('blankName')}{' '}
                                {item.locked && <LockKeyhole size={12} />}
                              </strong>
                              <small>
                                {t(assetLabels[item.kind])} ·{' '}
                                <bdi>
                                  {item.width} × {item.length} m
                                </bdi>
                              </small>
                            </span>
                          </button>
                        </div>
                      ))}
                    </section>
                  )}
                  <div className="selected-summary">
                    <span>
                      {t('selected')}: <strong>{segment?.name ?? machine.name}</strong>
                    </span>
                    {!segment && (
                      <span>
                        {t('footprintAverage')}:{' '}
                        <strong>{formatNumber(selectedDemand.averagePressure, locale)} kPa</strong>
                      </span>
                    )}
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
            <small>LIVE LOAD / v0.2.0</small>
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
