#!/usr/bin/env node
// Solve "shortest path visiting all 19 BIMEP points" (open TSP).
// Uses bike-routed all-pairs distances from routing.openstreetmap.de /table,
// then nearest-neighbor from every start + 2-opt improvement.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = await readFile(join(__dirname, '..', 'src', 'data', 'points.ts'), 'utf8');

function parsePoints(s) {
  const out = [];
  const rx = /\{\s*id:\s*(\d+),\s*name:\s*'([^']+)'[^}]*lat:\s*([\d.]+),\s*lng:\s*([\d.]+)/g;
  let m;
  while ((m = rx.exec(s))) {
    out.push({ id: Number(m[1]), name: m[2], lat: Number(m[3]), lng: Number(m[4]) });
  }
  return out.sort((a, b) => a.id - b.id);
}
const pts = parsePoints(src);
const n = pts.length;
console.log(`Loaded ${n} points.`);

// 1. Distance matrix via OSRM bike /table (single request, n×n).
const coords = pts.map(p => `${p.lng},${p.lat}`).join(';');
const url = `https://routing.openstreetmap.de/routed-bike/table/v1/bike/${coords}?annotations=distance`;
console.log(`Fetching ${n}×${n} bike distance matrix...`);
const res = await fetch(url);
if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
const data = await res.json();
const dm = data.distances.map(row => row.map(v => (v == null ? Infinity : v / 1000))); // km

// 2. Solve: nearest-neighbor from every start, then 2-opt.
function nearestNeighborTour(start) {
  const visited = new Array(n).fill(false);
  const tour = [start];
  visited[start] = true;
  let cur = start;
  for (let step = 1; step < n; step++) {
    let best = -1, bestD = Infinity;
    for (let j = 0; j < n; j++) {
      if (!visited[j] && dm[cur][j] < bestD) { bestD = dm[cur][j]; best = j; }
    }
    tour.push(best);
    visited[best] = true;
    cur = best;
  }
  return tour;
}
function tourLen(t) {
  let s = 0;
  for (let i = 0; i < t.length - 1; i++) s += dm[t[i]][t[i + 1]];
  return s;
}
function twoOpt(t) {
  const tour = t.slice();
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < tour.length - 1; i++) {
      for (let k = i + 1; k < tour.length; k++) {
        const a = tour[i], b = tour[i + 1] ?? null;
        const c = tour[k], d = tour[k + 1] ?? null;
        if (b == null) continue;
        // current cost a-b ... c-d  vs  a-c ... b-d (edges removed: ab, cd)
        const before = dm[a][b] + (d != null ? dm[c][d] : 0);
        const after  = dm[a][c] + (d != null ? dm[b][d] : 0);
        if (after + 1e-9 < before) {
          // reverse segment i+1..k
          let l = i + 1, r = k;
          while (l < r) { [tour[l], tour[r]] = [tour[r], tour[l]]; l++; r--; }
          improved = true;
        }
      }
    }
  }
  return tour;
}

let bestTour = null;
let bestKm = Infinity;
for (let start = 0; start < n; start++) {
  const t0 = nearestNeighborTour(start);
  const t1 = twoOpt(t0);
  const km = tourLen(t1);
  if (km < bestKm) { bestKm = km; bestTour = t1; }
}

// 3. Report.
console.log(`\nShortest open-TSP tour (visit all ${n}, no return):`);
console.log(`Total distance: ${bestKm.toFixed(2)} km\n`);
console.log(`Order:`);
for (let i = 0; i < bestTour.length; i++) {
  const p = pts[bestTour[i]];
  const leg = i === 0 ? '' : ` (+${dm[bestTour[i - 1]][bestTour[i]].toFixed(2)} km)`;
  console.log(`  ${String(i + 1).padStart(2)}. #${p.id} ${p.name}${leg}`);
}

// Also try closed (return to start) for comparison.
function tourLenClosed(t) {
  return tourLen(t) + dm[t[t.length - 1]][t[0]];
}
let bestClosedKm = Infinity;
let bestClosedTour = null;
for (let start = 0; start < n; start++) {
  const t0 = nearestNeighborTour(start);
  const t1 = twoOpt(t0);
  const km = tourLenClosed(t1);
  if (km < bestClosedKm) { bestClosedKm = km; bestClosedTour = t1; }
}
console.log(`\nShortest closed-loop tour (return to start):`);
console.log(`Total distance: ${bestClosedKm.toFixed(2)} km`);
console.log(`Loop order: ${bestClosedTour.map(i => pts[i].id).join(' → ')} → ${pts[bestClosedTour[0]].id}`);
