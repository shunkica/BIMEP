import type { BimepPoint, BimepEdge } from './points';
import { POINTS_2026, EDGES_2026 } from './years/2026';
import routes2026 from './years/routes-2026.json';
import type { RouteGeometry } from './routes';

export interface YearData {
  year: number;
  points: BimepPoint[];
  edges: BimepEdge[];
  routes: Record<string, RouteGeometry>;
}

// Add a new year by creating src/data/years/<year>.ts + routes-<year>.json,
// then registering here. Past years should never be edited after the event.
const YEARS: Record<number, YearData> = {
  2026: {
    year: 2026,
    points: POINTS_2026,
    edges: EDGES_2026,
    routes: routes2026 as unknown as Record<string, RouteGeometry>,
  },
};

export const AVAILABLE_YEARS: number[] = Object.keys(YEARS)
  .map(Number)
  .sort((a, b) => b - a); // newest first

export const LATEST_YEAR: number = AVAILABLE_YEARS[0];

export function getYearData(year: number): YearData {
  return YEARS[year] ?? YEARS[LATEST_YEAR];
}

export function yearHasData(year: number): boolean {
  return year in YEARS;
}
