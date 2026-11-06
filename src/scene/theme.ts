import { useEffect, useState } from 'react';

export interface Palette {
  ink: string;
  line: string;
  accent: string;
  muted: string;
}

function read(): Palette {
  const cs = getComputedStyle(document.documentElement);
  const g = (n: string, f: string) => cs.getPropertyValue(n).trim() || f;
  return {
    ink: g('--ink', '#112f2c'),
    line: g('--line-on-ink', '#fdf3d6'),
    accent: g('--accent', '#f48067'),
    muted: g('--muted-on-ink', '#8fa39b'),
  };
}

/** Palette read from CSS vars; re-reads when `data-plate` changes on <html>. */
export function usePalette(): Palette {
  const [p, setP] = useState<Palette>(read);
  useEffect(() => {
    setP(read());
    const mo = new MutationObserver(() => setP(read()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-plate'] });
    return () => mo.disconnect();
  }, []);
  return p;
}
