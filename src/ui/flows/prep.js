// =============================================================================
// Spielvorbereitung: Gegner lesen, Plan wählen, Prognose sehen, anpfeifen
// =============================================================================

import { blockingTasks, openTasks } from '../../engine/tasks.js';
import { crestSvg } from '../components/crest.js';
import { cardHtml } from '../components/card.js';
import { icon } from '../icons.js';
import { esc } from '../html.js';
import { formHtml, autoToggle } from '../shell.js';
import { lineupEditor, selectionBar } from '../screens/squad.js';
import { currentDay, dayLabel, userMatch, ensureUserSetup } from '../../engine/game.js';
import { STYLES, STYLE_KEYS, FORMATION_KEYS } from '../../engine/constants.js';
import { buildTeam } from '../../engine/match.js';
import { forecastMatch, expectedOpponentSetup } from '../../engine/forecast.js';
import { clubStrength, clubPlayers, LEAGUE_INFO, rivalry } from '../../engine/world.js';
import { computeTable } from '../../engine/schedule.js';
import { familiarity } from '../../engine/player.js';
import { t } from '../../i18n/index.js';
import { POS_LABEL } from '../../engine/constants.js';
import { banReason } from '../text.js';
import { itemCard } from './pack.js';
import { ATTR_NAMES } from '../../engine/constants.js';
import { weatherFor, SP_ROLES, spCandidates, coachSuggestion } from '../../engine/extras.js';
import { fmt } from '../html.js';
import { CONSUMABLES } from '../../engine/packs.js';

/** Verbrauchskarten vor dem Anpfiff: aktive Effekte und einsetzbare Karten */
function consumablesSection(game) {
  const inv = game.user.inventory;
  const groups = {};
  inv.forEach(i => { (groups[i.type + (i.attr ? ':' + i.attr : '')] ||= []).push(i); });
  const active = [];
  if (game.user.matchBoost) active.push(`<li>${icon('clipboard')}${t('prep.tacticOn')}</li>`);
  for (const p of clubPlayers(game, 'user').filter(x => x.tempBoost)) {
    active.push(`<li>${icon('up')}${t('prep.boostOn', { name: esc(p.last), attr: ATTR_NAMES[p.tempBoost.attr], n: p.tempBoost.amount })}</li>`);
  }
  return `<section class="section">
    <div class="section__head"><h2 class="section__title">${t('prep.items')}</h2><span class="small muted">${t('prep.itemsCount', { n: inv.length })}</span></div>
    ${active.length ? `<ul class="active-effects">${active.join('')}</ul>` : ''}
    ${inv.length ? `<div class="items-grid items-grid--prep">${Object.values(groups).map(list => itemCard(list[0], 0, { action: 'use-item', id: list[0].id, count: list.length })).join('')}</div>
      <p class="xsmall muted">${t('prep.itemsHint')}</p>`
      : `<p class="small muted">${t('prep.noItemsNew')}</p>`}
  </section>`;
}

/** Zeile im Reiter Gegner: Stand der Pressekonferenz (die Entscheidung selbst liegt im Postfach) */
function interviewLine(game) {
  const iv = game.user.interview;
  if (iv) return `<div class="scout__line">${icon('megaphone')}<span>${t('prep.ivDone', { answer: `<b>${esc(t('iv.' + iv.key))}</b>` })}</span></div>`;
  const task = openTasks(game).find(n => n.task.kind === 'interview');
  if (!task) return '';
  return `<div class="scout__line">${icon('megaphone')}<span>${t('prep.ivOpen')}</span><button class="btn btn--sm btn--secondary" data-action="open-news" data-id="${task.id}">${t('prep.ivBtn')}</button></div>`;
}

function setPieceBody(game, setup) {
  const rows = SP_ROLES.map(role => {
    const cur = setup.setPieces?.[role] || null;
    const chips = [`<button class="chip chip--btn ${cur ? '' : 'is-active'}" data-action="set-piece" data-role="${role}" data-value="" aria-pressed="${!cur}">${t('sp.auto')}</button>`]
      .concat(spCandidates(game, setup, role).slice(0, 4).map(p =>
        `<button class="chip chip--btn ${cur === p.id ? 'is-active' : ''}" data-action="set-piece" data-role="${role}" data-value="${p.id}" aria-pressed="${cur === p.id}">${esc(p.last)}</button>`));
    return `<div class="sp-row"><div class="small"><b>${t('sp.' + role)}</b></div><div class="chips">${chips.join('')}</div></div>`;
  }).join('');
  return `${rows}
    <p class="xsmall muted">${t('sp.hint')}</p>`;
}

