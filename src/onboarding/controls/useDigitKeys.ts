import { useEffect, useRef } from 'react';

/** calls fn(n) for digit keys 1..max (n is 1-based) */
export function useDigitKeys(max: number, fn: (n: number) => void) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= max) ref.current(n);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [max]);
}
