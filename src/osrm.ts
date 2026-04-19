import { haversineMeters } from './data/points';
import { getYearData } from './data/registry';
import type { Fix } from './location';

let cached: { cacheKey: string; roadKm: Map<number, number> } | null = null;

function cacheKeyFor(fix: Fix, year: number): string {
  return `${year}|${fix.lat.toFixed(4)},${fix.lng.toFixed(4)}`;
}

export async function roadDistancesFrom(
  fix: Fix,
  year: number,
  signal?: AbortSignal,
): Promise<Map<number, number>> {
  const key = cacheKeyFor(fix, year);
  if (cached?.cacheKey === key) return cached.roadKm;

  const points = getYearData(year).points;
  const coords = [`${fix.lng},${fix.lat}`, ...points.map(p => `${p.lng},${p.lat}`)].join(';');
  const dests = points.map((_, i) => i + 1).join(';');
  const url = `https://router.project-osrm.org/table/v1/driving/${coords}?annotations=distance&sources=0&destinations=${dests}`;
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    const row: (number | null)[] = data.distances?.[0] ?? [];
    const out = new Map<number, number>();
    for (let i = 0; i < points.length; i++) {
      const m = row[i];
      if (typeof m === 'number') out.set(points[i].id, m / 1000);
    }
    cached = { cacheKey: key, roadKm: out };
    return out;
  } catch {
    // Offline / OSRM unreachable: fall back to aerial distance.
    const out = new Map<number, number>();
    for (const p of points) {
      out.set(p.id, haversineMeters(fix.lat, fix.lng, p.lat, p.lng) / 1000);
    }
    cached = { cacheKey: key, roadKm: out };
    return out;
  }
}

export function clearRoadDistanceCache() {
  cached = null;
}
