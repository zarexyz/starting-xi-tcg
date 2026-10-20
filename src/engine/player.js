// =============================================================================
// Spieler: Erzeugung, Stärke je Position, Entwicklung, Gehalt & Marktwert
// =============================================================================

import {
  FIELD_ATTRS, GK_ATTRS, ALL_ATTRS, OVR_WEIGHTS, RELATED_POSITIONS, POSITION_GROUP,
  TIERS, tierForPotential
} from './constants.js';
import { generateName, pickNation } from './names.js';
import { clamp } from './rng.js';

const ATTR_MIN = 15;
const ATTR_MAX = 99;

/** Stärke eines Spielers auf einer bestimmten Position (nur Attribute, ohne Tagesform) */
export function ovrAt(player, pos) {
  const weights = OVR_WEIGHTS[pos];
  let sum = 0;
  for (const key in weights) sum += (player.attrs[key] ?? 30) * weights[key];
  return sum;
}

export function calcOvr(player) {
  return Math.round(ovrAt(player, player.position));
}

/** Faktor, wie gut ein Spieler auf eine Position passt (1 = Stammposition) */
export function familiarity(player, pos) {
  if (pos === player.position) return 1;
  if (player.secondary?.includes(pos)) return 0.98;
  const related = RELATED_POSITIONS[player.position]?.[pos];
  if (related) return related;
  const gA = POSITION_GROUP[player.position];
  const gB = POSITION_GROUP[pos];
  if (gA === 'GK' || gB === 'GK') return 0.45;
  if (gA === gB) return 0.88;
  return 0.76;
}

/** Leistungsfaktor nach Fitness: bis 75 % kaum spürbar, darunter deutlicher Abfall */
export function fitnessFactor(condition) {
  if (condition >= 75) return 1 - (100 - condition) * 0.0036;
  return 0.91 - (75 - condition) * 0.009;
}

/** Tatsächliche Stärke im Spiel: Position, Fitness, Moral */
export function effectiveRating(player, pos) {
  const base = ovrAt(player, pos) * familiarity(player, pos);
  const fitness = fitnessFactor(player.condition);
  const morale = 0.96 + 0.08 * (player.morale / 100);
  return base * fitness * morale;
}

/** Profil je Position: Abweichung der Attribute vom Zielwert */
function attrProfile(pos) {
  const w = OVR_WEIGHTS[pos];
  const profile = {};
  for (const a of FIELD_ATTRS) {
    profile[a] = w[a] ? 2 + w[a] * 10 : -12;
  }
  if (pos === 'TW') {
    for (const a of FIELD_ATTRS) profile[a] = -28;
    profile.tem = -18;
    profile.phy = -6;
    for (const a of GK_ATTRS) profile[a] = 2 + (w[a] || 0) * 10;
  } else {
    for (const a of GK_ATTRS) profile[a] = null; // Feldspieler: niedrige Torwartwerte
  }
  return profile;
}

/**
 * Erzeugt Attribute so, dass die Stärke auf der Stammposition ≈ targetOvr ist.
 */
function buildAttrs(rng, pos, targetOvr) {
  const profile = attrProfile(pos);
  const attrs = {};
  for (const a of ALL_ATTRS) {
    if (profile[a] === null) {
      attrs[a] = rng.int(12, 28);
    } else {
      attrs[a] = targetOvr + profile[a] + rng.normal(0, 4);
    }
  }
  // Auf Zielstärke normalisieren (nur die gewichteten Attribute verschieben)
  const weights = OVR_WEIGHTS[pos];
  for (let i = 0; i < 3; i++) {
    const current = ovrAt({ attrs }, pos);
    const diff = targetOvr - current;
    for (const a in weights) attrs[a] += diff;
  }
  for (const a of ALL_ATTRS) attrs[a] = Math.round(clamp(attrs[a], ATTR_MIN, ATTR_MAX));
  return attrs;
}

/** Aussehen für den Porträt-Generator – einmal festgelegt, ein Leben lang gleich */
function buildLook(rng, nation) {
  const darkSkinNations = ['SEN', 'NGA'];
  const mixedNations = ['BRA', 'FRA', 'ENG', 'NED', 'POR'];
  let skin;
  if (darkSkinNations.includes(nation)) skin = rng.int(4, 6);
  else if (mixedNations.includes(nation)) skin = rng.weighted([
    { value: 0, weight: 2 }, { value: 1, weight: 3 }, { value: 2, weight: 3 },
    { value: 3, weight: 2 }, { value: 4, weight: 2 }, { value: 5, weight: 1 }
  ]);
  else skin = rng.weighted([
    { value: 0, weight: 4 }, { value: 1, weight: 4 }, { value: 2, weight: 2 }, { value: 3, weight: 1 }, { value: 4, weight: 0.6 }
  ]);
  const darkHair = skin >= 3 || ['ESP', 'ITA', 'POR', 'BRA', 'ARG', 'CRO'].includes(nation);
  return {
    skin,
    face: rng.int(0, 3),
    hair: rng.int(0, 9),
    hairColor: darkHair ? rng.weighted([{ value: 0, weight: 6 }, { value: 1, weight: 3 }, { value: 2, weight: 1 }])
      : rng.weighted([{ value: 0, weight: 2 }, { value: 1, weight: 3 }, { value: 2, weight: 3 }, { value: 3, weight: 2 }, { value: 4, weight: 1 }]),
    beard: rng.weighted([{ value: 0, weight: 5 }, { value: 1, weight: 2 }, { value: 2, weight: 2 }, { value: 3, weight: 1 }]),
    brows: rng.int(0, 2),
    eyes: rng.int(0, 2),
    nose: rng.int(0, 2),
    mouth: rng.int(0, 2)
  };
}

