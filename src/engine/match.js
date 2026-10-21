// =============================================================================
// Match-Engine (Richtung „C“): Die Entscheidungen fallen vor dem Anpfiff.
// Formation, Spielstil, Aufstellung und Fitness bestimmen die Stärke der
// Mannschaftsteile. Daraus entstehen Angriffe, Schlüsselszenen und Tore.
// =============================================================================

import { FORMATIONS, STYLES, POSITION_GROUP, styleMatchup } from './constants.js';
import { effectiveRating, familiarity, shortName, fitnessFactor, attrOf } from './player.js';
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

/** Stil-Vorteil: halbiert gegenüber v1.0, entspricht etwa 2–3 Stärkepunkten */
const EDGE_MID = 0.75;
const EDGE_ATTACK_UP = 1.07;
const EDGE_ATTACK_DOWN = 0.96;
const EDGE_BREAK = 0.11;

/** Mental: Abweichung vom Mittelwert 55, als Faktor um 0 */
const mentalEdge = team => (team.mental - 55) / 40;

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
    mental: slots.reduce((s, x) => s + (x.player ? attrOf(x.player, 'men') : 30), 0) / 11,
    avgCondition: slots.reduce((s, x) => s + (x.player?.condition ?? 0), 0) / 11
  };
}

const sigmoid = x => 1 / (1 + Math.exp(-x));

function pickShooter(rng, team) {
  const weightFor = s => {
    const g = { ATT: 3.2, MID: 1.4, DEF: 0.35, GK: 0 }[s.group];
    const bonus = s.pos === 'ST' ? 1.4 : s.pos === 'ZOM' ? 1.2 : 1;
    return g * bonus * Math.max(1, (s.player ? attrOf(s.player, 'sch') : 30) - 30);
  };
  return rng.weighted(team.slots.filter(s => s.player).map(s => ({ value: s, weight: weightFor(s) })));
}

function pickAssister(rng, team, shooter) {
  const cands = team.slots.filter(s => s.player && s !== shooter && s.group !== 'GK');
  return rng.weighted(cands.map(s => ({
    value: s,
    weight: ({ MID: 2.2, ATT: 1.8, DEF: 0.7 }[s.group]) * Math.max(1, attrOf(s.player, 'pas') - 30)
  })));
}

function pickDefender(rng, team) {
  const cands = team.slots.filter(s => s.player && (s.group === 'DEF' || s.group === 'MID'));
  return rng.weighted(cands.map(s => ({
    value: s,
    weight: (s.group === 'DEF' ? 2.5 : 1) * Math.max(1, attrOf(s.player, 'abw') - 25)
  })));
}

const pct = p => Math.round(p * 100);

/**
 * Ein komplettes Spiel simulieren.
 * opts: { neutral, knockout, big }  big = Pokal, Final Four: Mental zählt mehr
 */
