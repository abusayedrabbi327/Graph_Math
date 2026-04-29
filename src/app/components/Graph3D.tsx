import React, { useRef, useEffect, useCallback, useState } from 'react';
import * as math from 'mathjs';
import type { Equation, Variables } from '../types';
import type { AppTheme } from '../theme';

interface Graph3DProps {
  equations: Equation[];
  variables: Variables;
  showGrid: boolean;
  autoRotate: boolean;
  theme: AppTheme;
}

const GRID_N = 40;
const XY_RANGE = 4;
const Z_CLAMP = 8;
const CAMERA_DIST = 11;
const SENSITIVITY = 0.0042;
const DAMPING = 0.91;

function getMeshColor(hexColor: string, t: number): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const br = 0.18 + t * 0.82;
  return `rgba(${Math.round(r * br)},${Math.round(g * br)},${Math.round(b * br)},0.92)`;
}

interface MeshData {
  color: string;
  points: { x: number; y: number; z: number }[][];
  zMin: number;
  zMax: number;
}

/**
 * Projects a world point (wx, wy, wz) to screen coords.
 *
 * Camera model:
 *   - XY is the ground plane, Z is height (standard math convention)
 *   - azimuth : horizontal orbit angle (left/right drag)
 *   - elevation: vertical tilt 0=side view → π/2=top view (up/down drag)
 *
 * Step 1 – Rotate scene around world-Z by azimuth (spin the ground plane).
 * Step 2 – Tilt camera up by elevation (rotate around new X axis).
 * Step 3 – Perspective divide.
 */
function makeProjector(
  az: number, el: number,
  zoom: number,
  cxS: number, cyS: number, fov: number
) {
  const cosAz = Math.cos(az), sinAz = Math.sin(az);
  const cosEl = Math.cos(el), sinEl = Math.sin(el);

  return function project(wx: number, wy: number, wz: number) {
    // Step 1: azimuth rotation around Z
    const x1 = wx * cosAz + wy * sinAz;
    const y1 = -wx * sinAz + wy * cosAz;
    const z1 = wz;

    // Step 2: elevation tilt around new X axis
    const x2 = x1;
    const y2 = y1 * cosEl + z1 * sinEl;   // depth toward camera
    const z2 = -y1 * sinEl + z1 * cosEl;  // vertical on screen

    // Step 3: perspective
    const depth = y2 + CAMERA_DIST;
    if (depth < 0.05) return null;
    const sc = (fov * zoom) / depth;
    return { sx: cxS + x2 * sc, sy: cyS - z2 * sc };
  };
}

