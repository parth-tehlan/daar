import { useEffect, useMemo, useRef, useState } from 'react';
import type { DistrictId, Match } from '../types';
import { useStore } from '../state/store';
import { estimateInventory, estimatedHandover, previewReasons, scoreOne } from '../data';
import { ProjectDetail } from './detail/ProjectDetail';
import { ResultRow } from './ResultRow';
import { PanelFooter } from './PanelFooter';
import { answerChips } from './answerChips';
import { netYieldPct } from '../data/util';
import './ResultsPanel.css';

const AREA_NAME: Record<DistrictId, string> = {
  marina: 'Marina',
  palm: 'the Palm',
  jvc: 'JVC',
  'dubai-hills': 'Dubai Hills',
  downtown: 'Downtown',
  'business-bay': 'Business Bay',
  'mbr-city': 'MBR City',
  'creek-harbour': 'Creek Harbour',
};
function joinNames(n: string[]): string {
  return n.length < 2 ? n.join('') : `${n.slice(0, -1).join(', ')} and ${n[n.length - 1]}`;
}

type SortKey = 'fit' | 'price' | 'handover' | 'yield';
const SORTS: { key: SortKey; label: string }[] = [
  { key: 'fit', label: 'Best fit' },
  { key: 'price', label: 'Price' },
  { key: 'handover', label: 'Handover' },
  { key: 'yield', label: 'Yield' },
];

function sortMatches(ms: Match[], key: SortKey): Match[] {
  const out = [...ms];
  switch (key) {
    case 'price':
      return out.sort((a, b) => a.bestUnit.priceAED - b.bestUnit.priceAED);
    case 'handover':
      return out.sort((a, b) => estimatedHandover(a.project, a.developer) - estimatedHandover(b.project, b.developer));
    case 'yield':
      return out.sort((a, b) => netYieldPct(b.bestUnit, b.project) - netYieldPct(a.bestUnit, a.project));
    default:
      return out.sort((a, b) => b.score - a.score);
  }
}

export function ResultsPanel({ matches }: { matches: Match[] }) {
  const { state, dispatch } = useStore();
  const { view, answers } = state;
  const [sort, setSort] = useState<SortKey>('fit');
  const ref = useRef<HTMLElement>(null);
  const viewKey = view.kind === 'detail' ? `detail:${view.projectId}` : view.kind;

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = 0;
  }, [viewKey]);

  const inventory = useMemo(() => estimateInventory(answers), [answers]);
  const chips = useMemo(() => answerChips(answers), [answers]);
  const outsideOf = (m: Match) => answers.areas.length > 0 && !answers.areas.includes(m.project.district);
  const primary = useMemo(() => sortMatches(matches.filter((m) => !outsideOf(m)), sort), [matches, sort, answers.areas]); // eslint-disable-line react-hooks/exhaustive-deps
  const outside = useMemo(() => sortMatches(matches.filter(outsideOf), sort), [matches, sort, answers.areas]); // eslint-disable-line react-hooks/exhaustive-deps
  const areaList = joinNames(answers.areas.map((d) => AREA_NAME[d]));
  const previews = useMemo(() => previewReasons(matches, answers), [matches, answers]);
  const topId = matches[0]?.project.id;

  const goResults = () => dispatch({ type: 'goto', view: { kind: 'results' } });

  let body;
  if (view.kind === 'detail') {
    const match = matches.find((m) => m.project.id === view.projectId) ?? scoreOne(view.projectId, answers);
    body = match ? (
      <ProjectDetail match={match} answers={answers} matchCount={matches.length} onBack={goResults} />
    ) : (
      <div className="ResultsPanel__inner">
        <button type="button" className="ResultsPanel__edit" onClick={goResults}>
          ← {matches.length} matches
        </button>
      </div>
    );
  } else {
    body = (
      <div className="ResultsPanel__inner">
        <div className="ResultsPanel__bar">
          <span className="ResultsPanel__wordmark wordmark">daar</span>
          <button
            type="button"
            className="ResultsPanel__edit"
            onClick={() => dispatch({ type: 'goto', view: { kind: 'onboarding', step: 0 } })}
          >
            Edit answers
          </button>
        </div>

        <h1 className="ResultsPanel__summary display">
          {answers.areas.length === 0
            ? `${inventory} projects fit. These ${matches.length} fit best.`
            : primary.length === 0
              ? `Nothing fits in ${areaList}. These ${outside.length} sit just outside.`
              : `${primary.length} ${primary.length === 1 ? 'project fits' : 'projects fit'} in ${areaList}.${outside.length ? ` ${outside.length} more just outside.` : ''}`}
        </h1>
        <ul className="ResultsPanel__chips">
          {chips.map((c) => (
            <li key={c.label}>
              <button
                type="button"
                className="ResultsPanel__chip"
                onClick={() => dispatch({ type: 'goto', view: { kind: 'onboarding', step: c.step } })}
              >
                {c.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="ResultsPanel__sorts" role="group" aria-label="Sort results">
          {SORTS.map((s) => (
            <button
              key={s.key}
              type="button"
              className={`ResultsPanel__sort${sort === s.key ? ' is-active' : ''}`}
              aria-pressed={sort === s.key}
              onClick={() => setSort(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <ul className="ResultsPanel__list">
          {primary.map((m) => (
            <ResultRow key={m.project.id} match={m} top={m.project.id === topId} preview={previews.get(m.project.id) ?? ''} />
          ))}
        </ul>
        {outside.length > 0 && (
          <>
            <div className="ResultsPanel__group">Outside your areas</div>
            <ul className="ResultsPanel__list ResultsPanel__list--outside">
              {outside.map((m) => (
                <ResultRow key={m.project.id} match={m} top={false} preview={previews.get(m.project.id) ?? ''} />
              ))}
            </ul>
          </>
        )}
      </div>
    );
  }

  return (
    <aside className="ResultsPanel" ref={ref}>
      {body}
      <PanelFooter />
    </aside>
  );
}
