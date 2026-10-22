// =============================================================================
// Transfermarkt: Suche, Kauf, Verkauf über Angebote
// =============================================================================

import { portraitSvg } from '../components/portrait.js';
import { crestSvg } from '../components/crest.js';
import { starsHtml, potentialStars } from '../components/card.js';
import { icon, coinIcon } from '../icons.js';
import { esc, fmt } from '../html.js';
import { searchMarket, askingPrice, willingness, buyPlayer, acceptOffer, declineOffer, bidLow, counterOffer, acceptCounter, listPlayer, unlistPlayer, offersFor, transferWindow, LIST_LEVELS } from '../../engine/market.js';
import { contractDemand, demandFor, maxYears, extendContract, defaultYears, ensureContract, wageOf } from '../../engine/contracts.js';
import { marketValue } from '../../engine/player.js';
import { POSITION_GROUP } from '../../engine/constants.js';
import { salaryFor } from '../../engine/player.js';
import { LEAGUE_INFO } from '../../engine/world.js';
import { MAX_SQUAD, POS_LABEL } from '../../engine/constants.js';
import { t } from '../../i18n/index.js';

const PAGE = 20;
const GROUPS = ['ALL', 'GK', 'DEF', 'MID', 'ATT'];
const GROUP_POS = { GK: ['TW'], DEF: ['IV', 'LV', 'RV'], MID: ['ZDM', 'ZM', 'ZOM', 'LM', 'RM'], ATT: ['LF', 'RF', 'ST'] };
const SORTS = ['ovr', 'pot', 'age', 'price'];

