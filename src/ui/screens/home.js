// =============================================================================
// Home: nächstes Spiel, Tabelle, Kaderlage, Nachrichten
// =============================================================================

import { topbar, formHtml, userPosition } from '../shell.js';
import { crestSvg } from '../components/crest.js';
import { icon } from '../icons.js';
import { esc } from '../html.js';
import { currentDay, dayLabel, userMatch, nextUserMatch } from '../../engine/game.js';
import { computeTable, CUP_ROUND_NAMES } from '../../engine/schedule.js';
import { STYLES } from '../../engine/constants.js';
import { clubStrength, clubPlayers, LEAGUE_INFO, rivalry } from '../../engine/world.js';
import { packArt } from '../flows/pack.js';
import { t } from '../../i18n/index.js';
import { newsTitle, newsText, pendingTitle } from '../text.js';
import { feedItems } from '../../engine/news.js';
import { blockingTasks } from '../../engine/tasks.js';
import { feedCard } from './feed.js';

function tableRowsAround(game) {
  const tier = game.clubs.user.tier;
  const table = computeTable(game, tier);
  const idx = table.findIndex(r => r.clubId === 'user');
  const start = Math.max(0, Math.min(table.length - 5, idx - 2));
  return { table, rows: table.slice(start, start + 5) };
}

function compLabel(game, entry) {
  if (!entry) return '';
  if (entry.comp === 'league') return LEAGUE_INFO[game.clubs.user.tier].name;
  if (entry.comp === 'cup') return t('day.cup', { round: CUP_ROUND_NAMES[entry.round] });
  return entry.stage === 'final' ? t('day.ffFinal') : t('day.ffSemi');
}

function blockedBand(game) {
  const n = blockingTasks(game).length;
  return `<div class="task-band">${icon('mail')}<div class="task-band__text"><b>${t('task.blockedTitle')}</b><span>${t('task.openCount', { n })}</span></div><button class="btn btn--primary" data-action="open-tasks">${t('task.view')}</button></div>`;
}

function matchTicket(game) {
  const day = currentDay(game);
  const today = userMatch(game, day);
  if (!today) {
    const next = nextUserMatch(game);
    return `<section class="ticket ticket--idle">
      <div class="ticket__head"><span class="chip">${icon('calendar')}${esc(dayLabel(game, day))}</span></div>
      <p class="ticket__idle">${t('home.noMatch')} ${next ? t('home.next', { day: esc(dayLabel(game, next.day)) }) : t('home.seasonDone')}</p>
      ${blockingTasks(game).length ? blockedBand(game) : `<button class="btn btn--secondary btn--block" data-action="sim-day">${icon('forward')}${t('home.simDay')}</button>`}
    </section>`;
  }
  const { m } = today;
  const home = game.clubs[m.home];
  const away = game.clubs[m.away];
  const opp = m.home === 'user' ? away : home;
  const tier = game.clubs.user.tier;
  const table = computeTable(game, tier);
  const formOf = id => table.find(r => r.clubId === id)?.form || [];
  const oppStyle = STYLES[opp.preferredStyle];
  const isHome = m.home === 'user';
  return `<section class="ticket" style="--home:${home.colors.primary};--away:${away.colors.primary}">
    <div class="ticket__head">
      <span class="ticket__day">${esc(dayLabel(game, day))}</span>
      <span class="chip">${esc(compLabel(game, today))}</span>
      ${rivalry(home, away) === 'derby' ? `<span class="chip chip--derby">${icon('flame')}${t('w.derby')}</span>` : ''}
    </div>
    <div class="ticket__match">
      <div class="ticket__team" data-action="open-club" data-id="${home.id}" role="button">
        ${crestSvg(home, 64)}
        <b>${esc(home.name)}</b>
        <span class="num">${t('w.rating')} ${clubStrength(game, home.id)}</span>
        ${formHtml(formOf(home.id))}
      </div>
      <div class="ticket__vs display">${isHome ? t('home.home') : t('home.away')}</div>
      <div class="ticket__team" data-action="open-club" data-id="${away.id}" role="button">
        ${crestSvg(away, 64)}
        <b>${esc(away.name)}</b>
        <span class="num">${t('w.rating')} ${clubStrength(game, away.id)}</span>
        ${formHtml(formOf(away.id))}
      </div>
    </div>
    <div class="ticket__scout">${icon('strategy')}<span>${t('home.scout', { club: esc(opp.name), style: `<b>${oppStyle.name}</b>`, formation: opp.preferredFormation })}</span></div>
    ${blockingTasks(game).length ? blockedBand(game) : `<button class="btn btn--primary btn--block" data-action="open-prep">${icon('whistle')}${t('home.prep')}</button>`}
  </section>`;
}

