import type { Financing } from '../../../types';
import { aedCompact, int } from '../format';
import type { MortgageSummary } from '../finance';
import { Section, Segmented, Slider, StatRow } from './Parts';

export interface MortgageState { dp: number; rate: number; term: number }
interface Props {
  state: MortgageState; onChange: (s: MortgageState) => void; summary: MortgageSummary; financing: Financing | null;
}

export function Mortgage({ state, onChange, summary, financing }: Props) {
  return (
    <Section n="05" title="Mortgage">
      {financing === 'cash' ? <p className="detail-note detail-note--mono mono-label">You chose cash. Shown for comparison.</p> : null}
      <p className="detail-note">Mortgages start at handover. Construction instalments are paid in cash.</p>
      <Slider label="Down payment" min={20} max={80} step={1} value={state.dp} display={`${state.dp}%`}
        onChange={(dp) => onChange({ ...state, dp })} />
      <Slider label="Rate" min={3.49} max={6.49} step={0.05} value={state.rate} display={`${state.rate.toFixed(2)}%`}
        onChange={(rate) => onChange({ ...state, rate: Math.round(rate * 100) / 100 })} />
      <div className="detail-term">
        <span className="detail-slider__name">Term</span>
        <Segmented label="Term in years" value={state.term} onChange={(term) => onChange({ ...state, term })}
          options={[15, 20, 25].map((y) => ({ value: y, text: `${y} yrs` }))} />
      </div>
      <p className="detail-mortgage__headline display num">≈ AED {int(summary.monthly)} / mo</p>
      <StatRow items={[
        { label: 'Loan', value: aedCompact(summary.loan) },
        { label: 'Total interest', value: aedCompact(summary.totalInterest) },
        { label: 'Cash by handover', value: aedCompact(summary.cashByHandover) },
      ]} />
      <p className="detail-small">Cash includes the down payment, the 4% DLD fee and AED 5,000 admin.</p>
    </Section>
  );
}
