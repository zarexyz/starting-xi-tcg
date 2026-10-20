// =============================================================================
// Match-Engine (Richtung „C“): Die Entscheidungen fallen vor dem Anpfiff.
// Formation, Spielstil, Aufstellung und Fitness bestimmen die Stärke der
// Mannschaftsteile. Daraus entstehen Angriffe, Schlüsselszenen und Tore.
// =============================================================================

import { FORMATIONS, STYLES, POSITION_GROUP, styleMatchup } from './constants.js';
import { effectiveRating, familiarity, shortName, fitnessFactor } from './player.js';
import { clamp } from './rng.js';

/** Formationsbedingte Verschiebung der Mannschaftsteile */
const FORMATION_SHAPE = {
  '4-3-3': { def: 0, mid: -0.5, att: 1.5 },
  '4-4-2': { def: 0.5, mid: 0.5, att: 0 },
  '4-2-3-1': { def: 0.5, mid: 1.5, att: -0.5 },
  '3-5-2': { def: -2, mid: 2, att: 0.5 },
  '5-3-2': { def: 3, mid: -1, att: -1.5 }
};

const BASE_ATTACKS = 20; // Angriffe beider Teams zusammen

/**
 * Aufstellung in Spielstärke umrechnen.
 * setup: { formation, style, lineup: { slotId: playerId }, bench: [playerId], boosts }
 */
export function buildTeam(state, clubId, setup) {
  const club = state.clubs[clubId];
  const formation = FORMATIONS[setup.formation] || FORMATIONS['4-3-3'];
  const style = STYLES[setup.style] || STYLES.AUSGEWOGEN;
  const boosts = setup.boosts || {};
  const slots = formation.slots.map(slot => {
    const player = state.players[setup.lineup[slot.id]];
    const rating = player ? effectiveRating(player, slot.pos) : 25;
    return { ...slot, player, rating, group: POSITION_GROUP[slot.pos] };
  });

  const avg = group => {
    const s = slots.filter(x => x.group === group);
    return s.reduce((sum, x) => sum + x.rating, 0) / Math.max(1, s.length);
  };
  const shape = FORMATION_SHAPE[setup.formation] || FORMATION_SHAPE['4-3-3'];
  const gk = avg('GK');
  const def = avg('DEF') + shape.def;
  const mid = avg('MID') + shape.mid;
  const att = avg('ATT') + shape.att;

  return {
    clubId,
    club,
    formation: setup.formation,
    style,
    slots,
    bench: (setup.bench || []).map(id => state.players[id]).filter(Boolean),
    lines: { gk, def, mid, att },
    midControl: mid * 0.7 + def * 0.12 + att * 0.18 + (boosts.mid || 0),
    attackPower: att * 0.65 + mid * 0.35 + (boosts.att || 0),
    defensePower: def * 0.7 + mid * 0.3 + style.defBonus + (boosts.def || 0),
    keeper: slots.find(s => s.group === 'GK'),
    avgCondition: slots.reduce((s, x) => s + (x.player?.condition ?? 0), 0) / 11
  };
}

const sigmoid = x => 1 / (1 + Math.exp(-x));

function pickShooter(rng, team) {
  const weightFor = s => {
    const g = { ATT: 3.2, MID: 1.4, DEF: 0.35, GK: 0 }[s.group];
    const bonus = s.pos === 'ST' ? 1.4 : s.pos === 'ZOM' ? 1.2 : 1;
    return g * bonus * Math.max(1, (s.player?.attrs.sch ?? 30) - 30);
  };
  return rng.weighted(team.slots.filter(s => s.player).map(s => ({ value: s, weight: weightFor(s) })));
}

function pickAssister(rng, team, shooter) {
  const cands = team.slots.filter(s => s.player && s !== shooter && s.group !== 'GK');
  return rng.weighted(cands.map(s => ({
    value: s,
    weight: ({ MID: 2.2, ATT: 1.8, DEF: 0.7 }[s.group]) * Math.max(1, (s.player.attrs.pas ?? 30) - 30)
  })));
}

function pickDefender(rng, team) {
  const cands = team.slots.filter(s => s.player && (s.group === 'DEF' || s.group === 'MID'));
  return rng.weighted(cands.map(s => ({
    value: s,
    weight: (s.group === 'DEF' ? 2.5 : 1) * Math.max(1, (s.player.attrs.abw ?? 30) - 25)
  })));
}

