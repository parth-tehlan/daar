import type { Match, UnitType } from '../../../types';
import { DISTRICTS } from '../../../types';
import { aedCompact, int } from '../format';
import { quarterLabel, parseWhen } from '../finance';
import { StatRow } from './Parts';

export function TopBar({ matchCount, onBack }: { matchCount: number; onBack: () => void }) {
  return (
    <div className="detail-topbar">
      <button type="button" className="detail-link" onClick={onBack}>← {matchCount} matches</button>
      {/* TODO(integration): wire to a shortlist store once one exists */}
      <button type="button" className="detail-link">Shortlist +</button>
    </div>
  );
}

export function Header({ match, unit }: { match: Match; unit: UnitType }) {
  const { project, developer } = match;
  const district = DISTRICTS.find((d) => d.id === project.district)?.name ?? '';
  return (
    <header className="detail-head">
      <p className="detail-head__label mono-label">{developer.name} · {district}</p>
      <h1 className="detail-head__name display">
        {project.name}
        {project.subtitle ? <span className="detail-head__sub"> {project.subtitle}</span> : null}
      </h1>
      <p className="detail-head__facts">{project.facts.slice(0, 2).join(' · ')}</p>
      <StatRow items={[
        { label: 'From', value: aedCompact(unit.priceAED) },
        { label: 'Size', value: int(unit.sqft), unit: 'sq ft' },
        { label: 'Handover', value: quarterLabel(parseWhen(project.handoverPromised)) },
        { label: 'Fit', value: match.score, accent: true },
      ]} />
    </header>
  );
}
