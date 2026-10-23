// =============================================================================
// Verein lebt (v1.9): Stimmung (Fans, Vorstand, Team), Saisonziel,
// Wochenplan Training, Jugendakademie
// Die Wirkungen bleiben bewusst moderat: Sie färben Entscheidungen, ohne
// Pflichtprogramm zu werden.
// =============================================================================

import { clubPlayers, clubStrength } from './world.js';
import { computeTable } from './schedule.js';
import { seasonPrize, wageCap, weeklyWages, TIER_INCOME } from './economy.js';
import { createPlayer, salaryFor, displayName, shortName } from './player.js';
import { TIERS, MAX_SQUAD, POSITION_GROUP } from './constants.js';
import { addNews, ledger } from './game.js';
import { addTask } from './tasks.js';
import { leagueDaysPlayed } from './market.js';
import { createRng } from './rng.js';

const clamp = (x, a = 0, b = 100) => Math.max(a, Math.min(b, x));
const r1 = x => Math.round(x * 10) / 10;

// -----------------------------------------------------------------------------
// Grundzustand (auch für alte Spielstände)
// -----------------------------------------------------------------------------

export function ensureClubLife(state) {
  const u = state.user;
  if (!u) return;
  if (!u.mood) {
    u.mood = { fans: 60, board: 60, chem: 70, hist: { fans: [], board: [], team: [] }, reason: { fans: 'start', board: 'start' }, flags: {}, goal: null };
  }
  if (!u.academy) u.academy = { level: 1, ids: [], seeded: false };
  // Erste Talente gleich zum Start (sobald der Kader steht), nicht erst nach einer Saison
  if (!u.academy.seeded && clubPlayers(state, 'user').length >= 15) {
    u.academy.seeded = true;
    academyIntake(createRng((state.seed * 7 + state.season) >>> 0), state);
  }
  if (!u.planWeeks) u.planWeeks = {};
  if (u.plan === undefined) u.plan = null;
  if (!u.mood.goal || u.mood.goal.season !== state.season) setSeasonGoal(state, !u.mood.goal);
}

// -----------------------------------------------------------------------------
// Saisonziel des Vorstands
// -----------------------------------------------------------------------------

export const GOALS = { top3: 3, ff: 4, mid: 6, stay: 8 };
/** Von ehrgeizig nach vorsichtig */
export const GOAL_ORDER = ['top3', 'ff', 'mid', 'stay'];
export const GOAL_LATEST_MD = 9;   // „Ziel senken“ nur vor Ende von Spieltag 9

/** Handgeld für ein ehrgeizigeres Ziel (Liga 6: 150, Liga 1: 1050) */
export const goalAdvance = tier => Math.round(TIER_INCOME[tier] * 0.35 / 10) * 10;

export function setSeasonGoal(state, silent = false) {
  const u = state.user;
  const tier = state.clubs.user.tier;
  const ids = state.leagues?.[tier]?.clubIds || [];
  const sorted = [...ids].sort((a, b) => clubStrength(state, b) - clubStrength(state, a));
  const rank = Math.max(1, sorted.indexOf('user') + 1);
  const key = rank <= 2 ? 'top3' : rank <= 4 ? 'ff' : rank <= 7 ? 'mid' : 'stay';
  u.mood.goal = { season: state.season, key, maxPos: GOALS[key], tier, rank, deal: null, lowered: false };
  if (!silent) ensureGoalTask(state);
}

