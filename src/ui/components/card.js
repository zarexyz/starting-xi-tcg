// =============================================================================
// Spielerkarte (Pocket-Stil): großes Porträt, Talentklassen-Rahmen, Holo bei Gold/Ikone
// =============================================================================

import { CARD_ATTRS, ATTR_LABELS, TIERS, OVR_WEIGHTS } from '../../engine/constants.js';
import { portraitSvg } from './portrait.js';
import { flagSvg } from './flag.js';
import { icon } from '../icons.js';
import { esc } from '../html.js';

/** Potenzial als 1–5 Sterne (Scout-Einschätzung, nicht der exakte Wert) */
export function potentialStars(p) {
  const guess = (p.potentialGuess[0] + p.potentialGuess[1]) / 2;
  const stars = Math.max(1, Math.min(5, Math.round((guess - 52) / 8)));
  return stars;
}

export function starsHtml(n, max = 5) {
  let s = '';
  for (let i = 0; i < max; i++) s += `<span class="${i < n ? 'on' : ''}">★</span>`;
  return `<span class="stars" aria-label="${n} von ${max} Sternen">${s}</span>`;
}

function conditionClass(c) {
  if (c >= 80) return '';
  if (c >= 65) return 'bar--warn';
  return 'bar--low';
}

/**
 * size: 'lg' | 'md' | 'sm' | 'xs'
 * opts: { colors, club, action, selected, showCondition, label }
 */
export function cardHtml(p, opts = {}) {
  const size = opts.size || 'md';
  const colors = opts.colors || { primary: '#1f7a4d', secondary: '#ffffff' };
  const isGk = p.position === 'TW';
  const attrs = CARD_ATTRS[isGk ? 'gk' : 'field'];
  const tag = opts.action ? 'button' : 'div';
  const actionAttrs = opts.action ? `type="button" data-action="${opts.action}" data-id="${p.id}"${opts.data || ''}` : '';
  const injured = p.injury ? `<span class="card__badge card__badge--injury" title="Verletzt">${icon('medical')}</span>` : '';
  const sel = opts.selected ? ' is-selected' : '';
  const style = `--club:${colors.primary};--club2:${colors.secondary}`;

  if (size === 'xs') {
    return `<${tag} class="card card--xs tier-${p.tier}${sel}" style="${style}" ${actionAttrs} aria-label="${esc(p.first)} ${esc(p.last)}, ${p.position}, Stärke ${p.ovr}">
      <span class="card__art">${portraitSvg(p, { colors })}</span>
      <span class="card__ovr">${p.ovr}</span>
      ${injured}
      <span class="card__name">${esc(p.last)}</span>
      ${opts.showCondition ? `<span class="bar ${conditionClass(p.condition)}"><span style="width:${p.condition}%"></span></span>` : ''}
    </${tag}>`;
  }

  const weights = OVR_WEIGHTS[p.position] || {};
  const stats = attrs.map(a => {
    const boosted = p.tempBoost?.attr === a;
    const v = boosted ? Math.min(99, p.attrs[a] + p.tempBoost.amount) : p.attrs[a];
    return `<span class="card__stat${weights[a] ? ' is-key' : ''}${boosted ? ' is-boost' : ''}"><b>${v}</b><i>${ATTR_LABELS[a]}</i></span>`;
  }).join('');
  return `<${tag} class="card card--${size} tier-${p.tier}${sel}" style="${style}" ${actionAttrs} aria-label="${esc(p.first)} ${esc(p.last)}, ${p.position}, Stärke ${p.ovr}, ${TIERS[p.tier].name}">
    <span class="card__frame">
      <span class="card__art">
        ${portraitSvg(p, { colors })}
        <span class="card__corner">
          <span class="card__ovr">${p.ovr}</span>
          <span class="card__pos">${p.position}</span>
        </span>
        <span class="card__meta">${flagSvg(p.nation, size === 'sm' ? 16 : 20)}<span class="card__tier">${TIERS[p.tier].name}</span></span>
        ${injured}
      </span>
      <span class="card__body">
        <span class="card__name"><small>${esc(p.first)}</small>${esc(p.last)}</span>
        ${size === 'sm' ? '' : `<span class="card__stats">${stats}</span>`}
        <span class="card__foot">
          ${starsHtml(potentialStars(p))}
          <span>${p.age} J.</span>
        </span>
      </span>
      ${opts.showCondition ? `<span class="bar card__cond ${conditionClass(p.condition)}"><span style="width:${p.condition}%"></span></span>` : ''}
    </span>
  </${tag}>`;
}

export function cardBackHtml(size = 'md', tier = 'bronze') {
  return `<div class="card card--${size} card--back tier-${tier}">
    <span class="card__frame"><span class="card__backface">${icon('ball')}<b>Starting XI</b></span></span>
  </div>`;
}
