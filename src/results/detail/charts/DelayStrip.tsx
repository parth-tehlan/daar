import type { PastProject } from '../../../types';

const TICKS = [0, 6, 12, 18, 24];

/** One row per past project; a small ink square marks its delay on a 0–24 month scale. */
export function DelayStrip({ projects }: { projects: PastProject[] }) {
  return (
    <div className="detail-strip">
      <div className="detail-strip__row detail-strip__head">
        <span className="label detail-strip__cap">Delay in months</span>
        <span className="detail-strip__scale">
          {TICKS.map((t) => (
            <span key={t} className="label detail-strip__tick-label num" style={{ left: `${(t / 24) * 100}%` }}>{t}</span>
          ))}
        </span>
      </div>
      {projects.map((p, i) => (
        <div className="detail-strip__row" key={`${i}-${p.name}`}>
          <span className="detail-strip__name">{p.name}</span>
          <span className="detail-strip__scale" role="img" aria-label={`${p.name}: ${p.delayMonths} months late`}>
            <span className="detail-strip__axis" />
            {TICKS.map((t) => <span key={t} className="detail-strip__tick" style={{ left: `${(t / 24) * 100}%` }} />)}
            <span className="detail-strip__dot" style={{ left: `${(Math.min(24, p.delayMonths) / 24) * 100}%` }} />
          </span>
        </div>
      ))}
    </div>
  );
}
