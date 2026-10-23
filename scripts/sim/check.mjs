// =============================================================================
// Balancing-Check mit Zielwerten. Aufruf: npm run check  (oder node scripts/sim/check.mjs [schnell])
// „schnell“ = kleinere Stichproben mit weiteren Toleranzen (für zwischendurch).
// Jede Zeile zeigt Messwert, Zielbereich und OK/FAIL. Exit-Code 1, wenn etwas außerhalb liegt.
// Nach jeder Änderung an Match-Engine, Stilen, Wetter, Standards, Zufriedenheit,
// Akademie oder Wirtschaft laufen lassen und Abweichungen begründen oder beheben.
// =============================================================================

import { autoResolveTasks } from '../../src/engine/tasks.js';
import { createGame, openStarterPack, pickDraft, playDay } from '../../src/engine/game.js';
import { buildTeam, simulateMatch } from '../../src/engine/match.js';
import { bestLineup, aiSetup } from '../../src/engine/ai.js';
import { createRng } from '../../src/engine/rng.js';
import { STYLE_KEYS, styleMatchup } from '../../src/engine/constants.js';
import { clubStrength } from '../../src/engine/world.js';
import { academyCap, prospects } from '../../src/engine/clublife.js';

const fast = process.argv[2] === 'schnell';
const N = fast ? 0.3 : 1;
const rows = [];
let failed = false;
function check(name, value, lo, hi, digits = 2) {
  const ok = value >= lo && value <= hi;
  if (!ok) failed = true;
  rows.push(`${ok ? 'OK  ' : 'FAIL'} ${name.padEnd(46)} ${value.toFixed(digits).padStart(7)}   Ziel ${lo} bis ${hi}`);
}

const g = createGame({ seed: 11, clubName: 'Sim FC', primary: '#000', secondary: '#fff' });
const clubId = g.leagues[1].clubIds[0];
const f = '4-3-3';
const { lineup, bench } = bestLineup(g, clubId, f, { minCondition: 0 });
const team = (style, extra = {}) => buildTeam(g, clubId, { formation: f, style, lineup, bench, boosts: {}, ...extra });

// 1) Tore und Standards bei gleich starken Teams --------------------------------
{
  const rng = createRng(5);
  const n = Math.round(3000 * N);
  let goals = 0, pen = 0, fk = 0, corner = 0, draws = 0;
  for (let i = 0; i < n; i++) {
    const r = simulateMatch(rng, team('AUSGEWOGEN'), team('AUSGEWOGEN'), { neutral: true });
    goals += r.hg + r.ag;
    if (r.hg === r.ag) draws++;
    for (const x of r.goals) { if (x.kind === 'pen') pen++; if (x.kind === 'fk') fk++; if (x.kind === 'corner') corner++; }
  }
  check('Tore pro Spiel (gleich stark)', goals / n, 2.3, 2.9);
  check('Remis-Anteil (gleich stark)', draws / n, 0.2, 0.32);
  check('Elfmetertore pro Spiel', pen / n, 0.04, 0.14);
  check('Freistoßtore pro Spiel', fk / n, 0.05, 0.16);
  check('Eckentore pro Spiel', corner / n, 0.15, 0.4);
}

// 1b) Wochenplan „Standards“: Standardtore mit und ohne Bonus -----------------------
{
  const n = Math.round(4000 * N);
  const count = boosts => {
    const rng = createRng(21);  // gleicher Zufall: nur der Bonus unterscheidet
    let sp = 0;
    for (let i = 0; i < n; i++) {
      const r = simulateMatch(rng, team('AUSGEWOGEN', { boosts }), team('AUSGEWOGEN'), { neutral: true });
      for (const x of r.goals) if (x.side === 'home' && x.kind !== 'play') sp++;
    }
    return sp;
  };
  check('Standardtore mit Plan / ohne Plan (Faktor)', count({ sp: 1 }) / count({}), fast ? 1.05 : 1.1, fast ? 1.45 : 1.35);
}

// 2) Spielstile: Kreis und Gesamtbilanz ----------------------------------------
{
  const rng = createRng(3);
  const n = Math.round(500 * N);
  const avg = {};
  let wrongDir = 0, pairs = 0;
  for (const a of STYLE_KEYS) {
    avg[a] = 0;
    for (const b of STYLE_KEYS) {
      let wl = 0;
      for (let i = 0; i < n; i++) {
        const r = simulateMatch(rng, team(a), team(b), { neutral: true });
        wl += r.hg > r.ag ? 1 : r.hg < r.ag ? -1 : 0;
      }
      wl /= n;
      avg[a] += wl / STYLE_KEYS.length;
      const m = styleMatchup(a, b);
      if (m !== 0 && a < b) { pairs++; if (Math.sign(wl) !== m && Math.abs(wl) > 0.05) wrongDir++; }
    }
  }
  for (const k of STYLE_KEYS) check(`Stil-Bilanz ${k} (Siege minus Niederlagen)`, avg[k], fast ? -0.2 : -0.12, fast ? 0.2 : 0.12);
  check('Stil-Duelle mit falscher Richtung (Anteil)', wrongDir / pairs, 0, 0.25);
}

