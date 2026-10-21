// =============================================================================
// Markt: Packs kaufen, Transfermarkt
// =============================================================================

import { topbar, segmented } from '../shell.js';
import { packArt, itemCard } from '../flows/pack.js';
import { icon, coinIcon } from '../icons.js';
import { esc, fmt } from '../html.js';
import { PACKS } from '../../engine/packs.js';
import { TIERS, MAX_SQUAD } from '../../engine/constants.js';
import { t } from '../../i18n/index.js';

function tierOdds(pack) {
  return Object.entries(pack.tiers).filter(([, w]) => w > 0)
    .map(([k, w]) => `<span class="odds odds--${k}">${TIERS[k].name} ${w} %</span>`).join('');
}

function packsView(game) {
  const coins = game.clubs.user.coins;
  const full = game.clubs.user.playerIds.length >= MAX_SQUAD;
  return `
    <p class="small muted">${t('market.packsIntro')}</p>
    <div class="pack-list">
      ${Object.values(PACKS).map(pack => {
        const afford = coins >= pack.price;
        const blocked = pack.kind === 'draft' && full;
        return `<article class="pack-offer">
          <div class="pack-offer__art">${packArt(pack.key, 'sm')}</div>
          <div class="pack-offer__body">
            <h3 class="h3">${esc(pack.name)}</h3>
            <p class="small">${esc(pack.desc)}</p>
            ${pack.kind === 'draft' ? `<div class="odds-row">${tierOdds(pack)}</div>` : ''}
            <button class="btn btn--sm ${afford && !blocked ? 'btn--reward' : 'btn--secondary'}" data-action="buy-pack" data-pack="${pack.key}" ${!afford || blocked || game.pending ? 'disabled' : ''}>
              ${coinIcon()}${fmt(pack.price)}
            </button>
            ${blocked ? `<p class="xsmall neg">${t('market.full')}</p>` : !afford ? `<p class="xsmall muted">${t('market.missing', { n: pack.price - coins })}</p>` : ''}
          </div>
        </article>`;
      }).join('')}
    </div>
    <p class="xsmall muted">${t('market.packsLeague')}</p>
  `;
}

export function marketScreen(game, ui, renderers = {}) {
  const view = ui.view.market || 'packs';
  const body = view === 'packs' ? packsView(game) : (renderers.transfers ? renderers.transfers(game, ui) : '');
  return `<main class="screen">
    ${topbar(game)}
    ${segmented([['packs', t('market.packs')], ['transfers', t('market.transfers')]], view, 'market-view')}
    <div class="market-body">${body}</div>
  </main>`;
}

export { itemCard, icon };
