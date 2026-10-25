// =============================================================================
// Bottom Sheets: Postfach, Nachricht, Spind (Gegenstände)
// =============================================================================

import { sheet } from './shell.js';
import { itemCard } from './flows/pack.js';
import { playerRow } from './screens/squad.js';
import { icon } from './icons.js';
import { esc } from './html.js';
import { itemDef, attrMatters } from '../engine/packs.js';
import { ATTR_NAMES } from '../engine/constants.js';
import { clubPlayers } from '../engine/world.js';
import { t, fmtNum } from '../i18n/index.js';
import { newsTitle, newsText } from './text.js';
import { portraitSvg } from './components/portrait.js';
import { crestSvg } from './components/crest.js';
import { LEAGUE_INFO } from '../engine/world.js';
import { POS_LABEL } from '../engine/constants.js';
import { inboxItems, newsChannel } from '../engine/news.js';
import { openTasks, blockingTasks } from '../engine/tasks.js';
import { cardHtml } from './components/card.js';
import { marketValue } from '../engine/player.js';
import { sponsorChoice } from './components/sponsor.js';

export const NEWS_ICON = {
  welcome: 'ball', squad: 'squad', injury: 'medical', cup: 'trophy', trophy: 'trophy', ff: 'star',
  season: 'calendar', development: 'up', finance: 'coins', transfer: 'swap', suspension: 'alert', board: 'trophy', press: 'megaphone', staff: 'user', mood: 'alert', derby: 'flame', coach: 'user',
  streak: 'up', upset: 'sparkles', comeback: 'heart', result: 'ball', player: 'star', youth: 'sparkles',
  table: 'list', award: 'trophy', rumor: 'megaphone', world: 'swap', contract: 'clipboard'
};

function inboxRow(n) {
  const open = n.task?.status === 'open';
  const dot = n.task?.blocking && open ? 'alert-dot--loss' : n.type === 'injury' || n.type === 'finance' ? 'alert-dot--loss' : n.type === 'trophy' || n.type === 'award' ? 'alert-dot--reward' : '';
  return `<li class="row row--button" data-action="open-news" data-id="${n.id}">
    <span class="alert-dot ${dot}">${icon(NEWS_ICON[n.type] || 'mail')}</span>
    <div class="row__main">${open && n.task.blocking ? `<span class="chip chip--warn task-tag">${t('task.decision')}</span>` : ''}<div class="row__title ${n.read && !open ? '' : 'is-unread'}">${esc(newsTitle(n))}</div><div class="row__sub news-sub">${esc(newsText(n))}</div></div>
    ${open ? `<span class="news-links__chev">${icon('chevronRight')}</span>` : n.read ? `<span class="xsmall muted">S${n.season}</span>` : `<button class="icon-btn news-read" data-action="news-read" data-id="${n.id}" aria-label="${t('inbox.markRead')}" title="${t('inbox.markRead')}">${icon('check')}</button>`}
  </li>`;
}

export function inboxSheet(game) {
  const todo = openTasks(game);
  const todoIds = new Set(todo.map(n => n.id));
  const items = inboxItems(game).filter(n => !todoIds.has(n.id));
  if (!items.length && !todo.length) return sheet(t('top.inbox'), `<div class="empty"><div class="h3">${t('inbox.empty')}</div><p>${t('inbox.emptyFeed')}</p></div>`);
  const body = `
    ${todo.length ? `<h3 class="h3 task-head">${t('task.todo')} <span class="chip">${todo.length}</span></h3>
      <ul class="list panel panel--flush task-list">${todo.map(inboxRow).join('')}</ul>` : ''}
    ${items.length ? `<div class="sheet-actions"><button class="link" data-action="read-all">${t('inbox.readAll')}</button></div>
    <ul class="list panel panel--flush">${items.map(inboxRow).join('')}</ul>` : ''}`;
  return sheet(t('top.inbox'), body);
}

/** Sperre: blockierende Aufgaben, die vor dem Weiterspielen entschieden werden müssen */
export function tasksSheet(game) {
  const list = blockingTasks(game);
  if (!list.length) return sheet(t('task.blockedTitle'), `<div class="empty"><p>${t('task.allDone')}</p></div>`);
  return sheet(t('task.blockedTitle'), `
    <p class="small muted">${t('task.blockedText', { n: list.length })}</p>
    <ul class="list panel panel--flush task-list">${list.map(inboxRow).join('')}</ul>`);
}

