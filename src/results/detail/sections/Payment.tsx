import type { PaymentMilestone } from '../../../types';
import { aedFull } from '../format';
import { isOnHandover, isPostHandover, postHandoverPct } from '../finance';
import { Section } from './Parts';

export function Payment({ plan, price }: { plan: PaymentMilestone[]; price: number }) {
  const post = postHandoverPct(plan);
  let before = 0;
  for (const m of plan) { before += m.pct; if (isOnHandover(m)) break; }
  return (
    <Section n="04" title="Payment plan">
      <p className="detail-note">
        {post > 0
          ? `${post}% of the price is paid after handover, ${aedFull((price * post) / 100)} in all.`
          : 'The full price is paid by handover.'}
      </p>
      <div className="detail-plan__wrap">
      <div className="detail-plan__bar" role="img" aria-label={plan.map((m) => `${m.label} ${m.pct}%`).join(', ')}>
        {plan.map((m, i) => (
          <span key={m.label + i} className={`detail-plan__seg detail-plan__seg--${i % 2 ? 'b' : 'a'}`} style={{ flexGrow: m.pct }} />
        ))}
      </div>
      {post > 0 ? (
        <div className="detail-plan__mark mono-label" style={{ left: `${before}%` }}>↑ Handover</div>
      ) : null}
      </div>
      <ul className="detail-plan__rows">
        {plan.map((m, i) => (
          <li key={m.label + i} className={`detail-plan__row${isPostHandover(m) ? ' is-post' : ''}`}>
            <span className="detail-plan__label">{m.label}</span>
            <span className="detail-plan__when num">{m.when}</span>
            <span className="detail-plan__pct num">{m.pct}%</span>
            <span className="detail-plan__amt num">{aedFull((price * m.pct) / 100)}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
