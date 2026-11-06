import type { KeyboardEvent, ReactNode } from 'react';
import { norm, nearestIndex, type Scale } from './scale';
import './RangeSlider.css';

export interface Tick {
  value: number;
  label?: string;
}

interface Props {
  /** allowed values, ascending */
  values: number[];
  scale: Scale;
  /** one value = single thumb, two = range */
  value: number[];
  onChange: (v: number[]) => void;
  label: string;
  format: (v: number) => string;
  ticks?: Tick[];
  /** short unlabelled hairlines */
  minorTicks?: number[];
  above?: ReactNode;
}

const RES = 1000;

export function RangeSlider({ values, scale, value, onChange, label, format, ticks, minorTicks, above }: Props) {
  const min = values[0];
  const max = values[values.length - 1];
  const t = (v: number) => norm(scale, min, max, v);
  const idxOf = (v: number) => nearestIndex(values, scale, t(v));
  const dual = value.length === 2;
  const idx = value.map(idxOf);

  const setIdx = (i: number, next: number) => {
    let n = Math.max(0, Math.min(values.length - 1, next));
    if (dual) n = i === 0 ? Math.min(n, idx[1] - 1) : Math.max(n, idx[0] + 1);
    if (n === idx[i] || n < 0 || n > values.length - 1) return;
    const out = idx.map((x, k) => values[k === i ? n : x]);
    onChange(out);
  };

  const onKey = (i: number) => (e: KeyboardEvent) => {
    const d: Record<string, number> = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1, PageDown: -5, PageUp: 5 };
    if (e.key in d) setIdx(i, idx[i] + d[e.key]);
    else if (e.key === 'Home') setIdx(i, 0);
    else if (e.key === 'End') setIdx(i, values.length - 1);
    else return;
    e.preventDefault();
  };

  const a = dual ? t(values[idx[0]]) : 0;
  const b = t(values[idx[dual ? 1 : 0]]);
  const names = dual ? [`${label}, minimum`, `${label}, maximum`] : [label];

  return (
    <div className="RangeSlider">
      {above}
      <div className="RangeSlider__frame">
        <span className="RangeSlider__track" />
        <span className="RangeSlider__fill" style={{ ['--a' as string]: a, ['--b' as string]: b }} />
        {value.map((_, i) => (
          <input
            key={i}
            className="RangeSlider__input"
            type="range"
            min={0}
            max={RES}
            step={1}
            value={Math.round(t(values[idx[i]]) * RES)}
            aria-label={names[i]}
            aria-valuetext={format(values[idx[i]])}
            onKeyDown={onKey(i)}
            onChange={(e) => setIdx(i, nearestIndex(values, scale, Number(e.target.value) / RES))}
          />
        ))}
      </div>
      <div className="RangeSlider__ticks" aria-hidden="true">
        {minorTicks?.map((v) => (
          <span key={`m${v}`} className="RangeSlider__tick RangeSlider__tick--minor" style={{ ['--t' as string]: t(v) }} />
        ))}
        {ticks?.map((k) => (
          <span
            key={k.value}
            className={`RangeSlider__tick${k.value === min ? ' RangeSlider__tick--start' : k.value === max ? ' RangeSlider__tick--end' : ''}`}
            style={{ ['--t' as string]: t(k.value) }}>
            {k.label ?? format(k.value)}
          </span>
        ))}
      </div>
    </div>
  );
}
