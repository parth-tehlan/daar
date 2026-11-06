import type { UnitType } from '../../../types';
import { int, unitLabel } from '../format';
import { Section } from './Parts';

interface Props { units: UnitType[]; selected: number; onSelect: (i: number) => void }

export function Units({ units, selected, onSelect }: Props) {
  return (
    <Section title="Units">
      <div className="detail-units" role="radiogroup" aria-label="Unit type used in the calculators">
        <div className="detail-units__row detail-units__head label" aria-hidden="true">
          <span>Type</span><span>Size</span><span>Price</span><span>AED per sq ft</span>
        </div>
        {units.map((u, i) => (
          <button key={`${i}-${u.kind}-${u.sqft}`} type="button" role="radio" aria-checked={i === selected}
            className="detail-units__row detail-units__item num" onClick={() => onSelect(i)}>
            <span>{unitLabel(u.kind)}</span>
            <span>{int(u.sqft)} sq ft</span>
            <span>{int(u.priceAED)}</span>
            <span>{int(u.priceAED / u.sqft)}</span>
          </button>
        ))}
      </div>
    </Section>
  );
}
