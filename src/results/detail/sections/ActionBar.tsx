import { aedFull, int } from '../format';

export function ActionBar({ price, monthly }: { price: number; monthly: number }) {
  return (
    <div className="detail-bar">
      <div className="detail-bar__inner">
        <div>
          <div className="detail-bar__price num">{aedFull(price)}</div>
          <div className="detail-bar__mo num">≈ AED {int(monthly)} / mo at handover</div>
        </div>
        {/* TODO(integration): no allocation flow exists in the mockup */}
        <button type="button" className="detail-bar__cta">Request allocation<span className="detail-bar__arrow"> →</span></button>
      </div>
    </div>
  );
}
