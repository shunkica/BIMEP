import { POINTS, POINT_BY_ID, neighbours, type BimepPoint } from './data/points';
import { roadKm } from './data/routes';
import { visited, CURRENT_YEAR, totalTimeMs } from './visited';
import { openNavigation } from './nav';
import { t, getLang, setLang, onLangChange, type Lang } from './i18n';
import { formatClock, formatDateTime, formatDuration, parseLocalDateTime, toLocalInputString } from './time';
import type { Fix } from './location';
import { aerialKmMap } from './location';
import { roadDistancesFrom } from './osrm';
import { signInGoogle, signInApple, signOutUser, onAuth, isFirebaseConfigured } from './auth';
import type { User } from 'firebase/auth';
import { computePlan, setPlan, getCurrentPlan, defaultSelectedIds, fmtTotal, planPoints, onPlanChange } from './plan';

const header = document.getElementById('header-inner') as HTMLDivElement;
const sheetEl = document.getElementById('sheet') as HTMLDivElement;
const statusEl = document.getElementById('status') as HTMLDivElement;
const listEl = document.getElementById('list') as HTMLDivElement;
const actionsEl = document.getElementById('actions') as HTMLDivElement;
const statsEl = document.getElementById('stats') as HTMLDivElement;

let latestFix: Fix | null = null;
let roadKmFromUser: Map<number, number> = new Map();
let currentUser: User | null = null;

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]!));
}

/* ---------- Header ---------- */

export function renderHeader() {
  const year = visited.getActiveYear();
  const years = visited.years();
  const isCurrent = year === CURRENT_YEAR;

  const authLabel = currentUser
    ? (currentUser.displayName || currentUser.email || '👤')
    : t('login.button');
  const authPart = `<button class="auth-btn${currentUser ? ' signed-in' : ''}" data-action="open-auth" aria-label="${escapeHtml(authLabel)}">
    <span class="auth-icon">${currentUser ? '👤' : '⇲'}</span>
    <span class="auth-label">${escapeHtml(authLabel)}</span>
  </button>`;

  header.innerHTML = `
    <div class="branding">
      <h1>${escapeHtml(t('app.title'))} <span class="year">${year}</span>${!isCurrent ? ` <span class="archive">${escapeHtml(t('history.read_only'))}</span>` : ''}</h1>
    </div>
    <div class="controls">
      <select id="year-select" aria-label="year">
        ${years.map(y => `<option value="${y}" ${y === year ? 'selected' : ''}>${y}</option>`).join('')}
      </select>
      <select id="lang-select" aria-label="${escapeHtml(t('lang.name'))}">
        <option value="hr" ${getLang() === 'hr' ? 'selected' : ''}>HR</option>
        <option value="en" ${getLang() === 'en' ? 'selected' : ''}>EN</option>
        <option value="de" ${getLang() === 'de' ? 'selected' : ''}>DE</option>
      </select>
      ${authPart}
    </div>
    <div id="progress">${escapeHtml(t('app.progress', { done: visited.forYear(year).length, total: POINTS.length }))}</div>
  `;

  (header.querySelector('#year-select') as HTMLSelectElement).addEventListener('change', e => {
    visited.setActiveYear(Number((e.target as HTMLSelectElement).value));
  });
  (header.querySelector('#lang-select') as HTMLSelectElement).addEventListener('change', e => {
    setLang((e.target as HTMLSelectElement).value as Lang);
  });
  header.querySelector('[data-action="open-auth"]')?.addEventListener('click', openAuthSheet);
}

