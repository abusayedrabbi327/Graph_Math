import React from 'react';
import { BarChart3 } from 'lucide-react';
import { Graph2D } from './Graph2D';
import { Graph3D } from './Graph3D';
import type { Equation, Variables, GraphSettings, ViewMode } from '../types';
import type { AppTheme } from '../theme';

interface GraphDisplayProps {
  viewMode: ViewMode;
  equations: Equation[];
  variables: Variables;
  graphSettings: GraphSettings;
  theme: AppTheme;
}

// Badge shown in split view corners
function ViewBadge({ label, color, theme }: { label: string; color: string; theme: AppTheme }) {
  return (
    <div
      className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
      style={{
        background: theme.bgPanel + 'ee',
        border: `1px solid ${color}40`,
        backdropFilter: 'blur(4px)',
        fontSize: '11px',
        color,
        fontWeight: 600,
        letterSpacing: '0.04em',
      }}
    >
      {label}
    </div>
  );
}

// Shown when all equations are empty
function EmptyState({ theme, viewMode }: { theme: AppTheme; viewMode: ViewMode }) {
  const is3D = viewMode === '3D';
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none"
      style={{ zIndex: 5 }}
    >
      <div
        className="flex flex-col items-center gap-4"
        style={{
          background: theme.bgPanel + '99',
          border: `1px solid ${theme.borderLight}`,
          borderRadius: 20,
          padding: '32px 40px',
          backdropFilter: 'blur(12px)',
          maxWidth: 320,
          textAlign: 'center',
        }}
      >
        <div
          className="flex items-center justify-center rounded-2xl"
          style={{
            width: 56, height: 56,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(34,211,238,0.2))',
            border: '1px solid rgba(99,102,241,0.3)',
          }}
        >
          <BarChart3 size={26} style={{ color: '#6366f1' }} />
        </div>
        <div>
          <div style={{ fontSize: '15px', color: theme.textPrimary, fontWeight: 500, marginBottom: 6 }}>
            No equations yet
          </div>
          <div style={{ fontSize: '12px', color: theme.textMuted, lineHeight: 1.6 }}>
            {is3D
              ? 'Enter a 3D expression using x and y, like sin(x)*cos(y)'
              : 'Type an equation in the panel to the left, like sin(x) or x²'}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-center">
          {(is3D
            ? ['sin(x)*cos(y)', '(x²+y²)/4', 'cos(x)+cos(y)']
            : ['sin(x)', 'x²', 'e^(-x²/2)']
          ).map(expr => (
            <span
              key={expr}
              className="px-2 py-1 rounded"
              style={{
                background: 'rgba(99,102,241,0.12)',
                border: '1px solid rgba(99,102,241,0.2)',
                fontSize: '11px',
                color: '#a5b4fc',
                fontFamily: 'monospace',
              }}
            >
              {expr}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function GraphDisplay({ viewMode, equations, variables, graphSettings, theme }: GraphDisplayProps) {
  const { showGrid, showAxes, showLabels, autoRotate } = graphSettings;
  const hasContent = equations.some(e => e.enabled && e.expression.trim());

  if (viewMode === '2D') {
    return (
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        {!hasContent && <EmptyState theme={theme} viewMode={viewMode} />}
        <Graph2D
          equations={equations}
          variables={variables}
          showGrid={showGrid}
          showAxes={showAxes}
          showLabels={showLabels}
          theme={theme}
        />
      </div>
    );
  }

  if (viewMode === '3D') {
    return (
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        {!hasContent && <EmptyState theme={theme} viewMode={viewMode} />}
        <Graph3D
          equations={equations}
          variables={variables}
          showGrid={showGrid}
          autoRotate={autoRotate}
          theme={theme}
        />
      </div>
    );
  }

  // Split view
  return (
    <div className="flex-1 flex overflow-hidden" style={{ minHeight: 0 }}>
      <div className="flex-1 relative overflow-hidden" style={{ borderRight: `1px solid ${theme.border}` }}>
        <ViewBadge label="2D" color="#a5b4fc" theme={theme} />
        {!hasContent && <EmptyState theme={theme} viewMode="2D" />}
        <Graph2D
          equations={equations}
          variables={variables}
          showGrid={showGrid}
          showAxes={showAxes}
          showLabels={showLabels}
          theme={theme}
        />
      </div>
      <div className="flex-1 relative overflow-hidden">
        <ViewBadge label="3D" color="#22d3ee" theme={theme} />
        {!hasContent && <EmptyState theme={theme} viewMode="3D" />}
        <Graph3D
          equations={equations}
          variables={variables}
          showGrid={showGrid}
          autoRotate={autoRotate}
          theme={theme}
        />
      </div>
    </div>
  );
}
