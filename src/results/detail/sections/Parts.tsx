import type { ReactNode } from 'react';

export function Section({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <section className="detail-section" aria-label={title}>
      <h2 className="detail-section__label mono-label">
        <span className="detail-section__n">{n}</span>
        <span>{title}</span>
      </h2>
      <div className="detail-section__body">{children}</div>
    </section>
  );
}

export interface StatItem { label: string; value: ReactNode; unit?: string; accent?: boolean }

export function StatRow({ items, size = 'ui' }: { items: StatItem[]; size?: 'ui' | 'display' }) {
  return (
    <dl className={`detail-stats detail-stats--${size}`} style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((s) => (
        <div className="detail-stat" key={s.label}>
          <dt className="mono-label detail-stat__label">{s.label}</dt>
          <dd className={`detail-stat__value num${s.accent ? ' detail-stat__value--accent' : ''}`}>
            {s.value}
            {s.unit ? <span className="detail-stat__unit"> {s.unit}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function Segmented<T extends string | number>(props: {
  label: string; options: { value: T; text: string }[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <div className="detail-seg" role="radiogroup" aria-label={props.label}>
      {props.options.map((o) => (
        <button key={String(o.value)} type="button" role="radio" aria-checked={o.value === props.value}
          className="detail-seg__btn mono-label" onClick={() => props.onChange(o.value)}>
          {o.text}
        </button>
      ))}
    </div>
  );
}

export function Slider(props: {
  label: string; value: number; min: number; max: number; step: number; display: string; onChange: (v: number) => void;
}) {
  const p = (props.value - props.min) / (props.max - props.min);
  return (
    <label className="detail-slider">
      <span className="detail-slider__head">
        <span className="detail-slider__name">{props.label}</span>
        <span className="detail-slider__value mono-label num">{props.display}</span>
      </span>
      <span className="detail-slider__rail" style={{ ['--p' as string]: p }}>
        <span className="detail-slider__track" />
        <span className="detail-slider__fill" />
        <input type="range" min={props.min} max={props.max} step={props.step} value={props.value}
          aria-label={props.label} onChange={(e) => props.onChange(Number(e.target.value))} />
      </span>
    </label>
  );
}
