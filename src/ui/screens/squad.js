// =============================================================================
// Kader: Aufstellung auf dem Spielfeld & Kaderliste, Spielerdetails
// =============================================================================

import { topbar, segmented, sheet, autoToggle } from '../shell.js';
import { cardHtml, starsHtml, potentialStars } from '../components/card.js';
import { portraitSvg } from '../components/portrait.js';
import { flagSvg } from '../components/flag.js';
import { crestSvg } from '../components/crest.js';
import { icon } from '../icons.js';
import { esc, fmt } from '../html.js';
import { FORMATIONS, FORMATION_KEYS, POSITION_GROUP, POSITION_NAMES, POS_LABEL, TIERS, ATTR_NAMES, ATTR_HINTS, CARD_ATTRS, STYLES, MAX_SQUAD } from '../../engine/constants.js';
import { clubPlayers } from '../../engine/world.js';
import { ensureUserSetup } from '../../engine/game.js';
import { buildTeam } from '../../engine/match.js';
import { familiarity, salaryFor, marketValue, avgRating, formTrend, formAverage } from '../../engine/player.js';
import { wageOf, ensureContract } from '../../engine/contracts.js';
import { NATIONS } from '../../engine/names.js';
import { historyChart } from '../flows/develop.js';
import { t, tmap } from '../../i18n/index.js';
import { nf1, injuryLabel, banReason } from '../text.js';

const GROUP_ORDER = { GK: 0, DEF: 1, MID: 2, ATT: 3 };
const GROUP_NAMES = tmap('group.');
const GROUP_KEYS = ['GK', 'DEF', 'MID', 'ATT'];

export function lineupPitch(game, setup, selected, opts = {}) {
  const formation = FORMATIONS[setup.formation];
  const colors = game.clubs.user.colors;
  const picking = !!selected && opts.editable !== false;
  return `<div class="pitch ${opts.compact ? 'pitch--compact' : ''} ${picking ? 'is-picking' : ''}">
    <div class="pitch__lines" aria-hidden="true"><span class="pitch__half"></span><span class="pitch__circle"></span><span class="pitch__box pitch__box--top"></span><span class="pitch__box pitch__box--bottom"></span></div>
    ${formation.slots.map(slot => {
      const p = game.players[setup.lineup[slot.id]];
      const off = p && familiarity(p, slot.pos) < 0.93;
      return `<div class="pitch__slot" style="left:${slot.x}%;top:${slot.y}%">
        ${p ? cardHtml(p, { size: 'xs', colors, action: 'slot-tap', data: ` data-slot="${slot.id}"`, selected: selected === p.id, showCondition: true }) :
          `<button class="pitch__empty" data-action="slot-tap" data-slot="${slot.id}" aria-label="${t('sq.freePos', { pos: POS_LABEL[slot.pos] })}">${icon('plus')}</button>`}
        <span class="pitch__pos ${off ? 'is-off' : ''}">${POS_LABEL[slot.pos]}${off ? ' !' : ''}</span>
      </div>`;
    }).join('')}
  </div>`;
}

function stripCard(game, p, action, selected) {
  return `<div class="strip__item">
    ${cardHtml(p, { size: 'xs', colors: game.clubs.user.colors, action, selected: selected === p.id, showCondition: true })}
    <span class="strip__pos">${POS_LABEL[p.position]}</span>
  </div>`;
}

function benchRow(game, setup, selected) {
  const bench = setup.bench.map(id => game.players[id]).filter(Boolean);
  return `<div class="strip ${selected ? 'is-picking' : ''}">
    <div class="strip__label">${icon('bench')}${t('sq.bench')} <span class="muted">${bench.length}/7</span></div>
    <div class="strip__row">
      ${bench.map(p => stripCard(game, p, 'bench-tap', selected)).join('')}
      ${bench.length < 7 ? `<div class="strip__item"><button class="bench__empty" data-action="bench-tap" data-id="" aria-label="${t('sq.freeBench')}">${icon('plus')}</button></div>` : ''}
    </div>
  </div>`;
}

