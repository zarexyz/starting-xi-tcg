// =============================================================================
// Spielvorbereitung: Gegner lesen, Plan wählen, Prognose sehen, anpfeifen
// =============================================================================

import { crestSvg } from '../components/crest.js';
import { cardHtml } from '../components/card.js';
import { icon } from '../icons.js';
import { esc } from '../html.js';
import { formHtml, autoToggle } from '../shell.js';
import { lineupEditor, selectionBar } from '../screens/squad.js';
import { currentDay, dayLabel, userMatch, ensureUserSetup } from '../../engine/game.js';
import { STYLES, STYLE_KEYS, FORMATION_KEYS } from '../../engine/constants.js';
import { buildTeam, predictMatch } from '../../engine/match.js';
import { bestLineup } from '../../engine/ai.js';
import { createRng } from '../../engine/rng.js';
import { clubStrength, clubPlayers, LEAGUE_INFO } from '../../engine/world.js';
import { computeTable } from '../../engine/schedule.js';
import { familiarity } from '../../engine/player.js';

export function expectedOpponentSetup(game, oppId) {
  const opp = game.clubs[oppId];
  const formation = opp.preferredFormation;
  const { lineup, bench } = bestLineup(game, oppId, formation, { minCondition: 70 });
  return { formation, style: opp.preferredStyle, lineup, bench, boosts: {} };
}

function prediction(game, entry, setup) {
  const m = entry.m;
  const isHome = m.home === 'user';
  const oppId = isHome ? m.away : m.home;
  const mine = buildTeam(game, 'user', { ...setup, boosts: game.user.matchBoost || {} });
  const theirs = buildTeam(game, oppId, expectedOpponentSetup(game, oppId));
  const rng = createRng(game.seed + game.dayIndex * 7919);
  const neutral = entry.comp === 'ff' && entry.stage === 'final';
  const r = isHome ? predictMatch(rng, mine, theirs, { neutral }, 160) : predictMatch(rng, theirs, mine, { neutral }, 160);
  return isHome ? r : { win: r.loss, draw: r.draw, loss: r.win };
}

function warnings(game, setup) {
  const list = [];
  for (const [slotId, pid] of Object.entries(setup.lineup)) {
    const p = game.players[pid];
    if (!p) continue;
    if (p.condition < 70) list.push({ icon: 'battery', text: `${p.last} ist müde (${p.condition} %).`, tone: 'warn' });
  }
  const team = buildTeam(game, 'user', setup);
  for (const s of team.slots) {
    if (s.player && familiarity(s.player, s.pos) < 0.93) list.push({ icon: 'swap', text: `${s.player.last} spielt fremd als ${s.pos}.`, tone: 'warn' });
    if (!s.player) list.push({ icon: 'alert', text: `Position ${s.pos} ist nicht besetzt.`, tone: 'loss' });
  }
  const injuredOut = clubPlayers(game, 'user').filter(p => p.injury).length;
  if (injuredOut) list.push({ icon: 'medical', text: `${injuredOut} Spieler fehlen verletzt.`, tone: 'muted' });
  return list;
}

