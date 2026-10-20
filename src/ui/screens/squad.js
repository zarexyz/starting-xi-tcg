// =============================================================================
// Kader: Aufstellung auf dem Spielfeld & Kaderliste, Spielerdetails
// =============================================================================

import { topbar, segmented, sheet, autoToggle } from '../shell.js';
import { cardHtml, starsHtml, potentialStars } from '../components/card.js';
import { portraitSvg } from '../components/portrait.js';
import { flagSvg } from '../components/flag.js';
import { icon } from '../icons.js';
import { esc, fmt } from '../html.js';
import { FORMATIONS, FORMATION_KEYS, POSITION_GROUP, POSITION_NAMES, TIERS, ATTR_NAMES, CARD_ATTRS, STYLES, MAX_SQUAD } from '../../engine/constants.js';
import { clubPlayers } from '../../engine/world.js';
import { ensureUserSetup } from '../../engine/game.js';
import { buildTeam } from '../../engine/match.js';
import { familiarity, salaryFor, marketValue } from '../../engine/player.js';
import { NATIONS } from '../../engine/names.js';
import { historyChart } from '../flows/develop.js';

const GROUP_ORDER = { GK: 0, DEF: 1, MID: 2, ATT: 3 };
const GROUP_NAMES = { GK: 'Tor', DEF: 'Abwehr', MID: 'Mittelfeld', ATT: 'Angriff' };

export function lineupPitch(game, setup, selected, opts = {}) {
  const formation = FORMATIONS[setup.formation];
  const colors = game.clubs.user.colors;
  return `<div class="pitch ${opts.compact ? 'pitch--compact' : ''}">
    <div class="pitch__lines" aria-hidden="true"><span class="pitch__half"></span><span class="pitch__circle"></span><span class="pitch__box pitch__box--top"></span><span class="pitch__box pitch__box--bottom"></span></div>
    ${formation.slots.map(slot => {
      const p = game.players[setup.lineup[slot.id]];
      const off = p && familiarity(p, slot.pos) < 0.93;
      return `<div class="pitch__slot" style="left:${slot.x}%;top:${slot.y}%">
        ${p ? cardHtml(p, { size: 'xs', colors, action: 'slot-tap', data: ` data-slot="${slot.id}"`, selected: selected === p.id, showCondition: true }) :
          `<button class="pitch__empty" data-action="slot-tap" data-slot="${slot.id}" aria-label="Freie Position ${slot.pos}">${icon('plus')}</button>`}
        <span class="pitch__pos ${off ? 'is-off' : ''}">${slot.pos}${off ? ' !' : ''}</span>
      </div>`;
    }).join('')}
  </div>`;
}

function benchRow(game, setup, selected) {
  const colors = game.clubs.user.colors;
  const bench = setup.bench.map(id => game.players[id]).filter(Boolean);
  return `<div class="bench">
    <div class="bench__label">${icon('bench')}Bank</div>
    <div class="bench__row">
      ${bench.map(p => cardHtml(p, { size: 'xs', colors, action: 'bench-tap', selected: selected === p.id, showCondition: true })).join('')}
      ${bench.length < 7 ? `<button class="bench__empty" data-action="bench-tap" data-id="" aria-label="Freier Bankplatz">${icon('plus')}</button>` : ''}
    </div>
  </div>`;
}

function lineStrength(game, setup) {
  const team = buildTeam(game, 'user', setup);
  const l = team.lines;
  const v = x => Math.round(x);
  return `<div class="lines">
    <div><span>Tor</span><b class="display">${v(l.gk)}</b></div>
    <div><span>Abwehr</span><b class="display">${v(l.def)}</b></div>
    <div><span>Mittelfeld</span><b class="display">${v(l.mid)}</b></div>
    <div><span>Angriff</span><b class="display">${v(l.att)}</b></div>
  </div>`;
}