function squadAlerts(game) {
  const squad = clubPlayers(game, 'user');
  const injured = squad.filter(p => p.injury);
  const tired = squad.filter(p => !p.injury && p.condition < 70);
  const banned = squad.filter(p => p.suspension);
  const items = game.user.inventory.length;
  const parts = [];
  if (injured.length) parts.push(`<li class="row row--button" data-action="tab" data-tab="squad"><span class="alert-dot alert-dot--loss">${icon('medical')}</span><div class="row__main"><div class="row__title">${t('home.injured', { n: injured.length })}</div><div class="row__sub">${injured.map(p => esc(p.last)).join(', ')}</div></div>${icon('chevronRight', 'row__chev')}</li>`);
  if (banned.length) parts.push(`<li class="row row--button" data-action="tab" data-tab="squad"><span class="alert-dot alert-dot--loss"><i class="redcard"></i></span><div class="row__main"><div class="row__title">${t('home.banned', { n: banned.length })}</div><div class="row__sub">${banned.map(p => `${esc(p.last)} (${t('w.gamesShort', { n: p.suspension.games })})`).join(', ')}</div></div>${icon('chevronRight', 'row__chev')}</li>`);
  if (tired.length) parts.push(`<li class="row row--button" data-action="tab" data-tab="squad"><span class="alert-dot alert-dot--warn">${icon('battery')}</span><div class="row__main"><div class="row__title">${t('home.tired', { n: tired.length })}</div><div class="row__sub">${t('home.tiredHint')}</div></div>${icon('chevronRight', 'row__chev')}</li>`);
  if (items) parts.push(`<li class="row row--button" data-action="open-items"><span class="alert-dot">${icon('clipboard')}</span><div class="row__main"><div class="row__title">${t('home.items', { n: items })}</div><div class="row__sub">${t('home.itemsHint')}</div></div>${icon('chevronRight', 'row__chev')}</li>`);
  if (!parts.length) return '';
  return `<section class="section"><div class="section__head"><h2 class="section__title">${t('home.squadState')}</h2></div><ul class="list panel panel--flush">${parts.join('')}</ul></section>`;
}

function newsList(game) {
  const items = feedItems(game).slice(0, 3);
  if (!items.length) {
    return `<section class="section">
      <div class="section__head"><h2 class="section__title">${t('feed.title')}</h2></div>
      <p class="small muted">${t('feed.emptyHint')}</p>
    </section>`;
  }
  const unread = feedItems(game).filter(n => !n.read).length;
  return `<section class="section">
    <div class="section__head"><h2 class="section__title">${t('feed.title')}${unread ? ` <span class="badge-count">${unread > 99 ? '99+' : unread}</span>` : ''}</h2><button class="link" data-action="open-feed">${t('home.all')}</button></div>
    <ul class="feed feed--compact">${items.map(n => feedCard(game, n)).join('')}</ul>
  </section>`;
}

function firstSteps(game) {
  if (game.user.tipsDismissed || game.season > 1 || game.matchLog.length > 3 || game.pending) return '';
  const steps = [['strategy', 'read'], ['battery', 'rotate'], ['trophy', 'ff'], ['store', 'strengthen']];
  return `<section class="section tips">
    <div class="section__head"><h2 class="section__title">${t('tips.title')}</h2><button class="link" data-action="dismiss-tips">${t('tips.hide')}</button></div>
    <ol class="tips__list">${steps.map(([ic, k]) => `<li><span class="alert-dot">${icon(ic)}</span><div><b>${t(`tips.${k}.t`)}</b><p class="small muted">${t(`tips.${k}.x`)}</p></div></li>`).join('')}</ol>
  </section>`;
}

export function homeScreen(game) {
  const pendingBanner = game.pending ? `<section class="pending-pack">
      <div class="pending-pack__art">${packArt(game.pending.type === 'starter' ? 'starter' : game.pending.source, 'sm')}</div>
      <div><div class="h3">${game.pending.type === 'starter' ? t('home.starter') : esc(pendingTitle(game.pending))}</div>
      <p class="small muted">${game.pending.type === 'starter' ? t('home.starterHint') : t('home.pendingHint')}</p>
      <button class="btn btn--reward" data-action="open-pack">${t('home.open')}</button></div>
    </section>` : '';

  const { table, rows } = tableRowsAround(game);
  const tier = game.clubs.user.tier;
  const played = table[0]?.p || 0;
  const pos = userPosition(game);

  return `<main class="screen">
    ${topbar(game)}
    ${pendingBanner || matchTicket(game)}
    ${newsList(game)}
    ${firstSteps(game)}

    <section class="section">
      <div class="section__head">
        <h2 class="section__title">${LEAGUE_INFO[tier].name}</h2>
        <button class="link" data-action="tab" data-tab="league">${t('lg.table')}</button>
      </div>
      <div class="panel panel--flush">
        <table class="table">
          <tbody>
            ${rows.map(r => {
              const c = game.clubs[r.clubId];
              const zone = r.pos <= 4 ? 'zone-ff' : r.pos >= 9 && tier < 6 ? 'zone-down' : '';
              return `<tr class="${r.clubId === 'user' ? 'is-me' : ''} ${zone}">
                <td class="t-pos">${r.pos}</td>
                <td class="t-club">${crestSvg(c, 22)}<span>${esc(c.name)}</span></td>
                <td class="num t-gd">${r.gd > 0 ? '+' : ''}${r.gd}</td>
                <td class="num t-pts"><b>${r.pts}</b></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      <p class="xsmall muted legend"><span class="legend__ff"></span>${t('home.legendFF')}${tier < 6 ? ` <span class="legend__down"></span>${t('home.legendDown')}` : ''}. ${t('home.after', { played, pos })}</p>
    </section>

    ${squadAlerts(game)}
  </main>`;
}
