// =============================================================================
// Packs & Verbrauchsgegenstände
// Spieler-Packs enthalten nur NEUE Spieler, die gerade in die Welt kommen.
// Man wählt 1 aus 3 – die anderen beiden betreten die Welt nie.
// =============================================================================

import { createPlayer } from './player.js';
import { TIERS, ATTR_NAMES, OVR_WEIGHTS } from './constants.js';
import { t } from '../i18n/index.js';
import { nextId, LEAGUE_INFO } from './world.js';
import { clamp } from './rng.js';

export const CONSUMABLES = {
  FITNESS: {
    get name() { return t('item.FITNESS.name'); }, get desc() { return t('item.FITNESS.desc'); },
    icon: 'battery', rarity: 'bronze', target: 'player',
  },
  REGEN: {
    get name() { return t('item.REGEN.name'); }, get desc() { return t('item.REGEN.desc'); },
    icon: 'spa', rarity: 'silver', target: 'team',
  },
  MEDICAL: {
    get name() { return t('item.MEDICAL.name'); }, get desc() { return t('item.MEDICAL.desc'); },
    icon: 'medical', rarity: 'silver', target: 'injured',
  },
  TRAIN: {
    get name() { return t('item.TRAIN.name'); }, get desc() { return t('item.TRAIN.desc'); },
    icon: 'dumbbell', rarity: 'bronze', target: 'player', perAttr: true,
  },
  TRAIN_PLUS: {
    get name() { return t('item.TRAIN_PLUS.name'); }, get desc() { return t('item.TRAIN_PLUS.desc'); },
    icon: 'flame', rarity: 'gold', target: 'player', perAttr: true,
  },
  BOOST: {
    get name() { return t('item.BOOST.name'); }, get desc() { return t('item.BOOST.desc'); },
    icon: 'up', rarity: 'bronze', target: 'player', perAttr: true,
  },
  MORALE: {
    get name() { return t('item.MORALE.name'); }, get desc() { return t('item.MORALE.desc'); },
    icon: 'megaphone', rarity: 'bronze', target: 'team',
  },
  TACTIC: {
    get name() { return t('item.TACTIC.name'); }, get desc() { return t('item.TACTIC.desc'); },
    icon: 'clipboard', rarity: 'silver', target: 'match',
  },
  RETRAIN: {
    get name() { return t('item.RETRAIN.name'); }, get desc() { return t('item.RETRAIN.desc'); },
    icon: 'swap', rarity: 'gold', target: 'player'
  }
};

export const PACKS = {
  talent: {
    key: 'talent', get name() { return t('pack.talent.name'); }, price: 1400, kind: 'draft',
    get desc() { return t('pack.talent.desc'); },
    tiers: { bronze: 64, silver: 32, gold: 4, icon: 0 },
    ages: [16, 20], veteranChance: 0
  },
  scout: {
    key: 'scout', get name() { return t('pack.scout.name'); }, price: 3300, kind: 'draft',
    get desc() { return t('pack.scout.desc'); },
    tiers: { bronze: 30, silver: 52, gold: 16, icon: 2 },
    ages: [18, 26], veteranChance: 0.45
  },
  elite: {
    key: 'elite', get name() { return t('pack.elite.name'); }, price: 9500, kind: 'draft',
    get desc() { return t('pack.elite.desc'); },
    tiers: { bronze: 0, silver: 0, gold: 92, icon: 8 },
    ages: [18, 27], veteranChance: 0.35
  },
  gear: {
    key: 'gear', get name() { return t('pack.gear.name'); }, price: 500, kind: 'items',
    get desc() { return t('pack.gear.desc'); },
    count: 4
  }
};

const POSITIONS_POOL = ['TW', 'IV', 'IV', 'LV', 'RV', 'ZDM', 'ZM', 'ZM', 'ZOM', 'LM', 'RM', 'LF', 'RF', 'ST', 'ST'];

/** Restwachstum je nach Alter: Wie weit liegt die aktuelle Stärke unter dem Potenzial? */
function growthRemaining(rng, age) {
  if (age <= 16) return rng.int(17, 22);
  if (age <= 17) return rng.int(14, 19);
  if (age <= 18) return rng.int(11, 16);
  if (age <= 19) return rng.int(9, 13);
  if (age <= 20) return rng.int(7, 11);
  if (age <= 21) return rng.int(5, 9);
  if (age <= 23) return rng.int(3, 6);
  if (age <= 25) return rng.int(1, 3);
  return rng.int(0, 1);
}

/** Je höher die Liga des Spielers, desto besser fallen die Packs aus */
function leagueShift(tier) {
  return (6 - tier) * 2.2;
}

