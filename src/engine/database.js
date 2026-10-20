// =============================================================================
// Starting XI TCG — World Database Generator (60 Teams, 6 Leagues, 1.150 Unique Players)
// =============================================================================

import { getRarityTier } from './ratings.js';

const FIRST_NAMES = [
  'Lukas', 'Maximilian', 'Julian', 'Felix', 'Jonas', 'Paul', 'Noah', 'Elias', 'Leon', 'Moritz',
  'David', 'Mateo', 'Kylian', 'Antoine', 'Aurélien', 'Théo', 'Eduardo', 'Ousmane', 'Marcus', 'Declan',
  'Jude', 'Bukayo', 'Cole', 'Phil', 'Trent', 'Harry', 'Pedri', 'Gavi', 'Lamine', 'Ferran',
  'Alejandro', 'Rodri', 'Nicolò', 'Federico', 'Sandro', 'Alessandro', 'Gianluigi', 'Rafael', 'Bruno', 'Bernardo',
  'Diogo', 'João', 'Ruben', 'Frenkie', 'Cody', 'Virgil', 'Xavi', 'Teun', 'Tijjani', 'Erling'
];

const LAST_NAMES = [
  'Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Bauer', 'Hoffmann',
  'Diallo', 'Traoré', 'Camara', 'Koné', 'Fofana', 'Touré', 'Sanogo', 'Bellingham', 'Saka', 'Rice',
  'Palmer', 'Foden', 'Alexander', 'Kane', 'Sterling', 'García', 'López', 'Martínez', 'Rodríguez', 'Hernández',
  'Silva', 'Santos', 'Ferreira', 'Pereira', 'Oliveira', 'Barella', 'Chiesa', 'Tonali', 'Bastoni', 'Donnarumma',
  'de Jong', 'Gakpo', 'van Dijk', 'Simons', 'Koopmeiners', 'Reijnders', 'Haaland', 'Ødegaard', 'Højlund', 'Isak'
];

