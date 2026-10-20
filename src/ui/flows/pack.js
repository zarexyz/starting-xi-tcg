// =============================================================================
// Pack-Öffnung: versiegelt → aufreißen → Karten aufdecken → einen Spieler wählen
// =============================================================================

import { cardHtml, cardBackHtml } from '../components/card.js';
import { icon } from '../icons.js';
import { esc } from '../html.js';
import { CONSUMABLES, PACKS } from '../../engine/packs.js';
import { TIERS, POSITION_NAMES } from '../../engine/constants.js';

const PACK_LOOK = {
  starter: { a: '#1f7a4d', b: '#0b3b24', label: 'Starter-Pack', sub: '18 Spieler für deinen Verein' },
  star: { a: '#9ca3af', b: '#374151', label: 'Starspieler-Wahl', sub: 'Wähle 1 aus 3 Silber-Talenten' },
  talent: { a: '#c27a3e', b: '#5b2e10', label: 'Talent-Pack', sub: 'Wähle 1 aus 3' },
  scout: { a: '#3a7bd5', b: '#132e5c', label: 'Scout-Pack', sub: 'Wähle 1 aus 3' },
  elite: { a: '#e7b43b', b: '#7a4f06', label: 'Elite-Pack', sub: 'Wähle 1 aus 3' },
  gear: { a: '#7c3aed', b: '#2e1065', label: 'Ausrüstungs-Pack', sub: '3 Gegenstände' }
};

export function packArt(key, size = 'lg') {
  const look = PACK_LOOK[key] || PACK_LOOK.scout;
  return `<div class="pack pack--${size}" style="--pa:${look.a};--pb:${look.b}">
    <div class="pack__crimp pack__crimp--top"></div>
    <div class="pack__tear" data-tear><span>${icon('chevronRight')}${icon('chevronRight')}${icon('chevronRight')}</span></div>
    <div class="pack__face">
      <span class="pack__emblem">${icon(key === 'gear' ? 'dumbbell' : 'ball')}</span>
      <b class="pack__name">${esc(look.label)}</b>
      <span class="pack__sub">${esc(look.sub)}</span>
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
      <p class="packflow__hint">${pending.type === 'starter' ? 'Dein Verein braucht Spieler.' : 'Ein neues Pack wartet.'}</p>
      <div class="packflow__pack" data-swipe-tear>${packArt(key)}</div>
      <p class="packflow__hint small">Wische über den Rand oder tippe auf „Aufreißen“.</p>
      <button class="btn btn--reward btn--block" data-action="pack-tear">Aufreißen</button>
    </main></div>`;
  }

  // Starter: 18 Spieler auf einmal
  if (pending.type === 'starter' || p.stage === 'starter-reveal') {
    const ids = ui.pack?.starterIds || [];
    const players = ids.map(id => game.players[id]).filter(Boolean);
    return `<div class="fullscreen packflow"><main class="screen screen--bare">
      <h1 class="h1 packflow__title">Dein Kader</h1>
      <p class="muted">18 Amateure aus der Region. Ehrliche Arbeiter, keine Stars – noch nicht.</p>
      <div class="packflow__grid">
        ${players.map((pl, i) => `<div class="flip is-flipped" style="--d:${i * 70}ms">${cardHtml(pl, { size: 'sm', colors })}</div>`).join('')}
      </div>
      <button class="btn btn--primary btn--block" data-action="pack-next">Weiter zur Starspieler-Wahl</button>
    </main></div>`;
  }

  if (pending.type === 'items') {
    return `<div class="fullscreen packflow"><main class="screen screen--bare">
      <h1 class="h1 packflow__title">${esc(pending.title)}</h1>
      <div class="packflow__items">
        ${pending.items.map((it, i) => itemCard(it.type, i)).join('')}
      </div>
      <button class="btn btn--primary btn--block" data-action="pack-items-done">Einpacken</button>
    </main></div>`;
  }

  // Draft: 1 aus 3
  const flipped = p.flipped || [];
  const allFlipped = flipped.length >= pending.candidates.length;
  const choice = p.choice ?? null;
  const chosen = choice != null ? pending.candidates[choice] : null;
  const walkout = pending.candidates.some((c, i) => flipped.includes(i) && (c.tier === 'gold' || c.tier === 'icon'));
  return `<div class="fullscreen packflow ${walkout ? 'packflow--walkout' : ''}"><main class="screen screen--bare">
    <h1 class="h1 packflow__title">${esc(pending.title)}</h1>
    <p class="muted">${allFlipped ? 'Wähle einen Spieler. Die anderen beiden gehen woanders hin.' : 'Tippe auf eine Karte, um sie aufzudecken.'}</p>
    <div class="packflow__draft">
      ${pending.candidates.map((c, i) => {
        const isFlipped = flipped.includes(i);
        return `<button class="flip ${isFlipped ? 'is-flipped' : ''} ${choice === i ? 'is-chosen' : ''} ${isFlipped && (c.tier === 'gold' || c.tier === 'icon') ? 'is-shiny' : ''}" data-action="${isFlipped ? 'pack-choose' : 'pack-flip'}" data-index="${i}" aria-label="${isFlipped ? `${c.first} ${c.last} wählen` : 'Karte aufdecken'}">
          <span class="flip__inner">
            <span class="flip__back">${cardBackHtml('sm', c.tier === 'bronze' ? 'bronze' : c.tier)}</span>
            <span class="flip__front">${cardHtml(c, { size: 'sm', colors })}</span>
          </span>
        </button>`;
      }).join('')}
    </div>
    ${!allFlipped ? `<button class="btn btn--secondary btn--block" data-action="pack-flip-all">Alle aufdecken</button>` : ''}
    ${chosen ? draftDetail(chosen, colors) : allFlipped ? '<p class="small muted packflow__center">Tippe auf eine Karte, um sie dir genauer anzusehen.</p>' : ''}
  </main></div>`;
}

function draftDetail(p, colors) {
  const tier = TIERS[p.tier];
  const potText = `${p.potentialGuess[0]}–${p.potentialGuess[1]}`;
  return `<section class="draft-detail">
    <div class="draft-detail__card">${cardHtml(p, { size: 'md', colors })}</div>
    <div class="draft-detail__facts">
      <div class="h3">${esc(p.first)} ${esc(p.last)}</div>
      <div class="small muted">${POSITION_NAMES[p.position]}${p.secondary.length ? `, auch ${p.secondary.join(', ')}` : ''}</div>
      <dl class="facts">
        <div><dt>Stärke heute</dt><dd class="display">${p.ovr}</dd></div>
        <div><dt>Scout-Potenzial</dt><dd class="display">${potText}</dd></div>
        <div><dt>Alter</dt><dd class="display">${p.age}</dd></div>
        <div><dt>Talentklasse</dt><dd>${tier.name}</dd></div>
      </dl>
      <p class="small">${p.age >= 27 ? 'Erfahrener Spieler: hilft sofort, wird aber kaum noch besser.' : p.age <= 19 ? 'Rohdiamant: braucht Spielzeit und Geduld.' : 'Im besten Entwicklungsalter.'}</p>
    </div>
    <button class="btn btn--primary btn--block" data-action="pack-confirm">${icon('check')}${esc(p.last)} verpflichten</button>
  </section>`;
}

export function itemCard(type, i = 0, opts = {}) {
  const c = CONSUMABLES[type];
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
