// =============================================================================
// Verträge: festes Gehalt mit Laufzeit. Das Gehalt steigt NICHT automatisch mit
// der Stärke, sondern erst bei einer Verlängerung. Unterbezahlte Leistungsträger
// melden sich mit Vorwarnung, auslaufende Verträge enden zum Saisonende.
// =============================================================================

import { addTask } from './tasks.js';
import { salaryFor, displayName, shortName } from './player.js';
import { clubPlayers, LEAGUE_INFO } from './world.js';
import { POSITION_GROUP, MIN_SQUAD, AI_SQUAD_SIZE, MATCHDAYS } from './constants.js';
import { addNews } from './game.js';
import { t } from '../i18n/index.js';

/** Fester Zufall aus einer Id (für Migration und KI-Verträge) */
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Übliche Laufzeit nach Alter */
export function defaultYears(age) {
  if (age <= 26) return 3;
  if (age <= 30) return 2;
  return 1;
}

/** Längste mögliche Laufzeit nach Alter */
export function maxYears(age) {
  if (age >= 33) return 1;
  if (age >= 31) return 2;
  return 4;
}

/** Gehalt pro Spieltag laut Vertrag (Fallback: Marktgehalt) */
export function wageOf(p) {
  return p.contract?.wage ?? salaryFor(p.ovr);
}

/** Vertrag anlegen, falls er fehlt (alte Spielstände, KI-Spieler) */
export function ensureContract(state, p) {
  if (p.contract) return p.contract;
  const years = 1 + (hash(p.id) % 3);
  p.contract = { wage: salaryFor(p.ovr), until: state.season + years - 1 };
  return p.contract;
}

export function ensureAllContracts(state) {
  for (const p of Object.values(state.players)) ensureContract(state, p);
}

/** Neuer Vertrag ab dieser Saison (Laufzeit in Saisons, inklusive der laufenden) */
export function signContract(state, p, wage, years) {
  p.contract = { wage: Math.round(wage), until: state.season + years - 1 };
  p.wantsRaise = false;
  return p.contract;
}

/** Restlaufzeit in Saisons (1 = endet mit dieser Saison) */
export function yearsLeft(state, p) {
  return (ensureContract(state, p).until - state.season) + 1;
}

function formAvg(p) {
  return p.form?.length ? p.form.reduce((s, x) => s + x, 0) / p.form.length : 6.5;
}

/** Gehaltsforderung pro Spieltag für einen neuen Vertrag */
export function contractDemand(state, p) {
  let f = 1;
  const fa = formAvg(p);
  if (fa >= 7.2) f *= 1.12; else if (fa >= 6.9) f *= 1.06;
  if (p.morale < 40) f *= 1.2; else if (p.morale < 55) f *= 1.08;
  if (p.age <= 23 && p.potential - p.ovr >= 6) f *= 1.06;
  if (p.age >= 32) f *= 0.9;
  return Math.max(4, Math.round(salaryFor(p.ovr) * f));
}

/** Forderung für eine bestimmte Laufzeit: längere Verträge kosten etwas mehr */
export function demandFor(state, p, years) {
  return Math.round(contractDemand(state, p) * [1, 1.03, 1.06, 1.1][years - 1] * (p.contractDiscount || 1));
}

/** Vertrag des eigenen Spielers verlängern */
export function extendContract(state, playerId, years) {
  const p = state.players[playerId];
  if (!p || p.clubId !== 'user') return { error: t('err.notAvailable') };
  const y = Math.max(1, Math.min(maxYears(p.age), Number(years) || 1));
  const wage = demandFor(state, p, y);
  // Verlängerung: y weitere Saisons nach der laufenden
  p.contract = { wage, until: state.season + y };
  p.wantsRaise = false;
  delete p.contractDiscount;
  p.morale = Math.min(100, p.morale + 6);
  return { ok: true, wage, until: p.contract.until };
}

/**
 * Nach einer Aufwertung: Wer deutlich unter Marktwert verdient, meldet sich.
 * Keine automatische Erhöhung mehr.
 */
export function checkRaiseWishes(state) {
  const wishes = [];
  for (const p of clubPlayers(state, 'user')) {
    const c = ensureContract(state, p);
    const market = salaryFor(p.ovr);
    if (!p.wantsRaise && market >= c.wage * 1.3 && market - c.wage >= 3) {
      p.wantsRaise = true;
      p.raiseSince = state.dayIndex;
      wishes.push(p);
    }
  }
  if (wishes.length) {
    addNews(state, 'contract', 'news.raise', { list: wishes.map(p => shortName(p)).join(', '), n: wishes.length },
      { playerId: wishes[0].id, playerIds: wishes.map(p => p.id) });
  }
  return wishes;
}

