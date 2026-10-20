// Tests für die Spiellogik. Ausführen mit: npm test  (nutzt den eingebauten Node-Testrunner)
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createRng } from '../src/engine/rng.js';
import { createWorld, clubStrength } from '../src/engine/world.js';
import { roundRobin } from '../src/engine/schedule.js';
import { buildTeam, simulateMatch } from '../src/engine/match.js';
import { bestLineup } from '../src/engine/ai.js';
import { createPlayer, developPlayer, trainPlayer } from '../src/engine/player.js';
import { TIERS } from '../src/engine/constants.js';
import {
  createGame, openStarterPack, pickDraft, playDay, buyPack, useItem, currentDay,
  setUserSetup, autoLineup, placePlayer, swapPlayers, ensureUserSetup
} from '../src/engine/game.js';
import { computeTable } from '../src/engine/schedule.js';

function newStartedGame(seed = 7) {
  const s = createGame({ seed, clubName: 'Test FC', primary: '#0f766e', secondary: '#facc15', crest: 'shield' });
  openStarterPack(s);
  pickDraft(s, 0);
  return s;
}

function playSeason(s) {
  const startSeason = s.season;
  let guard = 0;
  while (s.season === startSeason && guard++ < 60) {
    s.seasonSummary = null;
    playDay(s);
  }
  return s;
}

test('Welt: 6 Ligen à 10 Vereine, jeder Spieler genau einmal', () => {
  const rng = createRng(1);
  const state = { rng: 1, nextId: 1 };
  createWorld(rng, state, { name: 'X', primary: '#000', secondary: '#fff' });
  // vor dem Starter-Pack hat Liga 6 neun KI-Vereine + Spieler-Verein
  for (let t = 1; t <= 6; t++) assert.equal(state.leagues[t].clubIds.length, 10);
  const seen = new Set();
  for (const club of Object.values(state.clubs)) {
    for (const id of club.playerIds) {
      assert.ok(!seen.has(id), `Spieler ${id} doppelt`);
      seen.add(id);
      assert.equal(state.players[id].clubId, club.id);
    }
  }
  assert.equal(seen.size, Object.keys(state.players).length);
});

test('Welt: Ligen sind nach Stärke gestaffelt', () => {
  const rng = createRng(3);
  const state = { rng: 3, nextId: 1 };
  createWorld(rng, state, { name: 'X', primary: '#000', secondary: '#fff' });
  const avg = t => {
    const ids = state.leagues[t].clubIds.filter(id => id !== 'user');
    return ids.reduce((s, id) => s + clubStrength(state, id), 0) / ids.length;
  };
  for (let t = 1; t < 6; t++) assert.ok(avg(t) > avg(t + 1), `Liga ${t} stärker als Liga ${t + 1}`);
});

test('Spielplan: Hin- und Rückrunde, jeder gegen jeden zweimal', () => {
  const rng = createRng(5);
  const ids = Array.from({ length: 10 }, (_, i) => `c${i}`);
  const rounds = roundRobin(rng, ids);
  assert.equal(rounds.length, 18);
  const pairs = {};
  const home = {};
  for (const r of rounds) {
    const playing = new Set();
    for (const m of r) {
      assert.ok(!playing.has(m.home) && !playing.has(m.away), 'kein Team doppelt am Spieltag');
      playing.add(m.home); playing.add(m.away);
      const key = [m.home, m.away].sort().join('-');
      pairs[key] = (pairs[key] || 0) + 1;
      home[m.home] = (home[m.home] || 0) + 1;
    }
  }
  assert.equal(Object.keys(pairs).length, 45);
  assert.ok(Object.values(pairs).every(n => n === 2));
  assert.ok(Object.values(home).every(n => n === 9));
});

test('Neues Spiel: Starter-Pack füllt den Kader, Starspieler-Wahl folgt', () => {
  const s = createGame({ seed: 11, clubName: 'Test FC', primary: '#0f766e', secondary: '#facc15' });
  assert.equal(s.pending.type, 'starter');
  openStarterPack(s);
  assert.equal(s.clubs.user.playerIds.length, 18);
  assert.equal(s.pending.type, 'draft');
  assert.equal(s.pending.candidates.length, 3);
  for (const c of s.pending.candidates) {
    assert.equal(c.tier, 'silver');
    assert.equal(typeof c.position, 'string');
    assert.equal(typeof c.ovr, 'number');
  }
  pickDraft(s, 1);
  assert.equal(s.pending, null);
  assert.equal(s.clubs.user.playerIds.length, 19);
  const setup = ensureUserSetup(s);
  assert.equal(Object.keys(setup.lineup).length, 11);
});