const pct = p => Math.round(p * 100);

/**
 * Ein komplettes Spiel simulieren.
 * opts: { neutral, knockout }
 */
export function simulateMatch(rng, home, away, opts = {}) {
  const homeAdv = opts.neutral ? 0 : 1.6;
  const edge = styleMatchup(home.style.key, away.style.key); // +1 Heim kontert, -1 Gast kontert

  const midH = home.midControl + home.style.midBonus + homeAdv + edge * 1.5;
  const midA = away.midControl + away.style.midBonus - edge * 1.5;
  const possession = clamp(sigmoid((midH - midA) / 13), 0.3, 0.7);

  const concede = s => (s.key === 'MAUERN' ? 0.85 : s.key === 'PRESSING' ? 1.06 : 1);
  let lamH = BASE_ATTACKS * possession * home.style.chanceMult * concede(away.style);
  let lamA = BASE_ATTACKS * (1 - possession) * away.style.chanceMult * concede(home.style);
  if (edge > 0) { lamH *= 1.14; lamA *= 0.92; }
  if (edge < 0) { lamA *= 1.14; lamH *= 0.92; }

  const sides = [
    { key: 'home', team: home, opp: away, attacks: rng.poisson(lamH), edge, adv: homeAdv },
    { key: 'away', team: away, opp: home, attacks: rng.poisson(lamA), edge: -edge, adv: 0 }
  ];

  const chances = [];
  for (const side of sides) {
    for (let i = 0; i < side.attacks; i++) {
      const shooter = pickShooter(rng, side.team);
      const defender = pickDefender(rng, side.opp);
      const keeper = side.opp.keeper;
      const assister = rng.chance(0.75) ? pickAssister(rng, side.team, shooter) : null;

      // Phase 1: Durchbruch – Angriffsreihe gegen Abwehr, Duell Angreifer gegen Verteidiger
      const shooterBreak = ((shooter.player.attrs.tem + shooter.player.attrs.dri) / 2) * familiarity(shooter.player, shooter.pos);
      const defenderHold = (defender.player.attrs.abw * 0.65 + defender.player.attrs.phy * 0.35) * familiarity(defender.player, defender.pos);
      const p1 = clamp(sigmoid(
        (side.team.attackPower - side.opp.defensePower) / 24 +
        (shooterBreak - defenderHold) / 60 +
        side.edge * 0.22 + side.adv / 12 - 0.15
      ), 0.12, 0.85);

      // Phase 2: Abschluss – Schuss gegen Torwart
      const finish = shooter.player.attrs.sch * familiarity(shooter.player, shooter.pos) *
        fitnessFactor(shooter.player.condition);
      const keep = keeper?.rating ?? 30;
      const p2 = clamp(0.3 * side.team.style.qualityMult * Math.exp((finish - keep) / 40), 0.06, 0.62);

      const broke = rng.chance(p1);
      const scored = broke && rng.chance(p2);
      chances.push({
        side: side.key,
        minute: 0,
        shooter, assister, defender, keeper,
        p1, p2, broke, scored,
        xg: p1 * p2,
        att: { label: 'Tempo & Dribbling', value: Math.round(shooterBreak) },
        def: { label: 'Abwehr & Physis', value: Math.round(defenderHold) },
        fin: { label: 'Schuss', value: Math.round(finish) },
        gk: { label: 'Torwart', value: Math.round(keep) }
      });
    }
  }

  // Minuten verteilen
  const usedMinutes = new Set();
  for (const c of chances) {
    let m;
    do { m = rng.int(2, 93); } while (usedMinutes.has(m) && usedMinutes.size < 90);
    usedMinutes.add(m);
    c.minute = m;
  }
  chances.sort((a, b) => a.minute - b.minute);

  let hg = 0;
  let ag = 0;
  const goals = [];
  for (const c of chances) {
    if (!c.scored) continue;
    if (c.side === 'home') hg++; else ag++;
    goals.push({
      minute: c.minute,
      side: c.side,
      scorerId: c.shooter.player.id,
      assistId: c.assister?.player.id || null,
      score: [hg, ag]
    });
  }

  // Verletzungen während des Spiels
  const injuries = [];
  for (const side of sides) {
    for (const s of side.team.slots) {
      if (!s.player) continue;
      const p = 0.009 * (1 + (100 - s.player.condition) / 35) * (s.player.age > 31 ? 1.3 : 1);
      if (rng.chance(p)) {
        injuries.push({ side: side.key, playerId: s.player.id, minute: rng.int(5, 88), slotPos: s.pos });
      }
    }
  }
  // Einwechslungen für Verletzte
  const subs = [];
  for (const inj of injuries) {
    const team = inj.side === 'home' ? home : away;
    const used = new Set(subs.map(x => x.inId));
    const cand = team.bench
      .filter(p => !used.has(p.id) && !p.injury)
      .sort((a, b) => effectiveRating(b, inj.slotPos) - effectiveRating(a, inj.slotPos))[0];
    if (cand) subs.push({ side: inj.side, outId: inj.playerId, inId: cand.id, minute: inj.minute });
  }

  // Elfmeterschießen in K.-o.-Spielen
  let pens = null;
  if (opts.knockout && hg === ag) {
    pens = penaltyShootout(rng, home, away);
  }

  const result = {
    homeId: home.clubId,
    awayId: away.clubId,
    hg, ag, pens,
    possession: [pct(possession), 100 - pct(possession)],
    stats: {
      shots: [chances.filter(c => c.side === 'home').length, chances.filter(c => c.side === 'away').length],
      onTarget: [chances.filter(c => c.side === 'home' && c.broke).length, chances.filter(c => c.side === 'away' && c.broke).length],
      xg: [
        Math.round(chances.filter(c => c.side === 'home').reduce((s, c) => s + c.xg, 0) * 10) / 10,
        Math.round(chances.filter(c => c.side === 'away').reduce((s, c) => s + c.xg, 0) * 10) / 10
      ]
    },
    styles: [home.style.key, away.style.key],
    formations: [home.formation, away.formation],
    goals,
    injuries,
    subs,
    lineups: {
      home: home.slots.map(s => ({ pos: s.pos, playerId: s.player?.id })),
      away: away.slots.map(s => ({ pos: s.pos, playerId: s.player?.id }))
    },
    keyScenes: [],
    ticker: [],
    ratings: {},
    motm: null,
    meta: {
      edge,
      lines: { home: home.lines, away: away.lines },
      avgCondition: [Math.round(home.avgCondition), Math.round(away.avgCondition)]
    }
  };

  result.ratings = rateplayers(rng, result, home, away, chances);
  result.motm = Object.entries(result.ratings).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  result.keyScenes = pickKeyScenes(chances);
  result.ticker = buildTicker(rng, result, home, away, chances);
  return result;
}

