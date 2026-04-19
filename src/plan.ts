import { pointByIdMap } from './data/points';
import { getYearData } from './data/registry';
import { visited, CURRENT_YEAR } from './visited';
import { fetchDistanceMatrix, solveTSP, estimateTime, type TspResult } from './tsp';
import { t } from './i18n';

export interface PlanState {
  year: number;
  result: TspResult;
  closed: boolean;
}

const PLAN_KEY = 'bimep.plan.v1';

function loadPlan(): PlanState | null {
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as PlanState;
    if (!p || !p.result || !Array.isArray(p.result.ordered)) return null;
    return p;
  } catch { return null; }
}

function savePlan(p: PlanState | null) {
  try {
    if (p) localStorage.setItem(PLAN_KEY, JSON.stringify(p));
    else localStorage.removeItem(PLAN_KEY);
  } catch { /* quota */ }
}

let current: PlanState | null = loadPlan();
type Listener = (p: PlanState | null) => void;
const listeners = new Set<Listener>();

export function getCurrentPlan(): PlanState | null {
  return current;
}

export function setPlan(p: PlanState | null) {
  current = p;
  savePlan(p);
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
  const year = visited.getActiveYear();
  const km = await fetchDistanceMatrix(year);
  const result = solveTSP(km, selectedIds, year, opts);
  const state: PlanState = { year, result, closed: opts.closed };
  setPlan(state);
  return state;
}

// Default selection: unvisited points for the active year if there are 2+, else all.
export function defaultSelectedIds(): number[] {
  const year = visited.getActiveYear();
  const { points } = getYearData(year);
  const unvisited = points.filter(p => !visited.has(p.id, year)).map(p => p.id);
  if (unvisited.length >= 2 && year === CURRENT_YEAR) return unvisited;
  return points.map(p => p.id);
}

export function planPoints(plan: PlanState) {
  const byId = pointByIdMap(getYearData(plan.year).points);
  return plan.result.ordered.map(id => byId[id]).filter(p => p != null);
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
