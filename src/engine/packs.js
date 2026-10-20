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
    id: 'c_train_tempo',
    type: 'TRAINING',
    name: 'Sprint-Drill',
    rarity: 'silver',
    icon: '👟',
    title: '+2 Tempo permanent',
    description: 'Erhöht das Tempo & den Antritt (PAC) eines Spielers dauerhaft um +2 Punkte.',
    trainAttr: 'pac',
    trainVal: 2
  },
  {
    id: 'c_train_shooting',
    type: 'TRAINING',
    name: 'Torschuss-Training',
    rarity: 'gold',
    icon: '🎯',
    title: '+2 Schießen permanent',
    description: 'Steigert Schusskraft und Abschluss (SHO) eines Spielers dauerhaft um +2 Punkte.',
    trainAttr: 'sho',
    trainVal: 2
  },
  {
    id: 'c_train_defense',
    type: 'TRAINING',
    name: 'Zweikampf-Masterclass',
    rarity: 'silver',
    icon: '🛡️',
    title: '+2 Defensive permanent',
    description: 'Verbessert Tackling und Stellungsspiel (DEF) eines Spielers dauerhaft um +2 Punkte.',
    trainAttr: 'def',
    trainVal: 2
  },
  {
    id: 'c_train_pass',
    type: 'TRAINING',
    name: 'Passspiel-Präzision',
    rarity: 'silver',
    icon: '📐',
    title: '+2 Passen permanent',
    description: 'Perfektioniert Kurz- und Langpassspiel (PAS) eines Spielers dauerhaft um +2 Punkte.',
    trainAttr: 'pas',
    trainVal: 2
  },
  {
    id: 'c_train_dribble',
    type: 'TRAINING',
    name: 'Dribbel-Parcours',
    rarity: 'silver',
    icon: '🌀',
    title: '+2 Dribbling permanent',
    description: 'Steigert Ballkontrolle und Wendigkeit (DRI) eines Spielers dauerhaft um +2 Punkte.',
    trainAttr: 'dri',
    trainVal: 2
  },
  {
    id: 'c_train_physique',
    type: 'TRAINING',
    name: 'Athletik-Bootcamp',
    rarity: 'silver',
    icon: '🏋️',
    title: '+2 Physis permanent',
    description: 'Erhöht Durchsetzungsvermögen und Sprungkraft (PHY) eines Spielers dauerhaft um +2 Punkte.',
    trainAttr: 'phy',
    trainVal: 2
  },
  {
    id: 'c_train_master',
    type: 'TRAINING',
    name: 'Chef-Trainer Coaching',
    rarity: 'special',
    icon: '👑',
    title: '+1 auf ALLE Attribute',
    description: 'Umfassendes Coaching: Erhöht jeden der 6 Attribute dauerhaft um +1 Punkt (+1 Gesamt-OVR).',
    trainMaster: true
  },
  {
    id: 'c_pos_change',
    type: 'TACTIC',
    name: 'Umschulung',
    rarity: 'gold',
    icon: '🔄',
    title: 'Position anpassen',
    description: 'Erlernt eine neue Nebenposition dauerhaft ohne OVR-Abzug.',
    retrains: true
  }
];