function penaltyShootout(rng, home, away) {
  const taker = team => {
    const shooters = team.slots.filter(s => s.player && s.group !== 'GK')
      .sort((a, b) => b.player.attrs.sch - a.player.attrs.sch);
    return shooters;
  };
  const hs = taker(home);
  const as = taker(away);
  const prob = (s, keeper) => clamp(0.76 + (s.player.attrs.sch - (keeper?.rating ?? 50)) / 200, 0.55, 0.92);
  let h = 0;
  let a = 0;
  for (let i = 0; i < 5; i++) {
    if (rng.chance(prob(hs[i % hs.length], away.keeper))) h++;
    if (rng.chance(prob(as[i % as.length], home.keeper))) a++;
  }
  let i = 5;
  while (h === a && i < 30) {
    if (rng.chance(prob(hs[i % hs.length], away.keeper))) h++;
    if (rng.chance(prob(as[i % as.length], home.keeper))) a++;
    i++;
  }
  if (h === a) h++;
  return { h, a };
}

function rateplayers(rng, result, home, away, chances) {
  const ratings = {};
  const sides = [
    { team: home, gf: result.hg, ga: result.ag, key: 'home' },
    { team: away, gf: result.ag, ga: result.hg, key: 'away' }
  ];
  for (const { team, gf, ga, key } of sides) {
    const won = gf > ga || (gf === ga && result.pens && (key === 'home' ? result.pens.h > result.pens.a : result.pens.a > result.pens.h));
    const lost = gf < ga || (gf === ga && result.pens && !won);
    const teamAvg = team.slots.reduce((s, x) => s + x.rating, 0) / 11;
    for (const s of team.slots) {
      if (!s.player) continue;
      let r = 6.1 + (won ? 0.45 : lost ? -0.4 : 0) + (s.rating - teamAvg) / 12 + rng.normal(0, 0.35);
      const id = s.player.id;
      r += result.goals.filter(g => g.scorerId === id).length * 1.05;
      r += result.goals.filter(g => g.assistId === id).length * 0.6;
      if (s.group === 'GK') {
        const saves = chances.filter(c => c.side !== key && c.broke && !c.scored).length;
        r += saves * 0.18 - ga * 0.35 + (ga === 0 ? 0.6 : 0);
      }
      if (s.group === 'DEF') r += ga === 0 ? 0.45 : -ga * 0.15;
      ratings[id] = Math.round(clamp(r, 3.5, 10) * 10) / 10;
    }
  }
  for (const sub of result.subs) {
    ratings[sub.inId] = Math.round(clamp(6 + rng.normal(0, 0.3), 5, 8) * 10) / 10;
  }
  return ratings;
}