function warnings(game, setup) {
  const list = [];
  for (const [slotId, pid] of Object.entries(setup.lineup)) {
    const p = game.players[pid];
    if (!p) continue;
    if (p.condition < 70) list.push({ icon: 'battery', text: t('prep.w.tired', { name: p.last, cond: p.condition }), tone: 'warn' });
  }
  const team = buildTeam(game, 'user', setup);
  for (const s of team.slots) {
    if (s.player && familiarity(s.player, s.pos) < 0.93) list.push({ icon: 'swap', text: t('prep.w.offPos', { name: s.player.last, pos: POS_LABEL[s.pos] }), tone: 'warn' });
    if (!s.player) list.push({ icon: 'alert', text: t('prep.w.empty', { pos: POS_LABEL[s.pos] }), tone: 'loss' });
  }
  const injuredOut = clubPlayers(game, 'user').filter(p => p.injury).length;
  if (injuredOut) list.push({ icon: 'medical', text: t('prep.w.injured', { n: injuredOut }), tone: 'muted' });
  for (const p of clubPlayers(game, 'user').filter(x => x.suspension)) {
    list.push({ icon: 'alert', text: t('prep.w.banned', { name: p.last, reason: banReason(p.suspension) }), tone: 'muted' });
  }
  for (const pid of Object.values(setup.lineup)) {
    const p = game.players[pid];
    if (p && p.yellowCount === 4) list.push({ icon: 'alert', text: t('prep.w.yellow4', { name: p.last }), tone: 'warn' });
  }
  return list;
}

/** Eingeklappte Zeile mit aktueller Wahl; Tippen klappt den Bereich auf */
function fold(ui, key, title, summary, body) {
  const open = !!ui.prepOpen?.[key];
  return `<section class="section fold ${open ? 'is-open' : ''}">
    <button class="fold__head" data-action="prep-fold" data-value="${key}" aria-expanded="${open}">
      <span class="fold__text"><b>${title}</b><span class="small muted">${summary}</span></span>
      ${icon(open ? 'chevronUp' : 'chevronDown')}
    </button>
    ${open ? `<div class="fold__body">${body}</div>` : ''}
  </section>`;
}