/** Potenzial aus Talentklasse würfeln */
export function rollPotential(rng, tier) {
  const t = TIERS[tier];
  return rng.int(t.potMin, t.potMax);
}

/**
 * Neuen Spieler erzeugen.
 * opts: { id, position, age, ovr, potential?, tier?, nation?, look? }
 */
export function createPlayer(rng, opts) {
  const nation = opts.nation || pickNation(rng);
  const { first, last } = generateName(rng, nation);
  let potential = opts.potential;
  if (potential == null) {
    potential = opts.tier
      ? rollPotential(rng, opts.tier)
      : clamp(Math.round(opts.ovr + Math.max(0, (24 - opts.age)) * rng.float(0.8, 2.6) + rng.float(0, 3)), opts.ovr, 95);
  }
  potential = Math.max(potential, opts.ovr);
  const tier = opts.tier || tierForPotential(potential);
  const attrs = buildAttrs(rng, opts.position, opts.ovr);

  const secondary = [];
  const related = Object.keys(RELATED_POSITIONS[opts.position] || {});
  if (related.length && rng.chance(0.55)) secondary.push(rng.pick(related));
  if (related.length > 1 && rng.chance(0.2)) {
    const other = rng.pick(related);
    if (!secondary.includes(other)) secondary.push(other);
  }

  const player = {
    id: opts.id,
    first,
    last,
    nation,
    age: opts.age,
    position: opts.position,
    secondary,
    tier,
    potential,
    /** Scout-Einschätzung: unscharfe Spanne um das echte Potenzial */
    potentialGuess: [
      clamp(potential - rng.int(1, 5), opts.ovr, 99),
      clamp(potential + rng.int(1, 5), opts.ovr, 99)
    ],
    attrs,
    ovr: 0,
    condition: 100,
    morale: 75,
    injury: null, // { days, label }
    trainingBoosts: 0,
    look: opts.look || buildLook(rng, nation),
    clubId: null,
    stats: { apps: 0, goals: 0, assists: 0, ratingSum: 0, motm: 0 },
    careerStats: { apps: 0, goals: 0, assists: 0 },
    form: []
  };
  player.ovr = calcOvr(player);
  return player;
}

export function displayName(p) {
  return `${p.first} ${p.last}`;
}

export function shortName(p) {
  return `${p.first[0]}. ${p.last}`;
}

// -----------------------------------------------------------------------------
// Entwicklung
// -----------------------------------------------------------------------------

function ageGrowth(age) {
  if (age <= 19) return 2.6;
  if (age <= 21) return 2.0;
  if (age <= 23) return 1.4;
  if (age <= 26) return 0.6;
  if (age <= 29) return 0;
  if (age <= 31) return -0.9;
  if (age <= 33) return -1.7;
  return -2.8;
}

/**
 * Halbjährliche Entwicklung. minutesShare = Anteil gespielter Minuten (0..1).
 * Gibt die OVR-Veränderung zurück.
 */
export function developPlayer(rng, player, minutesShare = 0.5) {
  const before = player.ovr;
  const softCap = TIERS[player.tier].softCap;
  let growth = ageGrowth(player.age);

  if (growth > 0) {
    const gap = player.potential - player.ovr;
    let gapFactor = gap > 0 ? clamp(gap / 7, 0.35, 1.6) : 0.2;
    if (player.ovr >= softCap) gapFactor *= 0.35;
    growth *= gapFactor * (0.6 + 0.7 * minutesShare);
  }
  growth += rng.normal(0, 0.7);
  applyOvrChange(rng, player, growth);
  return player.ovr - before;
}

/** Verteilt eine OVR-Änderung auf die passenden Attribute */
export function applyOvrChange(rng, player, delta) {
  if (Math.abs(delta) < 0.2) return;
  const weights = OVR_WEIGHTS[player.position];
  const keys = Object.keys(weights);
  // Bei Abbau verlieren Tempo und Physis zuerst
  for (const a of keys) {
    let share = delta;
    if (delta < 0 && (a === 'tem' || a === 'phy')) share *= 1.5;
    if (delta < 0 && (a === 'pas' || a === 'ste' || a === 'spi')) share *= 0.5;
    player.attrs[a] = Math.round(clamp(player.attrs[a] + share + rng.normal(0, 0.6), ATTR_MIN, ATTR_MAX));
  }
  player.ovr = calcOvr(player);
}

/**
 * Trainingskarte: gezielter Push. Wirkt oberhalb der Talentgrenze kaum noch.
 */
export function trainPlayer(rng, player, amount) {
  const softCap = TIERS[player.tier].softCap;
  let effect = amount;
  if (player.ovr >= player.potential) effect *= 0.4;
  if (player.ovr >= softCap) effect *= 0.25;
  const before = player.ovr;
  applyOvrChange(rng, player, effect);
  player.trainingBoosts++;
  return player.ovr - before;
}

// -----------------------------------------------------------------------------
// Wirtschaft
// -----------------------------------------------------------------------------

/** Gehalt pro Spieltag – steigt exponentiell mit der Stärke */
export function salaryFor(ovr) {
  return Math.round(6 * Math.pow(1.095, ovr - 50));
}

export function marketValue(player) {
  const base = 300 * Math.pow(1.12, player.ovr - 50);
  let ageF = 1;
  if (player.age <= 21) ageF = 1.45;
  else if (player.age <= 25) ageF = 1.25;
  else if (player.age <= 29) ageF = 1;
  else if (player.age <= 31) ageF = 0.7;
  else ageF = 0.45;
  const potF = 1 + Math.max(0, player.potential - player.ovr) / 25;
  const tierF = { bronze: 1, silver: 1.1, gold: 1.25, icon: 1.6 }[player.tier];
  return Math.round((base * ageF * potF * tierF) / 10) * 10;
}
