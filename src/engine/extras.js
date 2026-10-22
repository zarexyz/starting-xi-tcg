// =============================================================================
// v1.10: Wetter, Scouting-Karte, Pressekonferenz
// =============================================================================

import { createRng } from './rng.js';
import { clubPlayers, clubStrength, rivalry } from './world.js';

export const WEATHERS = ['CLEAR', 'RAIN', 'WIND', 'HOT'];

/** Wetter ist für alle Spiele eines Spieltags gleich und aus dem Spielstand ableitbar */
export function weatherFor(seed, dayIndex) {
  const r = createRng(((seed * 31 + dayIndex * 977) >>> 0) || 1).float(0, 1);
  return r < 0.5 ? 'CLEAR' : r < 0.72 ? 'RAIN' : r < 0.86 ? 'WIND' : 'HOT';
}

const WEATHER_MID = {
  RAIN: { BALLBESITZ: -2, FLUEGEL: -1, DIREKT: 1, KONTER: 1 },
  WIND: { DIREKT: -2, FLUEGEL: -1, MAUERN: 1, HOCHLINIE: -1 },
  HOT: { PRESSING: -2, HOCHLINIE: -1, MAUERN: 1 }
};
export const weatherMid = (style, weather) => WEATHER_MID[weather]?.[style] || 0;

// Pressekonferenz --------------------------------------------------------------
export const INTERVIEW_KEYS = ['BOLD', 'CALM', 'FANS'];

export function interviewAvailable(state, entry) {
  if (!entry) return false;
  const opp = entry.m.home === 'user' ? entry.m.away : entry.m.home;
  return entry.comp !== 'league' ||
    rivalry(state.clubs.user, state.clubs[opp]) === 'derby' ||
    clubStrength(state, opp) >= clubStrength(state, 'user') + 3;
}

export function setInterview(state, key) {
  if (!INTERVIEW_KEYS.includes(key)) return { ok: false, code: 'bad' };
  if (state.user.interview) return { ok: false, code: 'done' };
  state.user.interview = { key, day: state.dayIndex };
  const squad = clubPlayers(state, 'user');
  if (key === 'BOLD') squad.forEach(p => { p.morale = Math.min(100, p.morale + 4); });
  if (key === 'FANS' && state.user.mood) state.user.mood.fans = Math.min(100, state.user.mood.fans + 2);
  return { ok: true };
}

/** Nach dem Spiel: Wirkung der Aussagen. Gibt einen Nachrichtenschlüssel zurück. */
export function resolveInterview(state, outcome) {
  const iv = state.user.interview;
  if (!iv) return null;
  state.user.interview = null;
  const m = state.user.mood;
  const squad = clubPlayers(state, 'user');
  const c = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
  if (iv.key === 'BOLD') {
    if (outcome === 'W') m.fans = c(m.fans + 3);
    else if (outcome === 'L') { m.fans = c(m.fans - 3); m.board = c(m.board - 2); }
  } else if (iv.key === 'CALM') {
    if (outcome === 'W') m.board = c(m.board + 1);
  } else if (iv.key === 'FANS') {
    if (outcome === 'W') squad.forEach(p => { p.morale = Math.min(100, p.morale + 3); });
  }
  return `news.iv.${iv.key}.${outcome}`;
}
