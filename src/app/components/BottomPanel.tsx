import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Play } from 'lucide-react';
import type { Equation, Variables, ViewMode } from '../types';
import type { AppTheme } from '../theme';

interface BottomPanelProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  activeTab: 'graph' | 'explanation' | 'examples';
  setActiveTab: (tab: 'graph' | 'explanation' | 'examples') => void;
  equations: Equation[];
  variables: Variables;
  loadPreset: (expr: string) => void;
  viewMode: ViewMode;
  theme: AppTheme;
}

type ExplanationData = {
  title: string;
  body: string;
  properties: Array<{ name: string; value: string }>;
  steps: string[];
  commonMistakes: string[];
  example: string;
};

function fallbackExplanation(expression: string, viewMode: ViewMode): ExplanationData {
  const expr = expression.toLowerCase().trim();

  if (!expr) return {
    title: 'No Equation',
    body: 'Enter an equation in the control panel to see its explanation here.',
    properties: [],
    steps: [],
    commonMistakes: [],
    example: '',
  };

  if ((expr.includes('sin') || expr.includes('cos')) && expr.includes('y')) return {
    title: '3D Trigonometric Surface',
    body: 'This 3D surface is defined by trigonometric functions of both x and y. Combined oscillations create wave-like ripples across the surface with periodic peaks and valleys.',
    properties: [{ name: 'Type', value: '3D Surface' }, { name: 'Character', value: 'Doubly periodic' }],
    steps: ['Identify variables x and y.', 'Recognize periodic behavior from sine/cosine.', 'Observe peaks and valleys across the grid.'],
    commonMistakes: ['Confusing z=f(x,y) with y=f(x).'],
    example: 'z = sin(x)*cos(y)',
  };

  if (expr.includes('sin') && !expr.includes('tan')) return {
    title: 'Sine Function',
    body: 'The sine function oscillates smoothly between -1 and +1 with period 2pi. It describes repeating wave behavior.',
    properties: [
      { name: 'Type', value: 'Trigonometric' }, { name: 'Period', value: '2pi' },
      { name: 'Range', value: '[-1, 1]' }, { name: 'Domain', value: 'All real numbers' },
    ],
    steps: ['Find the period.', 'Check amplitude.', 'Locate intercepts.', 'Track repeating cycles.'],
    commonMistakes: ['Forgetting the period changes when x has a coefficient.'],
    example: 'y = sin(2x)',
  };

  return {
    title: 'Mathematical Expression',
    body: 'This function defines a relationship between variables. Use the graph and sliders to see how changes affect shape and intercepts.',
    properties: [{ name: 'Type', value: viewMode === '3D' ? '3D Surface' : 'General function' }],
    steps: ['Identify the function family.', 'Check domain/range behavior.', 'Use sliders to test transformations.'],
    commonMistakes: ['Not checking where the function is undefined.'],
    example: expression,
  };
}

const EXAMPLES_2D = [
  {
    category: 'Algebra',
    items: [
      { label: 'x', expr: 'x' }, { label: 'x²', expr: 'x^2' }, { label: 'x³−3x', expr: 'x^3 - 3*x' },
      { label: 'x⁴−4x²', expr: 'x^4 - 4*x^2' }, { label: '|x|', expr: 'abs(x)' },
      { label: '1/x', expr: '1/x' }, { label: '√x', expr: 'sqrt(abs(x))' },
    ],
  },
  {
    category: 'Trigonometry',
    items: [
      { label: 'sin(x)', expr: 'sin(x)' }, { label: 'cos(x)', expr: 'cos(x)' },
      { label: 'tan(x)', expr: 'tan(x)' }, { label: 'sin(2x)', expr: 'sin(2*x)' },
      { label: 'sinc', expr: 'sin(x)/x' }, { label: 'sin+cos', expr: 'sin(x)+cos(x)' },
    ],
  },
  {
    category: 'Exponential & Log',
    items: [
      { label: 'eˣ', expr: 'e^(x/2)' }, { label: 'e⁻ˣ', expr: 'e^(-x/2)' },
      { label: 'Bell', expr: 'e^(-(x^2)/2)' }, { label: 'ln|x|', expr: 'log(abs(x))' },
    ],
  },
  {
    category: 'With Parameters',
    items: [{ label: 'a·sin(bx+c)', expr: 'a*sin(b*x+c)' }, { label: 'ax²+bx+c', expr: 'a*x^2+b*x+c' }],
  },
];