function reserveRow(game, setup, selected) {
  const used = new Set([...Object.values(setup.lineup), ...setup.bench]);
  const rest = clubPlayers(game, 'user').filter(p => !used.has(p.id))
    .sort((a, b) => !!(a.injury || a.suspension) - !!(b.injury || b.suspension) || GROUP_ORDER[POSITION_GROUP[a.position]] - GROUP_ORDER[POSITION_GROUP[b.position]] || b.ovr - a.ovr);
  if (!rest.length) return '';
  return `<div class="strip strip--reserve ${selected ? 'is-picking' : ''}">
    <div class="strip__label">${icon('user')}${t('sq.out')} <span class="muted">${rest.length}</span></div>
    <div class="strip__row">${rest.map(p => p.injury || p.suspension
      ? `<div class="strip__item is-out">${cardHtml(p, { size: 'xs', colors: game.clubs.user.colors, showCondition: true })}<span class="strip__pos">${p.injury ? t('sq.injuredShort') : t('sq.bannedShort')}</span></div>`
      : stripCard(game, p, 'reserve-tap', selected)).join('')}</div>
  </div>`;
}

/** Leiste, solange ein Spieler ausgewählt ist: wer, wo, was jetzt */
export function selectionBar(game, selected) {
  const p = game.players[selected];
  if (!p) return '';
  const setup = ensureUserSetup(game);
  const slotKey = Object.keys(setup.lineup).find(k => setup.lineup[k] === p.id);
  const where = slotKey ? t('sq.plays', { pos: POS_LABEL[FORMATIONS[setup.formation].slots.find(s => s.id === slotKey).pos] }) : setup.bench.includes(p.id) ? t('sq.onBench') : t('sq.notInSquad');
  return `<div class="sel-bar" role="status">
    <span class="sel-bar__face">${portraitSvg(p, { colors: game.clubs.user.colors })}</span>
    <div class="sel-bar__text">
      <b>${esc(p.last)}</b> <span class="muted">${POS_LABEL[p.position]}, ${p.ovr}, ${where}, ${t('w.fitness')} ${p.condition} %</span>
      <span class="sel-bar__hint">${t('sq.swapHint')}</span>
    </div>
    <button class="icon-btn" data-action="open-player" data-id="${p.id}" aria-label="${t('w.details')}">${icon('info')}</button>
    <button class="icon-btn" data-action="deselect" aria-label="${t('w.cancel')}">${icon('close')}</button>
  </div>`;
}

/** Aufstellungs-Editor: Feld, Bank und Reserve auf einen Blick, gleiche Bedienung überall */
export function lineupEditor(game, setup, selected, opts = {}) {
  return `<div class="lineup-editor">
    ${lineupPitch(game, setup, selected, opts)}
    ${benchRow(game, setup, selected)}
    ${reserveRow(game, setup, selected)}
  </div>`;
}

function lineStrength(game, setup) {
  const team = buildTeam(game, 'user', setup);
  const l = team.lines;
  const v = x => Math.round(x);
  return `<div class="lines">
    <div><span>${t('group.GK')}</span><b class="display">${v(l.gk)}</b></div>
    <div><span>${t('group.DEF')}</span><b class="display">${v(l.def)}</b></div>
    <div><span>${t('group.MID')}</span><b class="display">${v(l.mid)}</b></div>
    <div><span>${t('group.ATT')}</span><b class="display">${v(l.att)}</b></div>
  </div>`;
}

function lineupView(game, ui) {
  const setup = ensureUserSetup(game);
  const selected = ui.selected;
  return `
    <div class="formation-bar">
      <label class="formation-select">
        <span class="sr-only">${t('w.formation')}</span>
        <select data-input="formation">${FORMATION_KEYS.map(k => `<option value="${k}" ${k === setup.formation ? 'selected' : ''}>${k}</option>`).join('')}</select>
        ${icon('chevronDown')}
      </label>
      <span class="chip">${icon('strategy')}${STYLES[setup.style].name}</span>
      <button class="btn btn--sm btn--secondary" data-action="auto-lineup">${icon('auto')}${t('sq.auto')}</button>
    </div>
    ${lineStrength(game, setup)}
    ${autoToggle(game)}
    <p class="hint small">${t('sq.hint')}</p>
    ${lineupEditor(game, setup, selected)}
    ${selected ? selectionBar(game, selected) : ''}
  `;
}

/** Durchschnittsnote der Saison und Formpfeil, kurz für Listen */
function noteText(p) {
  const avg = avgRating(p.stats);
  if (avg == null) return '';
  const trend = formTrend(p);
  return `, ${t('w.avg')} ${nf1(avg)}${trend === 'up' ? ' ↑' : trend === 'down' ? ' ↓' : ''}`;
}

