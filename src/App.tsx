/* App shell. Lead-owned. The canvas is always mounted full-bleed; the paper
   panel sits over its left side in results/detail. The scene offsets its own
   camera (setViewOffset) so the city is composed in the visible region. */
import { useMemo } from 'react';
import { useStore } from './state/store';
import { Onboarding } from './onboarding/Onboarding';
import { CityScene } from './scene/CityScene';
import { ResultsPanel } from './results/ResultsPanel';
import { matchProjects } from './data';
import { ONBOARDING_STEPS } from './types';
import './App.css';

export default function App() {
  const { state, dispatch } = useStore();
  const { view, answers, hoveredId } = state;
  const matches = useMemo(() => matchProjects(answers), [answers]);

  const mode = view.kind;
  const step = view.kind === 'onboarding' ? Math.min(view.step, ONBOARDING_STEPS.length - 1) : 0;
  const selectedId = view.kind === 'detail' ? view.projectId : null;

  return (
    <div className={`app app--${mode}`}>
      <div className="app__scene">
        <CityScene
          mode={mode}
          step={step}
          focusDistricts={answers.areas}
          projects={mode === 'onboarding' ? [] : matches.map((m) => m.project)}
          hoveredId={hoveredId}
          selectedId={selectedId}
          onHover={(id) => dispatch({ type: 'hover', id })}
          onSelect={(id) => dispatch({ type: 'goto', view: { kind: 'detail', projectId: id } })}
        />
      </div>
      {mode === 'onboarding' ? <Onboarding /> : <ResultsPanel matches={matches} />}
    </div>
  );
}
