import type { Developer } from '../../../types';
import { SHORT_DISTRICT } from '../shortNames';
import { AppreciationChart } from '../charts/AppreciationChart';
import { annualisedPct, idxToYear, TODAY_IDX, type HandoverTiming } from '../finance';
import { int } from '../format';
import { Section } from './Parts';

interface Props { price: number; t: HandoverTiming; developer: Developer }

export function Appreciation({ price, t, developer }: Props) {
  const g = developer.avgAnnualAppreciationPct;
  const today = idxToYear(TODAY_IDX);
  const since = Math.min(...developer.pastProjects.map((p) => p.launchYear));
  return (
    <Section n="07" title="Appreciation">
      <p className="detail-note">
        {developer.name} has delivered {developer.deliveredCount} projects. Those launched since {since} gained {g.toFixed(1)}% a year on average; the {developer.pastProjects.length} most recent are below.
      </p>
      <AppreciationChart price={price} growthPct={g} todayYear={today} handoverYear={idxToYear(t.estIdx)} />
      <p className="detail-small">The shaded range is the average gain ± 3 points a year. It is a spread of past outcomes, not a forecast.</p>
      <div className="detail-record num" role="table" aria-label="Developer record">
        <div className="detail-record__row detail-record__head mono-label" role="row">
          <span>Project</span><span>District</span><span className="r nw">AED/sq ft, launch → now</span><span className="r">Per year</span><span className="r">Delay</span>
        </div>
        {developer.pastProjects.map((p, i) => (
          <div className="detail-record__row" role="row" key={`${i}-${p.name}`}>
            <span>{p.name}</span>
            <span>{SHORT_DISTRICT[p.district]}</span>
            <span className="r nw">{int(p.launchPsf)} → {int(p.currentPsf)}</span>
            <span className="r">{annualisedPct(p.launchPsf, p.currentPsf, today - p.launchYear).toFixed(1)}%</span>
            <span className="r">{p.delayMonths === 0 ? 'On time' : `+${p.delayMonths} mo`}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}
