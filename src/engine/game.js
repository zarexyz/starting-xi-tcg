// =============================================================================
// Spielablauf: Neues Spiel, Spieltage, Saisonende.
// Alle Funktionen hier verändern den übergebenen Spielstand direkt. Der Store
// arbeitet immer auf einer Kopie – so bleibt jeder Schritt sauber nachvollziehbar.
// Diese Datei ist die „Naht“ für einen späteren Mehrspieler-Server.
// =============================================================================

import { createRng, withRng } from './rng.js';
import { FORMATIONS, MATCHDAYS, MAX_SQUAD, AI_SQUAD_SIZE, STYLE_KEYS, POSITION_GROUP, TIERS } from './constants.js';
import { createWorld, clubPlayers, createClubPlayer, LEAGUE_INFO, clubStrength, rivalry } from './world.js';
import { roundRobin, buildCalendar, createCup, drawCupRound, computeTable, createFinalFour, matchWinner, matchLoser, CUP_ROUND_NAMES } from './schedule.js';
import { buildTeam, simulateMatch, analyzeMatch } from './match.js';
import { aiSetup, bestLineup, repairLineup } from './ai.js';
import { developPlayer, shortName, displayName, salaryFor, createPlayer, trainAttribute, avgRating } from './player.js';
import { generateStarterSquad, generateStarDraft, generateDraft, generateItems, PACKS, CONSUMABLES } from './packs.js';
import { matchIncome, seasonPrize, CUP_PRIZES, FINAL_FOUR_PRIZES, weeklyWages, wageCap } from './economy.js';
import { ATTR_NAMES, STYLES, POS_LABEL } from './constants.js';
import { t } from '../i18n/index.js';
import { newCoach } from './world.js';
import { aiTransferWindow } from './market.js';
import { severance, ensureAllContracts, ensureContract, signContract, defaultYears, contractDemand, checkRaiseWishes, contractMood, expiryWarning, expireContracts, wageOf } from './contracts.js';
import { processTransferDay } from './market.js';
import { newsChannel } from './news.js';
import { weatherFor, resolveInterview } from './extras.js';
import { ensureClubLife, userBoosts, applyPlanStart, applyPlanEnd, afterUserMatch, fanIncomeFactor, planDevMod, resetPlanWeeks, closeSeasonLife, academyGraduates, academyFillSquad, academyIntake, academyShare } from './clublife.js';
import { matchStories, matchdayStories, previewStories, seasonAwards, trackGoalStreak, takeAwardSnapshot } from './stories.js';

export const SAVE_VERSION = 3;

// -----------------------------------------------------------------------------
// Neues Spiel
// -----------------------------------------------------------------------------

export function createGame({ seed, clubName, primary, secondary, crest, pattern, country, city }) {
  const state = {
    version: SAVE_VERSION,
    seed: seed >>> 0,
    rng: seed >>> 0,
    nextId: 1,
    season: 1,
    dayIndex: 0,
    calendar: buildCalendar(),
    clubs: {},
    players: {},
    leagues: {},
    cup: null,
    finalFours: {},
    user: {
      clubId: 'user',
      setup: null,
      inventory: [],
      premium: 0,
      matchBoost: null,
      ledger: [],
      unpaidDays: 0,
      autoLineup: true,
      listings: {},
      offers: [],
      counters: {}
    },
    pending: { type: 'starter' },
    inbox: [],
    history: [],
    matchLog: [],
    lastMatch: null,
    seasonSummary: null,
    createdAt: Date.now()
  };
  withRng(state, rng => {
    createWorld(rng, state, { name: clubName, primary, secondary, crest, pattern, country, city });
    startSeason(rng, state, null);
  });
  state.user.inventory = [
    { type: 'FITNESS' }, { type: 'FITNESS' }, { type: 'TRAIN', attr: 'sch' }, { type: 'BOOST', attr: 'tem' },
    { type: 'MORALE' }, { type: 'TACTIC' }
  ].map(item => ({ id: `i${++state.nextId}`, ...item }));
  addNews(state, 'welcome', 'news.welcome', { club: clubName, league: LEAGUE_INFO[6].name });
  // News sollen von Anfang an gefüllt sein: Trainer übernehmen ihre Vereine
  const intro = [...state.leagues[state.clubs.user.tier].clubIds.filter(id => id !== 'user').slice(0, 5),
    ...state.leagues[1].clubIds.slice(0, 3)];
  for (const id of intro.reverse()) {
    const c = state.clubs[id];
    if (c?.coach) addNews(state, 'coach', 'news.coachStart', { coach: c.coach.name, club: c.name, styleK: `style.${c.coach.style}.name` }, { clubId: id });
  }
  return state;
}

function startSeason(rng, state, cupByes) {
  for (let tier = 1; tier <= 6; tier++) {
    state.leagues[tier].fixtures = roundRobin(rng, state.leagues[tier].clubIds);
  }
  const byes = cupByes || [...state.leagues[1].clubIds]
    .sort((a, b) => clubStrength(state, b) - clubStrength(state, a))
    .slice(0, 4);
  state.cup = createCup(rng, state, byes);
  state.finalFours = {};
  state.dayIndex = 0;
  state.calendar = buildCalendar();
  for (const p of Object.values(state.players)) {
    p.stats = { apps: 0, goals: 0, assists: 0, ratingSum: 0, motm: 0, yellows: 0, reds: 0, cleanSheets: 0 };
    p.half = { apps: 0, ratingSum: 0 };
    p.yellowCount = 0;
  }
  for (const c of Object.values(state.clubs)) { c.halfGames = 0; c.seasonStats = newClubStats(); }
  takeAwardSnapshot(state);
  ensureAllContracts(state);
  ensureClubLife(state);
}

/** Saisonstatistik eines Vereins über alle Wettbewerbe */
export function newClubStats() {
  return { games: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, poss: 0, xg: 0, xga: 0, shots: 0, cleanSheets: 0, yellows: 0, reds: 0 };
}

// -----------------------------------------------------------------------------
// Hilfen
// -----------------------------------------------------------------------------

/** Nachricht mit Übersetzungsschlüssel: Titel = key.t, Text = key.x */
export function addNews(state, type, key, params = {}, extra = {}) {
  state.inbox.unshift({
    id: `n${++state.nextId}`,
    type, k: key, p: params,
    season: state.season,
    day: state.dayIndex,
    read: false,
    ...extra
  });
  if (state.inbox.length > 200) state.inbox.length = 200;
}

/** Kassenbuch: label ist ein Übersetzungsschlüssel, lp seine Platzhalter */
export function ledger(state, label, amount, lp = {}) {
  state.clubs.user.coins += amount;
  state.user.ledger.unshift({ season: state.season, day: state.dayIndex, label, lp, amount });
  if (state.user.ledger.length > 60) state.user.ledger.length = 60;
}

export function currentDay(state) {
  return state.calendar[state.dayIndex] || null;
}

export function dayLabel(state, day = currentDay(state)) {
  if (!day) return t('day.end');
  if (day.type === 'league') return t('day.league', { md: day.md });
  if (day.type === 'cup') return t('day.cup', { round: CUP_ROUND_NAMES[day.round] });
  if (day.type === 'ff_semi') return t('day.ffSemi');
  if (day.type === 'ff_final') return t('day.ffFinal');
  return '';
}