function openAuthSheet() {
  const configured = isFirebaseConfigured();
  const u = currentUser;
  const body = u
    ? `<div class="auth-user">
         <div class="auth-user-name">${escapeHtml(u.displayName || u.email || '')}</div>
         ${u.email ? `<div class="auth-user-email muted">${escapeHtml(u.email)}</div>` : ''}
       </div>
       <button class="primary" data-action="logout">${escapeHtml(t('actions.logout'))}</button>`
    : configured
      ? `<p class="muted">${escapeHtml(t('login.blurb'))}</p>
         <button class="primary" data-action="login-google">${escapeHtml(t('actions.login_google'))}</button>
         <button data-action="login-apple">${escapeHtml(t('actions.login_apple'))}</button>
         <p class="muted small">${escapeHtml(t('login.guest_note'))}</p>`
      : `<p class="muted">${escapeHtml(t('login.not_configured'))}</p>
         <p class="muted small">${escapeHtml(t('login.guest_note'))}</p>`;

  sheetEl.innerHTML = `
    <div class="sheet-inner auth-sheet">
      <button class="close" aria-label="Close">×</button>
      <h2>${escapeHtml(t('login.title'))}</h2>
      <div class="auth-actions">${body}</div>
    </div>
  `;
  sheetEl.classList.add('open');
  sheetEl.querySelector('.close')!.addEventListener('click', closeSheet);
  sheetEl.querySelector('[data-action="login-google"]')?.addEventListener('click', () => {
    signInGoogle().then(closeSheet).catch(err => setStatus(err.message, 'error'));
  });
  sheetEl.querySelector('[data-action="login-apple"]')?.addEventListener('click', () => {
    signInApple().then(closeSheet).catch(err => setStatus(err.message, 'error'));
  });
  sheetEl.querySelector('[data-action="logout"]')?.addEventListener('click', () => {
    signOutUser().then(closeSheet);
  });
}

/* ---------- Actions bar ---------- */

export function renderActions(onCheckin: () => void, onReset: () => void) {
  const isCurrent = visited.getActiveYear() === CURRENT_YEAR;
  const plan = getCurrentPlan();
  actionsEl.innerHTML = `
    ${isCurrent ? `<button id="check-in-btn" class="primary">${escapeHtml(t('actions.checkin'))}</button>` : ''}
    <button id="plan-btn">${escapeHtml(t('plan.button'))}</button>
    ${plan ? `<button id="clear-plan-btn">${escapeHtml(t('plan.clear'))}</button>` : ''}
    <button id="reset-btn">${escapeHtml(t('actions.reset'))}</button>
  `;
  actionsEl.querySelector('#check-in-btn')?.addEventListener('click', onCheckin);
  actionsEl.querySelector('#plan-btn')!.addEventListener('click', openPlanner);
  actionsEl.querySelector('#clear-plan-btn')?.addEventListener('click', () => setPlan(null));
  actionsEl.querySelector('#reset-btn')!.addEventListener('click', onReset);
}

/* ---------- Stats ---------- */

function renderStats() {
  const year = visited.getActiveYear();
  const count = visited.forYear(year).length;
  const total = totalTimeMs(year);
  if (count === 0) {
    statsEl.innerHTML = '';
    statsEl.style.display = 'none';
    return;
  }
  statsEl.style.display = '';
  statsEl.innerHTML = `
    <div class="stat">
      <span class="stat-label">${escapeHtml(t('app.progress', { done: count, total: POINTS.length }))}</span>
    </div>
    ${total != null ? `<div class="stat">
      <span class="stat-label">${escapeHtml(t('history.total_time'))}:</span>
      <span class="stat-val">${escapeHtml(formatDuration(total))}</span>
    </div>` : ''}
  `;
}

/* ---------- List ---------- */

function renderList() {
  const year = visited.getActiveYear();
  const km = roadKmFromUser.size > 0 ? roadKmFromUser : (latestFix ? aerialKmMap(latestFix) : new Map<number, number>());
  const usingRoad = roadKmFromUser.size > 0;

  const ranked = POINTS
    .map(p => ({ point: p, km: km.get(p.id) }))
    .sort((a, b) => {
      const av = visited.has(a.point.id, year) ? Infinity : (a.km ?? Infinity);
      const bv = visited.has(b.point.id, year) ? Infinity : (b.km ?? Infinity);
      return av - bv;
    });

  listEl.innerHTML = '';
  for (const { point, km } of ranked) {
    const v = visited.get(point.id, year);
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'row' + (v ? ' visited' : '');
    const distText = km != null
      ? escapeHtml(t(usingRoad ? 'list.road_km' : 'list.aerial_km', { km: km.toFixed(1) }))
      : '—';
    row.innerHTML = `
      <div class="row-lead">
        <span class="pin-num ${v ? 'visited' : ''}">${point.id}</span>
      </div>
      <div class="row-main">
        <div class="row-name">${escapeHtml(point.name)}</div>
        <div class="row-desc">${escapeHtml(point.description)}</div>
      </div>
      <div class="row-trail">
        ${v
          ? `<span class="visited-badge" title="${escapeHtml(t('list.visited_badge'))}">✓ ${escapeHtml(formatClock(v.visitedAt))}</span>`
          : `<span class="row-dist">${distText}</span>`}
      </div>
    `;
    row.addEventListener('click', () => openSheet(point));
    listEl.appendChild(row);
  }
}

