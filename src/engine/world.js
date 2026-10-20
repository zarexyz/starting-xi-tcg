// =============================================================================
// Spielwelt: 60 fiktive Vereine in 6 Ligen, jeder Spieler existiert genau einmal
// =============================================================================

import { createPlayer } from './player.js';
import { STYLE_KEYS, FORMATION_KEYS, AI_SQUAD_SIZE } from './constants.js';

export const LEAGUE_INFO = {
  1: { name: 'Apex Premier', short: 'Liga 1', baseOvr: 74 },
  2: { name: 'Pro Division', short: 'Liga 2', baseOvr: 69 },
  3: { name: 'Championship', short: 'Liga 3', baseOvr: 65 },
  4: { name: 'Oberliga', short: 'Liga 4', baseOvr: 61 },
  5: { name: 'Landesklasse', short: 'Liga 5', baseOvr: 57 },
  6: { name: 'Amateurliga', short: 'Liga 6', baseOvr: 53 }
};

const CLUB_DATA = {
  1: [
    ['Apex Zenith', '#0f766e', '#facc15'], ['Real Metropol', '#1d4ed8', '#f8fafc'],
    ['FC Alpenkrone', '#b91c1c', '#facc15'], ['Dynamo Hauptstadt', '#7e22ce', '#f8fafc'],
    ['Borussia Titan', '#eab308', '#111827'], ['Imperial Milano', '#1e3a8a', '#111827'],
    ['Athletic Küste', '#047857', '#f8fafc'], ['Olympique Nord', '#0891b2', '#f8fafc'],
    ['Sporting Royal', '#15803d', '#f8fafc'], ['United Prestige', '#ea580c', '#111827']
  ],
  2: [
    ['SV Nordhafen', '#0369a1', '#f8fafc'], ['Kickers Westend', '#16a34a', '#111827'],
    ['VfL Bergstadt', '#dc2626', '#f8fafc'], ['Union Adler', '#6d28d9', '#facc15'],
    ['SpVgg Sonnenburg', '#ca8a04', '#111827'], ['FC Rheinstrom', '#0d9488', '#f8fafc'],
    ['SC Waldheim', '#166534', '#f8fafc'], ['Fortuna Stern', '#b91c1c', '#f8fafc'],
    ['FSV Eisenbahner', '#475569', '#38bdf8'], ['TuS Kronberg', '#6b21a8', '#f8fafc']
  ],
  3: [
    ['Rot-Weiß Hafen', '#dc2626', '#f8fafc'], ['Blau-Gelb Ost', '#2563eb', '#facc15'],
    ['SV Moorweide', '#059669', '#f8fafc'], ['FC Stahlwerk', '#64748b', '#f97316'],
    ['Concordia Süd', '#0891b2', '#f8fafc'], ['Teutonia Berg', '#4338ca', '#f8fafc'],
    ['VfB Flussdelta', '#047857', '#f8fafc'], ['SG Heideblick', '#d97706', '#111827'],
    ['Eintracht Tal', '#be185d', '#f8fafc'], ['Alemannia Forst', '#1e293b', '#34d399']
  ],
  4: [
    ['FC Vorwärts 1912', '#e11d48', '#f8fafc'], ['TSV Wackerbrück', '#1d4ed8', '#f8fafc'],
    ['SV Falkenlust', '#15803d', '#facc15'], ['DJK Rheinufer', '#0284c7', '#f8fafc'],
    ['SC Schwarz-Gold', '#111827', '#f59e0b'], ['SpVgg Zeche', '#334155', '#e2e8f0'],
    ['FC Grenzland', '#4338ca', '#f8fafc'], ['VfR Eichengrund', '#166534', '#f8fafc'],
    ['FV Donautal', '#0369a1', '#f8fafc'], ['TuS Bergbaustolz', '#b45309', '#111827']
  ],
  5: [
    ['SV Grün-Weiß Aue', '#16a34a', '#f8fafc'], ['FC Hansa Bucht', '#0284c7', '#f8fafc'],
    ['Kickers Steinbruch', '#b91c1c', '#f8fafc'], ['SpVgg Sandhügel', '#d97706', '#111827'],
    ['FC Viktoria Moor', '#7c3aed', '#f8fafc'], ['TSG Waldrand', '#059669', '#f8fafc'],
    ['SV Rothenburg', '#dc2626', '#f8fafc'], ['Union Industrie', '#475569', '#f8fafc'],
    ['FSV Birkenhain', '#0d9488', '#f8fafc'], ['SC Blau-Weiß 08', '#2563eb', '#f8fafc']
  ],
  6: [
    ['SV Eisenstadt', '#0284c7', '#f8fafc'], ['Kickers West', '#ea580c', '#f8fafc'],
    ['SpVgg Nordstern', '#4f46e5', '#f8fafc'], ['FC Vorwärts Mühle', '#10b981', '#f8fafc'],
    ['TSV Eintracht Au', '#dc2626', '#f8fafc'], ['Dynamo Süd', '#eab308', '#111827'],
    ['SC Fortuna Heide', '#0d9488', '#f8fafc'], ['SV Blau-Weiß Ried', '#2563eb', '#f8fafc'],
    ['FC Union Kies', '#b91c1c', '#f8fafc']
  ]
};

