// =============================================================================
// App-Rahmen: Kopfzeile, Tab-Leiste, kleine wiederverwendbare Bausteine
// =============================================================================

import { icon, coinIcon } from './icons.js';
import { crestSvg } from './components/crest.js';
import { esc, fmt } from './html.js';
import { LEAGUE_INFO } from '../engine/world.js';
import { computeTable } from '../engine/schedule.js';
import { inboxItems } from '../engine/news.js';
import { t } from '../i18n/index.js';

export const TABS = [
  { key: 'home', icon: 'home' },
  { key: 'squad', icon: 'squad' },
  { key: 'league', icon: 'trophy' },
  { key: 'market', icon: 'store' },
  { key: 'club', icon: 'club' }
];

export function tabbar(active) {
  return `<nav class="tabbar" aria-label="${t('nav.main')}">
    ${TABS.map(tab => `<button class="tab" data-action="tab" data-tab="${tab.key}" ${tab.key === active ? 'aria-current="page"' : ''}>${icon(tab.icon)}<span>${t(`tab.${tab.key}`)}</span></button>`).join('')}
  </nav>`;
}

export function userPosition(game) {
  const tier = game.clubs.user.tier;
  return computeTable(game, tier).find(r => r.clubId === 'user')?.pos ?? '–';
}

export function topbar(game, title = null) {
  const club = game.clubs.user;
  const unread = inboxItems(game).filter(n => !n.read).length;
  return `<header class="topbar">
    ${crestSvg(club, 42)}
    <div class="topbar__title">
      <div class="topbar__club">${title ? esc(title) : esc(club.name)}</div>
      <div class="topbar__meta">${t('top.meta', { league: LEAGUE_INFO[club.tier].name, pos: userPosition(game), season: game.season })}</div>
    </div>
    <span class="coins" aria-label="${t('w.coinsN', { n: club.coins })}">${coinIcon()}${fmt(club.coins)}</span>
    <button class="icon-btn" data-action="open-inbox" aria-label="${t('top.inbox')}${unread ? `, ${t('top.unread', { n: unread })}` : ''}">${icon('mail')}${unread ? `<span class="icon-btn__dot">${unread > 9 ? '9+' : unread}</span>` : ''}</button>
    <button class="icon-btn" data-action="open-settings" aria-label="${t('set.title')}">${icon('settings')}</button>
  </header>`;
}

export function segmented(items, active, action, extra = '') {
  return `<div class="segmented" role="group">${items.map(([key, label]) =>
    `<button type="button" data-action="${action}" data-value="${key}" ${extra} aria-pressed="${key === active}">${label}</button>`).join('')}</div>`;
}

export function formHtml(form) {
  const map = { S: 'W', U: 'D', N: 'L' };
  return `<span class="form" aria-label="${t('w.form')}">${form.map(f => `<i class="${map[f]}">${t(`form.${f}`)}</i>`).join('')}</span>`;
}

export function sheet(title, body, opts = {}) {
  return `<div class="overlay" data-action="close-sheet" data-self="1">
    <section class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="sheet__grip"></div>
      <div class="sheet__head">
        ${opts.back ? `<button class="icon-btn sheet__back" data-action="sheet-back" aria-label="${t('w.back')}">${icon('chevronLeft')}</button>` : ''}
        <h2 class="h2">${esc(title)}</h2>
        ${opts.noClose ? '' : `<button class="icon-btn" data-action="close-sheet" aria-label="${t('w.close')}">${icon('close')}</button>`}
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
    <div class="auto-toggle__text"><b>${t('auto.title')}</b><span class="small muted">${on ? t('auto.on') : t('auto.off')}</span></div>
    <button class="toggle" role="switch" aria-checked="${on}" aria-label="${t('auto.title')}" data-action="toggle-auto"><span></span></button>
  </div>`;
}