/** 3–5 Schlüsselszenen: alle Tore plus die größten vergebenen Chancen */
function pickKeyScenes(chances) {
  const goals = chances.filter(c => c.scored);
  const misses = chances.filter(c => c.broke && !c.scored).sort((a, b) => b.xg - a.xg);
  const tackles = chances.filter(c => !c.broke).sort((a, b) => b.p1 - a.p1);
  let picked = [...goals];
  for (const m of misses) { if (picked.length >= 4) break; picked.push(m); }
  for (const t of tackles) { if (picked.length >= 3) break; picked.push(t); }
  picked = picked.slice(0, Math.max(3, Math.min(6, goals.length + 2)));
  picked.sort((a, b) => a.minute - b.minute);
  return picked.map(c => ({
    minute: c.minute,
    side: c.side,
    attackerId: c.shooter.player.id,
    attackerPos: c.shooter.pos,
    defenderId: c.defender.player.id,
    defenderPos: c.defender.pos,
    keeperId: c.keeper?.player?.id || null,
    assistId: c.assister?.player.id || null,
    outcome: c.scored ? 'GOAL' : c.broke ? 'SAVE' : 'TACKLE',
    phases: [
      { label: 'Durchbruch', att: c.att, def: c.def, chance: pct(c.p1), success: c.broke },
      { label: 'Abschluss', att: c.fin, def: c.gk, chance: pct(c.p2), success: c.scored, skipped: !c.broke }
    ]
  }));
}

// -----------------------------------------------------------------------------
// Ticker
// -----------------------------------------------------------------------------

const T = {
  goal: [
    '{s} trifft nach Vorlage von {a}!',
    'TOR! {s} schiebt eiskalt ein, {a} hatte perfekt aufgelegt.',
    '{s} vollendet einen sehenswerten Spielzug über {a}.',
    'Was für ein Abschluss von {s}! {a} mit der Vorarbeit.'
  ],
  goalSolo: [
    'TOR! {s} setzt sich allein durch und trifft.',
    '{s} zieht ab – drin! Der Keeper ist chancenlos.',
    'Sololauf von {s}, und der Ball zappelt im Netz!'
  ],
  save: [
    'Riesenchance für {s}, aber {k} pariert stark!',
    '{s} kommt frei zum Abschluss – {k} ist zur Stelle.',
    'Knapp vorbei! {s} verzieht aus guter Position.',
    '{s} trifft nur den Pfosten!'
  ],
  tackle: [
    '{d} klärt in letzter Sekunde gegen {s}.',
    'Starker Zweikampf von {d}, {s} kommt nicht durch.',
    '{d} grätscht {s} sauber ab.'
  ],
  injury: [
    '{p} bleibt liegen und muss verletzt raus.',
    'Bittere Szene: {p} verletzt sich und kann nicht weitermachen.'
  ],
  sub: ['Wechsel: {i} kommt für {o}.']
};

function fill(rng, list, vars) {
  let t = rng.pick(list);
  for (const k in vars) t = t.replaceAll(`{${k}}`, vars[k]);
  return t;
}