/** Vorstand legt drei Möglichkeiten vor (blockierend). Einmal je Saison. */
export function ensureGoalTask(state) {
  const g = state.user.mood?.goal;
  if (!g || g.deal || g.season !== state.season) return null;
  if ((state.inbox || []).some(n => n.task?.kind === 'goal' && n.task.ref === String(state.season))) return null;
  const i = GOAL_ORDER.indexOf(g.key);
  const amb = i > 0 ? GOAL_ORDER[i - 1] : null;
  const cau = i < GOAL_ORDER.length - 1 ? GOAL_ORDER[i + 1] : null;
  const advance = goalAdvance(g.tier);
  const choices = [
    ...(amb ? [{ key: 'ambitious', label: 'task.goal.ambitious', hint: 'task.goal.ambitious.d', tone: 'secondary' }] : []),
    { key: 'standard', label: 'task.goal.standard', hint: 'task.goal.standard.d', tone: 'primary' },
    ...(cau ? [{ key: 'cautious', label: 'task.goal.cautious', hint: 'task.goal.cautious.d', tone: 'secondary' }] : [])
  ];
  return addTask(state, 'goal', amb && cau ? 'news.goalTask' : amb ? 'news.goalTaskUp' : 'news.goalTaskDown', {
    season: state.season, goalK: `goal.${g.key}`, ambK: `goal.${amb || g.key}`, cauK: `goal.${cau || g.key}`, amountC: advance
  }, { blocking: true, ref: String(state.season), choices }, { newsType: 'board' });
}

/** Antwort auf den Vorschlag des Vorstands. Gibt { ok } oder { ok: false, code } zurück. */
export function chooseSeasonGoal(state, deal) {
  const g = state.user.mood?.goal;
  if (!g || g.deal || g.season !== state.season) return { ok: false, code: 'gone' };
  const i = GOAL_ORDER.indexOf(g.key);
  let key = g.key;
  let advance = 0;
  if (deal === 'ambitious') {
    if (i <= 0) return { ok: false, code: 'bad' };
    key = GOAL_ORDER[i - 1];
    advance = goalAdvance(g.tier);
    ledger(state, 'ledger.boardAdvance', advance, { season: state.season });
  } else if (deal === 'cautious') {
    if (i >= GOAL_ORDER.length - 1) return { ok: false, code: 'bad' };
    key = GOAL_ORDER[i + 1];
    state.user.mood.board = r1(clamp(state.user.mood.board - 3));
  } else if (deal !== 'standard') return { ok: false, code: 'bad' };
  g.baseKey = g.key;
  g.key = key;
  g.maxPos = GOALS[key];
  g.deal = deal;
  addNews(state, 'board', `news.goalDeal.${deal}`, { goalK: `goal.${key}`, amountC: advance, season: state.season });
  return { ok: true };
}

/** Ziel nachträglich senken (bis Spieltag 9): Prämie entfällt, Vorstand verärgert */
export function canLowerGoal(state) {
  const g = state.user.mood?.goal;
  if (!g || g.lowered || g.season !== state.season) return false;
  if (GOAL_ORDER.indexOf(g.key) >= GOAL_ORDER.length - 1) return false;
  return leagueDaysPlayed(state) < GOAL_LATEST_MD;
}

export function lowerSeasonGoal(state) {
  const g = state.user.mood?.goal;
  if (!g || g.lowered || GOAL_ORDER.indexOf(g.key) >= GOAL_ORDER.length - 1) return { ok: false, code: 'bad' };
  if (!canLowerGoal(state)) return { ok: false, code: 'late' };
  g.key = GOAL_ORDER[GOAL_ORDER.indexOf(g.key) + 1];
  g.maxPos = GOALS[g.key];
  g.lowered = true;
  state.user.mood.board = r1(clamp(state.user.mood.board - 5));
  addNews(state, 'board', 'news.goalDeal.lowered', { goalK: `goal.${g.key}`, season: state.season });
  return { ok: true };
}

/** Aktueller Tabellenplatz in der eigenen Liga */
export function userPos(state) {
  const row = computeTable(state, state.clubs.user.tier).find(r => r.clubId === 'user');
  return row ? row.pos : null;
}

// -----------------------------------------------------------------------------
// Stimmung
// -----------------------------------------------------------------------------

function leadBonus(state, starters) {
  const u = state.user;
  const cap = state.players[u.captain];
  const vice = state.players[u.vice];
  const val = p => clamp(((p?.attrs?.men ?? 55) - 55) / 15, 0, 3);
  if (cap && starters.includes(cap.id)) return val(cap);
  if (vice && starters.includes(vice.id)) return val(vice) * 0.5;
  return 0;
}

