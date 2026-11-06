import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import type { ViewState } from './shots';

const RAD = Math.PI / 180;
const NICE = [50, 100, 200, 500, 1000, 2000, 5000, 10000];

export function SceneOverlay({ viewRef }: { viewRef: MutableRefObject<ViewState> }) {
  const arrow = useRef<SVGSVGElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const barLabel = useRef<HTMLSpanElement>(null);
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
      for (const n of NICE) { if (n * ppm <= 140) m = n; }
      const key = `${v.az.toFixed(1)}|${(m * ppm).toFixed(0)}`;
      if (key === last) return;
      last = key;
      if (arrow.current) arrow.current.style.transform = `rotate(${v.az.toFixed(1)}deg)`;
      if (bar.current) bar.current.style.width = `${Math.round(m * ppm)}px`;
      if (barLabel.current) barLabel.current.textContent = m >= 1000 ? `${m / 1000} km` : `${m} m`;
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [viewRef]);

  return (
    <div className="scene-furniture" ref={root} aria-hidden="true">
      <span className="scene-furniture__north">
        <span>N</span>
        <svg ref={arrow} width="12" height="20" viewBox="0 0 12 20" fill="none" stroke="currentColor" strokeWidth="1">
          <line x1="6" y1="19" x2="6" y2="2" />
          <polyline points="2.5,6 6,2 9.5,6" />
        </svg>
      </span>
      <span className="scene-furniture__row">
        <span className="scene-furniture__bar" ref={bar} />
        <span ref={barLabel} />
      </span>
    </div>
  );
}
