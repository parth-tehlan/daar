import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { MutableRefObject, RefObject } from 'react';
import type { ViewState } from './shots';

export interface LabelSpec {
  id: string;
  x: number;
  y: number;
  z: number;
  text: string;
  sub?: string;
  /** single-line label (name only, no second line) */
  plain?: boolean;
  cls: string;
  /** y is in marker units (scaled with camera distance) */
  marker?: boolean;
}

/** DOM layer; children are positioned each frame by <LabelProjector>. */
export function LabelLayer({ labels, layerRef }: { labels: LabelSpec[]; layerRef: RefObject<HTMLDivElement | null> }) {
  return (
    <div className="scene-labels" ref={layerRef} aria-hidden="true">
      {labels.map((l) => (
        <div key={l.id} className={l.cls} style={{ visibility: 'hidden' }}>
          {l.cls === 'scene-label' ? <span className="scene-label__name">{l.text}</span> : l.text}
          {l.sub && <span className="scene-label__sub">{l.sub}</span>}
        </div>
      ))}
    </div>
  );
}

const v = new Vector3();

export function LabelProjector({ labelsRef, layerRef, viewRef }: {
  labelsRef: MutableRefObject<LabelSpec[]>;
  layerRef: RefObject<HTMLDivElement | null>;
  viewRef: MutableRefObject<ViewState>;
}) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  useFrame(() => {
    const layer = layerRef.current;
    if (!layer) return;
    const k = Math.min(14, Math.max(1, viewRef.current.dist / 2500));
    const list = labelsRef.current;
    const kids = layer.children;
    for (let i = 0; i < kids.length; i++) {
      const el = kids[i] as HTMLElement;
      const l = list[i];
      if (!l) continue;
      v.set(l.x, l.marker ? l.y * k : l.y, l.z).project(camera);
      if (v.z > 1 || v.z < -1) { el.style.visibility = 'hidden'; continue; }
      el.style.visibility = 'visible';
      el.style.left = `${((v.x + 1) / 2) * size.width}px`;
      el.style.top = `${((1 - v.y) / 2) * size.height}px`;
    }
  });
  return null;
}