/** Alle Spiele eines Kalendertags */
export function matchesForDay(state, day = currentDay(state)) {
  if (!day) return [];
  const out = [];
  if (day.type === 'league') {
    for (let tier = 1; tier <= 6; tier++) {
      for (const m of state.leagues[tier].fixtures[day.md - 1] || []) out.push({ m, comp: 'league', tier });
    }
  } else if (day.type === 'cup') {
    for (const m of state.cup.rounds[day.round] || []) out.push({ m, comp: 'cup', round: day.round });
  } else if (day.type === 'ff_semi') {
    for (const ff of Object.values(state.finalFours)) for (const m of ff.semis) out.push({ m, comp: 'ff', tier: ff.tier, stage: 'semi' });
  } else if (day.type === 'ff_final') {
    for (const ff of Object.values(state.finalFours)) if (ff.final) out.push({ m: ff.final, comp: 'ff', tier: ff.tier, stage: 'final' });
  }
  return out;
}

export function userMatch(state, day = currentDay(state)) {
  return matchesForDay(state, day).find(x => x.m.home === 'user' || x.m.away === 'user') || null;
}

/** Nächstes Spiel des Spielers ab heute (für Vorschau) */
export function nextUserMatch(state) {
  for (let i = state.dayIndex; i < state.calendar.length; i++) {
    const day = state.calendar[i];
    const um = userMatch(state, day);
    if (um) return { ...um, day, dayIndex: i };
  }
  return null;
}

export function ensureUserSetup(state) {
  const club = state.clubs.user;
  if (!club.playerIds.length) return null;
  if (!state.user.setup) {
    const { lineup, bench } = bestLineup(state, 'user', '4-3-3');
    state.user.setup = { formation: '4-3-3', style: 'AUSGEWOGEN', lineup, bench };
  }
  state.user.setup = repairLineup(state, 'user', state.user.setup);
  return state.user.setup;
}

// -----------------------------------------------------------------------------
// Starter & Packs
// -----------------------------------------------------------------------------

export function openStarterPack(state) {
  if (state.pending?.type !== 'starter') return null;
  return withRng(state, rng => {
    const squad = generateStarterSquad(rng, state);
    for (const p of squad) {
      p.clubId = 'user';
      p.ovrHistory = [{ s: state.season, h: 0, ovr: p.ovr }];
      state.players[p.id] = p;
      state.clubs.user.playerIds.push(p.id);
      signContract(state, p, salaryFor(p.ovr), 1 + rng.int(1, 2));
    }
    const candidates = generateStarDraft(rng, state);
    state.pending = { type: 'draft', source: 'star', title: 'Starspieler-Wahl', candidates };
    return squad.map(p => p.id);
  });
}

export function buyPack(state, packKey) {
  const pack = PACKS[packKey];
  const club = state.clubs.user;
  if (!pack) return { error: t('err.unknownPack') };
  if (state.pending) return { error: t('err.openPack') };
  if (club.coins < pack.price) return { error: t('err.coins') };
  if (pack.kind === 'draft' && club.playerIds.length >= MAX_SQUAD) {
    return { error: t('err.squadFull', { max: MAX_SQUAD }) };
  }
  ledger(state, 'ledger.pack', -pack.price, { packK: `pack.${packKey}.name` });
  return withRng(state, rng => {
    if (pack.kind === 'draft') {
      state.pending = { type: 'draft', source: packKey, title: pack.name, candidates: generateDraft(rng, state, packKey) };
    } else {
      const items = generateItems(rng, pack.count).map(item => ({ id: `i${++state.nextId}`, ...item }));
      state.user.inventory.push(...items);
      state.pending = { type: 'items', source: packKey, title: pack.name, items };
    }
    return { ok: true };
  });
}

/** Einen Kandidaten aus dem Draft wählen. Die anderen betreten die Welt nie. */
export function pickDraft(state, index) {
  if (state.pending?.type !== 'draft') return null;
  const p = state.pending.candidates[index];
  if (!p) return null;
  delete p.isNew;
  p.clubId = 'user';
  p.ovrHistory = [{ s: state.season, h: 0, ovr: p.ovr }];
  state.players[p.id] = p;
  state.clubs.user.playerIds.push(p.id);
  signContract(state, p, salaryFor(p.ovr), Math.max(2, defaultYears(p.age)));
  const wasStar = state.pending.source === 'star';
  state.pending = null;
  if (wasStar) {
    ensureUserSetup(state);
    addNews(state, 'squad', 'news.star', { name: displayName(p), posK: `pos.${p.position}`, ovr: p.ovr }, { playerId: p.id });
  } else {
    state.user.setup = repairLineup(state, 'user', state.user.setup || { formation: '4-3-3', style: 'AUSGEWOGEN', lineup: {}, bench: [] });
  }
  return p.id;
}

export function closePending(state) {
  if (state.pending?.type === 'items') state.pending = null;
}

// -----------------------------------------------------------------------------
// Verbrauchsgegenstände
// -----------------------------------------------------------------------------