const CREST_SHAPES = ['shield', 'round', 'hexagon', 'diamond', 'crown'];

/** Kaderschablone der KI-Vereine (21 Spieler); die ersten 11 sind die Stammelf im 4-3-3 */
const SQUAD_TEMPLATE = [
  'TW', 'LV', 'IV', 'IV', 'RV', 'ZM', 'ZDM', 'ZM', 'LF', 'ST', 'RF',
  'TW', 'IV', 'IV', 'LV', 'RV', 'ZDM', 'ZM', 'ZOM', 'LM', 'ST'
];

export function shortCode(name) {
  const words = name.replace(/[0-9]/g, '').split(/[\s-]+/).filter(Boolean);
  const prefixes = ['FC', 'SV', 'SC', 'TSV', 'VfL', 'VfB', 'VfR', 'FSV', 'TuS', 'SG', 'DJK', 'SpVgg', 'FV', 'TSG'];
  const core = words.filter(w => !prefixes.includes(w));
  const word = (core[core.length > 1 && core[0].length <= 4 ? 1 : 0] || words[0] || 'XXX');
  return word.replace(/[^A-Za-zÄÖÜäöüß]/g, '').slice(0, 3).toUpperCase();
}

export function nextId(state, prefix) {
  state.nextId = (state.nextId || 1) + 1;
  return `${prefix}${state.nextId.toString(36)}`;
}

/** Alter nach Dreiecksverteilung um 26 */
function rollAge(rng, min = 17, max = 34) {
  const a = rng.float(min, max);
  const b = rng.float(min, max);
  return Math.round((a + b) / 2);
}

/**
 * Spieler für einen KI-Verein erzeugen. Junge Spieler sind schwächer, haben aber Potenzial.
 */
export function createClubPlayer(rng, state, club, position, isCore, opts = {}) {
  const base = LEAGUE_INFO[club.tier].baseOvr + (club.strength || 0);
  const age = opts.age ?? rollAge(rng);
  let ovr = base + rng.normal(0, 2.6) + (isCore ? 2 : -2);
  if (age <= 20) ovr -= (21 - age) * 2.2;
  if (age >= 32) ovr -= (age - 31) * 0.8;
  ovr = Math.round(Math.max(40, Math.min(92, ovr)));
  const player = createPlayer(rng, { id: nextId(state, 'p'), position, age, ovr });
  player.clubId = club.id;
  state.players[player.id] = player;
  club.playerIds.push(player.id);
  return player;
}

function createClub(rng, state, tier, idx, [name, primary, secondary]) {
  const id = `c${tier}_${idx}`;
  const club = {
    id,
    name,
    short: shortCode(name),
    tier,
    colors: { primary, secondary },
    crest: { shape: rng.pick(CREST_SHAPES), pattern: rng.int(0, 3) },
    isUser: false,
    strength: Math.round(rng.normal(0, 1.8) * 10) / 10,
    preferredStyle: rng.pick(STYLE_KEYS),
    preferredFormation: rng.pick(FORMATION_KEYS),
    playerIds: [],
    coins: 4000 + (7 - tier) * 3000,
    reputation: (7 - tier) * 15
  };
  state.clubs[id] = club;
  SQUAD_TEMPLATE.slice(0, AI_SQUAD_SIZE).forEach((pos, i) => createClubPlayer(rng, state, club, pos, i < 11));
  return club;
}

/**
 * Erzeugt die komplette Welt. Der Verein des Spielers kommt leer in Liga 6 und wird über das Starter-Pack gefüllt.
 */
export function createWorld(rng, state, userClubConfig) {
  state.clubs = {};
  state.players = {};
  state.leagues = {};

  for (let tier = 1; tier <= 6; tier++) {
    const clubIds = [];
    CLUB_DATA[tier].forEach((data, idx) => {
      clubIds.push(createClub(rng, state, tier, idx, data).id);
    });
    state.leagues[tier] = { tier, ...LEAGUE_INFO[tier], clubIds, fixtures: [] };
  }

  const user = {
    id: 'user',
    name: userClubConfig.name,
    short: shortCode(userClubConfig.name),
    tier: 6,
    colors: { primary: userClubConfig.primary, secondary: userClubConfig.secondary },
    crest: { shape: userClubConfig.crest || 'shield', pattern: userClubConfig.pattern ?? 0 },
    isUser: true,
    strength: 0,
    preferredStyle: 'AUSGEWOGEN',
    preferredFormation: '4-3-3',
    playerIds: [],
    coins: 2500,
    reputation: 5
  };
  state.clubs.user = user;
  state.leagues[6].clubIds.push('user');
  return state;
}

export function clubPlayers(state, clubId) {
  return state.clubs[clubId].playerIds.map(id => state.players[id]).filter(Boolean);
}

export function clubStrength(state, clubId) {
  const ps = clubPlayers(state, clubId).sort((a, b) => b.ovr - a.ovr).slice(0, 11);
  if (!ps.length) return 0;
  return Math.round(ps.reduce((s, p) => s + p.ovr, 0) / ps.length);
}
