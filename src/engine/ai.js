// =============================================================================
// Aufstellungs-Logik (für KI-Vereine und den „Auto-Aufstellung“-Knopf)
// =============================================================================

import { FORMATIONS, STYLE_KEYS, STYLES } from './constants.js';
import { effectiveRating } from './player.js';
import { clubPlayers } from './world.js';

/** Reihenfolge, in der Slots besetzt werden: Spezialisten zuerst */
const SLOT_PRIORITY = { TW: 0, ST: 1, IV: 2, ZDM: 3, LV: 4, RV: 4, ZOM: 5, ZM: 6, LF: 7, RF: 7, LM: 8, RM: 8 };

export function isAvailable(p) {
  return p && !p.injury;
}

/**
 * Beste Elf für eine Formation (gierig, aber mit Blick auf Spezialisten).
 * Müde Spieler verlieren über effectiveRating automatisch an Wert → natürliche Rotation.
 */
export function bestLineup(state, clubId, formationKey, opts = {}) {
  const formation = FORMATIONS[formationKey] || FORMATIONS['4-3-3'];
  const pool = clubPlayers(state, clubId).filter(isAvailable);
  const used = new Set();
  const lineup = {};
  const slots = [...formation.slots].sort((a, b) => SLOT_PRIORITY[a.pos] - SLOT_PRIORITY[b.pos]);
  const minCondition = opts.minCondition ?? 0;

  for (const slot of slots) {
    let best = null;
    let bestScore = -Infinity;
    for (const p of pool) {
      if (used.has(p.id)) continue;
      let score = effectiveRating(p, slot.pos);
      if (p.condition < minCondition) score -= 6;
      // Leichte Strafe, wenn der Spieler woanders deutlich wertvoller wäre
      if (slot.pos !== 'TW' && p.position === 'TW') score -= 50;
      if (score > bestScore) { bestScore = score; best = p; }
    }
    if (best) {
      lineup[slot.id] = best.id;
      used.add(best.id);
    }
  }

  const bench = pool
    .filter(p => !used.has(p.id))
    .sort((a, b) => b.ovr - a.ovr)
    .slice(0, 7)
    .map(p => p.id);

  return { lineup, bench };
}

/** Füllt Lücken (verletzt, verkauft) in einer bestehenden Aufstellung auf */
export function repairLineup(state, clubId, setup) {
  const formation = FORMATIONS[setup.formation] || FORMATIONS['4-3-3'];
  const club = state.clubs[clubId];
  const owned = new Set(club.playerIds);
  const lineup = {};
  const used = new Set();
  for (const slot of formation.slots) {
    const pid = setup.lineup?.[slot.id];
    const p = state.players[pid];
    if (pid && owned.has(pid) && isAvailable(p) && !used.has(pid)) {
      lineup[slot.id] = pid;
      used.add(pid);
    }
  }
  const pool = clubPlayers(state, clubId).filter(p => isAvailable(p) && !used.has(p.id));
  for (const slot of formation.slots) {
    if (lineup[slot.id]) continue;
    pool.sort((a, b) => effectiveRating(b, slot.pos) - effectiveRating(a, slot.pos));
    const p = pool.shift();
    if (p) { lineup[slot.id] = p.id; used.add(p.id); }
  }
  const bench = (setup.bench || []).filter(id => owned.has(id) && !used.has(id) && isAvailable(state.players[id]));
  const extra = clubPlayers(state, clubId)
    .filter(p => isAvailable(p) && !used.has(p.id) && !bench.includes(p.id))
    .sort((a, b) => b.ovr - a.ovr);
  while (bench.length < 7 && extra.length) bench.push(extra.shift().id);
  return { ...setup, lineup, bench: bench.slice(0, 7) };
}

/** Komplette Spielvorbereitung eines KI-Vereins */
export function aiSetup(rng, state, clubId) {
  const club = state.clubs[clubId];
  const formation = club.preferredFormation;
  // Trainer-Philosophie: in etwa 85 % der Spiele sein Stil
  const style = rng.chance(0.85) ? club.preferredStyle : rng.pick(STYLE_KEYS.filter(k => k !== club.preferredStyle));
  const { lineup, bench } = bestLineup(state, clubId, formation, { minCondition: 70 });
  return { formation, style, lineup, bench, boosts: {} };
}

/** Wie der Gegner meistens spielt – sichtbar in der Spielvorbereitung */
export function scoutReport(state, clubId) {
  const club = state.clubs[clubId];
  return {
    formation: club.preferredFormation,
    style: club.preferredStyle,
    styleName: STYLES[club.preferredStyle].name,
    reliability: 85
  };
}
