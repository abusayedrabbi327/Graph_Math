export const darkTheme = {
  bg: '#0a0a0f',
  bgPanel: '#0d0d14',
  bgInput: '#141420',
  border: '#1a1a2e',
  borderLight: '#1e1e2e',
  textPrimary: '#e2e8f0',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  textDim: '#334155',
  accent: '#6366f1',
  accentCyan: '#22d3ee',
  // Canvas
  canvasBg: '#0a0a0f',
  gridLine: 'rgba(99,102,241,0.08)',
  axisLine: 'rgba(255,255,255,0.22)',
  axisLabel: 'rgba(180,185,210,0.55)',
};

export const lightTheme = {
  bg: '#f4f7ff',
  bgPanel: '#edf0fc',
  bgInput: '#e3e8f8',
  border: '#c8d0e8',
  borderLight: '#d1d8f0',
  textPrimary: '#1e293b',
  textSecondary: '#475569',
  textMuted: '#64748b',
  textDim: '#94a3b8',
  accent: '#6366f1',
  accentCyan: '#0891b2',
  // Canvas
  canvasBg: '#f4f7ff',
  gridLine: 'rgba(99,102,241,0.12)',
  axisLine: 'rgba(15,23,42,0.25)',
  axisLabel: 'rgba(51,65,85,0.7)',
};

export type AppTheme = typeof darkTheme;
export const getTheme = (dark: boolean): AppTheme => (dark ? darkTheme : lightTheme);
