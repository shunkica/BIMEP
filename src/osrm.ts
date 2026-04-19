import { POINTS } from './data/points';
import { haversineMeters } from './data/points';
import type { Fix } from './location';

let cached: { fixKey: string; roadKm: Map<number, number> } | null = null;

function fixKey(fix: Fix): string {
  return `${fix.lat.toFixed(4)},${fix.lng.toFixed(4)}`;
}

export async function roadDistancesFrom(fix: Fix, signal?: AbortSignal): Promise<Map<number, number>> {
  const key = fixKey(fix);
  if (cached?.fixKey === key) return cached.roadKm;

  // OSRM "table" with single source
  const coords = [`${fix.lng},${fix.lat}`, ...POINTS.map(p => `${p.lng},${p.lat}`)].join(';');
  const dests = POINTS.map((_, i) => i + 1).join(';');
  const url = `https://router.project-osrm.org/table/v1/driving/${coords}?annotations=distance&sources=0&destinations=${dests}`;
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    const row: (number | null)[] = data.distances?.[0] ?? [];
    const out = new Map<number, number>();
    for (let i = 0; i < POINTS.length; i++) {
      const m = row[i];
      if (typeof m === 'number') out.set(POINTS[i].id, m / 1000);
    }
    cached = { fixKey: key, roadKm: out };
    return out;
  } catch {
    // Offline / OSRM unreachable: fall back to aerial distance.
    const out = new Map<number, number>();
    for (const p of POINTS) {
      out.set(p.id, haversineMeters(fix.lat, fix.lng, p.lat, p.lng) / 1000);
    }
    cached = { fixKey: key, roadKm: out };
    return out;
  }
}

export function clearRoadDistanceCache() {
  cached = null;
}