test('Packs: Kauf zieht Münzen ab, Wahl fügt genau einen Spieler hinzu', () => {
  const s = newStartedGame();
  s.clubs.user.coins = 10000;
  const before = s.clubs.user.playerIds.length;
  const r = buyPack(s, 'scout');
  assert.ok(r.ok);
  assert.equal(s.clubs.user.coins, 10000 - 2200);
  const ids = s.pending.candidates.map(c => c.id);
  pickDraft(s, 2);
  assert.equal(s.clubs.user.playerIds.length, before + 1);
  // Die nicht gewählten Kandidaten existieren nicht in der Welt
  assert.ok(!s.players[ids[0]] && !s.players[ids[1]] && s.players[ids[2]]);
  assert.ok(buyPack(s, 'elite').ok);
  assert.ok(buyPack(s, 'talent').error, 'kein zweites Pack, solange eins offen ist');
});

test('Gegenstände: Fitness und Training wirken', () => {
  const s = newStartedGame();
  const p = s.players[s.clubs.user.playerIds[3]];
  p.condition = 50;
  const fit = s.user.inventory.find(i => i.type === 'FITNESS');
  assert.ok(useItem(s, fit.id, p.id).ok);
  assert.equal(p.condition, 85);
  const train = s.user.inventory.find(i => i.type === 'TRAIN');
  const ovr = p.ovr;
  useItem(s, train.id, p.id);
  assert.ok(p.ovr >= ovr);
});

test('Spieltag: alle Ligaspiele werden gespielt, Fitness sinkt bei Startern', () => {
  const s = newStartedGame();
  const setup = ensureUserSetup(s);
  const starter = s.players[setup.lineup.s9];
  const day = currentDay(s);
  assert.equal(day.type, 'league');
  const res = playDay(s);
  assert.ok(res, 'Spieler hat am 1. Spieltag ein Spiel');
  assert.ok(starter.condition < 100);
  for (let t = 1; t <= 6; t++) {
    for (const m of s.leagues[t].fixtures[0]) assert.equal(typeof m.hg, 'number');
  }
  assert.ok(res.analysis.length >= 1);
  assert.ok(res.result.keyScenes.length >= 3);
  assert.ok(res.result.ticker.some(t => t.type === 'end'));
});

test('Komplette Saison: Final Four, Auf-/Abstieg, neue Saison', () => {
  const s = newStartedGame(21);
  playSeason(s);
  assert.equal(s.season, 2);
  assert.equal(s.history.length, 1);
  for (let t = 1; t <= 6; t++) assert.equal(s.leagues[t].clubIds.length, 10, `Liga ${t} hat 10 Vereine`);
  // Jeder Verein ist in genau der Liga, die zu seinem tier passt
  for (const club of Object.values(s.clubs)) {
    assert.ok(s.leagues[club.tier].clubIds.includes(club.id));
  }
  // Spieler-Konsistenz nach Karriereenden
  for (const club of Object.values(s.clubs)) {
    for (const id of club.playerIds) assert.equal(s.players[id]?.clubId, club.id);
  }
  // Neuer Spielplan ist frisch
  assert.equal(s.dayIndex, 0);
  assert.ok(s.leagues[1].fixtures[0].every(m => m.hg == null));
});

test('Drei Saisons am Stück laufen stabil und der Spielstand ist speicherbar', () => {
  const s = newStartedGame(33);
  for (let i = 0; i < 3; i++) playSeason(s);
  assert.equal(s.season, 4);
  const copy = JSON.parse(JSON.stringify(s));
  assert.deepEqual(copy.clubs.user, s.clubs.user);
  for (const club of Object.values(s.clubs)) {
    if (!club.isUser) assert.equal(club.playerIds.length, 21);
  }
});

test('Deterministisch: gleicher Seed, gleiche Ergebnisse', () => {
  const a = newStartedGame(99);
  const b = newStartedGame(99);
  for (let i = 0; i < 5; i++) { playDay(a); playDay(b); }
  assert.deepEqual(computeTable(a, 6), computeTable(b, 6));
});

