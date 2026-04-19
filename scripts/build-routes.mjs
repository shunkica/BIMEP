#!/usr/bin/env node
// Fetch road-snapped routes between connected BIMEP points from the public
// OSRM demo (profile=bike -> falls back to driving where bike is unavailable).
// Writes src/data/routes.json keyed by "a-b" (a < b).
//
// Run: node scripts/build-routes.mjs
//
// OSRM demo has no hard rate limit but is best-effort — we sleep between calls.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pointsTs = await readFile(join(__dirname, '..', 'src', 'data', 'points.ts'), 'utf8');

function parsePoints(src) {
  const lines = src.split('\n');
  const points = {};
  for (const l of lines) {
    const m = l.match(/\{\s*id:\s*(\d+).*?lat:\s*([\d.]+),\s*lng:\s*([\d.]+)/);
    if (m) points[Number(m[1])] = { lat: Number(m[2]), lng: Number(m[3]) };
  }
  return points;
}

function parseEdges(src) {
  const edgesBlock = src.split(/export const EDGES[^[]*\[/)[1]?.split('];')[0] ?? '';
  const out = [];
  for (const l of edgesBlock.split('\n')) {
    const m = l.match(/a:\s*(\d+)[^}]*b:\s*(\d+)/);
    if (m) out.push([Number(m[1]), Number(m[2])]);
  }
  return out;
}

const points = parsePoints(pointsTs);
const edges = parseEdges(pointsTs);

console.log(`Fetching ${edges.length} routes...`);

// Bike routing via OSM Foundation's public endpoint (OSRM with bicycle profile).
// Falls back to driving (router.project-osrm.org) if bike is unreachable.
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

const outPath = join(__dirname, '..', 'src', 'data', 'routes.json');
await writeFile(outPath, JSON.stringify(routes, null, 2) + '\n');
console.log(`\nWrote ${outPath}`);
