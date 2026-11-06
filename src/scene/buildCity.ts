import { BufferGeometry, Float32BufferAttribute, ShapeUtils, Vector2 } from 'three';

export interface HideRect {
  x: number;
  z: number;
  /** world rotation.y of the project group, radians */
  theta: number;
  hw: number;
  hd: number;
}

const COS_TURN = Math.cos((20 * Math.PI) / 180);

function inside(r: HideRect, x: number, z: number): boolean {
  const dx = x - r.x;
  const dz = z - r.z;
  const c = Math.cos(r.theta);
  const s = Math.sin(r.theta);
  return Math.abs(dx * c - dz * s) <= r.hw && Math.abs(dx * s + dz * c) <= r.hd;
}

/**
 * One merged fill geometry (walls + roofs) and one merged line geometry.
 * `b`: [h, x, z, ...]; `p` (building:part): [h, base, x, z, ...]
 */
export function buildBuildings(
  b: number[][],
  p: number[][],
  hide: HideRect | null,
): { fill: BufferGeometry; lines: BufferGeometry } {
  const fp: number[] = [];
  const lp: number[] = [];
  const tri = (a: number[], bb: number[], c: number[]) => fp.push(...a, ...bb, ...c);

  const emit = (bd: number[], off: number, h: number, base: number) => {
    const n = (bd.length - off) >> 1;
    if (n < 3 || h <= base) return;
    if (hide) {
      let cx = 0;
      let cz = 0;
      for (let i = 0; i < n; i++) {
        cx += bd[off + i * 2];
        cz += bd[off + 1 + i * 2];
      }
      if (inside(hide, cx / n, cz / n)) return;
    }
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const k = (i + n - 1) % n;
      const x0 = bd[off + i * 2];
      const z0 = bd[off + 1 + i * 2];
      const x1 = bd[off + j * 2];
      const z1 = bd[off + 1 + j * 2];
      tri([x0, base, z0], [x1, base, z1], [x1, h, z1]);
      tri([x0, base, z0], [x1, h, z1], [x0, h, z0]);
      lp.push(x0, h, z0, x1, h, z1);
      if (base > 0) lp.push(x0, base, z0, x1, base, z1);
      const ax = x0 - bd[off + k * 2];
      const az = z0 - bd[off + 1 + k * 2];
      const bx = x1 - x0;
      const bz = z1 - z0;
      const la = Math.hypot(ax, az);
      const lb = Math.hypot(bx, bz);
      if (la > 0 && lb > 0 && (ax * bx + az * bz) / (la * lb) < COS_TURN) lp.push(x0, base, z0, x0, h, z0);
    }
    if (n === 3) {
      tri([bd[off], h, bd[off + 1]], [bd[off + 2], h, bd[off + 3]], [bd[off + 4], h, bd[off + 5]]);
    } else {
      const contour: Vector2[] = [];
      for (let i = 0; i < n; i++) contour.push(new Vector2(bd[off + i * 2], bd[off + 1 + i * 2]));
      let faces: number[][] = [];
      try {
        faces = ShapeUtils.triangulateShape(contour, []);
      } catch {
        faces = [];
      }
      for (const f of faces) {
        const [a, bb, c] = f.map((q) => contour[q]);
        tri([a.x, h, a.y], [bb.x, h, bb.y], [c.x, h, c.y]);
      }
    }
  };

  for (const bd of b) emit(bd, 1, bd[0], 0);
  for (const bd of p) emit(bd, 2, bd[0], bd[1]);

  const fill = new BufferGeometry();
  fill.setAttribute('position', new Float32BufferAttribute(fp, 3));
  fill.computeBoundingSphere();
  const lines = new BufferGeometry();
  lines.setAttribute('position', new Float32BufferAttribute(lp, 3));
  lines.computeBoundingSphere();
  return { fill, lines };
}

/** Flat polylines ([x,z,x,z...]) at height y as LineSegments positions. */
export function buildPolylines(arr: number[][], y: number): BufferGeometry {
  const p: number[] = [];
  for (const l of arr) for (let i = 0; i + 3 < l.length; i += 2) p.push(l[i], y, l[i + 1], l[i + 2], y, l[i + 3]);
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(p, 3));
  g.computeBoundingSphere();
  return g;
}