test('Spielstil: Konter-Vorteil verbessert das Ergebnis messbar', () => {
  const rng = createRng(123);
  const state = { rng: 1, nextId: 1 };
  createWorld(rng, state, { name: 'X', primary: '#000', secondary: '#fff' });
  const [a, b] = state.leagues[3].clubIds;
  const la = bestLineup(state, a, '4-3-3');
  const lb = bestLineup(state, b, '4-3-3');
  const points = (styleA, styleB) => {
    let pts = 0;
    for (let i = 0; i < 1500; i++) {
      const h = buildTeam(state, a, { formation: '4-3-3', style: styleA, ...la });
      const w = buildTeam(state, b, { formation: '4-3-3', style: styleB, ...lb });
      const r = simulateMatch(rng, h, w, { neutral: true });
      pts += r.hg > r.ag ? 3 : r.hg === r.ag ? 1 : 0;
    }
    return pts / 1500;
  };
  const favoured = points('PRESSING', 'BALLBESITZ');
  const countered = points('BALLBESITZ', 'PRESSING');
  assert.ok(favoured - countered > 0.25, `Konter-Vorteil zu klein: ${favoured.toFixed(2)} vs ${countered.toFixed(2)}`);
});

test('Entwicklung: Junge wachsen, Alte bauen ab, Talentklasse bleibt', () => {
  const rng = createRng(77);
  let young = 0;
  let old = 0;
  for (let i = 0; i < 200; i++) {
    const y = createPlayer(rng, { id: 'y', position: 'ZM', age: 18, ovr: 55, potential: 72, tier: 'silver' });
    young += developPlayer(rng, y, 0.8);
    const o = createPlayer(rng, { id: 'o', position: 'ZM', age: 33, ovr: 75, potential: 78, tier: 'gold' });
    old += developPlayer(rng, o, 0.8);
    assert.equal(o.tier, 'gold');
  }
  assert.ok(young / 200 > 1, 'junge Spieler wachsen');
  assert.ok(old / 200 < -0.5, 'alte Spieler bauen ab');
});

test('Training: oberhalb der Talentgrenze kaum Fortschritt', () => {
  const rng = createRng(5);
  let below = 0;
  let above = 0;
  for (let i = 0; i < 100; i++) {
    const p1 = createPlayer(rng, { id: 'a', position: 'ST', age: 22, ovr: 55, potential: 64, tier: 'bronze' });
    below += trainPlayer(rng, p1, 3.4);
    const p2 = createPlayer(rng, { id: 'b', position: 'ST', age: 22, ovr: TIERS.bronze.softCap + 1, potential: TIERS.bronze.softCap, tier: 'bronze' });
    above += trainPlayer(rng, p2, 3.4);
  }
  assert.ok(below / 100 > 2 * Math.max(0.1, above / 100));
});

test('Aufstellung: Formation wechseln und Spieler tauschen bleibt gültig', () => {
  const s = newStartedGame();
  setUserSetup(s, { formation: '3-5-2', style: 'KONTER' });
  assert.equal(Object.keys(s.user.setup.lineup).length, 11);
  const benchId = s.user.setup.bench[0];
  placePlayer(s, benchId, { slot: 's9' });
  assert.equal(s.user.setup.lineup.s9, benchId);
  const ids = Object.values(s.user.setup.lineup);
  assert.equal(new Set(ids).size, 11, 'kein Spieler doppelt in der Elf');
  autoLineup(s);
  assert.equal(Object.keys(s.user.setup.lineup).length, 11);
});

test('Match: Verletzte tauchen nach ihrer Auswechslung nicht mehr auf', () => {
  const rng = createRng(404);
  const state = { rng: 1, nextId: 1 };
  createWorld(rng, state, { name: 'X', primary: '#000', secondary: '#fff' });
  const [a, b] = state.leagues[4].clubIds;
  let checked = 0;
  for (let i = 0; i < 600; i++) {
    for (const id of [a, b]) Object.values(state.players).filter(p => p.clubId === id).forEach(p => { p.condition = 40; });
    const h = buildTeam(state, a, { formation: '4-3-3', style: 'PRESSING', ...bestLineup(state, a, '4-3-3') });
    const w = buildTeam(state, b, { formation: '4-4-2', style: 'KONTER', ...bestLineup(state, b, '4-4-2') });
    const r = simulateMatch(rng, h, w, {});
    for (const inj of r.injuries) {
      checked++;
      for (const g of r.goals) if (g.minute > inj.minute) assert.notEqual(g.scorerId, inj.playerId);
      for (const s of r.keyScenes) {
        if (s.minute > inj.minute) {
          assert.notEqual(s.attackerId, inj.playerId);
          assert.notEqual(s.defenderId, inj.playerId);
        }
      }
    }
  }
  assert.ok(checked > 10, `genug Verletzungen geprüft (${checked})`);
});