export function draftCandidate(rng, state, pack, position, forceVeteran = false) {
  const userTier = state.clubs.user.tier;
  const tier = rng.weighted(Object.entries(pack.tiers).map(([value, weight]) => ({ value, weight })));
  const t = TIERS[tier];
  // Potenzial innerhalb der Klasse, mit leichter Verschiebung nach Liga
  let potential = Math.round(clamp(rng.float(t.potMin, t.potMax) + leagueShift(userTier) * 0.4, t.potMin, t.potMax));

  let age;
  let ovr;
  if (forceVeteran) {
    age = rng.int(28, 32);
    potential = Math.round(clamp(LEAGUE_INFO[userTier].baseOvr + rng.int(1, 6) + (TIERS[tier].order - 1) * 3, t.potMin, t.potMax));
    ovr = potential - Math.max(0, age - 29) * rng.int(1, 2);
  } else {
    age = rng.int(pack.ages[0], pack.ages[1]);
    ovr = potential - growthRemaining(rng, age);
  }
  ovr = clamp(Math.round(ovr), 38, 94);
  const player = createPlayer(rng, { id: nextId(state, 'p'), position, age, ovr, potential, tier, home: state.clubs.user.country, homeBias: 0.25 });
  player.isNew = true;
  return player;
}

/** Drei Kandidaten für ein Draft-Pack – unterschiedliche Positionen */
export function generateDraft(rng, state, packKey) {
  const pack = PACKS[packKey];
  const positions = rng.shuffle([...new Set(POSITIONS_POOL)]).slice(0, 3);
  const veteranSlot = rng.chance(pack.veteranChance) ? rng.int(0, 2) : -1;
  return positions.map((pos, i) => draftCandidate(rng, state, pack, pos, i === veteranSlot));
}

/** Welche Werte Trainings- und Matchkarten treffen können (Torwart seltener) */
const TRAIN_ATTRS = [
  { value: 'tem', weight: 3 }, { value: 'sch', weight: 3 }, { value: 'pas', weight: 3 }, { value: 'dri', weight: 3 },
  { value: 'abw', weight: 3 }, { value: 'phy', weight: 3 }, { value: 'men', weight: 2.5 }, { value: 'tor', weight: 1.5 }
];

export function generateItems(rng, count) {
  const weights = { bronze: 6, silver: 3, gold: 1 };
  const entries = Object.entries(CONSUMABLES).map(([type, c]) => ({ value: type, weight: weights[c.rarity] }));
  return Array.from({ length: count }, () => {
    const type = rng.weighted(entries);
    return CONSUMABLES[type].perAttr ? { type, attr: rng.weighted(TRAIN_ATTRS) } : { type };
  });
}

/** Anzeige-Daten eines Gegenstands, inklusive Wert bei Trainings- und Matchkarten */
export function itemDef(item) {
  const type = typeof item === 'string' ? item : item.type;
  const base = CONSUMABLES[type];
  const attr = typeof item === 'object' && item.attr;
  if (!base.perAttr || !attr) return { ...base, type };
  const n = ATTR_NAMES[attr];
  const amount = type === 'BOOST' ? 6 : type === 'TRAIN_PLUS' ? 2 : 1;
  const name = t(`item.${type}.named`, { attr: n });
  const desc = t(type === 'BOOST' ? 'item.descTemp' : 'item.descPerm', { amount, attr: n });
  return { ...base, type, attr, name, desc, amount };
}

/** Passt ein Wert zur Position? (für die Sortierung bei der Spielerwahl) */
export function attrMatters(position, attr) {
  return (OVR_WEIGHTS[position]?.[attr] || 0) > 0;
}

// -----------------------------------------------------------------------------
// Starter
// -----------------------------------------------------------------------------

const STARTER_POSITIONS = ['TW', 'TW', 'LV', 'IV', 'IV', 'IV', 'RV', 'ZDM', 'ZM', 'ZM', 'ZM', 'ZOM', 'LM', 'RM', 'LF', 'RF', 'ST', 'ST'];

/** 18 Spieler für den neu gegründeten Verein: solide Amateure, leicht unter Liga-Schnitt */
export function generateStarterSquad(rng, state) {
  const base = LEAGUE_INFO[6].baseOvr;
  return STARTER_POSITIONS.map((position, i) => {
    const core = [0, 2, 3, 4, 6, 7, 8, 9, 14, 16, 15].includes(i);
    const age = rng.int(18, 31);
    let ovr = base + (core ? 1 : -2) + rng.normal(0, 1.8);
    if (age <= 20) ovr -= 2;
    ovr = Math.round(clamp(ovr, 46, 58));
    const growth = age <= 21 ? rng.int(4, 10) : age <= 25 ? rng.int(1, 5) : rng.int(0, 2);
    return createPlayer(rng, {
      id: nextId(state, 'p'), position, age, ovr, home: state.clubs.user.country, homeBias: 0.55,
      potential: clamp(ovr + growth, ovr, 66), tier: 'bronze'
    });
  });
}

/** Starspieler-Wahl: drei Silber-Talente mit echter Perspektive */
export function generateStarDraft(rng, state) {
  const positions = [rng.pick(['ST', 'LF', 'RF']), rng.pick(['ZOM', 'ZM']), rng.pick(['IV', 'TW', 'ZDM'])];
  return positions.map(position => {
    const age = rng.int(19, 23);
    const potential = rng.int(70, 76);
    const ovr = clamp(Math.round(LEAGUE_INFO[6].baseOvr + rng.int(5, 8)), 54, 64);
    const p = createPlayer(rng, { id: nextId(state, 'p'), position, age, ovr, potential, tier: 'silver', home: state.clubs.user.country, homeBias: 0.3 });
    p.isNew = true;
    return p;
  });
}
