export interface Preset {
  label: string;
  expr: string;
  mode: '2D' | '3D';
  category: string;
}

export const ALL_PRESETS: Preset[] = [
  // Algebra 2D
  { label: 'Linear x', expr: 'x', mode: '2D', category: 'Algebra' },
  { label: 'Quadratic x²', expr: 'x^2', mode: '2D', category: 'Algebra' },
  { label: 'Cubic x³−3x', expr: 'x^3 - 3*x', mode: '2D', category: 'Algebra' },
  { label: 'Quartic x⁴−4x²', expr: 'x^4 - 4*x^2', mode: '2D', category: 'Algebra' },
  { label: 'Absolute value |x|', expr: 'abs(x)', mode: '2D', category: 'Algebra' },
  { label: 'Reciprocal 1/x', expr: '1/x', mode: '2D', category: 'Algebra' },
  { label: 'Square root √x', expr: 'sqrt(abs(x))', mode: '2D', category: 'Algebra' },
  // Trigonometry 2D
  { label: 'Sine sin(x)', expr: 'sin(x)', mode: '2D', category: 'Trigonometry' },
  { label: 'Cosine cos(x)', expr: 'cos(x)', mode: '2D', category: 'Trigonometry' },
  { label: 'Tangent tan(x)', expr: 'tan(x)', mode: '2D', category: 'Trigonometry' },
  { label: 'Double freq sin(2x)', expr: 'sin(2*x)', mode: '2D', category: 'Trigonometry' },
  { label: 'Damped sinc sin(x)/x', expr: 'sin(x)/x', mode: '2D', category: 'Trigonometry' },
  { label: 'Sum sin+cos', expr: 'sin(x)+cos(x)', mode: '2D', category: 'Trigonometry' },
  // Exponential 2D
  { label: 'Exponential e^x', expr: 'e^(x/2)', mode: '2D', category: 'Exponential' },
  { label: 'Decay e^(-x)', expr: 'e^(-x/2)', mode: '2D', category: 'Exponential' },
  { label: 'Bell curve e^(-x²)', expr: 'e^(-(x^2)/2)', mode: '2D', category: 'Exponential' },
  { label: 'Natural log ln(x)', expr: 'log(abs(x))', mode: '2D', category: 'Logarithm' },
  // 3D Surfaces
  { label: 'Wave sin(x)cos(y)', expr: 'sin(x)*cos(y)', mode: '3D', category: '3D Surfaces' },
  { label: 'Paraboloid x²+y²', expr: '(x^2+y^2)/4', mode: '3D', category: '3D Surfaces' },
  { label: 'Saddle x²−y²', expr: '(x^2-y^2)/4', mode: '3D', category: '3D Surfaces' },
  { label: 'Ripple sin(√(x²+y²))', expr: 'sin(sqrt(x^2+y^2))', mode: '3D', category: '3D Surfaces' },
  { label: 'Gaussian bell surface', expr: '3*e^(-(x^2+y^2)/4)', mode: '3D', category: '3D Surfaces' },
  { label: 'Cosine sum cos(x)+cos(y)', expr: 'cos(x)+cos(y)', mode: '3D', category: '3D Surfaces' },
  { label: 'Hyperbolic xy', expr: 'x*y/4', mode: '3D', category: '3D Surfaces' },
  { label: 'Twisted wave', expr: 'sin(x+y)*cos(x-y)/2', mode: '3D', category: '3D Surfaces' },
];