/** Kleine Hinweise in der Kaderliste: Vertrag läuft aus, will mehr Gehalt, steht auf der Transferliste */
function contractMarks(game, p) {
  if (p.clubId !== 'user') return '';
  const marks = [];
  if (p.contract && p.contract.until <= game.season) marks.push(`<span class="pmark pmark--loss" title="${t('ct.expires')}">${t('ct.markEnd')}</span>`);
  if (p.wantsRaise) marks.push(`<span class="pmark pmark--warn" title="${t('ct.markRaiseT')}">${t('ct.markRaise')}</span>`);
  if (game.user.listings?.[p.id]) marks.push(`<span class="pmark" title="${t('ct.markListT')}">${t('ct.markList')}</span>`);
  return marks.length ? ` ${marks.join('')}` : '';
}

export function playerRow(game, p, opts = {}) {
  const colors = game.clubs[p.clubId]?.colors || game.clubs.user.colors;
  const cond = p.condition;
  const status = p.injury ? `<span class="chip chip--loss">${icon('medical')}${t('w.gamesShort', { n: p.injury.days })}</span>` :
    p.suspension ? `<span class="chip chip--loss"><i class="redcard"></i>${t('w.gamesShort', { n: p.suspension.games })}</span>` :
    `<span class="mini-bar ${cond < 65 ? 'is-low' : cond < 80 ? 'is-warn' : ''}" title="${t('w.fitness')} ${cond} %"><span style="width:${cond}%"></span></span>`;
  return `<li><button class="row row--button prow ${opts.selected ? 'is-selected' : ''}" data-action="${opts.action || 'open-player'}" data-id="${p.id}">
    <span class="prow__face tier-${p.tier}" style="--club:${colors.primary}">${portraitSvg(p, { colors })}</span>
    <span class="row__main">
      <span class="row__title">${esc(p.first[0])}. ${esc(p.last)}${contractMarks(game, p)}</span>
      <span class="row__sub">${opts.extra ? esc(opts.extra) : `${POS_LABEL[p.position]}${p.secondary.length ? ` (${p.secondary.map(s => POS_LABEL[s]).join(', ')})` : ''}, ${t('w.ageShort', { age: p.age })}${noteText(p)}`}</span>
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
    <p class="small muted">${t('sq.slots', { n: squad.length, max: MAX_SQUAD })}</p>
    ${GROUP_KEYS.map(g => groups[g]?.length ? `
      <section class="section section--tight">
        <div class="section__head"><h2 class="section__title">${GROUP_NAMES[g]}</h2><span class="small muted">${groups[g].length}</span></div>
        <ul class="list panel panel--flush">${groups[g].sort((a, b) => b.ovr - a.ovr).map(p => playerRow(game, p)).join('')}</ul>
      </section>` : '').join('')}
  `;
}

export function squadScreen(game, ui) {
  const view = ui.view.squad || 'lineup';
  if (!game.clubs.user.playerIds.length) {
    return `<main class="screen">${topbar(game)}<div class="empty"><div class="h3">${t('sq.none')}</div><p>${t('sq.noneHint')}</p></div></main>`;
  }
  return `<main class="screen">
    ${topbar(game)}
    ${segmented([['lineup', t('sq.lineup')], ['list', t('sq.list')]], view, 'squad-view')}
    <div class="squad-body">${view === 'lineup' ? lineupView(game, ui) : listView(game)}</div>
  </main>`;
}

// -----------------------------------------------------------------------------
// Spielerdetails
// -----------------------------------------------------------------------------

