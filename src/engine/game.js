// =============================================================================
// Spielablauf: Neues Spiel, Spieltage, Saisonende.
// Alle Funktionen hier verändern den übergebenen Spielstand direkt. Der Store
// arbeitet immer auf einer Kopie – so bleibt jeder Schritt sauber nachvollziehbar.
// Diese Datei ist die „Naht“ für einen späteren Mehrspieler-Server.
// =============================================================================

import { createRng, withRng } from './rng.js';
import { FORMATIONS, MATCHDAYS, MAX_SQUAD, AI_SQUAD_SIZE, STYLE_KEYS, POSITION_GROUP, TIERS } from './constants.js';
import { createWorld, clubPlayers, createClubPlayer, LEAGUE_INFO, clubStrength } from './world.js';
import { roundRobin, buildCalendar, createCup, drawCupRound, computeTable, createFinalFour, matchWinner, matchLoser, CUP_ROUND_NAMES } from './schedule.js';
import { buildTeam, simulateMatch, analyzeMatch } from './match.js';
import { aiSetup, bestLineup, repairLineup } from './ai.js';
import { developPlayer, shortName, displayName, salaryFor, createPlayer } from './player.js';
import { generateStarterSquad, generateStarDraft, generateDraft, generateItems, PACKS, CONSUMABLES } from './packs.js';
import { matchIncome, seasonPrize, CUP_PRIZES, FINAL_FOUR_PRIZES, weeklyWages, wageCap } from './economy.js';
import { trainPlayer } from './player.js';

export const SAVE_VERSION = 1;

// -----------------------------------------------------------------------------
// Neues Spiel
// -----------------------------------------------------------------------------

export function createGame({ seed, clubName, primary, secondary, crest, pattern }) {
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
      autoLineup: true
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
    createWorld(rng, state, { name: clubName, primary, secondary, crest, pattern });
    startSeason(rng, state, null);
  });
  state.user.inventory = ['FITNESS', 'FITNESS', 'TRAIN', 'MORALE', 'TACTIC'].map(type => ({ id: `i${++state.nextId}`, type }));
  addNews(state, 'welcome', 'Willkommen, Trainer!',
    `${clubName} startet in der ${LEAGUE_INFO[6].name}. Ziel: Platz 1–4 für das Final Four – die beiden Halbfinalsieger steigen auf. Öffne zuerst dein Starter-Pack.`);
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
    p.stats = { apps: 0, goals: 0, assists: 0, ratingSum: 0, motm: 0 };
  }
}

// -----------------------------------------------------------------------------
// Hilfen
// -----------------------------------------------------------------------------

export function addNews(state, type, title, text, extra = {}) {
  state.inbox.unshift({
    id: `n${++state.nextId}`,
    type, title, text,
    season: state.season,
    day: state.dayIndex,
    read: false,
    ...extra
  });
  if (state.inbox.length > 80) state.inbox.length = 80;
}

function ledger(state, label, amount) {
  state.clubs.user.coins += amount;
  state.user.ledger.unshift({ season: state.season, day: state.dayIndex, label, amount });
  if (state.user.ledger.length > 60) state.user.ledger.length = 60;
}

export function currentDay(state) {
  return state.calendar[state.dayIndex] || null;
}

export function dayLabel(state, day = currentDay(state)) {
  if (!day) return 'Saisonende';
  if (day.type === 'league') return `Spieltag ${day.md}`;
  if (day.type === 'cup') return `Pokal, ${CUP_ROUND_NAMES[day.round]}`;
  if (day.type === 'ff_semi') return 'Final Four, Halbfinale';
  if (day.type === 'ff_final') return 'Final Four, Finale';
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
      state.players[p.id] = p;
      state.clubs.user.playerIds.push(p.id);
    }
    const candidates = generateStarDraft(rng, state);
    state.pending = { type: 'draft', source: 'star', title: 'Starspieler-Wahl', candidates };
    return squad.map(p => p.id);
  });
}