/** Stimmung der Mannschaft (0 bis 100): Kabine, Eingespieltheit, Kapitän */
export function teamMood(state) {
  const u = state.user;
  const squad = clubPlayers(state, 'user');
  if (!squad.length) return 60;
  const avg = squad.reduce((s, p) => s + p.morale, 0) / squad.length;
  const lead = leadBonus(state, u.lastXI || []);
  return clamp(Math.round(avg * 0.7 + (u.mood?.chem ?? 70) * 0.3 + lead));
}

export function teamReason(state) {
  const u = state.user;
  const squad = clubPlayers(state, 'user');
  const avg = squad.length ? squad.reduce((s, p) => s + p.morale, 0) / squad.length : 70;
  if (avg < 55) return 'lowMorale';
  if ((u.mood?.chem ?? 70) < 58) return 'rotation';
  if (leadBonus(state, u.lastXI || []) >= 2) return 'captain';
  if (avg >= 80) return 'highMorale';
  return 'stable';
}

/** Einnahmen-Faktor durch die Fans: 0,90 bis 1,15 */
export function fanIncomeFactor(state) {
  const f = state.user?.mood?.fans ?? 60;
  return 0.9 + 0.25 * (f / 100);
}

/** Zusätzliche Stärke-Boni fürs nächste Spiel: Matchplan, Wochenplan Taktik, Stimmung der Mannschaft */
export function userBoosts(state) {
  const base = { ...(state.user.matchBoost || {}) };
  const add = (k, v) => { base[k] = (base[k] || 0) + v; };
  if (state.user.plan === 'tactics') { add('mid', 2); add('att', 1); add('def', 1); }
  if (state.user.plan === 'setpieces') add('sp', 1);
  const tb = ((state.user.mood ? teamMood(state) : 60) - 60) / 100 * 2;
  add('mid', tb); add('att', tb); add('def', tb);
  return base;
}

function pushHist(m, key, v) {
  m.hist[key] = [...(m.hist[key] || []), Math.round(v)].slice(-6);
}

export function trend(state, key) {
  const h = state.user.mood?.hist?.[key] || [];
  if (h.length < 2) return 0;
  const ref = h[Math.max(0, h.length - 4)];
  return h[h.length - 1] - ref;
}

/** Nach jedem Spiel des eigenen Vereins */
export function afterUserMatch(state, info) {
  ensureClubLife(state);
  const u = state.user;
  const m = u.mood;
  const { outcome, home, derby, gf, starters, day } = info;

  // Fans
  let df = outcome === 'W' ? (home ? 4 : 3) : outcome === 'L' ? (home ? -4 : -3) : (home ? -1 : 0);
  let code = outcome === 'W' ? (home ? 'homeWin' : 'awayWin') : outcome === 'L' ? (home ? 'homeLoss' : 'awayLoss') : 'draw';
  if (derby) {
    df *= 2;
    if (outcome === 'W') code = 'derbyWin'; else if (outcome === 'L') code = 'derbyLoss';
  }
  if (gf >= 3) { df += 1; if (outcome !== 'L' && !derby) code = 'goals'; }
  if (starters.filter(id => state.players[id]?.fromYouth).length >= 3) df += 1;
  m.fans = r1(clamp(m.fans + df + (55 - m.fans) * 0.03));
  m.reason.fans = code;

  // Eingespieltheit: wie viele Startspieler standen schon im letzten Spiel in der Elf
  const last = new Set(u.lastXI || []);
  if (last.size) {
    const overlap = starters.filter(id => last.has(id)).length;
    m.chem = r1(m.chem * 0.6 + clamp(30 + overlap * 6) * 0.4);
  }
  u.lastXI = starters;

  // Vorstand: Tabellenplatz gegen Saisonziel, Finanzen
  const club = state.clubs.user;
  if (day.type === 'league') {
    let db = 0;
    let bcode = m.reason.board || 'start';
    if (day.md >= 5) {
      const pos = userPos(state);
      if (pos != null) {
        if (pos <= m.goal.maxPos) { db += 1; bcode = 'onTrack'; }
        else if (pos > m.goal.maxPos + 2) { db -= 2; bcode = 'behind'; }
        else { db -= 1; bcode = 'close'; }
      }
    }
    if (club.coins < 0) { db -= 4; bcode = 'debt'; }
    else if (weeklyWages(state, 'user') > wageCap(club.tier) * 1.15) { db -= 1; if (bcode === 'start' || bcode === 'onTrack') bcode = 'wages'; }
    m.board = r1(clamp(m.board + db));
    m.reason.board = bcode;
  }

  pushHist(m, 'fans', m.fans);
  pushHist(m, 'board', m.board);
  pushHist(m, 'team', teamMood(state));
  moodNews(state);
}

