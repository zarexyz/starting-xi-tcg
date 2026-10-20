// =============================================================================
// Starting XI TCG — 3-Phase Match Duel & Tactic Card Engine
// =============================================================================

export const TACTIC_CARDS = [
  {
    id: 't_second_wind',
    name: 'Zweite Luft',
    rarity: 'silver',
    icon: '⚡',
    description: '+15 PHY & Konditionsschub für das Duell.',
    boostAttribute: 'phy',
    boostValue: 15
  },
  {
    id: 't_park_bus',
    name: 'Beton anrühren',
    rarity: 'gold',
    icon: '🛡️',
    description: '+20 DEF & Blockade gegnerischer Passwege.',
    boostAttribute: 'def',
    boostValue: 20
  },
  {
    id: 't_counter_frenzy',
    name: 'Überfall-Konter',
    rarity: 'special',
    icon: '🎯',
    description: '+25 PAC & Dynamischer Tempovorteil im Vorstoß.',
    boostAttribute: 'pac',
    boostValue: 25
  },
  {
    id: 't_sniper_focus',
    name: 'Torjäger-Instinkt',
    rarity: 'gold',
    icon: '⚽',
    description: '+18 SHO im finalen Torabschluss-Duell.',
    boostAttribute: 'sho',
    boostValue: 18
  }
];

/**
 * Erzeugt die Duell-Szenen für ein Pflichtspiel (Liga oder K.o.-Pokal)
 */
export function setupMatchSimulation(homeClub, awayClub, options = {}) {
  const isCupMatch = !!options.isCupMatch;
  const cupRound = options.cupRound || 1;

  const homeStarters = homeClub.squad.filter(p => p.isStarter);
  const awayStarters = awayClub.squad.filter(p => p.isStarter);

  const homeAttackers = homeStarters.filter(p => ['ST', 'LF', 'RF'].includes(p.position));
  const homeDefenders = homeStarters.filter(p => ['IV', 'LV', 'RV'].includes(p.position));
  const homeMidfielders = homeStarters.filter(p => ['ZM', 'ZDM', 'ZOM', 'LM', 'RM'].includes(p.position));
  const homeGK = homeStarters.find(p => p.position === 'TW') || homeStarters[0];

  const awayAttackers = awayStarters.filter(p => ['ST', 'LF', 'RF'].includes(p.position));
  const awayDefenders = awayStarters.filter(p => ['IV', 'LV', 'RV'].includes(p.position));
  const awayMidfielders = awayStarters.filter(p => ['ZM', 'ZDM', 'ZOM', 'LM', 'RM'].includes(p.position));
  const awayGK = awayStarters.find(p => p.position === 'TW') || awayStarters[0];

  // 4 Schlüssel-Duelle über 90 Minuten (plus optionales 5. Verlängerungsduell im Pokal)
  const minutes = isCupMatch ? [22, 45, 71, 88, 118] : [18, 42, 67, 85];
  const duels = minutes.map((minute, idx) => {
    const isHomeAttacking = idx % 2 === 0 ? Math.random() < 0.6 : Math.random() < 0.4;
    const attackerClub = isHomeAttacking ? homeClub : awayClub;
    const defenderClub = isHomeAttacking ? awayClub : homeClub;

    const attackerList = isHomeAttacking ? (homeAttackers.length ? homeAttackers : homeMidfielders) : (awayAttackers.length ? awayAttackers : awayMidfielders);
    const defenderList = isHomeAttacking ? (awayDefenders.length ? awayDefenders : awayMidfielders) : (homeDefenders.length ? homeDefenders : homeMidfielders);
    const defenderGK = isHomeAttacking ? awayGK : homeGK;

    const attacker = attackerList[Math.floor(Math.random() * attackerList.length)] || homeStarters[0];
    const defender = defenderList[Math.floor(Math.random() * defenderList.length)] || awayStarters[0];

    return {
      id: `duel_${idx + 1}`,
      minute,
      isHomeAttacking,
      attackerClub,
      defenderClub,
      attacker,
      defender,
      goalkeeper: defenderGK,
      outcome: null, // 'GOAL' | 'SAVED' | 'TACKLED'
      scorer: null,
      playedCard: null,
      phases: {
        phase1: { name: 'Aufbau & Physis', statAtt: 'pac', statDef: 'phy', resolved: false, attWins: false },
        phase2: { name: 'Dribbling & Zweikampf', statAtt: 'dri', statDef: 'def', resolved: false, attWins: false },
        phase3: { name: 'Torabschluss & Parade', statAtt: 'sho', statDef: 'def', resolved: false, attWins: false }
      }
    };
  });

  return {
    homeClub,
    awayClub,
    isCupMatch,
    cupRound,
    currentMinute: 0,
    homeScore: 0,
    awayScore: 0,
    currentDuelIndex: 0,
    duels,
    events: [],
    completed: false
  };
}

