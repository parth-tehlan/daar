/* Scoring and broker-voice explanations. All inputs are placeholders. */
import type { Answers, Developer, DistrictId, FitReason, Match, Priority, Project, UnitType } from '../types';
import { DISTRICTS } from '../types';
import { getDeveloper } from './developers';
import { PROJECTS } from './projects';
import { aedShort, aedFull, monthlyPayment, netYieldPct, quarterLabel } from './util';
import { handoverTiming } from '../results/detail/finance';

const WEIGHTS = { purpose: 18, budget: 18, size: 10, handover: 18, areas: 8, priorities: 24, plan: 4 };

const districtName = (id: DistrictId) => DISTRICTS.find((d) => d.id === id)!.name;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/** Same rule as the detail page (handoverTiming): promised quarter end + average delay, landing in a quarter.
 *  Returned as the fractional year at the start of that quarter (2029.0 = Q1 2029). */
export function estimatedHandover(p: Project, dev: Developer): number {
  const { estIdx } = handoverTiming(p, dev);
  return (Math.floor(estIdx / 3) * 3) / 12;
}

function budgetFit(price: number, [lo, hi]: [number, number]): number {
  if (price >= lo && price <= hi) return 1;
  if (price < lo) return 0.85; // cheaper than planned is fine, just less of the budget used
  return clamp01(0.6 - ((price - hi) / hi) * 2.4); // slightly over gets a partial score
}

function sizeFit(u: UnitType, a: Answers): number {
  if (a.purpose === 'office') {
    if (u.kind !== 'office') return 0;
    const [lo, hi] = a.officeSqft;
    if (u.sqft >= lo && u.sqft <= hi) return 1;
    const gap = u.sqft < lo ? (lo - u.sqft) / lo : (u.sqft - hi) / hi;
    return clamp01(0.7 - gap);
  }
  if (u.kind === 'office') return 0;
  if (a.bedrooms.length === 0) return 1;
  return a.bedrooms.includes(u.kind) ? 1 : 0;
}

function pickUnit(p: Project, a: Answers): { unit: UnitType; size: number; budget: number } {
  const pool = p.units.filter((u) => (a.purpose === 'office' ? u.kind === 'office' : u.kind !== 'office'));
  const units = pool.length ? pool : p.units;
  let best = units[0];
  let bestScore = -1;
  let bestSize = 0;
  let bestBudget = 0;
  for (const u of units) {
    const size = sizeFit(u, a);
    const budget = budgetFit(u.priceAED, a.budget);
    const yieldBias = a.purpose === 'rent' ? netYieldPct(u, p) / 100 : 0;
    const s = size * 2 + budget * 2 + yieldBias;
    if (s > bestScore) {
      bestScore = s;
      best = u;
      bestSize = size;
      bestBudget = budget;
    }
  }
  return { unit: best, size: bestSize, budget: bestBudget };
}

const SHORT: Record<DistrictId, string> = {
  marina: 'Marina',
  palm: 'the Palm',
  jvc: 'JVC',
  'dubai-hills': 'Dubai Hills',
  downtown: 'Downtown',
  'business-bay': 'Business Bay',
  'mbr-city': 'MBR City',
  'creek-harbour': 'Creek Harbour',
};
/** placeholder district median net yields, % */
const MEDIAN_NET: Record<DistrictId, number> = {
  marina: 5.0, palm: 4.4, jvc: 5.7, 'dubai-hills': 4.8, downtown: 4.6, 'business-bay': 5.3, 'mbr-city': 5.6, 'creek-harbour': 5.2,
};
function yieldFinding(p: Project, unit: UnitType): string {
  const net = netYieldPct(unit, p);
  const d = net - MEDIAN_NET[p.district];
  const area = SHORT[p.district];
  const rel = d >= 0.5 ? `top quartile in ${area}` : d >= 0.15 ? `above the ${area} median` : d > -0.15 ? `in line with the ${area} median` : `below the ${area} median`;
  return `Net yield ≈ ${net.toFixed(1)}% after service charges, ${rel}`;
}

const FACT_RE: Partial<Record<Priority, RegExp>> = {
  water: /water|canal|creek|beach|lagoon|fountain|quay|promenade|waterfront/i,
  commute: /metro|tram|monorail|drive|bus |station/i,
  schools: /school|nursery/i,
  quiet: /quiet|low-rise|no tower|only|park|private|set back|golf/i,
};
/** the project fact that actually speaks to a priority, or undefined */
export function factFor(p: Project, pr: Priority): string | undefined {
  const re = FACT_RE[pr];
  return re ? p.facts.find((f) => re.test(f)) : undefined;
}

