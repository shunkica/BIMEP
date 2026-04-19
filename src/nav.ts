import type { BimepPoint } from './data/points';

export function openNavigation(p: BimepPoint) {
  const { lat, lng, name } = p;
  const ua = navigator.userAgent;
  const isApple = /iPad|iPhone|iPod|Macintosh/.test(ua);
  const url = isApple
    ? `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=b&q=${encodeURIComponent(name)}`
    : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=bicycling`;
  window.open(url, '_blank', 'noopener');
}
