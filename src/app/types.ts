export interface Equation {
  id: string;
  expression: string;
  color: string;
  enabled: boolean;
}

export type ViewMode = '2D' | '3D' | 'split';

export interface Variables {
  a: number;
  b: number;
  c: number;
}

export interface GraphSettings {
  showGrid: boolean;
  showAxes: boolean;
  showLabels: boolean;
  autoRotate: boolean;
}
