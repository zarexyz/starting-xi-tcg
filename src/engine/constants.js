// =============================================================================
// Spielregeln als Daten: Positionen, Formationen, Spielstile, Talentklassen
// =============================================================================

/** Acht Werte für jeden Spieler, auch für Torhüter */
export const ATTRS = ['tem', 'sch', 'pas', 'dri', 'abw', 'phy', 'men', 'tor'];
export const FIELD_ATTRS = ATTRS;
export const ALL_ATTRS = ATTRS;

export const ATTR_LABELS = {
  tem: 'TEM', sch: 'SCH', pas: 'PAS', dri: 'DRI', abw: 'ABW', phy: 'PHY', men: 'MEN', tor: 'TOR'
};

export const ATTR_NAMES = {
  tem: 'Tempo', sch: 'Schuss', pas: 'Passspiel', dri: 'Dribbling', abw: 'Abwehr', phy: 'Physis', men: 'Mental', tor: 'Torwart'
};

export const ATTR_HINTS = {
  tem: 'Antritt und Laufduelle',
  sch: 'Abschluss und Elfmeter',
  pas: 'Spielaufbau, Vorlagen',
  dri: 'Durchsetzen im Eins gegen Eins',
  abw: 'Zweikämpfe und Stellungsspiel',
  phy: 'Robustheit, ermüdet langsamer',
  men: 'Nerven in großen Spielen, bei Rückstand und im Elfmeterschießen',
  tor: 'Reflexe, Halten, Herauslaufen'
};

/** Reihenfolge der acht Werte auf der Karte (4 × 2) */
export const CARD_ATTRS = {
  field: ['tem', 'sch', 'pas', 'dri', 'abw', 'phy', 'men', 'tor'],
  gk: ['tor', 'men', 'pas', 'phy', 'tem', 'sch', 'dri', 'abw']
};

export const POSITIONS = ['TW', 'IV', 'LV', 'RV', 'ZDM', 'ZM', 'ZOM', 'LM', 'RM', 'LF', 'RF', 'ST'];

export const POSITION_NAMES = {
  TW: 'Torwart', IV: 'Innenverteidiger', LV: 'Linksverteidiger', RV: 'Rechtsverteidiger',
  ZDM: 'Defensives Mittelfeld', ZM: 'Zentrales Mittelfeld', ZOM: 'Offensives Mittelfeld',
  LM: 'Linkes Mittelfeld', RM: 'Rechtes Mittelfeld', LF: 'Linksaußen', RF: 'Rechtsaußen', ST: 'Stürmer'
};

export const POSITION_GROUP = {
  TW: 'GK', IV: 'DEF', LV: 'DEF', RV: 'DEF',
  ZDM: 'MID', ZM: 'MID', ZOM: 'MID', LM: 'MID', RM: 'MID',
  LF: 'ATT', RF: 'ATT', ST: 'ATT'
};

/** Gewichtung der Attribute für die Stärke auf einer Position */
export const OVR_WEIGHTS = {
  TW: { tor: 0.6, men: 0.15, phy: 0.12, pas: 0.13 },
  IV: { abw: 0.42, phy: 0.25, tem: 0.08, pas: 0.12, men: 0.13 },
  LV: { abw: 0.32, tem: 0.28, phy: 0.1, pas: 0.2, men: 0.1 },
  RV: { abw: 0.32, tem: 0.28, phy: 0.1, pas: 0.2, men: 0.1 },
  ZDM: { abw: 0.32, phy: 0.2, pas: 0.28, tem: 0.07, men: 0.13 },
  ZM: { pas: 0.32, dri: 0.18, abw: 0.12, phy: 0.12, sch: 0.08, tem: 0.05, men: 0.13 },
  ZOM: { pas: 0.32, dri: 0.28, sch: 0.18, tem: 0.1, men: 0.12 },
  LM: { tem: 0.28, pas: 0.27, dri: 0.23, sch: 0.1, phy: 0.04, men: 0.08 },
  RM: { tem: 0.28, pas: 0.27, dri: 0.23, sch: 0.1, phy: 0.04, men: 0.08 },
  LF: { tem: 0.28, dri: 0.28, sch: 0.24, pas: 0.1, men: 0.1 },
  RF: { tem: 0.28, dri: 0.28, sch: 0.24, pas: 0.1, men: 0.1 },
  ST: { sch: 0.38, tem: 0.18, dri: 0.14, phy: 0.15, pas: 0.05, men: 0.1 }
};

