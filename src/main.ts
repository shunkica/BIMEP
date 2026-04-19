import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';
import { initMap, showUserFix, flyTo } from './map';
import { renderAll, setStatus, updateRoadDistances, setFix } from './ui';
import { t } from './i18n';
import {
  getCurrentFix,
  watchFix,
  pointsWithin,
  AUTO_CHECKIN_RADIUS_M,
} from './location';
import { visited, CURRENT_YEAR } from './visited';
import { initAuth } from './auth';
import { onPlanChange } from './plan';
import { registerSW } from 'virtual:pwa-register';

registerSW({ immediate: true });
initAuth();
initMap('map');
renderAll();

async function runProximityCheck() {
  if (visited.getActiveYear() !== CURRENT_YEAR) return;
  try {
    const fix = await getCurrentFix();
    showUserFix(fix);
    setFix(fix);
    updateRoadDistances(fix).catch(() => {});

    const nearby = pointsWithin(fix, AUTO_CHECKIN_RADIUS_M);
    if (nearby.length === 0) {
      setStatus(t('status.not_near_any'), 'info');
      return;
    }
    const fresh = nearby.filter(p => !visited.has(p.id));
    for (const p of nearby) visited.mark(p.id, 'auto');
    if (fresh.length > 0) {
      setStatus(t('status.marked', { names: fresh.map(p => p.name).join(', ') }), 'success');
      flyTo(fresh[0].lat, fresh[0].lng, 14);
    } else {
      setStatus(t('status.already_marked'), 'info');
    }
  } catch (e) {
    const code = (e as GeolocationPositionError)?.code;
    const msg = code === 1 ? t('status.location_denied') : t('status.location_error');
    setStatus(msg, 'error');
  }
}

function resetVisits() {
  const year = visited.getActiveYear();
  if (confirm(t('confirm.reset', { year }))) {
    visited.clear(year);
    setStatus(t('status.cleared'), 'info');
  }
}

import { renderActions } from './ui';
renderActions(runProximityCheck, resetVisits);

visited.subscribe(() => {
  renderActions(runProximityCheck, resetVisits);
});
onPlanChange(() => {
  renderActions(runProximityCheck, resetVisits);
});

watchFix(
  fix => {
    showUserFix(fix);
    setFix(fix);
  },
  () => {},
);

runProximityCheck();
