// =============================================================================
// Geschichten: Schlagzeilen aus Ereignissen, Auszeichnungen, Gerüchte
// Alles landet als News (Schlüssel + Platzhalter) im Posteingang.
// =============================================================================

import { MATCHDAYS, POSITION_GROUP } from './constants.js';
import { clubPlayers, clubStrength, rivalry } from './world.js';
import { computeTable } from './schedule.js';
import { displayName, shortName } from './player.js';
import { addNews, userMatch } from './game.js';
import { recordMatch } from './achievements.js';

const APP_MILESTONES = [50, 100, 150, 200, 250, 300, 400];
const GOAL_MILESTONES = [25, 50, 75, 100, 150, 200];
const STREAK_STEPS = [3, 5, 8, 10, 15];

function runs(state) {
  return state.user.runs || (state.user.runs = { w: 0, l: 0, unbeaten: 0 });
}

/** Tiefster Rückstand des eigenen Teams im Spielverlauf (negativ = Rückstand) */
function worstDeficit(result, side) {
  let diff = 0;
  let worst = 0;
  for (const g of [...result.goals].sort((a, b) => a.minute - b.minute)) {
    diff += g.side === side ? 1 : -1;
    worst = Math.min(worst, diff);
  }
  return worst;
}

/**
 * Schlagzeilen nach dem eigenen Spiel. Höchstens drei, die wichtigsten zuerst.
 * strengths = { mine, opp } vor dem Spiel.
 */
export function matchStories(state, { result, side, outcome, opponentId, rival, comp, strengths }) {
  const items = [];
  const push = (prio, type, key, params, extra) => items.push({ prio, type, key, params, extra });
  const opp = state.clubs[opponentId];
  const gf = side === 'home' ? result.hg : result.ag;
  const ga = side === 'home' ? result.ag : result.hg;
  const score = `${gf}:${ga}`;
  const club = state.clubs.user.name;

  // Serien des Vereins
  const r = runs(state);
  r.w = outcome === 'W' ? r.w + 1 : 0;
  r.l = outcome === 'L' ? r.l + 1 : 0;
  r.unbeaten = outcome !== 'L' ? r.unbeaten + 1 : 0;
  if (outcome === 'W' && STREAK_STEPS.includes(r.w)) push(6, 'streak', 'news.winStreak', { club, n: r.w });
  if (outcome === 'L' && [3, 5, 8].includes(r.l)) push(6, 'streak', 'news.loseStreak', { club, n: r.l });
  if (outcome !== 'L' && r.w === 0 && [8, 12, 16].includes(r.unbeaten)) push(5, 'streak', 'news.unbeaten', { club, n: r.unbeaten });

  // Favoritensturz und Blamage
  const gap = (strengths?.opp ?? 0) - (strengths?.mine ?? 0);
  const tierGap = state.clubs.user.tier - opp.tier;
  if (outcome === 'W' && (gap >= 5 || (comp === 'cup' && tierGap >= 2))) push(8, 'upset', 'news.upset', { club, opp: opp.name, score }, { clubId: opponentId });
  if (outcome === 'L' && (gap <= -6 || (comp === 'cup' && tierGap <= -2))) push(7, 'upset', 'news.shock', { club, opp: opp.name, score }, { clubId: opponentId });

  // Spielverlauf
  const deficit = worstDeficit(result, side);
  recordMatch(state, { result, side, outcome, rival, deficit, gap });
  if (outcome === 'W' && deficit <= -1 && gf - ga >= 1 && (deficit <= -2 || result.goals.length >= 4)) {
    push(7, 'comeback', 'news.comeback', { club, opp: opp.name, score, n: -deficit }, { clubId: opponentId });
  }
  if (gf - ga >= 4 && rival !== 'derby') push(5, 'result', 'news.bigWin', { club, opp: opp.name, score }, { clubId: opponentId });
  if (ga - gf >= 4 && rival !== 'derby') push(5, 'result', 'news.heavyLoss', { club, opp: opp.name, score }, { clubId: opponentId });

  // Spieler-Geschichten
  const ids = [...result.lineups[side].map(l => l.playerId), ...result.subs.filter(s => s.side === side).map(s => s.inId)].filter(Boolean);
  for (const id of ids) {
    const p = state.players[id];
    if (!p || p.clubId !== 'user') continue;
    const goals = result.goals.filter(g => g.scorerId === id).length;
    const name = displayName(p);
    const short = shortName(p);
    if (goals >= 3) push(9, 'player', 'news.hattrick', { name, short, n: goals, opp: opp.name }, { playerId: id });
    else if (goals > 0 && p.careerStats.goals === goals && p.age <= 21) push(8, 'player', 'news.firstGoal', { name, short, age: p.age }, { playerId: id });
    if (goals > 0 && STREAK_STEPS.includes(p.goalStreak || 0)) push(6, 'player', 'news.goalStreak', { name, short, n: p.goalStreak }, { playerId: id });
    if (APP_MILESTONES.includes(p.careerStats.apps)) push(4, 'player', 'news.apps', { name, short, n: p.careerStats.apps }, { playerId: id });
    const cg = p.careerStats.goals;
    if (goals > 0 && GOAL_MILESTONES.some(m => cg >= m && cg - goals < m)) {
      push(5, 'player', 'news.goals', { name, short, n: GOAL_MILESTONES.filter(m => cg >= m).pop() }, { playerId: id });
    }
    const clubApps = state.clubRecords?.players?.[id]?.apps || 0;
    if (p.age <= 20 && clubApps === 10) push(5, 'youth', 'news.youngster', { name, short, age: p.age }, { playerId: id });
  }

  items.sort((a, b) => b.prio - a.prio);
  // umgekehrt einfügen, damit die wichtigste Meldung oben im Posteingang steht
  for (const it of items.slice(0, 3).reverse()) addNews(state, it.type, it.key, it.params, it.extra);
}

