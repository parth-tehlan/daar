// Bakes OSM geometry for the Daar scene -> public/geo/city.json
// Usage: node scripts/fetch-osm.mjs
import { writeFileSync, mkdirSync, statSync } from 'node:fs';

const ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
const UA = 'daar-ui-mockup/0.1';
const ORIGIN = { lat: 25.15, lon: 55.23 };
const DISTRICTS = [
  { id: 'marina', lat: 25.0805, lon: 55.1403 },
  { id: 'palm', lat: 25.1124, lon: 55.139 },
  { id: 'jvc', lat: 25.0592, lon: 55.2093 },
  { id: 'dubai-hills', lat: 25.1095, lon: 55.2455 },
  { id: 'downtown', lat: 25.1955, lon: 55.2755 },
  { id: 'business-bay', lat: 25.1855, lon: 55.2635 },
  { id: 'mbr-city', lat: 25.1765, lon: 55.3075 },
  { id: 'creek-harbour', lat: 25.2005, lon: 55.3455 },
];
const LOWRISE = new Set(['jvc', 'dubai-hills', 'mbr-city', 'palm']);
const BBOX = '25.03,55.10,25.24,55.38';

function project(lat, lon) {
  const R = 6_371_000, r = Math.PI / 180;
  return { x: (lon - ORIGIN.lon) * r * R * Math.cos(ORIGIN.lat * r), z: -(lat - ORIGIN.lat) * r * R };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function overpass(q, label) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const url = ENDPOINTS[attempt % ENDPOINTS.length];
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
        body: 'data=' + encodeURIComponent(q),
      });
      if (res.ok) { const j = await res.json(); console.log(`  ok ${label} (${j.elements.length} elements)`); return j.elements; }
      console.log(`  ${label}: HTTP ${res.status} from ${url}, retrying`);
      await sleep(res.status === 429 || res.status === 504 ? 8000 : 4000);
    } catch (e) {
      console.log(`  ${label}: ${e.message}, retrying`);
      await sleep(5000);
    }
  }
  throw new Error('Overpass unreachable for ' + label);
}

/* Douglas-Peucker on [{x,z}] */
function dp(pts, eps) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let max = 0, idx = -1;
    const A = pts[a], B = pts[b];
    const dx = B.x - A.x, dz = B.z - A.z, len = Math.hypot(dx, dz) || 1e-9;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((pts[i].x - A.x) * dz - (pts[i].z - A.z) * dx) / len;
      if (d > max) { max = d; idx = i; }
    }
    if (max > eps && idx > 0) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
const r1 = (n) => Math.round(n * 10) / 10;
const flat = (pts) => { const o = []; for (const p of pts) o.push(r1(p.x), r1(p.z)); return o; };
const geomToPts = (g) => g.map((p) => project(p.lat, p.lon));

function hash(id) { let h = (Number(id) % 2147483647) ^ 0x9e3779b9; h = Math.imul(h ^ (h >>> 16), 0x45d9f3b); h = Math.imul(h ^ (h >>> 16), 0x45d9f3b); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function heightOf(tags, id, district) {
  const h = parseFloat(String(tags.height ?? '').replace(',', '.'));
  if (isFinite(h) && h > 0) return Math.min(h, 830);
  const l = parseFloat(tags['building:levels']);
  if (isFinite(l) && l > 0) return Math.min(l * 3.3, 830);
  const u = hash(id);
  if (LOWRISE.has(district)) return 9 + u * 5;
  return 18 + Math.pow(u, 1.6) * 42;
}
function area(pts) { let s = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; s += a.x * b.z - b.x * a.z; } return s / 2; }

function ring(geom) {
  if (!geom || geom.length < 4) return null;
  let pts = geomToPts(geom);
  const f = pts[0], l = pts[pts.length - 1];
  if (Math.hypot(f.x - l.x, f.z - l.z) < 0.5) pts = pts.slice(0, -1); else return null; // closed only
  // closed ring: split at the farthest vertex so Douglas-Peucker has a real baseline
  let m = 0, md = 0;
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i].x - pts[0].x, pts[i].z - pts[0].z); if (d > md) { md = d; m = i; } }
  const a = dp(pts.slice(0, m + 1), 3), b = dp(pts.slice(m).concat([pts[0]]), 3);
  pts = a.concat(b.slice(1, -1));
  if (pts.length < 3 || Math.abs(area(pts)) < 12) return null;
  return pts;
}

const seen = new Set();
const out = { v: 1, roads: [], coast: [], water: [], districts: {} };

console.log('Buildings');
for (const d of DISTRICTS) {
  const rad = d.id === 'downtown' ? 1200 : 1000;
  const q = `[out:json][timeout:120];(way["building"](around:${rad},${d.lat},${d.lon});relation["building"](around:${rad},${d.lat},${d.lon}););out geom;`;
  const els = await overpass(q, d.id);
  const b = [];
  const add = (id, tags, geom) => {
    if (seen.has(id)) return; seen.add(id);
    const pts = ring(geom); if (!pts) return;
    b.push([r1(heightOf(tags, id, d.id)), ...flat(pts)]);
  };
  for (const e of els) {
    if (e.type === 'way') add('w' + e.id, e.tags ?? {}, e.geometry);
    else if (e.type === 'relation')
      for (const m of e.members ?? []) if (m.type === 'way' && m.role === 'outer') add('r' + e.id + '_' + m.ref, e.tags ?? {}, m.geometry);
  }
  out.districts[d.id] = { b };
  console.log(`  ${d.id}: ${b.length} buildings`);
  await sleep(3000);
}

console.log('Context');
const polyline = (geom, eps) => { const p = dp(geomToPts(geom), eps); return p.length >= 2 ? flat(p) : null; };
let els = await overpass(`[out:json][timeout:180];way["highway"~"^(motorway|trunk|primary)$"](${BBOX});out geom;`, 'roads');
for (const e of els) if (e.geometry) { const l = polyline(e.geometry, 8); if (l) out.roads.push(l); }
await sleep(3000);
els = await overpass(`[out:json][timeout:180];way["natural"="coastline"](${BBOX});out geom;`, 'coast');
for (const e of els) if (e.geometry) { const l = polyline(e.geometry, 8); if (l) out.coast.push(l); }
await sleep(3000);
els = await overpass(`[out:json][timeout:180];(way["natural"="water"](${BBOX});relation["natural"="water"](${BBOX}););out geom;`, 'water');
for (const e of els) {
  if (e.type === 'way' && e.geometry) { const l = polyline(e.geometry, 8); if (l && l.length >= 12) out.water.push(l); }
  else if (e.type === 'relation') for (const m of e.members ?? []) if (m.role === 'outer' && m.geometry) { const l = polyline(m.geometry, 8); if (l && l.length >= 12) out.water.push(l); }
}

mkdirSync('public/geo', { recursive: true });
writeFileSync('public/geo/city.json', JSON.stringify(out));
const total = Object.values(out.districts).reduce((s, d) => s + d.b.length, 0);
console.log(`roads ${out.roads.length}, coast ${out.coast.length}, water ${out.water.length}, buildings ${total}`);
console.log(`city.json ${(statSync('public/geo/city.json').size / 1e6).toFixed(2)} MB`);
