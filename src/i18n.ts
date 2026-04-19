export type Lang = 'hr' | 'en' | 'de';

const LANG_KEY = 'bimep.lang';

const DICT = {
  hr: {
    'app.title': 'BIMEP',
    'app.progress': '{done} / {total} posjećeno',
    'actions.checkin': 'Prijavi se ovdje',
    'actions.reset': 'Poništi sve',
    'actions.navigate': 'Navigiraj',
    'actions.mark': 'Označi posjećenim',
    'actions.unmark': 'Skini oznaku',
    'actions.edit_time': 'Uredi vrijeme',
    'actions.login_google': 'Prijava putem Googlea',
    'actions.login_apple': 'Prijava putem Applea',
    'actions.logout': 'Odjava',
    'sheet.description': 'Opis',
    'sheet.visited_at': 'Posjećeno u',
    'sheet.source.auto': 'automatski',
    'sheet.source.manual': 'ručno',
    'sheet.neighbours': 'Povezane točke',
    'sheet.next_suggestion': 'Sljedeća preporuka: {name} ({km} km)',
    'sheet.all_neighbours_visited': 'Sve susjedne točke su posjećene.',
    'status.marked': 'Označeno: {names}',
    'status.already_marked': 'Već označeni u blizini',
    'status.not_near_any': 'Nije u blizini ni jednog punkta',
    'status.location_denied': 'Lokacija odbijena',
    'status.location_error': 'Ne mogu dohvatiti lokaciju',
    'status.cleared': 'Obrisano',
    'status.merged': 'Spojeno: {added} dodano, {skipped} već postojalo',
    'confirm.reset': 'Sigurno želiš obrisati sve posjete za {year}?',
    'list.visited_badge': 'Posjećeno',
    'list.road_km': '{km} km cestom',
    'list.aerial_km': '{km} km zračno',
    'history.title': 'Povijest',
    'history.total_time': 'Ukupno vrijeme',
    'history.legs': 'Međudionice',
    'history.no_visits': 'Nema zabilježenih posjeta za {year}.',
    'history.read_only': 'Arhivska godina (samo pregled).',
    'year.current': 'Aktualna godina',
    'lang.name': 'Jezik',
    'login.title': 'Prijava',
    'login.blurb': 'Prijavom čuvaš posjete na svim uređajima i vidiš povijest iz prijašnjih godina.',
    'login.as': 'Prijavljen kao {name}',
    'login.button': 'Prijava',
    'login.not_configured': 'Prijava još nije konfigurirana na ovom serveru.',
    'login.guest_note': 'Posjete se čuvaju lokalno. Prijavom se čuvaju na svim uređajima.',
    'time.edit_prompt': 'Novo vrijeme (YYYY-MM-DD HH:MM):',
    'time.invalid': 'Neispravan format vremena.',
    'nav.hint': 'Otvara se vanjska aplikacija za navigaciju (Google / Apple Maps)',
    'plan.button': 'Planiraj rutu',
    'plan.title': 'Planiraj rutu',
    'plan.select_points': 'Odaberi točke',
    'plan.all': 'Sve',
    'plan.unvisited': 'Neposjećene',
    'plan.none': 'Nijedna',
    'plan.closed': 'Kružna ruta (povratak na start)',
    'plan.start_from': 'Start iz',
    'plan.start_optimal': 'Optimalno (bilo koja točka)',
    'plan.start_current': 'Moja lokacija',
    'plan.calculate': 'Izračunaj',
    'plan.fetching': 'Dohvaćam matricu udaljenosti…',
    'plan.need_two': 'Odaberi barem 2 točke.',
    'plan.error': 'Greška pri izračunu rute.',
    'plan.total': 'Ukupno: {km} km (~ {time} pri {speed} km/h)',
    'plan.clear': 'Očisti plan',
    'plan.step_leg': '{km} km do sljedeće',
    'plan.back_to_edit': 'Promijeni odabir',
  },
  en: {
    'app.title': 'BIMEP',
    'app.progress': '{done} / {total} visited',
    'actions.checkin': 'Check in here',
    'actions.reset': 'Reset all',
    'actions.navigate': 'Navigate',
    'actions.mark': 'Mark as visited',
    'actions.unmark': 'Unmark',
    'actions.edit_time': 'Edit time',
    'actions.login_google': 'Sign in with Google',
    'actions.login_apple': 'Sign in with Apple',
    'actions.logout': 'Sign out',
    'sheet.description': 'Description',
    'sheet.visited_at': 'Visited at',
    'sheet.source.auto': 'auto',
    'sheet.source.manual': 'manual',
    'sheet.neighbours': 'Connected points',
    'sheet.next_suggestion': 'Next suggestion: {name} ({km} km)',
    'sheet.all_neighbours_visited': 'All neighbours visited.',
    'status.marked': 'Marked: {names}',
    'status.already_marked': 'Nearby points already marked',
    'status.not_near_any': 'Not near any BIMEP point',
    'status.location_denied': 'Location denied',
    'status.location_error': 'Could not get location',
    'status.cleared': 'Cleared',
    'status.merged': 'Merged: {added} added, {skipped} already existed',
    'confirm.reset': 'Delete all visits for {year}?',
    'list.visited_badge': 'Visited',
    'list.road_km': '{km} km by road',
    'list.aerial_km': '{km} km direct',
    'history.title': 'History',
    'history.total_time': 'Total time',
    'history.legs': 'Leg times',
    'history.no_visits': 'No visits recorded for {year}.',
    'history.read_only': 'Archive year (read-only).',
    'year.current': 'Current year',
    'lang.name': 'Language',
    'login.title': 'Sign in',
    'login.blurb': 'Signing in syncs your visits across devices and unlocks history from past years.',
    'login.as': 'Signed in as {name}',
    'login.button': 'Sign in',
    'login.not_configured': 'Sign-in is not configured on this server yet.',
    'login.guest_note': 'Visits are stored locally. Sign in to sync across devices.',
    'time.edit_prompt': 'New time (YYYY-MM-DD HH:MM):',
    'time.invalid': 'Invalid time format.',
    'nav.hint': 'Opens an external navigation app (Google / Apple Maps)',
    'plan.button': 'Plan route',
    'plan.title': 'Plan route',
    'plan.select_points': 'Select points',
    'plan.all': 'All',
    'plan.unvisited': 'Unvisited',
    'plan.none': 'None',
    'plan.closed': 'Return to start (loop)',
    'plan.start_from': 'Start from',
    'plan.start_optimal': 'Optimal (any point)',
    'plan.start_current': 'My location',
    'plan.calculate': 'Calculate',
    'plan.fetching': 'Fetching distance matrix…',
    'plan.need_two': 'Select at least 2 points.',
    'plan.error': 'Route calculation failed.',
    'plan.total': 'Total: {km} km (~ {time} at {speed} km/h)',
    'plan.clear': 'Clear plan',
    'plan.step_leg': '{km} km to next',
    'plan.back_to_edit': 'Change selection',
  },
  de: {
    'app.title': 'BIMEP',
    'app.progress': '{done} / {total} besucht',
    'actions.checkin': 'Hier einchecken',
    'actions.reset': 'Alle zurücksetzen',
    'actions.navigate': 'Navigieren',
    'actions.mark': 'Als besucht markieren',
    'actions.unmark': 'Markierung entfernen',
    'actions.edit_time': 'Zeit bearbeiten',
    'actions.login_google': 'Mit Google anmelden',
    'actions.login_apple': 'Mit Apple anmelden',
    'actions.logout': 'Abmelden',
    'sheet.description': 'Beschreibung',
    'sheet.visited_at': 'Besucht um',
    'sheet.source.auto': 'automatisch',
    'sheet.source.manual': 'manuell',
    'sheet.neighbours': 'Verbundene Punkte',
    'sheet.next_suggestion': 'Nächste Empfehlung: {name} ({km} km)',
    'sheet.all_neighbours_visited': 'Alle Nachbarn wurden besucht.',
    'status.marked': 'Markiert: {names}',
    'status.already_marked': 'Punkte in der Nähe bereits markiert',
    'status.not_near_any': 'Kein BIMEP-Punkt in der Nähe',
    'status.location_denied': 'Standortfreigabe verweigert',
    'status.location_error': 'Standort konnte nicht ermittelt werden',
    'status.cleared': 'Gelöscht',
    'status.merged': 'Zusammengeführt: {added} hinzugefügt, {skipped} bereits vorhanden',
    'confirm.reset': 'Alle Besuche für {year} löschen?',
    'list.visited_badge': 'Besucht',
    'list.road_km': '{km} km über Straße',
    'list.aerial_km': '{km} km Luftlinie',
    'history.title': 'Verlauf',
    'history.total_time': 'Gesamtzeit',
    'history.legs': 'Etappenzeiten',
    'history.no_visits': 'Keine Besuche für {year} aufgezeichnet.',
    'history.read_only': 'Archivjahr (schreibgeschützt).',
    'year.current': 'Aktuelles Jahr',
    'lang.name': 'Sprache',
    'login.title': 'Anmelden',
    'login.blurb': 'Durch die Anmeldung werden Besuche geräteübergreifend gespeichert und der Verlauf aus Vorjahren freigeschaltet.',
    'login.as': 'Angemeldet als {name}',
    'login.button': 'Anmelden',
    'login.not_configured': 'Anmeldung ist auf diesem Server noch nicht konfiguriert.',
    'login.guest_note': 'Besuche werden lokal gespeichert. Mit Anmeldung geräteübergreifend synchronisiert.',
    'time.edit_prompt': 'Neue Zeit (JJJJ-MM-TT HH:MM):',
    'time.invalid': 'Ungültiges Zeitformat.',
    'nav.hint': 'Öffnet eine externe Navigations-App (Google / Apple Maps)',
    'plan.button': 'Route planen',
    'plan.title': 'Route planen',
    'plan.select_points': 'Punkte auswählen',
    'plan.all': 'Alle',
    'plan.unvisited': 'Unbesucht',
    'plan.none': 'Keine',
    'plan.closed': 'Rundkurs (zurück zum Start)',
    'plan.start_from': 'Start ab',
    'plan.start_optimal': 'Optimal (beliebig)',
    'plan.start_current': 'Mein Standort',
    'plan.calculate': 'Berechnen',
    'plan.fetching': 'Lade Distanzmatrix…',
    'plan.need_two': 'Mindestens 2 Punkte auswählen.',
    'plan.error': 'Routenberechnung fehlgeschlagen.',
    'plan.total': 'Gesamt: {km} km (~ {time} bei {speed} km/h)',
    'plan.clear': 'Plan löschen',
    'plan.step_leg': '{km} km bis nächstem',
    'plan.back_to_edit': 'Auswahl ändern',
  },
} as const;

type DictKey = keyof typeof DICT.hr;

function detect(): Lang {
  const saved = localStorage.getItem(LANG_KEY);
  if (saved === 'hr' || saved === 'en' || saved === 'de') return saved;
  const nav = (navigator.language || 'hr').toLowerCase();
  if (nav.startsWith('de')) return 'de';
  if (nav.startsWith('en')) return 'en';
  return 'hr';
}

let current: Lang = detect();
const langListeners = new Set<() => void>();

export function getLang(): Lang {
  return current;
}

export function setLang(l: Lang) {
  if (l === current) return;
  current = l;
  localStorage.setItem(LANG_KEY, l);
  document.documentElement.lang = l;
  langListeners.forEach(fn => fn());
}

export function onLangChange(fn: () => void): () => void {
  langListeners.add(fn);
  return () => langListeners.delete(fn);
}

export function t(key: DictKey, vars: Record<string, string | number> = {}): string {
  const raw = DICT[current][key] ?? DICT.hr[key] ?? key;
  return raw.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

document.documentElement.lang = current;
