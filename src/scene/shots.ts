import { DISTRICTS, project } from '../types';
import type { Project, SceneMode } from '../types';
import type { CityData } from './geo';

export interface ViewState {
  tx: number;
  tz: number;
  /** look-at height */
  ty: number;
  dist: number;
  /** degrees; 0 = camera south of target looking north */
  az: number;
  /** degrees from vertical */
  polar: number;
  /** radius of the line focus fade, metres */
  rad: number;
}

export interface Shot extends ViewState {
  mode: SceneMode;
  /** idle azimuth drift, deg/s */
  drift: number;
  /** onboarding only: horizontal composition offset as a fraction of width */
  offFrac?: number;
}

export interface Interaction {
  dragging: boolean;
  moved: number;
  lastTouch: number;
}

export const deg = Math.PI / 180;
const NO_FADE = 400000;

export function panelWidth(vw: number): number {
  return Math.min(720, Math.max(520, vw * 0.44));
}

/** horizontal view-offset in px (negative shifts the city to the right) */
export function viewOffsetX(mode: SceneMode, w: number, offFrac = 0.225): number {
  return mode === 'onboarding' ? -offFrac * w : -panelWidth(w) / 2;
}

export const DISTRICT_POS = DISTRICTS.map((d) => ({ id: d.id, name: d.name, ...project(d.lat, d.lon) }));

function bounds(pts: { x: number; z: number }[]) {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const p of pts) {
    x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x);
    z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z);
  }
  return { cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, w: x1 - x0, d: z1 - z0 };
}

const at = (lat: number, lon: number) => project(lat, lon);
const T = Math.tan((15 * Math.PI) / 180);

/** onboarding tour: one district per step */
function tour(step: number): Shot {
  const base = { mode: 'onboarding' as const, drift: 0.4, offFrac: 0.225 };
  const city = bounds(DISTRICT_POS);
  switch (step) {
    case 0: { const p = at(25.1972, 55.2744); return { ...base, tx: p.x, tz: p.z, ty: 260, dist: 2900, az: 168, polar: 66, rad: 2600 }; }
    case 1: { const p = at(25.1865, 55.2650); return { ...base, tx: p.x, tz: p.z, ty: 60, dist: 2500, az: 130, polar: 60, rad: 2400 }; }
    case 2: { const p = at(25.0790, 55.1400); return { ...base, tx: p.x, tz: p.z, ty: 120, dist: 2800, az: 232, polar: 61, rad: 2500 }; }
    case 3: { const p = at(25.2000, 55.3440); return { ...base, tx: p.x, tz: p.z, ty: 40, dist: 2800, az: 200, polar: 60, rad: 2500 }; }
    case 4: { const p = at(25.1095, 55.2455); return { ...base, tx: p.x, tz: p.z, ty: 20, dist: 2800, az: 150, polar: 58, rad: 2500 }; }
    case 5: return { ...base, tx: city.cx + 600, tz: city.cz + 2600, ty: 0, dist: 38000, az: 192, polar: 36, rad: NO_FADE };
    default: { const p = at(25.0965, 55.1395); return { ...base, tx: p.x, tz: p.z, ty: 30, dist: 9500, az: 228, polar: 63, rad: 7000 }; }
  }
}

/** Detail-shot azimuth with the clearest sight line to the tower top. */
export function pickAzimuth(city: CityData, p: Project, dist = 1250, polar = 44): number {
  const t = project(p.lat, p.lon);
  const H = p.heightM;
  const camH = H * 0.5 + dist * Math.cos(polar * deg);
  const hd = dist * Math.sin(polar * deg);
  const near: { x: number; z: number; h: number }[] = [];
  for (const d of Object.values(city.districts)) {
    for (const [list, off] of [[d.b, 1], [d.p ?? [], 2]] as const) {
      for (const bd of list) {
        const n = (bd.length - off) >> 1;
        let cx = 0, cz = 0;
        for (let i = 0; i < n; i++) { cx += bd[off + i * 2]; cz += bd[off + 1 + i * 2]; }
        cx = cx / n - t.x; cz = cz / n - t.z;
        if (cx * cx + cz * cz < 900 * 900 && Math.hypot(cx, cz) > 25) near.push({ x: cx, z: cz, h: bd[0] });
      }
    }
  }
  let best = 212, bestScore = Infinity;
  for (let a = 0; a < 360; a += 10) {
    const dx = Math.sin(a * deg), dz = Math.cos(a * deg);
    let score = 0;
    for (const b of near) {
      const along = b.x * dx + b.z * dz;
      if (along < 20 || along > hd) continue;
      const perp = Math.abs(b.x * dz - b.z * dx);
      if (perp > 40 + along * 0.06) continue;
      const line = H + ((camH - H) * along) / hd;
      if (b.h > line * 0.85) score += 1 + (b.h - line * 0.85) / 100;
    }
    let da = Math.abs(a - 212); if (da > 180) da = 360 - da;
    score += da / 90;
    if (score < bestScore) { bestScore = score; best = a; }
  }
  return best;
}

export function computeShot(mode: SceneMode, step: number, projects: Project[], selectedId: string | null, detailAz = 212): Shot {
  if (mode === 'detail') {
    const p = projects.find((q) => q.id === selectedId);
    if (p) {
      const { x, z } = project(p.lat, p.lon);
      return { mode, tx: x, tz: z, ty: p.heightM * 0.5, dist: 1250, az: detailAz, polar: 44, rad: 1400, drift: 0.4 };
    }
  }
  if (mode === 'results' && projects.length > 0) {
    const az = 205;
    const polar = 50;
    const a = az * deg;
    const r = { x: Math.cos(a), z: -Math.sin(a) };
    const f = { x: -Math.sin(a), z: -Math.cos(a) };
    let r0 = Infinity, r1 = -Infinity, f0 = Infinity, f1 = -Infinity;
    for (const p of projects) {
      const q = project(p.lat, p.lon);
      const pr = q.x * r.x + q.z * r.z;
      const pf = q.x * f.x + q.z * f.z;
      r0 = Math.min(r0, pr); r1 = Math.max(r1, pr); f0 = Math.min(f0, pf); f1 = Math.max(f1, pf);
    }
    const cr = (r0 + r1) / 2;
    const cf = (f0 + f1) / 2;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const visAspect = Math.max(0.5, (w - panelWidth(w)) / h);
    const spanR = Math.max(900, r1 - r0) * 1.4;
    const spanF = Math.max(900, f1 - f0) * 1.4;
    const dist = Math.max(3200, spanR / (2 * T * visAspect), (spanF * Math.cos(polar * deg)) / (2 * T));
    return {
      mode, tx: cr * r.x + cf * f.x, tz: cr * r.z + cf * f.z, ty: 0, dist, az, polar, rad: NO_FADE, drift: 0.4,
    };
  }
  return tour(Math.max(0, Math.min(6, step)));
}
