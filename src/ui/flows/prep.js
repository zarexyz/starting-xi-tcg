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
import { PLAN_KEYS, planCost } from '../../engine/clublife.js';
import { weatherFor, INTERVIEW_KEYS, interviewAvailable } from '../../engine/extras.js';
import { fmt } from '../html.js';

/** Training der Woche: ein Schwerpunkt mit Vor- und Nachteil */
function planSection(game) {
  const cur = game.user.plan || 'normal';
  const tiles = PLAN_KEYS.map(key => {
    const cost = planCost(game, key);
    const poor = cost > game.clubs.user.coins;
    return `<button class="style-tile plan-tile ${cur === key ? 'is-active' : ''}" data-action="set-plan" data-value="${key}" aria-pressed="${cur === key}" ${poor ? 'aria-disabled="true"' : ''}>
      <b>${t(`plan.${key}`)}</b>
      <span class="small">${t(`plan.${key}.d`, { n: fmt(cost) })}</span>
    </button>`;
  }).join('');
  return `<section class="section">
    <div class="section__head"><h2 class="section__title">${t('plan.title')}</h2></div>
    <div class="style-grid plan-grid">${tiles}</div>
    <p class="xsmall muted">${t('plan.hint')}</p>
  </section>`;
}

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

function interviewSection(game, entry) {
  if (!interviewAvailable(game, entry)) return '';
  const cur = game.user.interview?.key;
  const tiles = INTERVIEW_KEYS.map(key => `<button class="style-tile plan-tile ${cur === key ? 'is-active' : ''}" data-action="set-interview" data-value="${key}" aria-pressed="${cur === key}" ${cur && cur !== key ? 'aria-disabled="true"' : ''}>
      <b>${t(`iv.${key}`)}</b><span class="small">${t(`iv.${key}.d`)}</span></button>`).join('');
  return `<section class="section">
    <div class="section__head"><h2 class="section__title">${t('iv.title')}</h2></div>
    <div class="style-grid plan-grid">${tiles}</div>
    <p class="xsmall muted">${t('iv.hint')}</p>
  </section>`;
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

  const styleTiles = STYLE_KEYS.map(key => {
    const st = STYLES[key];
    return `<button class="style-tile ${setup.style === key ? 'is-active' : ''}" data-action="set-style" data-value="${key}" aria-pressed="${setup.style === key}">
      <b>${st.name}</b>
      <span class="small">${st.desc}</span>
    </button>`;
  }).join('');

  return `<div class="fullscreen"><main class="screen prep">
    <header class="prep__head">
      <button class="icon-btn" data-action="close-flow" aria-label="${t('w.back')}">${icon('chevronLeft')}</button>
      <div><div class="h3">${t('prep.title')}</div><div class="small muted">${esc(dayLabel(game, day))}, ${isHome ? t('w.home') : t('w.away')}</div></div>
      ${rivalry(game.clubs.user, opp) === 'derby' ? `<span class="chip chip--derby">${icon('flame')}${t('w.derby')}</span>` : ''}
    </header>

    <section class="scout" data-action="open-club" data-id="${opp.id}" role="button">
      ${crestSvg(opp, 56)}
      <div class="scout__body">
        <div class="h3">${esc(opp.name)}</div>
        <div class="small muted">${LEAGUE_INFO[opp.tier].short}${oppRow ? `, ${t('prep.place', { pos: oppRow.pos })}` : ''}, ${t('w.rating')} ${clubStrength(game, oppId)}</div>
        ${oppRow ? formHtml(oppRow.form) : ''}
      </div>
      ${icon('chevronRight', 'row__chev')}
    </section>
    <div class="scout__report">
      <div class="scout__line">${icon('strategy')}<span>${opp.coach ? t('prep.coach', { coach: `<b>${esc(opp.coach.name)}</b>`, style: `<b>${oppStyle.name}</b>`, formation: `<b>${opp.preferredFormation}</b>` }) : t('prep.noCoach', { style: `<b>${oppStyle.name}</b>`, formation: `<b>${opp.preferredFormation}</b>` })}</span></div>
      <div class="scout__line">${icon('target')}<span>${t('prep.weakest', { line: `<b>${t('prep.line.' + weakest)}</b>` })}</span></div>
      <div class="scout__line">${icon('sun')}<span><b>${t('weather.' + wx)}</b>. ${t('weather.' + wx + '.d')}</span></div>
      ${game.user.scout?.oppId === oppId ? `<div class="scout__line">${icon('target')}<span>${t('prep.scouted', { club: `<b>${esc(opp.name)}</b>`, style: `<b>${STYLES[game.user.scout.style].name}</b>` })}</span></div>` : ''}
      ${star ? `<div class="scout__star" data-action="open-player" data-id="${star.id}" role="button">${cardHtml(star, { size: 'sm', colors: opp.colors })}<p class="small"><b>${t('prep.star')}:</b> ${esc(star.first)} ${esc(star.last)}, ${POS_LABEL[star.position]}, ${t('w.rating')} ${star.ovr}.</p></div>` : ''}
    </div>

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
      ${warn.length ? `<ul class="warn-list">${warn.slice(0, 5).map(w => `<li class="warn-${w.tone}">${icon(w.icon)}${esc(w.text)}</li>`).join('')}</ul>` : `<p class="small pos ok-line">${icon('check')}${t('prep.noWeak')}</p>`}
    </section>

    ${interviewSection(game, entry)}

    ${planSection(game)}

    ${consumablesSection(game)}

    <section class="section prognosis">
      <div class="section__head"><h2 class="section__title">${t('prep.forecast')}</h2><span class="small muted">${t('prep.withPlan')}</span></div>
      <div class="prob">
        <span class="prob__w" style="flex:${pred.win || 1}"><b>${pred.win} %</b>${t('prep.win')}</span>
        <span class="prob__d" style="flex:${pred.draw || 1}"><b>${pred.draw} %</b>${t('cp.draws')}</span>
        <span class="prob__l" style="flex:${pred.loss || 1}"><b>${pred.loss} %</b>${t('prep.loss')}</span>
      </div>
      <p class="xsmall muted">${t('prep.forecastHint')}</p>
    </section>

    <div class="prep__cta">
      ${ui.selected ? selectionBar(game, ui.selected) : `<button class="btn btn--primary btn--block" data-action="kickoff">${icon('whistle')}${t('prep.kickoff')}</button>
      <button class="btn btn--ghost btn--block" data-action="kickoff-instant">${t('prep.instant')}</button>`}
    </div>
  </main></div>`;
}
