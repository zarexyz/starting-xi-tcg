// =============================================================================
// Transfermarkt: Suche, Kauf, Verkauf über Angebote
// =============================================================================

import { portraitSvg } from '../components/portrait.js';
import { crestSvg } from '../components/crest.js';
import { starsHtml, potentialStars } from '../components/card.js';
import { icon, coinIcon } from '../icons.js';
import { esc, fmt } from '../html.js';
import { searchMarket, askingPrice, willingness, buyPlayer, getOffers, acceptOffer } from '../../engine/market.js';
import { salaryFor } from '../../engine/player.js';
import { LEAGUE_INFO } from '../../engine/world.js';
import { MAX_SQUAD, POS_LABEL } from '../../engine/constants.js';
import { t } from '../../i18n/index.js';

const PAGE = 20;
const GROUPS = ['ALL', 'GK', 'DEF', 'MID', 'ATT'];
const SORTS = ['ovr', 'pot', 'age', 'price'];

export function transfersView(game, ui) {
  const f = { group: 'ALL', sort: 'ovr', affordable: false, onlyWilling: true, tier: 0, page: 0, ...(ui.market || {}) };
  const list = searchMarket(game, { ...f, tier: f.tier || null });
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const page = Math.min(f.page, pages - 1);
  const shown = list.slice(page * PAGE, page * PAGE + PAGE);
  const full = game.clubs.user.playerIds.length >= MAX_SQUAD;
  return `
    <div class="mfilter">
      <div class="chips-scroll">${GROUPS.map(k => `<button class="chip ${f.group === k ? 'chip--pitch' : ''}" data-action="mkt-set" data-key="group" data-value="${k}" aria-pressed="${f.group === k}">${k === 'ALL' ? t('tm.all') : t(`group.${k}`)}</button>`).join('')}</div>
      <div class="chips-scroll">${[0, 1, 2, 3, 4, 5, 6].map(n => `<button class="chip ${f.tier === n ? 'chip--pitch' : ''}" data-action="mkt-set" data-key="tier" data-value="${n}" aria-pressed="${f.tier === n}">${n ? LEAGUE_INFO[n].short : t('tm.allLeagues')}</button>`).join('')}</div>
      <div class="mfilter__row">
        <label class="formation-select"><span class="sr-only">${t('tm.sort')}</span>
          <select data-input="mkt-sort">${SORTS.map(k => `<option value="${k}" ${f.sort === k ? 'selected' : ''}>${t(`tm.sort.${k}`)}</option>`).join('')}</select>${icon('chevronDown')}
        </label>
        <button class="chip ${f.affordable ? 'chip--pitch' : ''}" data-action="mkt-toggle" data-key="affordable" aria-pressed="${f.affordable}">${icon('coins')}${t('tm.affordable')}</button>
        <button class="chip ${f.onlyWilling ? 'chip--pitch' : ''}" data-action="mkt-toggle" data-key="onlyWilling" aria-pressed="${f.onlyWilling}">${icon('check')}${t('tm.willing')}</button>
      </div>
    </div>
    <p class="small muted">${t('tm.found', { n: list.length })}${full ? ` ${t('tm.full')}` : ''} ${t('tm.rule')}</p>
    ${shown.length ? `<ul class="list panel panel--flush">${shown.map(x => marketRow(game, x)).join('')}</ul>` :
      `<div class="empty"><div class="h3">${t('tm.none')}</div><p>${t('tm.noneHint')}</p></div>`}
    ${pages > 1 ? `<div class="pager">
      <button class="btn btn--sm btn--secondary" data-action="mkt-page" data-value="${page - 1}" ${page === 0 ? 'disabled' : ''}>${icon('chevronLeft')}${t('w.back')}</button>
      <span class="small muted">${t('tm.page', { page: page + 1, pages })}</span>
      <button class="btn btn--sm btn--secondary" data-action="mkt-page" data-value="${page + 1}" ${page >= pages - 1 ? 'disabled' : ''}>${t('w.continue')}${icon('chevronRight')}</button>
    </div>` : ''}
  `;
}

function marketRow(game, x) {
  const p = game.players[x.id];
  const club = game.clubs[p.clubId];
  const afford = game.clubs.user.coins >= x.price;
  return `<li><button class="row row--button prow" data-action="open-player" data-id="${p.id}">
    <span class="prow__face tier-${p.tier}" style="--club:${club.colors.primary}">${portraitSvg(p, { colors: club.colors })}</span>
    <span class="row__main">
      <span class="row__title">${esc(p.first[0])}. ${esc(p.last)}</span>
      <span class="row__sub mrow__sub">${crestSvg(club, 14)}${esc(club.short)}, ${POS_LABEL[p.position]}, ${t('w.ageShort', { age: p.age })} ${starsHtml(potentialStars(p))}</span>
    </span>
    <span class="mrow__price ${afford ? '' : 'neg'} ${x.willing ? '' : 'is-blocked'}">${coinIcon()}${fmt(x.price)}</span>
    <span class="prow__ovr tier-${p.tier}">${p.ovr}</span>
  </button></li>`;
}

