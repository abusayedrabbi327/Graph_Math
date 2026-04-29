import React, { useEffect, useMemo, useRef } from 'react';
import type { Equation, Variables } from '../types';
import type { AppTheme } from '../theme';

interface Graph2DProps {
  equations: Equation[];
  variables: Variables;
  showGrid: boolean;
  showAxes: boolean;
  showLabels: boolean;
  theme: AppTheme;
}

const DESMOS_API_KEY = (import.meta.env as any).VITE_DESMOS_API_KEY || 'd0314ed8ad9d4448b9a1abd65b8ef28f';
const DESMOS_SCRIPT_URL = `https://www.desmos.com/api/v1.11/calculator.js?apiKey=${DESMOS_API_KEY}`;

type DesmosCalculator = {
  destroy: () => void;
  resize: () => void;
  setExpression: (expr: Record<string, unknown>) => void;
  removeExpression: (expr: { id: string }) => void;
  updateSettings: (settings: Record<string, unknown>) => void;
  setBlank: () => void;
};

declare global {
  interface Window {
    Desmos?: {
      GraphingCalculator: (elt: HTMLElement, options?: Record<string, unknown>) => DesmosCalculator;
    };
  }
}

function loadDesmosScript(): Promise<void> {
  if (window.Desmos) {
    return Promise.resolve();
  }
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${DESMOS_SCRIPT_URL}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      if (window.Desmos) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Desmos API script.')), { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = DESMOS_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Desmos API script.'));
    document.head.appendChild(script);
  });
}

function toAxisVisibility(showGrid: boolean, showAxes: boolean) {
  if (!showGrid && !showAxes) return false;
  return true;
}

function isDarkCanvas(hex: string): boolean {
  const match = hex.trim().match(/^#([\da-fA-F]{6})$/);
  if (!match) return true;
  const r = parseInt(match[1].slice(0, 2), 16) / 255;
  const g = parseInt(match[1].slice(2, 4), 16) / 255;
  const b = parseInt(match[1].slice(4, 6), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance < 0.5;
}

export function Graph2D({ equations, variables, showGrid, showAxes, showLabels, theme }: Graph2DProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const calculatorRef = useRef<DesmosCalculator | null>(null);
  const mountedRef = useRef(true);

  const activeEquations = useMemo(
    () => equations.filter(eq => eq.enabled && eq.expression.trim().length > 0),
    [equations],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        await loadDesmosScript();
        if (cancelled || !mountedRef.current || !hostRef.current || !window.Desmos) {
          return;
        }

        const calc = window.Desmos.GraphingCalculator(hostRef.current, {
          expressions: false,
          settingsMenu: false,
          zoomButtons: false,
          keypad: false,
          border: false,
        });

        calculatorRef.current = calc;
        calc.resize();
      } catch {
        // If Desmos fails to load, the panel remains blank instead of crashing the app.
      }
    };

    void init();

    return () => {
      cancelled = true;
      if (calculatorRef.current) {
        calculatorRef.current.destroy();
        calculatorRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const calculator = calculatorRef.current;
    if (!calculator) return;

    calculator.setExpression({ id: 'var_a', latex: `a=${variables.a}` });
    calculator.setExpression({ id: 'var_b', latex: `b=${variables.b}` });
    calculator.setExpression({ id: 'var_c', latex: `c=${variables.c}` });
  }, [variables]);

  useEffect(() => {
    const calculator = calculatorRef.current;
    if (!calculator) return;

    calculator.updateSettings({
      showGrid,
      xAxisNumbers: showLabels,
      yAxisNumbers: showLabels,
      graphpaper: toAxisVisibility(showGrid, showAxes),
      invertedColors: isDarkCanvas(theme.canvasBg),
    });
  }, [showGrid, showAxes, showLabels, theme.canvasBg]);

  useEffect(() => {
    const calculator = calculatorRef.current;
    if (!calculator) return;

    try {
      calculator.setBlank();
      calculator.setExpression({ id: 'var_a', latex: `a=${variables.a}` });
      calculator.setExpression({ id: 'var_b', latex: `b=${variables.b}` });
      calculator.setExpression({ id: 'var_c', latex: `c=${variables.c}` });

      for (const eq of activeEquations) {
        if (eq.expression.trim()) {
          calculator.setExpression({
            id: `eq_${eq.id}`,
            latex: `y=${eq.expression}`,
            color: eq.color,
            hidden: false,
          });
        }
      }
    } catch (error) {
      console.error('Error setting Desmos expressions:', error);
    }
  }, [activeEquations, variables]);

  return (
    <div className="w-full h-full relative overflow-hidden" style={{ background: theme.canvasBg }}>
      <div ref={hostRef} className="absolute inset-0" />
      <div
        className="absolute bottom-3 left-3 select-none pointer-events-none"
        style={{ fontSize: '11px', color: theme.textDim }}
      >
        Drag to pan · Scroll to zoom
      </div>
    </div>
  );
}
