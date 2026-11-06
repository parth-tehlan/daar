/* Shared layout contract. Lead-owned.
   The 3D canvas is always full-screen. UI covers part of it, and the scene
   composes the city inside the region that stays visible. CSS must agree with
   these numbers: see the --scene-band* and --panel-w tokens in tokens.css. */
import type { SceneMode } from './types';

/** Phones and narrow tablets in portrait. Matches `@media (max-width: 760px)`. */
export const MOBILE_MAX = 760;
export const MOBILE_QUERY = `(max-width: ${MOBILE_MAX}px)`;

export function isMobile(w: number = window.innerWidth): boolean {
  return w <= MOBILE_MAX;
}

/** Desktop paper panel width. Mirrors `--panel-w: clamp(520px, 44vw, 720px)`. */
export function panelWidth(w: number): number {
  return Math.min(720, Math.max(520, w * 0.44));
}

/** Mobile: share of the viewport height given to the city band at the top.
    Mirrors `--scene-band-onb` (34dvh) and `--scene-band` (42dvh). */
export const MOBILE_BAND = { onboarding: 0.34, panel: 0.42 } as const;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The part of the screen (CSS px) where the city is visible for this mode. */
export function sceneViewport(mode: SceneMode, w: number, h: number): Rect {
  if (isMobile(w)) {
    const band = Math.round(h * (mode === 'onboarding' ? MOBILE_BAND.onboarding : MOBILE_BAND.panel));
    return { x: 0, y: 0, w, h: band };
  }
  if (mode === 'onboarding') {
    const x = Math.round(w * 0.42);
    return { x, y: 0, w: w - x, h };
  }
  const p = Math.round(panelWidth(w));
  return { x: p, y: 0, w: w - p, h };
}
