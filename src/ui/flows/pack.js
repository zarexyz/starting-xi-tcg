// =============================================================================
// Pack-Öffnung: versiegelt → aufreißen → Karten aufdecken → einen Spieler wählen
// =============================================================================

import { cardHtml, cardBackHtml } from '../components/card.js';
import { icon } from '../icons.js';
import { esc } from '../html.js';
import { itemDef, PACKS } from '../../engine/packs.js';
import { TIERS, POSITION_NAMES, POS_LABEL } from '../../engine/constants.js';
import { t } from '../../i18n/index.js';
import { pendingTitle } from '../text.js';

const PACK_LOOK = {
  starter: { a: '#1f7a4d', b: '#0b3b24', sub: 'packart.starter' },
  star: { a: '#9ca3af', b: '#374151', sub: 'packart.star' },
  talent: { a: '#c27a3e', b: '#5b2e10', sub: 'packart.pick' },
  scout: { a: '#3a7bd5', b: '#132e5c', sub: 'packart.pick' },
  elite: { a: '#e7b43b', b: '#7a4f06', sub: 'packart.pick' },
  gear: { a: '#7c3aed', b: '#2e1065', sub: 'packart.items' }
};

export function packArt(key, size = 'lg') {
  const look = PACK_LOOK[key] || PACK_LOOK.scout;
  return `<div class="pack pack--${size}" style="--pa:${look.a};--pb:${look.b}">
    <div class="pack__crimp pack__crimp--top"></div>
    <div class="pack__tear" data-tear><span>${icon('chevronRight')}${icon('chevronRight')}${icon('chevronRight')}</span></div>
    <div class="pack__face">
      <span class="pack__emblem">${icon(key === 'gear' ? 'dumbbell' : 'ball')}</span>
      <b class="pack__name">${esc(t(`pack.${PACK_LOOK[key] ? key : 'scout'}.name`))}</b>
      <span class="pack__sub">${esc(t(look.sub))}</span>
    </div>
    <div class="pack__crimp pack__crimp--bottom"></div>
  </div>`;
}

function packKeyFor(pending) {
  if (pending.type === 'starter') return 'starter';
  return pending.source;
}

