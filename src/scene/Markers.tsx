import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BoxGeometry, BufferGeometry, Float32BufferAttribute, Group, LineBasicMaterial, MeshBasicMaterial, PlaneGeometry } from 'three';
import type { MutableRefObject } from 'react';
import { project } from '../types';
import type { Project } from '../types';
import type { Palette } from './theme';
import type { Interaction, ViewState } from './shots';

const noRaycast = () => null;

interface Props {
  projects: Project[];
  palette: Palette;
  active: string | null;
  setLocal: (id: string | null) => void;
  local: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  viewRef: MutableRefObject<ViewState>;
  interact: MutableRefObject<Interaction>;
  cursorEl: HTMLElement;
}

export function Markers({ projects, palette, active, local, setLocal, onHover, onSelect, viewRef, interact, cursorEl }: Props) {
  const root = useRef<Group>(null);

  const shared = useMemo(() => {
    const stem = new BufferGeometry();
    stem.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 0, 140, 0], 3));
    return {
      sq: new PlaneGeometry(40, 40).rotateX(-Math.PI / 2),
      hit: new BoxGeometry(110, 220, 110).translate(0, 100, 0),
      stem,
      accent: new MeshBasicMaterial({ color: palette.accent, fog: true }),
      faint: new LineBasicMaterial({ color: palette.line, transparent: true, opacity: 0.8, fog: true }),
      full: new LineBasicMaterial({ color: palette.line, fog: true }),
      hitMat: new MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }),
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    shared.accent.color.set(palette.accent);
    shared.faint.color.set(palette.line);
    shared.full.color.set(palette.line);
  }, [palette, shared]);
  useEffect(() => () => {
    shared.sq.dispose(); shared.hit.dispose(); shared.stem.dispose();
    shared.accent.dispose(); shared.faint.dispose(); shared.full.dispose(); shared.hitMat.dispose();
  }, [shared]);
  useEffect(() => { cursorEl.style.cursor = active && local ? 'pointer' : ''; return () => { cursorEl.style.cursor = ''; }; }, [active, local, cursorEl]);

  // keep markers legible when the camera is far away
  useFrame(() => {
    if (root.current) {
      const k = Math.min(14, Math.max(1, viewRef.current.dist / 2500));
      for (const c of root.current.children) c.scale.setScalar(k);
    }
  });

  const pos = useMemo(() => projects.map((p) => ({ p, ...project(p.lat, p.lon) })), [projects]);
  return (
    <group ref={root}>
      {pos.map(({ p, x, z }) => {
        const on = active === p.id;
        return (
          <group key={p.id} position={[x, 0, z]}>
            <mesh geometry={shared.sq} material={shared.accent} position={[0, 0.8, 0]} raycast={noRaycast} renderOrder={5} />
            <lineSegments geometry={shared.stem} material={on ? shared.full : shared.faint} raycast={noRaycast} renderOrder={5} />
            <mesh
              geometry={shared.hit}
              material={shared.hitMat}
              onPointerOver={(e) => { e.stopPropagation(); setLocal(p.id); onHover(p.id); }}
              onPointerOut={() => { setLocal(null); onHover(null); }}
              onClick={(e) => { e.stopPropagation(); if (interact.current.moved < 5) onSelect(p.id); }}
            />
          </group>
        );
      })}
    </group>
  );
}