export function useItem(state, itemId, playerId = null) {
  const idx = state.user.inventory.findIndex(i => i.id === itemId);
  if (idx < 0) return { error: t('err.itemMissing') };
  const item = state.user.inventory[idx];
  const def = CONSUMABLES[item.type];
  const squad = clubPlayers(state, 'user');
  const player = playerId ? state.players[playerId] : null;
  if ((def.target === 'player' || def.target === 'injured' || def.target === 'own') && (!player || player.clubId !== 'user')) {
    return { error: t('err.pickPlayer') };
  }
  let message = '';
  const res = withRng(state, rng => {
    switch (item.type) {
      case 'FITNESS':
        player.condition = Math.min(100, player.condition + 35);
        message = t('item.msg.fitness', { name: shortName(player), cond: player.condition });
        break;
      case 'REGEN':
        squad.forEach(p => { p.condition = Math.min(100, p.condition + 12); });
        message = t('item.msg.regen');
        break;
      case 'MEDICAL':
        if (!player.injury) return { error: t('item.err.notInjured', { name: shortName(player) }) };
        player.injury.days = Math.max(0, player.injury.days - 4);
        if (player.injury.days === 0) player.injury = null;
        message = player.injury ? t('item.msg.medical', { name: shortName(player), n: player.injury.days }) : t('item.msg.healed', { name: shortName(player) });
        break;
      case 'TRAIN':
      case 'TRAIN_PLUS': {
        const attr = item.attr || 'pas';
        const amount = item.type === 'TRAIN' ? 1 : 2;
        const before = player.attrs[attr];
        const { gain, ovrDelta } = trainAttribute(rng, player, attr, amount);
        message = gain > 0
          ? t(ovrDelta > 0 ? 'item.msg.trainOvr' : 'item.msg.train', { name: shortName(player), attr: ATTR_NAMES[attr], from: before, to: player.attrs[attr], ovr: player.ovr })
          : t('item.msg.trainLimit', { name: shortName(player) });
        break;
      }
      case 'BOOST': {
        const attr = item.attr || 'tem';
        if (player.tempBoost) return { error: t('item.err.hasBoost', { name: shortName(player) }) };
        player.tempBoost = { attr, amount: 6 };
        message = t('item.msg.boost', { name: shortName(player), attr: ATTR_NAMES[attr] });
        break;
      }
      case 'MORALE':
        squad.forEach(p => { p.morale = Math.min(100, p.morale + 15); });
        message = t('item.msg.morale');
        break;
      case 'TACTIC':
        if (state.user.matchBoost) return { error: t('item.err.tactic') };
        state.user.matchBoost = { mid: 3 };
        message = t('item.msg.tactic');
        break;
      case 'SCOUT': {
        const um = userMatch(state);
        if (!um) return { error: t('item.err.scout') };
        const oppId = um.m.home === 'user' ? um.m.away : um.m.home;
        if (state.user.scout?.oppId === oppId) return { error: t('item.err.scout2') };
        const style = aiSetup(rng, state, oppId, state.user.styleHist || []).style;
        state.user.scout = { oppId, style };
        message = t('item.msg.scout', { club: state.clubs[oppId].name, styleK: `style.${style}.name` });
        break;
      }
      case 'RETRAIN': {
        const related = ['IV', 'LV', 'RV', 'ZDM', 'ZM', 'ZOM', 'LM', 'RM', 'LF', 'RF', 'ST']
          .filter(pos => pos !== player.position && !player.secondary.includes(pos) &&
            POSITION_GROUP[pos] === POSITION_GROUP[player.position]);
        if (!related.length || player.position === 'TW') return { error: t('item.err.retrain') };
        const pos = rng.pick(related);
        player.secondary.push(pos);
        message = t('item.msg.retrain', { name: shortName(player), pos: POS_LABEL[pos] });
        break;
      }
      case 'NEGOTIATE':
        if (player.contractDiscount) return { error: t('item.err.hasDiscount', { name: shortName(player) }) };
        player.contractDiscount = 0.82;
        message = t('item.msg.negotiate', { name: shortName(player) });
        break;
      case 'LOYALTY': {
        if (player.age >= 31) return { error: t('item.err.loyaltyAge', { name: shortName(player) }) };
        const c = ensureContract(state, player);
        c.until = Math.max(c.until, state.season) + 1;
        player.wantsRaise = false;
        player.morale = Math.min(100, player.morale + 5);
        message = t('item.msg.loyalty', { name: shortName(player), s: c.until });
        break;
      }
      default:
        return { error: t('err.itemMissing') };
    }
    return { ok: true };
  });
  if (res.error) return res;
  state.user.inventory.splice(idx, 1);
  return { ok: true, message };
}

// -----------------------------------------------------------------------------
// Kader-Aktionen
// -----------------------------------------------------------------------------

export function setUserSetup(state, patch) {
  ensureUserSetup(state);
  if (patch.lineup || patch.bench) state.user.autoLineup = false;
  const setup = { ...state.user.setup, ...patch };
  if (patch.formation && patch.formation !== state.user.setup.formation) {
    // Spieler auf neue Slots übertragen: gleiche Positionen bevorzugt
    const oldSlots = FORMATIONS[state.user.setup.formation].slots;
    const newSlots = FORMATIONS[patch.formation].slots;
    const players = oldSlots.map(s => ({ pos: s.pos, id: state.user.setup.lineup[s.id] })).filter(x => x.id);
    const lineup = {};
    const used = new Set();
    for (const s of newSlots) {
      const match = players.find(x => !used.has(x.id) && x.pos === s.pos);
      if (match) { lineup[s.id] = match.id; used.add(match.id); }
    }
    for (const s of newSlots) {
      if (lineup[s.id]) continue;
      const sameGroup = players.find(x => !used.has(x.id) && POSITION_GROUP[x.pos] === POSITION_GROUP[s.pos]);
      const any = sameGroup || players.find(x => !used.has(x.id));
      if (any) { lineup[s.id] = any.id; used.add(any.id); }
    }
    setup.lineup = lineup;
  }
  state.user.setup = repairLineup(state, 'user', setup);
  return state.user.setup;
}

export function autoLineup(state) {
  ensureUserSetup(state);
  const { lineup, bench } = bestLineup(state, 'user', state.user.setup.formation, { minCondition: 70 });
  state.user.setup = { ...state.user.setup, lineup, bench };
  return state.user.setup;
}

/** Spieler A auf den Platz von B (Slot-ID oder Bank-Index) */
export function placePlayer(state, playerId, target) {
  const setup = ensureUserSetup(state);
  state.user.autoLineup = false;
  const lineup = { ...setup.lineup };
  const bench = [...setup.bench];
  const fromSlot = Object.keys(lineup).find(k => lineup[k] === playerId);
  const fromBench = bench.indexOf(playerId);

  if (target.slot) {
    const occupant = lineup[target.slot];
    lineup[target.slot] = playerId;
    if (fromSlot) {
      if (occupant) lineup[fromSlot] = occupant; else delete lineup[fromSlot];
    } else if (fromBench >= 0) {
      if (occupant) bench[fromBench] = occupant; else bench.splice(fromBench, 1);
    } else if (occupant && bench.length < 7) {
      bench.push(occupant);
    }
  } else if (target.bench) {
    if (fromSlot) {
      const swapIn = target.swapWith;
      if (swapIn) {
        lineup[fromSlot] = swapIn;
        const bi = bench.indexOf(swapIn);
        if (bi >= 0) bench[bi] = playerId;
      } else {
        delete lineup[fromSlot];
        if (bench.length < 7) bench.push(playerId);
      }
    } else if (fromBench < 0 && bench.length < 7) {
      bench.push(playerId);
    }
  } else if (target.out) {
    if (fromSlot) delete lineup[fromSlot];
    if (fromBench >= 0) bench.splice(fromBench, 1);
  }
  state.user.setup = { ...setup, lineup, bench };
  return state.user.setup;
}

/**
 * Ein Tausch für alle Fälle: Spieler A geht an den Platz von Ziel B, B an den Platz von A.
 * Plätze sind Feld-Slot, Bankplatz oder "nicht im Kader".
 * target: { playerId } | { slot } (freie Position) | { bench: true } (freier Bankplatz)
 * Niemand fällt dabei stillschweigend aus dem Kader.
 */
export function swapPlayers(state, aId, target) {
  const setup = ensureUserSetup(state);
  if (!setup || !state.players[aId] || state.players[aId].clubId !== 'user') return { ok: false };
  const lineup = { ...setup.lineup };
  const bench = [...setup.bench];
  const locate = id => {
    const slot = Object.keys(lineup).find(k => lineup[k] === id);
    if (slot) return { type: 'slot', key: slot };
    const i = bench.indexOf(id);
    if (i >= 0) return { type: 'bench', idx: i };
    return { type: 'out' };
  };
  const put = (loc, id) => {
    if (loc.type === 'slot') { if (id) lineup[loc.key] = id; else delete lineup[loc.key]; }
    else if (loc.type === 'bench') { if (id) bench[loc.idx] = id; else bench[loc.idx] = null; }
  };
  const a = locate(aId);
  let b, bId = null;
  if (target.playerId) {
    bId = target.playerId;
    if (bId === aId || !state.players[bId] || state.players[bId].clubId !== 'user') return { ok: false };
    if ((state.players[bId].injury || state.players[bId].suspension) && a.type !== 'out') return { ok: false, reason: state.players[bId].injury ? 'injured' : 'suspended' };
    b = locate(bId);
  } else if (target.slot) {
    b = { type: 'slot', key: target.slot };
    bId = lineup[target.slot] || null;
  } else if (target.bench) {
    if (bench.length >= 7) return { ok: false };
    b = { type: 'bench', idx: bench.length };
    bench.push(null);
  } else return { ok: false };
  if ((state.players[aId].injury || state.players[aId].suspension) && b.type !== 'out') return { ok: false, reason: state.players[aId].injury ? 'injured' : 'suspended' };
  if (a.type === 'out' && b.type === 'out') return { ok: false };
  put(b, aId);
  put(a, bId);
  state.user.autoLineup = false;
  state.user.setup = { ...setup, lineup, bench: bench.filter(Boolean) };
  state.user.setup = repairLineup(state, 'user', state.user.setup);
  return { ok: true };
}

