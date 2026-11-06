import { useLayoutEffect, useRef, useState } from 'react';

/** Measures an element's content width so SVG can be drawn in real pixels (labels stay 11px). */
export function useWidth<T extends HTMLElement>(initial = 512) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(initial);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = () => setWidth(Math.max(240, Math.round(el.getBoundingClientRect().width)));
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}
