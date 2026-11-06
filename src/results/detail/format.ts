/* Number formatting for the detail panel. */

const trim = (s: string) => s.replace(/\.0+$/, '').replace(/(\.\d)0$/, '$1');

/** 1.84M, 950K, 3.1M. No currency prefix. */
export function compact(n: number): string {
  const a = Math.abs(n);
  if (a >= 1_000_000) return trim((n / 1_000_000).toFixed(2)) + 'M';
  if (a >= 1_000) return Math.round(n / 1_000) + 'K';
  return String(Math.round(n));
}

/** "AED 1.84M" */
export const aedCompact = (n: number) => `AED ${compact(n)}`;

/** 9,840 */
export const int = (n: number) => Math.round(n).toLocaleString('en-US');

/** "AED 1,840,000" */
export const aedFull = (n: number) => `AED ${int(n)}`;

/** axis tick, always one decimal in millions: 2.0M */
export const axisM = (n: number) => `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;

export const pct = (n: number, digits = 1) => `${n.toFixed(digits)}%`;

export const unitLabel = (kind: string) =>
  kind === 'studio' ? 'Studio' : kind === 'office' ? 'Office' : `${kind} bed`;