/**
 * Löst ein Duell Schritt für Schritt oder sofort auf
 */
export function resolveDuelClash(duel, activeTacticCard = null) {
  let attPac = duel.attacker.pac;
  let attDri = duel.attacker.dri;
  let attSho = duel.attacker.sho;
  let defPhy = duel.defender.phy;
  let defDef = duel.defender.def;
  let gkRef = duel.goalkeeper ? duel.goalkeeper.def : 70;

  if (activeTacticCard) {
    duel.playedCard = activeTacticCard;
    if (activeTacticCard.boostAttribute === 'pac') attPac += activeTacticCard.boostValue;
    if (activeTacticCard.boostAttribute === 'phy') attPac += activeTacticCard.boostValue;
    if (activeTacticCard.boostAttribute === 'sho') attSho += activeTacticCard.boostValue;
    if (activeTacticCard.boostAttribute === 'def') defDef += activeTacticCard.boostValue;
  }

  // Phase 1: Physis (Chance für Angreifer)
  const p1Prob = attPac / (attPac + defPhy);
  const p1AttWins = Math.random() < (p1Prob + 0.05);

  // Phase 2: Dribbling vs Defense
  const p2Prob = attDri / (attDri + defDef);
  const p2AttWins = Math.random() < (p2Prob + (p1AttWins ? 0.10 : -0.10));

  // Phase 3: Schuss vs Torwart
  let isGoal = false;
  if (p2AttWins) {
    const p3Prob = attSho / (attSho + gkRef);
    isGoal = Math.random() < p3Prob;
  }

  duel.phases.phase1.resolved = true;
  duel.phases.phase1.attWins = p1AttWins;
  duel.phases.phase2.resolved = true;
  duel.phases.phase2.attWins = p2AttWins;
  duel.phases.phase3.resolved = true;
  duel.phases.phase3.attWins = isGoal;

  if (isGoal) {
    duel.outcome = 'GOAL';
    duel.scorer = duel.attacker;
  } else if (!p2AttWins) {
    duel.outcome = 'TACKLED';
  } else {
    duel.outcome = 'SAVED';
  }

  return duel;
}

/**
 * Simuliert das gesamte Restspiel in 0,5 Sekunden (Blitz-Ergebnis)
 */
export function simulateInstantMatch(matchState) {
  while (matchState.currentDuelIndex < matchState.duels.length) {
    const duel = matchState.duels[matchState.currentDuelIndex];
    resolveDuelClash(duel);

    if (duel.outcome === 'GOAL') {
      if (!duel.attacker.stats) duel.attacker.stats = {};
      duel.attacker.stats.goals = (duel.attacker.stats.goals || 0) + 1;

      if (duel.isHomeAttacking) {
        matchState.homeScore++;
        matchState.events.push({ minute: duel.minute, text: `⚽ TOR für ${matchState.homeClub.name}! ${duel.attacker.name} trifft im 3-Phasen Duell!` });
      } else {
        matchState.awayScore++;
        matchState.events.push({ minute: duel.minute, text: `⚽ TOR für ${matchState.awayClub.name}! ${duel.attacker.name} vollendet eiskalt!` });
      }
    } else {
      matchState.events.push({ minute: duel.minute, text: `🧤 Glanzparade! ${duel.defender.name} klärt zur Ecke (${duel.minute}').` });
    }

    matchState.currentDuelIndex++;
  }

  matchState.currentMinute = 90;
  matchState.completed = true;
  return matchState;
}
