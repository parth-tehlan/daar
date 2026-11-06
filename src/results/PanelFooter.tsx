import { useStore } from '../state/store';
import type { Plate } from '../types';

const PLATES: Plate[] = ['166', '303', '296'];

export function PanelFooter() {
  const { state, dispatch } = useStore();
  return (
    <footer className="ResultsPanel__footer">
      <span className="ResultsPanel__muted">Placeholder data</span>
      <span className="ResultsPanel__plates">
        <span className="ResultsPanel__muted">Colour plate</span>
        {PLATES.map((p) => (
          <button
            key={p}
            type="button"
            className={`ResultsPanel__plate${state.plate === p ? ' is-active' : ''}`}
            title="Colours from Sanzo Wada, A Dictionary of Color Combinations"
            aria-pressed={state.plate === p}
            onClick={() => dispatch({ type: 'plate', plate: p })}
          >
            {p}
          </button>
        ))}
      </span>
    </footer>
  );
}
