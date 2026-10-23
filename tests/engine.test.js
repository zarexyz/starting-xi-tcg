// Tests für die Spiellogik. Ausführen mit: npm test  (nutzt den eingebauten Node-Testrunner)
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createRng } from '../src/engine/rng.js';
import { createWorld, clubStrength } from '../src/engine/world.js';
import { roundRobin } from '../src/engine/schedule.js';
import { buildTeam, simulateMatch } from '../src/engine/match.js';
import { bestLineup, aiSetup } from '../src/engine/ai.js';
import { createPlayer, developPlayer, trainPlayer, trainAttribute, calcOvr } from '../src/engine/player.js';
import { migrateSave } from '../src/engine/migrate.js';
import { ATTRS } from '../src/engine/constants.js';
import { TIERS } from '../src/engine/constants.js';
import {
  createGame, openStarterPack, pickDraft, playDay, buyPack, useItem, currentDay,
  setUserSetup, autoLineup, placePlayer, swapPlayers, ensureUserSetup, useItem as useItemFn, SAVE_VERSION
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
  s.clubs.user.coins = 20000;
  const before = s.clubs.user.playerIds.length;
  const r = buyPack(s, 'scout');
  assert.ok(r.ok);
  assert.equal(s.clubs.user.coins, 20000 - 3300);
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

import { searchMarket, buyPlayer, listPlayer, processTransferDay, offersFor, acceptOffer, declineOffer, willingness, askingPrice, transferWindow, bidLow } from '../src/engine/market.js';
import { wageOf, extendContract, yearsLeft } from '../src/engine/contracts.js';

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
  assert.ok(target.contract && target.contract.wage > 0, 'Neuer Spieler hat einen Vertrag');
  // Verkaufen: auf die Transferliste, Angebote kommen über die Tage
  const mine = s.clubs.user.playerIds[0];
  assert.ok(listPlayer(s, mine, 'quick').ok);
  const rng = createRng(3);
  for (let i = 0; i < 20 && !offersFor(s, mine).length; i++) processTransferDay(rng, s);
  const offers = offersFor(s, mine);
  assert.ok(offers.length >= 1, 'Günstig angebotener Spieler bekommt ein Angebot');
  const r2 = acceptOffer(s, offers[0].id);
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

test('8 Werte: jeder Spieler hat alle acht, Torhüter leben vom Torwartwert', () => {
  const s = newStartedGame(21);
  for (const p of Object.values(s.players)) {
    for (const a of ATTRS) assert.ok(Number.isFinite(p.attrs[a]), `${p.id} ohne ${a}`);
    assert.equal(p.attrs.ref, undefined);
  }
  const gks = Object.values(s.players).filter(p => p.position === 'TW');
  const field = Object.values(s.players).filter(p => p.position !== 'TW');
  const avg = (list, k) => list.reduce((x, p) => x + p.attrs[k], 0) / list.length;
  assert.ok(avg(gks, 'tor') > avg(field, 'tor') + 25);
  assert.ok(avg(gks, 'tor') > avg(gks, 'sch') + 15);
});

test('Training: eine Karte hebt genau einen Wert, Gesamtstärke kaum', () => {
  const rng = createRng(4);
  const p = createPlayer(rng, { id: 'x', position: 'ST', age: 22, ovr: 60, potential: 75, tier: 'silver' });
  const before = { ...p.attrs };
  const ovr = p.ovr;
  const { gain } = trainAttribute(rng, p, 'sch', 2);
  assert.equal(gain, 2);
  assert.equal(p.attrs.sch, before.sch + 2);
  for (const a of ATTRS) if (a !== 'sch') assert.equal(p.attrs[a], before[a]);
  assert.ok(p.ovr - ovr <= 1);
});

test('Matchplan: temporäre Karte gilt genau ein Spiel', () => {
  const s = newStartedGame(5);
  const st = ensureUserSetup(s);
  const pid = Object.values(st.lineup)[3];
  s.user.inventory.push({ id: 'boost1', type: 'BOOST', attr: 'tem' });
  assert.equal(useItemFn(s, 'boost1', pid).ok, true);
  assert.equal(s.players[pid].tempBoost.amount, 6);
  const base = s.players[pid].attrs.tem;
  let guard = 0;
  while (!playDay(s) && guard++ < 5) { /* bis zum eigenen Spiel */ }
  assert.equal(s.players[pid].tempBoost, null);
  assert.equal(s.players[pid].attrs.tem, base);
});

test('Entwicklung: moderat, Junge mit Spielzeit wachsen schneller als Junge auf der Bank', () => {
  const rng = createRng(12);
  const runs = (share, avg, age) => {
    let sum = 0;
    for (let i = 0; i < 300; i++) {
      const p = createPlayer(rng, { id: 'd' + i, position: 'ZM', age, ovr: 55, potential: 72, tier: 'silver' });
      sum += developPlayer(rng, p, share, avg);
    }
    return sum / 300;
  };
  const starter = runs(1, 6.9, 18);
  const bench = runs(0.05, null, 18);
  const veteran = runs(1, 6.3, 34);
  assert.ok(starter > bench + 0.7, `Stamm ${starter} vs Bank ${bench}`);
  assert.ok(starter < 4, 'nicht zu schnell');
  assert.ok(veteran < 0 && veteran > -3, `Abbau ${veteran}`);
});

test('Spielstand v1 wird auf 8 Werte umgerechnet, Stärke bleibt fast gleich', () => {
  const s = newStartedGame(8);
  // Einen v1-Stand nachbauen
  const old = structuredClone(s);
  old.version = 1;
  const ovrs = {};
  for (const p of Object.values(old.players)) {
    if (p.position === 'TW') Object.assign(p.attrs, { ref: p.attrs.tor, hal: p.attrs.tor - 2, ste: p.attrs.tor + 1, spi: p.attrs.pas });
    delete p.attrs.men; delete p.attrs.tor;
    ovrs[p.id] = p.ovr;
    delete p.half;
  }
  for (const c of Object.values(old.clubs)) delete c.coach;
  const m = migrateSave(old, SAVE_VERSION);
  assert.ok(m);
  assert.equal(m.version, SAVE_VERSION);
  for (const p of Object.values(m.players)) {
    for (const a of ATTRS) assert.ok(Number.isFinite(p.attrs[a]));
    assert.ok(Math.abs(p.ovr - ovrs[p.id]) <= 2, `${p.position} ${ovrs[p.id]} → ${p.ovr}`);
    assert.equal(p.ovr, calcOvr(p));
  }
  for (const c of Object.values(m.clubs)) if (!c.isUser) assert.ok(c.coach?.style);
});

test('Karten und Sperren: Platzverweis sperrt, Sperre läuft nach Spielen ab', () => {
  const s = newStartedGame(31);
  let found = null;
  for (let i = 0; i < 40 && !found; i++) {
    const r = playDay(s);
    if (!r) continue;
    const red = r.result.cards.find(c => c.side === r.side && c.type !== 'Y');
    if (red) found = red.playerId;
  }
  // Über die ganze Liga: rund 3–4 Gelbe pro Spiel
  if (found) {
    const p = s.players[found];
    assert.ok(p.suspension && p.suspension.games >= 1);
    const st = ensureUserSetup(s);
    assert.ok(!Object.values(st.lineup).includes(found) && !st.bench.includes(found));
    let guard = 0;
    while (s.players[found]?.suspension && guard++ < 10) playDay(s);
    assert.equal(s.players[found].suspension, null);
  }
});

test('Elfmeterschießen liefert jeden Schuss und ein eindeutiges Ergebnis', () => {
  const rng = createRng(99);
  const s = newStartedGame(4);
  const ids = s.leagues[2].clubIds;
  let shootouts = 0;
  for (let i = 0; i < 300 && shootouts < 15; i++) {
    const a = buildTeam(s, ids[0], { formation: '4-4-2', style: 'AUSGEWOGEN', ...bestLineup(s, ids[0], '4-4-2') });
    const b = buildTeam(s, ids[1], { formation: '4-4-2', style: 'AUSGEWOGEN', ...bestLineup(s, ids[1], '4-4-2') });
    const r = simulateMatch(rng, a, b, { knockout: true });
    if (!r.pens) continue;
    shootouts++;
    assert.notEqual(r.pens.h, r.pens.a);
    const last = r.pens.kicks[r.pens.kicks.length - 1];
    assert.deepEqual(last.score, [r.pens.h, r.pens.a]);
    assert.equal(r.pens.kicks.filter(k => k.side === 'home' && k.scored).length, r.pens.h);
    assert.ok(r.pens.kicks.length >= 6);
  }
  assert.ok(shootouts > 0);
});

test('Sprachen: Deutsch und Englisch haben dieselben Schlüssel, Spieltexte sind vollständig', async () => {
  const { de } = await import('../src/i18n/de.js');
  const { en } = await import('../src/i18n/en.js');
  const I = await import('../src/i18n/index.js');
  assert.deepEqual(Object.keys(de).sort(), Object.keys(en).sort());
  const s = newStartedGame(44);
  let res = null;
  for (let i = 0; i < 6 && !res; i++) res = playDay(s);
  for (const lang of ['de', 'en']) {
    I.setLang(lang);
    for (const item of res.result.ticker) {
      const text = I.t(item.k, item.p);
      assert.ok(text && !text.startsWith('tick.') && !/\{\w+\}/.test(text), `${lang}: ${item.k} → ${text}`);
    }
    for (const r of res.analysis) assert.ok(!/\{\w+\}/.test(I.t(r.k, r.p)), `${lang}: ${r.k}`);
    for (const n of s.inbox) {
      const tt = I.t(`${n.k}.t`, n.p);
      const xx = I.t(`${n.k}.x`, n.p);
      assert.ok(!tt.startsWith('news.') && !/\{\w+\}/.test(xx), `${lang}: ${n.k}`);
    }
  }
  I.setLang('de');
});

test('Internationale Welt: viele Länder, Heimatland prägt den Kader, Derbys', async () => {
  const { rivalry } = await import('../src/engine/world.js');
  const s = newStartedGame(45);
  const ai = Object.values(s.clubs).filter(c => !c.isUser);
  const countries = new Set(ai.map(c => c.country));
  assert.ok(countries.size >= 20, `nur ${countries.size} Länder`);
  for (const c of ai) {
    const squad = c.playerIds.map(id => s.players[id]);
    const home = squad.filter(p => p.nation === c.country).length / squad.length;
    assert.ok(home >= 0.25, `${c.name}: nur ${Math.round(home * 100)} % aus ${c.country}`);
  }
  const madrid = ai.filter(c => c.city === 'Madrid');
  assert.equal(rivalry(madrid[0], madrid[1]), 'derby');
});

test('Internationale Welt: im Schnitt stammt gut die Hälfte des Kaders aus dem Heimatland', () => {
  const s = newStartedGame(46);
  const ai = Object.values(s.clubs).filter(c => !c.isUser);
  let home = 0, all = 0;
  for (const c of ai) for (const id of c.playerIds) { all++; if (s.players[id].nation === c.country) home++; }
  assert.ok(home / all > 0.55 && home / all < 0.8, `${Math.round((home / all) * 100)} %`);
});

test('Prognose: der gewählte Spielstil verändert die Siegprognose nicht', async () => {
  const { forecastMatch } = await import('../src/engine/forecast.js');
  const { STYLE_KEYS } = await import('../src/engine/constants.js');
  const { userMatch } = await import('../src/engine/game.js');
  const s = newStartedGame(11);
  const entry = userMatch(s);
  assert.ok(entry, 'Nutzer hat ein Spiel');
  const setup = ensureUserSetup(s);
  const results = STYLE_KEYS.map(style => JSON.stringify(forecastMatch(s, entry, { ...setup, style })));
  assert.equal(new Set(results).size, 1, results.join(' | '));
});

test('Geschichten: eine Saison erzeugt Schlagzeilen und Auszeichnungen, alle Texte vorhanden', async () => {
  const { newsTitle, newsText } = await import('../src/ui/text.js');
  const { setLang } = await import('../src/i18n/index.js');
  const s = newStartedGame(5);
  playSeason(s);
  const aw = s.seasonSummary.awards;
  assert.ok(aw.scorer && aw.pots, 'Torschützenkönig und Spieler der Saison');
  assert.equal(aw.xi.length, 11, 'Elf der Saison hat 11 Spieler');
  const keys = new Set(s.inbox.map(n => n.k));
  assert.ok(['news.potm', 'news.potmMine'].some(k => keys.has(k)), 'Spieler des Monats');
  for (const lang of ['de', 'en']) {
    setLang(lang);
    for (const n of s.inbox) {
      const txt = newsTitle(n) + ' ' + newsText(n);
      assert.ok(!/\bnews\.|\{\w+\}/.test(txt), `${lang}: ${n.k} → ${txt}`);
    }
  }
  setLang('de');
});


test('Transferfenster: offen bis Spieltag 9, danach kein Kauf', () => {
  const s = newStartedGame(21);
  s.clubs.user.coins = 500000;
  assert.equal(transferWindow(s).open, true);
  let guard = 0;
  while (transferWindow(s).open && guard++ < 40) { s.devReport = null; playDay(s); }
  assert.equal(transferWindow(s).played, 9);
  const target = searchMarket(s, { onlyWilling: true })[0];
  assert.ok(buyPlayer(s, target.id).error, 'Kauf bei geschlossenem Fenster abgelehnt');
  assert.ok(bidLow(s, target.id).error);
});

test('Verträge: Gehalt steigt nicht automatisch, Verlängerung setzt neues Gehalt', () => {
  const s = newStartedGame(8);
  const p = s.players[s.clubs.user.playerIds[0]];
  const wage = wageOf(p);
  p.ovr += 8; // Aufwertung
  assert.equal(wageOf(p), wage, 'Gehalt bleibt bis zur Verlängerung');
  const res = extendContract(s, p.id, 2);
  assert.ok(res.ok);
  assert.ok(wageOf(p) > wage, 'neues Gehalt nach Verlängerung');
  assert.equal(yearsLeft(s, p), 3);
});

test('Verträge: Auslaufende Verträge enden zum Saisonende, Kader bleibt spielfähig', () => {
  const s = newStartedGame(13);
  for (const id of s.clubs.user.playerIds) s.players[id].contract.until = s.season; // alle laufen aus
  const before = s.clubs.user.playerIds.length;
  playSeason(s);
  assert.ok(s.clubs.user.playerIds.length >= 16, 'mindestens 16 Spieler');
  assert.ok(s.clubs.user.playerIds.length < before + 4, 'einige haben den Verein verlassen');
  for (const id of s.clubs.user.playerIds) assert.ok(s.players[id].contract.until >= s.season);
  for (const c of Object.values(s.clubs)) if (!c.isUser) assert.equal(c.playerIds.length, 21);
});


test('Vertragskarten: Verhandlungsgeschick senkt die Forderung, Treuebonus verlängert zum alten Gehalt', async () => {
  const { demandFor } = await import('../src/engine/contracts.js');
  const s = newStartedGame(17);
  const p = s.clubs.user.playerIds.map(id => s.players[id]).find(x => x.age < 31);
  const before = demandFor(s, p, 2);
  s.user.inventory.push({ id: 'iN', type: 'NEGOTIATE' }, { id: 'iL', type: 'LOYALTY' });
  assert.ok(useItem(s, 'iN', p.id).ok);
  assert.ok(demandFor(s, p, 2) < before, 'Forderung sinkt');
  const wage = p.contract.wage;
  const until = p.contract.until;
  assert.ok(useItem(s, 'iL', p.id).ok);
  assert.equal(p.contract.wage, wage);
  assert.equal(p.contract.until, Math.max(until, s.season) + 1);
});

test('Erfolge: Stufen werden aus dem Spielstand ermittelt und nur einmal freigeschaltet', async () => {
  const { evaluateAchievements } = await import('../src/engine/achievements.js');
  const s = newStartedGame(19);
  playSeason(s);
  const profile = {};
  const first = evaluateAchievements(s, profile);
  assert.ok(first.some(u => u.id === 'wins' || u.id === 'nations'), 'erste Erfolge nach einer Saison');
  assert.equal(evaluateAchievements(s, profile).length, 0, 'kein zweites Mal');
  assert.ok(s.user.record.wins >= 0);
});

// --- v1.7: Rückennummern, Kapitän ---
import { ensureIdentity, setNumber, setArmband, characterOf } from '../src/engine/identity.js';
import { clubPlayers } from '../src/engine/world.js';
import { releasePlayer } from '../src/engine/game.js';

test('Identität: eindeutige Nummern, Kapitän und Vize vorhanden', () => {
  const s = newStartedGame(11);
  ensureIdentity(s);
  const squad = clubPlayers(s, 'user');
  const nums = squad.map(p => p.number);
  assert.ok(nums.every(n => n >= 1 && n <= 99));
  assert.equal(new Set(nums).size, nums.length);
  assert.ok(s.players[s.user.captain] && s.players[s.user.vice]);
  assert.notEqual(s.user.captain, s.user.vice);
  const gk = squad.find(p => p.position === 'TW');
  assert.ok(gk.number === 1 || gk.number >= 12);
});

test('Identität: Nummer tauschen, Binde tauschen, Abgang des Kapitäns', () => {
  const s = newStartedGame(12);
  ensureIdentity(s);
  const [a, b] = clubPlayers(s, 'user');
  const na = a.number, nb = b.number;
  assert.ok(setNumber(s, a.id, nb).ok);
  assert.equal(a.number, nb);
  assert.equal(b.number, na);
  const cap = s.user.captain, vice = s.user.vice;
  setArmband(s, vice, 'C');
  assert.equal(s.user.captain, vice);
  assert.equal(s.user.vice, cap);
  releasePlayer(s, vice);
  ensureIdentity(s);
  assert.equal(s.user.captain, cap);
  assert.ok(s.user.vice && s.user.vice !== cap && s.players[s.user.vice].clubId === 'user');
  assert.ok(characterOf(a).key.startsWith('ch.'));
});

// ---- v1.9: Verein lebt ----
import { ensureClubLife, setPlan, teamMood, userBoosts, prospects, upgradeAcademy, promoteProspect, releaseProspect, academyCap, GOALS } from '../src/engine/clublife.js';

test('v1.9: Stimmung und Saisonziel entstehen, bleiben im Rahmen und werden nach Spielen aktualisiert', () => {
  const s = newStartedGame(21);
  ensureClubLife(s);
  assert.ok(GOALS[s.user.mood.goal.key]);
  assert.equal(s.user.mood.goal.season, 1);
  for (let i = 0; i < 12; i++) { s.pending = null; s.devReport = null; s.seasonSummary = null; playDay(s); }
  const m = s.user.mood;
  for (const v of [m.fans, m.board, teamMood(s)]) assert.ok(v >= 0 && v <= 100);
  assert.ok(m.hist.fans.length >= 5);
});

test('v1.9: Saisonende prüft das Ziel und zahlt nur bei Erfolg eine Prämie', () => {
  const s = newStartedGame(22);
  ensureClubLife(s);
  playSeason(s);
  const h = s.history[0];
  assert.ok(typeof h.goal.met === 'boolean');
  assert.equal(h.goal.bonus > 0, h.goal.met);
  assert.equal(s.user.mood.goal.season, 2);
});

test('v1.9/v1.11: Wochenplan bleibt als Dauerplan, bis er geändert wird', () => {
  const s = newStartedGame(23); autoResolveTasks(s);
  ensureClubLife(s);
  assert.equal(setPlan(s, 'tactics').ok, true);
  assert.ok(userBoosts(s).mid >= 2);
  let res = null;
  let guard = 0;
  while (!res && guard++ < 6) { s.pending = null; res = playDay(s); }
  assert.equal(s.user.plan, 'tactics');
  assert.ok(userBoosts(s).mid >= 2);
  setPlan(s, 'normal');
  assert.ok(userBoosts(s).mid < 2);
  assert.equal(setPlan(s, 'quatsch').ok, false);
});

test('v1.9: Akademie hat Talente, kennt Ausbau, Hochziehen und Entlassen', () => {
  const s = newStartedGame(24);
  ensureClubLife(s);
  const list = prospects(s);
  assert.equal(list.length, 2);
  assert.ok(list.every(p => p.clubId === 'academy' && !s.clubs.user.playerIds.includes(p.id)));
  s.clubs.user.coins = 50000;
  assert.equal(upgradeAcademy(s).level, 2);
  const before = s.clubs.user.playerIds.length;
  assert.equal(promoteProspect(s, list[0].id).ok, true);
  assert.equal(s.clubs.user.playerIds.length, before + 1);
  assert.equal(s.players[list[0].id].clubId, 'user');
  assert.equal(releaseProspect(s, list[1].id).ok, true);
  assert.equal(s.players[list[1].id], undefined);
  assert.ok(academyCap(2) >= 9);
});

test('v1.9: Mehrere Saisons laufen sauber, Akademie bleibt im Rahmen', () => {
  const s = newStartedGame(25);
  ensureClubLife(s);
  for (let i = 0; i < 4; i++) { playSeason(s); }
  assert.ok(prospects(s).length <= academyCap(s.user.academy.level));
  assert.ok(prospects(s).every(p => p.age <= 19));
  assert.ok(s.clubs.user.playerIds.length >= 16);
});

test('Spielstile: jeder schlägt zwei, verliert gegen zwei, Rest neutral', async () => {
  const { STYLE_KEYS, styleMatchup } = await import('../src/engine/constants.js');
  assert.equal(STYLE_KEYS.length, 8);
  for (const a of STYLE_KEYS) {
    const r = STYLE_KEYS.map(b => styleMatchup(a, b));
    if (a === 'AUSGEWOGEN') { assert.ok(r.every(x => x === 0)); continue; }
    assert.equal(r.filter(x => x === 1).length, 2, a);
    assert.equal(r.filter(x => x === -1).length, 2, a);
    for (const b of STYLE_KEYS) assert.equal(styleMatchup(a, b) + styleMatchup(b, a), 0);
  }
});

// --- v1.10: Halbzeit ---------------------------------------------------------
import { previewUserMatch, setHalftime, userMatch as userMatchOf, ensureUserSetup as ensureSetupOf } from '../src/engine/game.js';

const firstHalf = r => JSON.stringify({
  goals: r.goals.filter(g => g.minute < 46),
  cards: r.cards.filter(c => c.minute < 46),
  injuries: r.injuries.filter(c => c.minute < 46),
  subs: r.subs.filter(c => c.minute < 46),
  ticker: r.ticker.filter(x => x.minute <= 45),
  scenes: r.keyScenes.filter(x => x.minute < 46)
});

test('Halbzeit: erste Hälfte bleibt gleich, egal was zur Pause entschieden wird', () => {
  for (const seed of [3, 9, 21, 44]) {
    const s = newStartedGame(seed);
    s.pending = null;
    const setup = ensureSetupOf(s);
    const pre = previewUserMatch(s);
    assert.ok(pre && pre.result, 'Vorschau liefert ein Ergebnis');
    const bench = setup.bench.slice(0, 2);
    const outs = Object.values(setup.lineup).filter(id => s.players[id].position !== 'TW').slice(0, 2);
    for (const decision of [
      null,
      { style: 'PRESSING', mode: 'allOut' },
      { style: 'MAUERN', mode: 'hold', subs: outs.map((o, i) => ({ outId: o, inId: bench[i] })) }
    ]) {
      const copy = structuredClone(s);
      setHalftime(copy, decision);
      const real = playDay(copy);
      assert.equal(firstHalf(real.result), firstHalf(pre.result), `Saat ${seed}, Entscheidung ${JSON.stringify(decision)}`);
      assert.equal(copy.user.halftime, null, 'Entscheidung wird verbraucht');
      if (decision?.subs) {
        const ht = real.result.subs.filter(x => x.halftime);
        assert.ok(ht.length >= 1 && ht.every(x => x.minute === 46), 'Pausenwechsel in Minute 46');
        for (const x of ht) assert.ok(!real.result.injuries.some(i => i.playerId === x.outId && i.minute >= 46));
      }
    }
  }
});

test('Halbzeit: „alles nach vorn“ bringt im Schnitt mehr Tore als „Ergebnis halten“', () => {
  const s = newStartedGame(5);
  const id = s.leagues[1].clubIds[0];
  const { lineup, bench } = bestLineup(s, id, '4-3-3', { minCondition: 0 });
  const team = () => buildTeam(s, id, { formation: '4-3-3', style: 'AUSGEWOGEN', lineup, bench, boosts: {} });
  const rng = createRng(77);
  let open = 0, hold = 0;
  for (let i = 0; i < 400; i++) {
    const a = simulateMatch(rng, team(), team(), { neutral: true, halftime: { side: 'home', mode: 'allOut' } });
    const b = simulateMatch(rng, team(), team(), { neutral: true, halftime: { side: 'home', mode: 'hold' } });
    open += a.goals.filter(g => g.minute >= 46).length;
    hold += b.goals.filter(g => g.minute >= 46).length;
  }
  assert.ok(open > hold * 1.2, `offen ${open}, halten ${hold}`);
});

import { coachSuggestion, applyCoachSuggestion, spScore } from '../src/engine/extras.js';
test('Co-Trainer: müde Elf -> Fitness empfohlen, Übernehmen setzt nur Standards, Stil bleibt', () => {
  const s = newStartedGame(11); s.pending = null; ensureSetupOf(s);
  const setup = s.user.setup;
  for (const id of Object.values(setup.lineup)) s.players[id].condition = 60;
  const style = setup.style, formation = setup.formation;
  assert.equal(coachSuggestion(s).plan, 'fitness');
  const best = Object.values(setup.lineup).map(id => s.players[id]).filter(p => p.position !== 'TW')
    .sort((a, b) => spScore('pen', b) - spScore('pen', a))[0];
  assert.equal(coachSuggestion(s).setPieces.pen, best.id);
  assert.equal(applyCoachSuggestion(s).ok, true);
  assert.equal(setup.style, style); assert.equal(setup.formation, formation);
  assert.ok(!s.user.plan, 'Plan bleibt unberührt'); assert.equal(setup.setPieces.pen, best.id);
  const snap = JSON.stringify([setup.setPieces, s.user.plan]);
  applyCoachSuggestion(s);
  assert.equal(JSON.stringify([setup.setPieces, s.user.plan]), snap);
});

test('Wochenplan Standards: gültig, userBoosts.sp = 1', () => {
  const s = newStartedGame(5); s.pending = null; ensureSetupOf(s);
  assert.equal(setPlan(s, 'setpieces').ok, true);
  assert.equal(userBoosts(s).sp, 1);
  setPlan(s, 'normal');
  assert.equal(userBoosts(s).sp || 0, 0);
});

import { analyzeMatch } from '../src/engine/match.js';
test('Spielbericht: Wetter, Standardtore, Obergrenze 6, keine doppelten Gründe', () => {
  const s = newStartedGame(9); s.pending = null; ensureSetupOf(s);
  const rng = createRng(77);
  const mk = style => buildTeam(s, 'user', { ...s.user.setup, style });
  let seenWeather = false, seenSp = false;
  for (let n = 0; n < 60; n++) {
    const opp = Object.keys(s.clubs).find(c => c !== 'user');
    const r = simulateMatch(rng, mk('BALLBESITZ'), buildTeam(s, opp, aiSetup(rng, s, opp)), { weather: 'RAIN' });
    for (const side of ['home', 'away']) {
      const a = analyzeMatch(s, r, side);
      assert.ok(a.length <= 6);
      const ks = a.map(x => x.k); assert.equal(new Set(ks).size, ks.length);
      if (side === 'home' && ks.includes('why.weatherMinus')) seenWeather = true;
      if (ks.some(k => k.startsWith('why.setPieceGoals'))) seenSp = true;
    }
  }
  assert.ok(seenWeather, 'Wetter'); assert.ok(seenSp, 'Standard');
});

import { interviewAvailable, setInterview, resolveInterview } from '../src/engine/extras.js';
test('Pressekonferenz: Pause von 3 Spieltagen, PROVOKE wirkt, News entsteht', () => {
  const s = newStartedGame(13); s.pending = null; ensureSetupOf(s); ensureClubLife(s);
  const entry = { comp: 'cup', m: { home: 'user', away: Object.keys(s.clubs).find(c => c !== 'user') } };
  assert.equal(interviewAvailable(s, entry), true);
  const fans0 = s.user.mood.fans;
  assert.equal(setInterview(s, 'PROVOKE').ok, true);
  assert.ok(s.user.mood.fans > fans0);
  assert.equal(interviewAvailable(s, entry), true);   // offene Antwort bleibt sichtbar
  const news0 = s.inbox.length;
  resolveInterview(s, 'W');
  assert.equal(s.inbox.length, news0 + 1);
  assert.equal(interviewAvailable(s, entry), false);
  s.dayIndex += 2; assert.equal(interviewAvailable(s, entry), false);
  s.dayIndex += 1; assert.equal(interviewAvailable(s, entry), true);
});

// ---------------------------------------------------------------------------
// v1.11: Postfach-Aufgaben
// ---------------------------------------------------------------------------
import { addTask, openTasks, blockingTasks, resolveTask, expireTasks, autoResolveTasks, ensureTasks, registerTaskHandler } from '../src/engine/tasks.js';

test('Aufgaben: anlegen, blockieren, beantworten', () => {
  const s = newStartedGame(11); autoResolveTasks(s);
  let gone = false;
  registerTaskHandler('dummy', { resolve: (st, task, key) => (key === 'bad' ? { error: 'x' } : { ok: true }), alive: () => !gone, defaultChoice: 'yes' });
  const a = addTask(s, 'dummy', 'news.welcome', {}, { blocking: true, choices: [{ key: 'yes', label: 'a' }, { key: 'bad', label: 'b' }] });
  const b = addTask(s, 'dummy', 'news.welcome', {}, { blocking: false });
  const dummy = () => openTasks(s).filter(n => n.task.kind === 'dummy');
  assert.equal(dummy().length, 2);
  assert.equal(blockingTasks(s).length, 1);
  assert.equal(dummy()[0].id, a.id, 'blockierende zuerst');
  assert.ok(resolveTask(s, a.id, 'bad').error);
  assert.equal(a.task.status, 'open', 'Fehler lässt Aufgabe offen');
  assert.ok(resolveTask(s, a.id, 'yes').ok);
  assert.equal(a.task.status, 'done');
  assert.equal(a.task.answer, 'yes');
  assert.equal(blockingTasks(s).length, 0);
  gone = true; expireTasks(s);
  assert.equal(b.task.status, 'expired');
});

test('Aufgaben: autoResolve, Ablauf nach Tag, alter Spielstand', () => {
  const s = newStartedGame(12);
  registerTaskHandler('dummy2', { resolve: () => ({ ok: true }), defaultChoice: 'yes' });
  addTask(s, 'dummy2', 'news.welcome', {}, { blocking: true });
  addTask(s, 'dummy2', 'news.welcome', {}, { blocking: true });
  autoResolveTasks(s);
  assert.equal(blockingTasks(s).length, 0);
  const c = addTask(s, 'dummy2', 'news.welcome', {}, { blocking: false, expiresDay: s.dayIndex });
  s.dayIndex += 1; expireTasks(s);
  assert.equal(c.task.status, 'expired');
  delete s.inbox[0].task;
  ensureTasks(s);
  assert.equal(openTasks(s).filter(n => n.task.kind === 'dummy2').length, 0);
  s.pending = null; autoResolveTasks(s);
  assert.ok(playDay(s));
});

function gameWithOffer(seed) {
  const s = newStartedGame(seed);
  autoResolveTasks(s);
  const star = clubPlayers(s, 'user').sort((a, b) => b.ovr - a.ovr)[0];
  listPlayer(s, star.id, 'quick');
  for (let i = 0; i < 12 && !blockingTasks(s).length; i++) { s.pending = null; autoResolveTasks(s); playDay(s); }
  return { s, star };
}

test('Angebote: neues Angebot erzeugt blockierende Aufgabe; Verkaufen erledigt sie', () => {
  let found = null;
  for (let seed = 1; seed < 15 && !found; seed++) { const g = gameWithOffer(seed); if (blockingTasks(g.s).length) found = g; }
  assert.ok(found, 'irgendwann kommt ein Angebot');
  const { s } = found;
  const task = blockingTasks(s)[0];
  assert.equal(task.task.kind, 'offer');
  const pid = task.playerId;
  assert.ok(resolveTask(s, task.id, 'accept').ok);
  assert.notEqual(s.players[pid].clubId, 'user');
  assert.equal(task.task.status, 'done');
});

test('Angebote: Ablehnen über den Transferweg erledigt die Aufgabe, Standardwahl lehnt ab', () => {
  let found = null;
  for (let seed = 1; seed < 15 && !found; seed++) { const g = gameWithOffer(seed); if (blockingTasks(g.s).length) found = g; }
  const { s } = found;
  const task = blockingTasks(s)[0];
  declineOffer(s, task.task.ref);
  assert.equal(task.task.status, 'done');
  assert.equal(blockingTasks(s).length, 0);
  const f2 = (() => { for (let seed = 1; seed < 15; seed++) { const g = gameWithOffer(seed); if (blockingTasks(g.s).length) return g; } })();
  const t2 = blockingTasks(f2.s)[0];
  autoResolveTasks(f2.s);
  assert.equal(f2.s.players[t2.playerId].clubId, 'user');
  assert.equal(t2.task.answer, 'decline');
});

function untilInterviewTask(seed) {
  const s = newStartedGame(seed);
  for (let i = 0; i < 40; i++) {
    const t = openTasks(s).find(n => n.task.kind === 'interview');
    if (t) return { s, t };
    s.pending = null; autoResolveTasks(s); playDay(s);
  }
  return null;
}

test('Pressekonferenz: Aufgabe vor dem Spiel, Antwort setzt Interview, danach erledigt bzw. abgelaufen', () => {
  let a = null;
  for (let seed = 1; seed < 12 && !a; seed++) a = untilInterviewTask(seed);
  assert.ok(a, 'irgendwann gibt es eine Einladung');
  const { s, t } = a;
  assert.equal(t.task.blocking, false);
  assert.ok(resolveTask(s, t.id, 'BOLD').ok);
  assert.equal(s.user.interview.key, 'BOLD');
  assert.equal(resolveTask(s, t.id, 'CALM').code, 'gone');
  s.pending = null; autoResolveTasks(s); playDay(s);
  assert.equal(t.task.status, 'done');
  // unbeantwortet → abgelaufen
  let b = null;
  for (let seed = 20; seed < 32 && !b; seed++) b = untilInterviewTask(seed);
  assert.ok(b);
  b.s.pending = null; autoResolveTasks(b.s); playDay(b.s);
  assert.equal(b.t.task.status, 'expired');
  assert.ok(!b.s.user.interview);
});

import { chooseSeasonGoal, lowerSeasonGoal, canLowerGoal, goalAdvance, closeSeasonLife, GOAL_ORDER } from '../src/engine/clublife.js';

test('Saisonziel: nach dem Starter-Pack liegt eine blockierende Zielaufgabe vor', () => {
  const s = newStartedGame(31);
  const t = blockingTasks(s).find(n => n.task.kind === 'goal');
  assert.ok(t, 'Zielaufgabe');
  assert.ok(t.task.choices.some(c => c.key === 'standard'));
  autoResolveTasks(s);
  assert.equal(s.user.mood.goal.deal, 'standard');
});

test('Saisonziel: ehrgeizig zahlt Handgeld und hebt das Ziel; vorsichtig halbiert Prämie', () => {
  const s = newStartedGame(32);
  const g = s.user.mood.goal;
  const i = GOAL_ORDER.indexOf(g.key);
  if (i > 0) {
    const before = s.clubs.user.coins;
    assert.ok(chooseSeasonGoal(s, 'ambitious').ok);
    assert.equal(s.clubs.user.coins - before, goalAdvance(g.tier));
    assert.equal(g.key, GOAL_ORDER[i - 1]);
    assert.equal(chooseSeasonGoal(s, 'standard').code, 'gone', 'nur einmal');
  }
  const s2 = newStartedGame(33);
  const g2 = s2.user.mood.goal;
  if (GOAL_ORDER.indexOf(g2.key) < 3) {
    const b0 = s2.user.mood.board;
    assert.ok(chooseSeasonGoal(s2, 'cautious').ok);
    assert.equal(s2.user.mood.board, b0 - 3);
    const c0 = s2.clubs.user.coins;
    const full = closeSeasonLife(structuredClone(s2), g2.tier, 1);
    s2.clubs.user.coins = c0;
    assert.ok(full.bonus > 0);
  }
});

test('Saisonziel: Senken setzt lowered, keine Prämie; nach Spieltag 9 abgelehnt', () => {
  const s = newStartedGame(34);
  autoResolveTasks(s);
  s.user.mood.goal.key = 'top3'; s.user.mood.goal.maxPos = 3;
  assert.ok(canLowerGoal(s));
  const b0 = s.user.mood.board;
  assert.ok(lowerSeasonGoal(s).ok);
  assert.equal(s.user.mood.goal.key, 'ff');
  assert.equal(s.user.mood.goal.lowered, true);
  assert.equal(s.user.mood.board, b0 - 5);
  assert.equal(lowerSeasonGoal(s).ok, false, 'nur einmal');
  const r = closeSeasonLife(s, s.clubs.user.tier, 1);
  assert.equal(r.bonus, 0);
  const s2 = newStartedGame(35);
  autoResolveTasks(s2);
  s2.user.mood.goal.key = 'top3'; s2.user.mood.goal.maxPos = 3;
  for (let i = 0; i < 40 && s2.calendar.slice(0, s2.dayIndex).filter(d => d.type === 'league').length < 9; i++) { s2.pending = null; autoResolveTasks(s2); playDay(s2); }
  assert.equal(lowerSeasonGoal(s2).code, 'late');
});

test('Dauerplan: bleibt nach dem Spieltag gesetzt; Regeneration ohne Geld schaltet ab', () => {
  const s = newStartedGame(41); autoResolveTasks(s); s.pending = null; ensureSetupOf(s);
  setPlan(s, 'tactics');
  playDay(s); s.pending = null; autoResolveTasks(s);
  assert.equal(s.user.plan, 'tactics', 'Plan bleibt');
  playDay(s); s.pending = null;
  assert.equal(s.user.plan, 'tactics');
  setPlan(s, 'recovery');
  s.clubs.user.coins = 0;
  // bis zum nächsten eigenen Spiel
  for (let i = 0; i < 6 && s.user.plan === 'recovery'; i++) { s.pending = null; autoResolveTasks(s); playDay(s); }
  assert.ok(!s.user.plan, 'ohne Geld abgeschaltet');
  assert.ok(s.inbox.some(n => n.k === 'news.planOff'));
});

import { setPieceTaker } from '../src/engine/extras.js';
test('Standardschütze: Bank-Spieler gewählt -> es schießt der beste der Startelf', () => {
  const s = newStartedGame(51); autoResolveTasks(s); s.pending = null; ensureSetupOf(s);
  const setup = s.user.setup;
  const benchField = setup.bench.map(id => s.players[id]).find(p => p.position !== 'TW');
  assert.ok(benchField);
  setup.setPieces = { ...(setup.setPieces || {}), pen: benchField.id };
  const tk = setPieceTaker(s, setup, 'pen');
  assert.equal(tk.chosen.id, benchField.id);
  assert.equal(tk.replaced, true);
  const best = Object.values(setup.lineup).map(id => s.players[id]).filter(p => p.position !== 'TW')
    .sort((a, b) => spScore('pen', b) - spScore('pen', a))[0];
  assert.equal(tk.actual.id, best.id);
  const starter = Object.values(setup.lineup).map(id => s.players[id]).find(p => p.position !== 'TW');
  setup.setPieces.pen = starter.id;
  assert.equal(setPieceTaker(s, setup, 'pen').actual.id, starter.id);
  setup.setPieces.pen = null;
  assert.equal(setPieceTaker(s, setup, 'pen').chosen, null);
});

import { expiryWarning } from '../src/engine/contracts.js';
test('Vertrags-Hinweis: Aufgabe mit Sprungknopf, erledigt nach Verlängerung, sonst abgelaufen', () => {
  const s = newStartedGame(61); autoResolveTasks(s);
  const squad = clubPlayers(s, 'user');
  const [a, b] = squad;
  a.contract.until = s.season; b.contract.until = s.season;
  expiryWarning(s);
  const t1 = openTasks(s).find(n => n.task.kind === 'contracts');
  assert.ok(t1);
  assert.equal(t1.task.cta.go, 'squad'); assert.equal(t1.task.cta.filter, 'contract');
  assert.equal(t1.task.blocking, false);
  s.clubs.user.coins = 1e6;
  a.contract.until = s.season + 2; b.contract.until = s.season + 2;
  expireTasks(s);
  assert.equal(t1.task.status, 'done');
  // zweiter Fall: Saison wechselt, einer noch offen
  a.contract.until = s.season;
  expiryWarning(s);
  const t2 = openTasks(s).find(n => n.task.kind === 'contracts');
  assert.ok(t2);
  s.season += 1; expireTasks(s);
  assert.equal(t2.task.status, 'expired');
});

test('Einstieg: neues Spiel bekommt Aufgaben, Training erledigt sich durch Planwahl, alter Spielstand nicht', () => {
  const s = newStartedGame(71);
  const kinds = () => openTasks(s).filter(n => n.task.kind === 'onboard').map(n => n.task.ref).sort();
  assert.deepEqual(kinds(), ['identity', 'lineup', 'training']);
  assert.equal(blockingTasks(s).length, 1, 'nur das Saisonziel blockiert');
  assert.equal(blockingTasks(s)[0].task.kind, 'goal');
  setPlan(s, 'normal');
  assert.deepEqual(kinds(), ['identity', 'lineup']);
  autoResolveTasks(s); s.pending = null; ensureSetupOf(s);
  playDay(s);
  assert.ok(kinds().includes('report'), 'nach dem ersten Spiel: Warum?-Aufgabe');
  const old = newStartedGame(72);
  delete old.user.onboarding;
  old.inbox = [];
  ensureTasks(old);
  assert.equal(old.user.onboarding.done, true);
  assert.equal(openTasks(old).filter(n => n.task.kind === 'onboard').length, 0);
});