/** Co-Trainer stellt vor jedem Spiel die fitteste beste Elf auf */
export function setAutoLineup(state, on) {
  state.user.autoLineup = !!on;
  if (on) autoLineup(state);
  return { ok: true };
}

export function releasePlayer(state, playerId) {
  const club = state.clubs.user;
  const p = state.players[playerId];
  if (!p || p.clubId !== 'user') return { error: t('err.notInSquad') };
  if (club.playerIds.length <= 16) return { error: t('err.minSquad') };
  const pay = severance(state, p);
  if (pay > 0) ledger(state, 'ledger.severance', -pay, { name: displayName(p) });
  club.playerIds = club.playerIds.filter(id => id !== playerId);
  delete state.players[playerId];
  if (state.user.setup) state.user.setup = repairLineup(state, 'user', state.user.setup);
  addNews(state, 'squad', 'news.released', { name: displayName(p) });
  return { ok: true };
}

// -----------------------------------------------------------------------------
// Spieltag spielen
// -----------------------------------------------------------------------------


function setupFor(rng, state, clubId, vsUser = false) {
  if (vsUser && state.user.scout?.oppId === clubId) {
    const forced = aiSetup(rng, state, clubId, null);
    return { ...forced, style: state.user.scout.style };
  }
  if (clubId === 'user') {
    if (state.user.autoLineup) autoLineup(state);
    const setup = ensureUserSetup(state);
    return { ...setup, boosts: userBoosts(state) };
  }
  return aiSetup(rng, state, clubId, vsUser ? state.user.styleHist || [] : null);
}

function applyMatchEffects(rng, state, result, side, team, played) {
  const clubId = side === 'home' ? result.homeId : result.awayId;
  const gf = side === 'home' ? result.hg : result.ag;
  const ga = side === 'home' ? result.ag : result.hg;
  let outcome = gf > ga ? 'W' : gf < ga ? 'L' : 'D';
  if (outcome === 'D' && result.pens) outcome = (side === 'home' ? result.pens.h > result.pens.a : result.pens.a > result.pens.h) ? 'W' : 'L';

  const starters = result.lineups[side].map(l => l.playerId).filter(Boolean);
  const subsIn = result.subs.filter(s => s.side === side).map(s => s.inId);
  const fatigue = team.style.fatigue;

  for (const id of [...starters, ...subsIn]) {
    const p = state.players[id];
    if (!p) continue;
    played.add(id);
    const isSub = subsIn.includes(id);
    // Physis: robuste Spieler ermüden langsamer (etwa ±2 pro Spiel)
    const phyAdj = Math.round(((p.attrs.phy ?? 55) - 60) / 10);
    p.condition = Math.max(30, p.condition - (isSub ? 5 : Math.max(5, 10 + fatigue + rng.int(0, 3) + (p.age > 30 ? 2 : 0) - phyAdj)));
    p.morale = Math.max(20, Math.min(100, p.morale + (outcome === 'W' ? 4 : outcome === 'L' ? -4 : 1)));
    const rating = result.ratings[id];
    if (rating) {
      p.stats.apps++;
      p.careerStats.apps++;
      p.stats.ratingSum += rating;
      p.careerStats.ratingSum = (p.careerStats.ratingSum || 0) + rating;
      p.half = p.half || { apps: 0, ratingSum: 0 };
      p.half.apps++;
      p.half.ratingSum += rating;
      p.form = [...(p.form || []), rating].slice(-5);
    }
    const goals = result.goals.filter(g => g.scorerId === id).length;
    const assists = result.goals.filter(g => g.assistId === id).length;
    p.stats.goals += goals; p.careerStats.goals += goals;
    trackGoalStreak(p, goals);
    p.stats.assists += assists; p.careerStats.assists += assists;
    if (result.motm === id) p.stats.motm++;
  }
  // Karten und Sperren: Rot 1–3 Spiele, Gelb-Rot 1 Spiel, 5 Gelbe = 1 Spiel
  for (const c of (result.cards || []).filter(x => x.side === side)) {
    const p = state.players[c.playerId];
    if (!p) continue;
    p.stats.yellows = p.stats.yellows || 0;
    p.stats.reds = p.stats.reds || 0;
    let games = 0;
    let reason = '';
    if (c.type === 'Y') {
      p.stats.yellows++;
      p.yellowCount = (p.yellowCount || 0) + 1;
      if (p.yellowCount >= 5) { games = 1; reason = 'yellow5'; p.yellowCount = 0; }
    } else if (c.type === 'YR') {
      p.stats.reds++;
      games = 1; reason = 'yellowRed';
    } else {
      p.stats.reds++;
      games = rng.weighted([{ value: 1, weight: 5 }, { value: 2, weight: 3 }, { value: 3, weight: 1 }]);
      reason = 'red';
    }
    if (games) {
      p.suspension = { games: (p.suspension?.games || 0) + games, reason, fresh: true };
      if (clubId === 'user') {
        addNews(state, 'suspension', `news.ban.${reason}`, { short: shortName(p), name: displayName(p), n: games }, { playerId: p.id });
      }
    }
  }

  // Vereinsstatistik
  const club = state.clubs[clubId];
  if (club) {
    const i = side === 'home' ? 0 : 1;
    const cs = club.seasonStats || (club.seasonStats = newClubStats());
    cs.games++;
    cs[outcome === 'W' ? 'w' : outcome === 'L' ? 'l' : 'd']++;
    cs.gf += gf; cs.ga += ga;
    cs.poss += result.possession[i];
    cs.xg += result.stats.xg[i]; cs.xga += result.stats.xg[1 - i];
    cs.shots += result.stats.shots[i];
    if (ga === 0) cs.cleanSheets++;
    const myCards = (result.cards || []).filter(c => c.side === side);
    cs.yellows += myCards.filter(c => c.type === 'Y').length;
    cs.reds += myCards.filter(c => c.type !== 'Y').length;
  }
  // Zu-null für den Torwart der Startelf
  if (ga === 0) {
    const gkId = result.lineups[side].find(l => l.pos === 'TW')?.playerId;
    const gk = state.players[gkId];
    if (gk) {
      gk.stats.cleanSheets = (gk.stats.cleanSheets || 0) + 1;
      gk.careerStats.cleanSheets = (gk.careerStats.cleanSheets || 0) + 1;
    }
  }
  // Ewige Vereinsliste des eigenen Vereins (bleibt, auch wenn Spieler gehen)
  if (clubId === 'user') {
    const rec = state.clubRecords || (state.clubRecords = { players: {}, bestWin: null, worstLoss: null });
    for (const id of [...starters, ...subsIn]) {
      const p = state.players[id];
      if (!p) continue;
      const r = rec.players[id] || (rec.players[id] = { name: `${p.first} ${p.last}`, pos: p.position, apps: 0, goals: 0, assists: 0 });
      r.apps++;
      r.goals += result.goals.filter(g => g.scorerId === id).length;
      r.assists += result.goals.filter(g => g.assistId === id).length;
    }
    const margin = gf - ga;
    const score = `${gf}:${ga}`;
    const oppId = side === 'home' ? result.awayId : result.homeId;
    if (margin > 0 && (!rec.bestWin || margin > rec.bestWin.margin || (margin === rec.bestWin.margin && gf > rec.bestWin.gf))) rec.bestWin = { margin, gf, score, oppId, oppName: state.clubs[oppId]?.name, season: state.season };
    if (margin < 0 && (!rec.worstLoss || margin < rec.worstLoss.margin)) rec.worstLoss = { margin, score, oppId, oppName: state.clubs[oppId]?.name, season: state.season };
  }

  // Temporäre Karten gelten genau ein Spiel
  for (const id of state.clubs[clubId]?.playerIds || []) {
    if (state.players[id]?.tempBoost) state.players[id].tempBoost = null;
  }
  if (state.clubs[clubId]) state.clubs[clubId].halfGames = (state.clubs[clubId].halfGames || 0) + 1;
  for (const inj of result.injuries.filter(x => x.side === side)) {
    const p = state.players[inj.playerId];
    if (!p) continue;
    const days = rng.weighted([
      { value: 1, weight: 4 }, { value: 2, weight: 4 }, { value: 3, weight: 3 },
      { value: 5, weight: 2 }, { value: 8, weight: 1 }
    ]);
    const code = rng.int(0, 6);
    p.injury = { days, code };
    if (clubId === 'user') {
      addNews(state, 'injury', 'news.injury', { short: shortName(p), name: displayName(p), injK: `injury.${code}`, n: days }, { playerId: p.id });
    }
  }
  return outcome;
}

