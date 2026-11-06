import type { Priority } from '../../types';
import { useDigitKeys } from '../controls/useDigitKeys';
import type { StepProps } from './types';
import './steps.css';

const CHIPS: Array<{ id: Priority; label: string }> = [
  { id: 'yield', label: 'Rental yield' },
  { id: 'growth', label: 'Capital growth' },
  { id: 'reliability', label: 'Developer track record' },
  { id: 'water', label: 'Near the water' },
  { id: 'schools', label: 'Good schools' },
  { id: 'commute', label: 'Short commute' },
  { id: 'quiet', label: 'Quiet streets' },
];

export function PrioritiesStep({ answers, patch }: StepProps) {
  const p = answers.priorities;
  const toggle = (id: Priority) => {
    if (p.includes(id)) patch({ priorities: p.filter((x) => x !== id) });
    else if (p.length < 3) patch({ priorities: [...p, id] });
  };
  useDigitKeys(CHIPS.length, (n) => toggle(CHIPS[n - 1].id));
  return (
    <div className="Step__chips" role="group" aria-label="Priorities">
      {CHIPS.map((c) => {
        const order = p.indexOf(c.id) + 1;
        return (
          <button
            key={c.id}
            type="button"
            className={`Step__chip${order ? ' is-on' : ''}`}
            aria-pressed={order > 0}
            onClick={() => toggle(c.id)}
          >
            {order > 0 && <span className="Step__chipOrder">{order}</span>}
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
