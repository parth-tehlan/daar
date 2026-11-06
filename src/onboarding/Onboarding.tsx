import { useEffect, useRef } from 'react';
import { estimateInventory } from '../data';
import { useStore } from '../state/store';
import { ONBOARDING_STEPS, type Answers } from '../types';
import { STEPS } from './steps';
import './Onboarding.css';

const LAST = ONBOARDING_STEPS.length - 1;

export function Onboarding() {
  const { state, dispatch } = useStore();
  const { view, answers } = state;
  const step = view.kind === 'onboarding' ? Math.max(0, Math.min(view.step, LAST)) : 0;
  const def = STEPS[step];
  const valid = def.valid(answers);
  const n = estimateInventory(answers);
  const patch = (p: Partial<Answers>) => dispatch({ type: 'setAnswers', patch: p });

  const next = () => {
    if (!valid) return;
    dispatch({ type: 'goto', view: step === LAST ? { kind: 'results' } : { kind: 'onboarding', step: step + 1 } });
  };
  const back = () => {
    if (step > 0) dispatch({ type: 'goto', view: { kind: 'onboarding', step: step - 1 } });
  };

  const fns = useRef({ next, back });
  fns.current = { next, back };
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        fns.current.next();
      } else if (e.key === 'Escape') fns.current.back();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const Step = def.Component;
  return (
    <div className="Onboarding">
      <header className="Onboarding__top">
        <div className="Onboarding__brand">
          <span className="Onboarding__wordmark display">daar</span>
          <span className="mono-label Onboarding__tag">Dubai · Off-plan</span>
        </div>
        <span className="Onboarding__counter num">
          {String(step + 1).padStart(2, '0')} / {String(ONBOARDING_STEPS.length).padStart(2, '0')}
        </span>
      </header>

      <main className={`Onboarding__col${def.wide ? ' Onboarding__col--wide' : ''}`}>
        <h1 className="display Onboarding__title">{def.title(answers)}</h1>
        <p className="Onboarding__helper">{def.helper(answers)}</p>
        <div className="Onboarding__control">
          <Step answers={answers} patch={patch} />
        </div>
      </main>

      <footer className="Onboarding__bottom">
        <div className="Onboarding__segments" aria-hidden="true">
          {ONBOARDING_STEPS.map((id, i) => (
            <span key={id} className="Onboarding__seg">
              <span className="Onboarding__fill" style={{ width: i <= step ? '100%' : '0%' }} />
            </span>
          ))}
        </div>
        <div className="Onboarding__row">
          {step > 0 ? (
            <button type="button" className="Onboarding__back" onClick={back}>
              ← Back
            </button>
          ) : (
            <span />
          )}
          <div className="Onboarding__right">
            {step !== LAST && (
              <span className="mono-label Onboarding__count" aria-live="polite">
                <span className="Onboarding__n num">{n}</span> projects fit so far
              </span>
            )}
            <button type="button" className="Onboarding__primary" disabled={!valid} onClick={next}>
              <span>{step === LAST ? `Show ${n} matches →` : 'Continue'}</span>
              {step !== LAST && <span className="Onboarding__enter">↵</span>}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