/**
 * Spielt den aktuellen Kalendertag komplett durch (alle Ligen, Pokal, Final Four).
 * Gibt das Ergebnis des Spiels des Spielers zurück (oder null, wenn er spielfrei ist).
 */
export function playDay(state) {
  const day = currentDay(state);
  if (!day) return null;
  if (state.pending) return null;
  let userResult = null;

  withRng(state, rng => {
    const matches = matchesForDay(state, day);
    const played = new Set();
    const participating = new Set();
    const userPlays = matches.some(e => e.m.home === 'user' || e.m.away === 'user');
    let userInfo = null;
    if (userPlays) applyPlanStart(state);

    for (const entry of matches) {
      const { m } = entry;
      participating.add(m.home);
      participating.add(m.away);
      const knockout = entry.comp !== 'league';
      const neutral = entry.comp === 'ff' && entry.stage === 'final';
      const hs = setupFor(rng, state, m.home, m.away === 'user');
      const as = setupFor(rng, state, m.away, m.home === 'user');
      if (m.home === 'user' || m.away === 'user') {
        const h = (state.user.styleHist ||= []);
        h.push(m.home === 'user' ? hs.style : as.style);
        if (h.length > 4) h.shift();
      }
      const home = buildTeam(state, m.home, hs);
      const away = buildTeam(state, m.away, as);
      const rival = rivalry(state.clubs[m.home], state.clubs[m.away]);
      const isUser = m.home === 'user' || m.away === 'user';
      const strengths = isUser ? { home: clubStrength(state, m.home), away: clubStrength(state, m.away) } : null;
      const result = simulateMatch(rng, home, away, { knockout, neutral, big: knockout || rival === 'derby', weather: weatherFor(state.seed, state.dayIndex) });
      result.rivalry = rival;
      m.hg = result.hg;
      m.ag = result.ag;
      if (result.pens) m.pens = result.pens;
      m.scorers = result.goals.map(g => ({ id: g.scorerId, side: g.side, minute: g.minute }));

      const oh = applyMatchEffects(rng, state, result, 'home', home, played);
      const oa = applyMatchEffects(rng, state, result, 'away', away, played);

      if (m.home === 'user' || m.away === 'user') {
        const side = m.home === 'user' ? 'home' : 'away';
        const outcome = side === 'home' ? oh : oa;
        const opponentId = side === 'home' ? m.away : m.home;
        if (rival === 'derby') {
          const oppName = state.clubs[opponentId].name;
          const score = side === 'home' ? `${result.hg}:${result.ag}` : `${result.ag}:${result.hg}`;
          if (outcome === 'W') addNews(state, 'derby', 'news.derbyWin', { opp: oppName, club: state.clubs.user.name, score }, { clubId: opponentId });
          else if (outcome === 'L') addNews(state, 'derby', 'news.derbyLoss', { opp: oppName, score }, { clubId: opponentId });
        }
        matchStories(state, {
          result, side, outcome, opponentId, rival, comp: entry.comp,
          strengths: { mine: strengths[side], opp: strengths[side === 'home' ? 'away' : 'home'] }
        });
        userResult = {
          result,
          rivalry: rival,
          side,
          outcome,
          opponentId,
          comp: entry.comp,
          label: dayLabel(state, day),
          analysis: analyzeMatch(state, result, side),
          finance: []
        };
        state.user.matchBoost = null;
        state.user.scout = null;
        userInfo = {
          outcome, home: side === 'home', derby: rival === 'derby',
          gf: side === 'home' ? result.hg : result.ag,
          starters: result.lineups[side].map(l => l.playerId).filter(Boolean), day
        };
      }
    }

    // Sperren laufen ab: zählt jedes Spiel des eigenen Vereins
    for (const p of Object.values(state.players)) {
      if (!p.suspension) continue;
      if (p.suspension.fresh) { delete p.suspension.fresh; continue; }
      if (!participating.has(p.clubId)) continue;
      p.suspension.games--;
      if (p.suspension.games <= 0) {
        p.suspension = null;
        if (p.clubId === 'user') addNews(state, 'suspension', 'news.unbanned', { short: shortName(p), name: displayName(p) }, { playerId: p.id });
      }
    }

    // Erholung aller Spieler, die heute nicht gespielt haben; Verletzungen heilen
    for (const p of Object.values(state.players)) {
      if (!played.has(p.id)) p.condition = Math.min(100, p.condition + 16);
      else p.condition = Math.min(100, p.condition + 5);
      if (p.injury && !played.has(p.id)) {
        p.injury.days--;
        if (p.injury.days <= 0) {
          p.injury = null;
          if (p.clubId === 'user') addNews(state, 'injury', 'news.fit', { short: shortName(p), name: displayName(p) }, { playerId: p.id });
        }
      }
    }
    if (userPlays) applyPlanEnd(state);

    // Finanzen des Spielers
    if (userResult) {
      const tier = state.clubs.user.tier;
      let income = matchIncome(tier, userResult.side === 'home' && !(day.type === 'ff_final'), userResult.outcome);
      if (userResult.rivalry === 'derby') income = Math.round(income * 1.25);
      income = Math.round(income * fanIncomeFactor(state));
      ledger(state, 'ledger.income', income, { day: userResult.label });
      userResult.finance.push({ label: 'fin.gate', amount: income });
      if (day.type === 'cup' && userResult.outcome === 'W') {
        const prize = CUP_PRIZES[day.round];
        ledger(state, 'ledger.cupPrize', prize, { roundK: `cup.${day.round}` });
        userResult.finance.push({ label: 'fin.cup', amount: prize });
      }
      if (day.type === 'ff_semi' && userResult.outcome === 'W') {
        ledger(state, 'fin.ff', FINAL_FOUR_PRIZES.semi);
        userResult.finance.push({ label: 'fin.ff', amount: FINAL_FOUR_PRIZES.semi });
      }
      if (day.type === 'ff_final' && userResult.outcome === 'W') {
        ledger(state, 'fin.title', FINAL_FOUR_PRIZES.final);
        userResult.finance.push({ label: 'fin.title', amount: FINAL_FOUR_PRIZES.final });
      }
    }
    if (day.type === 'league') {
      const wages = weeklyWages(state, 'user');
      ledger(state, 'ledger.wages', -wages, { md: day.md });
      if (userResult) userResult.finance.push({ label: 'fin.wages', amount: -wages });
      handleWages(state);
    }
    if (userInfo) { afterUserMatch(state, userInfo); resolveInterview(state, userInfo.outcome); }

    matchdayStories(rng, state, day);
    contractMood(state);
    for (const o of processTransferDay(rng, state)) {
      const p = state.players[o.playerId];
      addNews(state, 'transfer', o.unsolicited ? 'news.bidIn' : 'news.offerIn',
        { short: shortName(p), name: displayName(p), club: state.clubs[o.clubId].name, amountC: o.amount }, { playerId: p.id, clubId: o.clubId });
    }
    // Belohnung: nach Siegen öfter eine Verbrauchskarte
    if (userResult) {
      const chance = userResult.outcome === 'W' ? 0.55 : userResult.outcome === 'D' ? 0.2 : 0.05;
      if (rng.chance(chance)) {
        const item = { id: `i${++state.nextId}`, ...generateItems(rng, 1)[0] };
        state.user.inventory.push(item);
        userResult.reward = item;
      }
    }
    afterDay(rng, state, day);
    previewStories(state);
  });

  if (userResult) {
    state.lastMatch = { ...userResult, season: state.season, dayIndex: state.dayIndex - 1 };
    const r = userResult.result;
    state.matchLog.unshift({
      season: state.season,
      label: userResult.label,
      opponentId: userResult.opponentId,
      side: userResult.side,
      hg: r.hg, ag: r.ag, pens: r.pens,
      outcome: userResult.outcome
    });
    if (state.matchLog.length > 60) state.matchLog.length = 60;
  }
  return userResult;
}

