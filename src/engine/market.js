import { t, fmtNum } from '../i18n/index.js';
// =============================================================================
// Transfermarkt: Spieler anderer Vereine kaufen, eigene Spieler verkaufen,
// KI-Vereine handeln am Saisonende untereinander. Jeder Spieler bleibt einmalig.
// =============================================================================

import { marketValue, salaryFor, displayName } from './player.js';
import { clubPlayers, createClubPlayer, LEAGUE_INFO } from './world.js';
import { POSITION_GROUP, MAX_SQUAD, MIN_SQUAD, AI_SQUAD_SIZE } from './constants.js';
import { createRng, withRng } from './rng.js';
import { effectiveRating } from './player.js';
import { repairLineup } from './ai.js';
import { contractDemand, signContract, defaultYears, ensureContract } from './contracts.js';
import { MATCHDAYS } from './constants.js';

/** Hash für feste Zufallsentscheidungen pro Tag (kein Neuwürfeln durch Neuladen) */
function dayHash(state, key) {
  let h = state.dayIndex * 7919 + state.season * 104729;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

// -----------------------------------------------------------------------------
// Transferfenster: offen vom Saisonstart bis einschließlich Spieltag 9
// -----------------------------------------------------------------------------

export const WINDOW_CLOSES_AFTER = Math.floor(MATCHDAYS / 2);

export function leagueDaysPlayed(state) {
  return state.calendar.slice(0, state.dayIndex).filter(d => d.type === 'league').length;
}

export function transferWindow(state) {
  const played = leagueDaysPlayed(state);
  return { open: played < WINDOW_CLOSES_AFTER, played, closesAfter: WINDOW_CLOSES_AFTER, left: Math.max(0, WINDOW_CLOSES_AFTER - played) };
}

/** Wie wichtig ist der Spieler für seinen Verein? 0 = Reservist … 1 = Leistungsträger */
function importance(state, p) {
  const mates = clubPlayers(state, p.clubId).sort((a, b) => b.ovr - a.ovr);
  const rank = mates.findIndex(m => m.id === p.id);
  if (rank < 3) return 1;
  if (rank < 11) return 0.5;
  return 0;
}

export function askingPrice(state, p) {
  const club = state.clubs[p.clubId];
  const tierF = 1 + (6 - club.tier) * 0.06;
  const imp = importance(state, p);
  return Math.round((marketValue(p) * tierF * (1 + imp * 0.6)) / 10) * 10;
}

/** Will der Spieler überhaupt zu dir? */
export function willingness(state, p) {
  const userTier = state.clubs.user.tier;
  const club = state.clubs[p.clubId];
  if (club.tier <= userTier - 2) {
    return { ok: false, reason: t('market.no.twoDown', { league: LEAGUE_INFO[club.tier].name }) };
  }
  if (p.injury) return { ok: false, reason: t('market.no.injured') };
  if (club.tier === userTier - 1 && p.ovr >= LEAGUE_INFO[club.tier].baseOvr + 6) {
    return { ok: false, reason: t('market.no.keyPlayer') };
  }
  return { ok: true };
}

/**
 * Suche auf dem Transfermarkt.
 * filter: { group, maxPrice, tier, sort, affordable, query }
 */
export function searchMarket(state, filter = {}) {
  const coins = state.clubs.user.coins;
  const out = [];
  for (const club of Object.values(state.clubs)) {
    if (club.isUser) continue;
    if (filter.tier && club.tier !== filter.tier) continue;
    for (const id of club.playerIds) {
      const p = state.players[id];
      if (!p) continue;
      if (filter.group && filter.group !== 'ALL' && POSITION_GROUP[p.position] !== filter.group) continue;
      if (filter.pos && p.position !== filter.pos) continue;
      const price = askingPrice(state, p);
      if (filter.affordable && price > coins) continue;
      const will = willingness(state, p);
      if (filter.onlyWilling && !will.ok) continue;
      out.push({ id: p.id, price, willing: will.ok, ovr: p.ovr, age: p.age, pot: (p.potentialGuess[0] + p.potentialGuess[1]) / 2 });
    }
  }
  const sorts = {
    ovr: (a, b) => b.ovr - a.ovr,
    price: (a, b) => a.price - b.price,
    age: (a, b) => a.age - b.age,
    pot: (a, b) => b.pot - a.pot
  };
  out.sort(sorts[filter.sort] || sorts.ovr);
  return out;
}

function refillAiClub(rng, state, club, position) {
  while (club.playerIds.length < AI_SQUAD_SIZE) {
    createClubPlayer(rng, state, club, position, false, { age: rng.int(17, 20) });
  }
}

export function buyPlayer(state, playerId, priceOverride = null) {
  const p = state.players[playerId];
  const user = state.clubs.user;
  if (!p || p.clubId === 'user') return { error: t('err.notAvailable') };
  if (!transferWindow(state).open) return { error: t('err.windowClosed') };
  const will = willingness(state, p);
  if (!will.ok) return { error: will.reason };
  if (user.playerIds.length >= MAX_SQUAD) return { error: t('err.squadFull', { max: MAX_SQUAD }) };
  const price = priceOverride ?? askingPrice(state, p);
  if (user.coins < price) return { error: t('err.coins') };
  const seller = state.clubs[p.clubId];

  user.coins -= price;
  state.user.ledger.unshift({ season: state.season, day: state.dayIndex, label: 'ledger.buy', lp: { name: displayName(p) }, amount: -price });
  seller.coins += price;
  seller.playerIds = seller.playerIds.filter(id => id !== p.id);
  p.clubId = 'user';
  p.ovrHistory = [{ s: state.season, h: 0, ovr: p.ovr }];
  p.morale = Math.min(100, p.morale + 10);
  signContract(state, p, contractDemand(state, p), defaultYears(p.age));
  user.playerIds.push(p.id);
  if (state.user.counters) delete state.user.counters[p.id];
  withRng(state, rng => refillAiClub(rng, state, seller, p.position));
  state.user.setup = repairLineup(state, 'user', state.user.setup || { formation: '4-3-3', style: 'AUSGEWOGEN', lineup: {}, bench: [] });
  return { ok: true, price, message: t('market.bought', { name: displayName(p), price: fmtNum(price) }) };
}

/**
 * Gebot unter dem geforderten Preis (85 %). Der Verein nimmt an, lehnt ab oder
 * macht ein Gegenangebot. Die Antwort steht pro Tag fest.
 */
export function bidLow(state, playerId) {
  const p = state.players[playerId];
  if (!p || p.clubId === 'user') return { error: t('err.notAvailable') };
  if (!transferWindow(state).open) return { error: t('err.windowClosed') };
  const will = willingness(state, p);
  if (!will.ok) return { error: will.reason };
  const ask = askingPrice(state, p);
  const bid = Math.round((ask * 0.85) / 10) * 10;
  if (state.clubs.user.coins < bid) return { error: t('err.coins') };
  const counters = state.user.counters || (state.user.counters = {});
  const prev = counters[playerId];
  if (prev && prev.day === state.dayIndex) return { error: t('err.alreadyBid') };
  const imp = importance(state, p);
  const r = (dayHash(state, playerId + 'bid') % 1000) / 1000;
  const acceptP = 0.5 - imp * 0.35 + (p.age >= 30 ? 0.15 : 0);
  if (r < acceptP) {
    const res = buyPlayer(state, playerId, bid);
    return res.ok ? { ...res, outcome: 'accepted' } : res;
  }
  if (imp >= 1 && r > 0.8) {
    counters[playerId] = { day: state.dayIndex, amount: null };
    return { ok: true, outcome: 'rejected', message: t('market.bidRejected', { club: state.clubs[p.clubId].name }) };
  }
  const counter = Math.round((ask * (0.92 + ((r * 1000) % 5) / 100)) / 10) * 10;
  counters[playerId] = { day: state.dayIndex, amount: counter };
  return { ok: true, outcome: 'counter', amount: counter, message: t('market.bidCounter', { club: state.clubs[p.clubId].name, price: fmtNum(counter) }) };
}

/** Gegenangebot des Vereins (gilt nur am selben Tag) */
export function counterOffer(state, playerId) {
  const c = state.user.counters?.[playerId];
  return c && c.day === state.dayIndex ? c : null;
}

export function acceptCounter(state, playerId) {
  const c = counterOffer(state, playerId);
  if (!c || !c.amount) return { error: t('err.offerGone') };
  return buyPlayer(state, playerId, c.amount);
}

// -----------------------------------------------------------------------------
// Verkaufen: Spieler auf die Transferliste setzen. Angebote kommen über die
// Spieltage – oder auch nicht, je nach Preis, Alter und Nachfrage.
// -----------------------------------------------------------------------------

export const LIST_LEVELS = { quick: 0.85, fair: 1, high: 1.2 };

export function listPlayer(state, playerId, level = 'fair') {
  const p = state.players[playerId];
  if (!p || p.clubId !== 'user') return { error: t('err.notAvailable') };
  const listings = state.user.listings || (state.user.listings = {});
  const price = Math.round((marketValue(p) * (LIST_LEVELS[level] || 1)) / 10) * 10;
  listings[playerId] = { price, level, since: state.dayIndex };
  return { ok: true, price, message: t('market.listed', { name: displayName(p), price: fmtNum(price) }) };
}

export function unlistPlayer(state, playerId) {
  if (state.user.listings) delete state.user.listings[playerId];
  state.user.offers = (state.user.offers || []).filter(o => o.playerId !== playerId || o.unsolicited);
  return { ok: true };
}

export function offersFor(state, playerId) {
  return (state.user.offers || []).filter(o => o.playerId === playerId).sort((a, b) => b.amount - a.amount);
}

function offerChance(state, p, ask) {
  const ratio = ask / Math.max(1, marketValue(p));
  let c = ratio <= 0.88 ? 0.7 : ratio <= 1.02 ? 0.42 : ratio <= 1.15 ? 0.22 : ratio <= 1.3 ? 0.08 : 0.02;
  if (p.age >= 34) c *= 0.25; else if (p.age >= 32) c *= 0.5;
  if (p.injury) c *= 0.3;
  if (p.ovr < LEAGUE_INFO[6].baseOvr - 4) c *= 0.3;
  return c;
}

function suitors(state, p, minTier = 1) {
  const fits = Object.values(state.clubs).filter(c => !c.isUser && c.tier >= minTier && Math.abs(LEAGUE_INFO[c.tier].baseOvr + 2 - p.ovr) <= 6);
  return fits.length ? fits : Object.values(state.clubs).filter(c => !c.isUser);
}

/**
 * Nach jedem Spieltag im offenen Fenster: Angebote für gelistete Spieler und
 * gelegentlich unaufgeforderte Angebote für formstarke Spieler.
 * Gibt die neuen Angebote zurück (für News).
 */
export function processTransferDay(rng, state) {
  const offers = state.user.offers || (state.user.offers = []);
  // Alte Angebote verfallen nach drei Tagen
  state.user.offers = offers.filter(o => state.dayIndex - o.day <= 3 && state.players[o.playerId]?.clubId === 'user');
  const fresh = [];
  if (!transferWindow(state).open) {
    state.user.offers = [];
    return fresh;
  }
  const listings = state.user.listings || {};
  for (const [pid, l] of Object.entries(listings)) {
    const p = state.players[pid];
    if (!p || p.clubId !== 'user') { delete listings[pid]; continue; }
    if (!rng.chance(offerChance(state, p, l.price))) continue;
    const club = rng.pick(suitors(state, p));
    const value = marketValue(p);
    const amount = Math.round((l.price <= value * 1.1 ? l.price * rng.float(0.9, 1) : Math.min(l.price, value * rng.float(1, 1.15))) / 10) * 10;
    const o = { id: `o${++state.nextId}`, playerId: pid, clubId: club.id, amount, day: state.dayIndex, unsolicited: false };
    state.user.offers.push(o);
    fresh.push(o);
  }
  // Unaufgeforderte Angebote: höherklassige Vereine wollen formstarke Spieler
  const userTier = state.clubs.user.tier;
  if (userTier > 1 && rng.chance(0.12)) {
    const stars = clubPlayers(state, 'user')
      .filter(p => !listings[p.id] && (p.form || []).length >= 3 && p.form.reduce((s, x) => s + x, 0) / p.form.length >= 6.9)
      .filter(p => !state.user.offers.some(o => o.playerId === p.id))
      .sort((a, b) => b.ovr - a.ovr);
    const p = stars[0];
    if (p) {
      const higher = Object.values(state.clubs).filter(c => !c.isUser && c.tier === userTier - 1);
      const club = rng.pick(higher);
      const amount = Math.round((marketValue(p) * rng.float(1.1, 1.4)) / 10) * 10;
      const o = { id: `o${++state.nextId}`, playerId: p.id, clubId: club.id, amount, day: state.dayIndex, unsolicited: true };
      state.user.offers.push(o);
      fresh.push(o);
    }
  }
  return fresh;
}

export function acceptOffer(state, offerId) {
  const offer = (state.user.offers || []).find(o => o.id === offerId);
  const p = offer && state.players[offer.playerId];
  const user = state.clubs.user;
  if (!offer || !p || p.clubId !== 'user') return { error: t('err.offerGone') };
  if (!transferWindow(state).open) return { error: t('err.windowClosed') };
  if (user.playerIds.length <= MIN_SQUAD) return { error: t('err.minSquad') };
  const buyer = state.clubs[offer.clubId];
  user.playerIds = user.playerIds.filter(id => id !== p.id);
  user.coins += offer.amount;
  state.user.ledger.unshift({ season: state.season, day: state.dayIndex, label: 'ledger.sell', lp: { name: displayName(p) }, amount: offer.amount });
  state.user.record = state.user.record || {};
  state.user.record.salesIncome = (state.user.record.salesIncome || 0) + offer.amount;
  p.clubId = buyer.id;
  buyer.playerIds.push(p.id);
  ensureContract(state, p);
  // Käufer gibt seinen schwächsten Spieler dieser Positionsgruppe ab (beendet seine Laufbahn)
  const group = POSITION_GROUP[p.position];
  const weakest = clubPlayers(state, buyer.id)
    .filter(x => x.id !== p.id && POSITION_GROUP[x.position] === group)
    .sort((a, b) => a.ovr - b.ovr)[0];
  if (weakest && buyer.playerIds.length > AI_SQUAD_SIZE) {
    buyer.playerIds = buyer.playerIds.filter(id => id !== weakest.id);
    delete state.players[weakest.id];
  }
  if (state.user.listings) delete state.user.listings[p.id];
  state.user.offers = state.user.offers.filter(o => o.playerId !== p.id);
  if (state.user.setup) state.user.setup = repairLineup(state, 'user', state.user.setup);
  return { ok: true, message: t('market.sold', { name: displayName(p), price: fmtNum(offer.amount), club: buyer.name }) };
}

/** Angebot ablehnen. Ein großes Angebot eines höherklassigen Vereins enttäuscht den Spieler. */
export function declineOffer(state, offerId) {
  const offer = (state.user.offers || []).find(o => o.id === offerId);
  if (!offer) return { error: t('err.offerGone') };
  const p = state.players[offer.playerId];
  state.user.offers = state.user.offers.filter(o => o.id !== offerId);
  const buyer = state.clubs[offer.clubId];
  if (p && buyer && buyer.tier < state.clubs.user.tier && offer.amount >= marketValue(p) * 1.1) {
    p.morale = Math.max(30, p.morale - 10);
    return { ok: true, message: t('market.declinedUpset', { name: p.last }) };
  }
  return { ok: true, message: t('market.declined') };
}

/** Am Saisonende: Vereine höherer Ligen holen sich Talente aus tieferen Ligen (Tausch) */
export function aiTransferWindow(rng, state, share = 0.45) {
  const moves = [];
  for (let tier = 1; tier <= 5; tier++) {
    for (const buyerId of state.leagues[tier].clubIds) {
      const buyer = state.clubs[buyerId];
      if (buyer.isUser || !rng.chance(share)) continue;
      const squad = clubPlayers(state, buyerId).sort((a, b) => a.ovr - b.ovr);
      const weakest = squad.slice(0, 8)[rng.int(0, 5)];
      if (!weakest) continue;
      const group = POSITION_GROUP[weakest.position];
      const targets = Object.values(state.players).filter(p => {
        const c = state.clubs[p.clubId];
        return c && !c.isUser && c.tier > tier && c.tier <= tier + 2 && POSITION_GROUP[p.position] === group &&
          effectiveRating(p, weakest.position) > effectiveRating(weakest, weakest.position) + 2 && p.age <= 29;
      });
      if (!targets.length) continue;
      const target = rng.pick(targets);
      const seller = state.clubs[target.clubId];
      // Tausch: Ziel kommt, Schwächster geht zum abgebenden Verein
      seller.playerIds = seller.playerIds.filter(id => id !== target.id);
      buyer.playerIds = buyer.playerIds.filter(id => id !== weakest.id);
      target.clubId = buyerId;
      weakest.clubId = seller.id;
      buyer.playerIds.push(target.id);
      seller.playerIds.push(weakest.id);
      moves.push({ playerId: target.id, from: seller.id, to: buyerId });
    }
  }
  return moves;
}

export function wageImpact(state, p) {
  return contractDemand(state, p);
}
