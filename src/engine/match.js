// =============================================================================
// Match-Engine (Richtung „C“): Die Entscheidungen fallen vor dem Anpfiff.
// Formation, Spielstil, Aufstellung und Fitness bestimmen die Stärke der
// Mannschaftsteile. Daraus entstehen Angriffe, Schlüsselszenen und Tore.
// =============================================================================

import { FORMATIONS, STYLES, POSITION_GROUP, styleMatchup } from './constants.js';
import { effectiveRating, familiarity, shortName, fitnessFactor, attrOf } from './player.js';
import { clamp, createRng } from './rng.js';
import { weatherMid, spScore } from './extras.js';

/** Formationsbedingte Verschiebung der Mannschaftsteile */
const FORMATION_SHAPE = {
  '4-3-3': { def: 0, mid: -0.5, att: 1.5 },
  '4-4-2': { def: 0.5, mid: 0.5, att: 0 },
  '4-2-3-1': { def: 0.5, mid: 1.5, att: -0.5 },
  '3-5-2': { def: -2, mid: 2, att: 0.5 },
  '5-3-2': { def: 3, mid: -1, att: -1.5 }
};

const BASE_ATTACKS = 20; // Angriffe beider Teams zusammen

/** Minute der Pausenwechsel; Angriffe der ersten Hälfte liegen davor */
export const HALF_SUB_MINUTE = 46;

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
    setPieces: setup.setPieces || {},
    lines: { gk, def, mid, att },
    midControl: mid * 0.7 + def * 0.12 + att * 0.18 + (boosts.mid || 0),
    attackPower: att * 0.65 + mid * 0.35 + (boosts.att || 0),
    defensePower: def * 0.7 + mid * 0.3 + style.defBonus + (boosts.def || 0),
    keeper: slots.find(s => s.group === 'GK'),
    mental: slots.reduce((s, x) => s + (x.player ? attrOf(x.player, 'men') : 30), 0) / 11,
    avgCondition: slots.reduce((s, x) => s + (x.player?.condition ?? 0), 0) / 11,
    spBoost: boosts.sp || 0
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
  // Eigene Zufallsströme je Abschnitt: erste Hälfte, zweite Hälfte, Karten und
  // Verletzungen, Nachbereitung. So bleibt die erste Hälfte exakt gleich, egal
  // was zur Pause entschieden wird (Vorschau und echtes Spiel stimmen überein).
  const seedOf = () => rng.int(1, 2147483646);
  const rA = createRng(seedOf());
  const rB = createRng(seedOf());
  const rC = createRng(seedOf());
  const rD = createRng(seedOf());
  const ht = opts.halftime || null; // { side, style?, mode?: 'allOut'|'hold', subs?: [{ outId, inId }] }

  const homeAdv = opts.neutral ? 0 : 1.6;
  const bigH = opts.big ? mentalEdge(home) * 1.2 : 0;
  const bigA = opts.big ? mentalEdge(away) * 1.2 : 0;
  const styleIn = (team, key, half) => (half === 2 && ht && ht.side === key && STYLES[ht.style]) || team.style;
  const modeIn = (key, half) => (half === 2 && ht && ht.side === key ? ht.mode || null : null);

  /** Kräfteverhältnis einer Halbzeit */
  const halfParams = half => {
    const hs = styleIn(home, 'home', half);
    const as = styleIn(away, 'away', half);
    const edge = styleMatchup(hs.key, as.key); // +1 Heim kontert, -1 Gast kontert
    const midH = home.midControl + hs.midBonus + homeAdv + edge * EDGE_MID + bigH + weatherMid(hs.key, opts.weather);
    const midA = away.midControl + as.midBonus - edge * EDGE_MID + bigA + weatherMid(as.key, opts.weather);
    const possession = clamp(sigmoid((midH - midA) / 13), 0.3, 0.7);
    const concede = s => (s.key === 'MAUERN' ? 0.85 : s.key === 'PRESSING' ? 1.06 : 1);
    let lamH = BASE_ATTACKS * possession * hs.chanceMult * concede(as);
    let lamA = BASE_ATTACKS * (1 - possession) * as.chanceMult * concede(hs);
    if (edge > 0) { lamH *= EDGE_ATTACK_UP; lamA *= EDGE_ATTACK_DOWN; }
    if (edge < 0) { lamA *= EDGE_ATTACK_UP; lamH *= EDGE_ATTACK_DOWN; }
    // Halbzeit-Ansage: alles nach vorn öffnet beide Seiten, Ergebnis halten schließt beide
    const mH = modeIn('home', half);
    const mA = modeIn('away', half);
    const modeMul = (own, other) => (own === 'allOut' ? 1.25 : own === 'hold' ? 0.75 : 1) * (other === 'allOut' ? 1.12 : other === 'hold' ? 0.88 : 1);
    lamH *= modeMul(mH, mA);
    lamA *= modeMul(mA, mH);
    const defAdj = (team, st, m) => (st.defBonus - team.style.defBonus) + (m === 'allOut' ? -3 : m === 'hold' ? 3 : 0);
    return {
      possession,
      home: { edge, style: hs, lam: lamH / 2, def: defAdj(home, hs, mH) },
      away: { edge: -edge, style: as, lam: lamA / 2, def: defAdj(away, as, mA) }
    };
  };
  const P = [null, halfParams(1), halfParams(2)];
  const possession = (P[1].possession + P[2].possession) / 2;
  const edge = P[1].home.edge;

  const sides = [
    { key: 'home', team: home, opp: away, adv: homeAdv, big: bigH },
    { key: 'away', team: away, opp: home, adv: 0, big: bigA }
  ];
  const teamOf = key => (key === 'home' ? home : away);

  // Verletzungen zuerst festlegen, damit spätere Szenen den Einwechselspieler zeigen
  const injuriesAll = [];
  for (const side of sides) {
    for (const sl of side.team.slots) {
      if (!sl.player) continue;
      const p = 0.009 * (1 + (100 - sl.player.condition) / 35) * (sl.player.age > 31 ? 1.3 : 1);
      if (rC.chance(p)) {
        injuriesAll.push({ side: side.key, playerId: sl.player.id, minute: rC.int(5, 88), slotPos: sl.pos });
      }
    }
  }
  injuriesAll.sort((a, b) => a.minute - b.minute);

  // Wechsel zur Pause (nur gültige: Spieler steht noch auf dem Platz, Ersatz sitzt auf der Bank)
  const MAX_SUBS = 5;
  const subs = [];
  const injuries = [];
  const firstHalfOut = new Set(injuriesAll.filter(x => x.minute < HALF_SUB_MINUTE).map(x => x.side + x.playerId));
  const htSubs = [];
  if (ht?.subs?.length) {
    const team = teamOf(ht.side);
    const used = new Set();
    for (const s of ht.subs.slice(0, 3)) {
      const onPitch = team.slots.some(sl => sl.player?.id === s.outId) && !firstHalfOut.has(ht.side + s.outId);
      const benchP = team.bench.find(b => b.id === s.inId && !b.injury && !b.suspension);
      if (!onPitch || !benchP || used.has(s.inId) || used.has(s.outId)) continue;
      used.add(s.inId); used.add(s.outId);
      htSubs.push({ side: ht.side, outId: s.outId, inId: s.inId, minute: HALF_SUB_MINUTE, halftime: true });
    }
  }
  // Ereignisse in zeitlicher Reihenfolge: Verletzungswechsel vor der Pause, Pausenwechsel, Verletzungen danach
  const events = [...injuriesAll.map(x => ({ inj: x, minute: x.minute, order: x.minute < HALF_SUB_MINUTE ? 0 : 2 })),
    ...htSubs.map(x => ({ sub: x, minute: x.minute, order: 1 }))]
    .sort((a, b) => a.minute - b.minute || a.order - b.order);
  for (const ev of events) {
    if (ev.sub) { subs.push(ev.sub); continue; }
    const inj = ev.inj;
    // Wer zur Pause ausgewechselt wurde, verletzt sich danach nicht mehr
    if (subs.some(x => x.side === inj.side && x.outId === inj.playerId && x.minute <= inj.minute)) continue;
    injuries.push(inj);
    const team = teamOf(inj.side);
    const used = new Set(subs.filter(x => x.side === inj.side).flatMap(x => [x.inId, x.outId]));
    if (subs.filter(x => x.side === inj.side).length >= MAX_SUBS) continue;
    const cand = team.bench
      .filter(p => !used.has(p.id) && !p.injury)
      .sort((a, b) => effectiveRating(b, inj.slotPos) - effectiveRating(a, inj.slotPos))[0];
    if (cand) subs.push({ side: inj.side, outId: inj.playerId, inId: cand.id, minute: inj.minute });
  }

  const cards = [];
  const sentOff = (sideKey, id, minute) => cards.some(c => c.side === sideKey && c.playerId === id && c.type !== 'Y' && c.minute < minute);

  /** Aufstellung zu einer bestimmten Minute: Wechsel (auch Ketten), Verletzte ohne Ersatz und Platzverweise fehlen */
  const slotsAt = (team, sideKey, minute) => team.slots.map(sl => {
    if (!sl.player) return sl;
    let p = sl.player;
    let rating = sl.rating;
    for (const s of subs) {
      if (s.side !== sideKey || s.minute >= minute || s.outId !== p.id) continue;
      const np = team.bench.find(b => b.id === s.inId);
      if (!np) { p = null; break; }
      p = np;
      rating = effectiveRating(np, sl.pos);
    }
    if (p && injuries.some(x => x.side === sideKey && x.playerId === p.id && x.minute < minute)) p = null;
    if (!p || sentOff(sideKey, p.id, minute)) return { ...sl, player: null };
    return p === sl.player ? sl : { ...sl, player: p, rating };
  }).filter(sl => sl.player);

  // Gelbe und Rote Karten: Pressing foult mehr, Abwehrspieler eher als Stürmer
  const foulRate = st => (st.key === 'PRESSING' ? 1.3 : st.key === 'MAUERN' ? 1.15 : st.key === 'BALLBESITZ' ? 0.85 : 1);
  const cardEvents = [];
  for (const side of sides) {
    const nYellow = rC.poisson(1.7 * foulRate(side.team.style));
    for (let i = 0; i < nYellow; i++) cardEvents.push({ side: side.key, team: side.team, minute: rC.int(8, 90), kind: 'Y' });
    if (rC.chance(0.07 * foulRate(side.team.style))) cardEvents.push({ side: side.key, team: side.team, minute: rC.int(10, 88), kind: 'R' });
  }
  cardEvents.sort((a, b) => a.minute - b.minute);
  const groupWeight = { DEF: 1.6, MID: 1.25, ATT: 0.7, GK: 0.12 };
  for (const ev of cardEvents) {
    const onPitch = slotsAt(ev.team, ev.side, ev.minute);
    // Zufall immer gleich oft ziehen, damit spätere Karten nicht von Pausenwechseln abhängen
    const roll = rC.float(0, 1);
    const roll2 = rC.float(0, 1);
    if (!onPitch.length) continue;
    const weights = onPitch.map(sl => groupWeight[sl.group] * (1 + Math.max(0, 60 - attrOf(sl.player, 'men')) / 60));
    let acc = roll * weights.reduce((s, w) => s + w, 0);
    let pick = onPitch[onPitch.length - 1];
    for (let i = 0; i < onPitch.length; i++) { acc -= weights[i]; if (acc <= 0) { pick = onPitch[i]; break; } }
    const id = pick.player.id;
    if (ev.kind === 'R') { cards.push({ side: ev.side, playerId: id, minute: ev.minute, type: 'R' }); continue; }
    const hasYellow = cards.some(c => c.side === ev.side && c.playerId === id && c.type === 'Y');
    if (hasYellow) {
      // Zweite Gelbe nur selten: Spieler halten sich meist zurück
      if (roll2 < 0.35) cards.push({ side: ev.side, playerId: id, minute: ev.minute, type: 'YR' });
    } else {
      cards.push({ side: ev.side, playerId: id, minute: ev.minute, type: 'Y' });
    }
  }
  /** Wie viele Spieler fehlen einer Seite zur Minute durch Platzverweis */
  const redsBefore = (sideKey, minute) => cards.filter(c => c.side === sideKey && c.type !== 'Y' && c.minute < minute).length;

  // Angriffe je Halbzeit auf Minuten verteilen (eigener Zufall pro Hälfte)
  const attacks = [];
  for (const [half, r, from, to] of [[1, rA, 2, HALF_SUB_MINUTE - 1], [2, rB, HALF_SUB_MINUTE, 93]]) {
    const used = new Set();
    for (const side of sides) {
      const n = r.poisson(P[half][side.key].lam);
      for (let i = 0; i < n; i++) {
        let minute;
        do { minute = r.int(from, to); } while (used.has(minute) && used.size < to - from + 1);
        used.add(minute);
        attacks.push({ side, minute, half });
      }
    }
  }
  attacks.sort((a, b) => a.minute - b.minute);

  const chances = [];
  const score = { home: 0, away: 0 };
  for (const { side, minute, half } of attacks) {
    const r = half === 1 ? rA : rB;
    const hp = P[half][side.key];
    const op = P[half][side.key === 'home' ? 'away' : 'home'];
    const attSlots = { slots: slotsAt(side.team, side.key, minute) };
    const defSlots = { slots: slotsAt(side.opp, side.key === 'home' ? 'away' : 'home', minute) };
    if (!attSlots.slots.some(s => s.player && s.group !== 'GK') || !defSlots.slots.length) continue;
    // Standardsituationen: Elfmeter, Freistoß, Ecke – hier zählen die Schützen
    const roll = r.float(0, 1);
    const kind = roll < 0.005 ? 'pen' : roll < 0.075 ? 'fk' : roll < 0.19 ? 'corner' : 'play';
    const takerOf = role => {
      const set = side.team.setPieces?.[role];
      const onPitch = attSlots.slots.filter(s => s.player && s.group !== 'GK');
      return onPitch.find(s => s.player.id === set) ||
        onPitch.slice().sort((a, b) => spScore(role, b.player) - spScore(role, a.player))[0] || null;
    };
    let shooter = pickShooter(r, attSlots);
    let setAssister;
    if (kind === 'pen' || kind === 'fk') shooter = takerOf(kind) || shooter;
    if (kind === 'corner') {
      const heads = attSlots.slots.filter(s => s.player && s.group !== 'GK');
      shooter = r.weighted(heads.map(s => ({ value: s, weight: ({ ATT: 2.2, DEF: 1.2, MID: 0.6 }[s.group]) * Math.max(1, attrOf(s.player, 'phy') - 25) })));
      setAssister = takerOf('corner');
      if (setAssister === shooter) setAssister = null;
    }
    const defender = pickDefender(r, defSlots) || defSlots.slots[0];
    const keeper = defSlots.slots.find(sl => sl.group === 'GK') || null;
    const assister = kind === 'corner' ? setAssister : kind === 'pen' || kind === 'fk' ? null : r.chance(0.75) ? pickAssister(r, attSlots, shooter) : null;
    const sp = shooter.player;
    const dp = defender.player;

    // Unterzahl: jeder Platzverweis kostet spürbar
    const oppKey = side.key === 'home' ? 'away' : 'home';
    const manDiff = redsBefore(oppKey, minute) - redsBefore(side.key, minute);
    const manEdge = manDiff * 0.32;

    // Mental bei Rückstand: starke Köpfe bäumen sich auf, schwache verkrampfen
    const behind = score[side.key] < score[oppKey];
    const nerve = behind && minute > 55 ? mentalEdge(side.team) * 0.25 : 0;

    // Phase 1: Durchbruch – Angriffsreihe gegen Abwehr, Duell Angreifer gegen Verteidiger
    const shooterBreak = ((attrOf(sp, 'tem') + attrOf(sp, 'dri')) / 2) * familiarity(sp, shooter.pos);
    const defenderHold = (attrOf(dp, 'abw') * 0.65 + attrOf(dp, 'phy') * 0.35) * familiarity(dp, defender.pos);
    let p1 = clamp(sigmoid(
      (side.team.attackPower - (side.opp.defensePower + op.def)) / 24 +
      (shooterBreak - defenderHold) / 60 +
      hp.edge * EDGE_BREAK + side.adv / 12 + side.big / 24 + nerve + manEdge - 0.15
    ), 0.12, 0.85);

    // Phase 2: Abschluss – Schuss gegen Torwart
    const finish = attrOf(sp, 'sch') * familiarity(sp, shooter.pos) * fitnessFactor(sp.condition);
    const keep = keeper?.rating ?? 30;
    let p2 = clamp(0.3 * hp.style.qualityMult * Math.exp((finish - keep) / 40), 0.06, 0.62);

    const spb = side.team.spBoost || 0;  // Wochenplan „Standards“: keine neue Zufallsziehung
    if (kind === 'corner' && assister) p1 = clamp(p1 + (attrOf(assister.player, 'pas') - 50) / 400 + 0.06 * spb, 0.12, 0.88);
    else if (kind === 'corner') p1 = clamp(p1 + 0.06 * spb, 0.12, 0.88);
    if (kind === 'pen') {
      p1 = 1;
      p2 = clamp(0.74 + (finish - keep) / 180 + (attrOf(sp, 'men') - 55) / 300 + 0.03 * spb, 0.55, 0.95);
    } else if (kind === 'fk') {
      p1 = clamp(p1 * 0.7, 0.1, 0.7);
      p2 = clamp(0.22 * Math.exp((attrOf(sp, 'sch') * 0.6 + attrOf(sp, 'pas') * 0.4 - keep) / 40) * (spb ? 1 + 0.15 * spb : 1), 0.05, 0.5);
    }
    const broke = r.chance(p1);
    const scored = broke && r.chance(p2);
    if (scored) score[side.key]++;
    chances.push({
      side: side.key,
      minute, kind, half,
      shooter, assister, defender, keeper,
      p1, p2, broke, scored,
      xg: p1 * p2,
      att: { label: 'duel.break', value: Math.round(shooterBreak) },
      def: { label: 'duel.hold', value: Math.round(defenderHold) },
      fin: { label: 'duel.finish', value: Math.round(finish) },
      gk: { label: 'duel.keeper', value: Math.round(keep) }
    });
  }
  rng = rD; // Ab hier (Elfmeterschießen, Noten) eigener Strom

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
      kind: c.kind,
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
    weather: opts.weather || 'CLEAR',
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
    styles2: [P[2].home.style.key, P[2].away.style.key],
    halftime: ht,
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
  const order = (slots, team) => slots.filter(s => s.player && s.group !== 'GK')
    .sort((a, b) => (b.player.id === team.setPieces?.pen) - (a.player.id === team.setPieces?.pen) || (attrOf(b.player, 'sch') + attrOf(b.player, 'men') * 0.5) - (attrOf(a.player, 'sch') + attrOf(a.player, 'men') * 0.5));
  const hs = order(homeSlots, home);
  const as = order(awaySlots, away);
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

