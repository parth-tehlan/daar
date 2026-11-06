/** AED compact formatting: 1.2M / 950K */
export function fmtAED(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  return `${Math.round(v / 1000)}K`;
}

export function fmtInt(v: number): string {
  return v.toLocaleString('en-US');
}

/** fractional year to "Q3 2028" */
export function fmtQuarter(y: number): string {
  const year = Math.floor(y + 1e-6);
  const q = Math.round((y - year) * 4) + 1;
  return `Q${q} ${year}`;
}

/** tick label: 1M, 1.5M, 400K (no trailing .0) */
export function fmtTick(v: number): string {
  return fmtAED(v).replace('.0M', 'M');
}
