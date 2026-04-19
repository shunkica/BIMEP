#!/usr/bin/env node
// Fetch road-snapped bike routes between connected BIMEP points for a given
// year, and bake the polylines into src/data/years/routes-<year>.json.
//
// Usage:
//   node scripts/build-routes.mjs            # defaults to the latest year file
//   node scripts/build-routes.mjs 2026
//
// Reads src/data/years/<year>.ts for POINTS_<year> / EDGES_<year>.

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const yearsDir = join(__dirname, '..', 'src', 'data', 'years');

const arg = process.argv[2];
let year;
if (arg) {
  year = Number(arg);
  if (!Number.isFinite(year)) {
    console.error(`invalid year: ${arg}`);
    process.exit(1);
  }
} else {
  const files = await readdir(yearsDir);
  const yrs = files
    .map(f => f.match(/^(\d{4})\.ts$/))
    .filter(Boolean)
    .map(m => Number(m[1]))
    .sort((a, b) => b - a);
  if (!yrs.length) {
    console.error('no year files found in src/data/years/');
    process.exit(1);
  }
  year = yrs[0];
}

const yearPath = join(yearsDir, `${year}.ts`);
const src = await readFile(yearPath, 'utf8');

function parsePoints(s) {
  const out = {};
  const rx = /\{\s*id:\s*(\d+),[^}]*lat:\s*([\d.]+),\s*lng:\s*([\d.]+)/g;
  let m;
  while ((m = rx.exec(s))) out[Number(m[1])] = { lat: Number(m[2]), lng: Number(m[3]) };
  return out;
}

function parseEdges(s) {
  const block = s.split(/export const EDGES_\d+[^[]*\[/)[1]?.split('];')[0] ?? '';
  const out = [];
  for (const l of block.split('\n')) {
    const m = l.match(/a:\s*(\d+)[^}]*b:\s*(\d+)/);
    if (m) out.push([Number(m[1]), Number(m[2])]);
  }
  return out;
}

const points = parsePoints(src);
const edges = parseEdges(src);
console.log(`Year ${year}: ${Object.keys(points).length} points, ${edges.length} edges.`);

const BIKE = 'https://routing.openstreetmap.de/routed-bike/route/v1/bike';
const DRIVE = 'https://router.project-osrm.org/route/v1/driving';
const routes = {};

async function fetchFrom(base, a, b) {
  const url = `${base}/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const data = await res.json();
  if (!data.routes?.[0]) throw new Error('no route');
  return {
    distanceM: Math.round(data.routes[0].distance),
    geometry: data.routes[0].geometry,
  };
}

async function fetchRoute(aId, bId) {
  const a = points[aId], b = points[bId];
  try {
    return await fetchFrom(BIKE, a, b);
  } catch (e) {
    console.warn(`    bike failed (${e.message}), trying driving`);
    return await fetchFrom(DRIVE, a, b);
  }
}

for (const [a, b] of edges) {
  const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
  try {
    const r = await fetchRoute(a, b);
    routes[key] = r;
    console.log(`  ${key}  ${r.distanceM} m  ${r.geometry.coordinates.length} pts`);
  } catch (e) {
    console.error(`  ${key}  FAILED: ${e.message}`);
  }
  await new Promise(r => setTimeout(r, 400));
}

const outPath = join(yearsDir, `routes-${year}.json`);
await writeFile(outPath, JSON.stringify(routes, null, 2) + '\n');
console.log(`\nWrote ${outPath}`);
