// =============================================================================
// Spielwelt: 60 fiktive Vereine in 6 Ligen, jeder Spieler existiert genau einmal
// =============================================================================

import { createPlayer } from './player.js';
import { STYLE_KEYS, FORMATION_KEYS, AI_SQUAD_SIZE } from './constants.js';
import { generateName, pickNation } from './names.js';

/** Trainer mit fester Philosophie. Ein neuer Trainer bringt meist einen anderen Stil mit. */
export function newCoach(rng, avoidStyle = null, home = null) {
  const nation = pickNation(rng, home, 0.6);
  const { first, last } = generateName(rng, nation);
  const options = STYLE_KEYS.filter(k => k !== avoidStyle);
  const style = rng.pick(options);
  return { name: `${first} ${last}`, nation, style, age: rng.int(36, 64) };
}

export const LEAGUE_INFO = {
  1: { name: 'Apex Premier', short: 'Liga 1', baseOvr: 74 },
  2: { name: 'Pro Division', short: 'Liga 2', baseOvr: 69 },
  3: { name: 'Championship', short: 'Liga 3', baseOvr: 65 },
  4: { name: 'Contender League', short: 'Liga 4', baseOvr: 61 },
  5: { name: 'Regional League', short: 'Liga 5', baseOvr: 57 },
  6: { name: 'Amateur League', short: 'Liga 6', baseOvr: 53 }
};

/**
 * Fiktive Welt-Superliga: Vereine aus vielen Ländern, frei erfunden.
 * Die Namen spielen auf Städte und Regionen an, nie auf echte Vereine.
 * [Name, Kürzel, Land, Stadt, Primärfarbe, Sekundärfarbe]
 */