/** Erster Satz einer Stilbeschreibung (kompakte Kachel) */

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
  const star = clubPlayers(game, oppId).filter(p => !p.injury && !p.suspension).sort((a, b) => b.ovr - a.ovr)[0];
  const pred = forecastMatch(game, entry, setup);
  const warn = warnings(game, setup);
  const oppLines = buildTeam(game, oppId, expectedOpponentSetup(game, oppId)).lines;
  const wx = weatherFor(game.seed, game.dayIndex);
  const weakest = ['def', 'mid', 'att'].sort((a, b) => oppLines[a] - oppLines[b])[0];
  const tab = ['opp', 'tactics', 'week'].includes(ui.prepTab) ? ui.prepTab : 'tactics';

  // Hinweis-Punkte an den Reitern
  const dotTactics = warn.some(w => w.tone === 'warn');
  const unusedItem = game.user.inventory.some(i => CONSUMABLES[i.type]?.target === 'match' &&
    !(i.type === 'TACTIC' && game.user.matchBoost) && !(i.type === 'SCOUT' && game.user.scout?.oppId === oppId));
  const dotWeek = unusedItem;
  const tabBtn = (key, dot) => `<button data-action="prep-tab" data-value="${key}" aria-pressed="${tab === key}">${t('prep.tab.' + key)}${dot ? '<i class="tabdot" aria-hidden="true"></i>' : ''}</button>`;

  const styleTiles = STYLE_KEYS.map(key => {
    const st = STYLES[key];
    const on = setup.style === key;
    return `<button class="style-tile style-tile--compact ${on ? 'is-active' : ''}" data-action="set-style" data-value="${key}" aria-pressed="${on}" title="${esc(st.desc)}">
      <b>${st.name}</b>
      ${on ? `<span class="small">${esc(st.desc)}</span>` : ''}
    </button>`;
  }).join('');

  const spName = role => { const id = setup.setPieces?.[role]; const p = id && game.players[id]; return p ? esc(p.last) : t('sp.auto'); };
  const spSummary = t('prep.sum.sp', { c: spName('corner'), p: spName('pen'), f: spName('fk') });

  const oppTab = `
    <div class="scout__report">
      <div class="scout__line">${icon('strategy')}<span>${opp.coach ? t('prep.coach', { coach: `<b>${esc(opp.coach.name)}</b>`, style: `<b>${oppStyle.name}</b>`, formation: `<b>${opp.preferredFormation}</b>` }) : t('prep.noCoach', { style: `<b>${oppStyle.name}</b>`, formation: `<b>${opp.preferredFormation}</b>` })}</span></div>
      <div class="scout__line">${icon('target')}<span>${t('prep.weakest', { line: `<b>${t('prep.line.' + weakest)}</b>` })}</span></div>
      <div class="scout__line">${icon('sun')}<span><b>${t('weather.' + wx)}</b>. ${t('weather.' + wx + '.d')}</span></div>
      ${interviewLine(game)}
      ${game.user.scout?.oppId === oppId ? `<div class="scout__line">${icon('target')}<span>${t('prep.scouted', { club: `<b>${esc(opp.name)}</b>`, style: `<b>${STYLES[game.user.scout.style].name}</b>` })}</span></div>` : ''}
      ${star ? `<div class="scout__star" data-action="open-player" data-id="${star.id}" role="button">${cardHtml(star, { size: 'sm', colors: opp.colors })}<p class="small"><b>${t('prep.star')}:</b> ${esc(star.first)} ${esc(star.last)}, ${POS_LABEL[star.position]}, ${t('w.rating')} ${star.ovr}.</p></div>` : ''}
    </div>
    <p class="xsmall muted">${t('prep.forecastHint')}</p>`;

  const sug = coachSuggestion(game);
  const sugSame = SP_ROLES.every(r => (setup.setPieces?.[r] || null) === sug.setPieces[r]);
  const coachRow = `<div class="coach-tip">
      <div class="coach-tip__text"><b>${t('coach.title')}</b><span class="xsmall muted">${t('coach.spOnly')}</span></div>
      <button class="btn btn--sm btn--secondary" data-action="coach-apply" ${sugSame ? 'disabled' : ''}>${t('coach.apply')}</button>
    </div>`;

  const tacticsTab = `
    ${coachRow}
    <section class="section">
      <div class="section__head"><h2 class="section__title">${t('prep.style')}</h2></div>
      <div class="style-grid">${styleTiles}</div>
    </section>

    <section class="section">
      <div class="section__head"><h2 class="section__title">${t('w.formation')}</h2></div>
      <div class="segmented">${FORMATION_KEYS.map(k => `<button data-action="set-formation" data-value="${k}" aria-pressed="${setup.formation === k}">${k}</button>`).join('')}</div>
      ${autoToggle(game)}
      <div class="prep__lineup-actions">
        <button class="btn btn--sm btn--secondary" data-action="auto-lineup">${icon('auto')}${t('prep.auto')}</button>
      </div>
      <p class="hint small">${t('prep.swapHint')}</p>
      ${lineupEditor(game, setup, ui.selected, { compact: true })}
      ${warn.length ? `<ul class="warn-list">${warn.slice(0, 5).map(w => `<li class="warn-${w.tone}">${icon(w.icon)}${esc(w.text)}</li>`).join('')}</ul>` : ''}
    </section>

    ${fold(ui, 'sp', t('sp.title'), spSummary, setPieceBody(game, setup))}`;

  const weekTab = `
    ${consumablesSection(game)}`;

  return `<div class="fullscreen"><main class="screen prep">
    <div class="prep__top">
      <header class="prep__head">
        <button class="icon-btn" data-action="close-flow" aria-label="${t('w.back')}">${icon('chevronLeft')}</button>
        <div><div class="h3">${t('prep.title')}</div><div class="small muted">${esc(dayLabel(game, day))}, ${isHome ? t('w.home') : t('w.away')}</div></div>
        ${rivalry(game.clubs.user, opp) === 'derby' ? `<span class="chip chip--derby">${icon('flame')}${t('w.derby')}</span>` : ''}
      </header>
      <section class="scout scout--mini" data-action="open-club" data-id="${opp.id}" role="button">
        ${crestSvg(opp, 36)}
        <div class="scout__body">
          <div class="scout__name">${esc(opp.name)}</div>
          <div class="small muted">${LEAGUE_INFO[opp.tier].short}${oppRow ? `, ${t('prep.place', { pos: oppRow.pos })}` : ''}, ${t('w.rating')} ${clubStrength(game, oppId)}</div>
        </div>
        <span class="scout__wx" title="${esc(t('weather.' + wx + '.d'))}">${icon('sun')}${t('weather.' + wx)}</span>
      </section>
      ${oppRow ? `<div class="scout__form">${formHtml(oppRow.form)}</div>` : ''}
      <div class="prob prob--slim" aria-label="${t('prep.forecast')}">
        <span class="prob__w" style="flex:${pred.win || 1}"><b>${pred.win} %</b></span>
        <span class="prob__d" style="flex:${pred.draw || 1}"><b>${pred.draw} %</b></span>
        <span class="prob__l" style="flex:${pred.loss || 1}"><b>${pred.loss} %</b></span>
      </div>
      <div class="segmented prep__tabs">${tabBtn('opp', false)}${tabBtn('tactics', dotTactics)}${tabBtn('week', dotWeek)}</div>
    </div>

    ${tab === 'opp' ? oppTab : tab === 'tactics' ? tacticsTab : weekTab}

    <div class="prep__cta">
      ${ui.selected ? selectionBar(game, ui.selected) : blockingTasks(game).length
        ? `<p class="small task-hint">${t('task.openCount', { n: blockingTasks(game).length })}</p><button class="btn btn--primary btn--block" data-action="open-tasks">${t('task.view')}</button>`
        : `<button class="btn btn--primary btn--block" data-action="kickoff">${icon('whistle')}${t('prep.kickoff')}</button>
      <button class="btn btn--ghost btn--block" data-action="kickoff-instant">${t('prep.instant')}</button>`}
    </div>
  </main></div>`;
}
