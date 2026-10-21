import { tmap } from '../i18n/index.js';
// =============================================================================
// Spielplan: Liga (Hin- und Rückrunde), Saisonkalender, Pokal, Final Four, Tabelle
// =============================================================================

import { MATCHDAYS } from './constants.js';

/** Doppelrunde nach Kreismethode: 10 Teams → 18 Spieltage à 5 Spiele */
export function roundRobin(rng, clubIds) {
  const teams = rng.shuffle(clubIds);
  const n = teams.length;
  const half = n / 2;
  const rounds = [];
  const rot = teams.slice(1);
  for (let r = 0; r < n - 1; r++) {
    const order = [teams[0], ...rot];
    const matches = [];
    for (let i = 0; i < half; i++) {
      const a = order[i];
      const b = order[n - 1 - i];
      const swap = (r + i) % 2 === 1;
      matches.push(swap ? { home: b, away: a } : { home: a, away: b });
    }
    rounds.push(matches);
    rot.unshift(rot.pop());
  }
  const second = rounds.map(ms => ms.map(m => ({ home: m.away, away: m.home })));
  return [...rounds, ...second];
}

/**
 * Saisonkalender. Jeder Eintrag ist ein Spieltag, an dem der Spieler höchstens ein Spiel hat.
 */
export function buildCalendar() {
  const days = [];
  const cupAfter = { 3: 1, 6: 2, 9: 3, 12: 4, 15: 5 };
  for (let md = 1; md <= MATCHDAYS; md++) {
    days.push({ type: 'league', md });
    if (cupAfter[md]) days.push({ type: 'cup', round: cupAfter[md] });
  }
  days.push({ type: 'ff_semi' });
  days.push({ type: 'cup', round: 6 });
  days.push({ type: 'ff_final' });
  return days;
}

export const CUP_ROUND_NAMES = tmap('cup.');

/**
 * Pokal-Auslosung. Runde 1: 4 Freilose für die besten Erstligisten, 56 Teams spielen.
 * Der klassentiefere Verein hat Heimrecht.
 */
export function drawCupRound(rng, state, clubIds) {
  const shuffled = rng.shuffle(clubIds);
  const matches = [];
  for (let i = 0; i + 1 < shuffled.length; i += 2) {
    const a = shuffled[i];
    const b = shuffled[i + 1];
    const ta = state.clubs[a].tier;
    const tb = state.clubs[b].tier;
    // höhere Zahl = tiefere Liga = Heimrecht
    matches.push(ta >= tb ? { home: a, away: b } : { home: b, away: a });
  }
  return matches;
}

export function createCup(rng, state, byeIds) {
  const all = Object.keys(state.clubs);
  const playing = all.filter(id => !byeIds.includes(id));
  return {
    round: 1,
    byes: byeIds,
    rounds: { 1: drawCupRound(rng, state, playing) },
    winner: null
  };
}

export function matchWinner(m) {
  if (m.hg == null) return null;
  if (m.hg > m.ag) return m.home;
  if (m.ag > m.hg) return m.away;
  if (m.pens) return m.pens.h > m.pens.a ? m.home : m.away;
  return null;
}

export function matchLoser(m) {
  const w = matchWinner(m);
  if (!w) return null;
  return w === m.home ? m.away : m.home;
}

// -----------------------------------------------------------------------------
// Tabelle
// -----------------------------------------------------------------------------

export function computeTable(state, tier, uptoMd = Infinity) {
  const league = state.leagues[tier];
  const rows = {};
  for (const id of league.clubIds) {
    rows[id] = { clubId: id, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, form: [] };
  }
  for (const [ri, round] of league.fixtures.entries()) {
    if (ri >= uptoMd) break;
    for (const m of round) {
      if (m.hg == null) continue;
      const h = rows[m.home];
      const a = rows[m.away];
      if (!h || !a) continue;
      h.p++; a.p++;
      h.gf += m.hg; h.ga += m.ag;
      a.gf += m.ag; a.ga += m.hg;
      if (m.hg > m.ag) {
        h.w++; a.l++; h.pts += 3; h.form.push('S'); a.form.push('N');
      } else if (m.hg < m.ag) {
        a.w++; h.l++; a.pts += 3; a.form.push('S'); h.form.push('N');
      } else {
        h.d++; a.d++; h.pts++; a.pts++; h.form.push('U'); a.form.push('U');
      }
    }
  }
  const list = Object.values(rows);
  list.forEach(r => { r.form = r.form.slice(-5); r.gd = r.gf - r.ga; });
  list.sort((x, y) =>
    y.pts - x.pts || y.gd - x.gd || y.gf - x.gf ||
    state.clubs[x.clubId].name.localeCompare(state.clubs[y.clubId].name));
  list.forEach((r, i) => { r.pos = i + 1; });
  return list;
}

/** Final Four aus der Tabelle: 1 gegen 4, 2 gegen 3 (besser Platzierter hat Heimrecht) */
export function createFinalFour(state, tier) {
  const table = computeTable(state, tier);
  const [a, b, c, d] = table.slice(0, 4).map(r => r.clubId);
  return {
    tier,
    seeds: [a, b, c, d],
    semis: [{ home: a, away: d }, { home: b, away: c }],
    final: null,
    champion: null,
    promoted: []
  };
}