import { searchMarket, buyPlayer, getOffers, acceptOffer, willingness, askingPrice } from '../src/engine/market.js';

test('Transfermarkt: kaufen, verkaufen, Einmaligkeit bleibt erhalten', () => {
  const s = newStartedGame(55);
  s.clubs.user.coins = 200000;
  const list = searchMarket(s, { onlyWilling: true, sort: 'ovr' });
  assert.ok(list.length > 50);
  // Spieler aus Liga 1 wollen nicht nach Liga 6
  const l1 = s.players[s.clubs[s.leagues[1].clubIds[0]].playerIds[0]];
  assert.equal(willingness(s, l1).ok, false);
  const target = s.players[list[0].id];
  const seller = target.clubId;
  const price = askingPrice(s, target);
  const res = buyPlayer(s, target.id);
  assert.ok(res.ok, res.error);
  assert.equal(target.clubId, 'user');
  assert.equal(s.clubs.user.coins, 200000 - price);
  assert.equal(s.clubs[seller].playerIds.length, 21, 'Verkäufer füllt auf');
  // Verkaufen
  const mine = s.clubs.user.playerIds[0];
  const offers = getOffers(s, mine);
  assert.ok(offers.length >= 1);
  assert.deepEqual(getOffers(s, mine), offers, 'Angebote sind am selben Tag stabil');
  const r2 = acceptOffer(s, mine, offers[0].clubId);
  assert.ok(r2.ok, r2.error);
  assert.equal(s.players[mine].clubId, offers[0].clubId);
  assert.equal(s.clubs[offers[0].clubId].playerIds.length, 21);
  // Jeder Spieler genau einmal
  const seen = new Set();
  for (const c of Object.values(s.clubs)) for (const id of c.playerIds) { assert.ok(!seen.has(id)); seen.add(id); assert.equal(s.players[id].clubId, c.id); }
  // Saison nach Transfers läuft weiter
  playSeason(s);
  for (const c of Object.values(s.clubs)) if (!c.isUser) assert.equal(c.playerIds.length, 21);
});

test('Aufstellung: Tauschen zwischen Feld, Bank und Reserve verliert niemanden', () => {
  const s = newStartedGame(11);
  const squadSize = () => {
    const st = ensureUserSetup(s);
    return { xi: Object.keys(st.lineup).length, bench: st.bench.length, all: new Set([...Object.values(st.lineup), ...st.bench]).size };
  };
  const st = ensureUserSetup(s);
  const before = squadSize();
  const [s1, s2] = Object.keys(st.lineup);
  const a = st.lineup[s1], b = st.lineup[s2], c = st.bench[0], d = st.bench[1];
  // Feld <-> Feld
  assert.equal(swapPlayers(s, a, { playerId: b }).ok, true);
  assert.equal(s.user.setup.lineup[s1], b);
  assert.equal(s.user.setup.lineup[s2], a);
  // Feld <-> Bank
  swapPlayers(s, a, { playerId: c });
  assert.equal(s.user.setup.lineup[s2], c);
  assert.ok(s.user.setup.bench.includes(a));
  // Bank <-> Bank behält beide auf der Bank
  swapPlayers(s, a, { playerId: d });
  assert.ok(s.user.setup.bench.includes(a) && s.user.setup.bench.includes(d));
  // Reserve <-> Feld: der Feldspieler wird Reservist, nicht gelöscht
  const used = new Set([...Object.values(s.user.setup.lineup), ...s.user.setup.bench]);
  const reserve = s.clubs.user.playerIds.find(id => !used.has(id) && !s.players[id].injury);
  if (reserve) {
    swapPlayers(s, reserve, { playerId: b });
    assert.equal(s.user.setup.lineup[s1], reserve);
    assert.ok(!s.user.setup.bench.includes(b));
    assert.ok(s.clubs.user.playerIds.includes(b));
  }
  assert.deepEqual(squadSize(), before);
  assert.equal(s.user.autoLineup, false);
});
