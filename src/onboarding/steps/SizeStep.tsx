import type { Bedrooms } from '../../types';
import { RangeSlider } from '../controls/RangeSlider';
import { steps } from '../controls/scale';
import { useDigitKeys } from '../controls/useDigitKeys';
import { fmtInt } from '../format';
import type { StepProps } from './types';
import './steps.css';

const BEDS: Array<{ id: Bedrooms; label: string; cap: string }> = [
  { id: 'studio', label: 'Studio', cap: '≈ 450 sq ft' },
  { id: '1', label: '1', cap: '≈ 800' },
  { id: '2', label: '2', cap: '≈ 1,250' },
  { id: '3', label: '3', cap: '≈ 1,800' },
  { id: '4+', label: '4+', cap: '≈ 2,600' },
];

const SQFT = steps(300, [[2000, 100], [5000, 250], [10000, 500]]);
const SQFT_TICKS = [300, 1000, 2000, 5000, 10000].map((value) => ({ value, label: fmtInt(value) }));

export function SizeStep({ answers, patch }: StepProps) {
  const office = answers.purpose === 'office';
  const beds = answers.bedrooms;
  const toggle = (id: Bedrooms) =>
    patch({ bedrooms: beds.includes(id) ? beds.filter((b) => b !== id) : [...beds, id] });
  useDigitKeys(office ? 0 : BEDS.length, (n) => toggle(BEDS[n - 1].id));

  if (office) {
    const [lo, hi] = answers.officeSqft;
    return (
      <div className="Step">
        <p className="Step__readout display num">
          {fmtInt(lo)} – {fmtInt(hi)} sq ft
        </p>
        <RangeSlider
          values={SQFT}
          scale="linear"
          value={[lo, hi]}
          onChange={(v) => patch({ officeSqft: [v[0], v[1]] })}
          label="Floor space, sq ft"
          format={(v) => `${fmtInt(v)} sq ft`}
          ticks={SQFT_TICKS}
        />
      </div>
    );
  }
  return (
    <div className="Step">
      <div className="Step__squares" role="group" aria-label="Bedrooms">
        {BEDS.map((b) => (
          <button
            key={b.id}
            type="button"
            className={`Step__square${beds.includes(b.id) ? ' is-on' : ''}`}
            aria-pressed={beds.includes(b.id)}
            onClick={() => toggle(b.id)}
          >
            <span className={b.id === 'studio' ? 'Step__squareText' : 'Step__squareNum display num'}>{b.label}</span>
            <span className="Step__squareCap num">{b.cap}</span>
          </button>
        ))}
      </div>
      {beds.length === 0 && <p className="Step__hint">Leave empty to see every size.</p>}
    </div>
  );
}
