/* Turns onboarding answers into the short mono chips shown under the summary. */
import type { Answers, DistrictId, Priority } from '../types';
import { quarterLabel } from '../data/util';

export interface AnswerChip {
  label: string;
  /** onboarding step to jump to */
  step: number;
}

const PURPOSE = { live: 'Live in it', office: 'Office', rent: 'Rent out', hold: 'Hold' } as const;
const AREA: Record<DistrictId, string> = {
  marina: 'Marina',
  palm: 'Palm',
  jvc: 'JVC',
  'dubai-hills': 'Dubai Hills',
  downtown: 'Downtown',
  'business-bay': 'Business Bay',
  'mbr-city': 'MBR City',
  'creek-harbour': 'Creek Harbour',
};
const PRIORITY: Record<Priority, string> = {
  yield: 'Yield',
  growth: 'Growth',
  reliability: 'Track record',
  water: 'Water',
  schools: 'Schools',
  commute: 'Commute',
  quiet: 'Quiet',
};

const m = (n: number) => String(Number((n / 1_000_000).toFixed(1)));

function bedLabel(beds: Answers['bedrooms']): string {
  const order = ['studio', '1', '2', '3', '4+'];
  const sorted = [...beds].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const nums = sorted.filter((b) => b !== 'studio' && b !== '4+').map(Number);
  const consecutive = nums.length > 1 && nums.every((n, i) => i === 0 || n === nums[i - 1] + 1);
  const hasEdge = sorted.some((b) => b === 'studio' || b === '4+');
  if (consecutive && !hasEdge) return `${nums[0]}–${nums[nums.length - 1]} bed`;
  if (sorted.length === 1) return sorted[0] === 'studio' ? 'Studio' : `${sorted[0]} bed`;
  return sorted.map((b) => (b === 'studio' ? 'studio' : b)).join(', ') + ' bed';
}

export function answerChips(a: Answers): AnswerChip[] {
  const chips: AnswerChip[] = [];
  if (a.purpose) chips.push({ label: PURPOSE[a.purpose], step: 0 });
  chips.push({ label: `AED ${m(a.budget[0])}–${m(a.budget[1])}M`, step: 1 });
  if (a.purpose === 'office') {
    chips.push({ label: `${a.officeSqft[0].toLocaleString('en-US')}–${a.officeSqft[1].toLocaleString('en-US')} sq ft`, step: 2 });
  } else if (a.bedrooms.length) {
    chips.push({ label: bedLabel(a.bedrooms), step: 2 });
  }
  chips.push({ label: `Keys by ${quarterLabel(a.handoverBy)}`, step: 3 });
  if (a.financing === 'cash') chips.push({ label: 'Cash', step: 4 });
  if (a.financing === 'mortgage') chips.push({ label: `Mortgage, ${a.downPaymentPct}% down`, step: 4 });
  if (a.planPreference === 'post-handover') chips.push({ label: 'Post-handover plan', step: 4 });
  if (a.areas.length) chips.push({ label: a.areas.map((d) => AREA[d]).join(', '), step: 5 });
  if (a.priorities.length) chips.push({ label: a.priorities.map((p, i) => (i === 0 ? PRIORITY[p] : PRIORITY[p].toLowerCase())).join(', '), step: 6 });
  return chips;
}