/** Angebot: Spielerkarte klein mit Angebot und Marktwert zum Vergleich */
function offerCard(game, n) {
  if (n.task?.kind !== 'offer') return '';
  const p = game.players[n.playerId];
  if (!p) return '';
  const club = game.clubs[p.clubId];
  const o = (game.user.offers || []).find(x => x.id === n.task.ref);
  const amount = o?.amount ?? n.p?.amountC;
  return `<div class="task-offer">
    <div class="task-offer__card">${cardHtml(p, { size: 'sm', colors: club?.colors })}</div>
    <dl class="task-offer__facts">
      <dt>${t('task.offer.bid')}</dt><dd class="num">${fmtNum(amount)}</dd>
      <dt>${t('task.offer.value')}</dt><dd class="num">${fmtNum(marketValue(p))}</dd>
    </dl>
  </div>`;
}

function taskActions(n) {
  const tk = n.task;
  if (!tk) return '';
  const label = (key, p) => esc(t(key, { ...(n.p || {}), ...(p || {}) }));
  if (tk.status === 'done') {
    const c = (tk.choices || []).find(x => x.key === tk.answer);
    return `<p class="task-state task-state--done">${icon('check')}${tk.answer && c ? t('task.done', { answer: label(c.label) }) : t('task.doneShort')}</p>`;
  }
  if (tk.status === 'expired') return `<p class="task-state task-state--expired">${t('task.expired')}</p>`;
  // Sponsoren: die Karten selbst sind die Auswahlknöpfe (sponsorChoice)
  const choices = tk.kind === 'sponsor' ? '' : (tk.choices || []).map(c => `<div class="task-choice"><button class="btn btn--${c.tone || 'secondary'} btn--block" data-action="task-choice" data-id="${n.id}" data-choice="${c.key}">${label(c.label)}</button>${c.hint ? `<span class="xsmall muted">${label(c.hint)}</span>` : ''}</div>`).join('');
  const cta = tk.cta ? `<button class="btn btn--${choices ? 'ghost' : 'primary'} btn--block" data-action="task-go" data-id="${n.id}">${label(tk.cta.label)}${icon('chevronRight')}</button>` : '';
  return `<div class="task-actions">${tk.blocking ? `<p class="small task-hint">${t('task.mustDecide')}</p>` : ''}${choices}${cta}</div>`;
}

/** Alle in einer Nachricht genannten Spieler und Vereine, jeweils antippbar */
function newsLinks(game, n) {
  const pids = [...new Set([n.playerId, ...(n.playerIds || [])].filter(id => id && game.players[id]))];
  const cids = [...new Set([n.clubId, ...(n.clubIds || [])].filter(id => id && game.clubs[id]))];
  if (!pids.length && !cids.length) return '';
  const rows = [
    ...pids.map(id => {
      const p = game.players[id];
      const c = game.clubs[p.clubId];
      return `<li><button class="row row--button prow" data-action="open-player" data-id="${id}">
        <span class="prow__face tier-${p.tier}" style="--club:${c?.colors.primary || '#888'}">${portraitSvg(p, { colors: c?.colors })}</span>
        <span class="row__main"><span class="row__title">${esc(p.first)} ${esc(p.last)}</span><span class="row__sub">${POS_LABEL[p.position]}, ${p.ovr}${c ? ` · ${esc(c.name)}` : ''}</span></span>
        <span class="news-links__chev">${icon('chevronRight')}</span>
      </button></li>`;
    }),
    ...cids.map(id => {
      const c = game.clubs[id];
      return `<li><button class="row row--button" data-action="open-club" data-id="${id}">
        ${crestSvg(c, 32)}
        <span class="row__main"><span class="row__title">${esc(c.name)}</span><span class="row__sub">${LEAGUE_INFO[c.tier].name}</span></span>
        <span class="news-links__chev">${icon('chevronRight')}</span>
      </button></li>`;
    })
  ];
  return `<h3 class="h3 news-links__title">${t('news.mentioned')}</h3><ul class="list panel panel--flush news-links">${rows.join('')}</ul>`;
}

