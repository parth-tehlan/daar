import { axisM, compact } from '../format';
import { grow } from '../finance';
import { useWidth } from './useWidth';

const H = 220, M = { l: 44, r: 8, t: 28, b: 28 };
const STEPS = [1, 2, 5];

function niceTicks(lo: number, hi: number) {
  const raw = (hi - lo) / 4;
  let step = 100_000;
  for (let k = 1e5; k <= 1e8; k *= 10) for (const s of STEPS) if (s * k >= raw) { step = s * k; k = 1e9; break; }
  const a = Math.floor(lo / step) * step, b = Math.ceil(hi / step) * step;
  const ticks: number[] = [];
  for (let v = a; v <= b + 1; v += step) ticks.push(v);
  return { min: a, max: b, ticks };
}

interface Props { price: number; growthPct: number; todayYear: number; handoverYear: number }

export function AppreciationChart({ price, growthPct, todayYear, handoverYear }: Props) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const x0 = todayYear, x1 = Math.ceil(handoverYear) + 5;
  const years = x1 - todayYear;
  const hi = grow(price, growthPct + 3, years), lo = Math.min(price, grow(price, growthPct - 3, years));
  const pad = (hi - lo) * 0.04;
  const { min, max, ticks } = niceTicks(lo - pad, hi + pad);
  const X = (yr: number) => M.l + ((yr - x0) / (x1 - x0)) * (w - M.l - M.r);
  const Y = (v: number) => H - M.b - ((v - min) / (max - min)) * (H - M.t - M.b);
  const N = 24;
  const ts = Array.from({ length: N + 1 }, (_, i) => todayYear + (years * i) / N);
  const line = (g: number) => ts.map((t, i) => `${i ? 'L' : 'M'}${X(t).toFixed(1)},${Y(grow(price, g, t - todayYear)).toFixed(1)}`).join('');
  const up = ts.map((t) => `${X(t).toFixed(1)},${Y(grow(price, growthPct + 3, t - todayYear)).toFixed(1)}`);
  const dn = ts.map((t) => `${X(t).toFixed(1)},${Y(grow(price, growthPct - 3, t - todayYear)).toFixed(1)}`).reverse();
  const band = `M${up.join('L')}L${dn.join('L')}Z`;
  const endVal = grow(price, growthPct, years);
  const xs = Array.from({ length: x1 - Math.ceil(x0) + 1 }, (_, i) => Math.ceil(x0) + i).filter((yr) => X(yr) - M.l > 48);
  const stride = xs.length > 8 ? 2 : 1;
  const xh = X(handoverYear);

  return (
    <div ref={ref}>
      <svg className="detail-svg" width={w} height={H} role="img"
        aria-label={`Projected unit value, median about AED ${compact(endVal)} by ${x1}`}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={M.l - 4} x2={M.l} y1={Y(v)} y2={Y(v)} stroke="var(--rule-on-paper-strong)" />
            <text x={M.l - 8} y={Y(v) + 4} textAnchor="end">{axisM(v)}</text>
          </g>
        ))}
        <line x1={M.l} x2={M.l} y1={Y(min)} y2={Y(max)} stroke="var(--rule-on-paper-strong)" />
        <path d={band} fill="var(--paper-2)" />
        <path d={line(growthPct)} fill="none" stroke="var(--ink)" strokeWidth={1.5} />
        <line x1={xh} x2={xh} y1={M.t - 8} y2={H - M.b} stroke="var(--ink)" strokeOpacity={0.5} strokeDasharray="3 3" />
        <text x={xh + 4} y={M.t - 12} textAnchor="start">Handover</text>
        <line x1={M.l} x2={w - M.r} y1={H - M.b} y2={H - M.b} stroke="var(--rule-on-paper-strong)" />
        <text x={M.l} y={H - M.b + 18} textAnchor="start">Today</text>
        {xs.map((yr, i) => (i % stride ? null : (
          <g key={yr}>
            <line x1={X(yr)} x2={X(yr)} y1={H - M.b} y2={H - M.b + 4} stroke="var(--rule-on-paper-strong)" />
            <text x={X(yr)} y={H - M.b + 18} textAnchor="middle">{yr}</text>
          </g>
        )))}
        <text className="t-ink" x={w - M.r} y={Y(grow(price, growthPct + 3, years)) - 8} textAnchor="end">≈ AED {compact(endVal)}</text>
      </svg>
    </div>
  );
}