export function playerSheet(game, id, opts = {}) {
  const p = game.players[id];
  if (!p) return '';
  const club = game.clubs[p.clubId];
  const own = p.clubId === 'user';
  const setup = own ? game.user.setup : null;
  const inLineup = setup && Object.values(setup.lineup).includes(p.id);
  const onBench = setup && setup.bench.includes(p.id);
  const attrs = CARD_ATTRS[p.position === 'TW' ? 'gk' : 'field'];
  const nf = x => (x == null ? '–' : nf1(x));
  const avg = nf(avgRating(p.stats));
  const careerAvg = nf(avgRating(p.careerStats));
  const fAvg = formAverage(p);
  const trend = formTrend(p);
  const formLabel = fAvg == null ? t('ps.formNone') : trend === 'up' ? t('ps.formUp') : trend === 'down' ? t('ps.formDown') : t('ps.formNormal');
  const tier = TIERS[p.tier];

  const body = `
    <div class="pdetail">
      <div class="pdetail__card">${cardHtml(p, { size: 'lg', colors: club.colors })}</div>
      <div class="pdetail__status">
        ${p.injury ? `<span class="chip chip--loss">${icon('medical')}${t('ps.injured', { label: esc(injuryLabel(p.injury)), n: p.injury.days })}</span>` : ''}
        ${p.suspension ? `<span class="chip chip--loss"><i class="redcard"></i>${t('ps.banned', { reason: esc(banReason(p.suspension)), n: p.suspension.games })}</span>` : ''}
        ${!p.suspension && p.yellowCount >= 3 ? `<span class="chip chip--warn"><i class="yellowcard"></i>${t('ps.yellows', { n: p.yellowCount })}</span>` : ''}
        ${own ? `<span class="chip ${inLineup ? 'chip--pitch' : ''}">${inLineup ? t('ps.starting') : onBench ? t('sq.bench') : t('sq.out')}</span>` : `<button class="chip chip--link" data-action="open-club" data-id="${club.id}">${crestSvg(club, 16)}${esc(club.name)}</button>`}
        <span class="chip">${flagSvg(p.nation, 16)}${esc(NATIONS[p.nation]?.name || p.nation)}</span>
      </div>

      <dl class="facts facts--4">
        <div><dt>${t('w.fitness')}</dt><dd class="display ${p.condition < 65 ? 'neg' : ''}">${p.condition} %</dd></div>
        <div><dt>${t('w.morale')}</dt><dd class="display">${p.morale}</dd></div>
        <div><dt>${t('w.potential')}</dt><dd>${starsHtml(potentialStars(p))}<small class="muted">${p.potentialGuess[0]}–${p.potentialGuess[1]}</small></dd></div>
        <div><dt>${t('w.class')}</dt><dd>${tier.name}</dd></div>
      </dl>

      <section class="section section--tight">
        <h3 class="h3">${t('ps.attrs')}</h3>
        <ul class="attr-list">
          ${attrs.map(a => `<li title="${esc(ATTR_HINTS[a])}"><span>${ATTR_NAMES[a]}</span><span class="bar"><span style="width:${p.attrs[a]}%"></span></span><b class="num">${p.attrs[a]}${p.tempBoost?.attr === a ? `<small class="pos"> +${p.tempBoost.amount}</small>` : ''}</b></li>`).join('')}
        </ul>
        ${p.tempBoost ? `<p class="small pos">${icon('up')}${t('ps.boost', { attr: ATTR_NAMES[p.tempBoost.attr], n: p.tempBoost.amount })}</p>` : ''}
        <p class="small muted">${POSITION_NAMES[p.position]}${p.secondary.length ? `. ${t('ps.canAlso', { list: p.secondary.map(s => POSITION_NAMES[s]).join(` ${t('w.and')} `) })}.` : '.'}</p>
      </section>
      ${own && (p.ovrHistory || []).length >= 2 ? `<section class="section section--tight"><h3 class="h3">${t('ps.history')}</h3>${historyChart(p)}</section>` : ''}

      <section class="section section--tight">
        <h3 class="h3">${t('w.seasonN', { n: game.season })}</h3>
        <dl class="facts facts--4">
          <div><dt>${t('lg.games')}</dt><dd class="display">${p.stats.apps}</dd></div>
          <div><dt>${t('st.goals')}</dt><dd class="display">${p.stats.goals}</dd></div>
          <div><dt>${t('st.assists')}</dt><dd class="display">${p.stats.assists}</dd></div>
          <div><dt>${t('st.rating')}</dt><dd class="display">${avg}</dd></div>
        </dl>
        <div class="form-line">
          <span class="form-line__label ${trend === 'up' ? 'pos' : trend === 'down' ? 'neg' : 'muted'}">${trend === 'up' ? icon('up') : trend === 'down' ? icon('down') : ''}${formLabel}</span>
          ${p.form?.length ? `<span class="form-line__notes">${p.form.map(r => `<span class="note ${r >= 7 ? 'is-good' : r < 6 ? 'is-bad' : ''}">${nf(r)}</span>`).join('')}</span>` : ''}
        </div>
      </section>

      <section class="section section--tight">
        <h3 class="h3">${t('ps.career')}</h3>
        <dl class="facts facts--4">
          <div><dt>${t('lg.games')}</dt><dd class="display">${p.careerStats.apps}</dd></div>
          <div><dt>${t('st.goals')}</dt><dd class="display">${p.careerStats.goals}</dd></div>
          <div><dt>${t('st.assists')}</dt><dd class="display">${p.careerStats.assists}</dd></div>
          <div><dt>${t('st.rating')}</dt><dd class="display">${careerAvg}</dd></div>
        </dl>
        ${p.position === 'TW' ? `<p class="small muted">${t('ps.clean', { n: p.careerStats.cleanSheets || 0, season: p.stats.cleanSheets || 0 })}</p>` : ''}
        ${(p.awards || []).length ? `<div class="award-chips">${[...p.awards].reverse().map(a => `<span class="chip chip--warn">${icon(a.k === 'xi' ? 'star' : 'trophy')}${t(`aw.${a.k}`)} S${a.s}</span>`).join('')}</div>` : ''}
        ${(p.career || []).length ? `<ul class="list panel panel--flush stations">${[...p.career].reverse().map(c => `<li class="row station">
          <span class="season-badge display">S${c.s}</span>
          <div class="row__main">
            ${game.clubs[c.c] ? `<button class="link-club" data-action="open-club" data-id="${c.c}">${crestSvg(game.clubs[c.c], 18)}<span>${esc(c.n)}</span></button>` : `<span>${esc(c.n)}</span>`}
            <div class="row__sub">${t('w.gamesN', { n: c.apps })}, ${t('w.goalsN', { n: c.goals })}, ${t('w.assistsN', { n: c.assists })}${c.apps ? `, ${t('w.avg')} ${nf1(c.rs / c.apps)}` : ''}</div>
          </div>
        </li>`).join('')}</ul>` : ''}
      </section>

      <section class="section section--tight">
        <h3 class="h3">${t('ct.title')}</h3>
        <dl class="facts facts--3">
          <div><dt>${t('ps.wage')}</dt><dd class="display">${fmt(wageOf(p))}</dd></div>
          <div><dt>${t('ct.until')}</dt><dd class="display">S${ensureContract(game, p).until}</dd></div>
          <div><dt>${t('ps.value')}</dt><dd class="display">${fmt(marketValue(p))}</dd></div>
        </dl>
        ${own && p.wantsRaise ? `<p class="small warn-text">${icon('alert')}${t('ct.wantsRaise', { n: fmt(salaryFor(p.ovr)) })}</p>` : ''}
        ${own && ensureContract(game, p).until <= game.season ? `<p class="small neg">${icon('alert')}${t('ct.expires')}</p>` : ''}
        ${own && game.user.listings?.[p.id] ? `<p class="small">${icon('coins')}${t('ct.listed', { n: fmt(game.user.listings[p.id].price) })}</p>` : ''}
        ${own ? `<button class="btn btn--secondary btn--block" data-action="open-contract" data-id="${p.id}">${icon('clipboard')}${t('ct.extend')}</button>` : ''}
      </section>

      ${own ? `<div class="pdetail__actions">
        ${inLineup ? `<button class="btn btn--secondary" data-action="to-bench" data-id="${p.id}">${icon('bench')}${t('ps.toBench')}</button>` : `<button class="btn btn--secondary" data-action="pick-for-lineup" data-id="${p.id}" ${p.injury || p.suspension ? 'disabled' : ''}>${icon('pitch')}${t('ps.toXI')}</button>`}
        <button class="btn btn--secondary" data-action="open-items" data-player="${p.id}">${icon('clipboard')}${t('ps.useItem')}</button>
        ${transferButtons(game, p)}
        <button class="btn btn--danger" data-action="release" data-id="${p.id}">${icon('trash')}${t('ps.release')}</button>
      </div>` : foreignActions(game, p)}
    </div>`;
  return sheet(`${p.first} ${p.last}`, body, opts);
}

// Platzhalter, werden in Phase 3 (Transfermarkt) befüllt
export let transferButtons = () => '';
export let foreignActions = () => '';
export function setTransferRenderers(own, foreign) {
  transferButtons = own;
  foreignActions = foreign;
}
