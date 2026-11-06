import { DISTRICTS, project } from '../types';
import type { DistrictId, Project, SceneMode } from '../types';

export interface ViewState {
  tx: number;
  tz: number;
  dist: number;
  /** degrees; 0 = camera south of target looking north */
  az: number;
  /** degrees from vertical */
  polar: number;
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

const D2R = Math.PI / 180;
export const deg = D2R;

export function panelWidth(vw: number): number {
  return Math.min(720, Math.max(520, vw * 0.44));
}

/** horizontal view-offset in px (negative shifts the city to the right) */
export function viewOffsetX(mode: SceneMode, w: number, offFrac = 0.18): number {
  return mode === 'onboarding' ? -offFrac * w : -panelWidth(w) / 2;
}

const DPOS = DISTRICTS.map((d) => ({ id: d.id, name: d.name, ...project(d.lat, d.lon) }));
export const DISTRICT_POS = DPOS;

function bounds(pts: { x: number; z: number }[]) {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const p of pts) {
    x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x);
    z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z);
  }
  return { cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, w: x1 - x0, d: z1 - z0 };
}

export function computeShot(
  mode: SceneMode,
  step: number,
  projects: Project[],
  selectedId: string | null,
): Shot {
  const city = bounds(DPOS);
  if (mode === 'detail') {
    const p = projects.find((q) => q.id === selectedId);
    if (p) {
      const { x, z } = project(p.lat, p.lon);
      return { mode, tx: x, tz: z, dist: 1100, az: 212, polar: 58, drift: 0.4 };
    }
  }
  if (mode === 'results' && projects.length > 0) {
    const b = bounds(projects.map((p) => project(p.lat, p.lon)));
    const span = Math.max(b.w / 0.42, b.d / 0.55);
    return { mode, tx: b.cx, tz: b.cz, dist: Math.min(48000, Math.max(4500, span * 1.1 + 2500)), az: 205, polar: 52, drift: 0.4 };
  }
  const s = Math.max(0, Math.min(6, step));
  const areas = s === 5;
  return {
    mode: mode === 'detail' ? 'results' : mode,
    tx: city.cx + 2400,
    tz: city.cz + 900,
    dist: (areas ? 30000 : 21000) * (1 - s * 0.012),
    az: 205 + s * 6 - (areas ? 10 : 0),
    polar: areas ? 44 : 57 - s * 1.5,
    drift: 0.4,
    offFrac: areas ? 0.27 : 0.18,
  };
}

export function sameIds(a: DistrictId[], id: DistrictId) {
  return a.includes(id);
}
