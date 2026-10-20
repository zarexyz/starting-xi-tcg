// =============================================================================
// Bottom Sheets: Postfach, Nachricht, Spind (Gegenstände)
// =============================================================================

import { sheet } from './shell.js';
import { itemCard } from './flows/pack.js';
import { playerRow } from './screens/squad.js';
import { icon } from './icons.js';
import { esc } from './html.js';
import { CONSUMABLES } from '../engine/packs.js';
import { clubPlayers } from '../engine/world.js';

const NEWS_ICON = {
  welcome: 'ball', squad: 'squad', injury: 'medical', cup: 'trophy', trophy: 'trophy', ff: 'star',
  season: 'calendar', development: 'up', finance: 'coins', transfer: 'swap'
};

export function inboxSheet(game) {
  if (!game.inbox.length) return sheet('Postfach', '<div class="empty"><div class="h3">Keine Nachrichten</div></div>');
  const body = `
    <div class="sheet-actions"><button class="link" data-action="read-all">Alle als gelesen markieren</button></div>
    <ul class="list panel panel--flush">
      ${game.inbox.map(n => `<li class="row row--button" data-action="open-news" data-id="${n.id}">
        <span class="alert-dot ${n.type === 'injury' || n.type === 'finance' ? 'alert-dot--loss' : n.type === 'trophy' ? 'alert-dot--reward' : ''}">${icon(NEWS_ICON[n.type] || 'mail')}</span>
        <div class="row__main"><div class="row__title ${n.read ? '' : 'is-unread'}">${esc(n.title)}</div><div class="row__sub news-sub">${esc(n.text)}</div></div>
        <span class="xsmall muted">S${n.season}</span>
      </li>`).join('')}
    </ul>`;
  return sheet('Postfach', body);
}

export function newsSheet(game, id) {
  const n = game.inbox.find(x => x.id === id);
  if (!n) return '';
  return sheet(n.title, `
    <p class="news-text">${esc(n.text)}</p>
    ${n.playerId && game.players[n.playerId] ? `<button class="btn btn--secondary btn--block" data-action="open-player" data-id="${n.playerId}">${icon('user')}Spieler ansehen</button>` : ''}
    <button class="btn btn--ghost btn--block" data-action="open-inbox">${icon('chevronLeft')}Zum Postfach</button>
  `);
}

/** Spind: Gegenstände gruppiert; bei Auswahl ggf. Spieler wählen */
export function itemsSheet(game, ui) {
  const inv = game.user.inventory;
  const pickItem = ui.sheet?.itemId ? inv.find(i => i.id === ui.sheet.itemId) : null;
  if (pickItem) {
    const def = CONSUMABLES[pickItem.type];
    let players = clubPlayers(game, 'user');
    if (def.target === 'injured') players = players.filter(p => p.injury);
    if (pickItem.type === 'FITNESS') players = players.sort((a, b) => a.condition - b.condition);
    else players = players.sort((a, b) => b.ovr - a.ovr);
    return sheet(def.name, `
      ${itemCard(pickItem.type)}
      <p class="small muted">Für wen?</p>
      ${players.length ? `<ul class="list panel panel--flush">${players.map(p => playerRow(game, p, { action: 'use-item-on' })).join('')}</ul>` :
        '<div class="empty"><p>Gerade gibt es niemanden, für den das passt.</p></div>'}
      <button class="btn btn--ghost btn--block" data-action="open-items">${icon('chevronLeft')}Zurück zum Spind</button>
    `);
  }
  if (!inv.length) {
    return sheet('Spind', `<div class="empty"><div class="h3">Der Spind ist leer</div><p>Ausrüstungs-Packs gibt es im Markt.</p><button class="btn btn--secondary" data-action="go-market">${icon('store')}Zum Markt</button></div>`);
  }
  const groups = {};
  inv.forEach(i => { (groups[i.type] ||= []).push(i); });
  const forPlayer = ui.sheet?.playerId;
  return sheet('Spind', `
    ${forPlayer ? `<p class="small muted">Gegenstand für ${esc(game.players[forPlayer]?.last || '')} auswählen.</p>` : '<p class="small muted">Tippe auf einen Gegenstand, um ihn einzusetzen.</p>'}
    <div class="items-grid">
      ${Object.entries(groups).map(([type, list]) => itemCard(type, 0, { action: 'use-item', id: list[0].id, count: list.length })).join('')}
    </div>
  `);
}