/** Torserien aller Spieler fortschreiben (für jedes Spiel, alle Vereine) */
export function trackGoalStreak(p, goals) {
  p.goalStreak = goals > 0 ? (p.goalStreak || 0) + 1 : 0;
}

// -----------------------------------------------------------------------------
// Nach jedem Ligaspieltag: Tabellenführung, Torjäger, Spieler des Monats
// -----------------------------------------------------------------------------

function windowStats(state, ids) {
  const snap = state.awardSnap || {};
  return ids.map(id => {
    const p = state.players[id];
    const s = snap[id] || [0, 0, 0];
    return { p, apps: p.stats.apps - s[0], rs: p.stats.ratingSum - s[1], goals: p.stats.goals - s[2] };
  });
}

function takeAwardSnapshot(state) {
  const snap = {};
  for (const p of Object.values(state.players)) snap[p.id] = [p.stats.apps, p.stats.ratingSum, p.stats.goals];
  state.awardSnap = snap;
}

export function matchdayStories(rng, state, day) {
  if (day.type !== 'league') return;
  const tier = state.clubs.user.tier;
  const league = state.leagues[tier];

  // Tabellenführung
  if (day.md >= 3) {
    const before = computeTable(state, tier, day.md - 1)[0].clubId;
    const after = computeTable(state, tier, day.md)[0].clubId;
    if (before !== after) {
      if (after === 'user') addNews(state, 'table', 'news.userTop', { club: state.clubs.user.name, md: day.md });
      else if (before === 'user') addNews(state, 'table', 'news.userLostTop', { club: state.clubs[after].name, md: day.md }, { clubId: after });
      else addNews(state, 'table', 'news.newLeader', { club: state.clubs[after].name, md: day.md }, { clubId: after });
    }
  }

  // Eigener Spieler übernimmt die Torjägerliste
  const players = league.clubIds.flatMap(id => clubPlayers(state, id));
  const top = [...players].sort((a, b) => b.stats.goals - a.stats.goals || b.stats.assists - a.stats.assists)[0];
  const second = [...players].sort((a, b) => b.stats.goals - a.stats.goals)[1];
  const flags = state.user.storyFlags || (state.user.storyFlags = {});
  if (top && top.clubId === 'user' && top.stats.goals >= 4 && top.stats.goals > (second?.stats.goals || 0) && flags.topScorer !== `${state.season}:${top.id}`) {
    flags.topScorer = `${state.season}:${top.id}`;
    addNews(state, 'player', 'news.topScorer', { name: displayName(top), short: shortName(top), n: top.stats.goals }, { playerId: top.id });
  }

  // Spieler des Monats nach Spieltag 6 und 12
  if (day.md % 6 === 0 && day.md < MATCHDAYS) {
    const cands = windowStats(state, players.map(p => p.id)).filter(x => x.apps >= 3);
    if (cands.length) {
      const score = x => x.rs / x.apps + x.goals * 0.08;
      const best = cands.sort((a, b) => score(b) - score(a))[0];
      const p = best.p;
      p.awards = [...(p.awards || []), { k: 'potm', s: state.season, md: day.md, t: tier, c: state.clubs[p.clubId].name }];
      const params = { name: displayName(p), short: shortName(p), club: state.clubs[p.clubId].name, ratingD: Math.round((best.rs / best.apps) * 10) / 10, goals: best.goals };
      if (p.clubId === 'user') {
        p.morale = Math.min(100, p.morale + 6);
        addNews(state, 'award', 'news.potmMine', params, { playerId: p.id });
      } else {
        addNews(state, 'award', 'news.potm', params, { playerId: p.id });
      }
    }
    takeAwardSnapshot(state);
  }

  // Gerüchte: starke eigene Spieler wecken Interesse höherklassiger Vereine
  if (day.md >= 4 && rng.chance(0.18)) {
    const mine = clubPlayers(state, 'user')
      .filter(p => (p.form || []).length >= 3 && p.form.reduce((s, x) => s + x, 0) / p.form.length >= 7.0)
      .filter(p => (p.rumorDay ?? -99) < state.dayIndex - 8)
      .sort((a, b) => b.ovr - a.ovr);
    const p = mine[0];
    const higher = state.leagues[Math.max(1, tier - 1)].clubIds.filter(id => id !== 'user');
    if (p && higher.length) {
      const suitor = state.clubs[rng.pick(higher)];
      p.rumorDay = state.dayIndex;
      addNews(state, 'rumor', 'news.rumor', { name: displayName(p), short: shortName(p), club: suitor.name }, { playerId: p.id });
    }
  }
}

