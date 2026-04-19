import { haversineMeters } from './data/points';
import type { BimepPoint } from './data/points';

export const AUTO_CHECKIN_RADIUS_M = 350;

export interface Fix {
  lat: number;
  lng: number;
  accuracyM: number;
  at: number;
}

export function getCurrentFix(timeoutMs = 15_000): Promise<Fix> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation not available'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      p => resolve({
        lat: p.coords.latitude,
        lng: p.coords.longitude,
        accuracyM: p.coords.accuracy,
        at: p.timestamp,
      }),
      e => reject(e),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30_000 },
    );
  });
}

export function watchFix(
  onFix: (f: Fix) => void,
  onError?: (e: GeolocationPositionError) => void,
): () => void {
  if (!('geolocation' in navigator)) return () => {};
  const id = navigator.geolocation.watchPosition(
    p => onFix({
      lat: p.coords.latitude,
      lng: p.coords.longitude,
      accuracyM: p.coords.accuracy,
      at: p.timestamp,
    }),
    e => onError?.(e),
    { enableHighAccuracy: true, maximumAge: 5_000 },
  );
  return () => navigator.geolocation.clearWatch(id);
}

export function pointsWithin(fix: Fix, radiusM: number, points: BimepPoint[]): BimepPoint[] {
  return points.filter(
    p => haversineMeters(fix.lat, fix.lng, p.lat, p.lng) <= radiusM,
  );
}

export function aerialKmMap(fix: Fix, points: BimepPoint[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const p of points) {
    m.set(p.id, haversineMeters(fix.lat, fix.lng, p.lat, p.lng) / 1000);
  }
  return m;
}