export const PACK_TIERS = [
  {
    id: 'pack_starter_foundation',
    name: 'Startkader Basis',
    series: 'Gründung',
    price: 0,
    hiddenFromStore: true,
    tag: 'GRÜNDUNG',
    tagColor: 'bg-emerald-500 text-slate-950',
    borderClass: 'border-emerald-500/80 shadow-[0_10px_25px_rgba(0,245,155,0.3)]',
    bgGradient: 'from-emerald-950 via-slate-900 to-emerald-900',
    emblem: '⚽',
    description: '18 Startspieler für deinen neuen Verein: Vollständige Startelf + 7 Reservespieler.',
    dropInfo: '18x Spieler (Bronze & Silber)',
    isDraft: false,
    isStarterFoundation: true,
    totalCards: 18
  },
  {
    id: 'pack_starter_star',
    name: 'Starspieler Pick',
    series: 'Gründung',
    price: 0,
    hiddenFromStore: true,
    tag: 'DRAFT',
    tagColor: 'bg-amber-400 text-slate-950',
    borderClass: 'border-amber-400/80 shadow-[0_10px_25px_rgba(255,209,92,0.3)]',
    bgGradient: 'from-amber-950 via-stone-900 to-amber-900',
    emblem: '⭐',
    description: 'Wähle deinen Schlüsselspieler aus 3 hochkarätigen Silber-Talenten (72-74 OVR).',
    dropInfo: 'Pick 1 aus 3 Silber-Stars',
    isDraft: true,
    isStarterDraft: true,
    draftCount: 3,
    candidateOvrMin: 72,
    candidateOvrMax: 74
  },
  {
    id: 'pack_starter_draft',
    name: 'Scout Draft Pack',
    series: 'Serie 1',
    price: 250,
    tag: 'BELIEBT',
    tagColor: 'bg-pitch-emerald text-slate-950',
    borderClass: 'border-emerald-500/60 shadow-[0_10px_25px_rgba(0,245,155,0.2)]',
    bgGradient: 'from-slate-900 via-emerald-950 to-slate-900',
    emblem: '🎯',
    description: 'Wähle deinen Wunschspieler aus 3 gescouteten Talenten. Ideal zur gezielten Kaderverstärkung.',
    dropInfo: 'Pick 1 aus 3 Spielern (Bronze bis Silber)',
    isDraft: true,
    draftCount: 3,
    candidateOvrMin: 65,
    candidateOvrMax: 76
  },
  {
    id: 'pack_bronze_booster',
    name: 'Bronze Liga-Pack',
    series: 'Serie 1',
    price: 150,
    tag: 'SPAR-TIPP',
    tagColor: 'bg-orange-500 text-white',
    borderClass: 'border-orange-500/60 shadow-[0_10px_25px_rgba(205,127,50,0.2)]',
    bgGradient: 'from-orange-950 via-stone-900 to-slate-900',
    emblem: '🥉',
    description: 'Perfekt für den Start in Liga 6. Enthält 3 Karten: Garantiert mindestens 1 Spieler und Verbrauchsgüter.',
    dropInfo: '3 Karten: 1-2 Spieler + 1-2 Items',
    isDraft: false,
    totalCards: 3,
    minTier: 'bronze',
    maxTier: 'silver'
  },
  {
    id: 'pack_silver_booster',
    name: 'Silber Profi-Pack',
    series: 'Serie 1',
    price: 400,
    tag: 'HOT',
    tagColor: 'bg-slate-300 text-slate-950',
    borderClass: 'border-slate-300/70 shadow-[0_10px_25px_rgba(203,213,225,0.25)]',
    bgGradient: 'from-slate-800 via-slate-900 to-blue-950',
    emblem: '🥈',
    description: 'Der Schlüssel zum Aufstieg. Garantiert mindestens 2 Silber-Spieler mit 70+ OVR.',
    dropInfo: '4 Karten: 2 Silber-Spieler garantiert + 2 Bonus-Karten',
    isDraft: false,
    totalCards: 4,
    minTier: 'silver',
    maxTier: 'gold'
  },
  {
    id: 'pack_gold_elite',
    name: 'Gold Elite Pack',
    series: 'Apex Series',
    price: 850,
    tag: 'PREMIUM',
    tagColor: 'bg-amber-400 text-slate-950',
    borderClass: 'border-amber-400/80 shadow-[0_10px_30px_rgba(255,209,92,0.35)]',
    bgGradient: 'from-amber-950 via-stone-900 to-yellow-950',
    emblem: '👑',
    description: 'Das ultimative Pack. Garantiert 1 Gold-Star (78-86 OVR) sowie seltene Verträge und Power-Ups.',
    dropInfo: '5 Karten: Mind. 1 Gold-Star (78+) + Chance auf Walkout',
    isDraft: false,
    totalCards: 5,
    minTier: 'silver',
    maxTier: 'gold'
  }
];

/**
 * Öffnet ein Pack basierend auf der Pack-Konfiguration
 */
