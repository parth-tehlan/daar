import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Fog } from 'three';
import type { SceneProps } from '../types';
import { project } from '../types';
import { CameraRig } from './CameraRig';
import { CityLayers } from './CityLayers';
import { Markers } from './Markers';
import { LabelLayer, LabelProjector } from './LabelLayer';
import type { LabelSpec } from './LabelLayer';
import { ProjectTower, LEADER_M } from './ProjectTower';
import { SceneOverlay } from './SceneOverlay';
import { FIXTURE_PROJECTS } from './devFixture';
import { useCity } from './geo';
import { computeShot, DISTRICT_POS } from './shots';
import type { Interaction, ViewState } from './shots';
import { usePalette } from './theme';
import type { HideRect } from './buildCity';
import './CityScene.css';

function useEffective(props: SceneProps): SceneProps {
  if (import.meta.env.DEV) {
    const q = new URLSearchParams(window.location.search);
    const t = q.get('scenetest');
    if (t === 'results' || t === 'detail') {
      const sel = FIXTURE_PROJECTS.find((p) => p.id === (q.get('sceneid') ?? 'fx-bay')) ?? FIXTURE_PROJECTS[0];
      return { ...props, mode: t, projects: FIXTURE_PROJECTS, selectedId: t === 'detail' ? sel.id : null };
    }
  }
  return props;
}

function SceneInner(props: SceneProps & { viewRef: React.MutableRefObject<ViewState>; labelsRef: React.MutableRefObject<LabelSpec[]>; layerRef: React.RefObject<HTMLDivElement | null>; onLabels: (l: LabelSpec[]) => void; interact: React.MutableRefObject<Interaction> }) {
  const { mode, step, focusDistricts, projects, hoveredId, selectedId, onHover, onSelect, viewRef, interact, labelsRef, layerRef, onLabels } = props;
  const [local, setLocal] = useState<string | null>(null);
  const active = hoveredId ?? local;
  const palette = usePalette();
  const city = useCity();
  const gl = useThree((s) => s.gl);
  const projKey = projects.map((p) => p.id).join(',');
  const shot = useMemo(
    () => computeShot(mode, step, projects, selectedId),
    [mode, step, selectedId, projKey], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const selected = mode === 'detail' ? projects.find((p) => p.id === selectedId) ?? null : null;
  const hide: HideRect | null = useMemo(() => {
    if (!selected) return null;
    const { x, z } = project(selected.lat, selected.lon);
    return {
      x, z, theta: (-selected.rotationDeg * Math.PI) / 180,
      hw: (selected.footprintM.w * 1.3) / 2 + 15, hd: (selected.footprintM.d * 1.3) / 2 + 15,
    };
  }, [selected]);

  const labels = useMemo<LabelSpec[]>(() => {
    const out: LabelSpec[] = [];
    if (selected) {
      const { x, z } = project(selected.lat, selected.lon);
      out.push({
        id: 'tower', x, z, y: selected.heightM + LEADER_M, cls: 'scene-label',
        text: `${selected.name.toUpperCase()} · ${selected.floors} FL · HANDOVER ${selected.handoverPromised.toUpperCase()}`,
      });
    }
    if (mode === 'results') {
      const p = projects.find((q) => q.id === active);
      if (p) {
        const { x, z } = project(p.lat, p.lon);
        out.push({ id: 'hover', x, z, y: 150, marker: true, cls: 'scene-label', text: p.name.toUpperCase() });
      }
    }
    if (mode === 'onboarding' && step === 5) {
      for (const d of DISTRICT_POS) {
        out.push({ id: d.id, x: d.x, z: d.z, y: 0, cls: `scene-tag${focusDistricts.includes(d.id) ? ' scene-tag--focus' : ''}`, text: d.name });
      }
    }
    return out;
  }, [selected, mode, projects, active, step, focusDistricts]);
  labelsRef.current = labels;
  useEffect(() => { onLabels(labels); }, [labels, onLabels]);

  return (
    <>
      <LabelProjector labelsRef={labelsRef} layerRef={layerRef} viewRef={viewRef} />
      <color attach="background" args={[palette.ink]} />
      <fog attach="fog" args={[palette.ink, 1000, 30000]} />
      <FogColor color={palette.ink} />
      <CameraRig shot={shot} viewRef={viewRef} interact={interact} />
      {city && (
        <CityLayers
          city={city}
          palette={palette}
          mode={mode}
          focus={focusDistricts}
          hide={hide}
          hideDistrict={selected?.district ?? null}
        />
      )}
      {selected && <ProjectTower project={selected} palette={palette} />}
      {mode === 'results' && (
        <Markers
          projects={projects}
          palette={palette}
          active={active}
          local={local}
          setLocal={setLocal}
          onHover={onHover}
          onSelect={onSelect}
          viewRef={viewRef}
          interact={interact}
          cursorEl={gl.domElement}
        />
      )}
    </>
  );
}

function FogColor({ color }: { color: string }) {
  const scene = useThree((s) => s.scene);
  if (scene.fog instanceof Fog) scene.fog.color.set(color);
  return null;
}

export function CityScene(rawProps: SceneProps) {
  const props = useEffective(rawProps);
  const viewRef = useRef<ViewState>({ tx: 0, tz: 0, dist: 28000, az: 205, polar: 57 });
  const labelsRef = useRef<LabelSpec[]>([]);
  const layerRef = useRef<HTMLDivElement>(null);
  const [labels, setLabels] = useState<LabelSpec[]>([]);
  const interact = useRef<Interaction>({ dragging: false, moved: 0, lastTouch: -1e9 });
  return (
    <div className="scene">
      <Canvas
        dpr={[1, 2]}
        flat
        gl={{ antialias: true }}
        camera={{ fov: 30, near: 100, far: 100000, position: [0, 20000, 20000] }}
        onPointerMissed={() => undefined}
      >
        <SceneInner {...props} viewRef={viewRef} interact={interact} labelsRef={labelsRef} layerRef={layerRef} onLabels={setLabels} />
      </Canvas>
      <LabelLayer labels={labels} layerRef={layerRef} />
      <SceneOverlay viewRef={viewRef} />
    </div>
  );
}
