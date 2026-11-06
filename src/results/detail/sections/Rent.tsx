import { useState } from 'react';
import type { Financing, UnitType } from '../../../types';
import { aedCompact, int, pct } from '../format';
import { rentSummary, type RentMode } from '../finance';
import { Section, Segmented, StatRow } from './Parts';

interface Props { unit: UnitType; serviceChargePsf: number; monthlyMortgage: number; financing: Financing | null }

export function Rent({ unit, serviceChargePsf, monthlyMortgage, financing }: Props) {
  const [mode, setMode] = useState<RentMode>('long');
  const r = rentSummary(unit, serviceChargePsf, mode);
  const sentence = financing === 'cash'
    ? `≈ AED ${int(r.netMonthly)} a month after service charges.`
    : `Rent covers ${Math.round((r.netMonthly / monthlyMortgage) * 100)}% of the mortgage payment.`;
  return (
    <Section n="06" title="Rent">
      <Segmented label="Letting model" value={mode} onChange={setMode}
        options={[{ value: 'long', text: 'Long let' }, { value: 'holiday', text: 'Holiday home' }]} />
      <div className="detail-rent__stats">
        <StatRow items={[
          { label: 'Rent / yr', value: aedCompact(r.rent) },
          { label: 'Gross yield', value: pct(r.grossYieldPct) },
          { label: 'Service / yr', value: aedCompact(r.service) },
          { label: 'Net yield', value: pct(r.netYieldPct) },
        ]} />
      </div>
      <p className="detail-note">{sentence}</p>
      {mode === 'holiday' ? <p className="detail-small">Holiday rent is the long-let rent × 1.35, less 20% management and 15% vacancy.</p> : null}
    </Section>
  );
}