function priorityReason(pr: Priority, p: Project, dev: Developer, unit: UnitType): FitReason | null {
  switch (pr) {
    case 'yield':
      return { because: 'Yield is a priority', finding: yieldFinding(p, unit) };
    case 'reliability':
      return {
        because: 'You asked for a reliable developer',
        finding: `${dev.name} has delivered ${dev.deliveredCount} projects, averaging ${dev.avgDelayMonths} ${dev.avgDelayMonths === 1 ? 'month' : 'months'} late`,
      };
    case 'water': {
      const f = factFor(p, pr);
      return f ? { because: 'You want to be near water', finding: f } : null;
    }
    case 'growth':
      return { because: 'You want capital growth', finding: `${dev.name} projects have gained ≈ ${dev.avgAnnualAppreciationPct.toFixed(1)}% a year since launch` };
    case 'schools':
    case 'commute':
    case 'quiet': {
      const f = factFor(p, pr);
      const because = { schools: 'Schools matter to you', commute: 'Commute matters to you', quiet: 'You want a quiet address' }[pr];
      return f ? { because, finding: f } : null;
    }
  }
}

function purposeReason(p: Project, unit: UnitType, a: Answers): FitReason {
  switch (a.purpose) {
    case 'rent':
      return { because: "You're renting it out", finding: yieldFinding(p, unit) };
    case 'office':
      return { because: 'You need an office', finding: `${unit.sqft.toLocaleString('en-US')} sq ft at ${aedShort(unit.priceAED)}, ≈ ${aedFull(unit.estAnnualRentAED / 12)} / mo if let` };
    case 'hold':
      return { because: "You're holding for growth", finding: `${p.constructionPct}% built; ${districtName(p.district)} pricing here is ≈ AED ${Math.round(unit.priceAED / unit.sqft).toLocaleString('en-US')} / sq ft` };
    case 'live':
      return { because: "You're buying to live in it", finding: p.facts[0] };
    default:
      return { because: 'Open to any use', finding: p.facts[0] };
  }
}

