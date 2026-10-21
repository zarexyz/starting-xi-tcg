// =============================================================================
// Sprachen: t('schlüssel', { platzhalter }) liefert den Text in der aktiven Sprache.
// Fehlt ein Schlüssel im Englischen, wird Deutsch verwendet, fehlt er ganz,
// erscheint der Schlüssel selbst (fällt beim Testen sofort auf).
// =============================================================================

import { de } from './de.js';
import { en } from './en.js';

const DICTS = { de, en };
export const LANGS = [['de', 'Deutsch'], ['en', 'English']];

let lang = 'de';

export function setLang(l) {
  lang = DICTS[l] ? l : 'de';
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
}

export function getLang() {
  return lang;
}

/** Sprache aus dem Gerät ableiten: Deutsch für deutschsprachige Geräte, sonst Englisch */
export function deviceLang() {
  const n = (typeof navigator !== 'undefined' && navigator.language) || 'de';
  return n.toLowerCase().startsWith('de') ? 'de' : 'en';
}

function lookup(key) {
  return DICTS[lang][key] ?? de[key];
}

/**
 * Übersetzen. Mit params.n wird automatisch die Einzahl (_one) oder Mehrzahl (_other) gewählt.
 * Platzhalter: {name}
 */
export function t(key, params) {
  let s;
  // Platzhalter mit Endung K sind selbst Schlüssel: { posK: 'pos.ST' } → {pos}
  // Platzhalter mit Endung D sind Dezimalzahlen: { ratingD: 7.4 } → {rating} = „7,4“ bzw. „7.4“
  if (params) {
    let resolved = null;
    for (const k in params) {
      if (k.length > 1 && k.endsWith('K') && typeof params[k] === 'string') {
        resolved = resolved || { ...params };
        resolved[k.slice(0, -1)] = t(params[k]);
      } else if (k.length > 1 && k.endsWith('D') && typeof params[k] === 'number') {
        resolved = resolved || { ...params };
        resolved[k.slice(0, -1)] = fmtDec(params[k], 1);
      }
    }
    if (resolved) params = resolved;
  }
  if (params && typeof params.n === 'number') {
    s = lookup(`${key}_${params.n === 1 ? 'one' : 'other'}`);
  }
  if (s == null) s = lookup(key);
  if (s == null) return key;
  if (typeof s === 'function') return s(params || {});
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (m, k) => (params[k] != null ? (k === 'n' && typeof params[k] === 'number' ? fmtNum(params[k]) : params[k]) : m));
}

/** Gibt es den Schlüssel? */
export function has(key) {
  return lookup(key) != null;
}

export function fmtNum(n) {
  return Math.round(n).toLocaleString(lang === 'de' ? 'de-DE' : 'en-GB');
}

export function fmtDec(n, digits = 1) {
  return Number(n).toLocaleString(lang === 'de' ? 'de-DE' : 'en-GB', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** Objekt, dessen Einträge beim Lesen übersetzt werden: tmap('pos.')[code] */
export function tmap(prefix) {
  return new Proxy({}, {
    get: (_, k) => (typeof k === 'string' ? t(prefix + k) : undefined),
    has: (_, k) => has(prefix + String(k))
  });
}