export function openPack(packId) {
  const pack = PACK_TIERS.find(p => p.id === packId);
  if (!pack) return null;

  // Star-Player Starter Pick (1 of 3 Silver Stars)
  if (pack.isStarterDraft) {
    const roles = ['ST', 'ZM', 'IV'];
    const candidates = roles.map((pos, idx) => generatePlayer({
      tier: 'silver',
      position: pos,
      minOvr: 73,
      maxOvr: 75,
      idPrefix: `starter_star_${Date.now()}_${idx}`
    }));

    return {
      pack,
      isDraft: true,
      isStarterDraft: true,
      candidates,
      selectedCandidate: candidates[0]
    };
  }

  // 18-Spieler Starter Foundation Pack
  if (pack.isStarterFoundation) {
    const standard18Positions = [
      // 11 Starters (4-3-3)
      'TW', 'LV', 'IV', 'IV', 'RV', 'ZM', 'ZDM', 'ZM', 'LF', 'ST', 'RF',
      // 7 Bench
      'TW', 'IV', 'LAV', 'ZM', 'RM', 'LM', 'ST'
    ];

    const cards = standard18Positions.map((pos, idx) => {
      const isStarter = idx < 11;
      const tier = isStarter ? (idx % 3 === 0 ? 'silver' : 'bronze') : 'bronze';
      const player = generatePlayer({
        tier,
        position: pos,
        minOvr: tier === 'silver' ? 70 : 64,
        maxOvr: tier === 'silver' ? 73 : 69,
        idPrefix: `init_squad_${Date.now()}_${idx}`
      });
      player.isStarter = isStarter;
      player.currentSlot = pos;
      return player;
    });

    return {
      pack,
      isDraft: false,
      isStarterFoundation: true,
      cards
    };
  }

  // Regulärer Scout Draft
  if (pack.isDraft) {
    const positions = ['ST', 'ZM', 'IV', 'TW', 'LF', 'RF', 'ZDM', 'LV', 'RV'];
    const shuffledPositions = [...positions].sort(() => 0.5 - Math.random());
    const candidates = [];

    for (let i = 0; i < (pack.draftCount || 3); i++) {
      const tierRoll = Math.random();
      const tier = tierRoll > 0.7 ? 'gold' : (tierRoll > 0.3 ? 'silver' : 'bronze');
      const pos = shuffledPositions[i] || 'ST';
      const player = generatePlayer({
        tier,
        position: pos,
        minOvr: pack.candidateOvrMin || 66,
        maxOvr: pack.candidateOvrMax || 78,
        idPrefix: `draft_candidate_${Date.now()}_${i}`
      });
      candidates.push(player);
    }

    return {
      pack,
      isDraft: true,
      candidates,
      selectedCandidate: candidates[0]
    };
  }

  // Reguläres Booster-Pack mit gezogenen Spielern und Verbrauchsgegenständen
  const cards = [];
  const totalCards = pack.totalCards || 3;

  for (let i = 0; i < totalCards; i++) {
    // 65% Chance auf Spieler, 35% Chance auf Verbrauchsgegenstand
    const isPlayer = Math.random() < 0.65 || i === 0;

    if (isPlayer) {
      let tier = 'bronze';
      const roll = Math.random();

      if (pack.id === 'pack_gold_elite') {
        tier = (i === 0 || roll > 0.5) ? 'gold' : 'silver';
      } else if (pack.id === 'pack_silver_booster') {
        tier = (i < 2 || roll > 0.4) ? 'silver' : (roll > 0.95 ? 'gold' : 'bronze');
      } else {
        tier = roll > 0.85 ? 'silver' : 'bronze';
      }

      const player = generatePlayer({
        tier,
        minOvr: tier === 'gold' ? 78 : (tier === 'silver' ? 70 : 64),
        maxOvr: tier === 'gold' ? 86 : (tier === 'silver' ? 76 : 69),
        idPrefix: `booster_card_${Date.now()}_${i}`
      });

      cards.push(player);
    } else {
      // Verbrauchsgegenstand aus CONSUMABLE_CARDS ziehen
      const itemTemplate = CONSUMABLE_CARDS[Math.floor(Math.random() * CONSUMABLE_CARDS.length)];
      const itemInstance = {
        ...itemTemplate,
        instanceId: `item_${Date.now()}_${i}`
      };
      cards.push(itemInstance);
    }
  }

  return {
    pack,
    isDraft: false,
    cards
  };
}