function lineupView(game, ui) {
  const setup = ensureUserSetup(game);
  const selected = ui.selected;
  const selPlayer = selected ? game.players[selected] : null;
  return `
    <div class="formation-bar">
      <label class="formation-select">
        <span class="sr-only">Formation</span>
        <select data-input="formation">${FORMATION_KEYS.map(k => `<option value="${k}" ${k === setup.formation ? 'selected' : ''}>${k}</option>`).join('')}</select>
        ${icon('chevronDown')}
      </label>
      <span class="chip">${icon('strategy')}${STYLES[setup.style].name}</span>
      <button class="btn btn--sm btn--secondary" data-action="auto-lineup">${icon('auto')}Automatisch</button>
    </div>
    ${lineStrength(game, setup)}
    ${autoToggle(game)}
    ${lineupPitch(game, setup, selected)}
    <p class="hint small">${selPlayer ? `<b>${esc(selPlayer.last)}</b> ausgewählt. Tippe auf eine Position oder einen Bankspieler zum Tauschen.` : 'Tippe auf einen Spieler und dann auf eine Position, um zu tauschen. Langes Tippen öffnet die Details.'}</p>
    ${benchRow(game, setup, selected)}
    ${selPlayer ? `<div class="sel-actions">
      <button class="btn btn--sm btn--secondary" data-action="open-player" data-id="${selPlayer.id}">${icon('info')}Details</button>
      <button class="btn btn--sm btn--ghost" data-action="deselect">Abbrechen</button>
    </div>` : ''}
    ${reserveList(game, setup, selected)}
  `;
}

function reserveList(game, setup, selected) {
  const used = new Set([...Object.values(setup.lineup), ...setup.bench]);
  const rest = clubPlayers(game, 'user').filter(p => !used.has(p.id)).sort((a, b) => GROUP_ORDER[POSITION_GROUP[a.position]] - GROUP_ORDER[POSITION_GROUP[b.position]] || b.ovr - a.ovr);
  if (!rest.length) return '';
  return `<section class="section">
    <div class="section__head"><h2 class="section__title">Nicht im Kader</h2><span class="small muted">${rest.length} Spieler</span></div>
    <ul class="list panel panel--flush">${rest.map(p => playerRow(game, p, { action: 'reserve-tap', selected: selected === p.id })).join('')}</ul>
  </section>`;
}

export function playerRow(game, p, opts = {}) {
  const colors = game.clubs[p.clubId]?.colors || game.clubs.user.colors;
  const cond = p.condition;
  const status = p.injury ? `<span class="chip chip--loss">${icon('medical')}${p.injury.days} Sp.</span>` :
    `<span class="mini-bar ${cond < 65 ? 'is-low' : cond < 80 ? 'is-warn' : ''}" title="Fitness ${cond} %"><span style="width:${cond}%"></span></span>`;
  return `<li><button class="row row--button prow ${opts.selected ? 'is-selected' : ''}" data-action="${opts.action || 'open-player'}" data-id="${p.id}">
    <span class="prow__face tier-${p.tier}" style="--club:${colors.primary}">${portraitSvg(p, { colors })}</span>
    <span class="row__main">
      <span class="row__title">${esc(p.first[0])}. ${esc(p.last)}</span>
      <span class="row__sub">${p.position}${p.secondary.length ? ` (${p.secondary.join(', ')})` : ''}, ${p.age} J.</span>
    </span>
    ${status}
    <span class="prow__ovr tier-${p.tier}">${p.ovr}</span>
  </button></li>`;
}

function listView(game) {
  const squad = clubPlayers(game, 'user');
  const groups = {};
  squad.forEach(p => { (groups[POSITION_GROUP[p.position]] ||= []).push(p); });
  return `
    <p class="small muted">${squad.length} von ${MAX_SQUAD} Kaderplätzen belegt.</p>
    ${Object.keys(GROUP_NAMES).map(g => groups[g]?.length ? `
      <section class="section section--tight">
        <div class="section__head"><h2 class="section__title">${GROUP_NAMES[g]}</h2><span class="small muted">${groups[g].length}</span></div>
        <ul class="list panel panel--flush">${groups[g].sort((a, b) => b.ovr - a.ovr).map(p => playerRow(game, p)).join('')}</ul>
      </section>` : '').join('')}
  `;
}

export function squadScreen(game, ui) {
  const view = ui.view.squad || 'lineup';
  if (!game.clubs.user.playerIds.length) {
    return `<main class="screen">${topbar(game)}<div class="empty"><div class="h3">Noch keine Spieler</div><p>Öffne dein Starter-Pack auf dem Home-Screen.</p></div></main>`;
  }
  return `<main class="screen">
    ${topbar(game)}
    ${segmented([['lineup', 'Aufstellung'], ['list', 'Kaderliste']], view, 'squad-view')}
    <div class="squad-body">${view === 'lineup' ? lineupView(game, ui) : listView(game)}</div>
  </main>`;
}

// -----------------------------------------------------------------------------
// Spielerdetails
// -----------------------------------------------------------------------------

