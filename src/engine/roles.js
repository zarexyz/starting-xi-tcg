// =============================================================================
// Kader-Rollen & Kabinen-Hierarchie (v1.13): Jeder eigene Spieler hat eine
// erwartete Rolle. Schlüsselspieler, die fit auf der Bank schmoren, werden
// unzufrieden; Perspektivspieler freuen sich über Einsätze. Die Rolle färbt
// auch die Gehaltsforderung bei der Vertragsverlängerung.
// Nur der eigene Verein ist betroffen – KI-Vereine bleiben unverändert.
// =============================================================================

import { clubPlayers } from './world.js';
import { addNews } from './game.js';
import { displayName, shortName } from './player.js';

export const ROLE_KEYS = ['star', 'regular', 'rotation', 'prospect'];
/** Ab dieser Kadergröße gibt es Schlüsselspieler */
export const ROLE_MIN_SQUAD = 15;
/** Wer darunter liegt, gilt nicht als einsatzfähig und schmort nicht */
export const BENCH_FIT = 75;
/** Ab so vielen Spielen draußen wird ein Schlüsselspieler unzufrieden */
export const BENCH_UNHAPPY = 3;
export const BENCH_MORALE = -5;
export const PROSPECT_MORALE = 2;
/** Vertrag: Rabatt bei erfüllter Rolle, Aufschlag bei Unmut */
export const ROLE_DISCOUNT = 0.95;
export const ROLE_SURCHARGE = 1.10;
/** Erfüllte Rolle = mindestens dieser Anteil der Saisonspiele, ab so vielen Spielen */
export const ROLE_USAGE = 0.6;
export const ROLE_USAGE_MIN_GAMES = 5;

/** Kader nach Stärke, bei Gleichstand stabil nach id */
function ranked(state) {
  return clubPlayers(state, 'user').slice().sort((a, b) => b.ovr - a.ovr || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/** Rollen aller eigenen Spieler auf einmal (id → Rolle) */
export function squadRoles(state) {
  const list = ranked(state);
  const big = list.length >= ROLE_MIN_SQUAD;
  const out = {};
  list.forEach((p, i) => {
    const rank = i + 1;
    if (big && rank <= 3) out[p.id] = 'star';
    else if (rank <= 11) out[p.id] = 'regular';
    else if (p.age <= 21) out[p.id] = 'prospect';
    else if (rank <= 16) out[p.id] = 'rotation';
    else out[p.id] = 'prospect';
  });
  return out;
}

/** Erwartete Rolle eines Spielers im eigenen Kader, sonst null */
export function squadRole(state, p) {
  if (!p || p.clubId !== 'user') return null;
  return squadRoles(state)[p.id] || null;
}

/** Erwartet diese Rolle Einsätze? */
export const expectsPlay = role => role === 'star' || role === 'regular';

/** Schmort der Spieler gerade sichtbar auf der Bank (für das Warn-Abzeichen)? */
export function benchWarning(state, p, role = squadRole(state, p)) {
  return expectsPlay(role) && (p.benchedStreak || 0) >= 2;
}

/**
 * Nach jedem Spiel des eigenen Vereins.
 * info.fit: ids, die vor dem Anpfiff einsatzfähig waren (Kondition ≥ 75, nicht verletzt, nicht gesperrt)
 * info.appeared: ids aus Startelf und allen Einwechslungen (auch zur Pause)
 */
export function updateBenchStreaks(state, info) {
  const fit = new Set(info.fit || []);
  const appeared = new Set(info.appeared || []);
  const roles = squadRoles(state);
  for (const p of clubPlayers(state, 'user')) {
    const role = roles[p.id];
    if (appeared.has(p.id)) {
      p.benchedStreak = 0;
      if (role === 'prospect') p.morale = Math.min(100, p.morale + PROSPECT_MORALE);
      continue;
    }
    // Verletzte, Gesperrte und Erschöpfte schmoren nicht
    if (!fit.has(p.id)) continue;
    p.benchedStreak = (p.benchedStreak || 0) + 1;
    if (role === 'star' && p.benchedStreak % BENCH_UNHAPPY === 0) {
      p.morale = Math.max(20, p.morale + BENCH_MORALE);
      // Er meldet sich nur einmal je Bank-Serie
      if (p.benchedStreak === BENCH_UNHAPPY) {
        addNews(state, 'squad', 'news.benchedStar', { short: shortName(p), name: displayName(p), n: p.benchedStreak }, { playerId: p.id });
      }
    }
  }
}

/** Neue Saison: alle Bank-Serien auf null */
export function resetBenchStreaks(state) {
  for (const p of Object.values(state.players)) if (p.benchedStreak) p.benchedStreak = 0;
}

/**
 * Faktor für die Gehaltsforderung des eigenen Spielers aus seiner Rolle:
 * 0,95 bei erfüllter Rolle, 1,10 bei Unmut, sonst 1. Gibt auch den Grund zurück.
 */
export function roleContractFactor(state, p) {
  if (!p || p.clubId !== 'user') return { f: 1, why: null };
  const role = squadRole(state, p);
  if (!expectsPlay(role)) return { f: 1, why: null };
  if ((p.benchedStreak || 0) >= BENCH_UNHAPPY) return { f: ROLE_SURCHARGE, why: 'benched' };
  const games = state.clubs.user?.seasonStats?.games || 0;
  if (games >= ROLE_USAGE_MIN_GAMES && !(p.benchedStreak > 0) && (p.stats?.apps || 0) / games >= ROLE_USAGE) {
    return { f: ROLE_DISCOUNT, why: 'fulfilled' };
  }
  return { f: 1, why: null };
}
