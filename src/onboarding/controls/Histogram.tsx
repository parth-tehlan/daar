import { norm } from './scale';
import './Histogram.css';

const BARS = 56;
const MIN = 400_000;
const MAX = 20_000_000;

/** deterministic log-normal-ish inventory curve, peak near 1.4M, long right tail */
const HEIGHTS: number[] = Array.from({ length: BARS }, (_, i) => {
  const t = (i + 0.5) / BARS;
  const x = Math.log(MIN) + t * (Math.log(MAX) - Math.log(MIN));
  const d = x - Math.log(1_400_000);
  const s = d < 0 ? 0.5 : 0.85;
  const noise = 0.88 + 0.12 * Math.sin(i * 12.9898 + 4.1) * Math.cos(i * 3.7);
  return Math.max(0.03, Math.exp(-(d * d) / (2 * s * s)) * noise);
});
const PEAK = Math.max(...HEIGHTS);

export function Histogram({ lo, hi }: { lo: number; hi: number }) {
  const tLo = norm('log', MIN, MAX, lo);
  const tHi = norm('log', MIN, MAX, hi);
  return (
    <div className="Histogram" aria-hidden="true">
      {HEIGHTS.map((h, i) => {
        const t = (i + 0.5) / BARS;
        const on = t >= tLo - 0.5 / BARS && t <= tHi + 0.5 / BARS;
        return (
          <span
            key={i}
            className={`Histogram__bar${on ? ' is-on' : ''}`}
            style={{ ['--t' as string]: t, ['--h' as string]: h / PEAK }}
          />
        );
      })}
    </div>
  );
}
