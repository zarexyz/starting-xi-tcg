// =============================================================================
// Mannschaftsidentität: Rückennummern, Kapitän und Vizekapitän, Charakterbild
// =============================================================================

import { clubPlayers } from './world.js';
import { addNews } from './game.js';

/** Klassische Nummern je Position, in Reihenfolge der Vergabe */
const NUMBER_PREF = {
  TW: [1, 12, 13, 22, 25],
  RV: [2, 22, 16, 26], LV: [3, 23, 17, 27],
  IV: [4, 5, 15, 24, 28, 6],
  ZDM: [6, 14, 18, 8],
  ZM: [8, 14, 16, 20, 18],
  ZOM: [10, 21, 20, 8],
  RM: [7, 17, 19, 27],
  LM: [11, 19, 18, 77],
  RF: [7, 17, 25, 27],
  LF: [11, 21, 30, 19],
  ST: [9, 19, 29, 99, 18]
};

export const MAX_NUMBER = 99;

/** Wie gut passt ein Spieler als Kapitän: Kopf, Erfahrung, Klasse */
export function captainScore(p) {
  const age = Math.min(p.age, 33);
  return (p.attrs?.men ?? 50) * 0.55 + p.ovr * 0.3 + Math.max(0, age - 22) * 1.2;
}

/** Nächste freie Nummer für eine Position */
export function freeNumber(position, taken) {
  for (const n of NUMBER_PREF[position] || []) if (!taken.has(n)) return n;
  for (let n = 2; n <= MAX_NUMBER; n++) if (!taken.has(n)) return n;
  return null;
}

/** Wer trägt welche Nummer im eigenen Kader */
export function numberMap(state) {
  const map = {};
  for (const p of clubPlayers(state, 'user')) if (p.number) map[p.number] = p.id;
  return map;
}

/**
 * Stellt sicher, dass jeder Spieler eine eigene Nummer hat und Kapitän und Vize
 * im Kader stehen. Verlässt der Kapitän den Verein, rückt der Vize auf.
 */
export function ensureIdentity(state) {
  const squad = clubPlayers(state, 'user');
  if (!squad.length) return;
  const taken = new Set();
  // Bestehende Nummern behalten (Dienstältere zuerst), Doppelte neu vergeben
  const sorted = [...squad].sort((a, b) => (b.careerStats?.apps || 0) - (a.careerStats?.apps || 0) || b.ovr - a.ovr);
  for (const p of sorted) {
    if (p.number && !taken.has(p.number)) taken.add(p.number);
    else p.number = null;
  }
  for (const p of sorted) {
    if (!p.number) {
      p.number = freeNumber(p.position, taken);
      if (p.number) taken.add(p.number);
    }
  }

  const u = state.user;
  const ids = new Set(squad.map(p => p.id));
  const hadCaptain = !!u.captain;
  const lostCaptain = hadCaptain && !ids.has(u.captain);
  if (u.captain && !ids.has(u.captain)) u.captain = null;
  if (u.vice && !ids.has(u.vice)) u.vice = null;
  if (!u.captain && u.vice) { u.captain = u.vice; u.vice = null; }
  const ranked = [...squad].sort((a, b) => captainScore(b) - captainScore(a));
  if (!u.captain) u.captain = ranked[0].id;
  if (!u.vice || u.vice === u.captain) u.vice = (ranked.find(p => p.id !== u.captain) || {}).id || null;
  if (lostCaptain && state.players[u.captain]) {
    const p = state.players[u.captain];
    addNews(state, 'squad', 'news.captainNew', { name: `${p.first[0]}. ${p.last}` }, { playerId: p.id });
  }
}

/** Binde nach dem Spielerwechsel; Hilfsfunktion für die Oberfläche: 'C', 'V' oder null */
export function armband(state, id) {
  if (state.user.captain === id) return 'C';
  if (state.user.vice === id) return 'V';
  return null;
}

/** Nummer ändern; ist sie vergeben, tauschen beide */
export function setNumber(state, playerId, number) {
  const p = state.players[playerId];
  const n = Math.round(Number(number));
  if (!p || p.clubId !== 'user' || !(n >= 1 && n <= MAX_NUMBER)) return { ok: false };
  const holder = clubPlayers(state, 'user').find(x => x.id !== playerId && x.number === n);
  if (holder) holder.number = p.number;
  p.number = n;
  return { ok: true };
}

/** Kapitän oder Vize setzen; wer die jeweils andere Binde trägt, übernimmt die abgegebene */
export function setArmband(state, playerId, role) {
  const p = state.players[playerId];
  const u = state.user;
  if (!p || p.clubId !== 'user') return { ok: false };
  if (role === 'C') {
    if (u.vice === playerId) u.vice = u.captain;
    u.captain = playerId;
  } else {
    if (u.captain === playerId) u.captain = u.vice;
    u.vice = playerId;
  }
  ensureIdentity(state);
  return { ok: true };
}

/** Kurzcharakter eines Spielers als Textschlüssel: { key, params } */
export function characterOf(p) {
  const a = p.attrs || {};
  if (p.age <= 20 && (p.potential || p.ovr) - p.ovr >= 8) return { key: 'ch.talent', params: { age: p.age } };
  if (p.age >= 32) return { key: 'ch.veteran', params: { age: p.age } };
  if (p.tier === 'icon') return { key: 'ch.icon', params: {} };
  const gk = p.position === 'TW';
  const keys = gk ? ['tor', 'men', 'pas', 'phy'] : ['tem', 'sch', 'pas', 'dri', 'abw', 'phy', 'men'];
  let best = keys[0];
  for (const k of keys) if ((a[k] ?? 0) > (a[best] ?? 0)) best = k;
  return { key: gk && best !== 'tor' ? `ch.gk${best}` : `ch.${best}`, params: {} };
}