/** Schlüsselszenen je Halbzeit: alle Tore plus die größten vergebenen Chancen.
 * Pro Hälfte getrennt gewählt, damit die erste Hälfte nicht von der zweiten abhängt. */
function pickKeyScenes(chances) {
  let picked = [];
  for (const half of [1, 2]) {
    const hc = chances.filter(c => (c.half || 1) === half);
    const goals = hc.filter(c => c.scored);
    const misses = hc.filter(c => c.broke && !c.scored).sort((a, b) => b.xg - a.xg);
    const tackles = hc.filter(c => !c.broke).sort((a, b) => b.p1 - a.p1);
    let p = [...goals];
    for (const m of misses) { if (p.length >= 2) break; p.push(m); }
    for (const t of tackles) { if (p.length >= 1) break; p.push(t); }
    picked.push(...p.slice(0, Math.max(1, Math.min(3, goals.length + 1))));
  }
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
    kind: c.kind,
    outcome: c.scored ? 'GOAL' : c.broke ? 'SAVE' : 'TACKLE',
    phases: [
      { label: 'phase.break', att: c.att, def: c.def, chance: pct(c.p1), success: c.broke },
      { label: 'phase.finish', att: c.fin, def: c.gk, chance: pct(c.p2), success: c.scored, skipped: !c.broke }
    ]
  }));
}