export function Graph3D({ equations, variables, showGrid, autoRotate, theme }: Graph3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const meshesRef = useRef<MeshData[]>([]);

  // Orbital camera state
  // Default: looking from the classic math-plot angle
  //   az = -π/4  →  X goes bottom-right, Y goes bottom-left
  //   el = π/5   →  ~36° above the XY plane
  const azimuthRef = useRef(-Math.PI / 4);
  const elevationRef = useRef(Math.PI / 5);
  const zoomRef = useRef(1.0);

  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const lastMouseTimeRef = useRef(0);
  const velRef = useRef({ az: 0, el: 0 });

  const autoRotateRef = useRef(autoRotate);
  const showGridRef = useRef(showGrid);
  const themeRef = useRef(theme);
  const [cursor, setCursor] = useState('grab');

  const equationsRef = useRef(equations);
  const variablesRef = useRef(variables);

  useEffect(() => { equationsRef.current = equations; }, [equations]);
  useEffect(() => { variablesRef.current = variables; }, [variables]);
  useEffect(() => { autoRotateRef.current = autoRotate; }, [autoRotate]);
  useEffect(() => { showGridRef.current = showGrid; }, [showGrid]);
  useEffect(() => { themeRef.current = theme; }, [theme]);

  // ─── Mesh computation ──────────────────────────────────────────────────────
  const computeMeshes = useCallback(() => {
    const eqs = equationsRef.current.filter(eq => eq.enabled && eq.expression.trim());
    const vars = variablesRef.current;

    meshesRef.current = eqs.flatMap(eq => {
      let compiled: math.EvalFunction;
      try { compiled = math.compile(eq.expression); }
      catch { return []; }

      const n = GRID_N;
      const points: { x: number; y: number; z: number }[][] = [];
      let zMin = Infinity, zMax = -Infinity;

      for (let ix = 0; ix < n; ix++) {
        points[ix] = [];
        for (let iy = 0; iy < n; iy++) {
          const x = -XY_RANGE + (2 * XY_RANGE * ix) / (n - 1);
          const y = -XY_RANGE + (2 * XY_RANGE * iy) / (n - 1);
          const scope = { ...vars, x, y };
          let z = 0;
          try {
            const result = compiled.evaluate(scope);
            if (typeof result === 'number') z = result;
            else if (result && typeof result === 'object' && 'im' in result) z = (result as any).re;
            if (!isFinite(z) || isNaN(z)) z = 0;
            z = Math.max(-Z_CLAMP, Math.min(Z_CLAMP, z));
          } catch { z = 0; }
          if (z < zMin) zMin = z;
          if (z > zMax) zMax = z;
          points[ix][iy] = { x, y, z };
        }
      }
      return [{ color: eq.color, points, zMin, zMax }];
    });
  }, []);

  useEffect(() => { computeMeshes(); }, [equations, variables, computeMeshes]);

  // ─── Draw ──────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    if (w === 0 || h === 0) return;

    const t = themeRef.current;
    const fov = Math.min(w, h) * 0.60;
    const project = makeProjector(
      azimuthRef.current, elevationRef.current,
      zoomRef.current, w / 2, h / 2, fov
    );

    ctx.fillStyle = t.canvasBg;
    ctx.fillRect(0, 0, w, h);

    // ── XY base grid ──
    if (showGridRef.current) {
      ctx.strokeStyle = t.gridLine;
      ctx.lineWidth = 0.6;
      const ge = XY_RANGE;
      for (let i = -ge; i <= ge; i++) {
        const a = project(i, -ge, 0); const b = project(i, ge, 0);
        const c = project(-ge, i, 0); const d = project(ge, i, 0);
        if (a && b) { ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke(); }
        if (c && d) { ctx.beginPath(); ctx.moveTo(c.sx, c.sy); ctx.lineTo(d.sx, d.sy); ctx.stroke(); }
      }
    }

    // ── Equation meshes ──
    ctx.lineWidth = 1.1;
    meshesRef.current.forEach(mesh => {
      const { color, points, zMin, zMax } = mesh;
      const zRange = zMax - zMin || 1;
      const n = GRID_N;

      // rows (constant iy)
      for (let iy = 0; iy < n; iy++) {
        let avgZ = 0;
        for (let ix = 0; ix < n; ix++) avgZ += points[ix][iy].z;
        avgZ /= n;
        const tc = (avgZ - zMin) / zRange;
        ctx.strokeStyle = getMeshColor(color, tc);
        ctx.shadowColor = color; ctx.shadowBlur = 1.5;
        ctx.beginPath();
        let moved = false;
        for (let ix = 0; ix < n; ix++) {
          const pt = points[ix][iy];
          const p = project(pt.x, pt.y, pt.z);
          if (!p) { moved = false; continue; }
          if (!moved) { ctx.moveTo(p.sx, p.sy); moved = true; }
          else ctx.lineTo(p.sx, p.sy);
        }
        ctx.stroke();
      }

      // columns (constant ix)
      for (let ix = 0; ix < n; ix++) {
        let avgZ = 0;
        for (let iy = 0; iy < n; iy++) avgZ += points[ix][iy].z;
        avgZ /= n;
        const tc = (avgZ - zMin) / zRange;
        ctx.strokeStyle = getMeshColor(color, tc);
        ctx.shadowColor = color; ctx.shadowBlur = 1.5;
        ctx.beginPath();
        let moved = false;
        for (let iy = 0; iy < n; iy++) {
          const pt = points[ix][iy];
          const p = project(pt.x, pt.y, pt.z);
          if (!p) { moved = false; continue; }
          if (!moved) { ctx.moveTo(p.sx, p.sy); moved = true; }
          else ctx.lineTo(p.sx, p.sy);
        }
        ctx.stroke();
      }
    });

    ctx.shadowBlur = 0;

    // ── Axes ──
    const A = XY_RANGE * 1.25;  // positive arm length
    const N = XY_RANGE * 0.4;   // negative arm length
    const ARROW = 12;

    const drawAxis = (
      nx: number, ny: number, nz: number,
      px: number, py: number, pz: number,
      label: string, color: string
    ) => {
      const ori = project(0, 0, 0);
      const pos = project(px, py, pz);
      const neg = project(nx, ny, nz);
      if (!ori || !pos) return;

      // Dashed negative arm
      if (neg) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.25;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 5]);
        ctx.beginPath(); ctx.moveTo(neg.sx, neg.sy); ctx.lineTo(ori.sx, ori.sy); ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // Solid positive arm with glow
      ctx.shadowColor = color;
      ctx.shadowBlur = 16;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(ori.sx, ori.sy); ctx.lineTo(pos.sx, pos.sy); ctx.stroke();

      // Arrowhead
      const angle = Math.atan2(pos.sy - ori.sy, pos.sx - ori.sx);
      ctx.fillStyle = color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(pos.sx, pos.sy);
      ctx.lineTo(pos.sx - ARROW * Math.cos(angle - Math.PI / 6), pos.sy - ARROW * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(pos.sx - ARROW * Math.cos(angle + Math.PI / 6), pos.sy - ARROW * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();

      // Label
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 8;
      ctx.fillText(label, pos.sx + 20 * Math.cos(angle), pos.sy + 20 * Math.sin(angle));
      ctx.shadowBlur = 0;
    };

    drawAxis(-N, 0, 0,  A, 0, 0,  'X', '#f87171');
    drawAxis(0, -N, 0,  0, A, 0,  'Y', '#4ade80');
    drawAxis(0, 0, -N,  0, 0, A,  'Z', '#60a5fa');

    // Origin dot
    const ori = project(0, 0, 0);
    if (ori) {
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.shadowColor = 'white'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(ori.sx, ori.sy, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
  }, []);

  // ─── Animation loop ────────────────────────────────────────────────────────
  useEffect(() => {
    let animId: number;
    let prevTime: number | null = null;

    const loop = (time: number) => {
      const dt = prevTime !== null ? Math.min((time - prevTime) / 1000, 0.05) : 0;
      prevTime = time;

      if (!isDraggingRef.current) {
        if (autoRotateRef.current) {
          azimuthRef.current += dt * 0.32;
        } else {
          const v = velRef.current;
          if (Math.abs(v.az) > 0.00004 || Math.abs(v.el) > 0.00004) {
            azimuthRef.current += v.az;
            elevationRef.current = Math.max(0.01, Math.min(Math.PI / 2 - 0.01,
              elevationRef.current + v.el));
            velRef.current.az *= DAMPING;
            velRef.current.el *= DAMPING;
          }
        }
      }

      draw();
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [draw]);

  // ─── Resize ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ro = new ResizeObserver(() => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    });
    ro.observe(container);
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    return () => ro.disconnect();
  }, []);

  // ─── Mouse handlers ────────────────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDraggingRef.current = true;
    velRef.current = { az: 0, el: 0 };
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
    lastMouseTimeRef.current = performance.now();
    setCursor('grabbing');
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;
    const now = performance.now();
    const elapsed = now - lastMouseTimeRef.current;

    // Track velocity for momentum
    if (elapsed > 0 && elapsed < 80) {
      velRef.current = {
        az: (dx / elapsed) * 16 * SENSITIVITY,
        el: (-dy / elapsed) * 16 * SENSITIVITY,   // inverted: drag up → higher elevation
      };
    }
    lastMouseTimeRef.current = now;

    // Apply rotation directly
    azimuthRef.current += dx * SENSITIVITY;
    elevationRef.current = Math.max(0.01, Math.min(Math.PI / 2 - 0.01,
      elevationRef.current - dy * SENSITIVITY));   // drag up = higher elevation

    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    setCursor('grab');
  }, []);

  // Scroll to zoom
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.92 : 1.08;
    zoomRef.current = Math.max(0.3, Math.min(4.0, zoomRef.current * factor));
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
        style={{ cursor }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
      />

      {/* Axis legend */}
      <div
        className="absolute top-3 right-3 flex items-center rounded px-2.5 py-1.5"
        style={{
          background: theme.bgInput + 'dd',
          border: `1px solid ${theme.borderLight}`,
          gap: 10,
          fontSize: '12px',
          backdropFilter: 'blur(4px)',
        }}
      >
        <span style={{ color: '#f87171', fontWeight: 700 }}>X</span>
        <span style={{ color: '#4ade80', fontWeight: 700 }}>Y</span>
        <span style={{ color: '#60a5fa', fontWeight: 700 }}>Z ↑</span>
      </div>

      {/* Hint */}
      <div
        className="absolute bottom-3 left-3 select-none pointer-events-none"
        style={{ fontSize: '11px', color: theme.textDim }}
      >
        Drag to orbit · Scroll to zoom · XY plane · Z is height
      </div>
    </div>
  );
}
