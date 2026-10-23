// =============================================================================
// Training als Dauerplan (v1.11): Plan-Kacheln und Kader-Bereich „Training“
// =============================================================================
import { t } from '../../i18n/index.js';
import { icon } from '../icons.js';
import { fmt } from '../html.js';
import { PLAN_KEYS, planCost } from '../../engine/clublife.js';
import { coachSuggestion } from '../../engine/extras.js';

/** Plan-Kacheln mit Vor- und Nachteil */
export function planBody(game) {
  const cur = game.user.plan || 'normal';
  const tiles = PLAN_KEYS.map(key => {
    const cost = planCost(game, key);
    const poor = cost > game.clubs.user.coins;
    return `<button class="style-tile plan-tile ${cur === key ? 'is-active' : ''}" data-action="set-plan" data-value="${key}" aria-pressed="${cur === key}" ${poor ? 'aria-disabled="true"' : ''}>
      <b>${t(`plan.${key}`)}</b>
      <span class="small">${t(`plan.${key}.d`, { n: fmt(cost) })}</span>
    </button>`;
  }).join('');
  return `<div class="style-grid plan-grid">${tiles}</div>
    <p class="xsmall muted">${t('plan.hint')}</p>`;
}

/** Einklappbarer Bereich im Kader: aktueller Plan, Plan-Kacheln, Empfehlung des Co-Trainers */
export function trainingSection(game, ui) {
  if (!game.user.setup) return '';
  const open = !!ui.trainOpen;
  const cur = game.user.plan || 'normal';
  const sug = coachSuggestion(game).plan;
  const rec = sug !== cur
    ? `<div class="coach-tip">
        <div class="coach-tip__text"><b>${t('train.coachRec', { plan: t(`plan.${sug}`) })}</b></div>
        <button class="btn btn--sm btn--secondary" data-action="coach-plan">${t('coach.apply')}</button>
      </div>`
    : '';
  return `<section class="section fold ${open ? 'is-open' : ''}">
    <button class="fold__head" data-action="train-fold" aria-expanded="${open}">
      <span class="fold__text"><b>${t('plan.title')}</b><span class="small muted">${t('train.current', { plan: t(`plan.${cur}`) })}</span></span>
      ${icon(open ? 'chevronUp' : 'chevronDown')}
    </button>
    ${open ? `<div class="fold__body">${planBody(game)}</div>` : ''}
    ${rec}
  </section>`;
}
