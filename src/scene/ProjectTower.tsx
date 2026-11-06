import { useEffect, useMemo } from 'react';
import { BoxGeometry, BufferGeometry, EdgesGeometry, Float32BufferAttribute, LineBasicMaterial, LineDashedMaterial, LineSegments, MeshBasicMaterial } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { project } from '../types';
import type { Project } from '../types';
import type { Palette } from './theme';

const noRaycast = () => null;
const LEADER = 60;

interface Parts { w: number; d: number; y0: number; y1: number }

function massing(p: Project): Parts[] {
  const { w, d } = p.footprintM;
  const H = p.heightM;
  const pod = H / 6;
  const parts: Parts[] = [{ w: w * 1.3, d: d * 1.3, y0: 0, y1: pod }];
  if (H > 120) {
    parts.push({ w, d, y0: pod, y1: H * 0.7 }, { w: w * 0.78, d: d * 0.78, y0: H * 0.7, y1: H });
  } else parts.push({ w, d, y0: pod, y1: H });
  return parts;
}

export const LEADER_M = LEADER;
export function ProjectTower({ project: p, palette }: { project: Project; palette: Palette }) {
  const { x, z } = project(p.lat, p.lon);
  const data = useMemo(() => {
    const parts = massing(p);
    const boxes = parts.map((q) => {
      const g = new BoxGeometry(q.w, q.y1 - q.y0, q.d);
      g.translate(0, (q.y0 + q.y1) / 2, 0);
      return g;
    });
    const fill = mergeGeometries(boxes)!;
    const edges = mergeGeometries(boxes.map((b) => new EdgesGeometry(b, 1)))!;
    boxes.forEach((b) => b.dispose());
    // floor lines every 4 floors
    const fh = p.heightM / p.floors;
    const fl: number[] = [];
    for (let f = 4; f < p.floors; f += 4) {
      const y = f * fh;
      const q = parts.find((r) => y > r.y0 && y < r.y1);
      if (!q) continue;
      const a = q.w / 2, b = q.d / 2;
      fl.push(-a, y, -b, a, y, -b, a, y, -b, a, y, b, a, y, b, -a, y, b, -a, y, b, -a, y, -b);
    }
    const floors = new BufferGeometry();
    floors.setAttribute('position', new Float32BufferAttribute(fl, 3));
    const lead = new BufferGeometry();
    lead.setAttribute('position', new Float32BufferAttribute([0, p.heightM, 0, 0, p.heightM + LEADER, 0], 3));
    return { fill, edges, floors, lead };
  }, [p]);

  const mats = useMemo(() => ({
    fill: new MeshBasicMaterial({ color: palette.ink, fog: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }),
    dash: new LineDashedMaterial({ color: palette.accent, dashSize: 6, gapSize: 4, fog: true }),
    floors: new LineBasicMaterial({ color: palette.accent, transparent: true, opacity: 0.35, fog: true }),
    lead: new LineBasicMaterial({ color: palette.accent, fog: true }),
    ghost: new LineDashedMaterial({ color: palette.accent, dashSize: 6, gapSize: 4, transparent: true, opacity: 0.3, depthTest: false, depthWrite: false }),
  }), []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    mats.fill.color.set(palette.ink);
    mats.dash.color.set(palette.accent);
    mats.floors.color.set(palette.accent);
    mats.lead.color.set(palette.accent);
    mats.ghost.color.set(palette.accent);
  }, [palette, mats]);
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);

  const dashed = useMemo(() => {
    const l = new LineSegments(data.edges, mats.dash);
    l.computeLineDistances();
    return l;
  }, [data, mats]);
  useEffect(() => () => { data.fill.dispose(); data.edges.dispose(); data.floors.dispose(); data.lead.dispose(); }, [data]);

  const theta = (-p.rotationDeg * Math.PI) / 180;
  return (
    <group position={[x, 0, z]}>
      <group rotation={[0, theta, 0]}>
        <mesh geometry={data.fill} material={mats.fill} raycast={noRaycast} renderOrder={3} />
        <primitive object={dashed} renderOrder={4} raycast={noRaycast} />
        <lineSegments geometry={data.edges} material={mats.ghost} renderOrder={6} raycast={noRaycast} />
        <lineSegments geometry={data.floors} material={mats.floors} renderOrder={4} raycast={noRaycast} />
      </group>
      <lineSegments geometry={data.lead} material={mats.lead} renderOrder={4} raycast={noRaycast} />
    </group>
  );
}
