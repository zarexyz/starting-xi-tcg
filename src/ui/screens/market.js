// =============================================================================
// Markt: Packs kaufen, Transfermarkt
// =============================================================================

import { topbar, segmented } from '../shell.js';
import { packArt, itemCard } from '../flows/pack.js';
import { icon, coinIcon } from '../icons.js';
import { esc, fmt } from '../html.js';
import { PACKS } from '../../engine/packs.js';
import { TIERS, MAX_SQUAD } from '../../engine/constants.js';

function tierOdds(pack) {
  return Object.entries(pack.tiers).filter(([, w]) => w > 0)
    .map(([t, w]) => `<span class="odds odds--${t}">${TIERS[t].name} ${w} %</span>`).join('');
}

function packsView(game) {
  const coins = game.clubs.user.coins;
  const full = game.clubs.user.playerIds.length >= MAX_SQUAD;
  return `
    <p class="small muted">Spieler-Packs enthalten nur neue Talente, die gerade in die Welt kommen. Du wählst einen, die anderen beiden siehst du nie wieder.</p>
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
            ${blocked ? '<p class="xsmall neg">Kader voll</p>' : !afford ? `<p class="xsmall muted">Dir fehlen ${fmt(pack.price - coins)}</p>` : ''}
          </div>
        </article>`;
      }).join('')}
    </div>
    <p class="xsmall muted">Je höher deine Liga, desto stärker fallen die Spieler in den Packs aus.</p>
  `;
}

export function marketScreen(game, ui, renderers = {}) {
  const view = ui.view.market || 'packs';
  const body = view === 'packs' ? packsView(game) : (renderers.transfers ? renderers.transfers(game, ui) : '');
  return `<main class="screen">
    ${topbar(game)}
    ${segmented([['packs', 'Packs'], ['transfers', 'Transfermarkt']], view, 'market-view')}
    <div class="market-body">${body}</div>
  </main>`;
}

export { itemCard, icon };
