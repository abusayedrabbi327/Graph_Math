import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Eye, EyeOff, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import type { Equation, Variables, GraphSettings, ViewMode } from '../types';
import type { AppTheme } from '../theme';

const EQUATION_COLORS = [
  '#6366f1', '#22d3ee', '#f97316', '#a78bfa',
  '#10b981', '#f43f5e', '#facc15', '#e879f9',
];

const PRESETS_2D = [
  { label: 'sin(x)', expr: 'sin(x)' },
  { label: 'cos(x)', expr: 'cos(x)' },
  { label: 'x²', expr: 'x^2' },
  { label: 'x³−3x', expr: 'x^3 - 3*x' },
  { label: 'eˣ', expr: 'e^(x/2)' },
  { label: 'ln|x|', expr: 'log(abs(x))' },
  { label: '|x|', expr: 'abs(x)' },
  { label: '1/x', expr: '1/x' },
];

const PRESETS_3D = [
  { label: 'Wave', expr: 'sin(x)*cos(y)' },
  { label: 'Paraboloid', expr: '(x^2+y^2)/4' },
  { label: 'Saddle', expr: '(x^2-y^2)/4' },
  { label: 'Ripple', expr: 'sin(sqrt(x^2+y^2))' },
  { label: 'Gaussian', expr: '3*e^(-(x^2+y^2)/4)' },
  { label: 'Cos Sum', expr: 'cos(x)+cos(y)' },
];

// ── Color Picker Popover ────────────────────────────────────────────────────
function ColorPicker({
  color, onChange, theme,
}: { color: string; onChange: (c: string) => void; theme: AppTheme }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen(!open)}
        title="Change color"
        style={{
          width: 16, height: 16, borderRadius: '50%',
          background: color,
          border: `2px solid ${color}55`,
          cursor: 'pointer',
          boxShadow: `0 0 8px ${color}88`,
          outline: 'none',
          transition: 'box-shadow 0.15s',
          display: 'block',
        }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 0 14px ${color}`)}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = `0 0 8px ${color}88`)}
      />
      {open && (
        <div
          className="absolute z-50 rounded-lg p-2 grid"
          style={{
            top: 22, left: 0,
            background: theme.bgPanel,
            border: `1px solid ${theme.borderLight}`,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 5,
          }}
        >
          {EQUATION_COLORS.map(c => (
            <button
              key={c}
              onClick={() => { onChange(c); setOpen(false); }}
              style={{
                width: 20, height: 20, borderRadius: '50%',
                background: c,
                border: c === color ? `2px solid #fff` : '2px solid transparent',
                cursor: 'pointer',
                outline: 'none',
                boxShadow: c === color ? `0 0 8px ${c}` : 'none',
                transition: 'transform 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.2)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Collapsible Section ─────────────────────────────────────────────────────
function Section({ title, children, defaultOpen = true, theme }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean; theme: AppTheme;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: `1px solid ${theme.border}` }}>
      <button
        className="flex items-center justify-between w-full px-4 py-2.5"
        onClick={() => setOpen(!open)}
        style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
      >
        <span style={{
          fontSize: '10px', fontWeight: 700, color: theme.textMuted,
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          {title}
        </span>
        {open
          ? <ChevronUp size={11} style={{ color: theme.textMuted }} />
          : <ChevronDown size={11} style={{ color: theme.textMuted }} />
        }
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  );
}

// ── Toggle Switch ───────────────────────────────────────────────────────────
function Toggle({ checked, onChange, label, theme }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; theme: AppTheme;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer" style={{ userSelect: 'none' }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          position: 'relative',
          width: 30, height: 17,
          borderRadius: 9,
          background: checked ? '#6366f1' : theme.bgInput,
          border: `1px solid ${checked ? '#6366f1' : theme.borderLight}`,
          cursor: 'pointer',
          transition: 'background 0.18s, border-color 0.18s',
          flexShrink: 0,
          boxShadow: checked ? '0 0 10px rgba(99,102,241,0.4)' : 'none',
        }}
      >
        <div style={{
          position: 'absolute',
          top: 2, left: checked ? 14 : 2,
          width: 11, height: 11,
          borderRadius: '50%',
          background: checked ? '#fff' : theme.textMuted,
          transition: 'left 0.18s, background 0.18s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }} />
      </div>
      <span style={{ fontSize: '12px', color: checked ? theme.textSecondary : theme.textMuted }}>
        {label}
      </span>
    </label>
  );
}