/** Gehälter nicht bezahlt → Moral sinkt; nach drei Spieltagen geht der teuerste Spieler */
function handleWages(state) {
  const club = state.clubs.user;
  const squad = clubPlayers(state, 'user');
  const wages = weeklyWages(state, 'user');
  const cap = wageCap(club.tier);
  if (club.coins < 0) {
    state.user.unpaidDays++;
    squad.forEach(p => { p.morale = Math.max(20, p.morale - 10); });
    addNews(state, 'finance', 'news.unpaid');
    if (state.user.unpaidDays >= 3 && squad.length > 16) {
      const top = [...squad].sort((a, b) => wageOf(b) - wageOf(a))[0];
      club.playerIds = club.playerIds.filter(id => id !== top.id);
      // Spieler wechselt zu einem KI-Verein der passenden Liga
      const targetTier = Math.max(1, club.tier - 1);
      const target = state.leagues[targetTier].clubIds.find(id => id !== 'user');
      top.clubId = target;
      state.clubs[target].playerIds.push(top.id);
      state.user.unpaidDays = 0;
      addNews(state, 'finance', 'news.walkout', { name: displayName(top), club: state.clubs[target].name }, { clubId: target, playerId: top.id });
      state.user.setup = repairLineup(state, 'user', state.user.setup);
    }
  } else {
    state.user.unpaidDays = 0;
    if (wages > cap * 1.15) {
      squad.forEach(p => { p.morale = Math.max(20, p.morale - 2); });
    }
  }
}

function afterDay(rng, state, day) {
  if (day.type === 'league' && day.md === 9) {
    const changes = developAll(rng, state, false);
    recordHistory(state);
    state.devReport = { tk: 'dev.titleMid', tp: { season: state.season }, changes };
    addNews(state, 'development', 'news.midseason');
    checkRaiseWishes(state);
    worldTransferNews(state, aiTransferWindow(rng, state, 0.15));
  }
  if (day.type === 'league' && day.md === 12) expiryWarning(state);
  if (day.type === 'cup') {
    const round = state.cup.rounds[day.round];
    const winners = round.map(matchWinner);
    const userMatchCup = round.find(m => m.home === 'user' || m.away === 'user');
    if (userMatchCup) {
      const won = matchWinner(userMatchCup) === 'user';
      if (!won) state.cup.userOut = day.round;
    }
    if (day.round < 6) {
      const next = day.round === 1 ? [...winners, ...state.cup.byes] : winners;
      state.cup.rounds[day.round + 1] = drawCupRound(rng, state, next);
      const um = state.cup.rounds[day.round + 1].find(m => m.home === 'user' || m.away === 'user');
      if (um) {
        const opp = state.clubs[um.home === 'user' ? um.away : um.home];
        addNews(state, 'cup', 'news.cupDraw', { roundK: `cup.${day.round + 1}`, opp: opp.name, tier: opp.tier, venueK: um.home === 'user' ? 'w.home' : 'w.away' }, { clubId: opp.id });
      }
    } else {
      state.cup.winner = winners[0];
      if (winners[0] === 'user') {
        addNews(state, 'trophy', 'news.cupWin', { club: state.clubs.user.name });
      }
    }
  }
  if (day.type === 'league' && day.md === MATCHDAYS) {
    for (let tier = 1; tier <= 6; tier++) state.finalFours[tier] = createFinalFour(state, tier);
    const userTable = computeTable(state, state.clubs.user.tier);
    const pos = userTable.find(r => r.clubId === 'user').pos;
    if (pos <= 4) addNews(state, 'ff', state.clubs.user.tier === 1 ? 'news.ffTitle' : 'news.ffUp', { pos });
  }
  if (day.type === 'ff_semi') {
    for (const ff of Object.values(state.finalFours)) {
      const [a, b] = ff.semis.map(matchWinner);
      const seedOf = id => ff.seeds.indexOf(id);
      ff.final = seedOf(a) <= seedOf(b) ? { home: a, away: b } : { home: b, away: a };
      if (ff.tier > 1) ff.promoted = [a, b];
      if (ff.tier > 1 && (a === 'user' || b === 'user')) {
        addNews(state, 'trophy', 'news.promoted', { club: state.clubs.user.name, league: LEAGUE_INFO[ff.tier - 1].name });
      }
    }
  }
  if (day.type === 'ff_final') {
    for (const ff of Object.values(state.finalFours)) ff.champion = matchWinner(ff.final);
  }

  state.dayIndex++;
  if (state.dayIndex >= state.calendar.length) {
    endSeason(rng, state);
  }
}