/** Meldungen, wenn eine Stimmung kippt (je Schwelle nur einmal, bis sie sich erholt) */
function moodNews(state) {
  const m = state.user.mood;
  const team = teamMood(state);
  const f = m.flags;
  const swing = (flag, low, cond, reset, key, params = {}) => {
    if (cond && !f[flag]) { f[flag] = true; addNews(state, 'mood', key, params); }
    else if (f[flag] && reset) f[flag] = false;
    void low;
  };
  swing('fansLow', true, m.fans < 30, m.fans > 45, 'news.moodFansLow');
  swing('fansHigh', false, m.fans > 85, m.fans < 75, 'news.moodFansHigh');
  swing('boardLow', true, m.board < 30, m.board > 45, 'news.moodBoardLow');
  swing('teamLow', true, team < 45, team > 58, 'news.moodTeamLow');
}

/** Saisonende: Ziel prüfen, Vertrauen des Vorstands anpassen, Prämie */
export function closeSeasonLife(state, tier, pos) {
  ensureClubLife(state);
  const m = state.user.mood;
  const goal = m.goal;
  const met = pos <= goal.maxPos;
  m.board = r1(clamp(m.board + (met ? 15 : -12)));
  m.fans = r1(clamp(m.fans + (met ? 3 : -2)));
  let bonus = 0;
  if (met) {
    bonus = goal.lowered ? 0 : Math.round(seasonPrize(tier, pos) * 0.35 * (goal.deal === 'cautious' ? 0.5 : 1));
    if (bonus) ledger(state, 'ledger.boardBonus', bonus, { season: state.season });
    addNews(state, 'board', bonus ? 'news.goalMet' : 'news.goalMetNoBonus', { goalK: `goal.${goal.key}`, amountC: bonus, pos });
  } else {
    addNews(state, 'board', 'news.goalMissed', { goalK: `goal.${goal.key}`, pos });
  }
  m.reason.board = 'start';
  m.flags = {};
  return { key: goal.key, maxPos: goal.maxPos, met, bonus };
}

// -----------------------------------------------------------------------------
// Wochenplan Training
// -----------------------------------------------------------------------------

export const PLAN_KEYS = ['normal', 'fitness', 'tactics', 'setpieces', 'youth', 'recovery'];

export function planCost(state, key) {
  return key === 'recovery' ? Math.round(TIER_INCOME[state.clubs.user.tier] * 0.12 / 10) * 10 : 0;
}

export function setPlan(state, key) {
  ensureClubLife(state);
  if (!PLAN_KEYS.includes(key)) return { ok: false, code: 'x' };
  const k = key === 'normal' ? null : key;
  state.user.plan = k;
  return { ok: true };
}

/** Beim Anpfiff: Plan anwenden (Kondition, Kosten) */
export function applyPlanStart(state) {
  const u = state.user;
  const plan = u.plan;
  if (!plan) return;
  const squad = clubPlayers(state, 'user');
  if (plan === 'fitness') squad.forEach(p => { p.condition = Math.min(100, p.condition + 8); });
  if (plan === 'tactics') squad.forEach(p => { p.condition = Math.max(30, p.condition - 4); });
  if (plan === 'youth' || plan === 'setpieces') squad.forEach(p => { p.condition = Math.max(30, p.condition - 3); });
  if (plan === 'recovery') {
    const cost = planCost(state, 'recovery');
    ledger(state, 'ledger.planRecovery', -cost, {});
  }
  u.planWeeks[plan] = (u.planWeeks[plan] || 0) + 1;
}