/** Nach jedem Spieltag: Unzufriedenheit unterbezahlter Spieler, sanft */
export function contractMood(state) {
  for (const p of clubPlayers(state, 'user')) {
    if (p.wantsRaise && state.dayIndex - (p.raiseSince ?? state.dayIndex) >= 3) {
      p.morale = Math.max(45, p.morale - 2);
    }
  }
}

/** Spieltag 12: Hinweis auf auslaufende Verträge */
export function expiryWarning(state) {
  const list = clubPlayers(state, 'user').filter(p => ensureContract(state, p).until <= state.season);
  if (!list.length) return;
  const md = (state.calendar.slice(0, state.dayIndex).filter(d => d.type === 'league').length);
  addTask(state, 'contracts', 'news.expiring', { list: list.map(p => shortName(p)).join(', '), n: list.length },
    { blocking: false, ref: `${state.season}:${md}`, season: state.season, ids: list.map(p => p.id), cta: { label: 'task.cta.squad', go: 'squad', filter: 'contract' } },
    { newsType: 'contract', playerId: list[0].id, playerIds: list.map(p => p.id) });
}

/**
 * Saisonende: Auslaufende Verträge enden. Eigene Spieler wechseln ablösefrei zu
 * einem passenden KI-Verein, KI-Spieler verlängern einfach.
 */
export function expireContracts(rng, state) {
  const gone = [];
  const user = state.clubs.user;
  const expiring = clubPlayers(state, 'user').filter(p => ensureContract(state, p).until <= state.season)
    .sort((a, b) => b.ovr - a.ovr);
  for (const p of expiring) {
    if (user.playerIds.length <= MIN_SQUAD) {
      // Kader zu klein: Der Spieler bleibt für eine Saison zu seinen Bedingungen
      p.contract = { wage: contractDemand(state, p), until: state.season + 1 };
      p.wantsRaise = false;
      addNews(state, 'contract', 'news.autoExtend', { name: displayName(p), short: shortName(p) }, { playerId: p.id });
      continue;
    }
    const fits = Object.values(state.clubs).filter(c => !c.isUser && Math.abs(LEAGUE_INFO[c.tier].baseOvr + 1 - p.ovr) <= 6);
    const target = fits.length ? rng.pick(fits) : rng.pick(Object.values(state.clubs).filter(c => !c.isUser));
    user.playerIds = user.playerIds.filter(id => id !== p.id);
    p.clubId = target.id;
    target.playerIds.push(p.id);
    p.contract = { wage: salaryFor(p.ovr), until: state.season + rng.int(1, 3) };
    // Der aufnehmende Verein gibt seinen schwächsten Spieler dieser Gruppe ab
    const group = POSITION_GROUP[p.position];
    const weakest = clubPlayers(state, target.id).filter(x => x.id !== p.id && POSITION_GROUP[x.position] === group).sort((a, b) => a.ovr - b.ovr)[0];
    if (weakest && target.playerIds.length > AI_SQUAD_SIZE) {
      target.playerIds = target.playerIds.filter(id => id !== weakest.id);
      delete state.players[weakest.id];
    }
    gone.push({ id: p.id, name: displayName(p), clubId: target.id });
    addNews(state, 'contract', 'news.leftFree', { name: displayName(p), short: shortName(p), club: target.name }, { playerId: p.id, clubId: target.id });
  }
  for (const p of Object.values(state.players)) {
    if (p.clubId === 'user' || p.academy) continue;
    const c = ensureContract(state, p);
    if (c.until <= state.season) p.contract = { wage: salaryFor(p.ovr), until: state.season + rng.int(1, 3) };
  }
  return gone;
}

/** Abfindung bei Entlassung: die Hälfte der restlichen Vertragsgehälter */
export function severance(state, p) {
  const c = ensureContract(state, p);
  const playedThis = state.calendar.slice(0, state.dayIndex).filter(d => d.type === 'league').length;
  const remaining = Math.max(0, MATCHDAYS - playedThis) + MATCHDAYS * Math.max(0, c.until - state.season);
  return Math.round((c.wage * remaining * 0.5) / 10) * 10;
}
