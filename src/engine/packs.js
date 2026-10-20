// =============================================================================
// Starting XI TCG — Booster Packs & Draft Engine
// =============================================================================

import { generatePlayer } from './database.js';

export const CONSUMABLE_CARDS = [
  {
    id: 'c_gold_contract',
    type: 'CONTRACT',
    name: 'Gold-Vertrag',
    rarity: 'gold',
    icon: '📜',
    title: '50% Gehalts-Rabatt',
    description: 'Senkt das Gehalt eines ausgewählten Spielers um 50% für die nächsten 10 Pflichtspiele.',
    duration: 10,
    discountRate: 0.50
  },
  {
    id: 'c_fitness_express',
    type: 'FITNESS',
    name: 'Fitness-Express',
    rarity: 'silver',
    icon: '⚡',
    title: '100% Sofort-Kondition',
    description: 'Stellt Ausdauer und Frische eines Spielers sofort auf das Maximum von 100% wieder her.',
    healsFatigue: true
  },
  {
    id: 'c_rapid_heal',
    type: 'MEDICAL',
    name: 'Blitzgenesung',
    rarity: 'cyan',
    icon: '🩺',
    title: 'Verletzung sofort kurieren',
    description: 'Heilt jede akute Blessur oder Zerrung sofort ohne Ausfallzeit.',
    healsInjury: true
  },
  {
    id: 'c_retraining',
    type: 'TACTIC',
    name: 'Positions-Umschulung',
    rarity: 'gold',
    icon: '🔄',
    title: 'Positionswechsel ohne Malus',
    description: 'Schult einen Spieler auf eine neue Wunsch-Position um (z.B. ZOM zu ZM).',
    retrains: true
  }
];

export const PACK_TIERS = [
  {
    id: 'pack_rookie',
    name: 'Rookie-Draft',
    subtitle: 'Pick 1 of 3 junge Talente',
    price: 500,
    rarity: 'silver',
    color: '#00f59b',
    icon: '🌟',
    description: '3 Jugendtalente (16–19 J., 60–72 OVR) mit hohem Entwicklungspotenzial.',
    type: 'PLAYER_DRAFT'
  },
  {
    id: 'pack_veteran',
    name: 'Veteranen-Pack',
    subtitle: 'Pick 1 of 3 erfahrene Leader',
    price: 900,
    rarity: 'gold',
    color: '#ffd15c',
    icon: '🛡️',
    description: '3 gestandene Führungsspieler (28–34 J., 72–78 OVR) für sofortige Stabilität.',
    type: 'PLAYER_DRAFT'
  },
  {
    id: 'pack_prestige_gold',
    name: 'Gold Prestige Walkout',
    subtitle: 'Chance auf Star-Spieler',
    price: 1800,
    rarity: 'special',
    color: '#ffd15c',
    icon: '👑',
    description: '3 Elite-Kandidaten (77–84 OVR) mit spektakulärem Gold-Walkout.',
    type: 'PLAYER_DRAFT'
  },
  {
    id: 'pack_consumables',
    name: 'TCG Verbrauchs-Pack',
    subtitle: '4 nützliche TCG-Karten',
    price: 350,
    rarity: 'cyan',
    color: '#0ea5e9',
    icon: '📦',
    description: 'Verträge, Fitness-Booster, Blitzheilung und Taktik-Karten.',
    type: 'CONSUMABLE_BUNDLE'
  }
];

/**
 * Öffnet ein Pack und liefert den gezogenen Inhalt
 */
export function openPack(packTierId) {
  const pack = PACK_TIERS.find(p => p.id === packTierId) || PACK_TIERS[0];

  if (pack.type === 'CONSUMABLE_BUNDLE') {
    // Liefert 4 zufällige Verbrauchskarten
    const cards = [];
    for (let i = 0; i < 4; i++) {
      const card = CONSUMABLE_CARDS[Math.floor(Math.random() * CONSUMABLE_CARDS.length)];
      cards.push({ ...card, instanceId: `inst_${Date.now()}_${i}` });
    }
    return {
      pack,
      isDraft: false,
      cards
    };
  }

  // Player Draft ("Pick 1 of 3")
  let targetMin = 60, targetMax = 72;
  if (pack.id === 'pack_veteran') {
    targetMin = 72; targetMax = 78;
  } else if (pack.id === 'pack_prestige_gold') {
    targetMin = 77; targetMax = 84;
  }

  const positionsPool = ['ST', 'ZM', 'IV', 'TW', 'LF', 'RF', 'ZOM', 'LV', 'RV', 'ZDM'];
  const candidates = [];

  for (let i = 0; i < 3; i++) {
    const pos = positionsPool[Math.floor(Math.random() * positionsPool.length)];
    const ovr = Math.floor(targetMin + Math.random() * (targetMax - targetMin + 1));
    const player = generatePlayer(pos, ovr);
    candidates.push(player);
  }

  return {
    pack,
    isDraft: true,
    candidates,
    selectedCandidate: candidates[0]
  };
}