/* ---------- Sheet ---------- */

export function openSheet(p: BimepPoint) {
  const year = visited.getActiveYear();
  const v = visited.get(p.id, year);
  const isCurrent = year === CURRENT_YEAR;

  const nbrsHtml = neighbours(p.id)
    .map(({ point, km }) => {
      const road = roadKm(p.id, point.id);
      const kmText = road != null ? road.toFixed(1) : km > 0 ? km.toFixed(1) : '?';
      const vn = visited.has(point.id, year);
      return `<li class="${vn ? 'visited' : ''}">
        <span>${vn ? '✓ ' : ''}${escapeHtml(point.name)}</span>
        <span class="km">${kmText} km</span>
      </li>`;
    })
    .join('');

  const nextSuggestion = neighbours(p.id).find(n => !visited.has(n.point.id, year));
  const suggestKm = nextSuggestion ? (roadKm(p.id, nextSuggestion.point.id) ?? nextSuggestion.km) : 0;
  const suggestionHtml = nextSuggestion
    ? `<div class="suggest">${escapeHtml(t('sheet.next_suggestion', { name: nextSuggestion.point.name, km: suggestKm.toFixed(1) }))}</div>`
    : `<div class="suggest">${escapeHtml(t('sheet.all_neighbours_visited'))}</div>`;

  const visitedLine = v
    ? `<div class="visited-info">
         <strong>${escapeHtml(t('sheet.visited_at'))}:</strong>
         ${escapeHtml(formatDateTime(v.visitedAt))}
         <span class="muted">(${escapeHtml(t(`sheet.source.${v.source}`))})</span>
       </div>`
    : '';

  const actions = isCurrent ? `
    <div class="actions">
      <button class="primary" data-action="navigate">${escapeHtml(t('actions.navigate'))}</button>
      <button data-action="${v ? 'unmark' : 'mark'}">${escapeHtml(t(v ? 'actions.unmark' : 'actions.mark'))}</button>
      ${v ? `<button data-action="edit-time">${escapeHtml(t('actions.edit_time'))}</button>` : ''}
    </div>` : `
    <div class="actions">
      <button class="primary" data-action="navigate">${escapeHtml(t('actions.navigate'))}</button>
      ${v ? `<button data-action="edit-time">${escapeHtml(t('actions.edit_time'))}</button>` : ''}
    </div>`;

  sheetEl.innerHTML = `
    <div class="sheet-inner">
      <button class="close" aria-label="Close">×</button>
      <h2>${v ? '✓ ' : ''}${escapeHtml(p.name)}</h2>
      <p class="desc">${escapeHtml(p.description)}</p>
      ${visitedLine}
      ${suggestionHtml}
      ${actions}
      <h3>${escapeHtml(t('sheet.neighbours'))}</h3>
      <ul class="neighbours">${nbrsHtml}</ul>
    </div>
  `;
  sheetEl.classList.add('open');

  sheetEl.querySelector('.close')!.addEventListener('click', closeSheet);
  sheetEl.querySelector('[data-action="navigate"]')?.addEventListener('click', () => openNavigation(p));
  sheetEl.querySelector('[data-action="mark"]')?.addEventListener('click', () => {
    visited.mark(p.id, 'manual');
    openSheet(POINT_BY_ID[p.id]);
  });
  sheetEl.querySelector('[data-action="unmark"]')?.addEventListener('click', () => {
    visited.unmark(p.id);
    openSheet(POINT_BY_ID[p.id]);
  });
  sheetEl.querySelector('[data-action="edit-time"]')?.addEventListener('click', () => {
    const existing = visited.get(p.id, year);
    const initial = existing ? toLocalInputString(existing.visitedAt) : toLocalInputString(Date.now());
    const input = window.prompt(t('time.edit_prompt'), initial);
    if (input == null) return;
    const parsed = parseLocalDateTime(input);
    if (parsed == null) {
      setStatus(t('time.invalid'), 'error');
      return;
    }
    visited.setTime(p.id, parsed);
    openSheet(POINT_BY_ID[p.id]);
  });
}

