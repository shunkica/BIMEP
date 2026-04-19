import maplibregl from 'maplibre-gl';
import { pointByIdMap, haversineMeters } from './data/points';
import { getYearData } from './data/registry';
import { getRoute, routeKey } from './data/routes';
import { visited } from './visited';
import { openSheet } from './ui';
import type { Fix } from './location';
import { getCurrentPlan, onPlanChange, type PlanState } from './plan';

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

// Per-year markers: keyed by `${year}_${id}` so switching years keeps the
// right set on the map.
const markers = new Map<number, maplibregl.Marker>();
let renderedYear: number | null = null;
let userMarker: maplibregl.Marker | null = null;
let mapRef: maplibregl.Map | null = null;

function markerEl(year: number, id: number): HTMLDivElement {
  const el = document.createElement('div');
  const isVisited = visited.has(id, year);
  el.className = 'pin' + (isVisited ? ' visited' : '');
  el.textContent = String(id);
  return el;
}

function refreshMarker(year: number, id: number) {
  const m = markers.get(id);
  if (!m) return;
  const el = m.getElement();
  el.classList.toggle('visited', visited.has(id, year));
}

export function initMap(containerId: string) {
  const map = new maplibregl.Map({
    container: containerId,
    style: STYLE_URL,
    center: [16.55, 46.42],
    zoom: 10.3,
    attributionControl: { compact: true },
  });
  mapRef = map;

  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
  map.addControl(
    new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserLocation: true,
    }),
    'top-right',
  );

  map.on('load', () => {
    map.addSource('edges', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
    map.addLayer({
      id: 'edges-casing',
      type: 'line',
      source: 'edges',
      paint: {
        'line-color': '#ffffff',
        'line-width': 6,
        'line-opacity': 0.6,
      },
    });
    map.addLayer({
      id: 'edges-solid',
      type: 'line',
      source: 'edges',
      filter: ['==', ['get', 'dashed'], false],
      paint: {
        'line-color': '#c0392b',
        'line-width': 4,
        'line-opacity': 0.9,
      },
    });
    map.addLayer({
      id: 'edges-dashed',
      type: 'line',
      source: 'edges',
      filter: ['==', ['get', 'dashed'], true],
      paint: {
        'line-color': '#c0392b',
        'line-width': 4,
        'line-opacity': 0.9,
        'line-dasharray': [2, 2],
      },
    });
    // Fade the network edges when a plan is active so the plan line reads clearly.
    updateEdgeOpacityForPlan(getCurrentPlan());

    map.addSource('plan', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
    map.addLayer({
      id: 'plan-casing',
      type: 'line',
      source: 'plan',
      paint: {
        'line-color': '#ffffff',
        'line-width': 8,
        'line-opacity': 0.7,
      },
    });
    map.addLayer({
      id: 'plan-line',
      type: 'line',
      source: 'plan',
      paint: {
        'line-color': '#8e44ad',
        'line-width': 5,
        'line-opacity': 0.95,
      },
    });

    renderForYear(visited.getActiveYear());
    renderPlan(getCurrentPlan());
    updateEdgeOpacityForPlan(getCurrentPlan());
  });

  visited.subscribe(() => {
    const year = visited.getActiveYear();
    if (year !== renderedYear) {
      renderForYear(year);
    } else {
      for (const id of markers.keys()) refreshMarker(year, id);
    }
  });

  onPlanChange(plan => {
    renderPlan(plan);
    updateEdgeOpacityForPlan(plan);
  });

  return map;
}

function renderForYear(year: number) {
  if (!mapRef) return;
  renderedYear = year;
  const { points, edges } = getYearData(year);

  // Rebuild edges
  const edgeFeatures: GeoJSON.Feature[] = [];
  for (const e of edges) {
    const route = getRoute(year, e.a, e.b);
    if (!route) continue;
    edgeFeatures.push({
      type: 'Feature',
      properties: {
        dashed: !!e.dashed,
        key: routeKey(e.a, e.b),
        distanceM: route.distanceM,
      },
      geometry: route.geometry,
    });
  }
  const edgeSrc = mapRef.getSource('edges') as maplibregl.GeoJSONSource | undefined;
  edgeSrc?.setData({ type: 'FeatureCollection', features: edgeFeatures });

  // Rebuild markers
  for (const m of markers.values()) m.remove();
  markers.clear();
  for (const p of points) {
    const el = markerEl(year, p.id);
    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([p.lng, p.lat])
      .addTo(mapRef);
    el.addEventListener('click', ev => {
      ev.stopPropagation();
      openSheet(p);
    });
    markers.set(p.id, marker);
  }
}

function updateEdgeOpacityForPlan(plan: PlanState | null) {
  if (!mapRef) return;
  const year = visited.getActiveYear();
  const active = plan != null && plan.year === year && plan.result.ordered.length >= 2;
  const edgeOp = active ? 0.25 : 0.9;
  const casingOp = active ? 0.25 : 0.6;
  try {
    mapRef.setPaintProperty('edges-solid', 'line-opacity', edgeOp);
    mapRef.setPaintProperty('edges-dashed', 'line-opacity', edgeOp);
    mapRef.setPaintProperty('edges-casing', 'line-opacity', casingOp);
  } catch {
    // Layers may not exist yet on first call before style is loaded.
  }
}

function renderPlan(plan: PlanState | null) {
  if (!mapRef) return;
  const src = mapRef.getSource('plan') as maplibregl.GeoJSONSource | undefined;
  if (!src) return;
  const activeYear = visited.getActiveYear();
  const relevant = plan != null && plan.year === activeYear && plan.result.ordered.length >= 2
    ? plan
    : null;
  if (!relevant) {
    src.setData({ type: 'FeatureCollection', features: [] });
    updateMarkerOrdinals(null);
    return;
  }
  const byId = pointByIdMap(getYearData(relevant.year).points);
  const coords: [number, number][] = relevant.result.ordered
    .map(id => byId[id])
    .filter(p => p != null)
    .map(p => [p.lng, p.lat]);
  if (relevant.closed && coords.length > 1) coords.push(coords[0]);
  src.setData({
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: coords },
    }],
  });
  updateMarkerOrdinals(relevant);
}

