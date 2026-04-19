import routesJson from './routes.json';

export interface RouteGeometry {
  distanceM: number;
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
}

const routes = routesJson as unknown as Record<string, RouteGeometry>;

export function routeKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

export function getRoute(a: number, b: number): RouteGeometry | undefined {
  return routes[routeKey(a, b)];
}

export function allRoutes(): { a: number; b: number; route: RouteGeometry }[] {
  return Object.entries(routes).map(([k, route]) => {
    const [a, b] = k.split('-').map(Number);
    return { a, b, route };
  });
}

export function roadKm(a: number, b: number): number | undefined {
  const r = getRoute(a, b);
  return r ? r.distanceM / 1000 : undefined;
}
