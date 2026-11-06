import { useDigitKeys } from './useDigitKeys';
import './ChoiceRows.css';

export interface ChoiceOption {
  id: string;
  label: string;
  desc: string;
}

interface Props {
  options: ChoiceOption[];
  selected: string[];
  onPick: (id: string) => void;
  multi?: boolean;
  compact?: boolean;
  label: string;
}

export function ChoiceRows({ options, selected, onPick, multi, compact, label }: Props) {
  useDigitKeys(options.length, (n) => onPick(options[n - 1].id));
  return (
    <div
      className={`ChoiceRows${compact ? ' ChoiceRows--compact' : ''}`}
      role={multi ? 'group' : 'radiogroup'}
      aria-label={label}
    >
      {options.map((o, i) => {
        const on = selected.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            className={`ChoiceRows__row${on ? ' is-on' : ''}`}
            role={multi ? undefined : 'radio'}
            aria-checked={multi ? undefined : on}
            aria-pressed={multi ? on : undefined}
            onClick={() => onPick(o.id)}
          >
            <span className="ChoiceRows__index">
              {on ? <span className="ChoiceRows__mark" /> : String(i + 1).padStart(2, '0')}
            </span>
            <span className="ChoiceRows__label">{o.label}</span>
            <span className="ChoiceRows__desc">{o.desc}</span>
          </button>
        );
      })}
    </div>
  );
}
