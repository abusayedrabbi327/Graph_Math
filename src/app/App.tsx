import React, { useState, useCallback } from 'react';
import { TopNav } from './components/TopNav';
import { ControlPanel } from './components/ControlPanel';
import { GraphDisplay } from './components/GraphDisplay';
import { BottomPanel } from './components/BottomPanel';
import type { Equation, ViewMode, Variables, GraphSettings } from './types';
import { getTheme } from './theme';

const EQUATION_COLORS = ['#6366f1', '#22d3ee', '#f97316', '#a78bfa', '#10b981', '#f43f5e'];

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('2D');
  const [equations, setEquations] = useState<Equation[]>([
    { id: '1', expression: 'sin(x)', color: EQUATION_COLORS[0], enabled: true },
  ]);
  const [variables, setVariables] = useState<Variables>({ a: 1, b: 1, c: 0 });
  const [graphSettings, setGraphSettings] = useState<GraphSettings>({
    showGrid: true,
    showAxes: true,
    showLabels: true,
    autoRotate: false,
  });
  const [bottomPanelOpen, setBottomPanelOpen] = useState(true);
  const [activeBottomTab, setActiveBottomTab] = useState<'graph' | 'explanation' | 'examples'>('explanation');
  const [darkMode, setDarkMode] = useState(true);

  const theme = getTheme(darkMode);

  const addEquation = useCallback(() => {
    const colorIndex = equations.length % EQUATION_COLORS.length;
    setEquations(prev => [
      ...prev,
      { id: String(Date.now()), expression: '', color: EQUATION_COLORS[colorIndex], enabled: true },
    ]);
  }, [equations.length]);

  const updateEquation = useCallback((id: string, updates: Partial<Equation>) => {
    setEquations(prev => prev.map(eq => (eq.id === id ? { ...eq, ...updates } : eq)));
  }, []);

  const removeEquation = useCallback((id: string) => {
    setEquations(prev => prev.filter(eq => eq.id !== id));
  }, []);

  const loadPreset = useCallback((expression: string) => {
    setEquations([{ id: String(Date.now()), expression, color: EQUATION_COLORS[0], enabled: true }]);
  }, []);

  // Search select: load preset and optionally switch view mode
  const handleSearchSelect = useCallback((expr: string, mode: '2D' | '3D') => {
    loadPreset(expr);
    // Only switch if not in split view
    if (viewMode !== 'split') {
      setViewMode(mode);
    }
  }, [loadPreset, viewMode]);

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: '100vh', background: theme.bg, color: theme.textPrimary, transition: 'background 0.2s, color 0.2s' }}
    >
      <TopNav
        viewMode={viewMode}
        setViewMode={setViewMode}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        theme={theme}
        onSearchSelect={handleSearchSelect}
      />

      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        <ControlPanel
          equations={equations}
          addEquation={addEquation}
          updateEquation={updateEquation}
          removeEquation={removeEquation}
          variables={variables}
          setVariables={setVariables}
          graphSettings={graphSettings}
          setGraphSettings={setGraphSettings}
          loadPreset={loadPreset}
          viewMode={viewMode}
          theme={theme}
        />

        <div className="flex flex-col flex-1 overflow-hidden" style={{ minWidth: 0 }}>
          <GraphDisplay
            viewMode={viewMode}
            equations={equations}
            variables={variables}
            graphSettings={graphSettings}
            theme={theme}
          />

          <BottomPanel
            isOpen={bottomPanelOpen}
            setIsOpen={setBottomPanelOpen}
            activeTab={activeBottomTab}
            setActiveTab={setActiveBottomTab}
            equations={equations}
            variables={variables}
            loadPreset={loadPreset}
            viewMode={viewMode}
            theme={theme}
          />
        </div>
      </div>
    </div>
  );
}
