// =============================================================================
// Spielstände aus älteren Versionen umrechnen
// v1 → v2: acht Werte (Mental und Torwart neu), Trainer, Noten pro Halbserie
// =============================================================================

import { createRng, clamp } from './rng.js';
import { calcOvr, normalizeTo } from './player.js';
import { newCoach } from './world.js';
import { MATCHDAYS } from './constants.js';
import { ensureAllContracts } from './contracts.js';

/** Fester Zufall aus einer Id, damit die Umrechnung immer gleich ausfällt */
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function v1to2(state) {
  const midIdx = state.calendar.findIndex(d => d.type === 'league' && d.md === 9);
  const midDone = midIdx >= 0 && state.dayIndex > midIdx;

  const migratePlayer = p => {
    if (p.attrs.men != null) return;
    const a = p.attrs;
    const target = p.ovr;
    const r = (hash(p.id) % 1000) / 1000;
    a.men = Math.round(clamp(target - 3 + (p.age - 24) * 0.5 + (r - 0.5) * 8, 20, 95));
    if (p.position === 'TW') {
      a.tor = Math.round((a.ref ?? 50) * 0.35 + (a.hal ?? 50) * 0.25 + (a.ste ?? 50) * 0.3 + (a.spi ?? 50) * 0.1);
      a.pas = Math.round(Math.max(a.pas ?? 30, (a.spi ?? 40) * 0.85));
    } else {
      a.tor = 10 + (hash(p.id + 't') % 16);
    }
    delete a.ref; delete a.hal; delete a.ste; delete a.spi;
    normalizeTo(a, p.position, target);
    for (const k in a) a[k] = Math.round(clamp(a[k], 15, 99));
    if (p.position !== 'TW') a.tor = Math.min(a.tor, 26);
    p.ovr = calcOvr(p);
    if (p.potential < p.ovr) p.potential = p.ovr;

    const avg = p.stats?.apps ? p.stats.ratingSum / p.stats.apps : 6.4;
    p.careerStats = { ...p.careerStats, ratingSum: Math.round((p.careerStats?.apps || 0) * avg * 10) / 10 };
    p.half = midDone ? { apps: 0, ratingSum: 0 } : { apps: p.stats?.apps || 0, ratingSum: p.stats?.ratingSum || 0 };
    p.tempBoost = null;
  };
  Object.values(state.players).forEach(migratePlayer);
  (state.pending?.candidates || []).forEach(migratePlayer);

  for (const c of Object.values(state.clubs)) {
    if (!c.isUser && !c.coach) {
      const rng = createRng(hash(c.id));
      c.coach = newCoach(rng);
      c.coach.style = c.preferredStyle;
    }
    const apps = c.playerIds.map(id => state.players[id]?.half?.apps || 0);
    c.halfGames = Math.max(...apps, 0) || (midDone ? 0 : Math.min(9, MATCHDAYS));
  }

  for (const item of state.user.inventory || []) {
    if ((item.type === 'TRAIN' || item.type === 'TRAIN_PLUS') && !item.attr) {
      item.attr = ['tem', 'sch', 'pas', 'dri', 'abw', 'phy', 'men'][hash(item.id) % 7];
    }
  }
  state.version = 2;
  return state;
}

/** v2 → v3: Verträge mit festem Gehalt, Transferliste und Angebote */
function v2to3(state) {
  ensureAllContracts(state);
  state.user.listings = state.user.listings || {};
  state.user.offers = state.user.offers || [];
  state.version = 3;
  return state;
}

/** Bringt einen geladenen Spielstand auf die aktuelle Version. Gibt null zurück, wenn das nicht geht. */
export function migrateSave(state, current) {
  if (!state || typeof state.version !== 'number') return null;
  if (state.version === current) return state;
  if (state.version === 1) v1to2(state);
  if (state.version === 2) v2to3(state);
  return state.version === current ? state : null;
}
