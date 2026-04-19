import { POINTS } from './data/points';

export type VisitSource = 'auto' | 'manual';

export interface Visit {
  year: number;
  pointId: number;
  visitedAt: number; // epoch ms
  source: VisitSource;
}

export const CURRENT_YEAR = 2026;
const KEY = 'bimep.visits.v2';

function visitKey(year: number, pointId: number): string {
  return `${year}_${pointId}`;
}

function load(): Map<string, Visit> {
  const store = new Map<string, Visit>();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const arr = JSON.parse(raw) as Visit[];
      for (const v of arr) {
        if (v && typeof v.pointId === 'number' && typeof v.year === 'number') {
          store.set(visitKey(v.year, v.pointId), v);
        }
      }
    }
  } catch {
    // ignore
  }
  return store;
}

function save(store: Map<string, Visit>) {
  localStorage.setItem(KEY, JSON.stringify([...store.values()]));
}

const store = load();
type Listener = () => void;
const listeners = new Set<Listener>();
let activeYear = CURRENT_YEAR;
let externalSync: ((v: Visit, action: 'upsert' | 'delete') => void) | null = null;

function notify() {
  listeners.forEach(l => l());
}

export const visited = {
  setActiveYear(year: number) {
    if (activeYear === year) return;
    activeYear = year;
    notify();
  },
  getActiveYear() {
    return activeYear;
  },
  setExternalSync(fn: typeof externalSync) {
    externalSync = fn;
  },
  /** All visits across all years. */
  all(): Visit[] {
    return [...store.values()];
  },
  /** Visits for a given year (default: active year). */
  forYear(year: number = activeYear): Visit[] {
    return [...store.values()].filter(v => v.year === year);
  },
  /** Years that have at least one visit. */
  years(): number[] {
    const set = new Set<number>([CURRENT_YEAR]);
    for (const v of store.values()) set.add(v.year);
    return [...set].sort((a, b) => b - a);
  },
  has(pointId: number, year: number = activeYear): boolean {
    return store.has(visitKey(year, pointId));
  },
  get(pointId: number, year: number = activeYear): Visit | undefined {
    return store.get(visitKey(year, pointId));
  },
  mark(pointId: number, source: VisitSource = 'manual', year: number = activeYear, visitedAt: number = Date.now()) {
    const k = visitKey(year, pointId);
    if (store.has(k)) return; // first-write-wins
    const v: Visit = { year, pointId, visitedAt, source };
    store.set(k, v);
    save(store);
    externalSync?.(v, 'upsert');
    notify();
  },
  setTime(pointId: number, visitedAt: number, year: number = activeYear) {
    const k = visitKey(year, pointId);
    const existing = store.get(k);
    const v: Visit = existing
      ? { ...existing, visitedAt, source: 'manual' }
      : { year, pointId, visitedAt, source: 'manual' };
    store.set(k, v);
    save(store);
    externalSync?.(v, 'upsert');
    notify();
  },
  unmark(pointId: number, year: number = activeYear) {
    const k = visitKey(year, pointId);
    const v = store.get(k);
    if (!v) return;
    store.delete(k);
    save(store);
    externalSync?.(v, 'delete');
    notify();
  },
  clear(year?: number) {
    if (year == null) {
      for (const v of store.values()) externalSync?.(v, 'delete');
      store.clear();
    } else {
      for (const [k, v] of store) {
        if (v.year === year) {
          store.delete(k);
          externalSync?.(v, 'delete');
        }
      }
    }
    save(store);
    notify();
  },
  /** Merge incoming visits first-write-wins (existing keys kept). */
  mergeIn(incoming: Visit[]): { added: number; skipped: number } {
    let added = 0, skipped = 0;
    for (const v of incoming) {
      const k = visitKey(v.year, v.pointId);
      if (store.has(k)) { skipped++; continue; }
      store.set(k, v);
      added++;
    }
    if (added) save(store);
    notify();
    return { added, skipped };
  },
  /** Replace local store wholesale (used when switching user). */
  replaceAll(visits: Visit[]) {
    store.clear();
    for (const v of visits) store.set(visitKey(v.year, v.pointId), v);
    save(store);
    notify();
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

/** Total elapsed time from first to last visit in the active year (ms). */
export function totalTimeMs(year: number = activeYear): number | null {
  const visits = visited.forYear(year);
  if (visits.length < 2) return null;
  const ts = visits.map(v => v.visitedAt).sort((a, b) => a - b);
  return ts[ts.length - 1] - ts[0];
}

/** Leg durations between consecutive visits (ordered by time). */
export function legs(year: number = activeYear): { from: Visit; to: Visit; ms: number }[] {
  const visits = visited.forYear(year).sort((a, b) => a.visitedAt - b.visitedAt);
  const out: { from: Visit; to: Visit; ms: number }[] = [];
  for (let i = 1; i < visits.length; i++) {
    out.push({ from: visits[i - 1], to: visits[i], ms: visits[i].visitedAt - visits[i - 1].visitedAt });
  }
  return out;
}

/** Visit count for a year. */
export function countForYear(year: number = activeYear): number {
  return visited.forYear(year).length;
}

export const TOTAL_POINTS = POINTS.length;
