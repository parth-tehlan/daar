import { DISTRICTS, type DistrictId } from '../../types';
import { ChoiceRows } from '../controls/ChoiceRows';
import type { StepProps } from './types';

const OPTIONS = DISTRICTS.map((d) => ({ id: d.id, label: d.name, desc: d.note }));

export function AreasStep({ answers, patch }: StepProps) {
  const a = answers.areas;
  return (
    <ChoiceRows
      label="Districts"
      multi
      compact
      options={OPTIONS}
      selected={a}
      onPick={(id) => patch({ areas: a.includes(id as DistrictId) ? a.filter((x) => x !== id) : [...a, id as DistrictId] })}
    />
  );
}