/** Vor dem nächsten Spiel: Derby-Vorschau */
export function previewStories(state) {
  const next = userMatch(state);
  if (!next) return;
  const oppId = next.m.home === 'user' ? next.m.away : next.m.home;
  const opp = state.clubs[oppId];
  if (rivalry(state.clubs.user, opp) !== 'derby') return;
  const venueK = next.m.home === 'user' ? 'w.home' : 'w.away';
  addNews(state, 'derby', 'news.derbyPreview', { opp: opp.name, club: state.clubs.user.name, venueK }, { clubId: oppId });
}

// -----------------------------------------------------------------------------
// Saisonende: Torschützenkönig, Spieler der Saison, Elf der Saison
// -----------------------------------------------------------------------------

const XI_SHAPE = { GK: 1, DEF: 4, MID: 3, ATT: 3 };

export function seasonAwards(state, tier) {
  const league = state.leagues[tier];
  const players = league.clubIds.flatMap(id => clubPlayers(state, id));
  const avg = p => (p.stats.apps ? p.stats.ratingSum / p.stats.apps : 0);
  const minApps = Math.ceil(MATCHDAYS / 2);
  const regular = players.filter(p => p.stats.apps >= minApps);
  const entry = p => ({ id: p.id, name: displayName(p), clubId: p.clubId, club: state.clubs[p.clubId].name, pos: p.position, goals: p.stats.goals, rating: Math.round(avg(p) * 10) / 10,
    snap: { first: p.first, last: p.last, look: p.look, nation: p.nation, tier: p.tier, age: p.age, position: p.position } });

  const scorer = [...players].sort((a, b) => b.stats.goals - a.stats.goals || b.stats.assists - a.stats.assists || a.stats.apps - b.stats.apps)[0];
  const pots = [...regular].sort((a, b) => avg(b) + b.stats.goals * 0.02 - (avg(a) + a.stats.goals * 0.02))[0];
  const xi = [];
  for (const [group, n] of Object.entries(XI_SHAPE)) {
    const pool = regular.filter(p => POSITION_GROUP[p.position] === group).sort((a, b) => avg(b) - avg(a));
    xi.push(...pool.slice(0, n).map(entry));
  }
  const awards = { tier, scorer: scorer?.stats.goals ? entry(scorer) : null, pots: pots ? entry(pots) : null, xi };

  for (const [k, p] of [['scorer', scorer], ['pots', pots]]) {
    if (!p || !awards[k]) continue;
    p.awards = [...(p.awards || []), { k, s: state.season, t: tier, c: state.clubs[p.clubId].name }];
    if (p.clubId === 'user') p.morale = Math.min(100, p.morale + 8);
  }
  for (const e of xi) {
    const p = state.players[e.id];
    p.awards = [...(p.awards || []), { k: 'xi', s: state.season, t: tier, c: state.clubs[p.clubId].name }];
  }

  if (awards.scorer) addNews(state, 'award', awards.scorer.clubId === 'user' ? 'news.scorerMine' : 'news.scorer', { name: awards.scorer.name, club: awards.scorer.club, n: awards.scorer.goals }, { playerId: awards.scorer.id });
  if (awards.pots) addNews(state, 'award', awards.pots.clubId === 'user' ? 'news.potsMine' : 'news.pots', { name: awards.pots.name, club: awards.pots.club, ratingD: awards.pots.rating }, { playerId: awards.pots.id });
  const mineInXi = xi.filter(e => e.clubId === 'user');
  if (mineInXi.length) addNews(state, 'award', 'news.xiMine', { list: mineInXi.map(e => e.name).join(', '), n: mineInXi.length }, { playerId: mineInXi[0].id, playerIds: mineInXi.map(e => e.id) });
  return awards;
}

export { takeAwardSnapshot };