export function playerSheet(game, id) {
  const p = game.players[id];
  if (!p) return '';
  const club = game.clubs[p.clubId];
  const own = p.clubId === 'user';
  const setup = own ? game.user.setup : null;
  const inLineup = setup && Object.values(setup.lineup).includes(p.id);
  const onBench = setup && setup.bench.includes(p.id);
  const attrs = CARD_ATTRS[p.position === 'TW' ? 'gk' : 'field'];
  const avg = p.stats.apps ? (p.stats.ratingSum / p.stats.apps).toFixed(1) : '–';
  const tier = TIERS[p.tier];

  const body = `
    <div class="pdetail">
      <div class="pdetail__card">${cardHtml(p, { size: 'lg', colors: club.colors })}</div>
      <div class="pdetail__status">
        ${p.injury ? `<span class="chip chip--loss">${icon('medical')}${esc(p.injury.label)}, noch ${p.injury.days} Sp.</span>` : ''}
        ${own ? `<span class="chip ${inLineup ? 'chip--pitch' : ''}">${inLineup ? 'Startelf' : onBench ? 'Bank' : 'Nicht im Kader'}</span>` : `<span class="chip">${esc(club.name)}</span>`}
        <span class="chip">${flagSvg(p.nation, 16)}${esc(NATIONS[p.nation]?.name || p.nation)}</span>
      </div>

      <dl class="facts facts--4">
        <div><dt>Fitness</dt><dd class="display ${p.condition < 65 ? 'neg' : ''}">${p.condition} %</dd></div>
        <div><dt>Moral</dt><dd class="display">${p.morale}</dd></div>
        <div><dt>Potenzial</dt><dd>${starsHtml(potentialStars(p))}<small class="muted">${p.potentialGuess[0]}–${p.potentialGuess[1]}</small></dd></div>
        <div><dt>Klasse</dt><dd>${tier.name}</dd></div>
      </dl>

      <section class="section section--tight">
        <h3 class="h3">Werte</h3>
        <ul class="attr-list">
          ${attrs.map(a => `<li><span>${ATTR_NAMES[a]}</span><span class="bar"><span style="width:${p.attrs[a]}%"></span></span><b class="num">${p.attrs[a]}</b></li>`).join('')}
        </ul>
        <p class="small muted">${POSITION_NAMES[p.position]}${p.secondary.length ? `. Kann auch ${p.secondary.map(s => POSITION_NAMES[s]).join(' und ')}.` : '.'}</p>
      </section>
      ${own && (p.ovrHistory || []).length >= 2 ? `<section class="section section--tight"><h3 class="h3">Stärkeverlauf</h3>${historyChart(p)}</section>` : ''}

      <section class="section section--tight">
        <h3 class="h3">Saison ${game.season}</h3>
        <dl class="facts facts--4">
          <div><dt>Spiele</dt><dd class="display">${p.stats.apps}</dd></div>
          <div><dt>Tore</dt><dd class="display">${p.stats.goals}</dd></div>
          <div><dt>Vorlagen</dt><dd class="display">${p.stats.assists}</dd></div>
          <div><dt>Note</dt><dd class="display">${avg}</dd></div>
        </dl>
        ${p.form?.length ? `<p class="small muted">Letzte Noten: ${p.form.map(r => r.toFixed(1)).join(', ')}</p>` : ''}
      </section>

      <section class="section section--tight">
        <dl class="facts facts--2">
          <div><dt>Gehalt pro Spieltag</dt><dd class="display">${fmt(salaryFor(p.ovr))}</dd></div>
          <div><dt>Marktwert</dt><dd class="display">${fmt(marketValue(p))}</dd></div>
        </dl>
      </section>

      ${own ? `<div class="pdetail__actions">
        ${inLineup ? `<button class="btn btn--secondary" data-action="to-bench" data-id="${p.id}">${icon('bench')}Auf die Bank</button>` : `<button class="btn btn--secondary" data-action="pick-for-lineup" data-id="${p.id}" ${p.injury ? 'disabled' : ''}>${icon('pitch')}In die Startelf</button>`}
        <button class="btn btn--secondary" data-action="open-items" data-player="${p.id}">${icon('clipboard')}Gegenstand nutzen</button>
        ${transferButtons(game, p)}
        <button class="btn btn--danger" data-action="release" data-id="${p.id}">${icon('trash')}Entlassen</button>
      </div>` : foreignActions(game, p)}
    </div>`;
  return sheet(`${p.first} ${p.last}`, body);
}

// Platzhalter, werden in Phase 3 (Transfermarkt) befüllt
export let transferButtons = () => '';
export let foreignActions = () => '';
export function setTransferRenderers(own, foreign) {
  transferButtons = own;
  foreignActions = foreign;
}