/** Nach dem Spieltag: Regeneration wirkt, der Plan ist verbraucht */
export function applyPlanEnd(state) {
  const u = state.user;
  if (u.plan === 'recovery') {
    for (const p of clubPlayers(state, 'user')) {
      if (p.injury) {
        p.injury.days--;
        if (p.injury.days <= 0) { p.injury = null; addNews(state, 'injury', 'news.fit', { short: shortName(p), name: displayName(p) }, { playerId: p.id }); }
      }
      if (p.condition < 70) p.condition = Math.min(100, p.condition + 4);
    }
  }
  u.plan = null;
}

/** Entwicklungsanpassung durch den Wochenplan (additiv auf die Stärkeänderung der Halbserie) */
export function planDevMod(state, p) {
  const w = state.user.planWeeks || {};
  let mod = 0;
  if (w.fitness) mod -= 0.04 * w.fitness;
  if (w.youth && p.age <= 21) mod += 0.06 * w.youth;
  return mod;
}

export function resetPlanWeeks(state) {
  state.user.planWeeks = {};
}

// -----------------------------------------------------------------------------
// Jugendakademie
// -----------------------------------------------------------------------------

export const ACADEMY_COSTS = { 2: 2500, 3: 6000, 4: 12000, 5: 24000 };
export const academyCap = level => 7 + level;
export const academyIntakeCount = level => 2 + (level >= 3 ? 1 : 0) + (level >= 5 ? 1 : 0);
const TIER_FACTOR = { 1: 1, 2: 0.9, 3: 0.8, 4: 0.7, 5: 0.6, 6: 0.5 };

export function prospects(state) {
  return (state.user.academy?.ids || []).map(id => state.players[id]).filter(Boolean);
}

/** Handgeld beim Hochziehen */
export function signingFee(p) {
  return Math.round(salaryFor(p.ovr) * 3);
}

export function upgradeAcademy(state) {
  ensureClubLife(state);
  const a = state.user.academy;
  if (a.level >= 5) return { ok: false, code: 'max' };
  const cost = ACADEMY_COSTS[a.level + 1];
  if (state.clubs.user.coins < cost) return { ok: false, code: 'noMoney' };
  a.level++;
  ledger(state, 'ledger.academyUp', -cost, { n: a.level });
  return { ok: true, level: a.level };
}

export function promoteProspect(state, id, { free = false } = {}) {
  const p = state.players[id];
  const a = state.user.academy;
  const club = state.clubs.user;
  if (!p || !a.ids.includes(id)) return { ok: false, code: 'x' };
  if (club.playerIds.length >= MAX_SQUAD) return { ok: false, code: 'full' };
  const fee = free ? 0 : signingFee(p);
  if (!free && club.coins < fee) return { ok: false, code: 'noMoney' };
  if (fee) ledger(state, 'ledger.youthSigning', -fee, { name: displayName(p) });
  a.ids = a.ids.filter(x => x !== id);
  p.clubId = 'user';
  p.academy = false;
  p.fromYouth = true;
  club.playerIds.push(id);
  // Einstiegsgehalt unter Marktniveau, drei Saisons Laufzeit
  p.contract = { wage: Math.max(1, Math.round(salaryFor(p.ovr) * 0.7)), until: state.season + (free ? 3 : 2) };
  p.morale = Math.max(p.morale || 0, 80);
  return { ok: true, fee };
}

export function releaseProspect(state, id) {
  const a = state.user.academy;
  if (!a.ids.includes(id)) return { ok: false, code: 'x' };
  a.ids = a.ids.filter(x => x !== id);
  delete state.players[id];
  return { ok: true };
}

