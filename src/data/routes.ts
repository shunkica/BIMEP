import { getYearData } from './registry';

export interface RouteGeometry {
  distanceM: number;
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
}

export function routeKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

export function getRoute(year: number, a: number, b: number): RouteGeometry | undefined {
  return getYearData(year).routes[routeKey(a, b)];
}

export function roadKm(year: number, a: number, b: number): number | undefined {
  const r = getRoute(year, a, b);
  return r ? r.distanceM / 1000 : undefined;
}
