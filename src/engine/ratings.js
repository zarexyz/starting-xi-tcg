// =============================================================================
// Starting XI TCG — Rating, Synergy & Attribute Engine
// =============================================================================

export const POSITIONS = [
  'TW', 'LV', 'IV', 'RV', 'ZDM', 'ZM', 'ZOM', 'LM', 'RM', 'LF', 'RF', 'ST'
];

export const POSITION_CATEGORY = {
  TW: 'GK',
  LV: 'DF', IV: 'DF', RV: 'DF',
  ZDM: 'MF', ZM: 'MF', ZOM: 'MF', LM: 'MF', RM: 'MF',
  LF: 'FW', RF: 'FW', ST: 'FW'
};

/**
 * Berechnet das Rarity-Tier einer Karte
 */
export function getRarityTier(ovr) {
  if (ovr >= 84) return 'special';
  if (ovr >= 75) return 'gold';
  if (ovr >= 65) return 'silver';
  return 'bronze';
}

/**
 * Berechnet die effektive OVR unter Berücksichtigung der Position
 */
export function getEffectiveOVR(player, playedPosition) {
  if (!player) return 50;
  const base = player.ovr || 60;
  if (!playedPosition || playedPosition === player.position) {
    return base;
  }

  const naturalCat = POSITION_CATEGORY[player.position];
  const playedCat = POSITION_CATEGORY[playedPosition];

  // Gleiche Positionskategorie (z.B. ZM statt ZOM) -> -10%
  if (naturalCat === playedCat) {
    return Math.round(base * 0.90);
  }

  // Verwandte Kategorie (z.B. DF statt MF oder MF statt FW) -> -25%
  if ((naturalCat === 'DF' && playedCat === 'MF') || (naturalCat === 'MF' && playedCat === 'DF') ||
      (naturalCat === 'MF' && playedCat === 'FW') || (naturalCat === 'FW' && playedCat === 'MF')) {
    return Math.round(base * 0.75);
  }

  // Komplett fremde Position (z.B. ST als IV oder Feldspieler im Tor) -> -50%
  return Math.round(base * 0.50);
}

/**
 * Berechnet die Team-Chemie und individuelle Pips (0 bis 3) für die Startelf
 */
export function calculateSquadChemistry(starters) {
  if (!starters || starters.length === 0) return { totalChemistry: 0, pips: {} };

  const pips = {};
  let totalPips = 0;

  // Zähle Nationen in der Startelf
  const nationCounts = {};
  starters.forEach(p => {
    if (p && p.nationality) {
      nationCounts[p.nationality] = (nationCounts[p.nationality] || 0) + 1;
    }
  });

  starters.forEach(p => {
    if (!p) return;
    let pip = 0;
    const sameNation = (nationCounts[p.nationality] || 0) - 1;

    // Auf richtiger Position?
    const onPosition = p.currentSlot === p.position;
    if (onPosition) pip += 1;

    // Mindestens 2 weitere Landsleute im Team?
    if (sameNation >= 2) pip += 1;
    if (sameNation >= 4) pip += 1;

    pip = Math.min(3, pip);
    pips[p.id] = pip;
    totalPips += pip;
  });

  // Max 33 Pips (11 Spieler x 3 Pips) = 100% Chemie
  const maxPips = starters.length * 3;
  const chemistryPercent = maxPips > 0 ? Math.round((totalPips / maxPips) * 100) : 0;

  return {
    chemistryPercent,
    totalPips,
    maxPips,
    pips
  };
}