export function transfersView(game, ui) {
  const f = { group: 'ALL', sort: 'ovr', affordable: false, onlyWilling: true, tier: 0, page: 0, ...(ui.market || {}) };
  const list = searchMarket(game, { ...f, tier: f.tier || null });
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const page = Math.min(f.page, pages - 1);
  const shown = list.slice(page * PAGE, page * PAGE + PAGE);
  const full = game.clubs.user.playerIds.length >= MAX_SQUAD;
  const win = transferWindow(game);
  return `
    ${windowBanner(game, win)}
    ${myTransfers(game)}
    <div class="mfilter">
      <div class="chips-scroll">${GROUPS.map(k => `<button class="chip ${f.group === k ? 'chip--pitch' : ''}" data-action="mkt-set" data-key="group" data-value="${k}" aria-pressed="${f.group === k}">${k === 'ALL' ? t('tm.all') : t(`group.${k}`)}</button>`).join('')}</div>
      ${GROUP_POS[f.group] && GROUP_POS[f.group].length > 1 ? `<div class="chips-scroll chips-scroll--sub">${['', ...GROUP_POS[f.group]].map(k => `<button class="chip chip--sm ${(f.pos || '') === k ? 'chip--pitch' : ''}" data-action="mkt-set" data-key="pos" data-value="${k}" aria-pressed="${(f.pos || '') === k}">${k ? POS_LABEL[k] : t('tm.allPos')}</button>`).join('')}</div>` : ''}
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

function windowBanner(game, win) {
  return win.open
    ? `<div class="window-banner is-open">${icon('swap')}<span>${t('tw.open', { n: win.left })}</span></div>`
    : `<div class="window-banner is-closed">${icon('alert')}<span>${t('tw.closed')}</span></div>`;
}

/** Eigene Transferliste und offene Angebote */
function myTransfers(game) {
  const listings = Object.entries(game.user.listings || {}).filter(([id]) => game.players[id]?.clubId === 'user');
  const offers = game.user.offers || [];
  if (!listings.length && !offers.length) return '';
  const ids = [...new Set([...listings.map(([id]) => id), ...offers.map(o => o.playerId)])];
  return `<section class="section section--tight">
    <div class="section__head"><h2 class="section__title">${t('tw.mine')}</h2></div>
    <ul class="list panel panel--flush">${ids.map(id => {
      const p = game.players[id];
      if (!p) return '';
      const l = game.user.listings?.[id];
      const n = offers.filter(o => o.playerId === id).length;
      return `<li><button class="row row--button" data-action="open-sell" data-id="${id}">
        <span class="row__main"><span class="row__title">${esc(p.first[0])}. ${esc(p.last)} <small class="muted">${POS_LABEL[p.position]}, ${p.ovr}</small></span>
        <span class="row__sub">${l ? t('tw.listedFor', { n: fmt(l.price) }) : t('tw.notListed')}</span></span>
        ${n ? `<span class="chip chip--reward">${t('tw.offersN', { n })}</span>` : `<span class="xsmall muted">${t('tw.waiting')}</span>`}
      </button></li>`;
    }).join('')}</ul>
  </section>`;
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
  const low = Math.round((price * 0.85) / 10) * 10;
  const will = willingness(game, p);
  const win = transferWindow(game);
  const coins = game.clubs.user.coins;
  const full = game.clubs.user.playerIds.length >= MAX_SQUAD;
  const counter = counterOffer(game, p.id);
  const reason = !win.open ? t('err.windowClosed') : !will.ok ? will.reason : full ? t('tm.fullMax', { max: MAX_SQUAD }) : coins < low ? t('tm.missing', { n: low - coins }) : '';
  const years = defaultYears(p.age);
  return `<section class="buybox">
    <div class="buybox__row"><span>${t('tm.fee')}</span><b class="display">${fmt(price)}</b></div>
    <div class="buybox__row"><span>${t('ct.demand')}</span><b>${fmt(contractDemand(game, p))} <small class="muted">${t('ct.perDay')}</small></b></div>
    <div class="buybox__row"><span>${t('ct.length')}</span><b>${t('ct.untilS', { s: game.season + years - 1 })}</b></div>
    ${reason ? `<p class="small neg">${esc(reason)}</p>` : ''}
    ${counter && !reason ? counter.amount
      ? `<p class="small">${t('tm.counterIs', { n: fmt(counter.amount) })}</p><button class="btn btn--reward btn--block" data-action="accept-counter" data-id="${p.id}" ${coins < counter.amount ? 'disabled' : ''}>${coinIcon()}${t('tm.acceptCounter', { price: fmt(counter.amount) })}</button>`
      : `<p class="small neg">${t('tm.refused')}</p>` : ''}
    <button class="btn btn--reward btn--block" data-action="buy-player" data-id="${p.id}" ${reason || coins < price ? 'disabled' : ''}>${coinIcon()}${t('tm.signFor', { price: fmt(price) })}</button>
    <button class="btn btn--secondary btn--block" data-action="bid-low" data-id="${p.id}" ${reason || counter ? 'disabled' : ''}>${t('tm.bidLow', { price: fmt(low) })}</button>
  </section>`;
}

/** Verkaufs-Knopf im Profil eines eigenen Spielers */
export function transferSheetButtons(game, p) {
  const n = offersFor(game, p.id).length;
  const listed = !!game.user.listings?.[p.id];
  return `<button class="btn btn--secondary" data-action="open-sell" data-id="${p.id}">${icon('coins')}${listed || n ? t('tm.sellStatus', { n }) : t('tm.sell')}</button>`;
}

/** Verkaufen: Transferliste und eingegangene Angebote */
export function sellSheetBody(game, playerId) {
  const p = game.players[playerId];
  if (!p) return '';
  const win = transferWindow(game);
  const value = marketValue(p);
  const listing = game.user.listings?.[playerId];
  const offers = offersFor(game, playerId);
  const levels = Object.entries(LIST_LEVELS).map(([k, f]) => {
    const price = Math.round((value * f) / 10) * 10;
    return `<button class="list-level ${listing?.level === k ? 'is-active' : ''}" data-action="list-player" data-id="${playerId}" data-value="${k}">
      <b>${t(`tm.level.${k}`)}</b><span class="display">${fmt(price)}</span><small>${t(`tm.levelHint.${k}`)}</small>
    </button>`;
  }).join('');
  return `
    <p class="small muted">${t('tm.sellIntro', { name: `${esc(p.first)} ${esc(p.last)}`, value: fmt(value) })}</p>
    ${!win.open ? `<div class="window-banner is-closed">${icon('alert')}<span>${t('tw.closed')}</span></div>` : ''}
    ${offers.length ? `<h3 class="h3">${t('tm.offersIn')}</h3><ul class="list panel panel--flush">${offers.map(o => {
      const c = game.clubs[o.clubId];
      return `<li class="row offer-row">
        ${crestSvg(c, 32)}
        <div class="row__main"><button class="link-club row__title" data-action="open-club" data-id="${c.id}"><span>${esc(c.name)}</span></button>
          <div class="row__sub">${LEAGUE_INFO[c.tier].name}${o.unsolicited ? ` · ${t('tm.unsolicited')}` : ''} · ${t('tm.validDays', { n: Math.max(1, 3 - (game.dayIndex - o.day)) })}</div></div>
        <div class="offer-row__btns">
          <button class="btn btn--sm btn--reward" data-action="accept-offer" data-offer="${o.id}" ${win.open ? '' : 'disabled'}>${coinIcon()}${fmt(o.amount)}</button>
          <button class="btn btn--sm btn--ghost" data-action="decline-offer" data-offer="${o.id}">${t('tm.decline')}</button>
        </div>
      </li>`;
    }).join('')}</ul>` : ''}
    <h3 class="h3">${listing ? t('tm.listedAs') : t('tm.listAs')}</h3>
    <div class="list-levels">${levels}</div>
    <p class="xsmall muted">${t('tm.listHint')}</p>
    ${listing ? `<button class="btn btn--ghost btn--block" data-action="unlist-player" data-id="${playerId}">${icon('close')}${t('tm.unlist')}</button>` : ''}
    <button class="btn btn--ghost btn--block" data-action="open-player" data-id="${playerId}">${icon('chevronLeft')}${t('tm.toProfile')}</button>
  `;
}

/** Vertrag verlängern: Laufzeit wählen, Forderung sehen */
export function contractSheetBody(game, playerId) {
  const p = game.players[playerId];
  if (!p) return '';
  const c = ensureContract(game, p);
  const max = maxYears(p.age);
  const opts = Array.from({ length: max }, (_, i) => i + 1).map(y => {
    const wage = demandFor(game, p, y);
    const diff = wage - c.wage;
    return `<button class="list-level" data-action="extend-contract" data-id="${playerId}" data-value="${y}">
      <b>${t('ct.yearsN', { n: y })}</b><span class="display">${fmt(wage)}</span>
      <small>${t('ct.untilS', { s: game.season + y })} · <span class="${diff > 0 ? 'neg' : 'pos'}">${diff > 0 ? '+' : ''}${fmt(diff)}</span></small>
    </button>`;
  }).join('');
  return `
    <dl class="facts facts--2">
      <div><dt>${t('ct.current')}</dt><dd class="display">${fmt(c.wage)}</dd></div>
      <div><dt>${t('ct.until')}</dt><dd class="display">${t('ct.endOf', { s: c.until })}</dd></div>
    </dl>
    <p class="small muted">${t('ct.intro', { name: esc(p.last) })}</p>
    ${p.contractDiscount ? `<p class="small pos">${icon('clipboard')}${t('ct.discount')}</p>` : ''}
    <div class="list-levels">${opts}</div>
    ${p.age >= 31 ? `<p class="xsmall muted">${t('ct.ageLimit')}</p>` : ''}
    <button class="btn btn--ghost btn--block" data-action="open-player" data-id="${playerId}">${icon('chevronLeft')}${t('tm.toProfile')}</button>
  `;
}

export function transferHandlers({ act, setUi, toast, askConfirm, store }) {
  const setMarket = patch => setUi({ market: { ...(store.ui.market || {}), page: 0, ...patch } });
  return {
    'mkt-set': d => setMarket({ [d.key]: d.key === 'tier' ? Number(d.value) : d.value, ...(d.key === 'group' ? { pos: '' } : {}) }),
    'mkt-toggle': d => {
      const cur = { affordable: false, onlyWilling: true, ...(store.ui.market || {}) };
      setMarket({ [d.key]: !cur[d.key] });
    },
    'mkt-page': d => { setUi({ market: { ...(store.ui.market || {}), page: Number(d.value) } }); window.scrollTo(0, 0); },
    'buy-player': d => {
      const p = store.game.players[d.id];
      const price = askingPrice(store.game, p);
      askConfirm(t('tm.confirmBuy', { name: `${p.first} ${p.last}` }), t('tm.confirmBuyX', { price: fmt(price), wage: fmt(contractDemand(store.game, p)) }), t('tm.signBtn'), () => {
        const res = act(buyPlayer, d.id);
        if (res?.ok) { toast(res.message); setUi({ sheet: { type: 'player', id: d.id } }); }
      }, false);
    },
    'bid-low': d => {
      const res = act(bidLow, d.id);
      if (!res || res.error) return;
      toast(res.outcome === 'accepted' ? res.message : res.message);
      if (res.outcome === 'accepted') setUi({ sheet: { type: 'player', id: d.id } });
    },
    'accept-counter': d => {
      const res = act(acceptCounter, d.id);
      if (res?.ok) { toast(res.message); setUi({ sheet: { type: 'player', id: d.id } }); }
    },
    'open-sell': d => setUi({ sheet: { type: 'sell', id: d.id } }),
    'list-player': d => {
      const res = act(listPlayer, d.id, d.value);
      if (res?.ok) toast(res.message);
    },
    'unlist-player': d => { act(unlistPlayer, d.id); },
    'accept-offer': d => {
      const o = (store.game.user.offers || []).find(x => x.id === d.offer);
      if (!o) return;
      const p = store.game.players[o.playerId];
      const c = store.game.clubs[o.clubId];
      askConfirm(t('tm.confirmSell', { name: p.last, club: c.name }), t('tm.confirmSellX'), t('tm.sellBtn'), () => {
        const res = act(acceptOffer, d.offer);
        if (res?.ok) { toast(res.message); setUi({ sheet: null }); }
      });
    },
    'decline-offer': d => {
      const res = act(declineOffer, d.offer);
      if (res?.ok) toast(res.message);
    },
    'open-contract': d => setUi({ sheet: { type: 'contract', id: d.id } }),
    'extend-contract': d => {
      const p = store.game.players[d.id];
      const wage = demandFor(store.game, p, Number(d.value));
      askConfirm(t('ct.confirm', { name: p.last }), t('ct.confirmX', { n: fmt(wage), s: store.game.season + Number(d.value) }), t('ct.sign'), () => {
        const res = act(extendContract, d.id, Number(d.value));
        if (res?.ok) { toast(t('ct.done', { name: p.last })); setUi({ sheet: { type: 'player', id: d.id } }); }
      }, false);
    }
  };
}
