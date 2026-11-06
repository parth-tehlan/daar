import type { Match } from '../types';
import { aedShort } from '../data/util';
import { useStore } from '../state/store';

interface Props {
  match: Match;
  top: boolean;
  preview: string;
}

export function ResultRow({ match, top, preview }: Props) {
  const { state, dispatch } = useStore();
  const { project: p, developer, bestUnit, reasons, score } = match;
  const open = () => dispatch({ type: 'goto', view: { kind: 'detail', projectId: p.id } });
  const hovered = state.hoveredId === p.id;
  return (
    <li className="ResultRow-li">
      <div
        className={`ResultRow${hovered ? ' ResultRow--hover' : ''}`}
        role="button"
        tabIndex={0}
        onClick={open}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            open();
          }
        }}
        onMouseEnter={() => dispatch({ type: 'hover', id: p.id })}
        onMouseLeave={() => dispatch({ type: 'hover', id: null })}
      >
        <div className="ResultRow__main">
          <div className="ResultRow__name">
            {p.name}
            {p.subtitle && <span className="ResultRow__sub"> {p.subtitle}</span>}
          </div>
          <div className="ResultRow__meta">
            {developer.name}, {ROW_DISTRICT[p.district]}
          </div>
        </div>
        <div className="ResultRow__figures">
          <div className="ResultRow__price num">{aedShort(bestUnit.priceAED)}</div>
          <div className="ResultRow__handover num">Handover {p.handoverPromised}</div>
        </div>
        <div className="ResultRow__score">
          <div className={`ResultRow__scoreNum num${top ? ' ResultRow__scoreNum--top' : ''}`}>{score}</div>
          <div className="ResultRow__fit">fit</div>
        </div>
        <div className="ResultRow__reason">{preview || reasons[0]?.finding}</div>
      </div>
    </li>
  );
}

import type { DistrictId } from '../types';
const ROW_DISTRICT: Record<DistrictId, string> = {
  marina: 'Dubai Marina',
  palm: 'Palm Jumeirah',
  jvc: 'JVC',
  'dubai-hills': 'Dubai Hills',
  downtown: 'Downtown',
  'business-bay': 'Business Bay',
  'mbr-city': 'MBR City',
  'creek-harbour': 'Creek Harbour',
};
