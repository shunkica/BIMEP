import { POINTS, POINT_BY_ID } from './data/points';
import { visited, CURRENT_YEAR } from './visited';
import { fetchDistanceMatrix, solveTSP, estimateTime, type TspResult } from './tsp';
import { t } from './i18n';

export interface PlanState {
  result: TspResult;
  closed: boolean;
}

let current: PlanState | null = null;
type Listener = (p: PlanState | null) => void;
const listeners = new Set<Listener>();

export function getCurrentPlan(): PlanState | null {
  return current;
}

export function setPlan(p: PlanState | null) {
  current = p;
  listeners.forEach(l => l(p));
}

export function onPlanChange(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export async function computePlan(
  selectedIds: number[],
  opts: { closed: boolean; startId?: number },
): Promise<PlanState> {
  const km = await fetchDistanceMatrix();
  const result = solveTSP(km, selectedIds, opts);
  const state: PlanState = { result, closed: opts.closed };
  setPlan(state);
  return state;
}

// Default selection: unvisited points if there are 2+, else all.
export function defaultSelectedIds(): number[] {
  const year = visited.getActiveYear();
  const unvisited = POINTS.filter(p => !visited.has(p.id, year)).map(p => p.id);
  if (unvisited.length >= 2 && year === CURRENT_YEAR) return unvisited;
  return POINTS.map(p => p.id);
}

export function planPoints(plan: PlanState) {
  return plan.result.ordered.map(id => POINT_BY_ID[id]);
}

// Convenience label used in plan overlay / list.
export function fmtTotal(plan: PlanState): string {
  const speed = 15;
  const ms = estimateTime(plan.result.totalKm, speed);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.round((ms % 3_600_000) / 60_000);
  const time = h > 0 ? `${h} h ${m} min` : `${m} min`;
  return t('plan.total', {
    km: plan.result.totalKm.toFixed(1),
    time,
    speed,
  });
}
