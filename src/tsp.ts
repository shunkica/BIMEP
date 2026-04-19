import { POINTS } from './data/points';

const MATRIX_KEY = 'bimep.dm.v1';
const MATRIX_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

interface MatrixCache {
  km: number[][];
  at: number;
  n: number;
}

export async function fetchDistanceMatrix(force = false): Promise<number[][]> {
  if (!force) {
    const cached = loadCache();
    if (cached) return cached;
  }
  const coords = POINTS.map(p => `${p.lng},${p.lat}`).join(';');
  const url = `https://routing.openstreetmap.de/routed-bike/table/v1/bike/${coords}?annotations=distance`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`table ${res.status}`);
  const data = await res.json();
  if (!data.distances) throw new Error('no distances');
  const km: number[][] = data.distances.map((row: (number | null)[]) =>
    row.map(v => (v == null ? Infinity : v / 1000)),
  );
  saveCache({ km, at: Date.now(), n: POINTS.length });
  return km;
}

function loadCache(): number[][] | null {
  try {
    const raw = localStorage.getItem(MATRIX_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as MatrixCache;
    if (c.n !== POINTS.length) return null;
    if (Date.now() - c.at > MATRIX_TTL_MS) return null;
    return c.km;
  } catch { return null; }
}

function saveCache(c: MatrixCache) {
  try { localStorage.setItem(MATRIX_KEY, JSON.stringify(c)); } catch { /* quota */ }
}

export interface TspResult {
  ordered: number[];     // point IDs in visit order
  legsKm: number[];      // legsKm[i] = distance from ordered[i] to ordered[i+1]
  totalKm: number;       // sum of legs (+ closing leg if closed)
}

export interface TspOptions {
  closed?: boolean;      // return to start
  startId?: number;      // fixed starting point ID
}

export function solveTSP(
  km: number[][],
  selectedIds: number[],
  options: TspOptions = {},
): TspResult {
  const idxByPointId = new Map(POINTS.map((p, i) => [p.id, i]));
  const sel = selectedIds
    .map(id => idxByPointId.get(id))
    .filter((i): i is number => i != null);
  const n = sel.length;
  if (n === 0) return { ordered: [], legsKm: [], totalKm: 0 };
  if (n === 1) return { ordered: [selectedIds[0]], legsKm: [], totalKm: 0 };

  const d = (i: number, j: number) => km[sel[i]][sel[j]];

  const startLocal = options.startId != null
    ? sel.findIndex(i => POINTS[i].id === options.startId)
    : -1;

  const starts = startLocal >= 0 ? [startLocal] : Array.from({ length: n }, (_, i) => i);

  let bestKm = Infinity;
  let bestTour: number[] = [];
  const closed = !!options.closed;

  for (const s of starts) {
    const tour = nearestNeighbor(s, n, d);
    twoOpt(tour, d, closed, startLocal >= 0);
    const total = tourLen(tour, d, closed);
    if (total < bestKm) {
      bestKm = total;
      bestTour = tour.slice();
    }
  }

  const legsKm: number[] = [];
  for (let i = 0; i < bestTour.length - 1; i++) {
    legsKm.push(d(bestTour[i], bestTour[i + 1]));
  }
  if (closed && bestTour.length > 1) {
    legsKm.push(d(bestTour[bestTour.length - 1], bestTour[0]));
  }

  return {
    ordered: bestTour.map(i => POINTS[sel[i]].id),
    legsKm,
    totalKm: bestKm,
  };
}

function nearestNeighbor(start: number, n: number, d: (i: number, j: number) => number): number[] {
  const visited = new Array(n).fill(false);
  const tour = [start];
  visited[start] = true;
  let cur = start;
  for (let step = 1; step < n; step++) {
    let best = -1, bestD = Infinity;
    for (let j = 0; j < n; j++) {
      if (!visited[j] && d(cur, j) < bestD) { bestD = d(cur, j); best = j; }
    }
    if (best === -1) break;
    tour.push(best);
    visited[best] = true;
    cur = best;
  }
  return tour;
}

function tourLen(tour: number[], d: (i: number, j: number) => number, closed: boolean): number {
  let s = 0;
  for (let i = 0; i < tour.length - 1; i++) s += d(tour[i], tour[i + 1]);
  if (closed && tour.length > 1) s += d(tour[tour.length - 1], tour[0]);
  return s;
}

function twoOpt(
  tour: number[],
  d: (i: number, j: number) => number,
  closed: boolean,
  fixStart: boolean,
): void {
  const n = tour.length;
  const iMin = fixStart ? 1 : 0;
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = iMin; i < n - 1; i++) {
      for (let k = i + 1; k < n; k++) {
        const a = tour[i], b = tour[i + 1];
        const c = tour[k];
        const hasRight = closed || k + 1 < n;
        const right = hasRight ? tour[(k + 1) % n] : -1;
        const before = d(a, b) + (hasRight ? d(c, right) : 0);
        const after  = d(a, c) + (hasRight ? d(b, right) : 0);
        if (after + 1e-9 < before) {
          let l = i + 1, r = k;
          while (l < r) { [tour[l], tour[r]] = [tour[r], tour[l]]; l++; r--; }
          improved = true;
        }
      }
    }
  }
}

export function estimateTime(km: number, avgKmh = 15): number {
  return Math.round((km / avgKmh) * 60) * 60 * 1000;
}