const CLUB_DATA = {
  1: [
    ['Real Meseta Madrid', 'RMM', 'ESP', 'Madrid', '#f8fafc', '#7c3aed'],
    ['Atlètic Barceloneta', 'ATB', 'ESP', 'Barcelona', '#b91c1c', '#facc15'],
    ['Westminster Royals', 'WMR', 'ENG', 'London', '#1e40af', '#facc15'],
    ['Irwell United', 'IRW', 'ENG', 'Manchester', '#dc2626', '#111827'],
    ['Inter Navigli', 'INV', 'ITA', 'Milano', '#0f766e', '#111827'],
    ['SV Isar München', 'ISA', 'GER', 'München', '#b91c1c', '#0ea5e9'],
    ['Paris Lumière', 'PLU', 'FRA', 'Paris', '#1d4ed8', '#dc2626'],
    ['Lisboa Atlântico', 'LIS', 'POR', 'Lisboa', '#047857', '#facc15'],
    ['AFC Grachten', 'AFG', 'NED', 'Amsterdam', '#ea580c', '#f8fafc'],
    ['Boğaziçi SK', 'BOĞ', 'TUR', 'İstanbul', '#eab308', '#1e3a8a']
  ],
  2: [
    ['Unión Manzanares', 'MAN', 'ESP', 'Madrid', '#dc2626', '#f8fafc'],
    ['Thames Athletic', 'THA', 'ENG', 'London', '#7e22ce', '#f8fafc'],
    ['AC Duomo', 'DUO', 'ITA', 'Milano', '#be123c', '#f8fafc'],
    ['FC Sabauda Torino', 'SAB', 'ITA', 'Torino', '#1e293b', '#fbbf24'],
    ['Westfalia Kohle', 'WEK', 'GER', 'Dortmund', '#facc15', '#1d4ed8'],
    ['Belém FC', 'BLM', 'POR', 'Lisboa', '#9f1239', '#f8fafc'],
    ['Kadıköy Spor', 'KAD', 'TUR', 'İstanbul', '#0369a1', '#facc15'],
    ['CA Riachuelo', 'RIA', 'ARG', 'Buenos Aires', '#0891b2', '#facc15'],
    ['Copacabana FC', 'COP', 'BRA', 'Rio de Janeiro', '#16a34a', '#facc15'],
    ['Mersey Rovers', 'MER', 'ENG', 'Liverpool', '#b91c1c', '#f8fafc']
  ],
  3: [
    ['Real Guadalquivir', 'GUA', 'ESP', 'Sevilla', '#f8fafc', '#dc2626'],
    ['Olympique Vieux-Port', 'OVP', 'FRA', 'Marseille', '#38bdf8', '#f8fafc'],
    ['FC Ribeira Porto', 'RIB', 'POR', 'Porto', '#1d4ed8', '#f8fafc'],
    ['Maasstad Rotterdam', 'MAA', 'NED', 'Rotterdam', '#dc2626', '#111827'],
    ['Clydeside FC', 'CLY', 'SCO', 'Glasgow', '#1e3a8a', '#dc2626'],
    ['NK Sava Zagreb', 'SAV', 'CRO', 'Zagreb', '#2563eb', '#f8fafc'],
    ['FK Danubius Beograd', 'DAN', 'SRB', 'Beograd', '#dc2626', '#f8fafc'],
    ['Sportivo Palermo', 'SPA', 'ARG', 'Buenos Aires', '#f8fafc', '#dc2626'],
    ['Paulistano FC', 'PAU', 'BRA', 'São Paulo', '#111827', '#f8fafc'],
    ['Hanseatic Hamburg', 'HAN', 'GER', 'Hamburg', '#1d4ed8', '#f8fafc']
  ],
  4: [
    ['Turia CF', 'TRI', 'ESP', 'Valencia', '#f97316', '#111827'],
    ['Lyon Confluence', 'LYC', 'FRA', 'Lyon', '#7c3aed', '#f8fafc'],
    ['Partenope Napoli', 'PAR', 'ITA', 'Napoli', '#0284c7', '#facc15'],
    ['Govan Thistle', 'GOV', 'SCO', 'Glasgow', '#16a34a', '#f8fafc'],
    ['HNK Jadran Split', 'JAD', 'CRO', 'Split', '#f8fafc', '#2563eb'],
    ['Akropolis FC', 'AKR', 'GRE', 'Athína', '#1d4ed8', '#f8fafc'],
    ['Royal Sablon Bruxelles', 'RSB', 'BEL', 'Bruxelles', '#7c3aed', '#f8fafc'],
    ['Øresund BK', 'ØRE', 'DEN', 'København', '#0ea5e9', '#f8fafc'],
    ['SK Prater Wien', 'PRA', 'AUT', 'Wien', '#16a34a', '#f8fafc'],
    ['FC Spree Berlin', 'SPR', 'GER', 'Berlin', '#dc2626', '#f8fafc']
  ],
  5: [
    ['Club Ría Bilbao', 'RÍA', 'ESP', 'Bilbao', '#dc2626', '#f8fafc'],
    ['Aire Valley Town', 'AIR', 'ENG', 'Leeds', '#f8fafc', '#1d4ed8'],
    ['SpVgg Zeche Ruhr', 'ZEC', 'GER', 'Gelsenkirchen', '#1d4ed8', '#f8fafc'],
    ['Mälaren IF', 'MÄL', 'SWE', 'Stockholm', '#facc15', '#1d4ed8'],
    ['Mazovia Warszawa', 'MAZ', 'POL', 'Warszawa', '#dc2626', '#f8fafc'],
    ['Club Azteca Capital', 'AZT', 'MEX', 'Ciudad de México', '#16a34a', '#dc2626'],
    ['Pacific Coast SC', 'PAC', 'USA', 'Los Angeles', '#111827', '#facc15'],
    ['Sumida FC', 'SUM', 'JPN', 'Tōkyō', '#1d4ed8', '#f8fafc'],
    ['Atlético Antioquia', 'ANT', 'COL', 'Medellín', '#16a34a', '#f8fafc'],
    ['AS Corniche Dakar', 'COR', 'SEN', 'Dakar', '#16a34a', '#facc15']
  ],
  6: [
    ['SV Förde Kiel', 'FÖR', 'GER', 'Kiel', '#1d4ed8', '#f8fafc'],
    ['Avon Harbour FC', 'AVO', 'ENG', 'Bristol', '#dc2626', '#f8fafc'],
    ['Lanterna Genova', 'LAN', 'ITA', 'Genova', '#1e3a8a', '#dc2626'],
    ['Garonne FC', 'GAR', 'FRA', 'Bordeaux', '#1e3a8a', '#f8fafc'],
    ['Lagoon Stars Lagos', 'LAG', 'NGA', 'Lagos', '#16a34a', '#f8fafc'],
    ['Atlas Casablanca', 'ATL', 'MAR', 'Casablanca', '#dc2626', '#16a34a'],
    ['Schelde Antwerpen', 'SCH', 'BEL', 'Antwerpen', '#dc2626', '#f8fafc'],
    ['Wawel Kraków', 'WAW', 'POL', 'Kraków', '#1d4ed8', '#f8fafc'],
    ['Cascadia FC Seattle', 'CAS', 'USA', 'Seattle', '#16a34a', '#1d4ed8']
  ]
};

