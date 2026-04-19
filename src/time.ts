import { getLang } from './i18n';

export function formatClock(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleTimeString(langBcp(), { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleString(langBcp(), { dateStyle: 'medium', timeStyle: 'short' });
}

export function formatDuration(ms: number): string {
  if (ms < 0) ms = 0;
  const totalMin = Math.floor(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h} h ${m} min`;
  return `${m} min`;
}

function langBcp(): string {
  const l = getLang();
  return l === 'hr' ? 'hr-HR' : l === 'de' ? 'de-DE' : 'en-GB';
}

/** Parse "YYYY-MM-DD HH:MM" in local time. Returns epoch ms or null. */
export function parseLocalDateTime(input: string): number | null {
  const m = input.match(/^\s*(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{2})\s*$/);
  if (!m) return null;
  const [, y, mo, d, hh, mm] = m;
  const dt = new Date(Number(y), Number(mo) - 1, Number(d), Number(hh), Number(mm), 0, 0);
  if (isNaN(dt.getTime())) return null;
  return dt.getTime();
}

export function toLocalInputString(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