/** Verwandte Positionen: Faktor für die Stärke, wenn ein Spieler dort aushilft */
export const RELATED_POSITIONS = {
  TW: {},
  IV: { ZDM: 0.94, LV: 0.92, RV: 0.92 },
  LV: { RV: 0.94, LM: 0.94, IV: 0.92 },
  RV: { LV: 0.94, RM: 0.94, IV: 0.92 },
  ZDM: { ZM: 0.96, IV: 0.92 },
  ZM: { ZDM: 0.96, ZOM: 0.96, LM: 0.92, RM: 0.92 },
  ZOM: { ZM: 0.96, ST: 0.92, LF: 0.92, RF: 0.92 },
  LM: { RM: 0.94, LF: 0.95, ZM: 0.92, LV: 0.9 },
  RM: { LM: 0.94, RF: 0.95, ZM: 0.92, RV: 0.9 },
  LF: { RF: 0.95, LM: 0.95, ST: 0.93 },
  RF: { LF: 0.95, RM: 0.95, ST: 0.93 },
  ST: { LF: 0.93, RF: 0.93, ZOM: 0.92 }
};

/** Formationen mit Slot-Koordinaten (x: links→rechts, y: Angriff oben → eigenes Tor unten) */
export const FORMATIONS = {
  '4-3-3': {
    name: '4-3-3',
    slots: [
      { id: 's0', pos: 'TW', x: 50, y: 90 },
      { id: 's1', pos: 'LV', x: 14, y: 70 },
      { id: 's2', pos: 'IV', x: 37, y: 75 },
      { id: 's3', pos: 'IV', x: 63, y: 75 },
      { id: 's4', pos: 'RV', x: 86, y: 70 },
      { id: 's5', pos: 'ZM', x: 27, y: 49 },
      { id: 's6', pos: 'ZDM', x: 50, y: 57 },
      { id: 's7', pos: 'ZM', x: 73, y: 49 },
      { id: 's8', pos: 'LF', x: 17, y: 24 },
      { id: 's9', pos: 'ST', x: 50, y: 17 },
      { id: 's10', pos: 'RF', x: 83, y: 24 }
    ]
  },
  '4-4-2': {
    name: '4-4-2',
    slots: [
      { id: 's0', pos: 'TW', x: 50, y: 90 },
      { id: 's1', pos: 'LV', x: 14, y: 70 },
      { id: 's2', pos: 'IV', x: 37, y: 75 },
      { id: 's3', pos: 'IV', x: 63, y: 75 },
      { id: 's4', pos: 'RV', x: 86, y: 70 },
      { id: 's5', pos: 'LM', x: 14, y: 45 },
      { id: 's6', pos: 'ZM', x: 38, y: 51 },
      { id: 's7', pos: 'ZM', x: 62, y: 51 },
      { id: 's8', pos: 'RM', x: 86, y: 45 },
      { id: 's9', pos: 'ST', x: 37, y: 19 },
      { id: 's10', pos: 'ST', x: 63, y: 19 }
    ]
  },
  '4-2-3-1': {
    name: '4-2-3-1',
    slots: [
      { id: 's0', pos: 'TW', x: 50, y: 90 },
      { id: 's1', pos: 'LV', x: 14, y: 70 },
      { id: 's2', pos: 'IV', x: 37, y: 75 },
      { id: 's3', pos: 'IV', x: 63, y: 75 },
      { id: 's4', pos: 'RV', x: 86, y: 70 },
      { id: 's5', pos: 'ZDM', x: 37, y: 55 },
      { id: 's6', pos: 'ZDM', x: 63, y: 55 },
      { id: 's7', pos: 'LM', x: 16, y: 34 },
      { id: 's8', pos: 'ZOM', x: 50, y: 36 },
      { id: 's9', pos: 'RM', x: 84, y: 34 },
      { id: 's10', pos: 'ST', x: 50, y: 15 }
    ]
  },
  '3-5-2': {
    name: '3-5-2',
    slots: [
      { id: 's0', pos: 'TW', x: 50, y: 90 },
      { id: 's1', pos: 'IV', x: 26, y: 74 },
      { id: 's2', pos: 'IV', x: 50, y: 77 },
      { id: 's3', pos: 'IV', x: 74, y: 74 },
      { id: 's4', pos: 'LM', x: 11, y: 47 },
      { id: 's5', pos: 'ZM', x: 33, y: 50 },
      { id: 's6', pos: 'ZDM', x: 50, y: 58 },
      { id: 's7', pos: 'ZM', x: 67, y: 50 },
      { id: 's8', pos: 'RM', x: 89, y: 47 },
      { id: 's9', pos: 'ST', x: 37, y: 19 },
      { id: 's10', pos: 'ST', x: 63, y: 19 }
    ]
  },
  '5-3-2': {
    name: '5-3-2',
    slots: [
      { id: 's0', pos: 'TW', x: 50, y: 90 },
      { id: 's1', pos: 'LV', x: 10, y: 64 },
      { id: 's2', pos: 'IV', x: 30, y: 74 },
      { id: 's3', pos: 'IV', x: 50, y: 77 },
      { id: 's4', pos: 'IV', x: 70, y: 74 },
      { id: 's5', pos: 'RV', x: 90, y: 64 },
      { id: 's6', pos: 'ZM', x: 27, y: 48 },
      { id: 's7', pos: 'ZM', x: 50, y: 53 },
      { id: 's8', pos: 'ZM', x: 73, y: 48 },
      { id: 's9', pos: 'ST', x: 37, y: 19 },
      { id: 's10', pos: 'ST', x: 63, y: 19 }
    ]
  }
};