function buildTicker(rng, result, home, away, chances) {
  const name = id => {
    const p = [...home.slots, ...away.slots].map(s => s.player).find(x => x?.id === id) ||
      [...home.bench, ...away.bench].find(x => x.id === id);
    return p ? shortName(p) : '?';
  };
  const items = [{ minute: 0, type: 'kickoff', text: `Anpfiff! ${home.club.name} gegen ${away.club.name}.` }];

  const goalChances = chances.filter(c => c.scored);
  const bigMisses = chances.filter(c => c.broke && !c.scored).sort((a, b) => b.xg - a.xg).slice(0, 3);
  const tackles = chances.filter(c => !c.broke).sort((a, b) => b.p1 - a.p1).slice(0, 2);
  const shown = [...goalChances, ...bigMisses, ...tackles].sort((a, b) => a.minute - b.minute);
  let hg = 0;
  let ag = 0;
  for (const c of shown) {
    const vars = {
      s: shortName(c.shooter.player),
      a: c.assister ? shortName(c.assister.player) : '',
      d: shortName(c.defender.player),
      k: c.keeper?.player ? shortName(c.keeper.player) : 'der Keeper'
    };
    if (c.scored) {
      if (c.side === 'home') hg++; else ag++;
      items.push({
        minute: c.minute, type: 'goal', side: c.side, score: [hg, ag],
        text: fill(rng, c.assister ? T.goal : T.goalSolo, vars)
      });
    } else if (c.broke) {
      items.push({ minute: c.minute, type: 'chance', side: c.side, text: fill(rng, T.save, vars) });
    } else {
      items.push({ minute: c.minute, type: 'tackle', side: c.side, text: fill(rng, T.tackle, vars) });
    }
  }
  for (const inj of result.injuries) {
    items.push({ minute: inj.minute, type: 'injury', side: inj.side, text: fill(rng, T.injury, { p: name(inj.playerId) }) });
  }
  for (const sub of result.subs) {
    items.push({ minute: sub.minute, type: 'sub', side: sub.side, text: fill(rng, T.sub, { i: name(sub.inId), o: name(sub.outId) }) });
  }
  items.push({ minute: 45, type: 'half', text: 'Halbzeit.' });
  items.sort((a, b) => a.minute - b.minute || (a.type === 'half' ? -1 : 1));
  items.push({ minute: 90, type: 'end', text: `Abpfiff! ${result.hg}:${result.ag}.` });
  if (result.pens) {
    items.push({ minute: 120, type: 'pens', text: `Elfmeterschießen: ${result.pens.h}:${result.pens.a}.` });
  }
  return items;
}

// -----------------------------------------------------------------------------
// Auswertung: Warum hast du gewonnen oder verloren?
// -----------------------------------------------------------------------------

