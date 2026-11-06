import type { HandoverTiming } from '../finance';
import { monthLabel } from '../finance';
import { useWidth } from './useWidth';

const H = 84;
const BASE = 34;
const anchor = (x: number, w: number) => (x < 56 ? 'start' : x > w - 56 ? 'end' : 'middle');

export function HandoverTimeline({ t, builtPct }: { t: HandoverTiming; builtPct: number }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const end = t.estIdx + 6;
  const span = end - t.launchIdx;
  const x = (m: number) => ((m - t.launchIdx) / span) * (w - 2) + 1;
  const xl = x(t.launchIdx), xt = x(t.todayIdx), xp = x(t.promisedIdx), xe = x(t.estIdx);
  const bandL = x(t.estIdx - t.uncertaintyMonths), bandR = x(t.estIdx + t.uncertaintyMonths);

  const tick = (px: number, name: string, date: string) => (
    <g key={name}>
      <line x1={px} x2={px} y1={BASE} y2={BASE + 8} stroke="var(--ink)" strokeWidth={1} />
      <text x={px} y={BASE + 22} textAnchor={anchor(px, w)}>{name}</text>
      <text x={px} y={BASE + 35} textAnchor={anchor(px, w)}>{date}</text>
    </g>
  );

  return (
    <div ref={ref} className="detail-timeline">
      <svg className="detail-svg" width={w} height={H} role="img"
        aria-label={`Timeline: launch ${monthLabel(t.launchIdx)}, ${builtPct}% built, promised ${t.promisedLabel}, estimated ${t.estLabel}`}>
        <rect x={bandL} y={BASE - 12} width={bandR - bandL} height={24} fill="var(--paper-2)" />
        <line x1={xl} x2={x(end)} y1={BASE} y2={BASE} stroke="var(--rule-on-paper-strong)" strokeWidth={1} />
        <line x1={xl} x2={xt} y1={BASE} y2={BASE} stroke="var(--ink)" strokeWidth={2} />
        <text className="t-ink" x={(xl + xt) / 2} y={BASE - 10} textAnchor="middle">{builtPct}% built</text>
        {tick(xl, 'Launch', monthLabel(t.launchIdx))}
        {tick(xt, 'Today', monthLabel(t.todayIdx))}
        {tick(xp, 'Promised', t.promisedLabel)}
        <rect x={xe - 4} y={BASE - 4} width={8} height={8} fill="var(--accent)" />
        <text className="t-accent" x={xe} y={BASE - 14} textAnchor={anchor(xe, w)}>Estimate {t.estLabel}</text>
      </svg>
    </div>
  );
}
