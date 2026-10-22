// =============================================================================
// Erfolge: Stufen Bronze, Silber, Gold. Der Wert kommt aus dem Spielstand, die
// erreichte Stufe hält das Manager-Profil fest (gilt über alle Spielstände).
// =============================================================================

import { clubPlayers } from './world.js';

export const ACH_TIERS = ['bronze', 'silver', 'gold'];
/** Münzbelohnung pro Stufe (einmal pro Profil) */
export const ACH_REWARD = { bronze: 400, silver: 1200, gold: 3500 };

function rec(state) {
  return state.user.record || {};
}

const promotions = s => s.history.filter(h => h.promoted).length;
const titles = s => s.history.filter(h => h.ffStage === 'W' || h.champion).length;
const cupWins = s => s.history.filter(h => h.cup === 'W').length;
/** Bester Pokalfortschritt: Runde, in der man ausschied (1–6), Sieg = 7 */
const cupBest = s => Math.max(0, ...s.history.map(h => (h.cup === 'W' ? 7 : Number(h.cup) || 0)), s.cup?.winner === 'user' ? 7 : 0);
/** Höchste erreichte Liga als 1 (Amateur) bis 6 (Apex Premier) */
const bestTier = s => 7 - Math.min(s.clubs.user.tier, ...s.history.map(h => h.tier));
const squad = s => clubPlayers(s, 'user');

export const ACHIEVEMENTS = [
  { id: 'wins', icon: 'ball', tiers: [10, 50, 200], value: s => rec(s).wins || 0 },
  { id: 'promotion', icon: 'up', tiers: [1, 3, 5], value: promotions },
  { id: 'summit', icon: 'trophy', tiers: [3, 5, 6], value: bestTier },
  { id: 'titles', icon: 'star', tiers: [1, 3, 6], value: titles },
  { id: 'cup', icon: 'trophy', tiers: [4, 6, 7], value: cupBest },
  { id: 'cupWins', icon: 'trophy', tiers: [1, 2, 4], value: cupWins },
  { id: 'streak', icon: 'flame', tiers: [5, 8, 12], value: s => rec(s).maxWinStreak || 0 },
  { id: 'unbeaten', icon: 'shield', tiers: [10, 20, 30], value: s => rec(s).maxUnbeaten || 0 },
  { id: 'bigWin', icon: 'sparkles', tiers: [1, 5, 15], value: s => rec(s).bigWins || 0 },
  { id: 'comeback', icon: 'heart', tiers: [1, 3, 10], value: s => rec(s).comebacks || 0 },
  { id: 'derby', icon: 'flame', tiers: [1, 5, 20], value: s => rec(s).derbyWins || 0 },
  { id: 'penalties', icon: 'target', tiers: [1, 3, 8], value: s => rec(s).penWins || 0 },
  { id: 'tenMen', icon: 'alert', tiers: [1, 3, 10], value: s => rec(s).tenManWins || 0 },
  { id: 'scorer', icon: 'ball', tiers: [15, 25, 35], value: s => Math.max(0, ...squad(s).map(p => p.stats.goals)) },
  { id: 'youth', icon: 'sparkles', tiers: [1, 3, 6], value: s => squad(s).filter(p => p.fromYouth && (s.clubRecords?.players?.[p.id]?.apps || 0) >= 30).length },
  { id: 'collector', icon: 'squad', tiers: [1, 3, 6], value: s => squad(s).filter(p => p.tier === 'gold' || p.tier === 'icon').length },
  { id: 'nations', icon: 'globe', tiers: [8, 12, 16], value: s => new Set(squad(s).map(p => p.nation)).size },
  { id: 'trader', icon: 'coins', tiers: [5000, 25000, 100000], value: s => rec(s).salesIncome || 0 },
  // Versteckte Erfolge: erst nach dem Freischalten sichtbar
  { id: 'miracle', icon: 'sparkles', tiers: [1, 2, 3], hidden: true, value: s => rec(s).miracles || 0 },
  { id: 'goalFest', icon: 'ball', tiers: [1, 3, 5], hidden: true, value: s => rec(s).goalFests || 0 }
];

/** Erreichte Stufe (0 = keine, 1 = Bronze, 2 = Silber, 3 = Gold) für einen Wert */
export function tierFor(def, value) {
  return def.tiers.filter(t => value >= t).length;
}

/** Spielstatistik des eigenen Vereins nach jedem Spiel fortschreiben */
export function recordMatch(state, { result, side, outcome, rival, deficit, gap }) {
  const r = state.user.record || (state.user.record = {});
  const gf = side === 'home' ? result.hg : result.ag;
  const ga = side === 'home' ? result.ag : result.hg;
  const win = outcome === 'W';
  if (win) r.wins = (r.wins || 0) + 1;
  r.curWin = win ? (r.curWin || 0) + 1 : 0;
  r.curUnbeaten = outcome !== 'L' ? (r.curUnbeaten || 0) + 1 : 0;
  r.maxWinStreak = Math.max(r.maxWinStreak || 0, r.curWin);
  r.maxUnbeaten = Math.max(r.maxUnbeaten || 0, r.curUnbeaten);
  if (win && gf - ga >= 5) r.bigWins = (r.bigWins || 0) + 1;
  if (win && deficit <= -2) r.comebacks = (r.comebacks || 0) + 1;
  if (win && rival === 'derby') r.derbyWins = (r.derbyWins || 0) + 1;
  if (win && result.pens) r.penWins = (r.penWins || 0) + 1;
  if (win && (result.cards || []).some(c => c.side === side && c.type !== 'Y')) r.tenManWins = (r.tenManWins || 0) + 1;
  if (win && gap >= 12) r.miracles = (r.miracles || 0) + 1;
  if (gf + ga >= 8) r.goalFests = (r.goalFests || 0) + 1;
}

/**
 * Neue Stufen gegenüber dem Profil ermitteln. Gibt die Freischaltungen zurück und
 * aktualisiert das Profil (best, tier) – die Belohnung bucht der Aufrufer.
 */
export function evaluateAchievements(state, profile) {
  const unlocks = [];
  profile.best = profile.best || {};
  profile.tier = profile.tier || {};
  for (const def of ACHIEVEMENTS) {
    let v = 0;
    try { v = def.value(state); } catch { v = 0; }
    if (!Number.isFinite(v)) v = 0;
    profile.best[def.id] = Math.max(profile.best[def.id] || 0, v);
    const reached = tierFor(def, profile.best[def.id]);
    const had = profile.tier[def.id] || 0;
    if (reached > had) {
      for (let tier = had + 1; tier <= reached; tier++) unlocks.push({ id: def.id, tier: ACH_TIERS[tier - 1] });
      profile.tier[def.id] = reached;
    }
  }
  return unlocks;
}