/** Vollbild-Ansicht für ein offenes Pack */
export function packFlow(game, ui) {
  const pending = game.pending;
  const p = ui.pack || { stage: 'sealed', flipped: [] };
  const key = packKeyFor(pending);
  const club = game.clubs.user;
  const colors = club.colors;

  if (p.stage === 'sealed' && pending.type !== 'items') {
    return `<div class="fullscreen packflow"><main class="screen screen--bare packflow__stage">
      <p class="packflow__hint">${pending.type === 'starter' ? t('pf.needPlayers') : t('pf.newPack')}</p>
      <div class="packflow__pack" data-swipe-tear>${packArt(key)}</div>
      <p class="packflow__hint small">${t('pf.swipe')}</p>
      <button class="btn btn--reward btn--block" data-action="pack-tear">${t('pf.tear')}</button>
    </main></div>`;
  }

  // Starter: 18 Spieler auf einmal
  if (pending.type === 'starter' || p.stage === 'starter-reveal') {
    const ids = ui.pack?.starterIds || [];
    const players = ids.map(id => game.players[id]).filter(Boolean);
    return `<div class="fullscreen packflow"><main class="screen screen--bare">
      <h1 class="h1 packflow__title">${t('pf.squad')}</h1>
      <p class="muted">${t('pf.squadHint')}</p>
      <div class="packflow__grid">
        ${players.map((pl, i) => `<div class="flip is-flipped" style="--d:${i * 70}ms">${cardHtml(pl, { size: 'sm', colors })}</div>`).join('')}
      </div>
      <button class="btn btn--primary btn--block" data-action="pack-next">${t('pf.toStar')}</button>
    </main></div>`;
  }

  if (pending.type === 'items') {
    return `<div class="fullscreen packflow"><main class="screen screen--bare">
      <h1 class="h1 packflow__title">${esc(pendingTitle(pending))}</h1>
      <div class="packflow__items">
        ${pending.items.map((it, i) => itemCard(it, i)).join('')}
      </div>
      <button class="btn btn--primary btn--block" data-action="pack-items-done">${t('pf.packUp')}</button>
    </main></div>`;
  }

  // Draft: 1 aus 3
  const flipped = p.flipped || [];
  const allFlipped = flipped.length >= pending.candidates.length;
  const choice = p.choice ?? null;
  const chosen = choice != null ? pending.candidates[choice] : null;
  const walkout = pending.candidates.some((c, i) => flipped.includes(i) && (c.tier === 'gold' || c.tier === 'icon'));
  return `<div class="fullscreen packflow ${walkout ? 'packflow--walkout' : ''}"><main class="screen screen--bare">
    <h1 class="h1 packflow__title">${esc(pendingTitle(pending))}</h1>
    <p class="muted">${allFlipped ? t('pf.choose') : t('pf.tapReveal')}</p>
    <div class="packflow__draft">
      ${pending.candidates.map((c, i) => {
        const isFlipped = flipped.includes(i);
        return `<button class="flip ${isFlipped ? 'is-flipped' : ''} ${choice === i ? 'is-chosen' : ''} ${isFlipped && (c.tier === 'gold' || c.tier === 'icon') ? 'is-shiny' : ''}" data-action="${isFlipped ? 'pack-choose' : 'pack-flip'}" data-index="${i}" aria-label="${isFlipped ? t('pf.pickName', { name: `${c.first} ${c.last}` }) : t('pf.reveal')}">
          <span class="flip__inner">
            <span class="flip__back">${cardBackHtml('sm', c.tier === 'bronze' ? 'bronze' : c.tier)}</span>
            <span class="flip__front">${cardHtml(c, { size: 'sm', colors })}</span>
          </span>
        </button>`;
      }).join('')}
    </div>
    ${!allFlipped ? `<button class="btn btn--secondary btn--block" data-action="pack-flip-all">${t('pf.revealAll')}</button>` : ''}
    ${chosen ? draftDetail(chosen, colors) : allFlipped ? `<p class="small muted packflow__center">${t('pf.tapDetail')}</p>` : ''}
  </main></div>`;
}

function draftDetail(p, colors) {
  const tier = TIERS[p.tier];
  const potText = `${p.potentialGuess[0]}–${p.potentialGuess[1]}`;
  return `<section class="draft-detail">
    <div class="draft-detail__card">${cardHtml(p, { size: 'md', colors })}</div>
    <div class="draft-detail__facts">
      <div class="h3">${esc(p.first)} ${esc(p.last)}</div>
      <div class="small muted">${POSITION_NAMES[p.position]}${p.secondary.length ? `, ${t('pf.also', { list: p.secondary.map(s => POS_LABEL[s]).join(', ') })}` : ''}</div>
      <dl class="facts">
        <div><dt>${t('pf.ovrNow')}</dt><dd class="display">${p.ovr}</dd></div>
        <div><dt>${t('pf.scoutPot')}</dt><dd class="display">${potText}</dd></div>
        <div><dt>${t('pf.age')}</dt><dd class="display">${p.age}</dd></div>
        <div><dt>${t('pf.tier')}</dt><dd>${tier.name}</dd></div>
      </dl>
      <p class="small">${p.age >= 27 ? t('pf.veteran') : p.age <= 19 ? t('pf.raw') : t('pf.prime')}</p>
    </div>
    <button class="btn btn--primary btn--block" data-action="pack-confirm">${icon('check')}${t('pf.sign', { name: esc(p.last) })}</button>
  </section>`;
}

export function itemCard(item, i = 0, opts = {}) {
  const c = itemDef(item);
  const tag = opts.action ? 'button' : 'div';
  return `<${tag} class="item-card tier-${c.rarity}" style="--d:${i * 120}ms" ${opts.action ? `type="button" data-action="${opts.action}" data-id="${opts.id}"` : ''}>
    <span class="item-card__icon">${icon(c.icon)}</span>
    <span class="item-card__body">
      <b>${esc(c.name)}</b>
      <span>${esc(c.desc)}</span>
    </span>
    ${opts.count ? `<span class="item-card__count">${opts.count}×</span>` : ''}
  </${tag}>`;
}

export { PACKS };
