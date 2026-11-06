import { Histogram } from '../controls/Histogram';
import { RangeSlider } from '../controls/RangeSlider';
import { steps } from '../controls/scale';
import { fmtAED, fmtTick } from '../format';
import type { StepProps } from './types';
import './steps.css';

const VALUES = steps(400_000, [[1_000_000, 50_000], [5_000_000, 100_000], [20_000_000, 250_000]]);
const TICKS = [400_000, 1_000_000, 2_000_000, 5_000_000, 10_000_000, 20_000_000].map((value) => ({ value, label: fmtTick(value) }));

export function BudgetStep({ answers, patch }: StepProps) {
  const [lo, hi] = answers.budget;
  return (
    <div className="Step">
      <p className="Step__readout display num">
        AED {fmtTick(lo)} – {fmtTick(hi)}
      </p>
      <RangeSlider
        values={VALUES}
        scale="log"
        value={[lo, hi]}
        onChange={(v) => patch({ budget: [v[0], v[1]] })}
        label="Budget"
        format={fmtAED}
        ticks={TICKS}
        above={<Histogram lo={lo} hi={hi} />}
      />
    </div>
  );
}
