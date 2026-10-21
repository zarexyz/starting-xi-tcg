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

export function buyPlayer(state, playerId) {
  const p = state.players[playerId];
  const user = state.clubs.user;
  if (!p || p.clubId === 'user') return { error: t('err.notAvailable') };
  const will = willingness(state, p);
  if (!will.ok) return { error: will.reason };
  if (user.playerIds.length >= MAX_SQUAD) return { error: t('err.squadFull', { max: MAX_SQUAD }) };
  const price = askingPrice(state, p);
  if (user.coins < price) return { error: t('err.coins') };
  const seller = state.clubs[p.clubId];

  user.coins -= price;
  state.user.ledger.unshift({ season: state.season, day: state.dayIndex, label: 'ledger.buy', lp: { name: displayName(p) }, amount: -price });
  seller.coins += price;
  seller.playerIds = seller.playerIds.filter(id => id !== p.id);
  p.clubId = 'user';
  p.ovrHistory = [{ s: state.season, h: 0, ovr: p.ovr }];
  p.morale = Math.min(100, p.morale + 10);
  user.playerIds.push(p.id);
  withRng(state, rng => refillAiClub(rng, state, seller, p.position));
  state.user.setup = repairLineup(state, 'user', state.user.setup || { formation: '4-3-3', style: 'AUSGEWOGEN', lineup: {}, bench: [] });
  return { ok: true, price, message: t('market.bought', { name: displayName(p), price: fmtNum(price) }) };
}

/**
 * Angebote für einen eigenen Spieler. Pro Spieltag fest, damit man nicht neu würfeln kann.
 */
export function getOffers(state, playerId) {
  const p = state.players[playerId];
  if (!p || p.clubId !== 'user') return [];
  let h = state.dayIndex * 7919 + state.season * 104729;
  for (const ch of playerId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const rng = createRng(h);
  const value = marketValue(p);
  // Passende Liga: dort, wo der Spieler Stammspieler wäre
  const fits = Object.values(state.clubs).filter(c => !c.isUser && Math.abs(LEAGUE_INFO[c.tier].baseOvr + 2 - p.ovr) <= 6);
  const pool = fits.length ? fits : Object.values(state.clubs).filter(c => !c.isUser);
  const clubs = rng.shuffle(pool).slice(0, rng.int(1, 3));
  return clubs.map(c => ({
    clubId: c.id,
    amount: Math.round((value * rng.float(0.75, 1.08) * (1 + (6 - c.tier) * 0.04)) / 10) * 10
  })).sort((a, b) => b.amount - a.amount);
}

export function acceptOffer(state, playerId, clubId) {
  const offer = getOffers(state, playerId).find(o => o.clubId === clubId);
  const p = state.players[playerId];
  const user = state.clubs.user;
  if (!offer || !p) return { error: t('err.offerGone') };
  if (user.playerIds.length <= MIN_SQUAD) return { error: t('err.minSquad') };
  const buyer = state.clubs[clubId];
  user.playerIds = user.playerIds.filter(id => id !== playerId);
  user.coins += offer.amount;
  state.user.ledger.unshift({ season: state.season, day: state.dayIndex, label: 'ledger.sell', lp: { name: displayName(p) }, amount: offer.amount });
  p.clubId = clubId;
  buyer.playerIds.push(p.id);
  // Käufer gibt seinen schwächsten Spieler dieser Positionsgruppe ab (beendet seine Laufbahn)
  const group = POSITION_GROUP[p.position];
  const weakest = clubPlayers(state, clubId)
    .filter(x => x.id !== p.id && POSITION_GROUP[x.position] === group)
    .sort((a, b) => a.ovr - b.ovr)[0];
  if (weakest && buyer.playerIds.length > AI_SQUAD_SIZE) {
    buyer.playerIds = buyer.playerIds.filter(id => id !== weakest.id);
    delete state.players[weakest.id];
  }
  if (state.user.setup) state.user.setup = repairLineup(state, 'user', state.user.setup);
  return { ok: true, message: t('market.sold', { name: displayName(p), price: fmtNum(offer.amount), club: buyer.name }) };
}

/** Am Saisonende: Vereine höherer Ligen holen sich Talente aus tieferen Ligen (Tausch) */
export function aiTransferWindow(rng, state) {
  const moves = [];
  for (let tier = 1; tier <= 5; tier++) {
    for (const buyerId of state.leagues[tier].clubIds) {
      const buyer = state.clubs[buyerId];
      if (buyer.isUser || !rng.chance(0.45)) continue;
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

export function wageImpact(p) {
  return salaryFor(p.ovr);
}
