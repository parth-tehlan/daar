/* Small shared helpers for the placeholder data layer. */
import type { Project, UnitType } from '../types';

/** "today" for the mockup: Nov 2026 */
export const NOW = 2026.85;

/** "Q3 2028" -> 2028.5 */
export function parseQuarter(q: string): number {
  const m = /Q([1-4])\s+(\d{4})/.exec(q);
  if (!m) return NOW;
  return Number(m[2]) + (Number(m[1]) - 1) / 4;
}

/** 2028.5 -> "Q3 2028" (tolerates small float error) */
export function quarterLabel(year: number): string {
  const y = Math.floor(year + 1e-6);
  const q = Math.min(3, Math.max(0, Math.floor((year - y) * 4 + 1e-6)));
  return `Q${q + 1} ${y}`;
}

export function addQuarters(q: string, n: number): string {
  return quarterLabel(parseQuarter(q) + n / 4);
}

/** "Feb 2025" -> 2025.083 */
export function parseMonthYear(s: string): number {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [mon, yr] = s.split(' ');
  return Number(yr) + Math.max(0, months.indexOf(mon)) / 12;
}

/** AED 1.84M / AED 640K */
export function aedShort(n: number, digits = 2): string {
  if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(digits)}M`;
  return `AED ${Math.round(n / 1000)}K`;
}

export function aedFull(n: number): string {
  return `AED ${Math.round(n).toLocaleString('en-US')}`;
}

/** monthly payment on a 25-year loan at 4.9% */
export function monthlyPayment(loan: number, rate = 0.049, years = 25): number {
  const r = rate / 12;
  const n = years * 12;
  return (loan * r) / (1 - Math.pow(1 + r, -n));
}

/** net yield % after service charges */
export function netYieldPct(u: UnitType, p: Project): number {
  return ((u.estAnnualRentAED - p.serviceChargePsf * u.sqft) / u.priceAED) * 100;
}
export function grossYieldPct(u: UnitType): number {
  return (u.estAnnualRentAED / u.priceAED) * 100;
}
