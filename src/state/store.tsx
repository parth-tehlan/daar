/* App store. Lead-owned contract. */
import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { DEFAULT_ANSWERS, type Answers, type Plate, type View } from '../types';

interface State {
  view: View;
  answers: Answers;
  hoveredId: string | null;
  plate: Plate;
}

type Action =
  | { type: 'setAnswers'; patch: Partial<Answers> }
  | { type: 'goto'; view: View }
  | { type: 'hover'; id: string | null }
  | { type: 'plate'; plate: Plate };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'setAnswers':
      return { ...s, answers: { ...s.answers, ...a.patch } };
    case 'goto':
      return { ...s, view: a.view };
    case 'hover':
      return s.hoveredId === a.id ? s : { ...s, hoveredId: a.id };
    case 'plate':
      return { ...s, plate: a.plate };
  }
}

function initialState(): State {
  // ?view=results or ?view=detail&id=… lets QA screenshot any state directly.
  const q = new URLSearchParams(location.search);
  const plate = (q.get('plate') as Plate) || '166';
  const v = q.get('view');
  const demo: Answers = {
    ...DEFAULT_ANSWERS,
    purpose: 'rent',
    bedrooms: ['1', '2'],
    financing: 'mortgage',
    priorities: ['yield', 'reliability', 'water'],
  };
  if (v === 'results') return { view: { kind: 'results' }, answers: demo, hoveredId: null, plate };
  if (v === 'detail')
    return { view: { kind: 'detail', projectId: q.get('id') ?? '' }, answers: demo, hoveredId: null, plate };
  const step = Number(q.get('step') ?? 0);
  return { view: { kind: 'onboarding', step }, answers: v === 'onboarding' ? demo : DEFAULT_ANSWERS, hoveredId: null, plate };
}

const Ctx = createContext<{ state: State; dispatch: (a: Action) => void } | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  useEffect(() => {
    document.documentElement.dataset.plate = state.plate;
  }, [state.plate]);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useStore outside StoreProvider');
  return c;
}