function rollProspectTier(rng, level, tier) {
  const tf = TIER_FACTOR[tier] ?? 0.5;
  const gold = (3 + 3 * (level - 1)) * tf;
  const silver = (27 + 7 * (level - 1)) * (0.6 + 0.4 * tf);
  return rng.weighted([
    { value: 'bronze', weight: Math.max(10, 100 - gold - silver) },
    { value: 'silver', weight: silver },
    { value: 'gold', weight: gold }
  ]);
}

function newProspect(rng, state, pos, ageMin = 16, ageMax = 17) {
  const a = state.user.academy;
  const club = state.clubs.user;
  const tierRoll = rollProspectTier(rng, a.level, club.tier);
  const age = rng.int(ageMin, ageMax);
  const potential = rng.int(TIERS[tierRoll].potMin, TIERS[tierRoll].potMax);
  const ovr = Math.max(38, potential - rng.int(15, 21));
  const p = createPlayer(rng, { id: `p${(++state.nextId).toString(36)}`, position: pos, age, ovr, potential, tier: tierRoll, home: club.country || 'GER', homeBias: 0.7 });
  p.clubId = 'academy';
  p.academy = true;
  p.fromYouth = true;
  p.ovrHistory = [{ s: state.season, h: 0, ovr: p.ovr }];
  p.contract = { wage: 0, until: state.season + 3 };
  state.players[p.id] = p;
  a.ids.push(p.id);
  return p;
}

/** Welche Position fehlt dem Profikader am meisten */
function neededPosition(rng, state) {
  const counts = {};
  [...clubPlayers(state, 'user'), ...prospects(state)].forEach(p => { counts[POSITION_GROUP[p.position]] = (counts[POSITION_GROUP[p.position]] || 0) + 1; });
  const need = [['GK', 2], ['DEF', 6], ['MID', 6], ['ATT', 4]].find(([g, n]) => (counts[g] || 0) < n);
  const byGroup = { GK: ['TW'], DEF: ['IV', 'LV', 'RV'], MID: ['ZDM', 'ZM', 'ZOM', 'LM', 'RM'], ATT: ['ST', 'LF', 'RF'] };
  return need ? rng.pick(byGroup[need[0]]) : rng.pick(['IV', 'ZM', 'ST', 'LF', 'RF', 'ZOM', 'LV', 'RV']);
}

/** Saisonende, nach dem Altern: 19-Jährige wechseln in den Profikader */
export function academyGraduates(state) {
  const out = { promoted: [], released: [] };
  for (const p of prospects(state)) {
    if (p.age < 19) continue;
    const r = promoteProspect(state, p.id, { free: true });
    if (r.ok) out.promoted.push(p.id);
    else { out.released.push(displayName(p)); releaseProspect(state, p.id); }
  }
  return out;
}

/** Kader nie unter einer Mindestgröße: beste Talente früher hochziehen */
export function academyFillSquad(state, min = 16) {
  const club = state.clubs.user;
  const moved = [];
  const list = prospects(state).sort((a, b) => b.ovr - a.ovr);
  for (const p of list) {
    if (club.playerIds.length >= min) break;
    if (promoteProspect(state, p.id, { free: true }).ok) moved.push(p.id);
  }
  return moved;
}

/** Neue Talente zum Saisonende */
export function academyIntake(rng, state) {
  const a = state.user.academy;
  const room = Math.max(0, academyCap(a.level) - a.ids.length);
  const n = Math.min(room, academyIntakeCount(a.level));
  const made = [];
  for (let i = 0; i < n; i++) made.push(newProspect(rng, state, neededPosition(rng, state)));
  return made;
}

/** Entwicklung der Talente zur Halbserie (spielen nicht, trainieren aber) */
export function academyShare(state) {
  const a = state.user.academy;
  const youthWeeks = state.user.planWeeks?.youth || 0;
  return Math.min(1, 0.5 + 0.1 * a.level + 0.03 * youthWeeks);
}