export const FORMATION_KEYS = Object.keys(FORMATIONS);

/**
 * Spielstile. Kreislauf: Pressing schlägt Ballbesitz, Ballbesitz schlägt Mauern,
 * Mauern schlägt Konter, Konter schlägt Pressing. Ausgewogen ist neutral.
 */
export const STYLES = {
  AUSGEWOGEN: {
    key: 'AUSGEWOGEN', name: 'Ausgewogen', beats: null,
    desc: 'Kein besonderer Schwerpunkt, keine besondere Schwäche.',
    midBonus: 0, chanceMult: 1, qualityMult: 1, defBonus: 0, fatigue: 0
  },
  BALLBESITZ: {
    key: 'BALLBESITZ', name: 'Ballbesitz', beats: 'MAUERN',
    desc: 'Kontrolle im Mittelfeld, geduldiger Aufbau, hochwertige Chancen.',
    midBonus: 3, chanceMult: 0.95, qualityMult: 1.1, defBonus: 0, fatigue: 0
  },
  KONTER: {
    key: 'KONTER', name: 'Konter', beats: 'PRESSING',
    desc: 'Wenig Ballbesitz, schnelle Gegenstöße, etwas sicherer hinten.',
    midBonus: -3, chanceMult: 0.9, qualityMult: 1.22, defBonus: 2, fatigue: 0
  },
  PRESSING: {
    key: 'PRESSING', name: 'Pressing', beats: 'BALLBESITZ',
    desc: 'Früh stören, Bälle erobern. Viele Chancen, kostet aber Kraft.',
    midBonus: 2, chanceMult: 1.15, qualityMult: 1, defBonus: -2, fatigue: 6
  },
  MAUERN: {
    key: 'MAUERN', name: 'Mauern', beats: 'KONTER',
    desc: 'Tief stehen, Räume schließen. Wenig Chancen auf beiden Seiten.',
    midBonus: -4, chanceMult: 0.75, qualityMult: 0.92, defBonus: 6, fatigue: -2
  }
};

export const STYLE_KEYS = Object.keys(STYLES);

/** +1: a schlägt b, -1: b schlägt a, 0: neutral */
export function styleMatchup(a, b) {
  if (STYLES[a]?.beats === b) return 1;
  if (STYLES[b]?.beats === a) return -1;
  return 0;
}

/**
 * Talentklasse – bleibt ein Spielerleben lang gleich.
 * softCap: Ab hier wächst der Spieler nur noch sehr langsam.
 */
export const TIERS = {
  bronze: { key: 'bronze', name: 'Bronze', potMin: 50, potMax: 66, softCap: 66, order: 0 },
  silver: { key: 'silver', name: 'Silber', potMin: 66, potMax: 76, softCap: 76, order: 1 },
  gold: { key: 'gold', name: 'Gold', potMin: 76, potMax: 87, softCap: 87, order: 2 },
  icon: { key: 'icon', name: 'Ikone', potMin: 87, potMax: 95, softCap: 95, order: 3 }
};

export const TIER_KEYS = ['bronze', 'silver', 'gold', 'icon'];

export function tierForPotential(pot) {
  if (pot >= TIERS.icon.potMin) return 'icon';
  if (pot >= TIERS.gold.potMin) return 'gold';
  if (pot >= TIERS.silver.potMin) return 'silver';
  return 'bronze';
}

export const LEAGUE_COUNT = 6;
export const CLUBS_PER_LEAGUE = 10;
export const MATCHDAYS = 18;
export const MAX_SQUAD = 26;
export const MIN_SQUAD = 16;
export const AI_SQUAD_SIZE = 21;
