import { useId, useRef, useState, type PointerEvent } from 'react';
import { Maximize2, Minus, Plus, RotateCw, Grid2X2 } from 'lucide-react';
import type { Floor, Machine } from '../domain/schema';
import { machineDemand } from '../domain/calculations';
import { formatNumber } from '../domain/numbers';
import { placementIssues } from '../domain/geometry';
import type { Locale, Translator } from '../i18n/messages';
import { PALETTE } from '../domain/scene';

export function FloorPlan({
  floor,
  machines,
  selectedId,
  onSelect,
  onMove,
  onRotate,
  selectedSegmentId,
  onSelectSegment,
  locale,
  t,
}: {
  floor: Floor;
  machines: Machine[];
  selectedId: string;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onRotate: (id: string) => void;
  selectedSegmentId?: string;
  onSelectSegment: (id: string) => void;
  locale: Locale;
  t: Translator;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [snap, setSnap] = useState(true);
  const [showForces, setShowForces] = useState(false);
  const uid = useId().replace(/:/g, '');
  const pad = Math.max(floor.width, floor.length) * 0.09;
  const viewW = (floor.width + pad * 2) / zoom;
  const viewH = (floor.length + pad * 2) / zoom;
  const fs = Math.max(floor.width, floor.length) * 0.023;
  const position = (e: PointerEvent<SVGSVGElement | SVGGElement>) => {
    const matrix = svg.current?.getScreenCTM();
    if (!matrix) return null;
    return new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix.inverse());
  };
  return (
    <section className="plan-card">
      <div className="plan-toolbar">
        <div className="plan-title">
          <Grid2X2 size={18} />
          <strong>{t('plan')}</strong>
          <span className="tiny-tag" dir="ltr">
            {floor.width} × {floor.length} m
          </span>
        </div>
        <label className="inline-check">
          <input
            type="checkbox"
            checked={showForces}
            onChange={(e) => setShowForces(e.target.checked)}
          />
          {t('forceLabels')}
        </label>
      </div>
      <div className="plan-canvas">
        <div className="drawing-label">
          <span className="crosshair">+</span>
          {t('planView')}
          <small>{t('grid')}</small>
        </div>
        <svg
          ref={svg}
          className="floor-svg"
          role="group"
          aria-label={t('diagramLabel')}
          style={{ direction: 'ltr' }}
          viewBox={`${floor.width / 2 - viewW / 2} ${floor.length / 2 - viewH / 2} ${viewW} ${viewH}`}
          onPointerMove={(e) => {
            const p = position(e);
            if (!p || !drag.current) return;
            const step = snap ? 0.25 : 0.01;
            onMove(
              drag.current.id,
              Math.round((p.x - drag.current.dx) / step) * step,
              Math.round((p.y - drag.current.dy) / step) * step,
            );
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
          onPointerCancel={() => {
            drag.current = null;
          }}
        >
          <defs>
            <pattern id={`${uid}-grid`} width="1" height="1" patternUnits="userSpaceOnUse">
              <path d="M 1 0 L 0 0 0 1" fill="none" className="grid-line" strokeWidth=".015" />
            </pattern>
            <pattern
              id={`${uid}-hatch`}
              width=".2"
              height=".2"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line x1="0" y1="0" x2="0" y2=".2" stroke="currentColor" strokeWidth=".02" />
            </pattern>
          </defs>
          <rect x="0" y="0" width={floor.width} height={floor.length} className="floor-surface" />
          <rect x="0" y="0" width={floor.width} height={floor.length} fill={`url(#${uid}-grid)`} />
          <path
            d={`M 0 ${-pad * 0.5} H ${floor.width} M 0 ${-pad * 0.65} V ${-pad * 0.35} M ${floor.width} ${-pad * 0.65} V ${-pad * 0.35}`}
            className="dimension-line"
          />
          <text
            x={floor.width / 2}
            y={-pad * 0.7}
            textAnchor="middle"
            className="dimension-text"
            fontSize={fs * 0.8}
          >
            {formatNumber(floor.width, locale)} m
          </text>
          <path
            d={`M ${-pad * 0.5} 0 V ${floor.length} M ${-pad * 0.65} 0 H ${-pad * 0.35} M ${-pad * 0.65} ${floor.length} H ${-pad * 0.35}`}
            className="dimension-line"
          />
          <text
            x={-pad * 0.6}
            y={floor.length / 2}
            textAnchor="middle"
            transform={`rotate(-90 ${-pad * 0.6} ${floor.length / 2})`}
            className="dimension-text"
            fontSize={fs * 0.8}
          >
            {formatNumber(floor.length, locale)} m
          </text>
          {floor.beams.map((beam) => (
            <line
              key={beam.id}
              x1={beam.axis === 'x' ? beam.position : 0}
              y1={beam.axis === 'y' ? beam.position : 0}
              x2={beam.axis === 'x' ? beam.position : floor.width}
              y2={beam.axis === 'y' ? beam.position : floor.length}
              className="beam-line"
            />
          ))}
          {floor.openings.map((opening) => (
            <g key={opening.id}>
              <rect
                x={opening.x}
                y={opening.y}
                width={opening.width}
                height={opening.length}
                className="opening-rect"
              />
              <path
                d={`M${opening.x} ${opening.y}l${opening.width} ${opening.length}m0 ${-opening.length}l${-opening.width} ${opening.length}`}
                className="opening-cross"
              />
              <text
                x={opening.x + opening.width / 2}
                y={opening.y + opening.length / 2}
                fontSize={fs * 0.6}
                textAnchor="middle"
                className="dimension-text"
              >
                {t('opening')}
              </text>
            </g>
          ))}
          {floor.segments.map((segment) => (
            <g
              key={segment.id}
              transform={`translate(${segment.x} ${segment.y}) rotate(${segment.rotation})`}
              role="button"
              tabIndex={0}
              aria-label={segment.name}
              aria-pressed={selectedSegmentId === segment.id}
              onClick={() => onSelectSegment(segment.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelectSegment(segment.id);
                }
              }}
              className="segment-plan-shape"
            >
              <rect
                x={-segment.width / 2}
                y={-segment.length / 2}
                width={segment.width}
                height={segment.length}
                fill={PALETTE[segment.color]}
                fillOpacity={segment.kind === 'zone' ? 0.15 : 0.45}
                stroke={PALETTE[segment.color]}
                strokeWidth={selectedSegmentId === segment.id ? 0.09 : 0.03}
                strokeDasharray={segment.kind === 'zone' ? '.15 .1' : undefined}
              />
              <text
                textAnchor="middle"
                y={-segment.length / 2 - fs * 0.2}
                fontSize={fs * 0.6}
                className="dimension-text"
              >
                {segment.name}
              </text>
            </g>
          ))}
          {machines.map((machine, index) => {
            const demand = machineDemand(machine);
            const selected = machine.id === selectedId;
            const invalid = placementIssues(machine, floor).length > 0;
            return (
              <g
                key={machine.id}
                transform={`translate(${machine.x} ${machine.y}) rotate(${machine.rotation})`}
                className={`machine-shape ${selected ? 'is-selected' : ''} ${invalid ? 'invalid-placement' : ''}`}
                role="button"
                tabIndex={0}
                aria-label={`${machine.name}. ${t('dragHint')}`}
                aria-pressed={selected}
                onPointerDown={(e) => {
                  const p = position(e);
                  if (!p) return;
                  e.preventDefault();
                  onSelect(machine.id);
                  e.currentTarget.focus();
                  if (machine.locked) return;
                  drag.current = { id: machine.id, dx: p.x - machine.x, dy: p.y - machine.y };
                  svg.current?.setPointerCapture(e.pointerId);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(machine.id);
                  }
                  if (e.key.toLowerCase() === 'r') {
                    e.preventDefault();
                    if (!machine.locked) onRotate(machine.id);
                  }
                  const delta: Record<string, [number, number]> = {
                    ArrowLeft: [-0.25, 0],
                    ArrowRight: [0.25, 0],
                    ArrowUp: [0, -0.25],
                    ArrowDown: [0, 0.25],
                  };
                  if (delta[e.key] && !machine.locked) {
                    e.preventDefault();
                    onMove(machine.id, machine.x + delta[e.key][0], machine.y + delta[e.key][1]);
                  }
                }}
              >
                <rect
                  x={-machine.width / 2}
                  y={-machine.length / 2}
                  width={machine.width}
                  height={machine.length}
                  rx=".08"
                  className="machine-fill"
                />
                <rect
                  x={-machine.width / 2}
                  y={-machine.length / 2}
                  width={machine.width}
                  height={machine.length}
                  rx=".08"
                  fill={`url(#${uid}-hatch)`}
                  opacity=".25"
                />
                <path
                  d={`M0 ${-machine.length / 2 + 0.1}l-.14 .2h.28Z`}
                  className="orientation-arrow"
                />
                {machine.supports.map((support, i) => (
                  <g key={support.id} transform={`translate(${support.x} ${support.y})`}>
                    <circle r={fs * 0.15} className="support-dot" />
                    {showForces && (
                      <text
                        y={-fs * 0.35}
                        textAnchor="middle"
                        fontSize={fs * 0.52}
                        className="force-label"
                      >
                        {formatNumber(demand.reactions[i], locale)} kN
                      </text>
                    )}
                  </g>
                ))}
                <text
                  x="0"
                  y={fs * 0.02}
                  textAnchor="middle"
                  fontSize={Math.min(fs * 0.75, machine.width / 4)}
                  className="machine-number"
                >
                  M{String(index + 1).padStart(2, '0')}
                </text>
                <text
                  x="0"
                  y={fs * 0.62}
                  textAnchor="middle"
                  fontSize={Math.min(fs * 0.53, machine.width / 7)}
                  className="machine-force"
                >
                  {formatNumber(demand.force, locale)} kN
                </text>
              </g>
            );
          })}
          <text x="0" y={floor.length + pad * 0.65} fontSize={fs * 0.65} className="dimension-text">
            0,0
          </text>
          <text
            x={floor.width}
            y={floor.length + pad * 0.65}
            textAnchor="end"
            fontSize={fs * 0.65}
            className="dimension-text"
          >
            X →
          </text>
        </svg>
        <div className="plan-controls">
          <button
            aria-label={t('zoomOut')}
            title={t('zoomOut')}
            onClick={() => setZoom((z) => Math.max(0.65, z - 0.2))}
          >
            <Minus size={17} />
          </button>
          <span dir="ltr">{Math.round(zoom * 100)}%</span>
          <button
            aria-label={t('zoomIn')}
            title={t('zoomIn')}
            onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
          >
            <Plus size={17} />
          </button>
          <span className="divider" />
          <button aria-label={t('resetView')} title={t('resetView')} onClick={() => setZoom(1)}>
            <Maximize2 size={17} />
          </button>
          <button aria-label={t('rotate')} title={t('rotate')} onClick={() => onRotate(selectedId)}>
            <RotateCw size={17} />
          </button>
        </div>
      </div>
      <div className="plan-footer">
        <div className="legend">
          <span>
            <i className="legend-machine" />
            {t('footprint')}
          </span>
          <span>
            <i className="legend-dot" />
            {t('supportPoints')}
          </span>
        </div>
        <label className="inline-check">
          <input type="checkbox" checked={snap} onChange={(e) => setSnap(e.target.checked)} />
          {t('snap')}
        </label>
      </div>
      <div className="plan-note">
        {t('dragHint')}
        <span>{t('schematic')}</span>
      </div>
    </section>
  );
}
