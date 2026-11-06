import type { Financing } from '../../types';
import { ChoiceRows } from '../controls/ChoiceRows';
import { RangeSlider } from '../controls/RangeSlider';
import { steps } from '../controls/scale';
import { fmtAED } from '../format';
import type { StepProps } from './types';
import './steps.css';

const OPTIONS = [
  { id: 'cash', label: 'Cash', desc: 'Pay the developer directly through the plan.' },
  { id: 'mortgage', label: 'Mortgage at handover', desc: 'Banks lend 50–80% once the building is complete.' },
];
const VALUES = steps(20, [[80, 5]]);
const TICKS = [20, 50, 80].map((value) => ({ value, label: `${value}%` }));

export function FinancingStep({ answers, patch }: StepProps) {
  const post = answers.planPreference === 'post-handover';
  const down = answers.downPaymentPct;
  return (
    <div className="Step">
      <ChoiceRows
        label="Financing"
        options={OPTIONS}
        selected={answers.financing ? [answers.financing] : []}
        onPick={(id) => patch({ financing: id as Financing })}
      />
      {answers.financing === 'mortgage' && (
        <div className="Step__down">
          <p className="Step__readoutSm">{down}% down</p>
          <p className="Step__hint num">≈ AED {fmtAED((answers.budget[1] * down) / 100)} at the top of your budget</p>
          <RangeSlider
            values={VALUES}
            scale="linear"
            value={[down]}
            onChange={(v) => patch({ downPaymentPct: v[0] })}
            label="Down payment"
            format={(v) => `${v}% down`}
            ticks={TICKS}
          />
        </div>
      )}
      <button
        type="button"
        className="Step__switch"
        role="switch"
        aria-checked={post}
        onClick={() => patch({ planPreference: post ? 'any' : 'post-handover' })}
      >
        <span className={`Step__box${post ? ' is-on' : ''}`} />
        Prefer post-handover payment plans
      </button>
    </div>
  );
}
