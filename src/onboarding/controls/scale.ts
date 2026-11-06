export type Scale = 'linear' | 'log';

/** position of v along the axis, 0..1 */
export function norm(scale: Scale, min: number, max: number, v: number): number {
  if (scale === 'log') return (Math.log(v) - Math.log(min)) / (Math.log(max) - Math.log(min));
  return (v - min) / (max - min);
}

/** inclusive list of values from..to in segments of [upTo, step] */
export function steps(from: number, segs: Array<[number, number]>): number[] {
  const out = [from];
  let v = from;
  for (const [upTo, step] of segs) {
    while (v + step <= upTo + 1e-9) {
      v = Math.round((v + step) * 1000) / 1000;
      out.push(v);
    }
  }
  return out;
}

export function nearestIndex(values: number[], scale: Scale, t: number): number {
  const min = values[0];
  const max = values[values.length - 1];
  let best = 0;
  let d = Infinity;
  values.forEach((v, i) => {
    const dd = Math.abs(norm(scale, min, max, v) - t);
    if (dd < d) {
      d = dd;
      best = i;
    }
  });
  return best;
}
