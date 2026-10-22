// =============================================================================
// Zeitung: Geschichten aus Verein, Liga und Welt zum Durchscrollen
// =============================================================================

import { sheet, segmented } from '../shell.js';
import { icon } from '../icons.js';
import { esc } from '../html.js';
import { portraitSvg } from '../components/portrait.js';
import { crestSvg } from '../components/crest.js';
import { feedItems } from '../../engine/news.js';
import { dayLabel } from '../../engine/game.js';
import { newsTitle, newsText } from '../text.js';
import { NEWS_ICON } from '../sheets.js';
import { t } from '../../i18n/index.js';

function visual(game, n) {
  const p = n.playerId && game.players[n.playerId];
  if (p) {
    const c = game.clubs[p.clubId];
    return `<span class="prow__face feed__face tier-${p.tier}" style="--club:${c?.colors.primary || '#888'}">${portraitSvg(p, { colors: c?.colors })}</span>`;
  }
  const clubId = n.clubId || n.clubIds?.[0];
  if (clubId && game.clubs[clubId]) return `<span class="feed__crest">${crestSvg(game.clubs[clubId], 40)}</span>`;
  return `<span class="alert-dot feed__icon">${icon(NEWS_ICON[n.type] || 'mail')}</span>`;
}

function when(game, n) {
  const day = game.calendar[n.day];
  const label = day ? dayLabel(game, day) : '';
  return `S${n.season}${label ? ` · ${label}` : ''}`;
}

export function feedCard(game, n, fresh = null) {
  const unread = fresh ? fresh.includes(n.id) : !n.read;
  return `<li><button class="feed__card ${unread ? 'is-unread' : ''}" data-action="open-news" data-id="${n.id}">
    ${visual(game, n)}
    <span class="feed__body">
      <span class="feed__meta xsmall muted">${esc(when(game, n))}</span>
      <b class="feed__title">${esc(newsTitle(n))}</b>
      <span class="feed__text small">${esc(newsText(n))}</span>
    </span>
  </button></li>`;
}

export function feedSheet(game, ui) {
  const filter = ui.feedFilter || 'all';
  const items = feedItems(game, filter);
  const body = `
    ${segmented([['all', t('feed.all')], ['mine', t('feed.mine')], ['world', t('feed.world')]], filter, 'feed-filter')}
    ${items.length ? `<ul class="feed">${items.map(n => feedCard(game, n, ui.feedFresh || [])).join('')}</ul>`
      : `<div class="empty"><div class="h3">${t('feed.empty')}</div><p>${t('feed.emptyHint')}</p></div>`}
  `;
  return sheet(t('feed.title'), body);
}
