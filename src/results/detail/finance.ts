/* Pure finance + date maths for the detail panel. No React, no formatting. */
import type { Developer, PaymentMilestone, Project, UnitType } from '../../types';

/** The mockup's "today": Nov 2026. Month index = year * 12 + month0. */
export const TODAY_IDX = 2026 * 12 + 10;
export const DLD_FEE_PCT = 4;
export const ADMIN_FEE_AED = 5000;
export const HOLIDAY_UPLIFT = 1.35;
export const HOLIDAY_MGMT = 0.2;
export const HOLIDAY_VACANCY = 0.15;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Nov 2024", "Q3 2028" or "2027" to a month index. A quarter resolves to its first or last month. */
export function parseWhen(s: string, edge: 'start' | 'end' = 'end', fallbackYear = 2028): number {
  const q = /Q([1-4])\s+(\d{4})/i.exec(s);
  if (q) return Number(q[2]) * 12 + (edge === 'end' ? Number(q[1]) * 3 - 1 : (Number(q[1]) - 1) * 3);
  const m = /([A-Za-z]{3})[a-z]*\.?\s+(\d{4})/.exec(s);
  if (m) {
    const mi = MONTHS.findIndex((x) => x.toLowerCase() === m[1].toLowerCase());
    if (mi >= 0) return Number(m[2]) * 12 + mi;
  }
  const y = /(\d{4})/.exec(s);
  return (y ? Number(y[1]) : fallbackYear) * 12 + (edge === 'end' ? 11 : 0);
}

export const monthLabel = (idx: number) => `${MONTHS[idx % 12]} ${Math.floor(idx / 12)}`;
export const quarterLabel = (idx: number) => `Q${Math.floor((idx % 12) / 3) + 1} ${Math.floor(idx / 12)}`;
/** last month of the quarter containing idx */
export const quarterEnd = (idx: number) => Math.floor(idx / 3) * 3 + 2;
export const idxToYear = (idx: number) => idx / 12;

export interface HandoverTiming {
  launchIdx: number;
  todayIdx: number;
  promisedIdx: number;
  estIdx: number;
  promisedLabel: string;
  estLabel: string;
  /** whole months added to the promise */
  delayMonths: number;
  /** half-width of the uncertainty band, months */
  uncertaintyMonths: number;
}

/** Estimate = promised quarter end + developer's average delay, rounded to the quarter it lands in. */
export function handoverTiming(project: Project, dev: Developer): HandoverTiming {
  const launchIdx = parseWhen(project.launched, 'start', Math.floor(project.handoverPromisedYear) - 2);
  const promisedIdx = quarterEnd(parseWhen(project.handoverPromised, 'end', Math.round(project.handoverPromisedYear)));
  const delayMonths = Math.max(0, Math.round(dev.avgDelayMonths));
  const estIdx = quarterEnd(promisedIdx + delayMonths);
  return {
    launchIdx, todayIdx: TODAY_IDX, promisedIdx, estIdx,
    promisedLabel: quarterLabel(promisedIdx), estLabel: quarterLabel(estIdx),
    delayMonths, uncertaintyMonths: 3,
  };
}

/* ───────── Payment plan ───────── */

export const isPostHandover = (m: PaymentMilestone) => /post/i.test(m.label);
export const isOnHandover = (m: PaymentMilestone) => /on handover/i.test(m.label) && !isPostHandover(m);

/** share of the price paid before handover (booking + construction instalments) */
export const preHandoverPct = (plan: PaymentMilestone[]) =>
  plan.filter((m) => !isPostHandover(m) && !isOnHandover(m)).reduce((a, m) => a + m.pct, 0);

export const postHandoverPct = (plan: PaymentMilestone[]) =>
  plan.filter(isPostHandover).reduce((a, m) => a + m.pct, 0);

/* ───────── Mortgage ───────── */

/** standard amortisation; ratePct is the annual rate in percent */
export function monthlyPayment(principal: number, ratePct: number, years: number): number {
  const n = years * 12;
  const r = ratePct / 100 / 12;
  if (principal <= 0) return 0;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

export interface MortgageSummary {
  loan: number;
  monthly: number;
  totalInterest: number;
  cashByHandover: number;
  /** price share actually paid in cash by handover */
  paidPct: number;
}

/**
 * Mortgages start at handover. Before that the buyer pays the plan's construction
 * instalments in cash. The bank's down payment requirement is dpPct of the price, so
 * the buyer has put in max(dpPct, instalments paid so far) by handover; the loan covers
 * everything still owing (post-handover instalments are folded into the loan for simplicity).
 * Cash needed by handover = that share of the price + 4% DLD fee + AED 5,000 admin.
 */
export function mortgageSummary(
  price: number, plan: PaymentMilestone[], dpPct: number, ratePct: number, years: number,
): MortgageSummary {
  const paidPct = Math.max(dpPct, preHandoverPct(plan));
  const loan = price * (1 - paidPct / 100);
  const monthly = monthlyPayment(loan, ratePct, years);
  return {
    loan, monthly, paidPct,
    totalInterest: monthly * years * 12 - loan,
    cashByHandover: (price * paidPct) / 100 + (price * DLD_FEE_PCT) / 100 + ADMIN_FEE_AED,
  };
}

/* ───────── Rent ───────── */

export type RentMode = 'long' | 'holiday';

export interface RentSummary {
  rent: number;
  service: number;
  grossYieldPct: number;
  netYieldPct: number;
  netMonthly: number;
}

export function rentSummary(unit: UnitType, serviceChargePsf: number, mode: RentMode): RentSummary {
  const rent = mode === 'long'
    ? unit.estAnnualRentAED
    : unit.estAnnualRentAED * HOLIDAY_UPLIFT * (1 - HOLIDAY_MGMT) * (1 - HOLIDAY_VACANCY);
  const service = serviceChargePsf * unit.sqft;
  return {
    rent, service,
    grossYieldPct: (rent / unit.priceAED) * 100,
    netYieldPct: ((rent - service) / unit.priceAED) * 100,
    netMonthly: (rent - service) / 12,
  };
}

/* ───────── Appreciation ───────── */

/** value after `years` at an annual rate of ratePct */
export const grow = (price: number, ratePct: number, years: number) =>
  price * Math.pow(1 + ratePct / 100, Math.max(0, years));

/** annualised growth between two psf figures over a number of years */
export function annualisedPct(from: number, to: number, years: number): number {
  if (from <= 0 || years <= 0) return 0;
  return (Math.pow(to / from, 1 / years) - 1) * 100;
}