export function closeSheet() {
  sheetEl.classList.remove('open');
  sheetEl.innerHTML = '';
}

/* ---------- Planner ---------- */

type PlannerDraft = {
  selected: Set<number>;
  closed: boolean;
  startMode: 'optimal' | number;
};

let plannerDraft: PlannerDraft | null = null;

export function openPlanner() {
  if (!plannerDraft) {
    plannerDraft = {
      selected: new Set(defaultSelectedIds()),
      closed: false,
      startMode: 'optimal',
    };
  }
  renderPlanner();
}

function renderPlanner() {
  if (!plannerDraft) return;
  const draft = plannerDraft;
  const pointRows = POINTS.map(p => {
    const checked = draft.selected.has(p.id);
    const isVisited = visited.has(p.id);
    return `<label class="plan-row ${isVisited ? 'is-visited' : ''}">
      <input type="checkbox" data-id="${p.id}" ${checked ? 'checked' : ''}>
      <span class="plan-row-num">${p.id}</span>
      <span class="plan-row-name">${escapeHtml(p.name)}</span>
      ${isVisited ? '<span class="plan-row-visited">✓</span>' : ''}
    </label>`;
  }).join('');

  const startOptions = [
    `<option value="optimal" ${draft.startMode === 'optimal' ? 'selected' : ''}>${escapeHtml(t('plan.start_optimal'))}</option>`,
    ...POINTS.filter(p => draft.selected.has(p.id)).map(p =>
      `<option value="${p.id}" ${draft.startMode === p.id ? 'selected' : ''}>#${p.id} ${escapeHtml(p.name)}</option>`,
    ),
  ].join('');

  sheetEl.innerHTML = `
    <div class="sheet-inner planner">
      <button class="close" aria-label="Close">×</button>
      <h2>${escapeHtml(t('plan.title'))}</h2>

      <div class="planner-quick">
        <button data-select="all">${escapeHtml(t('plan.all'))}</button>
        <button data-select="unvisited">${escapeHtml(t('plan.unvisited'))}</button>
        <button data-select="none">${escapeHtml(t('plan.none'))}</button>
      </div>

      <h3>${escapeHtml(t('plan.select_points'))}</h3>
      <div class="plan-list">${pointRows}</div>

      <div class="planner-options">
        <label class="opt-row">
          <span>${escapeHtml(t('plan.start_from'))}</span>
          <select id="plan-start">${startOptions}</select>
        </label>
        <label class="opt-row">
          <input type="checkbox" id="plan-closed" ${draft.closed ? 'checked' : ''}>
          <span>${escapeHtml(t('plan.closed'))}</span>
        </label>
      </div>

      <div class="actions">
        <button class="primary" id="plan-calc">${escapeHtml(t('plan.calculate'))}</button>
      </div>
    </div>
  `;
  sheetEl.classList.add('open');

  sheetEl.querySelector('.close')!.addEventListener('click', closeSheet);
  sheetEl.querySelectorAll<HTMLInputElement>('.plan-list input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      const id = Number(cb.dataset.id);
      if (cb.checked) draft.selected.add(id);
      else draft.selected.delete(id);
      // Rebuild only the start dropdown so the selected list stays in sync.
      const sel = sheetEl.querySelector('#plan-start') as HTMLSelectElement;
      const newOpts = [
        `<option value="optimal" ${draft.startMode === 'optimal' ? 'selected' : ''}>${escapeHtml(t('plan.start_optimal'))}</option>`,
        ...POINTS.filter(p => draft.selected.has(p.id)).map(p =>
          `<option value="${p.id}" ${draft.startMode === p.id ? 'selected' : ''}>#${p.id} ${escapeHtml(p.name)}</option>`,
        ),
      ].join('');
      sel.innerHTML = newOpts;
    });
  });
  sheetEl.querySelectorAll<HTMLButtonElement>('.planner-quick button').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.select;
      if (mode === 'all') draft.selected = new Set(POINTS.map(p => p.id));
      else if (mode === 'none') draft.selected.clear();
      else if (mode === 'unvisited') draft.selected = new Set(POINTS.filter(p => !visited.has(p.id)).map(p => p.id));
      renderPlanner();
    });
  });
  (sheetEl.querySelector('#plan-start') as HTMLSelectElement).addEventListener('change', e => {
    const v = (e.target as HTMLSelectElement).value;
    draft.startMode = v === 'optimal' ? 'optimal' : Number(v);
  });
  (sheetEl.querySelector('#plan-closed') as HTMLInputElement).addEventListener('change', e => {
    draft.closed = (e.target as HTMLInputElement).checked;
  });
  (sheetEl.querySelector('#plan-calc') as HTMLButtonElement).addEventListener('click', async () => {
    const ids = [...draft.selected];
    if (ids.length < 2) {
      setStatus(t('plan.need_two'), 'error');
      return;
    }
    const calcBtn = sheetEl.querySelector('#plan-calc') as HTMLButtonElement;
    calcBtn.disabled = true;
    calcBtn.textContent = t('plan.fetching');
    try {
      const plan = await computePlan(ids, {
        closed: draft.closed,
        startId: draft.startMode === 'optimal' ? undefined : draft.startMode,
      });
      openPlanResult(plan);
    } catch (e) {
      setStatus((e as Error).message || t('plan.error'), 'error');
      calcBtn.disabled = false;
      calcBtn.textContent = t('plan.calculate');
    }
  });
}