// -----------------------------------------------------------------------------
// Ticker
// -----------------------------------------------------------------------------

/** Anzahl der Textvarianten je Ereignis (Texte in der Sprachdatei: tick.<typ>.<nr>) */
const VARIANTS = { goal: 4, goalSolo: 3, save: 4, tackle: 3, injury: 2, sub: 1, yellow: 3, yellowRed: 2, red: 2 };

/** Tickereintrag als Schlüssel plus Platzhalter, damit er in jeder Sprache lesbar bleibt */
function tick(rng, type, vars) {
  // Variante aus dem Inhalt ableiten statt aus dem Zufall: gleiche Szene, gleicher Text
  const key = `${type}|${vars.s || vars.p || vars.i || ''}|${vars.d || vars.o || ''}|${vars.min || 0}`;
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
  void rng;
  return { k: `tick.${type}.${(h >>> 0) % VARIANTS[type]}`, p: vars };
}

function buildTicker(rng, result, home, away, chances) {
  const name = id => {
    const p = [...home.slots, ...away.slots].map(s => s.player).find(x => x?.id === id) ||
      [...home.bench, ...away.bench].find(x => x.id === id);
    return p ? shortName(p) : '?';
  };
  const items = [{ minute: 0, type: 'kickoff', k: 'tick.kickoff', p: { home: home.club.name, away: away.club.name } }];

  const goalChances = chances.filter(c => c.scored);
  const perHalf = (fn, n) => [1, 2].flatMap(h => fn(chances.filter(c => (c.half || 1) === h)).slice(0, n));
  const bigMisses = perHalf(cs => cs.filter(c => c.broke && !c.scored).sort((a, b) => b.xg - a.xg), 2);
  const tackles = perHalf(cs => cs.filter(c => !c.broke).sort((a, b) => b.p1 - a.p1), 1);
  const shown = [...goalChances, ...bigMisses, ...tackles].sort((a, b) => a.minute - b.minute);
  let hg = 0;
  let ag = 0;
  for (const c of shown) {
    const vars = {
      s: shortName(c.shooter.player),
      a: c.assister ? shortName(c.assister.player) : '',
      d: shortName(c.defender.player),
      k: c.keeper?.player ? shortName(c.keeper.player) : '–'
    };
    if (c.scored) {
      if (c.side === 'home') hg++; else ag++;
      items.push({
        minute: c.minute, type: 'goal', side: c.side, score: [hg, ag],
        ...tick(rng, c.assister ? 'goal' : 'goalSolo', vars)
      });
    } else if (c.broke) {
      items.push({ minute: c.minute, type: 'chance', side: c.side, ...tick(rng, 'save', vars) });
    } else {
      items.push({ minute: c.minute, type: 'tackle', side: c.side, ...tick(rng, 'tackle', vars) });
    }
  }
  for (const inj of result.injuries) {
    items.push({ minute: inj.minute, type: 'injury', side: inj.side, ...tick(rng, 'injury', { p: name(inj.playerId) }) });
  }
  for (const sub of result.subs) {
    items.push({ minute: sub.minute, type: 'sub', side: sub.side, ...tick(rng, 'sub', { i: name(sub.inId), o: name(sub.outId) }) });
  }
  for (const c of result.cards || []) {
    const kind = c.type === 'Y' ? 'yellow' : c.type === 'YR' ? 'yellowRed' : 'red';
    items.push({ minute: c.minute, type: c.type === 'Y' ? 'yellow' : 'red', side: c.side, playerId: c.playerId, ...tick(rng, kind, { p: name(c.playerId) }) });
  }
  items.push({ minute: 45, type: 'half', k: 'tick.half' });
  items.sort((a, b) => a.minute - b.minute || (a.type === 'half' ? 1 : b.type === 'half' ? -1 : 0));
  items.push({ minute: 90, type: 'end', k: 'tick.end', p: { score: `${result.hg}:${result.ag}` } });
  if (result.pens) {
    items.push({ minute: 120, type: 'pens', k: 'tick.pens', p: { score: `${result.pens.h}:${result.pens.a}` } });
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
    reasons.push({ impact: 1, icon: 'strategy', k: 'why.styleWin', p: { mineK: `style.${myStyle.key}.name`, theirsK: `style.${theirStyle.key}.name` } });
  } else if (edge < 0) {
    reasons.push({ impact: -1, icon: 'strategy', k: 'why.styleLoss', p: { mineK: `style.${myStyle.key}.name`, theirsK: `style.${theirStyle.key}.name` } });
  }

  const poss = result.possession[i];
  if (poss >= 58) reasons.push({ impact: 1, icon: 'midfield', k: 'why.possWin', p: { poss } });
  else if (poss <= 42) reasons.push({ impact: -1, icon: 'midfield', k: 'why.possLoss', p: { poss } });

  const myGoals = i === 0 ? result.hg : result.ag;
  const myXg = result.stats.xg[i];
  if (myGoals - myXg >= 1.1) reasons.push({ impact: 1, icon: 'target', k: 'why.clinical', p: { goals: myGoals, xg: myXg.toFixed(1) } });
  else if (myXg - myGoals >= 1.1) reasons.push({ impact: -1, icon: 'target', k: 'why.wasteful', p: { goals: myGoals, xg: myXg.toFixed(1) } });

  const cond = result.meta.avgCondition[i];
  if (cond < 82) reasons.push({ impact: -1, icon: 'battery', k: 'why.tired', p: { cond } });
  const theirCond = result.meta.avgCondition[o];
  if (theirCond < 82 && cond - theirCond >= 8) reasons.push({ impact: 1, icon: 'battery', k: 'why.fresher', p: { cond: theirCond } });

  const myReds = (result.cards || []).filter(c => c.side === side && c.type !== 'Y');
  const theirReds = (result.cards || []).filter(c => c.side !== side && c.type !== 'Y');
  if (myReds.length) {
    const p = state.players[myReds[0].playerId];
    reasons.push({ impact: -1, icon: 'alert', k: p ? 'why.downManName' : 'why.downMan', p: { min: myReds[0].minute, name: p ? shortName(p) : '' } });
  } else if (theirReds.length) {
    reasons.push({ impact: 1, icon: 'alert', k: 'why.upMan', p: { min: theirReds[0].minute } });
  }

  const lineup = result.lineups[side];
  const offPos = lineup
    .map(l => ({ l, p: state.players[l.playerId] }))
    .filter(x => x.p && familiarity(x.p, x.l.pos) < 0.93);
  if (offPos.length) {
    const x = offPos[0];
    reasons.push({ impact: -1, icon: 'swap', k: 'why.offPos', p: { name: shortName(x.p), posK: `pos.${x.l.pos}`, ownK: `pos.${x.p.position}` } });
  }

  const lm = result.meta.lines[side];
  const lo = result.meta.lines[side === 'home' ? 'away' : 'home'];
  const diffAtt = lm.att - lo.def;
  if (diffAtt >= 4) reasons.push({ impact: 1, icon: 'attack', k: 'why.attackBetter' });
  if (lo.att - lm.def >= 4) reasons.push({ impact: -1, icon: 'shield', k: 'why.attackWorse' });

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
      k: 'why.bigChances', p: { goals: myGoals, big: myBig }
    });
  }
  if (reasons.length < 4 && theirAttacks > 0) {
    const stopped = theirAttacks - theirBig;
    const share = stopped / theirAttacks;
    reasons.push({
      impact: share >= 0.55 ? 1 : -1, icon: 'shield',
      k: 'why.stopped', p: { stopped, total: theirAttacks }
    });
  }
  if (edge === 0 && reasons.length < 4) {
    reasons.push({ impact: 0, icon: 'strategy', k: 'why.styleEven', p: { mineK: `style.${myStyle.key}.name`, theirsK: `style.${theirStyle.key}.name` } });
  }

  const motm = result.motm && state.players[result.motm];
  if (motm) {
    const mine = lineup.some(l => l.playerId === motm.id) || result.subs.some(s => s.inId === motm.id && s.side === side);
    reasons.push({
      impact: mine ? 1 : -1, icon: 'star',
      k: 'why.motm', p: { name: shortName(motm), rating: result.ratings[motm.id].toFixed(1) }
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