const NATIONS = [
  { code: 'GER', name: 'Deutschland', flag: '🇩🇪' },
  { code: 'FRA', name: 'Frankreich', flag: '🇫🇷' },
  { code: 'ENG', name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { code: 'ESP', name: 'Spanien', flag: '🇪🇸' },
  { code: 'ITA', name: 'Italien', flag: '🇮🇹' },
  { code: 'POR', name: 'Portugal', flag: '🇵🇹' },
  { code: 'NED', name: 'Niederlande', flag: '🇳🇱' },
  { code: 'NOR', name: 'Norwegen', flag: '🇳🇴' },
  { code: 'SEN', name: 'Senegal', flag: '🇸🇳' },
  { code: 'CIV', name: 'Elfenbeinküste', flag: '🇨🇮' }
];

const LEAGUES_DATA = [
  {
    tier: 1,
    name: 'Liga 1 (Apex Premier)',
    baseOVR: 78,
    teams: [
      { name: 'Apex Zenith', primaryColor: '#00f59b', secondaryColor: '#ffd15c' },
      { name: 'Real Metropol', primaryColor: '#38bdf8', secondaryColor: '#ffffff' },
      { name: 'FC Bavaria Gold', primaryColor: '#ef4444', secondaryColor: '#ffd15c' },
      { name: 'Dynamo Hauptstadt', primaryColor: '#a855f7', secondaryColor: '#ffffff' },
      { name: 'Borussia Titan', primaryColor: '#eab308', secondaryColor: '#000000' },
      { name: 'Inter Imperial', primaryColor: '#3b82f6', secondaryColor: '#000000' },
      { name: 'Athletic Coast', primaryColor: '#10b981', secondaryColor: '#ffffff' },
      { name: 'Olympique Nord', primaryColor: '#06b6d4', secondaryColor: '#ffffff' },
      { name: 'Sporting Royal', primaryColor: '#22c55e', secondaryColor: '#ffffff' },
      { name: 'United Prestige', primaryColor: '#f97316', secondaryColor: '#000000' }
    ]
  },
  {
    tier: 2,
    name: 'Liga 2 (Pro Division)',
    baseOVR: 74,
    teams: [
      { name: 'SV Nordhafen', primaryColor: '#0284c7', secondaryColor: '#ffffff' },
      { name: 'Kickers Westend', primaryColor: '#16a34a', secondaryColor: '#000000' },
      { name: 'VfL Bergstadt', primaryColor: '#dc2626', secondaryColor: '#ffffff' },
      { name: 'Union Adler', primaryColor: '#7c3aed', secondaryColor: '#ffd15c' },
      { name: 'SpVgg Sonnenburg', primaryColor: '#ca8a04', secondaryColor: '#000000' },
      { name: 'FC Rheinstrom', primaryColor: '#0d9488', secondaryColor: '#ffffff' },
      { name: 'SC Waldheim', primaryColor: '#15803d', secondaryColor: '#ffffff' },
      { name: 'Fortuna Stern', primaryColor: '#b91c1c', secondaryColor: '#ffffff' },
      { name: 'FSV Eisenbahner', primaryColor: '#475569', secondaryColor: '#38bdf8' },
      { name: 'TuS Kronberg', primaryColor: '#6b21a8', secondaryColor: '#ffffff' }
    ]
  },
  {
    tier: 3,
    name: 'Liga 3 (Championship)',
    baseOVR: 70,
    teams: [
      { name: 'Rot-Weiß Hafen', primaryColor: '#ef4444', secondaryColor: '#ffffff' },
      { name: 'Blau-Gelb Ost', primaryColor: '#2563eb', secondaryColor: '#facc15' },
      { name: 'SV Moorweide', primaryColor: '#059669', secondaryColor: '#ffffff' },
      { name: 'FC Stahlwerk', primaryColor: '#64748b', secondaryColor: '#f97316' },
      { name: 'Concordia Süd', primaryColor: '#0891b2', secondaryColor: '#ffffff' },
      { name: 'Teutonia Berg', primaryColor: '#4f46e5', secondaryColor: '#ffffff' },
      { name: 'VfB Flussdelta', primaryColor: '#047857', secondaryColor: '#ffffff' },
      { name: 'SG Heideblick', primaryColor: '#d97706', secondaryColor: '#000000' },
      { name: 'Eintracht Tal', primaryColor: '#be185d', secondaryColor: '#ffffff' },
      { name: 'Alemannia Forst', primaryColor: '#1e293b', secondaryColor: '#00f59b' }
    ]
  },
  {
    tier: 4,
    name: 'Liga 4 (Oberliga)',
    baseOVR: 67,
    teams: [
      { name: 'FC Vorwärts 1912', primaryColor: '#e11d48', secondaryColor: '#ffffff' },
      { name: 'TSV Wackerbrück', primaryColor: '#1d4ed8', secondaryColor: '#ffffff' },
      { name: 'SV Falkenlust', primaryColor: '#15803d', secondaryColor: '#ffd15c' },
      { name: 'DJK Rheinufer', primaryColor: '#0284c7', secondaryColor: '#ffffff' },
      { name: 'SC Schwarz-Gold', primaryColor: '#000000', secondaryColor: '#f59e0b' },
      { name: 'SpVgg Zeche', primaryColor: '#334155', secondaryColor: '#e2e8f0' },
      { name: 'FC Grenzland', primaryColor: '#4338ca', secondaryColor: '#ffffff' },
      { name: 'VfR Eichengrund', primaryColor: '#166534', secondaryColor: '#ffffff' },
      { name: 'FV Donautal', primaryColor: '#0369a1', secondaryColor: '#ffffff' },
      { name: 'TuS Bergbaustolz', primaryColor: '#b45309', secondaryColor: '#000000' }
    ]
  },
  {
    tier: 5,
    name: 'Liga 5 (Landesklasse)',
    baseOVR: 64,
    teams: [
      { name: 'SV Grün-Weiß Aue', primaryColor: '#16a34a', secondaryColor: '#ffffff' },
      { name: 'FC Hansa Bucht', primaryColor: '#0284c7', secondaryColor: '#ffffff' },
      { name: 'Kickers Steinbruch', primaryColor: '#b91c1c', secondaryColor: '#ffffff' },
      { name: 'SpVgg Sandhügel', primaryColor: '#d97706', secondaryColor: '#000000' },
      { name: 'FC Viktoria Moor', primaryColor: '#7c3aed', secondaryColor: '#ffffff' },
      { name: 'TSG Waldrand', primaryColor: '#059669', secondaryColor: '#ffffff' },
      { name: 'SV Rothenburg', primaryColor: '#dc2626', secondaryColor: '#ffffff' },
      { name: 'Union Industrie', primaryColor: '#475569', secondaryColor: '#ffffff' },
      { name: 'FSV Birkenhain', primaryColor: '#0d9488', secondaryColor: '#ffffff' },
      { name: 'SC Blau-Weiß 08', primaryColor: '#2563eb', secondaryColor: '#ffffff' }
    ]
  },
  {
    tier: 6,
    name: 'Liga 6 (Amateur)',
    baseOVR: 61,
    teams: [
      // Player's default club placeholder (will be configured in onboarding)
      { id: 'player_club', name: 'FC Apex Nova', primaryColor: '#00f59b', secondaryColor: '#ffd15c', isPlayer: true },
      { name: 'SV Eisenstadt', primaryColor: '#0284c7', secondaryColor: '#ffffff' },
      { name: 'Kickers West', primaryColor: '#ea580c', secondaryColor: '#ffffff' },
      { name: 'SpVgg Nordstern', primaryColor: '#6366f1', secondaryColor: '#ffffff' },
      { name: 'FC Vorwärts', primaryColor: '#10b981', secondaryColor: '#ffffff' },
      { name: 'TSV Eintracht', primaryColor: '#dc2626', secondaryColor: '#ffffff' },
      { name: 'Dynamo Süd', primaryColor: '#eab308', secondaryColor: '#000000' },
      { name: 'SC Fortuna', primaryColor: '#0d9488', secondaryColor: '#ffffff' },
      { name: 'SV Blau-Weiß', primaryColor: '#2563eb', secondaryColor: '#ffffff' },
      { name: 'FC Union', primaryColor: '#b91c1c', secondaryColor: '#ffffff' }
    ]
  }
];

const SQUAD_TEMPLATE = [
  'TW', 'TW',
  'LV', 'IV', 'IV', 'IV', 'RV',
  'ZDM', 'ZM', 'ZM', 'ZOM', 'LM', 'RM',
  'LF', 'RF', 'ST', 'ST', 'ST'
];

let globalPlayerId = 1000;

export function generatePlayer(position, targetOVR, forcedNation = null, customName = null) {
  const id = `p_${globalPlayerId++}`;
  const firstName = customName ? customName.split(' ')[0] : FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = customName ? customName.split(' ')[1] || 'Pro' : LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const nation = forcedNation || NATIONS[Math.floor(Math.random() * NATIONS.length)];
  const age = Math.floor(18 + Math.random() * 16); // 18 - 34

  // Attribut-Verteilung basierend auf OVR und Position
  const variance = () => Math.floor((Math.random() - 0.5) * 8);
  const clamp = val => Math.max(40, Math.min(99, val));

  let pac = targetOVR + variance();
  let sho = targetOVR + variance();
  let pas = targetOVR + variance();
  let dri = targetOVR + variance();
  let def = targetOVR + variance();
  let phy = targetOVR + variance();

  if (position === 'TW') {
    pac = clamp(targetOVR - 15 + variance());
    sho = clamp(35 + variance());
    pas = clamp(targetOVR - 10 + variance());
    dri = clamp(40 + variance());
    def = clamp(targetOVR + variance());
    phy = clamp(targetOVR - 5 + variance());
  } else if (['IV', 'LV', 'RV', 'ZDM'].includes(position)) {
    def = clamp(targetOVR + 6 + variance());
    phy = clamp(targetOVR + 4 + variance());
    sho = clamp(targetOVR - 18 + variance());
  } else if (['ST', 'LF', 'RF'].includes(position)) {
    sho = clamp(targetOVR + 7 + variance());
    pac = clamp(targetOVR + 5 + variance());
    def = clamp(targetOVR - 22 + variance());
  } else {
    // Mittelfeld
    pas = clamp(targetOVR + 6 + variance());
    dri = clamp(targetOVR + 5 + variance());
  }

  return {
    id,
    name: `${firstName} ${lastName}`,
    shortName: `${firstName[0]}. ${lastName}`,
    age,
    position,
    nationality: nation.code,
    nationName: nation.name,
    nationFlag: nation.flag,
    ovr: targetOVR,
    tier: getRarityTier(targetOVR),
    pac: clamp(pac),
    sho: clamp(sho),
    pas: clamp(pas),
    dri: clamp(dri),
    def: clamp(def),
    phy: clamp(phy),
    condition: 100, // 0 - 100%
    contractMatches: Math.floor(12 + Math.random() * 8), // 12 - 20 Spiele
    contractDiscountUntilMatch: 0,
    isStarter: false,
    currentSlot: position
  };
}

/**
 * Erzeugt die gesamte Spielwelt: 6 Ligen à 10 Vereine mit je 18-19 Spielern
 */
export function generateWorldDatabase() {
  const leagues = [];
  const allClubs = [];

  LEAGUES_DATA.forEach(leagueData => {
    const clubsInLeague = [];

    leagueData.teams.forEach((teamDef, teamIdx) => {
      const clubId = teamDef.id || `c_${leagueData.tier}_${teamIdx + 1}`;
      const squad = [];

      SQUAD_TEMPLATE.forEach(pos => {
        const spread = Math.floor((Math.random() - 0.5) * 6);
        const playerOvr = Math.max(52, Math.min(88, leagueData.baseOVR + spread));
        const player = generatePlayer(pos, playerOvr);
        squad.push(player);
      });

      // Startelf markieren (4-3-3: TW, LV, 2x IV, RV, ZDM, 2x ZM, LF, RF, ST)
      const starterSlots = ['TW', 'LV', 'IV', 'IV', 'RV', 'ZDM', 'ZM', 'ZOM', 'LF', 'RF', 'ST'];
      starterSlots.forEach((slot, sIdx) => {
        if (squad[sIdx]) {
          squad[sIdx].isStarter = true;
          squad[sIdx].currentSlot = slot;
        }
      });

      const club = {
        id: clubId,
        name: teamDef.name,
        isPlayer: !!teamDef.isPlayer,
        tier: leagueData.tier,
        leagueName: leagueData.name,
        primaryColor: teamDef.primaryColor,
        secondaryColor: teamDef.secondaryColor,
        coins: teamDef.isPlayer ? 3450 : 10000,
        squad,
        tactics: {
          formation: '4-3-3 Attack',
          style: 'Ausgewogen',
          activeCards: ['t_second_wind', 't_park_bus', 't_counter_frenzy']
        },
        stats: {
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          gf: 0,
          ga: 0,
          points: 0
        }
      };

      clubsInLeague.push(club);
      allClubs.push(club);
    });

    leagues.push({
      tier: leagueData.tier,
      name: leagueData.name,
      baseOVR: leagueData.baseOVR,
      clubs: clubsInLeague
    });
  });

  return { leagues, allClubs };
}
