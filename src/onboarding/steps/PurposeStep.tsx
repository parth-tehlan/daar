import type { Purpose } from '../../types';
import { ChoiceRows } from '../controls/ChoiceRows';
import type { StepProps } from './types';

const OPTIONS = [
  { id: 'live', label: 'Live in it', desc: 'A home for you or your family.' },
  { id: 'office', label: 'Run a business from it', desc: 'Office or retail space with a commercial licence.' },
  { id: 'rent', label: 'Rent it out', desc: 'Income first. We weigh net yield and tenant demand.' },
  { id: 'hold', label: 'Hold it for growth', desc: "Sell at or after handover. We weigh the developer's record." },
];

export function PurposeStep({ answers, patch }: StepProps) {
  return (
    <ChoiceRows
      label="Purpose"
      options={OPTIONS}
      selected={answers.purpose ? [answers.purpose] : []}
      onPick={(id) => patch({ purpose: id as Purpose })}
    />
  );
}