// ── Custom Slider ───────────────────────────────────────────────────────────
function GradientSlider({ value, min, max, step, onChange, color = '#6366f1' }: {
  value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; color?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
      {/* Track */}
      <div style={{
        position: 'absolute', left: 0, right: 0, height: 4,
        borderRadius: 2, background: 'rgba(255,255,255,0.07)',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          borderRadius: 2,
        }} />
      </div>
      {/* Thumb input (invisible but functional) */}
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{
          position: 'absolute', left: 0, right: 0,
          width: '100%', opacity: 0, cursor: 'pointer',
          height: 20, margin: 0,
        }}
      />
      {/* Visual thumb */}
      <div style={{
        position: 'absolute',
        left: `calc(${pct}% - 7px)`,
        width: 14, height: 14,
        borderRadius: '50%',
        background: color,
        border: '2px solid #fff',
        boxShadow: `0 0 8px ${color}99`,
        pointerEvents: 'none',
        transition: 'box-shadow 0.1s',
      }} />
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────
interface ControlPanelProps {
  equations: Equation[];
  addEquation: () => void;
  updateEquation: (id: string, updates: Partial<Equation>) => void;
  removeEquation: (id: string) => void;
  variables: Variables;
  setVariables: (v: Variables) => void;
  graphSettings: GraphSettings;
  setGraphSettings: (s: GraphSettings) => void;
  loadPreset: (expr: string) => void;
  viewMode: ViewMode;
  theme: AppTheme;
}

export function ControlPanel({
  equations, addEquation, updateEquation, removeEquation,
  variables, setVariables, graphSettings, setGraphSettings, loadPreset, viewMode, theme,
}: ControlPanelProps) {
  const presets = viewMode === '3D' ? PRESETS_3D : PRESETS_2D;
  const placeholder = viewMode === '3D' ? 'e.g. sin(x)*cos(y)' : 'e.g. sin(x), x^2';
  const [focusedId, setFocusedId] = useState<string | null>(null);

  return (
    <aside
      className="flex flex-col overflow-y-auto shrink-0"
      style={{
        width: 265,
        background: theme.bgPanel,
        borderRight: `1px solid ${theme.border}`,
        overflowX: 'hidden',
      }}
    >
      {/* ── Equations ── */}
      <Section title="Equations" theme={theme}>
        <div className="flex flex-col gap-1.5 px-3">
          {equations.map((eq, idx) => (
            <div
              key={eq.id}
              className="flex flex-col rounded-lg overflow-hidden"
              style={{
                boxShadow: `0 0 0 1px ${focusedId === eq.id ? eq.color + '66' : theme.borderLight}, inset 3px 0 0 0 ${eq.enabled ? eq.color : theme.borderLight}`,
                borderRadius: 8,
                overflow: 'hidden',
                background: theme.bgInput,
                transition: 'box-shadow 0.15s',
              }}
            >
              {/* Top row: color + input */}
              <div className="flex items-center gap-2 px-2 py-1.5">
                <ColorPicker
                  color={eq.color}
                  onChange={c => updateEquation(eq.id, { color: c })}
                  theme={theme}
                />
                <input
                  type="text"
                  value={eq.expression}
                  onChange={e => updateEquation(eq.id, { expression: e.target.value })}
                  onFocus={() => setFocusedId(eq.id)}
                  onBlur={() => setFocusedId(null)}
                  placeholder={placeholder}
                  className="flex-1 bg-transparent outline-none"
                  style={{
                    color: theme.textPrimary,
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    minWidth: 0,
                  }}
                />
                <button
                  onClick={() => updateEquation(eq.id, { enabled: !eq.enabled })}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: eq.enabled ? eq.color : theme.textDim }}
                >
                  {eq.enabled ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
                {equations.length > 1 && (
                  <button
                    onClick={() => removeEquation(eq.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: theme.textDim }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#f43f5e')}
                    onMouseLeave={e => (e.currentTarget.style.color = theme.textDim)}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
              {/* Label row */}
              <div style={{
                fontSize: '9px', color: theme.textDim,
                paddingLeft: 8, paddingBottom: 4, fontFamily: 'monospace',
              }}>
                f{idx + 1}(x{viewMode === '3D' ? ', y' : ''})
              </div>
            </div>
          ))}

          <button
            onClick={addEquation}
            className="flex items-center justify-center gap-1.5 rounded-lg mt-0.5 transition-all"
            style={{
              height: 32,
              background: 'transparent',
              border: `1px dashed ${theme.borderLight}`,
              cursor: 'pointer',
              color: theme.textMuted,
              fontSize: '12px',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#6366f1';
              e.currentTarget.style.color = '#6366f1';
              e.currentTarget.style.background = 'rgba(99,102,241,0.06)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = theme.borderLight;
              e.currentTarget.style.color = theme.textMuted;
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <Plus size={12} />
            Add equation
          </button>
        </div>
      </Section>

      {/* ── Variables ── */}
      <Section title="Variables" theme={theme}>
        <div className="flex flex-col gap-4 px-3">
          {(['a', 'b', 'c'] as (keyof Variables)[]).map(varName => {
            const colors: Record<string, string> = { a: '#6366f1', b: '#22d3ee', c: '#a78bfa' };
            const c = colors[varName];
            return (
              <div key={varName}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div style={{
                      width: 20, height: 20, borderRadius: 6,
                      background: `${c}22`,
                      border: `1px solid ${c}44`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', color: c, fontFamily: 'monospace', fontWeight: 700,
                    }}>
                      {varName}
                    </div>
                    <span style={{ fontSize: '11px', color: theme.textMuted }}>slider</span>
                  </div>
                  <span style={{
                    fontSize: '12px', color: c, fontFamily: 'monospace', fontWeight: 600,
                    background: `${c}18`, border: `1px solid ${c}30`,
                    padding: '1px 7px', borderRadius: 6,
                  }}>
                    {variables[varName].toFixed(2)}
                  </span>
                </div>
                <GradientSlider
                  value={variables[varName]}
                  min={-5} max={5} step={0.01}
                  onChange={v => setVariables({ ...variables, [varName]: v })}
                  color={c}
                />
                <div className="flex justify-between mt-1">
                  <span style={{ fontSize: '9px', color: theme.textDim }}>−5</span>
                  <span style={{ fontSize: '9px', color: theme.textDim }}>5</span>
                </div>
              </div>
            );
          })}
          <button
            onClick={() => setVariables({ a: 1, b: 1, c: 0 })}
            className="flex items-center justify-center gap-1.5 rounded-lg transition-colors"
            style={{
              height: 30,
              background: theme.bgInput,
              border: `1px solid ${theme.borderLight}`,
              cursor: 'pointer',
              color: theme.textMuted,
              fontSize: '11px',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#a5b4fc'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = theme.borderLight; e.currentTarget.style.color = theme.textMuted; }}
          >
            <RotateCcw size={11} />
            Reset to defaults
          </button>
        </div>
      </Section>

      {/* ── Settings ── */}
      <Section title="Graph Settings" theme={theme}>
        <div className="flex flex-col gap-3 px-3">
          <Toggle checked={graphSettings.showGrid} onChange={v => setGraphSettings({ ...graphSettings, showGrid: v })} label="Grid lines" theme={theme} />
          <Toggle checked={graphSettings.showAxes} onChange={v => setGraphSettings({ ...graphSettings, showAxes: v })} label="Show axes" theme={theme} />
          <Toggle checked={graphSettings.showLabels} onChange={v => setGraphSettings({ ...graphSettings, showLabels: v })} label="Axis labels" theme={theme} />
          {(viewMode === '3D' || viewMode === 'split') && (
            <Toggle checked={graphSettings.autoRotate} onChange={v => setGraphSettings({ ...graphSettings, autoRotate: v })} label="Auto rotate (3D)" theme={theme} />
          )}
        </div>
      </Section>

      {/* ── Presets ── */}
      <Section title="Quick Presets" theme={theme}>
        <div className="px-3">
          <div className="flex flex-wrap gap-1.5">
            {presets.map(p => (
              <button
                key={p.label}
                onClick={() => loadPreset(p.expr)}
                className="rounded-md transition-all"
                style={{
                  padding: '4px 9px',
                  background: theme.bgInput,
                  border: `1px solid ${theme.borderLight}`,
                  cursor: 'pointer',
                  color: theme.textSecondary,
                  fontSize: '11px',
                  fontFamily: 'monospace',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#6366f1';
                  e.currentTarget.style.color = '#a5b4fc';
                  e.currentTarget.style.background = 'rgba(99,102,241,0.08)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = theme.borderLight;
                  e.currentTarget.style.color = theme.textSecondary;
                  e.currentTarget.style.background = theme.bgInput;
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <div className="flex-1" />

      {/* Footer */}
      <div className="px-4 py-3 flex items-start gap-2" style={{ borderTop: `1px solid ${theme.border}` }}>
        <div
          className="rounded"
          style={{
            width: 3, height: 28, flexShrink: 0, marginTop: 2,
            background: 'linear-gradient(to bottom, #6366f1, #22d3ee)',
            borderRadius: 2,
          }}
        />
        <p style={{ fontSize: '10px', color: theme.textDim, lineHeight: 1.6 }}>
          Supports mathjs syntax:{' '}
          <span style={{ color: theme.textMuted, fontFamily: 'monospace' }}>
            sin cos sqrt abs log e pi
          </span>
          <br />
          Use{' '}
          <span style={{ color: '#a5b4fc', fontFamily: 'monospace' }}>a b c</span>
          {' '}as slider variables
        </p>
      </div>
    </aside>
  );
}