const EXAMPLES_3D = [
  {
    category: '3D Surfaces',
    items: [
      { label: 'Wave', expr: 'sin(x)*cos(y)' }, { label: 'Paraboloid', expr: '(x^2+y^2)/4' },
      { label: 'Saddle', expr: '(x^2-y^2)/4' }, { label: 'Ripple', expr: 'sin(sqrt(x^2+y^2))' },
      { label: 'Gaussian', expr: '3*e^(-(x^2+y^2)/4)' }, { label: 'Cosine Sum', expr: 'cos(x)+cos(y)' },
      { label: 'Hyperbolic', expr: 'x*y/4' }, { label: 'Twisted', expr: 'sin(x+y)*cos(x-y)/2' },
    ],
  },
];

export function BottomPanel({
  isOpen, setIsOpen, activeTab, setActiveTab, equations, variables, loadPreset, viewMode, theme,
}: BottomPanelProps) {
  const activeEq = useMemo(() => equations.find(e => e.enabled && e.expression.trim()), [equations]);
  const fallback = useMemo(
    () => fallbackExplanation(activeEq?.expression || '', viewMode),
    [activeEq?.expression, viewMode],
  );

  const [aiExplanation, setAiExplanation] = useState<ExplanationData | null>(null);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [explanationError, setExplanationError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || activeTab !== 'explanation') {
      return;
    }

    const expression = activeEq?.expression?.trim() || '';
    if (!expression) {
      setAiExplanation(null);
      setExplanationError(null);
      setIsLoadingExplanation(false);
      return;
    }

    const controller = new AbortController();

    const fetchExplanation = async () => {
      setIsLoadingExplanation(true);
      setExplanationError(null);
      try {
        const response = await fetch('/api/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expression, viewMode, variables }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || 'AI explanation request failed.');
        }

        const data = await response.json();
        setAiExplanation({
          title: String(data.title || fallback.title),
          body: String(data.body || fallback.body),
          properties: Array.isArray(data.properties) ? data.properties : fallback.properties,
          steps: Array.isArray(data.steps) ? data.steps : [],
          commonMistakes: Array.isArray(data.commonMistakes) ? data.commonMistakes : [],
          example: String(data.example || ''),
        });
      } catch (error) {
        if (!controller.signal.aborted) {
          setExplanationError(String(error));
          setAiExplanation(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingExplanation(false);
        }
      }
    };

    void fetchExplanation();

    return () => {
      controller.abort();
    };
  }, [activeEq?.expression, activeTab, fallback.body, fallback.properties, fallback.title, isOpen, variables, viewMode]);

  const explanation = aiExplanation ?? fallback;
  const examples = viewMode === '3D' ? EXAMPLES_3D : EXAMPLES_2D;

  const tabs = [
    { key: 'graph' as const, label: 'Graph Info' },
    { key: 'explanation' as const, label: 'Explanation' },
    { key: 'examples' as const, label: 'Examples' },
  ];

  return (
    <div style={{
      background: theme.bgPanel,
      borderTop: `1px solid ${theme.border}`,
      transition: 'height 0.22s cubic-bezier(0.4,0,0.2,1)',
      height: isOpen ? 220 : 40,
      overflow: 'hidden',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    }}>
      {/* Top gradient accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent 0%, #6366f1 30%, #22d3ee 60%, transparent 100%)',
        opacity: 0.3,
      }} />
      {/* Tab Bar */}
      <div className="flex items-center px-4 shrink-0"
        style={{ height: 40, borderBottom: isOpen ? `1px solid ${theme.border}` : 'none', gap: 0 }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => { if (!isOpen) setIsOpen(true); setActiveTab(tab.key); }}
            className="px-4 transition-colors relative"
            style={{
              height: 40, background: 'none', border: 'none', cursor: 'pointer',
              color: activeTab === tab.key && isOpen ? theme.textPrimary : theme.textMuted,
              fontSize: '12px',
              fontWeight: activeTab === tab.key && isOpen ? 500 : 400,
            }}
          >
            {tab.label}
            {activeTab === tab.key && isOpen && (
              <div className="absolute bottom-0 left-4 right-4 rounded-t"
                style={{ height: 2, background: theme.accent }} />
            )}
          </button>
        ))}

        <div className="flex-1" />

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center rounded"
          style={{ width: 28, height: 28, background: 'transparent', border: `1px solid ${theme.borderLight}`, cursor: 'pointer', color: theme.textMuted }}
        >
          {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {/* Content */}
      {isOpen && (
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3">
          {/* Graph Info */}
          {activeTab === 'graph' && (
            <div className="flex gap-6">
              {/* Equations list */}
              <div className="flex flex-col gap-2" style={{ minWidth: 200 }}>
                <div style={{ fontSize: '10px', color: theme.textDim, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>
                  Active Equations
                </div>
                {equations.map((eq, i) => (
                  <div key={eq.id}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2"
                    style={{
                      background: eq.enabled ? `${eq.color}12` : theme.bgInput,
                      border: `1px solid ${eq.enabled ? eq.color + '35' : theme.borderLight}`,
                      opacity: eq.enabled ? 1 : 0.4,
                    }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: eq.color, flexShrink: 0,
                      boxShadow: eq.enabled ? `0 0 8px ${eq.color}` : 'none',
                    }} />
                    <span style={{ fontSize: '11px', color: theme.textDim, fontFamily: 'monospace', flexShrink: 0 }}>
                      f{i + 1} =
                    </span>
                    <span style={{ fontSize: '12px', color: theme.textPrimary, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {eq.expression || '(empty)'}
                    </span>
                  </div>
                ))}
              </div>
              {/* Properties */}
              {activeEq && explanation.properties.length > 0 && (
                <div>
                  <div style={{ fontSize: '10px', color: theme.textDim, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                    Properties
                  </div>
                  <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(2, auto)' }}>
                    {explanation.properties.map(p => (
                      <div key={p.name} className="flex items-center gap-2 rounded-lg px-3 py-1.5"
                        style={{ background: theme.bgInput, border: `1px solid ${theme.borderLight}` }}>
                        <span style={{ fontSize: '10px', color: theme.textDim }}>{p.name}</span>
                        <span style={{ fontSize: '11px', color: '#a5b4fc', fontFamily: 'monospace', fontWeight: 500 }}>{p.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Explanation */}
          {activeTab === 'explanation' && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 style={{ fontSize: '13px', color: theme.textPrimary, fontWeight: 500 }}>{explanation.title}</h3>
                {activeEq && (
                  <span className="px-2 py-0.5 rounded"
                    style={{ fontSize: '10px', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', fontFamily: 'monospace' }}>
                    {activeEq.expression}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '12px', color: theme.textMuted, lineHeight: 1.7, maxWidth: 700 }}>{explanation.body}</p>

              {isLoadingExplanation && (
                <div style={{ marginTop: 10, fontSize: '11px', color: theme.textDim }}>
                  Generating AI explanation...
                </div>
              )}

              {explanationError && (
                <div style={{ marginTop: 10, fontSize: '11px', color: '#fda4af' }}>
                  AI unavailable right now. Showing local explanation.
                </div>
              )}

              {explanation.properties.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-3">
                  {explanation.properties.map(p => (
                    <div key={p.name} className="flex items-center gap-1.5">
                      <span style={{ fontSize: '11px', color: theme.textDim }}>{p.name}</span>
                      <span className="px-1.5 py-0.5 rounded"
                        style={{ fontSize: '11px', color: theme.textSecondary, background: theme.bgInput, border: `1px solid ${theme.borderLight}`, fontFamily: 'monospace' }}>
                        {p.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {explanation.steps.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: '10px', color: theme.textDim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                    Steps
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {explanation.steps.map((step, idx) => (
                      <div key={idx} style={{ fontSize: '12px', color: theme.textSecondary }}>
                        {idx + 1}. {step}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {explanation.commonMistakes.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: '10px', color: theme.textDim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                    Common Mistakes
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {explanation.commonMistakes.map((item, idx) => (
                      <div key={idx} style={{ fontSize: '12px', color: theme.textSecondary }}>
                        - {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {explanation.example && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: '10px', color: theme.textDim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                    Worked Example
                  </div>
                  <span className="px-2 py-1 rounded"
                    style={{ fontSize: '11px', color: '#a5b4fc', background: theme.bgInput, border: `1px solid ${theme.borderLight}`, fontFamily: 'monospace' }}>
                    {explanation.example}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Examples */}
          {activeTab === 'examples' && (
            <div className="flex flex-col gap-3">
              {examples.map(group => (
                <div key={group.category}>
                  <div style={{ fontSize: '10px', color: theme.textDim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                    {group.category}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.items.map(item => (
                      <button
                        key={item.label}
                        onClick={() => loadPreset(item.expr)}
                        className="flex items-center gap-1 rounded-md transition-all"
                        style={{
                          padding: '4px 9px', background: theme.bgInput,
                          border: `1px solid ${theme.borderLight}`, cursor: 'pointer',
                          color: theme.textSecondary, fontSize: '12px', fontFamily: 'monospace',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#a5b4fc'; e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = theme.borderLight; e.currentTarget.style.color = theme.textSecondary; e.currentTarget.style.background = theme.bgInput; }}
                      >
                        <Play size={9} />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
