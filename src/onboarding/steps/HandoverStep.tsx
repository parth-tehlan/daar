import { RangeSlider } from '../controls/RangeSlider';
import { steps } from '../controls/scale';
import { fmtQuarter } from '../format';
import type { StepProps } from './types';
import './steps.css';

const VALUES = steps(2027, [[2031.75, 0.25]]);
const YEARS = [2027, 2028, 2029, 2030, 2031].map((value) => ({ value, label: String(value) }));
const MINOR = VALUES.filter((v) => v % 1 !== 0);

export function HandoverStep({ answers, patch }: StepProps) {
  return (
    <div className="Step">
      <p className="Step__readout display num">By {fmtQuarter(answers.handoverBy)}</p>
      <RangeSlider
        values={VALUES}
        scale="linear"
        value={[answers.handoverBy]}
        onChange={(v) => patch({ handoverBy: v[0] })}
        label="Latest handover"
        format={fmtQuarter}
        ticks={YEARS}
        minorTicks={MINOR}
      />
    </div>
  );
}