/** Kauf-Bereich im Profil eines fremden Spielers */
export function foreignPlayerActions(game, p) {
  const price = askingPrice(game, p);
  const will = willingness(game, p);
  const coins = game.clubs.user.coins;
  const full = game.clubs.user.playerIds.length >= MAX_SQUAD;
  const reason = !will.ok ? will.reason : full ? t('tm.fullMax', { max: MAX_SQUAD }) : coins < price ? t('tm.missing', { n: price - coins }) : '';
  return `<section class="buybox">
    <div class="buybox__row"><span>${t('tm.fee')}</span><b class="display">${fmt(price)}</b></div>
    <div class="buybox__row"><span>${t('ps.wage')}</span><b>+${fmt(salaryFor(p.ovr))}</b></div>
    ${reason ? `<p class="small neg">${esc(reason)}</p>` : ''}
    <button class="btn btn--reward btn--block" data-action="buy-player" data-id="${p.id}" ${reason ? 'disabled' : ''}>${coinIcon()}${t('tm.signFor', { price: fmt(price) })}</button>
  </section>`;
}

/** Verkaufs-Knopf im Profil eines eigenen Spielers */
export function transferSheetButtons(game, p) {
  return `<button class="btn btn--secondary" data-action="show-offers" data-id="${p.id}">${icon('coins')}${t('tm.offers')}</button>`;
}

export function offersSheetBody(game, playerId) {
  const p = game.players[playerId];
  const offers = getOffers(game, playerId);
  return `
    <p class="small muted">${t('tm.offersIntro', { name: `${esc(p.first)} ${esc(p.last)}` })}</p>
    ${offers.length ? `<ul class="list panel panel--flush">${offers.map(o => {
      const c = game.clubs[o.clubId];
      return `<li class="row">
        ${crestSvg(c, 32)}
        <div class="row__main"><button class="link-club row__title" data-action="open-club" data-id="${c.id}"><span>${esc(c.name)}</span></button><div class="row__sub">${LEAGUE_INFO[c.tier].name}</div></div>
        <button class="btn btn--sm btn--reward" data-action="accept-offer" data-id="${playerId}" data-club="${o.clubId}">${coinIcon()}${fmt(o.amount)}</button>
      </li>`;
    }).join('')}</ul>` : `<div class="empty"><p>${t('tm.noOffers')}</p></div>`}
    <button class="btn btn--ghost btn--block" data-action="open-player" data-id="${playerId}">${icon('chevronLeft')}${t('tm.toProfile')}</button>
  `;
}

export function transferHandlers({ act, setUi, toast, askConfirm, store }) {
  const setMarket = patch => setUi({ market: { ...(store.ui.market || {}), page: 0, ...patch } });
  return {
    'mkt-set': d => setMarket({ [d.key]: d.key === 'tier' ? Number(d.value) : d.value }),
    'mkt-toggle': d => {
      const cur = { affordable: false, onlyWilling: true, ...(store.ui.market || {}) };
      setMarket({ [d.key]: !cur[d.key] });
    },
    'mkt-page': d => { setUi({ market: { ...(store.ui.market || {}), page: Number(d.value) } }); window.scrollTo(0, 0); },
    'buy-player': d => {
      const p = store.game.players[d.id];
      const price = askingPrice(store.game, p);
      askConfirm(t('tm.confirmBuy', { name: `${p.first} ${p.last}` }), t('tm.confirmBuyX', { price: fmt(price), wage: fmt(salaryFor(p.ovr)) }), t('tm.signBtn'), () => {
        const res = act(buyPlayer, d.id);
        if (res?.ok) { toast(res.message); setUi({ sheet: { type: 'player', id: d.id } }); }
      }, false);
    },
    'show-offers': d => setUi({ sheet: { type: 'offers', id: d.id } }),
    'accept-offer': d => {
      const p = store.game.players[d.id];
      const c = store.game.clubs[d.club];
      askConfirm(t('tm.confirmSell', { name: p.last, club: c.name }), t('tm.confirmSellX'), t('tm.sellBtn'), () => {
        const res = act(acceptOffer, d.id, d.club);
        if (res?.ok) toast(res.message);
      });
    }
  };
}
