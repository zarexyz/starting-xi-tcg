// =============================================================================
// Siegprognose für die Spielvorbereitung
// Rechnet nur mit sichtbaren Größen: Stärke, Aufstellung, Fitness, Heimvorteil,
// Matchplan. Der Spielstil fließt bewusst NICHT ein, sonst ließe sich der
// passende Stil durch Durchklicken ablesen.
// =============================================================================

import { buildTeam, predictMatch } from './match.js';
import { bestLineup } from './ai.js';
import { createRng } from './rng.js';

const NEUTRAL = 'AUSGEWOGEN';

export function expectedOpponentSetup(game, oppId) {
  const opp = game.clubs[oppId];
  const formation = opp.preferredFormation;
  const { lineup, bench } = bestLineup(game, oppId, formation, { minCondition: 70 });
  return { formation, style: opp.preferredStyle, lineup, bench, boosts: {} };
}

export function forecastMatch(game, entry, setup) {
  const m = entry.m;
  const isHome = m.home === 'user';
  const oppId = isHome ? m.away : m.home;
  const mine = buildTeam(game, 'user', { ...setup, style: NEUTRAL, boosts: game.user.matchBoost || {} });
  const theirs = buildTeam(game, oppId, { ...expectedOpponentSetup(game, oppId), style: NEUTRAL });
  const rng = createRng(game.seed + game.dayIndex * 7919);
  const neutral = entry.comp === 'ff' && entry.stage === 'final';
  const r = isHome ? predictMatch(rng, mine, theirs, { neutral }, 160) : predictMatch(rng, theirs, mine, { neutral }, 160);
  return isHome ? r : { win: r.loss, draw: r.draw, loss: r.win };
}