function updateMarkerOrdinals(plan: PlanState | null) {
  if (!plan) {
    for (const [id, m] of markers) {
      const el = m.getElement();
      el.classList.remove('in-plan', 'not-in-plan');
      el.textContent = String(id);
    }
    return;
  }
  const order = new Map<number, number>();
  plan.result.ordered.forEach((id, i) => order.set(id, i + 1));
  for (const [id, m] of markers) {
    const el = m.getElement();
    const pos = order.get(id);
    if (pos != null) {
      el.classList.add('in-plan');
      el.classList.remove('not-in-plan');
      el.textContent = String(pos);
    } else {
      el.classList.add('not-in-plan');
      el.classList.remove('in-plan');
      el.textContent = String(id);
    }
  }
}

export function showUserFix(fix: Fix) {
  if (!mapRef) return;
  if (!userMarker) {
    const el = document.createElement('div');
    el.className = 'user-dot';
    userMarker = new maplibregl.Marker({ element: el }).setLngLat([fix.lng, fix.lat]).addTo(mapRef);
  } else {
    userMarker.setLngLat([fix.lng, fix.lat]);
  }
}

export function flyTo(lat: number, lng: number, zoom = 14) {
  mapRef?.flyTo({ center: [lng, lat], zoom });
}

/**
 * Pick a sensible initial view once we have the user's fix:
 *  - If the user is within 15 km of any point (they're at or near the event),
 *    fit bounds around the user + nearest 3 points so the relationship is
 *    visible.
 *  - Otherwise, fit bounds to all points so the whole BIMEP network is shown.
 * Uses fitBounds rather than flyTo to avoid jarring zooms.
 */
export function centerOnUserOrPoints(fix: Fix | null) {
  if (!mapRef) return;
  const year = visited.getActiveYear();
  const { points } = getYearData(year);
  if (points.length === 0) return;

  const lngs = points.map(p => p.lng);
  const lats = points.map(p => p.lat);
  const pMin: [number, number] = [Math.min(...lngs), Math.min(...lats)];
  const pMax: [number, number] = [Math.max(...lngs), Math.max(...lats)];

  if (fix) {
    const nearestKm = Math.min(
      ...points.map(p => haversineMeters(fix.lat, fix.lng, p.lat, p.lng) / 1000),
    );
    if (nearestKm <= 15) {
      const sorted = points
        .map(p => ({ p, km: haversineMeters(fix.lat, fix.lng, p.lat, p.lng) / 1000 }))
        .sort((a, b) => a.km - b.km)
        .slice(0, 3);
      const fxLngs = [fix.lng, ...sorted.map(x => x.p.lng)];
      const fxLats = [fix.lat, ...sorted.map(x => x.p.lat)];
      mapRef.fitBounds(
        [[Math.min(...fxLngs), Math.min(...fxLats)], [Math.max(...fxLngs), Math.max(...fxLats)]],
        { padding: 60, maxZoom: 14, duration: 600 },
      );
      return;
    }
  }
  mapRef.fitBounds([pMin, pMax], { padding: 40, maxZoom: 11, duration: 600 });
}