function developAll(rng, state, aging) {
  const changes = [];
  for (const p of Object.values(state.players)) {
    const half = p.half || { apps: 0, ratingSum: 0 };
    const games = state.clubs[p.clubId]?.halfGames || 9;
    const share = Math.min(1, half.apps / Math.max(1, games));
    const avg = half.apps >= 3 ? half.ratingSum / half.apps : null;
    const before = p.ovr;
    const delta = p.academy
      ? developPlayer(rng, p, academyShare(state), null)
      : developPlayer(rng, p, share, avg, p.clubId === 'user' ? planDevMod(state, p) : 0);
    if (aging) p.age++;
    if (p.clubId === 'user') {
      p.lastDelta = delta;
      changes.push({ id: p.id, before, after: p.ovr, delta, apps: half.apps, avg, share });
    }
    p.half = { apps: 0, ratingSum: 0 };
  }
  for (const c of Object.values(state.clubs)) c.halfGames = 0;
  resetPlanWeeks(state);
  changes.sort((a, b) => b.delta - a.delta);
  return changes;
}

/** Stärkeverlauf für die Karrierekurve */
function recordHistory(state) {
  for (const p of Object.values(state.players)) {
    if (p.clubId !== 'user') continue;
    p.ovrHistory = [...(p.ovrHistory || []), { s: state.season, h: state.dayIndex < 12 ? 1 : 2, ovr: p.ovr }].slice(-16);
  }
}

export function acknowledgeDevReport(state) {
  state.devReport = null;
}

// -----------------------------------------------------------------------------
// Saisonende
// -----------------------------------------------------------------------------

