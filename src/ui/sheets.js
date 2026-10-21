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
import { t } from '../i18n/index.js';
import { newsTitle, newsText } from './text.js';

const NEWS_ICON = {
  welcome: 'ball', squad: 'squad', injury: 'medical', cup: 'trophy', trophy: 'trophy', ff: 'star',
  season: 'calendar', development: 'up', finance: 'coins', transfer: 'swap', suspension: 'alert', derby: 'flame', coach: 'user'
};

export function inboxSheet(game) {
  if (!game.inbox.length) return sheet(t('top.inbox'), `<div class="empty"><div class="h3">${t('inbox.empty')}</div></div>`);
  const body = `
    <div class="sheet-actions"><button class="link" data-action="read-all">${t('inbox.readAll')}</button></div>
    <ul class="list panel panel--flush">
      ${game.inbox.map(n => `<li class="row row--button" data-action="open-news" data-id="${n.id}">
        <span class="alert-dot ${n.type === 'injury' || n.type === 'finance' ? 'alert-dot--loss' : n.type === 'trophy' ? 'alert-dot--reward' : ''}">${icon(NEWS_ICON[n.type] || 'mail')}</span>
        <div class="row__main"><div class="row__title ${n.read ? '' : 'is-unread'}">${esc(newsTitle(n))}</div><div class="row__sub news-sub">${esc(newsText(n))}</div></div>
        <span class="xsmall muted">S${n.season}</span>
      </li>`).join('')}
    </ul>`;
  return sheet(t('top.inbox'), body);
}

export function newsSheet(game, id) {
  const n = game.inbox.find(x => x.id === id);
  if (!n) return '';
  return sheet(newsTitle(n), `
    <p class="news-text">${esc(newsText(n))}</p>
    ${n.playerId && game.players[n.playerId] ? `<button class="btn btn--secondary btn--block" data-action="open-player" data-id="${n.playerId}">${icon('user')}${t('news.viewPlayer')}</button>` : ''}
    ${n.clubId && game.clubs[n.clubId] ? `<button class="btn btn--secondary btn--block" data-action="open-club" data-id="${n.clubId}">${icon('shield')}${t('news.viewClub')}</button>` : ''}
    <button class="btn btn--ghost btn--block" data-action="open-inbox">${icon('chevronLeft')}${t('news.toInbox')}</button>
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
    if (pickItem.type === 'FITNESS') players = players.sort((a, b) => a.condition - b.condition);
    else if (def.attr) players = players.sort((a, b) => attrMatters(b.position, def.attr) - attrMatters(a.position, def.attr) || b.ovr - a.ovr);
    else players = players.sort((a, b) => b.ovr - a.ovr);
    const extra = def.attr ? p => `${ATTR_NAMES[def.attr]} ${p.attrs[def.attr]}${p.tempBoost ? `, ${t('items.boostActive')}` : ''}` : null;
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
