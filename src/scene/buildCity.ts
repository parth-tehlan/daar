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
  const lx = dx * c - dz * s;
  const lz = dx * s + dz * c;
  return Math.abs(lx) <= r.hw && Math.abs(lz) <= r.hd;
}

/** One merged fill geometry (walls + roofs) and one merged line geometry. */
export function buildBuildings(
  list: number[][],
  hide: HideRect | null,
): { fill: BufferGeometry; lines: BufferGeometry } {
  const fp: number[] = [];
  const lp: number[] = [];
  const tri = (a: number[], b: number[], c: number[]) => fp.push(...a, ...b, ...c);

  for (const bd of list) {
    const h = bd[0];
    const n = (bd.length - 1) >> 1;
    if (n < 3) continue;
    if (hide) {
      let cx = 0;
      let cz = 0;
      for (let i = 0; i < n; i++) {
        cx += bd[1 + i * 2];
        cz += bd[2 + i * 2];
      }
      if (inside(hide, cx / n, cz / n)) continue;
    }
    // walls + roof outline + corner edges
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const k = (i + n - 1) % n;
      const x0 = bd[1 + i * 2];
      const z0 = bd[2 + i * 2];
      const x1 = bd[1 + j * 2];
      const z1 = bd[2 + j * 2];
      tri([x0, 0, z0], [x1, 0, z1], [x1, h, z1]);
      tri([x0, 0, z0], [x1, h, z1], [x0, h, z0]);
      lp.push(x0, h, z0, x1, h, z1);
      const xp = bd[1 + k * 2];
      const zp = bd[2 + k * 2];
      const ax = x0 - xp;
      const az = z0 - zp;
      const bx = x1 - x0;
      const bz = z1 - z0;
      const la = Math.hypot(ax, az);
      const lb = Math.hypot(bx, bz);
      if (la > 0 && lb > 0 && (ax * bx + az * bz) / (la * lb) < COS_TURN) lp.push(x0, 0, z0, x0, h, z0);
    }
    // roof
    if (n === 3) {
      tri([bd[1], h, bd[2]], [bd[3], h, bd[4]], [bd[5], h, bd[6]]);
    } else {
      const contour: Vector2[] = [];
      for (let i = 0; i < n; i++) contour.push(new Vector2(bd[1 + i * 2], bd[2 + i * 2]));
      let faces: number[][] = [];
      try {
        faces = ShapeUtils.triangulateShape(contour, []);
      } catch {
        faces = [];
      }
      for (const f of faces) {
        const [a, b, c] = f.map((q) => contour[q]);
        tri([a.x, h, a.y], [b.x, h, b.y], [c.x, h, c.y]);
      }
    }
  }
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
