import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Fog, PerspectiveCamera } from 'three';
import type { MutableRefObject } from 'react';
import { deg, viewOffset } from './shots';
import type { Interaction, Shot, ViewState } from './shots';
import type { Fade } from './fade';

const FLY_MS = 1400;
const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface Props {
  shot: Shot;
  viewRef: MutableRefObject<ViewState>;
  interact: MutableRefObject<Interaction>;
  fade: Fade;
}

export function CameraRig({ shot, viewRef, interact, fade }: Props) {
  const { camera, gl, scene, size, invalidate } = useThree();
  const cam = camera as PerspectiveCamera;
  const st = useRef({
    cur: { ...shot } as ViewState,
    from: { ...shot } as ViewState,
    fromOff: 0,
    off: 0,
    fromOffY: 0,
    offY: 0,
    t: 0,
    tween: false,
    first: true,
    key: '',
  });
  const shotRef = useRef(shot);
  shotRef.current = shot;
  const sizeRef = useRef(size);
  sizeRef.current = size;

  // New shot -> tween (or cut)
  useEffect(() => {
    const s = st.current;
    if (s.first || reduced()) {
      s.cur = { ...shot };
      s.tween = false;
      s.first = false;
      const o = viewOffset(shot.mode, sizeRef.current.width, sizeRef.current.height, shot.offFrac);
      s.off = o.x;
      s.offY = o.y;
      return;
    }
    s.from = { ...s.cur };
    s.fromOff = s.off;
    s.fromOffY = s.offY;
    s.t = 0;
    s.tween = true;
  }, [shot.mode, shot.offFrac, shot.tx, shot.tz, shot.ty, shot.dist, shot.az, shot.polar, shot.rad]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pointer drag (1 finger / mouse), pinch (2 fingers) + wheel
  useEffect(() => {
    const el = gl.domElement;
    el.style.touchAction = 'none';
    const ptrs = new Map<number, { x: number; y: number }>();
    let pinch = 0;
    const zoom = (factor: number) => {
      const sh = shotRef.current;
      const c = st.current.cur;
      st.current.tween = false;
      c.dist = Math.min(sh.dist * 1.8, Math.max(sh.dist * 0.3, c.dist * factor));
    };
    const pd = () => {
      const [a, b] = [...ptrs.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };
    const down = (e: PointerEvent) => {
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      interact.current.dragging = true;
      if (ptrs.size === 1) interact.current.moved = 0;
      if (ptrs.size === 2) { pinch = pd(); interact.current.moved += 10; }
      interact.current.lastTouch = performance.now();
      el.setPointerCapture(e.pointerId);
      invalidate();
    };
    const move = (e: PointerEvent) => {
      const p = ptrs.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      p.x = e.clientX;
      p.y = e.clientY;
      if (ptrs.size >= 2) {
        const d = pd();
        if (pinch > 0 && d > 0) zoom(pinch / d);
        pinch = d;
      } else {
        interact.current.moved += Math.abs(dx) + Math.abs(dy);
        if (interact.current.moved > 4) st.current.tween = false;
        const c = st.current.cur;
        c.az -= dx * 0.25;
        c.polar = Math.min(78, Math.max(18, c.polar - dy * 0.2));
      }
      interact.current.lastTouch = performance.now();
      invalidate();
    };
    const up = (e: PointerEvent) => {
      ptrs.delete(e.pointerId);
      pinch = 0;
      if (ptrs.size === 0) interact.current.dragging = false;
      interact.current.lastTouch = performance.now();
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      invalidate();
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      zoom(Math.exp(e.deltaY * 0.0012));
      interact.current.lastTouch = performance.now();
      invalidate();
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', wheel, { passive: false });
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('wheel', wheel);
    };
  }, [gl, interact, invalidate]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const s = st.current;
    const sh = shotRef.current;
    const w = sizeRef.current.width;
    const h = sizeRef.current.height;
    const offT = viewOffset(sh.mode, w, h, sh.offFrac);
    if (s.tween) {
      s.t += dt * 1000;
      const k = Math.min(1, s.t / FLY_MS);
      const e = ease(k);
      let da = ((sh.az - s.from.az + 540) % 360) - 180;
      if (da === -180) da = 180;
      s.cur.tx = s.from.tx + (sh.tx - s.from.tx) * e;
      s.cur.tz = s.from.tz + (sh.tz - s.from.tz) * e;
      s.cur.az = s.from.az + da * e;
      s.cur.polar = s.from.polar + (sh.polar - s.from.polar) * e;
      s.cur.ty = s.from.ty + (sh.ty - s.from.ty) * e;
      s.cur.rad = Math.exp(Math.log(s.from.rad) + (Math.log(sh.rad) - Math.log(s.from.rad)) * e);
      s.cur.dist = Math.exp(Math.log(s.from.dist) + (Math.log(sh.dist) - Math.log(s.from.dist)) * e);
      s.off = s.fromOff + (offT.x - s.fromOff) * e;
      s.offY = s.fromOffY + (offT.y - s.fromOffY) * e;
      if (k >= 1) s.tween = false;
    } else {
      s.off = offT.x;
      s.offY = offT.y;
      if (!reduced() && !interact.current.dragging && performance.now() - interact.current.lastTouch > 3000) {
        s.cur.az += sh.drift * dt;
      }
    }
    const c = s.cur;
    const a = c.az * deg;
    const p = c.polar * deg;
    cam.position.set(c.tx + c.dist * Math.sin(p) * Math.sin(a), c.ty + c.dist * Math.cos(p), c.tz + c.dist * Math.sin(p) * Math.cos(a));
    cam.lookAt(c.tx, c.ty, c.tz);
    const near = Math.max(5, c.dist * 0.04);
    const far = c.dist * 3 + 6000;
    const key = `${w}|${h}|${s.off.toFixed(1)}|${s.offY.toFixed(1)}|${near.toFixed(0)}|${far.toFixed(0)}`;
    if (key !== s.key) {
      s.key = key;
      cam.near = near;
      cam.far = far;
      cam.setViewOffset(w, h, s.off, s.offY, w, h);
    }
    const fog = scene.fog as Fog | null;
    if (fog) {
      const detail = sh.mode === 'detail';
      fog.near = c.dist * (detail ? 0.7 : 0.55);
      fog.far = c.dist * (detail ? 3.2 : 1.9);
    }
    fade.uFocus.value.set(c.tx, c.tz);
    fade.uRadius.value = c.rad;
    const mt = sh.maskFloor ?? 1;
    fade.uMaskFloor.value += (mt - fade.uMaskFloor.value) * Math.min(1, dt * 4);
    fade.uViewportW.value = gl.domElement.width;
    fade.uViewportH.value = gl.domElement.height;
    const maskBusy = Math.abs(mt - fade.uMaskFloor.value) > 0.004;
    fade.uBotFloor.value = fade.uMaskFloor.value;
    if (sh.mode !== 'onboarding') fade.uBotFloor.value = 1;
    const q = Math.min(1, Math.max(0, (c.dist - 4000) / 11000));
    fade.uLod.value = 1 - (1 - 0.28) * q * q * (3 - 2 * q);
    viewRef.current = { ...c };
    const drifting = !reduced() && sh.drift > 0 && !interact.current.dragging && performance.now() - interact.current.lastTouch > 3000;
    const touchedRecently = performance.now() - interact.current.lastTouch < 3100;
    if (s.tween || drifting || maskBusy || interact.current.dragging || touchedRecently) invalidate();
  });

  return null;
}
