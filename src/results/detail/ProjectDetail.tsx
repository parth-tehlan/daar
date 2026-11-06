import { useMemo, useState } from 'react';
import type { Answers, Match } from '../../types';
import { handoverTiming, mortgageSummary } from './finance';
import { TopBar, Header } from './sections/Header';
import { Why } from './sections/Why';
import { Units } from './sections/Units';
import { Handover } from './sections/Handover';
import { Payment } from './sections/Payment';
import { Mortgage, type MortgageState } from './sections/Mortgage';
import { Rent } from './sections/Rent';
import { Appreciation } from './sections/Appreciation';
import { ActionBar } from './sections/ActionBar';
import './ProjectDetail.css';
import './sections/sections.css';
import './charts/charts.css';
import './mobile.css';

export interface ProjectDetailProps {
  match: Match;
  answers: Answers;
  /** number of matches, for the "← 10 matches" back link */
  matchCount: number;
  onBack: () => void;
}

/** Keyed by project so unit, mortgage and rent state reset when the project changes. */
export function ProjectDetail(props: ProjectDetailProps) {
  return <DetailBody key={props.match.project.id} {...props} />;
}

function DetailBody({ match, answers, matchCount, onBack }: ProjectDetailProps) {
  const { project, developer } = match;
  const [unitIdx, setUnitIdx] = useState(() =>
    Math.max(0, project.units.findIndex((u) => u.kind === match.bestUnit.kind)));
  const unit = project.units[unitIdx] ?? match.bestUnit;
  const [mort, setMort] = useState<MortgageState>({
    dp: Math.min(80, Math.max(20, Math.round(answers.downPaymentPct))), rate: 4.49, term: 25,
  });
  const timing = useMemo(() => handoverTiming(project, developer), [project, developer]);
  const summary = mortgageSummary(unit.priceAED, project.paymentPlan, mort.dp, mort.rate, mort.term);

  return (
    <article className="detail">
      <div className="detail__inner">
        <TopBar matchCount={matchCount} onBack={onBack} />
        <Header match={match} unit={unit} />
        <Why match={match} />
        <Units units={project.units} selected={unitIdx} onSelect={setUnitIdx} />
        <Handover t={timing} project={project} developer={developer} />
        <Payment plan={project.paymentPlan} price={unit.priceAED} />
        <Mortgage state={mort} onChange={setMort} summary={summary} financing={answers.financing} />
        <Rent unit={unit} serviceChargePsf={project.serviceChargePsf} monthlyMortgage={summary.monthly} financing={answers.financing} />
        <Appreciation price={unit.priceAED} t={timing} developer={developer} />
      </div>
      <ActionBar price={unit.priceAED} monthly={summary.monthly} />
    </article>
  );
}