export function prepFlow(game, ui) {
  const day = currentDay(game);
  const entry = userMatch(game, day);
  if (!entry) return '';
  const setup = ensureUserSetup(game);
  const isHome = entry.m.home === 'user';
  const oppId = isHome ? entry.m.away : entry.m.home;
  const opp = game.clubs[oppId];
  const oppStyle = STYLES[opp.preferredStyle];
  const table = computeTable(game, opp.tier);
  const oppRow = table.find(r => r.clubId === oppId);
  const star = clubPlayers(game, oppId).filter(p => !p.injury).sort((a, b) => b.ovr - a.ovr)[0];
  const pred = prediction(game, entry, setup);
  const warn = warnings(game, setup);
  const tactic = game.user.inventory.find(i => i.type === 'TACTIC');
  const fitness = game.user.inventory.filter(i => i.type === 'FITNESS' || i.type === 'REGEN').length;

  const styleTiles = STYLE_KEYS.map(key => {
    const st = STYLES[key];
    return `<button class="style-tile ${setup.style === key ? 'is-active' : ''}" data-action="set-style" data-value="${key}" aria-pressed="${setup.style === key}">
      <b>${st.name}</b>
      <span class="small">${st.desc}</span>
    </button>`;
  }).join('');

  return `<div class="fullscreen"><main class="screen prep">
    <header class="prep__head">
      <button class="icon-btn" data-action="close-flow" aria-label="Zurück">${icon('chevronLeft')}</button>
      <div><div class="h3">Spielvorbereitung</div><div class="small muted">${esc(dayLabel(game, day))}, ${isHome ? 'Heimspiel' : 'Auswärtsspiel'}</div></div>
    </header>

    <section class="scout">
      ${crestSvg(opp, 56)}
      <div class="scout__body">
        <div class="h3">${esc(opp.name)}</div>
        <div class="small muted">${LEAGUE_INFO[opp.tier].short}${oppRow ? `, Platz ${oppRow.pos}` : ''}, Stärke ${clubStrength(game, oppId)}</div>
        ${oppRow ? formHtml(oppRow.form) : ''}
      </div>
    </section>
    <div class="scout__report">
      <div class="scout__line">${icon('strategy')}<span>${opp.coach ? `Trainer <b>${esc(opp.coach.name)}</b> setzt fast immer auf <b>${oppStyle.name}</b>` : `Spielt fast immer <b>${oppStyle.name}</b>`}, meist im <b>${opp.preferredFormation}</b>.</span></div>
      ${star ? `<div class="scout__star">${cardHtml(star, { size: 'sm', colors: opp.colors })}<p class="small"><b>Gefährlichster Spieler:</b> ${esc(star.first)} ${esc(star.last)}, ${star.position}, Stärke ${star.ovr}.</p></div>` : ''}
    </div>

    <section class="section">
      <div class="section__head"><h2 class="section__title">Dein Spielstil</h2></div>
      <div class="style-grid">${styleTiles}</div>
    </section>

    <section class="section">
      <div class="section__head"><h2 class="section__title">Formation</h2></div>
      <div class="segmented">${FORMATION_KEYS.map(k => `<button data-action="set-formation" data-value="${k}" aria-pressed="${setup.formation === k}">${k}</button>`).join('')}</div>
      ${autoToggle(game)}
      <div class="prep__lineup-actions">
        <button class="btn btn--sm btn--secondary" data-action="auto-lineup">${icon('auto')}Automatisch aufstellen</button>
      </div>
      <p class="hint small">Tippe auf einen Spieler und dann auf den, mit dem er tauschen soll.</p>
      ${lineupEditor(game, setup, ui.selected, { compact: true })}
      ${warn.length ? `<ul class="warn-list">${warn.slice(0, 5).map(w => `<li class="warn-${w.tone}">${icon(w.icon)}${esc(w.text)}</li>`).join('')}</ul>` : `<p class="small pos">${icon('check')}Aufstellung ohne Schwachstellen.</p>`}
    </section>

    <section class="section">
      <div class="section__head"><h2 class="section__title">Vor dem Anpfiff</h2></div>
      <div class="prep__items">
        ${game.user.matchBoost ? `<span class="chip chip--pitch">${icon('clipboard')}Taktiktafel aktiv: Mittelfeld +3</span>` :
          tactic ? `<button class="btn btn--sm btn--secondary" data-action="use-tactic" data-id="${tactic.id}">${icon('clipboard')}Taktiktafel einsetzen</button>` : ''}
        ${fitness ? `<button class="btn btn--sm btn--secondary" data-action="open-items">${icon('battery')}Fitness (${fitness})</button>` : ''}
        ${!tactic && !fitness && !game.user.matchBoost ? '<p class="small muted">Keine passenden Gegenstände im Spind.</p>' : ''}
      </div>
    </section>

    <section class="section prognosis">
      <div class="section__head"><h2 class="section__title">Prognose</h2><span class="small muted">mit diesem Plan</span></div>
      <div class="prob">
        <span class="prob__w" style="flex:${pred.win || 1}"><b>${pred.win} %</b>Sieg</span>
        <span class="prob__d" style="flex:${pred.draw || 1}"><b>${pred.draw} %</b>Remis</span>
        <span class="prob__l" style="flex:${pred.loss || 1}"><b>${pred.loss} %</b>Niederl.</span>
      </div>
      <p class="xsmall muted">Die Prognose geht davon aus, dass der Gegner wie meistens spielt. Welcher Stil gegen welchen hilft, findest du selbst heraus: Der Spielbericht verrät es dir.</p>
    </section>

    <div class="prep__cta">
      ${ui.selected ? selectionBar(game, ui.selected) : `<button class="btn btn--primary btn--block" data-action="kickoff">${icon('whistle')}Anpfiff</button>
      <button class="btn btn--ghost btn--block" data-action="kickoff-instant">Direkt zum Ergebnis</button>`}
    </div>
  </main></div>`;
}