/** Länder, aus denen ein eigener Verein gegründet werden kann */
export const FOUNDING_COUNTRIES = ['GER', 'ENG', 'ESP', 'ITA', 'FRA', 'NED', 'POR', 'AUT', 'BEL', 'SCO', 'TUR', 'POL', 'CRO', 'SRB', 'GRE', 'DEN', 'SWE', 'USA', 'MEX', 'BRA', 'ARG', 'COL', 'JPN', 'MAR', 'SEN', 'NGA'];

/** Wie stark das Heimatland den Kader prägt: oben internationaler, unten heimischer */
export function homeBiasFor(tier) {
  return [0, 0.5, 0.55, 0.6, 0.62, 0.65, 0.7][tier] ?? 0.6;
}

/** Rivalität zweier Vereine: 'derby' (gleiche Stadt), 'national' (gleiches Land) oder null */
export function rivalry(a, b) {
  if (!a || !b || a.id === b.id) return null;
  if (a.city && b.city && a.city === b.city) return 'derby';
  // Der eigene Verein hat keine Stadt: Vereine aus dem Heimatland sind seine Derby-Gegner
  if (a.country && b.country && a.country === b.country) return (a.isUser || b.isUser) ? 'derby' : 'national';
  return null;
}

/** Alle Rivalen eines Vereins, Derby-Gegner zuerst */
export function rivalsOf(state, clubId) {
  const me = state.clubs[clubId];
  return Object.values(state.clubs)
    .map(c => ({ club: c, type: rivalry(me, c) }))
    .filter(x => x.type)
    .sort((x, y) => (x.type === 'derby' ? 0 : 1) - (y.type === 'derby' ? 0 : 1));
}

const CREST_SHAPES = ['shield', 'round', 'hexagon', 'diamond', 'crown'];

/** Kaderschablone der KI-Vereine (21 Spieler); die ersten 11 sind die Stammelf im 4-3-3 */
const SQUAD_TEMPLATE = [
  'TW', 'LV', 'IV', 'IV', 'RV', 'ZM', 'ZDM', 'ZM', 'LF', 'ST', 'RF',
  'TW', 'IV', 'IV', 'LV', 'RV', 'ZDM', 'ZM', 'ZOM', 'LM', 'ST'
];

export function shortCode(name) {
  const words = name.replace(/[0-9]/g, '').split(/[\s-]+/).filter(Boolean);
  const prefixes = ['FC', 'SV', 'SC', 'TSV', 'VfL', 'VfB', 'VfR', 'FSV', 'TuS', 'SG', 'DJK', 'SpVgg', 'FV', 'TSG', 'AFC', 'AC', 'AS', 'CA', 'CF', 'SK', 'FK', 'NK', 'HNK', 'BK', 'IF', 'Club', 'Real', 'United', 'City', 'Athletic', 'Atlético', 'Sporting', 'Olympique', 'Royal', 'Inter', 'Deportivo', 'Spor'];
  const core = words.filter(w => !prefixes.includes(w));
  const word = (core[core.length > 1 && core[0].length <= 4 ? 1 : 0] || words[0] || 'XXX');
  return word.replace(/[^\p{L}]/gu, '').slice(0, 3).toUpperCase();
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
  const player = createPlayer(rng, { id: nextId(state, 'p'), position, age, ovr, home: club.country, homeBias: homeBiasFor(club.tier) });
  player.clubId = club.id;
  state.players[player.id] = player;
  club.playerIds.push(player.id);
  return player;
}

function createClub(rng, state, tier, idx, [name, short, country, city, primary, secondary]) {
  const id = `c${tier}_${idx}`;
  const club = {
    id,
    name,
    short: short || shortCode(name),
    country,
    city,
    tier,
    colors: { primary, secondary },
    crest: { shape: rng.pick(CREST_SHAPES), pattern: rng.int(0, 3) },
    isUser: false,
    strength: Math.round(rng.normal(0, 1.8) * 10) / 10,
    preferredStyle: null,
    preferredFormation: rng.pick(FORMATION_KEYS),
    playerIds: [],
    coins: 4000 + (7 - tier) * 3000,
    reputation: (7 - tier) * 15
  };
  club.coach = newCoach(rng, null, club.country);
  club.preferredStyle = club.coach.style;
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
    country: userClubConfig.country || 'GER',
    city: userClubConfig.city || null,
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
