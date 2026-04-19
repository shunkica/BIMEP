import maplibregl from 'maplibre-gl';
import { POINTS, POINT_BY_ID, EDGES } from './data/points';
import { getRoute, routeKey } from './data/routes';
import { visited } from './visited';
import { openSheet } from './ui';
import type { Fix } from './location';
import { getCurrentPlan, onPlanChange, type PlanState } from './plan';

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

const markers = new Map<number, maplibregl.Marker>();
let userMarker: maplibregl.Marker | null = null;
let mapRef: maplibregl.Map | null = null;
let latestFix: Fix | null = null;

function markerEl(id: number): HTMLDivElement {
  const el = document.createElement('div');
  const isVisited = visited.has(id);
  el.className = 'pin' + (isVisited ? ' visited' : '');
  el.textContent = String(id);
  return el;
}

function refreshMarker(id: number) {
  const m = markers.get(id);
  if (!m) return;
  const el = m.getElement();
  el.classList.toggle('visited', visited.has(id));
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
    const edgeFeatures: GeoJSON.Feature[] = [];
    for (const e of EDGES) {
      const route = getRoute(e.a, e.b);
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
    map.addSource('edges', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: edgeFeatures },
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

    for (const p of POINTS) {
      const el = markerEl(p.id);
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([p.lng, p.lat])
        .addTo(map);
      el.addEventListener('click', ev => {
        ev.stopPropagation();
        openSheet(p);
        void latestFix;
      });
      markers.set(p.id, marker);
    }
  });

  visited.subscribe(() => {
    for (const id of markers.keys()) refreshMarker(id);
  });

  map.on('load', () => {
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
    renderPlan(getCurrentPlan());
  });

  onPlanChange(plan => renderPlan(plan));

  return map;
}

function renderPlan(plan: PlanState | null) {
  if (!mapRef) return;
  const src = mapRef.getSource('plan') as maplibregl.GeoJSONSource | undefined;
  if (!src) return;
  if (!plan || plan.result.ordered.length < 2) {
    src.setData({ type: 'FeatureCollection', features: [] });
    updateMarkerOrdinals(null);
    return;
  }
  const coords: [number, number][] = plan.result.ordered.map(id => {
    const p = POINT_BY_ID[id];
    return [p.lng, p.lat];
  });
  if (plan.closed && coords.length > 1) coords.push(coords[0]);
  src.setData({
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: coords },
    }],
  });
  updateMarkerOrdinals(plan);
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
  latestFix = fix;
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
