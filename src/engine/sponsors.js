// =============================================================================
// Sponsoren-Karten (v1.12): Zu Saisonbeginn legt der Vorstand drei Karten vor,
// der Spieler unterschreibt genau eine. Jede Karte zahlt ein Fixum je Heimspiel
// und (außer dem Sicherheits-Partner) eine Prämie, wenn im Pflichtspiel eine
// Bedingung erfüllt ist. Alle Beträge hängen an TIER_INCOME der eigenen Liga.
// Die Werte sind so gewählt, dass jede Karte über eine Saison etwa gleich viel
// zahlt (check.mjs) – die Karte färbt Entscheidungen, sie ist keine Pflicht.
// =============================================================================

import { TIER_INCOME } from './economy.js';
import { clubPlayers } from './world.js';
import { addNews, ledger } from './game.js';
import { addTask } from './tasks.js';
import { createRng } from './rng.js';

/** base = Fixum je Heimspiel, bonus = Prämie je erfüllter Bedingung (Anteile von TIER_INCOME) */
export const SPONSOR_CARDS = {
  safety:    { base: 0.15, bonus: 0,    cond: null },
  spectacle: { base: 0.05, bonus: 0.26, cond: 'goals3' },
  wall:      { base: 0.05, bonus: 0.22, cond: 'cleanSheet' },
  academy:   { base: 0.04, bonus: 0.07, cond: 'youth3' },
  underdog:  { base: 0.05, bonus: 0.31, cond: 'underdog' }
};
export const SPONSOR_KEYS = Object.keys(SPONSOR_CARDS);
export const SPONSOR_OFFERS = 3;
/** Ab diesem Stärkevorsprung des Gegners zählt ein Punktgewinn für den Favoritenschreck */
export const UNDERDOG_GAP = 3;
/** So viele U21-Spieler oder Eigengewächse braucht die Talentschmiede in der Startelf */
export const YOUTH_NEEDED = 3;

const round10 = x => Math.round(x / 10) * 10;

/** Beträge einer Karte in der aktuellen Liga */
export function sponsorTerms(state, id, tier = state.clubs.user.tier) {
  const c = SPONSOR_CARDS[id];
  if (!c) return null;
  const inc = TIER_INCOME[tier] || TIER_INCOME[6];
  return { id, cond: c.cond, base: round10(inc * c.base), bonus: c.bonus ? Math.max(10, round10(inc * c.bonus)) : 0 };
}

export const isYouthPlayer = p => !!p && (p.age <= 21 || !!p.fromYouth);

/** Grundzustand, auch für alte Spielstände. Neue Saison: neue Angebote. */
export function ensureSponsor(state) {
  const u = state.user;
  if (!u) return;
  if (!u.sponsor || u.sponsor.season !== state.season) {
    const rng = createRng(((state.seed >>> 0) * 13 + state.season * 101 + 7) >>> 0);
    u.sponsor = { season: state.season, offers: rng.shuffle([...SPONSOR_KEYS]).slice(0, SPONSOR_OFFERS), active: null, paid: 0, hits: 0 };
  }
  ensureSponsorTask(state);
}

/** Blockierende Aufgabe im Postfach (einmal je Saison, erst wenn der Kader steht) */
export function ensureSponsorTask(state) {
  const sp = state.user?.sponsor;
  if (!sp || sp.active || sp.season !== state.season) return null;
  if (state.pending?.type === 'starter' || clubPlayers(state, 'user').length < 11) return null;
  if ((state.inbox || []).some(n => n.task?.kind === 'sponsor' && n.task.ref === String(state.season))) return null;
  const choices = sp.offers.map(id => ({ key: id, label: `sponsor.${id}.name`, hint: `sponsor.${id}.cond`, tone: 'secondary' }));
  return addTask(state, 'sponsor', 'news.sponsorTask', { season: state.season }, { blocking: true, ref: String(state.season), choices }, { newsType: 'board' });
}

/** Eine der drei vorgelegten Karten unterschreiben. Gibt { ok } oder { ok: false, code } zurück. */
export function pickSponsor(state, id) {
  const sp = state.user?.sponsor;
  if (!sp || sp.season !== state.season || sp.active) return { ok: false, code: 'gone' };
  if (!sp.offers.includes(id)) return { ok: false, code: 'bad' };
  sp.active = id;
  const terms = sponsorTerms(state, id);
  addNews(state, 'board', 'news.sponsorSigned', { nameK: `sponsor.${id}.name`, baseC: terms.base, bonusC: terms.bonus, condK: `sponsor.${id}.cond` });
  return { ok: true };
}

/** Ist die Bedingung der Karte in diesem Spiel erfüllt? */
export function sponsorConditionMet(state, cond, info) {
  if (cond === 'goals3') return info.gf >= 3;
  if (cond === 'cleanSheet') return info.ga === 0;
  if (cond === 'youth3') return (info.starters || []).filter(id => isYouthPlayer(state.players[id])).length >= YOUTH_NEEDED;
  if (cond === 'underdog') {
    if (info.outcome === 'L') return false;
    const gap = (info.strengths?.opp ?? 0) - (info.strengths?.mine ?? 0);
    return gap >= UNDERDOG_GAP || info.comp === 'cup' || !!info.derby;
  }
  return false;
}

/**
 * Abrechnung nach jedem Pflichtspiel des eigenen Vereins.
 * info: { home (zählt als Heimspiel), gf, ga, outcome, starters, comp, derby, strengths: { mine, opp }, label }
 * Gibt { base, bonus, id } zurück (0, wenn kein Sponsor unterschrieben ist).
 */
export function settleSponsor(state, info) {
  const sp = state.user?.sponsor;
  if (!sp?.active || sp.season !== state.season) return { base: 0, bonus: 0, id: null };
  const terms = sponsorTerms(state, sp.active);
  const base = info.home ? terms.base : 0;
  const bonus = terms.bonus && sponsorConditionMet(state, terms.cond, info) ? terms.bonus : 0;
  if (base) ledger(state, 'ledger.sponsor', base, { day: info.label, nameK: `sponsor.${sp.active}.name` });
  if (bonus) {
    ledger(state, 'ledger.sponsorBonus', bonus, { day: info.label, nameK: `sponsor.${sp.active}.name` });
    sp.hits++;
  }
  sp.paid += base + bonus;
  return { base, bonus, id: sp.active };
}

/** Für die Saisonbilanz */
export function sponsorSummary(state) {
  const sp = state.user?.sponsor;
  if (!sp?.active) return null;
  return { id: sp.active, paid: sp.paid, hits: sp.hits };
}
