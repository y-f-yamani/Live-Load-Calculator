import { useState } from 'react';
import { Box, Layers3, Plus, Trash2, ChevronDown } from 'lucide-react';
import { NumberField, TextField } from './Fields';
import { createSupports, newId } from '../domain/defaults';
import type { Floor, Machine, Project, Scenario } from '../domain/schema';
import type { Translator } from '../i18n/messages';

export function Inspector({
  project,
  scenario,
  machine,
  onMachine,
  onFloor,
  onScenario,
  onProject,
  t,
}: {
  project: Project;
  scenario: Scenario;
  machine: Machine;
  onMachine: (patch: Partial<Machine>) => void;
  onFloor: (patch: Partial<Floor>) => void;
  onScenario: (patch: Partial<Scenario>) => void;
  onProject: (patch: Partial<Project>) => void;
  t: Translator;
}) {
  const [tab, setTab] = useState<'machine' | 'floor'>('machine');
  const [massUnit, setMassUnit] = useState<'kg' | 'tonne'>('kg');
  const factor = massUnit === 'kg' ? 1 : 1000;
  return (
    <aside className="inspector panel">
      <div className="segmented inspector-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === 'machine'}
          onClick={() => setTab('machine')}
          className={tab === 'machine' ? 'selected' : ''}
        >
          <Box size={16} />
          {t('machine')}
        </button>
        <button
          role="tab"
          aria-selected={tab === 'floor'}
          onClick={() => setTab('floor')}
          className={tab === 'floor' ? 'selected' : ''}
        >
          <Layers3 size={16} />
          {t('floor')}
        </button>
      </div>
      {tab === 'machine' ? (
        <div className="inspector-body" key={machine.id}>
          <div className="section-eyebrow">{t('selected')}</div>
          <TextField
            label={t('machineName')}
            value={machine.name}
            onChange={(name) => onMachine({ name })}
          />
          <div className="section-row">
            <h3>{t('operatingMass')}</h3>
            <select
              aria-label={t('unit')}
              value={massUnit}
              onChange={(e) => setMassUnit(e.target.value as typeof massUnit)}
            >
              <option value="kg">kg</option>
              <option value="tonne">t</option>
            </select>
          </div>
          <div className="field-grid">
            <NumberField
              label={t('operatingMass')}
              value={machine.mass === null ? null : machine.mass / factor}
              onChange={(mass) => onMachine({ mass: mass === null ? null : mass * factor })}
              unit={massUnit === 'kg' ? 'kg' : 't'}
              max={1e9 / factor}
              t={t}
            />
            <NumberField
              label={t('contents')}
              value={machine.contents === null ? null : machine.contents / factor}
              onChange={(contents) =>
                onMachine({ contents: contents === null ? null : contents * factor })
              }
              unit={massUnit === 'kg' ? 'kg' : 't'}
              max={1e9 / factor}
              t={t}
            />
          </div>
          <p className="field-help">
            {t('massHelp')} {t('unknownHelp')}
          </p>
          <div className="field-grid">
            <NumberField
              label={t('width')}
              value={machine.width}
              onChange={(width) => onMachine({ width: width! })}
              required
              min={0.05}
              max={1000}
              unit="m"
              t={t}
            />
            <NumberField
              label={t('length')}
              value={machine.length}
              onChange={(length) => onMachine({ length: length! })}
              required
              min={0.05}
              max={1000}
              unit="m"
              t={t}
            />
          </div>
          <div className="field-grid">
            <NumberField
              label={t('positionX')}
              value={machine.x}
              onChange={(x) => onMachine({ x: x! })}
              required
              min={-1000}
              max={1000}
              unit="m"
              t={t}
            />
            <NumberField
              label={t('positionY')}
              value={machine.y}
              onChange={(y) => onMachine({ y: y! })}
              required
              min={-1000}
              max={1000}
              unit="m"
              t={t}
            />
          </div>
          <NumberField
            label={t('rotation')}
            value={machine.rotation}
            onChange={(rotation) => onMachine({ rotation: rotation! })}
            required
            max={359.999}
            unit="°"
            t={t}
          />
          <div className="field">
            <label htmlFor="operation">{t('operation')}</label>
            <select
              id="operation"
              value={machine.operation}
              onChange={(e) => onMachine({ operation: e.target.value as Machine['operation'] })}
            >
              {(['unknown', 'static', 'rotating', 'impact', 'moving'] as const).map((option) => (
                <option key={option} value={option}>
                  {t(option)}
                </option>
              ))}
            </select>
          </div>
          <p className="field-help">{t('operationHelp')}</p>
          <details open className="inspector-section">
            <summary>
              {t('supports')}
              <ChevronDown size={15} />
            </summary>
            <div className="support-options">
              {(['feet', 'wheels', 'skids', 'base'] as const).map((kind) => (
                <button
                  key={kind}
                  className={machine.supportType === kind ? 'selected' : ''}
                  aria-pressed={machine.supportType === kind}
                  onClick={() =>
                    onMachine({
                      supportType: kind,
                      supports: createSupports(
                        machine.width,
                        machine.length,
                        kind === 'base' ? 1 : kind === 'skids' ? 2 : 4,
                      ),
                      reactionMode: 'unknown',
                    })
                  }
                >
                  {t(kind)}
                </button>
              ))}
            </div>
            <div className="field">
              <label htmlFor="support-count">{t('count')}</label>
              <select
                id="support-count"
                value={machine.supports.length}
                onChange={(e) =>
                  onMachine({
                    supports: createSupports(machine.width, machine.length, Number(e.target.value)),
                    reactionMode: 'unknown',
                  })
                }
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="reactions">{t('reactionMode')}</label>
              <select
                id="reactions"
                value={machine.reactionMode}
                onChange={(e) =>
                  onMachine({ reactionMode: e.target.value as Machine['reactionMode'] })
                }
              >
                {(['unknown', 'equal', 'specified'] as const).map((option) => (
                  <option key={option} value={option}>
                    {t(option)}
                  </option>
                ))}
              </select>
            </div>
            {machine.reactionMode === 'equal' && <p className="inline-warning">{t('equalNote')}</p>}
            <p className="field-help">
              {t('supportGeometry')} {t('areaHelp')}
            </p>
            {machine.supports.map((support, i) => (
              <details className="support-detail" key={support.id}>
                <summary>
                  {t('support')} {i + 1}
                  <ChevronDown size={14} />
                </summary>
                <div className="field-grid">
                  <NumberField
                    label={t('offsetX')}
                    value={support.x}
                    onChange={(x) =>
                      onMachine({
                        supports: machine.supports.map((s) =>
                          s.id === support.id ? { ...s, x: x! } : s,
                        ),
                      })
                    }
                    required
                    min={-1000}
                    max={1000}
                    unit="m"
                    t={t}
                  />
                  <NumberField
                    label={t('offsetY')}
                    value={support.y}
                    onChange={(y) =>
                      onMachine({
                        supports: machine.supports.map((s) =>
                          s.id === support.id ? { ...s, y: y! } : s,
                        ),
                      })
                    }
                    required
                    min={-1000}
                    max={1000}
                    unit="m"
                    t={t}
                  />
                  <NumberField
                    label={t('area')}
                    value={support.area}
                    onChange={(area) =>
                      onMachine({
                        supports: machine.supports.map((s) =>
                          s.id === support.id ? { ...s, area } : s,
                        ),
                      })
                    }
                    min={0.000001}
                    unit="m²"
                    t={t}
                  />
                  {machine.reactionMode === 'specified' && (
                    <NumberField
                      label={t('reaction')}
                      value={support.reaction}
                      onChange={(reaction) =>
                        onMachine({
                          supports: machine.supports.map((s) =>
                            s.id === support.id ? { ...s, reaction } : s,
                          ),
                        })
                      }
                      unit="kN"
                      t={t}
                    />
                  )}
                </div>
              </details>
            ))}
          </details>
        </div>
      ) : (
        <div className="inspector-body">
          <div className="section-eyebrow">{t('floor')}</div>
          <div className="field">
            <label htmlFor="floor-type">{t('floorType')}</label>
            <select
              id="floor-type"
              value={project.floor.type}
              onChange={(e) => onFloor({ type: e.target.value as Floor['type'] })}
            >
              {(['unknown', 'concrete', 'steel', 'other'] as const).map((option) => (
                <option key={option} value={option}>
                  {t(option)}
                </option>
              ))}
            </select>
          </div>
          <p className="field-help">{t('floorHelp')}</p>
          <div className="field-grid">
            <NumberField
              label={t('width')}
              value={project.floor.width}
              onChange={(width) => onFloor({ width: width! })}
              required
              min={Math.max(
                1,
                ...project.floor.openings.map((o) => o.x + o.width),
                ...project.floor.beams.filter((b) => b.axis === 'x').map((b) => b.position),
              )}
              max={1000}
              unit="m"
              t={t}
            />
            <NumberField
              label={t('length')}
              value={project.floor.length}
              onChange={(length) => onFloor({ length: length! })}
              required
              min={Math.max(
                1,
                ...project.floor.openings.map((o) => o.y + o.length),
                ...project.floor.beams.filter((b) => b.axis === 'y').map((b) => b.position),
              )}
              max={1000}
              unit="m"
              t={t}
            />
          </div>
          <NumberField
            label={t('backgroundLoad')}
            value={scenario.backgroundLoad}
            onChange={(backgroundLoad) => onScenario({ backgroundLoad })}
            unit="kN/m²"
            t={t}
          />
          <p className="field-help">
            {t('backgroundHelp')} {t('unknownHelp')}
          </p>
          <NumberField
            label={t('udlRating')}
            value={project.floor.udlRating}
            onChange={(udlRating) => onFloor({ udlRating })}
            unit="kN/m²"
            t={t}
          />
          <p className="field-help">{t('udlHelp')}</p>
          <details className="inspector-section">
            <summary>
              {t('framing')}
              <ChevronDown size={15} />
            </summary>
            <p className="field-help">{t('floorDiagramHelp')}</p>
            <button
              className="text-button"
              disabled={project.floor.beams.length >= 40}
              onClick={() =>
                onFloor({
                  beams: [
                    ...project.floor.beams,
                    { id: newId(), axis: 'x', position: project.floor.width / 2 },
                  ],
                })
              }
            >
              <Plus size={15} />
              {t('addBeam')}
            </button>
            {project.floor.beams.map((beam, i) => (
              <div className="geometry-row" key={beam.id}>
                <span>
                  {t('beam')} {i + 1}
                </span>
                <div className="field-grid">
                  <select
                    aria-label={`${t('beam')} ${i + 1} ${t('axis')}`}
                    value={beam.axis}
                    onChange={(e) =>
                      onFloor({
                        beams: project.floor.beams.map((b) =>
                          b.id === beam.id
                            ? { ...b, axis: e.target.value as 'x' | 'y', position: 0 }
                            : b,
                        ),
                      })
                    }
                  >
                    <option value="x">X</option>
                    <option value="y">Y</option>
                  </select>
                  <NumberField
                    label={t('position')}
                    value={beam.position}
                    onChange={(position) =>
                      onFloor({
                        beams: project.floor.beams.map((b) =>
                          b.id === beam.id ? { ...b, position: position! } : b,
                        ),
                      })
                    }
                    required
                    max={beam.axis === 'x' ? project.floor.width : project.floor.length}
                    unit="m"
                    t={t}
                  />
                </div>
                <button
                  className="text-button danger"
                  onClick={() =>
                    onFloor({ beams: project.floor.beams.filter((b) => b.id !== beam.id) })
                  }
                >
                  <Trash2 size={14} />
                  {t('remove')}
                </button>
              </div>
            ))}
            <button
              className="text-button"
              disabled={project.floor.openings.length >= 20}
              onClick={() =>
                onFloor({
                  openings: [
                    ...project.floor.openings,
                    {
                      id: newId(),
                      x: 0,
                      y: 0,
                      width: Math.min(2, project.floor.width),
                      length: Math.min(2, project.floor.length),
                    },
                  ],
                })
              }
            >
              <Plus size={15} />
              {t('addOpening')}
            </button>
            {project.floor.openings.map((opening, i) => (
              <details key={opening.id} className="support-detail">
                <summary>
                  {t('opening')} {i + 1}
                  <ChevronDown size={14} />
                </summary>
                <div className="field-grid">
                  {(['x', 'y', 'width', 'length'] as const).map((key) => (
                    <NumberField
                      key={key}
                      label={t(key === 'x' ? 'positionX' : key === 'y' ? 'positionY' : key)}
                      value={opening[key]}
                      required
                      min={key === 'width' || key === 'length' ? 0.05 : 0}
                      max={
                        key === 'x'
                          ? project.floor.width - opening.width
                          : key === 'y'
                            ? project.floor.length - opening.length
                            : key === 'width'
                              ? project.floor.width - opening.x
                              : project.floor.length - opening.y
                      }
                      onChange={(value) =>
                        onFloor({
                          openings: project.floor.openings.map((o) =>
                            o.id === opening.id ? { ...o, [key]: value } : o,
                          ),
                        })
                      }
                      unit="m"
                      t={t}
                    />
                  ))}
                </div>
                <button
                  className="text-button danger"
                  onClick={() =>
                    onFloor({ openings: project.floor.openings.filter((o) => o.id !== opening.id) })
                  }
                >
                  <Trash2 size={14} />
                  {t('remove')}
                </button>
              </details>
            ))}
          </details>
          <details className="inspector-section">
            <summary>
              {t('project')}
              <ChevronDown size={15} />
            </summary>
            <TextField
              label={t('projectName')}
              value={project.name}
              onChange={(name) => onProject({ name })}
            />
            <TextField
              label={t('scenarioName')}
              value={scenario.name}
              onChange={(name) => onScenario({ name })}
            />
            <TextField
              label={t('site')}
              value={project.site}
              onChange={(site) => onProject({ site })}
            />
            <TextField
              label={t('codeBasis')}
              value={project.codeBasis}
              onChange={(codeBasis) => onProject({ codeBasis })}
              maxLength={500}
            />
            <p className="field-help">{t('codeHelp')}</p>
          </details>
        </div>
      )}
    </aside>
  );
}