// 3) Halbzeit-Ansage ------------------------------------------------------------
{
  const rng = createRng(77);
  const n = Math.round(800 * N);
  let open = 0, hold = 0, none = 0;
  for (let i = 0; i < n; i++) {
    const cnt = r => r.goals.filter(x => x.minute >= 46).length;
    open += cnt(simulateMatch(rng, team('AUSGEWOGEN'), team('AUSGEWOGEN'), { neutral: true, halftime: { side: 'home', mode: 'allOut' } }));
    hold += cnt(simulateMatch(rng, team('AUSGEWOGEN'), team('AUSGEWOGEN'), { neutral: true, halftime: { side: 'home', mode: 'hold' } }));
    none += cnt(simulateMatch(rng, team('AUSGEWOGEN'), team('AUSGEWOGEN'), { neutral: true }));
  }
  check('2. Hälfte: Tore „alles nach vorn“ / normal', open / none, 1.1, 1.45);
  check('2. Hälfte: Tore „Ergebnis halten“ / normal', hold / none, 0.6, 0.92);
}

// 4) Heimvorteil und Stärkeabstand (KI gegen KI) --------------------------------
{
  const rng = createRng(42);
  const ids = Object.keys(g.clubs).filter(id => id !== 'user');
  let n = 0, hw = 0, fav = 0, favN = 0;
  for (let i = 0; i < 4000 * N; i++) {
    const a = rng.pick(ids), b = rng.pick(ids);
    if (a === b || Math.abs(g.clubs[a].tier - g.clubs[b].tier) > 1) continue;
    const r = simulateMatch(rng, buildTeam(g, a, aiSetup(rng, g, a)), buildTeam(g, b, aiSetup(rng, g, b)), {});
    n++; if (r.hg > r.ag) hw++;
    const gap = clubStrength(g, a) - clubStrength(g, b);
    if (Math.abs(gap) >= 6) { favN++; if ((gap > 0 && r.hg > r.ag) || (gap < 0 && r.ag > r.hg)) fav++; }
  }
  check('Heimsiege (KI gegen KI)', hw / n, 0.38, 0.5);
  check('Favorit gewinnt (Abstand ≥ 6)', fav / favN, 0.5, 0.8);
}

// 5) Mehrere Saisons Karriere ---------------------------------------------------
{
  const seasons = fast ? 2 : 5;
  const out = { moodOut: 0, acadOver: 0, goalsMet: 0, goalsAll: 0, debtDays: 0, days: 0, seasonsDone: 0 };
  for (const seed of fast ? [5] : [5, 17]) {
    const s = createGame({ seed, clubName: 'Sim FC', primary: '#000', secondary: '#fff' });
    openStarterPack(s); pickDraft(s, 0);
    let guard = 0;
    while (s.season <= seasons && guard++ < 400) {
      s.pending = null;
      s.seasonSummary = null;
      const before = s.season;
      autoResolveTasks(s);
      playDay(s);
      out.days++;
      const m = s.user.mood;
      if (m) for (const k of ['fans', 'board', 'chem']) if (m[k] < 0 || m[k] > 100) out.moodOut++;
      if (s.clubs.user.coins < 0) out.debtDays++;
      if (s.user.academy && prospects(s).length > academyCap(s.user.academy.level || 1)) out.acadOver++;
      if (s.season !== before) {
        out.seasonsDone++;
        const h = s.history[0];
        if (h?.goal) { out.goalsAll++; if (h.goal.met) out.goalsMet++; }
      }
    }
  }
  check('Karriere: gespielte Saisons', out.seasonsDone, fast ? 2 : 10, 99, 0);
  check('Karriere: Stimmungswerte außerhalb 0–100', out.moodOut, 0, 0, 0);
  check('Karriere: Akademie über Kapazität', out.acadOver, 0, 0, 0);
  check('Karriere: Tage mit Minus-Kontostand (Anteil)', out.debtDays / Math.max(1, out.days), 0, 0.1);
  if (out.goalsAll && !fast) check('Karriere: Saisonziel erreicht (Anteil, passiv)', out.goalsMet / out.goalsAll, 0.2, 0.9);
}

console.log(rows.join('\n'));
console.log(failed ? '\nMindestens ein Wert liegt außerhalb des Ziels.' : '\nAlle Werte im Ziel.');
process.exit(failed ? 1 : 0);