function endSeason(rng, state) {
  const summary = { season: state.season, moves: [], retired: [], user: null };
  summary.champions = {};
  for (let tier = 1; tier <= 6; tier++) if (state.finalFours[tier]?.champion) summary.champions[tier] = state.finalFours[tier].champion;
  summary.cupWinner = state.cup?.winner || null;
  summary.leaders = {};
  const tables = {};
  for (let tier = 1; tier <= 6; tier++) { tables[tier] = computeTable(state, tier); summary.leaders[tier] = tables[tier][0]?.clubId; }

  const promoted = {};
  const relegated = {};
  for (let tier = 1; tier <= 6; tier++) {
    promoted[tier] = tier > 1 ? (state.finalFours[tier]?.promoted || []) : [];
    relegated[tier] = tier < 6 ? tables[tier].slice(8).map(r => r.clubId) : [];
  }

  // Bilanz des Spielers
  const userTier = state.clubs.user.tier;
  const row = tables[userTier].find(r => r.clubId === 'user');
  const ff = state.finalFours[userTier];
  const userSummary = {
    season: state.season,
    tier: userTier,
    pos: row.pos,
    pts: row.pts,
    gd: row.gd,
    promoted: promoted[userTier].includes('user'),
    relegated: relegated[userTier].includes('user'),
    champion: ff?.champion === 'user',
    // Codes statt Texte: W = Sieger, F = Finale, SF = Halbfinale; Pokal: 'W' oder Runde des Ausscheidens
    ffStage: ff && ff.seeds.includes('user') ? (ff.champion === 'user' ? 'W' : ff.final && (ff.final.home === 'user' || ff.final.away === 'user') ? 'F' : 'SF') : null,
    cup: state.cup.winner === 'user' ? 'W' : state.cup.userOut || 0
  };
  const prize = seasonPrize(userTier, row.pos);
  ledger(state, 'ledger.seasonPrize', prize, { pos: row.pos });
  userSummary.prize = prize;
  userSummary.goal = closeSeasonLife(state, userTier, row.pos);
  summary.awards = seasonAwards(state, userTier);

  // Chronik aller Vereine und Karriere-Stationen aller Spieler (vor Auf- und Abstieg)
  const cupStage = clubId => {
    if (state.cup.winner === clubId) return 'W';
    let reached = 0;
    for (const [r, ms] of Object.entries(state.cup.rounds)) if (ms.some(m => m.home === clubId || m.away === clubId)) reached = Math.max(reached, Number(r));
    return reached;
  };
  for (let tier = 1; tier <= 6; tier++) {
    const ffT = state.finalFours[tier];
    for (const r of tables[tier]) {
      const club = state.clubs[r.clubId];
      club.history = [{
        s: state.season, tier, pos: r.pos, pts: r.pts, gf: r.gf, ga: r.ga,
        champ: ffT?.champion === r.clubId, up: promoted[tier].includes(r.clubId), down: relegated[tier].includes(r.clubId),
        cup: cupStage(r.clubId)
      }, ...(club.history || [])].slice(0, 30);
    }
  }
  for (const p of Object.values(state.players)) {
    const club = state.clubs[p.clubId];
    if (!club || !p.stats.apps) continue;
    p.career = [...(p.career || []), {
      s: state.season, c: club.id, n: club.name, t: club.tier,
      apps: p.stats.apps, goals: p.stats.goals, assists: p.stats.assists, rs: Math.round(p.stats.ratingSum * 10) / 10
    }].slice(-25);
  }

  // Auf- und Abstieg
  for (let tier = 1; tier <= 6; tier++) {
    for (const id of promoted[tier]) {
      state.clubs[id].tier = tier - 1;
      summary.moves.push({ id, from: tier, to: tier - 1 });
    }
    for (const id of relegated[tier]) {
      state.clubs[id].tier = tier + 1;
      summary.moves.push({ id, from: tier, to: tier + 1 });
    }
  }
  for (let tier = 1; tier <= 6; tier++) {
    state.leagues[tier].clubIds = Object.values(state.clubs).filter(c => c.tier === tier).map(c => c.id);
  }
  if (userSummary.relegated) {
    addNews(state, 'season', 'news.relegated', { club: state.clubs.user.name, league: LEAGUE_INFO[userTier + 1].name });
  }

  // Entwicklung zweite Saisonhälfte, Alterung, Karriereende
  const devChanges = developAll(rng, state, true);
  for (const p of Object.values(state.players)) {
    if (p.age >= 33) {
      const prob = p.age >= 38 ? 1 : 0.12 + (p.age - 33) * 0.2;
      if (rng.chance(prob)) {
        const club = state.clubs[p.clubId];
        if (club) club.playerIds = club.playerIds.filter(id => id !== p.id);
        if (p.clubId === 'user') {
          summary.retired.push({ name: displayName(p), age: p.age, apps: p.careerStats.apps, goals: p.careerStats.goals });
          addNews(state, 'squad', 'news.retired', { name: displayName(p), age: p.age, apps: p.careerStats.apps, goals: p.careerStats.goals });
        }
        delete state.players[p.id];
      }
    }
  }

  // Auslaufende Verträge
  summary.leftFree = expireContracts(rng, state);
  state.user.offers = [];
  state.user.counters = {};

  // Transferfenster der KI-Vereine
  const aiMoves = aiTransferWindow(rng, state);
  summary.aiMoves = aiMoves.length;
  worldTransferNews(state, aiMoves);

  // Jugendakademie: 19-Jährige rücken in den Profikader, neue Talente kommen in die Akademie
  const grads = academyGraduates(state);
  const filled = academyFillSquad(state, 16);
  const intake = academyIntake(rng, state);
  state.user.plan = null;

  // Notfall: Kader nie unter 16, notfalls direkt aus der Jugend
  const youth = [];
  const userClub = state.clubs.user;
  const wantYouth = Math.max(0, 16 - userClub.playerIds.length);
  for (let i = 0; i < wantYouth && userClub.playerIds.length < MAX_SQUAD; i++) {
    const counts = {};
    clubPlayers(state, 'user').forEach(p => { counts[POSITION_GROUP[p.position]] = (counts[POSITION_GROUP[p.position]] || 0) + 1; });
    const need = [['GK', 2], ['DEF', 6], ['MID', 6], ['ATT', 4]].find(([g, n]) => (counts[g] || 0) < n);
    const pos = need ? rng.pick({ GK: ['TW'], DEF: ['IV', 'LV', 'RV'], MID: ['ZDM', 'ZM', 'ZOM', 'LM', 'RM'], ATT: ['ST', 'LF', 'RF'] }[need[0]])
      : rng.pick(['IV', 'ZM', 'ST', 'LF', 'RF', 'ZOM', 'LV', 'RV']);
    const tierRoll = rng.weighted([{ value: 'bronze', weight: 70 }, { value: 'silver', weight: 27 }, { value: 'gold', weight: 3 }]);
    const age = rng.int(16, 17);
    const potential = rng.int(TIERS[tierRoll].potMin, TIERS[tierRoll].potMax);
    const ovr = Math.max(38, potential - rng.int(15, 21));
    const p = createPlayer(rng, { id: `p${(++state.nextId).toString(36)}`, position: pos, age, ovr, potential, tier: tierRoll, home: userClub.country || 'GER', homeBias: 0.7 });
    p.clubId = 'user';
    p.ovrHistory = [{ s: state.season, h: 0, ovr: p.ovr }];
    state.players[p.id] = p;
    userClub.playerIds.push(p.id);
    p.fromYouth = true;
    p.contract = { wage: salaryFor(p.ovr), until: state.season + 3 };
    youth.push(p);
  }
  const promotedIds = [...grads.promoted, ...filled, ...youth.map(p => p.id)];
  if (promotedIds.length) {
    const list = promotedIds.map(id => state.players[id]).filter(Boolean);
    summary.youth = promotedIds;
    addNews(state, 'squad', 'news.youth', { list: list.map(p => displayName(p)).join(', '), n: list.length }, { playerId: list[0]?.id, playerIds: promotedIds });
  }
  summary.academy = { intake: intake.map(p => p.id), released: grads.released, level: state.user.academy.level };
  if (intake.length) {
    addNews(state, 'squad', 'news.academyIntake', { list: intake.map(p => displayName(p)).join(', '), n: intake.length }, { playerId: intake[0].id, playerIds: intake.map(p => p.id) });
  }
  for (const name of grads.released) addNews(state, 'squad', 'news.academyReleased', { name });

  // KI-Kader auffüllen (Nachwuchs)
  const template = ['TW', 'TW', 'IV', 'IV', 'IV', 'IV', 'LV', 'LV', 'RV', 'ZDM', 'ZDM', 'ZM', 'ZM', 'ZM', 'ZOM', 'LM', 'LF', 'RF', 'ST', 'ST', 'RM'];
  for (const club of Object.values(state.clubs)) {
    if (club.isUser) continue;
    const squad = clubPlayers(state, club.id);
    const counts = {};
    squad.forEach(p => { counts[p.position] = (counts[p.position] || 0) + 1; });
    const need = [];
    const tcount = {};
    for (const pos of template) {
      tcount[pos] = (tcount[pos] || 0) + 1;
      if ((counts[pos] || 0) < tcount[pos]) need.push(pos);
    }
    while (club.playerIds.length < AI_SQUAD_SIZE) {
      const pos = need.shift() || rng.pick(template);
      const isCore = rng.chance(0.3);
      createClubPlayer(rng, state, club, pos, isCore, { age: isCore ? rng.int(22, 28) : rng.int(17, 20) });
    }
  }

  // Trainerwechsel: nach Abstieg oder schwacher Saison oft, sonst selten. Neuer Trainer, neue Philosophie.
  for (const club of Object.values(state.clubs)) {
    if (club.isUser) continue;
    const oldTier = summary.moves.find(m => m.id === club.id)?.from ?? club.tier;
    const pos = tables[oldTier].find(r => r.clubId === club.id)?.pos ?? 5;
    const down = relegated[oldTier]?.includes(club.id);
    const chance = down ? 0.65 : pos >= 8 ? 0.35 : pos <= 2 ? 0.03 : 0.1;
    if (rng.chance(chance)) {
      const prev = club.coach;
      club.coach = newCoach(rng, club.preferredStyle, club.country);
      club.preferredStyle = club.coach.style;
      if (prev && (club.tier === state.clubs.user.tier)) {
        addNews(state, 'coach', 'news.coach', { club: club.name, old: prev.name, coach: club.coach.name, styleK: `style.${club.coach.style}.name` }, { clubId: club.id });
      }
    }
  }

  state.history.unshift(userSummary);
  summary.user = userSummary;
  state.seasonSummary = summary;

  // Pokal-Freilose: Top 4 der Liga 1
  const byes = tables[1].slice(0, 4).map(r => r.clubId).map(id => id);
  state.season++;
  checkRaiseWishes(state);
  startSeason(rng, state, byes.filter(id => state.clubs[id].tier === 1).length === 4 ? byes : null);
  state.user.setup = state.user.setup ? repairLineup(state, 'user', state.user.setup) : null;
  recordHistory(state);
  state.devReport = {
    tk: 'dev.titleSummer', tp: { season: state.season },
    changes: devChanges.filter(c => state.players[c.id])
  };
  addNews(state, 'season', 'news.newSeason', { season: state.season, league: LEAGUE_INFO[state.clubs.user.tier].name });
}

export function acknowledgeSeasonSummary(state) {
  state.seasonSummary = null;
}

export function dismissTips(state) {
  state.user.tipsDismissed = true;
}

export function markRead(state, id) {
  const n = state.inbox.find(x => x.id === id);
  if (n) n.read = true;
}

export function markAllRead(state) {
  state.inbox.forEach(n => { if (newsChannel(n) === 'inbox') n.read = true; });
}

/** Zeitung geöffnet: alle Zeitungsmeldungen gelten als gelesen */
export function markFeedRead(state) {
  state.inbox.forEach(n => { if (newsChannel(n) === 'feed') n.read = true; });
}

/** Wechsel zwischen KI-Vereinen als Zeitungsmeldung (die drei stärksten) */
function worldTransferNews(state, moves) {
  const notable = moves.map(m => ({ ...m, p: state.players[m.playerId] })).filter(m => m.p)
    .sort((a, b) => b.p.ovr - a.p.ovr).slice(0, 3);
  for (const m of notable.reverse()) {
    addNews(state, 'world', 'news.worldMove', { name: displayName(m.p), short: shortName(m.p), from: state.clubs[m.from]?.name || '', to: state.clubs[m.to]?.name || '', ovr: m.p.ovr },
      { playerId: m.playerId, clubIds: [m.to, m.from].filter(id => state.clubs[id]) });
  }
}

export { createRng };