export function buyPack(state, packKey) {
  const pack = PACKS[packKey];
  const club = state.clubs.user;
  if (!pack) return { error: 'Unbekanntes Pack.' };
  if (state.pending) return { error: 'Erst das offene Pack abschließen.' };
  if (club.coins < pack.price) return { error: 'Nicht genug Münzen.' };
  if (pack.kind === 'draft' && club.playerIds.length >= MAX_SQUAD) {
    return { error: `Kader voll (${MAX_SQUAD}). Gib zuerst einen Spieler ab.` };
  }
  ledger(state, pack.name, -pack.price);
  return withRng(state, rng => {
    if (pack.kind === 'draft') {
      state.pending = { type: 'draft', source: packKey, title: pack.name, candidates: generateDraft(rng, state, packKey) };
    } else {
      const items = generateItems(rng, pack.count).map(type => ({ id: `i${++state.nextId}`, type }));
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
  state.players[p.id] = p;
  state.clubs.user.playerIds.push(p.id);
  const wasStar = state.pending.source === 'star';
  state.pending = null;
  if (wasStar) {
    ensureUserSetup(state);
    addNews(state, 'squad', `${displayName(p)} ist dein Starspieler`,
      `${displayName(p)} (${p.position}, ${p.ovr}) führt dein Team an. Prüfe die Aufstellung im Kader und lege los!`);
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
  if (idx < 0) return { error: 'Gegenstand nicht gefunden.' };
  const item = state.user.inventory[idx];
  const def = CONSUMABLES[item.type];
  const squad = clubPlayers(state, 'user');
  const player = playerId ? state.players[playerId] : null;
  if ((def.target === 'player' || def.target === 'injured') && (!player || player.clubId !== 'user')) {
    return { error: 'Bitte einen Spieler wählen.' };
  }
  let message = '';
  const res = withRng(state, rng => {
    switch (item.type) {
      case 'FITNESS':
        player.condition = Math.min(100, player.condition + 35);
        message = `${shortName(player)} ist wieder frisch (${player.condition} %).`;
        break;
      case 'REGEN':
        squad.forEach(p => { p.condition = Math.min(100, p.condition + 12); });
        message = 'Der ganze Kader hat sich erholt (+12 Fitness).';
        break;
      case 'MEDICAL':
        if (!player.injury) return { error: `${shortName(player)} ist nicht verletzt.` };
        player.injury.days = Math.max(0, player.injury.days - 4);
        if (player.injury.days === 0) player.injury = null;
        message = player.injury ? `${shortName(player)} fällt nur noch ${player.injury.days} Spieltage aus.` : `${shortName(player)} ist wieder fit!`;
        break;
      case 'TRAIN':
      case 'TRAIN_PLUS': {
        const delta = trainPlayer(rng, player, item.type === 'TRAIN' ? 1.6 : 3.4);
        message = delta > 0 ? `${shortName(player)} verbessert sich auf ${player.ovr} (+${delta}).` : `${shortName(player)} ist an seiner Grenze – kaum noch Fortschritt.`;
        break;
      }
      case 'MORALE':
        squad.forEach(p => { p.morale = Math.min(100, p.morale + 15); });
        message = 'Die Kabine brennt! +15 Moral für alle.';
        break;
      case 'TACTIC':
        if (state.user.matchBoost) return { error: 'Für das nächste Spiel ist schon eine Taktiktafel aktiv.' };
        state.user.matchBoost = { mid: 3 };
        message = 'Taktiktafel aktiv: Mittelfeld +3 im nächsten Spiel.';
        break;
      case 'RETRAIN': {
        const related = ['IV', 'LV', 'RV', 'ZDM', 'ZM', 'ZOM', 'LM', 'RM', 'LF', 'RF', 'ST']
          .filter(pos => pos !== player.position && !player.secondary.includes(pos) &&
            POSITION_GROUP[pos] === POSITION_GROUP[player.position]);
        if (!related.length || player.position === 'TW') return { error: 'Für diesen Spieler gibt es keine passende Umschulung.' };
        const pos = rng.pick(related);
        player.secondary.push(pos);
        message = `${shortName(player)} beherrscht jetzt auch ${pos}.`;
        break;
      }
      default:
        return { error: 'Unbekannter Gegenstand.' };
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

/** Co-Trainer stellt vor jedem Spiel die fitteste beste Elf auf */
export function setAutoLineup(state, on) {
  state.user.autoLineup = !!on;
  if (on) autoLineup(state);
  return { ok: true };
}

export function releasePlayer(state, playerId) {
  const club = state.clubs.user;
  const p = state.players[playerId];
  if (!p || p.clubId !== 'user') return { error: 'Spieler nicht im Kader.' };
  if (club.playerIds.length <= 16) return { error: 'Mindestens 16 Spieler müssen im Kader bleiben.' };
  club.playerIds = club.playerIds.filter(id => id !== playerId);
  delete state.players[playerId];
  if (state.user.setup) state.user.setup = repairLineup(state, 'user', state.user.setup);
  addNews(state, 'squad', `${displayName(p)} verlässt den Verein`, `Der Vertrag mit ${displayName(p)} wurde aufgelöst. Er beendet seine Laufbahn im Profifußball.`);
  return { ok: true };
}

// -----------------------------------------------------------------------------
// Spieltag spielen
// -----------------------------------------------------------------------------

const INJURY_LABELS = ['Muskelfaserriss', 'Bänderdehnung', 'Prellung', 'Zerrung', 'Sprunggelenk', 'Knieverletzung', 'Leistenprobleme'];

function setupFor(rng, state, clubId) {
  if (clubId === 'user') {
    if (state.user.autoLineup) autoLineup(state);
    const setup = ensureUserSetup(state);
    return { ...setup, boosts: state.user.matchBoost || {} };
  }
  return aiSetup(rng, state, clubId);
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
    p.condition = Math.max(30, p.condition - (isSub ? 5 : 10 + fatigue + rng.int(0, 3) + (p.age > 30 ? 2 : 0)));
    p.morale = Math.max(20, Math.min(100, p.morale + (outcome === 'W' ? 4 : outcome === 'L' ? -4 : 1)));
    const rating = result.ratings[id];
    if (rating) {
      p.stats.apps++;
      p.careerStats.apps++;
      p.stats.ratingSum += rating;
      p.form = [...(p.form || []), rating].slice(-5);
    }
    const goals = result.goals.filter(g => g.scorerId === id).length;
    const assists = result.goals.filter(g => g.assistId === id).length;
    p.stats.goals += goals; p.careerStats.goals += goals;
    p.stats.assists += assists; p.careerStats.assists += assists;
    if (result.motm === id) p.stats.motm++;
  }
  for (const inj of result.injuries.filter(x => x.side === side)) {
    const p = state.players[inj.playerId];
    if (!p) continue;
    const days = rng.weighted([
      { value: 1, weight: 4 }, { value: 2, weight: 4 }, { value: 3, weight: 3 },
      { value: 5, weight: 2 }, { value: 8, weight: 1 }
    ]);
    p.injury = { days, label: rng.pick(INJURY_LABELS) };
    if (clubId === 'user') {
      addNews(state, 'injury', `${shortName(p)} verletzt`, `${displayName(p)} fällt mit ${p.injury.label} voraussichtlich ${days} ${days === 1 ? 'Spiel' : 'Spiele'} aus.`, { playerId: p.id });
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

    for (const entry of matches) {
      const { m } = entry;
      participating.add(m.home);
      participating.add(m.away);
      const knockout = entry.comp !== 'league';
      const neutral = entry.comp === 'ff' && entry.stage === 'final';
      const hs = setupFor(rng, state, m.home);
      const as = setupFor(rng, state, m.away);
      const home = buildTeam(state, m.home, hs);
      const away = buildTeam(state, m.away, as);
      const result = simulateMatch(rng, home, away, { knockout, neutral });
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
        userResult = {
          result,
          side,
          outcome,
          opponentId,
          comp: entry.comp,
          label: dayLabel(state, day),
          analysis: analyzeMatch(state, result, side),
          finance: []
        };
        state.user.matchBoost = null;
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
          if (p.clubId === 'user') addNews(state, 'injury', `${shortName(p)} ist wieder fit`, `${displayName(p)} steht wieder zur Verfügung.`, { playerId: p.id });
        }
      }
    }

    // Finanzen des Spielers
    if (userResult) {
      const tier = state.clubs.user.tier;
      const income = matchIncome(tier, userResult.side === 'home' && !(day.type === 'ff_final'), userResult.outcome);
      ledger(state, `Einnahmen ${userResult.label}`, income);
      userResult.finance.push({ label: 'Zuschauer & Sponsoren', amount: income });
      if (day.type === 'cup' && userResult.outcome === 'W') {
        const prize = CUP_PRIZES[day.round];
        ledger(state, `Pokalprämie ${CUP_ROUND_NAMES[day.round]}`, prize);
        userResult.finance.push({ label: 'Pokalprämie', amount: prize });
      }
      if (day.type === 'ff_semi' && userResult.outcome === 'W') {
        ledger(state, 'Final-Four-Prämie', FINAL_FOUR_PRIZES.semi);
        userResult.finance.push({ label: 'Final-Four-Prämie', amount: FINAL_FOUR_PRIZES.semi });
      }
      if (day.type === 'ff_final' && userResult.outcome === 'W') {
        ledger(state, 'Titelprämie', FINAL_FOUR_PRIZES.final);
        userResult.finance.push({ label: 'Titelprämie', amount: FINAL_FOUR_PRIZES.final });
      }
    }
    if (day.type === 'league') {
      const wages = weeklyWages(state, 'user');
      ledger(state, `Gehälter Spieltag ${day.md}`, -wages);
      if (userResult) userResult.finance.push({ label: 'Gehälter', amount: -wages });
      handleWages(state);
    }

    afterDay(rng, state, day);
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
    addNews(state, 'finance', 'Gehälter nicht gezahlt!',
      `Die Kasse ist leer. Die Spieler sind sauer (Moral −10). Nach 3 Spieltagen ohne Gehalt verlässt der teuerste Spieler den Verein.`);
    if (state.user.unpaidDays >= 3 && squad.length > 16) {
      const top = [...squad].sort((a, b) => salaryFor(b.ovr) - salaryFor(a.ovr))[0];
      club.playerIds = club.playerIds.filter(id => id !== top.id);
      // Spieler wechselt zu einem KI-Verein der passenden Liga
      const targetTier = Math.max(1, club.tier - 1);
      const target = state.leagues[targetTier].clubIds.find(id => id !== 'user');
      top.clubId = target;
      state.clubs[target].playerIds.push(top.id);
      state.user.unpaidDays = 0;
      addNews(state, 'finance', `${displayName(top)} ist weg`, `Ohne Gehalt hat ${displayName(top)} den Verein verlassen und ist zu ${state.clubs[target].name} gewechselt.`);
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
    developAll(rng, state, 9, false);
    addNews(state, 'development', 'Halbzeit der Saison', 'Die Spieler haben sich weiterentwickelt. Junge Talente legen zu, ältere Spieler bauen teils ab. Schau in deinen Kader!');
  }
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
        addNews(state, 'cup', `Pokal-Auslosung: ${CUP_ROUND_NAMES[day.round + 1]}`, `Dein Gegner: ${opp.name} (${LEAGUE_INFO[opp.tier].short}). ${um.home === 'user' ? 'Heimspiel' : 'Auswärtsspiel'}.`);
      }
    } else {
      state.cup.winner = winners[0];
      if (winners[0] === 'user') {
        addNews(state, 'trophy', 'POKALSIEGER!', `${state.clubs.user.name} gewinnt den Pokal! Ein historischer Tag für den Verein.`);
      }
    }
  }
  if (day.type === 'league' && day.md === MATCHDAYS) {
    for (let tier = 1; tier <= 6; tier++) state.finalFours[tier] = createFinalFour(state, tier);
    const userTable = computeTable(state, state.clubs.user.tier);
    const pos = userTable.find(r => r.clubId === 'user').pos;
    if (pos <= 4) addNews(state, 'ff', 'Final Four erreicht!', `Platz ${pos}! Ihr spielt um ${state.clubs.user.tier === 1 ? 'die Meisterschaft' : 'den Aufstieg'}.`);
  }
  if (day.type === 'ff_semi') {
    for (const ff of Object.values(state.finalFours)) {
      const [a, b] = ff.semis.map(matchWinner);
      const seedOf = id => ff.seeds.indexOf(id);
      ff.final = seedOf(a) <= seedOf(b) ? { home: a, away: b } : { home: b, away: a };
      if (ff.tier > 1) ff.promoted = [a, b];
      if (ff.tier > 1 && (a === 'user' || b === 'user')) {
        addNews(state, 'trophy', 'AUFSTIEG!', `Mit dem Halbfinalsieg steigt ${state.clubs.user.name} in die ${LEAGUE_INFO[ff.tier - 1].name} auf!`);
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

function developAll(rng, state, games, aging) {
  for (const p of Object.values(state.players)) {
    const share = Math.min(1, p.stats.apps / Math.max(1, games));
    const delta = developPlayer(rng, p, share);
    if (p.clubId === 'user' && Math.abs(delta) >= 2) {
      p.lastDelta = delta;
    }
    if (aging) p.age++;
  }
}

// -----------------------------------------------------------------------------
// Saisonende
// -----------------------------------------------------------------------------

function endSeason(rng, state) {
  const summary = { season: state.season, moves: [], retired: [], user: null };
  const tables = {};
  for (let tier = 1; tier <= 6; tier++) tables[tier] = computeTable(state, tier);

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
    ffStage: ff && ff.seeds.includes('user') ? (ff.champion === 'user' ? 'Sieger' : ff.final && (ff.final.home === 'user' || ff.final.away === 'user') ? 'Finale' : 'Halbfinale') : null,
    cup: state.cup.winner === 'user' ? 'Sieger' : state.cup.userOut ? CUP_ROUND_NAMES[state.cup.userOut] : '—'
  };
  const prize = seasonPrize(userTier, row.pos);
  ledger(state, `Saisonprämie Platz ${row.pos}`, prize);
  userSummary.prize = prize;

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
    addNews(state, 'season', 'Abstieg', `${state.clubs.user.name} muss in die ${LEAGUE_INFO[userTier + 1].name}. Kopf hoch – nächste Saison geht es wieder hoch!`);
  }

  // Entwicklung zweite Saisonhälfte, Alterung, Karriereende
  developAll(rng, state, MATCHDAYS, true);
  for (const p of Object.values(state.players)) {
    if (p.age >= 33) {
      const prob = p.age >= 38 ? 1 : 0.12 + (p.age - 33) * 0.2;
      if (rng.chance(prob)) {
        const club = state.clubs[p.clubId];
        if (club) club.playerIds = club.playerIds.filter(id => id !== p.id);
        if (p.clubId === 'user') {
          summary.retired.push({ name: displayName(p), age: p.age, apps: p.careerStats.apps, goals: p.careerStats.goals });
          addNews(state, 'squad', `${displayName(p)} beendet seine Karriere`,
            `Mit ${p.age} Jahren hängt ${displayName(p)} die Schuhe an den Nagel. ${p.careerStats.apps} Spiele, ${p.careerStats.goals} Tore für deinen Verein.`);
        }
        delete state.players[p.id];
      }
    }
  }

  // Eigene Jugendakademie: zwei Talente pro Saison, Kader nie unter 16
  const youth = [];
  const userClub = state.clubs.user;
  const wantYouth = Math.max(2, 16 - userClub.playerIds.length);
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
    const p = createPlayer(rng, { id: `p${(++state.nextId).toString(36)}`, position: pos, age, ovr, potential, tier: tierRoll });
    p.clubId = 'user';
    state.players[p.id] = p;
    userClub.playerIds.push(p.id);
    youth.push(p);
  }
  if (youth.length) {
    summary.youth = youth.map(p => p.id);
    addNews(state, 'squad', 'Nachwuchs aus der eigenen Jugend',
      `${youth.map(p => `${displayName(p)} (${p.position}, ${TIERS[p.tier].name})`).join(', ')} rücken in den Profikader auf.`);
  }

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
    if (rng.chance(0.2)) club.preferredStyle = rng.pick(STYLE_KEYS);
  }

  state.history.unshift(userSummary);
  summary.user = userSummary;
  state.seasonSummary = summary;

  // Pokal-Freilose: Top 4 der Liga 1
  const byes = tables[1].slice(0, 4).map(r => r.clubId).map(id => id);
  state.season++;
  startSeason(rng, state, byes.filter(id => state.clubs[id].tier === 1).length === 4 ? byes : null);
  state.user.setup = state.user.setup ? repairLineup(state, 'user', state.user.setup) : null;
  addNews(state, 'season', `Saison ${state.season} beginnt`,
    `Neue Saison in der ${LEAGUE_INFO[state.clubs.user.tier].name}. Alle Spieler sind ein Jahr älter – prüfe Kader und Aufstellung.`);
}

export function acknowledgeSeasonSummary(state) {
  state.seasonSummary = null;
}

export function markRead(state, id) {
  const n = state.inbox.find(x => x.id === id);
  if (n) n.read = true;
}

export function markAllRead(state) {
  state.inbox.forEach(n => { n.read = true; });
}

export { createRng };