export function newsSheet(game, id) {
  const n = game.inbox.find(x => x.id === id);
  if (!n) return '';
  return sheet(newsTitle(n), `
    <p class="news-text">${esc(newsText(n))}</p>
    ${offerCard(game, n)}
    ${sponsorChoice(game, n)}
    ${taskActions(n)}
    ${newsLinks(game, n)}
    ${newsChannel(n) === 'feed'
      ? `<button class="btn btn--ghost btn--block" data-action="open-feed">${icon('chevronLeft')}${t('news.toFeed')}</button>`
      : `<button class="btn btn--ghost btn--block" data-action="open-inbox">${icon('chevronLeft')}${t('news.toInbox')}</button>`}
  `);
}

/** Spind: Gegenstände gruppiert; bei Auswahl ggf. Spieler wählen */
export function itemsSheet(game, ui) {
  const inv = game.user.inventory;
  const pickItem = ui.sheet?.itemId ? inv.find(i => i.id === ui.sheet.itemId) : null;
  if (pickItem) {
    const def = itemDef(pickItem);
    let players = clubPlayers(game, 'user');
    if (def.target === 'injured') players = players.filter(p => p.injury);
    if (pickItem.type === 'LOYALTY') players = players.filter(p => p.age < 31).sort((a, b) => (b.wantsRaise ? 1 : 0) - (a.wantsRaise ? 1 : 0) || b.ovr - a.ovr);
    if (pickItem.type === 'NEGOTIATE') players = players.sort((a, b) => (b.wantsRaise ? 1 : 0) - (a.wantsRaise ? 1 : 0) || (a.contract?.until ?? 99) - (b.contract?.until ?? 99) || b.ovr - a.ovr);
    if (pickItem.type === 'FITNESS') players = players.sort((a, b) => a.condition - b.condition);
    else if (pickItem.type === 'NEGOTIATE' || pickItem.type === 'LOYALTY') { /* oben sortiert */ }
    else if (def.attr) players = players.sort((a, b) => attrMatters(b.position, def.attr) - attrMatters(a.position, def.attr) || b.ovr - a.ovr);
    else players = players.sort((a, b) => b.ovr - a.ovr);
    const contractExtra = ['NEGOTIATE', 'LOYALTY'].includes(pickItem.type) ? p => `${t('ct.untilS', { s: p.contract?.until ?? game.season })}, ${fmtNum(p.contract?.wage ?? 0)}${p.wantsRaise ? ` · ${t('ct.markRaiseT')}` : ''}` : null;
    const extra = contractExtra || (def.attr ? p => `${ATTR_NAMES[def.attr]} ${p.attrs[def.attr]}${p.tempBoost ? `, ${t('items.boostActive')}` : ''}` : null);
    return sheet(def.name, `
      ${itemCard(pickItem)}
      <p class="small muted">${t('items.forWhom')}</p>
      ${players.length ? `<ul class="list panel panel--flush">${players.map(p => playerRow(game, p, { action: 'use-item-on', extra: extra && extra(p) })).join('')}</ul>` :
        `<div class="empty"><p>${t('items.nobody')}</p></div>`}
      <button class="btn btn--ghost btn--block" data-action="open-items">${icon('chevronLeft')}${t('items.back')}</button>
    `);
  }
  if (!inv.length) {
    return sheet(t('items.title'), `<div class="empty"><div class="h3">${t('items.empty')}</div><p>${t('items.emptyHint')}</p><button class="btn btn--secondary" data-action="go-market">${icon('store')}${t('items.toMarket')}</button></div>`);
  }
  const groups = {};
  inv.forEach(i => { (groups[i.type + (i.attr ? ':' + i.attr : '')] ||= []).push(i); });
  const forPlayer = ui.sheet?.playerId;
  return sheet(t('items.title'), `
    ${forPlayer ? `<p class="small muted">${t('items.forPlayer', { name: esc(game.players[forPlayer]?.last || '') })}</p>` : `<p class="small muted">${t('items.tapToUse')}</p>`}
    <div class="items-grid">
      ${Object.values(groups).map(list => itemCard(list[0], 0, { action: 'use-item', id: list[0].id, count: list.length })).join('')}
    </div>
  `);
}