function openPlanResult(plan: ReturnType<typeof getCurrentPlan> & {}) {
  if (!plan) return;
  const pts = planPoints(plan);
  const legs = plan.result.legsKm;

  const rows = pts.map((p, i) => {
    const vis = visited.has(p.id);
    const legText = legs[i] != null ? t('plan.step_leg', { km: legs[i].toFixed(1) }) : '';
    return `<li class="plan-step ${vis ? 'visited' : ''}">
      <button type="button" class="step-btn" data-id="${p.id}">
        <span class="step-num">${i + 1}</span>
        <span class="step-body">
          <span class="step-name">${vis ? '✓ ' : ''}${escapeHtml(p.name)}</span>
          ${legText ? `<span class="step-leg">${escapeHtml(legText)}</span>` : ''}
        </span>
      </button>
    </li>`;
  }).join('');

  sheetEl.innerHTML = `
    <div class="sheet-inner plan-result">
      <button class="close" aria-label="Close">×</button>
      <h2>${escapeHtml(t('plan.title'))}</h2>
      <div class="plan-total">${escapeHtml(fmtTotal(plan))}</div>
      <ol class="plan-steps">${rows}</ol>
      <div class="actions">
        <button data-action="edit">${escapeHtml(t('plan.back_to_edit'))}</button>
        <button data-action="clear">${escapeHtml(t('plan.clear'))}</button>
      </div>
    </div>
  `;
  sheetEl.classList.add('open');

  sheetEl.querySelector('.close')!.addEventListener('click', closeSheet);
  sheetEl.querySelector('[data-action="edit"]')!.addEventListener('click', renderPlanner);
  sheetEl.querySelector('[data-action="clear"]')!.addEventListener('click', () => {
    setPlan(null);
    closeSheet();
  });
  sheetEl.querySelectorAll<HTMLButtonElement>('.step-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.id);
      const p = POINT_BY_ID[id];
      if (p) openSheet(p);
    });
  });
}

/* ---------- Status toast ---------- */

export function setStatus(msg: string, kind: 'info' | 'success' | 'error' = 'info') {
  statusEl.textContent = msg;
  statusEl.dataset.kind = kind;
  statusEl.classList.add('visible');
  window.clearTimeout((setStatus as any)._t);
  (setStatus as any)._t = window.setTimeout(() => {
    statusEl.classList.remove('visible');
  }, 4000);
}

/* ---------- Public update entry ---------- */

export function renderAll() {
  renderHeader();
  renderStats();
  renderList();
}

export async function updateRoadDistances(fix: Fix) {
  latestFix = fix;
  try {
    roadKmFromUser = await roadDistancesFrom(fix);
    renderList();
  } catch {
    // ignore
  }
}

export function setFix(fix: Fix | null) {
  latestFix = fix;
  renderList();
}

/* ---------- Subscriptions ---------- */

visited.subscribe(() => {
  renderHeader();
  renderStats();
  renderList();
});
onLangChange(() => renderAll());
onAuth(u => {
  currentUser = u;
  renderHeader();
});
onPlanChange(() => {
  // Keep plan-related UI in sync. The action bar rebuilds itself via its own subscribe.
  // Nothing else to do — the map subscribes independently.
});