export function simulateMatch(rng, home, away, opts = {}) {
  const homeAdv = opts.neutral ? 0 : 1.6;
  const edge = styleMatchup(home.style.key, away.style.key); // +1 Heim kontert, -1 Gast kontert
  const bigH = opts.big ? mentalEdge(home) * 1.2 : 0;
  const bigA = opts.big ? mentalEdge(away) * 1.2 : 0;

  const midH = home.midControl + home.style.midBonus + homeAdv + edge * EDGE_MID + bigH;
  const midA = away.midControl + away.style.midBonus - edge * EDGE_MID + bigA;
  const possession = clamp(sigmoid((midH - midA) / 13), 0.3, 0.7);

  const concede = s => (s.key === 'MAUERN' ? 0.85 : s.key === 'PRESSING' ? 1.06 : 1);
  let lamH = BASE_ATTACKS * possession * home.style.chanceMult * concede(away.style);
  let lamA = BASE_ATTACKS * (1 - possession) * away.style.chanceMult * concede(home.style);
  if (edge > 0) { lamH *= EDGE_ATTACK_UP; lamA *= EDGE_ATTACK_DOWN; }
  if (edge < 0) { lamA *= EDGE_ATTACK_UP; lamH *= EDGE_ATTACK_DOWN; }

  const sides = [
    { key: 'home', team: home, opp: away, attacks: rng.poisson(lamH), edge, adv: homeAdv, big: bigH },
    { key: 'away', team: away, opp: home, attacks: rng.poisson(lamA), edge: -edge, adv: 0, big: bigA }
  ];

  // Verletzungen zuerst festlegen, damit spätere Szenen den Einwechselspieler zeigen
  const injuries = [];
  for (const side of sides) {
    for (const sl of side.team.slots) {
      if (!sl.player) continue;
      const p = 0.009 * (1 + (100 - sl.player.condition) / 35) * (sl.player.age > 31 ? 1.3 : 1);
      if (rng.chance(p)) {
        injuries.push({ side: side.key, playerId: sl.player.id, minute: rng.int(5, 88), slotPos: sl.pos });
      }
    }
  }
  injuries.sort((a, b) => a.minute - b.minute);
  const subs = [];
  for (const inj of injuries) {
    const team = inj.side === 'home' ? home : away;
    const used = new Set(subs.map(x => x.inId));
    const cand = team.bench
      .filter(p => !used.has(p.id) && !p.injury)
      .sort((a, b) => effectiveRating(b, inj.slotPos) - effectiveRating(a, inj.slotPos))[0];
    if (cand) subs.push({ side: inj.side, outId: inj.playerId, inId: cand.id, minute: inj.minute });
  }

  const cards = [];
  const sentOff = (sideKey, id, minute) => cards.some(c => c.side === sideKey && c.playerId === id && c.type !== 'Y' && c.minute < minute);

  /** Aufstellung zu einer bestimmten Minute (Verletzte raus, Einwechselspieler rein, Platzverweise fehlen) */
  const slotsAt = (team, sideKey, minute) => team.slots.map(sl => {
    if (!sl.player) return sl;
    const inj = injuries.find(x => x.side === sideKey && x.playerId === sl.player.id && x.minute < minute);
    if (!inj) return sentOff(sideKey, sl.player.id, minute) ? { ...sl, player: null } : sl;
    const sub = subs.find(x => x.side === sideKey && x.outId === sl.player.id);
    const subPlayer = sub && team.bench.find(b => b.id === sub.inId);
    if (!subPlayer || sentOff(sideKey, subPlayer.id, minute)) return { ...sl, player: null };
    return { ...sl, player: subPlayer, rating: effectiveRating(subPlayer, sl.pos) };
  }).filter(sl => sl.player);

  // Gelbe und Rote Karten: Pressing foult mehr, Abwehrspieler eher als Stürmer
  const foulRate = st => (st.key === 'PRESSING' ? 1.3 : st.key === 'MAUERN' ? 1.15 : st.key === 'BALLBESITZ' ? 0.85 : 1);
  const cardEvents = [];
  for (const side of sides) {
    const nYellow = rng.poisson(1.7 * foulRate(side.team.style));
    for (let i = 0; i < nYellow; i++) cardEvents.push({ side: side.key, team: side.team, minute: rng.int(8, 90), kind: 'Y' });
    if (rng.chance(0.07 * foulRate(side.team.style))) cardEvents.push({ side: side.key, team: side.team, minute: rng.int(10, 88), kind: 'R' });
  }
  cardEvents.sort((a, b) => a.minute - b.minute);
  const groupWeight = { DEF: 1.6, MID: 1.25, ATT: 0.7, GK: 0.12 };
  for (const ev of cardEvents) {
    const onPitch = slotsAt(ev.team, ev.side, ev.minute);
    if (!onPitch.length) continue;
    const pick = rng.weighted(onPitch.map(sl => ({
      value: sl,
      weight: groupWeight[sl.group] * (1 + Math.max(0, 60 - attrOf(sl.player, 'men')) / 60)
    })));
    const id = pick.player.id;
    if (ev.kind === 'R') { cards.push({ side: ev.side, playerId: id, minute: ev.minute, type: 'R' }); continue; }
    const hasYellow = cards.some(c => c.side === ev.side && c.playerId === id && c.type === 'Y');
    if (hasYellow) {
      // Zweite Gelbe nur selten: Spieler halten sich meist zurück
      if (rng.chance(0.35)) cards.push({ side: ev.side, playerId: id, minute: ev.minute, type: 'YR' });
    } else {
      cards.push({ side: ev.side, playerId: id, minute: ev.minute, type: 'Y' });
    }
  }
  /** Wie viele Spieler fehlen einer Seite zur Minute durch Platzverweis */
  const redsBefore = (sideKey, minute) => cards.filter(c => c.side === sideKey && c.type !== 'Y' && c.minute < minute).length;

  // Angriffe auf Minuten verteilen, dann der Reihe nach ausspielen (Spielstand zählt für Mental)
  const usedMinutes = new Set();
  const attacks = [];
  for (const side of sides) {
    for (let i = 0; i < side.attacks; i++) {
      let minute;
      do { minute = rng.int(2, 93); } while (usedMinutes.has(minute) && usedMinutes.size < 90);
      usedMinutes.add(minute);
      attacks.push({ side, minute });
    }
  }
  attacks.sort((a, b) => a.minute - b.minute);

  const chances = [];
  const score = { home: 0, away: 0 };
  for (const { side, minute } of attacks) {
    const attSlots = { slots: slotsAt(side.team, side.key, minute) };
    const defSlots = { slots: slotsAt(side.opp, side.key === 'home' ? 'away' : 'home', minute) };
    const shooter = pickShooter(rng, attSlots);
    const defender = pickDefender(rng, defSlots);
    const keeper = defSlots.slots.find(sl => sl.group === 'GK') || null;
    const assister = rng.chance(0.75) ? pickAssister(rng, attSlots, shooter) : null;
    const sp = shooter.player;
    const dp = defender.player;

    // Unterzahl: jeder Platzverweis kostet spürbar
    const oppKey = side.key === 'home' ? 'away' : 'home';
    const manDiff = redsBefore(oppKey, minute) - redsBefore(side.key, minute);
    const manEdge = manDiff * 0.32;

    // Mental bei Rückstand: starke Köpfe bäumen sich auf, schwache verkrampfen
    const behind = score[side.key] < score[side.key === 'home' ? 'away' : 'home'];
    const nerve = behind && minute > 55 ? mentalEdge(side.team) * 0.25 : 0;

    // Phase 1: Durchbruch – Angriffsreihe gegen Abwehr, Duell Angreifer gegen Verteidiger
    const shooterBreak = ((attrOf(sp, 'tem') + attrOf(sp, 'dri')) / 2) * familiarity(sp, shooter.pos);
    const defenderHold = (attrOf(dp, 'abw') * 0.65 + attrOf(dp, 'phy') * 0.35) * familiarity(dp, defender.pos);
    const p1 = clamp(sigmoid(
      (side.team.attackPower - side.opp.defensePower) / 24 +
      (shooterBreak - defenderHold) / 60 +
      side.edge * EDGE_BREAK + side.adv / 12 + side.big / 24 + nerve + manEdge - 0.15
    ), 0.12, 0.85);

    // Phase 2: Abschluss – Schuss gegen Torwart
    const finish = attrOf(sp, 'sch') * familiarity(sp, shooter.pos) * fitnessFactor(sp.condition);
    const keep = keeper?.rating ?? 30;
    const p2 = clamp(0.3 * side.team.style.qualityMult * Math.exp((finish - keep) / 40), 0.06, 0.62);

    const broke = rng.chance(p1);
    const scored = broke && rng.chance(p2);
    if (scored) score[side.key]++;
    chances.push({
      side: side.key,
      minute,
      shooter, assister, defender, keeper,
      p1, p2, broke, scored,
      xg: p1 * p2,
      att: { label: 'Tempo & Dribbling', value: Math.round(shooterBreak) },
      def: { label: 'Abwehr & Physis', value: Math.round(defenderHold) },
      fin: { label: 'Schuss', value: Math.round(finish) },
      gk: { label: 'Torwart', value: Math.round(keep) }
    });
  }

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

  // Elfmeterschießen in K.-o.-Spielen
  let pens = null;
  if (opts.knockout && hg === ag) {
    pens = penaltyShootout(rng, home, away, slotsAt(home, 'home', 121), slotsAt(away, 'away', 121));
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
    cards,
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

/**
 * Elfmeterschießen Schuss für Schuss. Wer am Ende auf dem Platz steht, schießt.
 * Rückgabe: { h, a, kicks: [{ side, takerId, keeperId, scored, score: [h, a] }] }
 */
function penaltyShootout(rng, home, away, homeSlots, awaySlots) {
  const order = slots => slots.filter(s => s.player && s.group !== 'GK')
    .sort((a, b) => (attrOf(b.player, 'sch') + attrOf(b.player, 'men') * 0.5) - (attrOf(a.player, 'sch') + attrOf(a.player, 'men') * 0.5));
  const hs = order(homeSlots);
  const as = order(awaySlots);
  const hk = homeSlots.find(s => s.group === 'GK') || null;
  const ak = awaySlots.find(s => s.group === 'GK') || null;
  // Schuss gegen Torwart, die Nerven des Schützen entscheiden mit
  const prob = (s, keeper) => clamp(0.76 + (attrOf(s.player, 'sch') - (keeper?.rating ?? 40)) / 200 + (attrOf(s.player, 'men') - 55) / 250, 0.5, 0.93);
  let h = 0;
  let a = 0;
  const kicks = [];
  const kick = (side, i) => {
    const takers = side === 'home' ? hs : as;
    const keeper = side === 'home' ? ak : hk;
    const t = takers[i % takers.length];
    const scored = rng.chance(prob(t, keeper));
    if (scored) { if (side === 'home') h++; else a++; }
    kicks.push({ side, takerId: t.player.id, keeperId: keeper?.player?.id || null, scored, score: [h, a] });
  };
  for (let i = 0; i < 5; i++) {
    kick('home', i);
    if (h > a + (5 - i - 1) + 1 || a > h + (5 - i - 1)) break; // vorzeitig entschieden
    kick('away', i);
    if (h > a + (5 - i - 1) || a > h + (5 - i - 1)) break;
  }
  let i = 5;
  while (h === a && i < 40) {
    kick('home', i);
    kick('away', i);
    i++;
  }
  if (h === a) { h++; kicks.push({ side: 'home', takerId: hs[0].player.id, keeperId: ak?.player?.id || null, scored: true, score: [h, a] }); }
  return { h, a, kicks };
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
  for (const c of result.cards || []) {
    if (ratings[c.playerId] == null) continue;
    const pen = c.type === 'Y' ? 0.25 : 1.3;
    ratings[c.playerId] = Math.round(clamp(ratings[c.playerId] - pen, 3, 10) * 10) / 10;
  }
  for (const sub of result.subs) {
    const g = result.goals.filter(x => x.scorerId === sub.inId).length;
    const a = result.goals.filter(x => x.assistId === sub.inId).length;
    ratings[sub.inId] = Math.round(clamp(6 + rng.normal(0, 0.3) + g * 1.05 + a * 0.6, 4.5, 10) * 10) / 10;
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
  sub: ['Wechsel: {i} kommt für {o}.'],
  yellow: ['Gelbe Karte für {p}.', '{p} sieht Gelb nach einem harten Einsteigen.', 'Taktisches Foul von {p}, Gelb.'],
  yellowRed: ['Gelb-Rot! {p} muss vom Platz.', '{p} sieht die zweite Gelbe und fliegt.'],
  red: ['Rote Karte! {p} fliegt nach einer Notbremse.', 'Glatt Rot für {p}!']
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
  for (const c of result.cards || []) {
    const list = c.type === 'Y' ? T.yellow : c.type === 'YR' ? T.yellowRed : T.red;
    items.push({ minute: c.minute, type: c.type === 'Y' ? 'yellow' : 'red', side: c.side, playerId: c.playerId, text: fill(rng, list, { p: name(c.playerId) }) });
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

  const myReds = (result.cards || []).filter(c => c.side === side && c.type !== 'Y');
  const theirReds = (result.cards || []).filter(c => c.side !== side && c.type !== 'Y');
  if (myReds.length) {
    const p = state.players[myReds[0].playerId];
    reasons.push({ impact: -1, icon: 'alert', text: `Ab der ${myReds[0].minute}. Minute in Unterzahl${p ? ` nach Platzverweis für ${shortName(p)}` : ''}.` });
  } else if (theirReds.length) {
    reasons.push({ impact: 1, icon: 'alert', text: `Ab der ${theirReds[0].minute}. Minute in Überzahl.` });
  }

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

  // Chancenverwertung und Zweikämpfe – geben immer Auskunft, auch in engen Spielen
  const myBig = result.stats.onTarget[i];
  const theirAttacks = result.stats.shots[o];
  const theirBig = result.stats.onTarget[o];
  if (reasons.length < 3 && myBig > 0 && !reasons.some(r => r.icon === 'target')) {
    const rate = myGoals / myBig;
    reasons.push({
      impact: rate >= 0.34 ? 1 : -1, icon: 'target',
      text: `Großchancen genutzt: ${myGoals} von ${myBig}.`
    });
  }
  if (reasons.length < 4 && theirAttacks > 0) {
    const stopped = theirAttacks - theirBig;
    const share = stopped / theirAttacks;
    reasons.push({
      impact: share >= 0.55 ? 1 : -1, icon: 'shield',
      text: `Deine Abwehr hat ${stopped} von ${theirAttacks} gegnerischen Angriffen vor dem Abschluss gestoppt.`
    });
  }
  if (edge === 0 && reasons.length < 4) {
    reasons.push({ impact: 0, icon: 'strategy', text: `${myStyle.name} gegen ${theirStyle.name}: Keiner hatte einen taktischen Vorteil.` });
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
  const bigH = opts.big ? mentalEdge(home) * 1.2 : 0;
  const bigA = opts.big ? mentalEdge(away) * 1.2 : 0;
  const possession = clamp(sigmoid(((home.midControl + home.style.midBonus + homeAdv + edge * EDGE_MID + bigH) - (away.midControl + away.style.midBonus - edge * EDGE_MID + bigA)) / 13), 0.3, 0.7);
  const concede = s => (s.key === 'MAUERN' ? 0.85 : s.key === 'PRESSING' ? 1.06 : 1);
  let lamH = BASE_ATTACKS * possession * home.style.chanceMult * concede(away.style);
  let lamA = BASE_ATTACKS * (1 - possession) * away.style.chanceMult * concede(home.style);
  if (edge > 0) { lamH *= EDGE_ATTACK_UP; lamA *= EDGE_ATTACK_DOWN; }
  if (edge < 0) { lamA *= EDGE_ATTACK_UP; lamH *= EDGE_ATTACK_DOWN; }
  const goalsFor = (team, opp, lam, e, adv, big) => {
    const p1 = clamp(sigmoid((team.attackPower - opp.defensePower) / 24 + e * EDGE_BREAK + adv / 12 + big / 24 - 0.15), 0.12, 0.85);
    const avgFinish = team.slots.filter(s => s.group === 'ATT').reduce((s, x) => s + (x.player ? attrOf(x.player, 'sch') : 30), 0) /
      Math.max(1, team.slots.filter(s => s.group === 'ATT').length);
    const p2 = clamp(0.3 * team.style.qualityMult * Math.exp((avgFinish * 0.9 - (opp.keeper?.rating ?? 30)) / 40), 0.06, 0.62);
    return rng.poisson(lam * p1 * p2);
  };
  return goalsFor(home, away, lamH, edge, homeAdv, bigH) - goalsFor(away, home, lamA, -edge, 0, bigA);
}