function scoreProject(p: Project, a: Answers): Match {
  const dev = getDeveloper(p.developerId);
  const { unit, size, budget } = pickUnit(p, a);
  const est = estimatedHandover(p, dev);
  const lateYears = Math.max(0, est - a.handoverBy);

  const purpose = a.purpose === null ? 0.7 : p.purposes.includes(a.purpose) ? 1 : a.purpose === 'hold' || a.purpose === 'rent' ? 0.4 : 0.1;
  const handover = clamp01(1 - lateYears * 1.1);
  const areas = a.areas.length === 0 ? 1 : a.areas.includes(p.district) ? 1 : 0.15;
  const rankW = [1, 0.7, 0.5];
  const prFit = (pr: Priority): number => {
    const tagged = p.tags.includes(pr) ? 1 : 0;
    if (pr === 'yield') return 0.7 * clamp01((netYieldPct(unit, p) - 4.8) / 2) + 0.3 * tagged;
    if (pr === 'reliability') return 0.7 * clamp01(1 - (dev.avgDelayMonths - 1) / 10) + 0.3 * tagged;
    if (pr === 'growth') return 0.7 * clamp01((dev.avgAnnualAppreciationPct - 6) / 5) + 0.3 * tagged;
    return tagged;
  };
  const totalW = a.priorities.reduce((s, _, i) => s + rankW[i], 0);
  const gotW = a.priorities.reduce((s, pr, i) => s + prFit(pr) * rankW[i], 0);
  const priorities = totalW === 0 ? 1 : 0.1 + 0.9 * (gotW / totalW);
  const hasPost = p.paymentPlan.some((m) => /post-handover/i.test(m.label));
  const plan = a.planPreference === 'post-handover' ? (hasPost ? 1 : 0.2) : 1;

  const raw =
    WEIGHTS.purpose * purpose +
    WEIGHTS.budget * budget +
    WEIGHTS.size * size +
    WEIGHTS.handover * handover +
    WEIGHTS.areas * areas +
    WEIGHTS.priorities * priorities +
    WEIGHTS.plan * plan;
  const score = Math.round(Math.max(0, Math.min(100, raw)));

  const reasons: FitReason[] = [purposeReason(p, unit, a)];
  a.priorities.forEach((pr) => {
    if (pr === 'yield' && a.purpose === 'rent') return; // already covered by the purpose reason
    const r = priorityReason(pr, p, dev, unit);
    if (r && reasons.length < 3) reasons.push(r);
  });

  if (a.handoverBy && reasons.length < 4) {
    const delay = dev.avgDelayMonths;
    const estQ = quarterLabel(est);
    const short = dev.name.replace(/ (Developments|Properties|Estates|Real Estate|& Partners)$/, '');
    const margin = Math.round((a.handoverBy - est) * 4);
    const nQ = (n: number) => ['a', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'][n - 1] ?? String(n);
    const plan =
      margin < 0
        ? `With ${short} averaging a ${delay}-month slip, plan for ${estQ}, ${nQ(-margin)} ${-margin === 1 ? 'quarter' : 'quarters'} past your ${quarterLabel(a.handoverBy)} window.`
        : margin === 0
          ? `With ${short} averaging a ${delay}-month slip, plan for ${estQ}, right at the edge of your window.`
          : `With ${short} averaging a ${delay}-month slip, plan for ${estQ}, ${nQ(margin)} ${margin === 1 ? 'quarter' : 'quarters'} inside your window.`;
    const finding = `Promised ${p.handoverPromised}. ${estQ === p.handoverPromised ? plan.replace(/plan for \S+ \d{4}/, 'it stays in that quarter') : plan}`;
    reasons.push({ because: `You want keys by ${quarterLabel(a.handoverBy)}`, finding });
  }
  if (reasons.length < 4 && unit.priceAED < a.budget[0]) {
    reasons.push({
      because: `Your budget is ${aedShort(a.budget[0], 1)}–${aedShort(a.budget[1], 1).replace('AED ', '')}`,
      finding: `${aedShort(unit.priceAED)}, under your range, leaving room for a larger unit`,
    });
  } else if (reasons.length < 4 && budget === 1) {
    reasons.push({
      because: `Your budget is ${aedShort(a.budget[0], 1)}–${aedShort(a.budget[1], 1).replace('AED ', '')}`,
      finding: `${unit.kind === 'office' ? 'An office' : unit.kind === 'studio' ? 'A studio' : `A ${unit.kind} bed`} here is ${aedShort(unit.priceAED)}, inside it`,
    });
  }
  if (reasons.length < 4 && a.financing === 'mortgage') {
    const loan = unit.priceAED * (1 - a.downPaymentPct / 100);
    reasons.push({
      because: `You're financing with ${a.downPaymentPct}% down`,
      finding: `${aedShort(unit.priceAED * (a.downPaymentPct / 100))} down, then ≈ ${aedFull(monthlyPayment(loan))} / mo over 25 years`,
    });
  }

  let caveat: string | undefined;
  if (lateYears > 0.01) {
    const q = Math.max(1, Math.round(lateYears * 4));
    caveat = `Our handover estimate is ${quarterLabel(est)}, ${q === 1 ? 'a quarter' : `${q} quarters`} past your window.`;
  } else if (budget < 1) {
    const over = unit.priceAED - a.budget[1];
    if (over > 0) caveat = `The closest unit is ${aedShort(unit.priceAED)}, ${aedShort(over, 2).replace('AED ', 'AED ')} over your budget.`;
  } else if (dev.avgDelayMonths >= 9) {
    caveat = `${dev.name} has averaged ${dev.avgDelayMonths} months late. Budget for a slip.`;
  }

  return { project: p, developer: dev, score, bestUnit: unit, reasons: reasons.slice(0, 4), caveat };
}

export function scoreOne(id: string, a: Answers): Match | undefined {
  const p = PROJECTS.find((x) => x.id === id);
  return p ? scoreProject(p, a) : undefined;
}

/** With areas chosen, only projects in them are matches; if that is thin, the best of the rest follow as `outside`. */
export function matchGroups(a: Answers): { primary: Match[]; outside: Match[] } {
  const all = PROJECTS.map((p) => scoreProject(p, a)).sort((x, y) => y.score - x.score);
  if (a.areas.length === 0) return { primary: all.filter((m) => m.score >= 40).slice(0, 10), outside: [] };
  const primary = all.filter((m) => a.areas.includes(m.project.district)).slice(0, 10);
  const floor = primary.length ? primary[primary.length - 1].score - 1 : 100;
  const outside =
    primary.length < 5
      ? all.filter((m) => !a.areas.includes(m.project.district) && m.score >= 30).slice(0, Math.min(5, 9 - primary.length)).map((m) => ({ ...m, score: Math.min(m.score, floor) }))
      : [];
  return { primary, outside };
}

export function matchProjects(a: Answers): Match[] {
  const g = matchGroups(a);
  return [...g.primary, ...g.outside];
}

/** deterministic size of Dubai's whole matching off-plan stock */
export function estimateInventory(a: Answers): number {
  let n = 600;
  if (a.purpose === 'office') n *= 0.22;
  else if (a.purpose === 'live') n *= 0.85;
  // budget: overlap on a log scale between 0.4M and 15M
  const lo = Math.log10(0.4e6);
  const hi = Math.log10(15e6);
  const bl = Math.max(lo, Math.log10(Math.max(1, a.budget[0])));
  const bh = Math.min(hi, Math.log10(Math.max(1, a.budget[1])));
  n *= Math.max(0.1, (bh - bl) / (hi - lo) + 0.25);
  if (a.purpose !== 'office' && a.bedrooms.length) n *= 0.3 + 0.7 * Math.min(1, a.bedrooms.length / 3);
  if (a.purpose === 'office') n *= Math.max(0.3, Math.min(1, (a.officeSqft[1] - a.officeSqft[0]) / 2500 + 0.2));
  // handover: stock is thin before 2028 and fuller after
  n *= clamp01((a.handoverBy - 2027) / 3.2) * 0.8 + 0.2;
  if (a.areas.length) n *= Math.min(1, 0.12 + a.areas.length * 0.14);
  n *= 1 - a.priorities.length * 0.04;
  if (a.planPreference === 'post-handover') n *= 0.55;
  return Math.max(40, Math.min(600, Math.round(n)));
}

/** The row preview: the reason where this match beats the other matches by the most. */
export function previewReasons(ms: Match[], a: Answers): Map<string, string> {
  type Cand = { kind: string; text: string; value: number };
  const per = ms.map((m) => {
    const p = m.project;
    const dev = m.developer;
    const post = p.paymentPlan.find((x) => /post/i.test(x.label));
    const yrs = post ? /(\d+)\s*yr/i.exec(post.label)?.[1] : undefined;
    const c: Cand[] = [
      { kind: 'yield', text: yieldFinding(p, m.bestUnit), value: netYieldPct(m.bestUnit, p) },
      { kind: 'reliability', text: `${dev.name} has delivered ${dev.deliveredCount} projects, averaging ${dev.avgDelayMonths} ${dev.avgDelayMonths === 1 ? 'month' : 'months'} late`, value: -dev.avgDelayMonths },
      { kind: 'growth', text: `${dev.name} projects have gained ≈ ${dev.avgAnnualAppreciationPct.toFixed(1)}% a year since launch`, value: dev.avgAnnualAppreciationPct },
      { kind: 'built', text: `${p.constructionPct}% built, handover promised ${p.handoverPromised}`, value: p.constructionPct },
      { kind: 'early', text: `Keys expected ${quarterLabel(estimatedHandover(p, dev))}, ${Math.max(1, Math.round((a.handoverBy - estimatedHandover(p, dev)) * 4))} quarters ahead of your window`, value: -estimatedHandover(p, dev) },
    ];
    if (post) c.push({ kind: 'plan', text: `Post-handover plan: ${post.pct}% paid${yrs ? ` over ${yrs} years` : ''} after keys`, value: post.pct });
    for (const pr of a.priorities) {
      const f = factFor(p, pr);
      if (f) c.push({ kind: 'fact', text: f, value: NaN });
    }
    if (a.priorities.length === 0) c.push({ kind: 'fact', text: p.facts[0], value: NaN });
    return c;
  });
  const stat = new Map<string, { mean: number; sd: number }>();
  for (const kind of ['yield', 'reliability', 'growth', 'built', 'early', 'plan']) {
    const vals = per.flatMap((c) => c.filter((x) => x.kind === kind).map((x) => x.value));
    const mean = vals.reduce((x, y) => x + y, 0) / Math.max(1, vals.length);
    const sd = Math.sqrt(vals.reduce((x, y) => x + (y - mean) ** 2, 0) / Math.max(1, vals.length)) || 1;
    stat.set(kind, { mean, sd });
  }
  const used = new Map<string, number>();
  const out = new Map<string, string>();
  ms.forEach((m, i) => {
    let best: Cand | null = null;
    let bestZ = -Infinity;
    for (const c of per[i]) {
      const st = stat.get(c.kind);
      const z = st ? (c.value - st.mean) / st.sd : 0.9; // a specific local fact reads as distinctive
      const adj = z - (used.get(c.kind) ?? 0) * 0.7 - (c.kind === 'built' || c.kind === 'early' ? 0.4 : 0);
      if (adj > bestZ) {
        bestZ = adj;
        best = c;
      }
    }
    if (best) {
      used.set(best.kind, (used.get(best.kind) ?? 0) + 1);
      const outside = a.areas.length > 0 && !a.areas.includes(m.project.district);
      out.set(m.project.id, outside ? `In ${SHORT[m.project.district]}, outside your areas. ${best.text}` : best.text);
    }
  });
  return out;
}
