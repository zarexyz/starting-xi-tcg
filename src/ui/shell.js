// =============================================================================
// App-Rahmen: Kopfzeile, Tab-Leiste, kleine wiederverwendbare Bausteine
// =============================================================================

import { icon, coinIcon } from './icons.js';
import { crestSvg } from './components/crest.js';
import { esc, fmt } from './html.js';
import { LEAGUE_INFO } from '../engine/world.js';
import { computeTable } from '../engine/schedule.js';

export const TABS = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'squad', label: 'Kader', icon: 'squad' },
  { key: 'league', label: 'Liga', icon: 'trophy' },
  { key: 'market', label: 'Markt', icon: 'store' },
  { key: 'club', label: 'Verein', icon: 'club' }
];

export function tabbar(active) {
  return `<nav class="tabbar" aria-label="Hauptnavigation">
    ${TABS.map(t => `<button class="tab" data-action="tab" data-tab="${t.key}" ${t.key === active ? 'aria-current="page"' : ''}>${icon(t.icon)}<span>${t.label}</span></button>`).join('')}
  </nav>`;
}

export function userPosition(game) {
  const tier = game.clubs.user.tier;
  return computeTable(game, tier).find(r => r.clubId === 'user')?.pos ?? '–';
}

export function topbar(game, title = null) {
  const club = game.clubs.user;
  const unread = game.inbox.filter(n => !n.read).length;
  return `<header class="topbar">
    ${crestSvg(club, 42)}
    <div class="topbar__title">
      <div class="topbar__club">${title ? esc(title) : esc(club.name)}</div>
      <div class="topbar__meta">${LEAGUE_INFO[club.tier].name}, Platz ${userPosition(game)}, Saison ${game.season}</div>
    </div>
    <span class="coins" aria-label="${fmt(club.coins)} Münzen">${coinIcon()}${fmt(club.coins)}</span>
    <button class="icon-btn" data-action="open-inbox" aria-label="Postfach${unread ? `, ${unread} ungelesen` : ''}">${icon('mail')}${unread ? `<span class="icon-btn__dot">${unread > 9 ? '9+' : unread}</span>` : ''}</button>
  </header>`;
}

export function segmented(items, active, action, extra = '') {
  return `<div class="segmented" role="group">${items.map(([key, label]) =>
    `<button type="button" data-action="${action}" data-value="${key}" ${extra} aria-pressed="${key === active}">${label}</button>`).join('')}</div>`;
}

export function formHtml(form) {
  const map = { S: 'W', U: 'D', N: 'L' };
  const label = { S: 'S', U: 'U', N: 'N' };
  return `<span class="form" aria-label="Form">${form.map(f => `<i class="${map[f]}">${label[f]}</i>`).join('')}</span>`;
}

export function sheet(title, body, opts = {}) {
  return `<div class="overlay" data-action="close-sheet" data-self="1">
    <section class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="sheet__grip"></div>
      <div class="sheet__head">
        <h2 class="h2">${esc(title)}</h2>
        ${opts.noClose ? '' : `<button class="icon-btn" data-action="close-sheet" aria-label="Schließen">${icon('close')}</button>`}
      </div>
      ${body}
    </section>
  </div>`;
}

export function moneyRow(label, amount) {
  return `<li class="row"><span class="row__main">${esc(label)}</span><b class="num ${amount >= 0 ? 'pos' : 'neg'}">${amount >= 0 ? '+' : '−'}${fmt(Math.abs(amount))}</b></li>`;
}

export function autoToggle(game) {
  const on = !!game.user.autoLineup;
  return `<div class="auto-toggle">
    <div class="auto-toggle__text"><b>Co-Trainer stellt auf</b><span class="small muted">${on ? 'Vor jedem Spiel spielt die fitteste beste Elf. Formation und Spielstil bestimmst du.' : 'Du stellst selbst auf. Achte auf müde Spieler.'}</span></div>
    <button class="toggle" role="switch" aria-checked="${on}" aria-label="Co-Trainer stellt auf" data-action="toggle-auto"><span></span></button>
  </div>`;
}
