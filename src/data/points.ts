export type Precision = 'landmark' | 'centre';

export interface BimepPoint {
  id: number;
  name: string;
  description: string;
  lat: number;
  lng: number;
  precision: Precision;
}

export interface BimepEdge {
  a: number;
  b: number;
  km: number;
  dashed?: boolean;
}

export function pointById(points: BimepPoint[], id: number): BimepPoint | undefined {
  return points.find(p => p.id === id);
}

export function pointByIdMap(points: BimepPoint[]): Record<number, BimepPoint> {
  const m: Record<number, BimepPoint> = {};
  for (const p of points) m[p.id] = p;
  return m;
}

/**
 * Neighbours of a point within a given year's edge graph. Prefers road distance
 * from the year's routes (bike-snapped) and falls back to the flyer's labelled
 * km when no road data exists. `km` is always populated.
 */
export function neighbours(
  id: number,
  points: BimepPoint[],
  edges: BimepEdge[],
  roadKmLookup?: (a: number, b: number) => number | undefined,
): { point: BimepPoint; km: number }[] {
  const byId = pointByIdMap(points);
  return edges
    .filter(e => e.a === id || e.b === id)
    .map(e => {
      const other = byId[e.a === id ? e.b : e.a];
      const road = roadKmLookup?.(e.a, e.b);
      const km = road ?? (e.km > 0 ? e.km : 0);
      return { point: other, km };
    })
    .filter(n => n.point != null)
    .sort((x, y) => x.km - y.km);
}

export function haversineMeters(
  aLat: number, aLng: number, bLat: number, bLng: number,
): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
