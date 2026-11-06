import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { WORLD_ORIGIN } from '../types';
import type { ViewState } from './shots';

const R = 6_371_000;
const RAD = Math.PI / 180;
const NICE = [50, 100, 200, 500, 1000, 2000, 5000, 10000];

export function SceneOverlay({ viewRef }: { viewRef: MutableRefObject<ViewState> }) {
  const arrow = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const barLabel = useRef<HTMLSpanElement>(null);
  const coords = useRef<HTMLSpanElement>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    let last = '';
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const v = viewRef.current;
      const h = root.current?.parentElement?.clientHeight ?? 800;
      const ppm = h / (2 * v.dist * Math.tan(15 * RAD)); // px per metre at the target
      let m = NICE[0];
      for (const n of NICE) { m = n; if (n * ppm >= 70) break; }
      const key = `${v.az.toFixed(1)}|${(m * ppm).toFixed(0)}|${v.tx.toFixed(0)}|${v.tz.toFixed(0)}`;
      if (key === last) return;
      last = key;
      const lat = WORLD_ORIGIN.lat - v.tz / (R * RAD);
      const lon = WORLD_ORIGIN.lon + v.tx / (R * RAD * Math.cos(WORLD_ORIGIN.lat * RAD));
      if (arrow.current) arrow.current.style.transform = `rotate(${v.az.toFixed(1)}deg)`;
      if (bar.current) bar.current.style.width = `${Math.round(m * ppm)}px`;
      if (barLabel.current) barLabel.current.textContent = m >= 1000 ? `${m / 1000} km` : `${m} m`;
      if (coords.current) coords.current.textContent = `${lat.toFixed(4)}° N  ${lon.toFixed(4)}° E`;
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [viewRef]);

  return (
    <div className="scene-furniture" ref={root} aria-hidden="true">
      <span className="scene-furniture__row">
        <span>N</span>
        <span className="scene-furniture__arrow" ref={arrow}>↑</span>
      </span>
      <span className="scene-furniture__row">
        <span className="scene-furniture__bar" ref={bar} />
        <span ref={barLabel} />
      </span>
      <span ref={coords} />
    </div>
  );
}
