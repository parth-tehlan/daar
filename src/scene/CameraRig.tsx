import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Fog, PerspectiveCamera } from 'three';
import type { MutableRefObject } from 'react';
import { deg, viewOffsetX } from './shots';
import type { Interaction, Shot, ViewState } from './shots';

const FLY_MS = 1400;
const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface Props {
  shot: Shot;
  viewRef: MutableRefObject<ViewState>;
  interact: MutableRefObject<Interaction>;
}

export function CameraRig({ shot, viewRef, interact }: Props) {
  const { camera, gl, scene, size } = useThree();
  const cam = camera as PerspectiveCamera;
  const st = useRef({
    cur: { ...shot } as ViewState,
    from: { ...shot } as ViewState,
    fromOff: 0,
    off: 0,
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
      s.off = viewOffsetX(shot.mode, sizeRef.current.width, shot.offFrac);
      return;
    }
    s.from = { ...s.cur };
    s.fromOff = s.off;
    s.t = 0;
    s.tween = true;
  }, [shot.mode, shot.offFrac, shot.tx, shot.tz, shot.dist, shot.az, shot.polar]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pointer drag + wheel
  useEffect(() => {
    const el = gl.domElement;
    let lx = 0;
    let ly = 0;
    const down = (e: PointerEvent) => {
      interact.current.dragging = true;
      interact.current.moved = 0;
      interact.current.lastTouch = performance.now();
      lx = e.clientX;
      ly = e.clientY;
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!interact.current.dragging) return;
      const dx = e.clientX - lx;
      const dy = e.clientY - ly;
      lx = e.clientX;
      ly = e.clientY;
      interact.current.moved += Math.abs(dx) + Math.abs(dy);
      if (interact.current.moved > 4) st.current.tween = false;
      const c = st.current.cur;
      c.az -= dx * 0.25;
      c.polar = Math.min(78, Math.max(18, c.polar - dy * 0.2));
      interact.current.lastTouch = performance.now();
    };
    const up = (e: PointerEvent) => {
      interact.current.dragging = false;
      interact.current.lastTouch = performance.now();
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const sh = shotRef.current;
      const c = st.current.cur;
      st.current.tween = false;
      c.dist = Math.min(sh.dist * 1.8, Math.max(sh.dist * 0.3, c.dist * Math.exp(e.deltaY * 0.0012)));
      interact.current.lastTouch = performance.now();
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
  }, [gl, interact]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const s = st.current;
    const sh = shotRef.current;
    const w = sizeRef.current.width;
    const h = sizeRef.current.height;
    const offT = viewOffsetX(sh.mode, w, sh.offFrac);
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
      s.cur.dist = Math.exp(Math.log(s.from.dist) + (Math.log(sh.dist) - Math.log(s.from.dist)) * e);
      s.off = s.fromOff + (offT - s.fromOff) * e;
      if (k >= 1) s.tween = false;
    } else {
      s.off = offT;
      if (!reduced() && !interact.current.dragging && performance.now() - interact.current.lastTouch > 3000) {
        s.cur.az += sh.drift * dt;
      }
    }
    const c = s.cur;
    const a = c.az * deg;
    const p = c.polar * deg;
    cam.position.set(c.tx + c.dist * Math.sin(p) * Math.sin(a), c.dist * Math.cos(p), c.tz + c.dist * Math.sin(p) * Math.cos(a));
    cam.lookAt(c.tx, 0, c.tz);
    const near = Math.max(5, c.dist * 0.04);
    const far = c.dist * 3 + 6000;
    const key = `${w}|${h}|${s.off.toFixed(1)}|${near.toFixed(0)}|${far.toFixed(0)}`;
    if (key !== s.key) {
      s.key = key;
      cam.near = near;
      cam.far = far;
      cam.setViewOffset(w, h, s.off, 0, w, h);
    }
    const fog = scene.fog as Fog | null;
    if (fog) {
      const detail = sh.mode === 'detail';
      fog.near = c.dist * (detail ? 0.7 : 0.55);
      fog.far = c.dist * (detail ? 3.2 : 1.9);
    }
    viewRef.current = { tx: c.tx, tz: c.tz, dist: c.dist, az: c.az, polar: c.polar };
  });

  return null;
}