export function analyzeMatch(state, result, side) {
  const i = side === 'home' ? 0 : 1;
  const o = 1 - i;
  const reasons = [];
  const myStyle = STYLES[result.styles[i]];
  const theirStyle = STYLES[result.styles[o]];
  const edge = side === 'home' ? result.meta.edge : -result.meta.edge;

  if (edge > 0) {
    reasons.push({ impact: 1, icon: 'strategy', text: `Dein ${myStyle.name} hat ihr ${theirStyle.name} ausgehebelt.` });
  } else if (edge < 0) {
    reasons.push({ impact: -1, icon: 'strategy', text: `Ihr ${theirStyle.name} war das passende Mittel gegen dein ${myStyle.name}.` });
  }

  const poss = result.possession[i];
  if (poss >= 58) reasons.push({ impact: 1, icon: 'midfield', text: `Ihr habt das Mittelfeld kontrolliert (${poss} % Ballbesitz).` });
  else if (poss <= 42) reasons.push({ impact: -1, icon: 'midfield', text: `Das Mittelfeld ging an den Gegner (nur ${poss} % Ballbesitz).` });

  const myGoals = i === 0 ? result.hg : result.ag;
  const myXg = result.stats.xg[i];
  if (myGoals - myXg >= 1.1) reasons.push({ impact: 1, icon: 'target', text: `Eiskalt vor dem Tor: ${myGoals} Treffer aus ${myXg.toFixed(1)} erwarteten Toren.` });
  else if (myXg - myGoals >= 1.1) reasons.push({ impact: -1, icon: 'target', text: `Chancenwucher: ${myXg.toFixed(1)} erwartete Tore, aber nur ${myGoals} Treffer.` });

  const cond = result.meta.avgCondition[i];
  if (cond < 82) reasons.push({ impact: -1, icon: 'battery', text: `Müde Beine: Deine Startelf ging mit ${cond} % Fitness ins Spiel.` });
  const theirCond = result.meta.avgCondition[o];
  if (theirCond < 82 && cond - theirCond >= 8) reasons.push({ impact: 1, icon: 'battery', text: `Frischere Beine: Der Gegner kam nur mit ${theirCond} % Fitness.` });

  const lineup = result.lineups[side];
  const offPos = lineup
    .map(l => ({ l, p: state.players[l.playerId] }))
    .filter(x => x.p && familiarity(x.p, x.l.pos) < 0.93);
  if (offPos.length) {
    const x = offPos[0];
    reasons.push({ impact: -1, icon: 'swap', text: `${shortName(x.p)} spielte fremd als ${x.l.pos} statt ${x.p.position}.` });
  }

  const lm = result.meta.lines[side];
  const lo = result.meta.lines[side === 'home' ? 'away' : 'home'];
  const diffAtt = lm.att - lo.def;
  if (diffAtt >= 4) reasons.push({ impact: 1, icon: 'attack', text: 'Deine Offensive war ihrer Abwehr klar überlegen.' });
  if (lo.att - lm.def >= 4) reasons.push({ impact: -1, icon: 'shield', text: 'Ihre Offensive war deiner Abwehr klar überlegen.' });

  if (side === 'home' && !result.meta.neutral) {
    // Heimvorteil wird nicht extra erwähnt, er ist eingepreist
  }

  const motm = result.motm && state.players[result.motm];
  if (motm) {
    const mine = lineup.some(l => l.playerId === motm.id) || result.subs.some(s => s.inId === motm.id && s.side === side);
    reasons.push({
      impact: mine ? 1 : -1, icon: 'star',
      text: `Spieler des Spiels: ${shortName(motm)} (${result.ratings[motm.id].toFixed(1)}).`
    });
  }
  return reasons.slice(0, 5);
}

/** Schnelle Prognose für die Spielvorbereitung (Monte Carlo) */
export function predictMatch(rng, home, away, opts = {}, runs = 120) {
  let w = 0;
  let d = 0;
  for (let i = 0; i < runs; i++) {
    const r = simulateMatchLite(rng, home, away, opts);
    if (r > 0) w++; else if (r === 0) d++;
  }
  return { win: Math.round((w / runs) * 100), draw: Math.round((d / runs) * 100), loss: Math.round(((runs - w - d) / runs) * 100) };
}

/** Schlanke Variante ohne Ticker und Bewertungen – nur für Prognosen */
function simulateMatchLite(rng, home, away, opts) {
  const homeAdv = opts.neutral ? 0 : 1.6;
  const edge = styleMatchup(home.style.key, away.style.key);
  const possession = clamp(sigmoid(((home.midControl + home.style.midBonus + homeAdv + edge * 1.5) - (away.midControl + away.style.midBonus - edge * 1.5)) / 13), 0.3, 0.7);
  const concede = s => (s.key === 'MAUERN' ? 0.85 : s.key === 'PRESSING' ? 1.06 : 1);
  let lamH = BASE_ATTACKS * possession * home.style.chanceMult * concede(away.style);
  let lamA = BASE_ATTACKS * (1 - possession) * away.style.chanceMult * concede(home.style);
  if (edge > 0) { lamH *= 1.14; lamA *= 0.92; }
  if (edge < 0) { lamA *= 1.14; lamH *= 0.92; }
  const goalsFor = (team, opp, lam, e, adv) => {
    const p1 = clamp(sigmoid((team.attackPower - opp.defensePower) / 24 + e * 0.22 + adv / 12 - 0.15), 0.12, 0.85);
    const avgFinish = team.slots.filter(s => s.group === 'ATT').reduce((s, x) => s + (x.player?.attrs.sch ?? 30), 0) /
      Math.max(1, team.slots.filter(s => s.group === 'ATT').length);
    const p2 = clamp(0.3 * team.style.qualityMult * Math.exp((avgFinish * 0.9 - (opp.keeper?.rating ?? 30)) / 40), 0.06, 0.62);
    return rng.poisson(lam * p1 * p2);
  };
  return goalsFor(home, away, lamH, edge, homeAdv) - goalsFor(away, home, lamA, -edge, 0);
}
