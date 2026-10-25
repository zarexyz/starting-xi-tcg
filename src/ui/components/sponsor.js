// =============================================================================
// Sponsoren-Karten (v1.12): große Karte für die Auswahl im Postfach und kompakte
// Plakette für Verein und Spielvorbereitung. „Alles ist eine Karte.“
// =============================================================================

import { icon } from '../icons.js';
import { esc, fmt } from '../html.js';
import { t } from '../../i18n/index.js';
import { sponsorTerms, isYouthPlayer, YOUTH_NEEDED } from '../../engine/sponsors.js';

/** Symbol je Karte */
const SPONSOR_ICON = { safety: 'shield', spectacle: 'sparkles', wall: 'shield', academy: 'up', underdog: 'flame' };

function termsHtml(terms) {
  return `<dl class="sponsor-card__terms">
    <dt>${t('sponsor.fixed')}</dt><dd class="num">${icon('coins')}${fmt(terms.base)}</dd>
    ${terms.bonus ? `<dt>${t('sponsor.bonus')}</dt><dd class="num">${icon('coins')}${fmt(terms.bonus)}</dd>` : ''}
  </dl>`;
}

/** Große Karte. Mit taskId wird sie zum Auswahlknopf der Postfach-Aufgabe. */
export function sponsorCardHtml(game, id, { taskId = null } = {}) {
  const terms = sponsorTerms(game, id);
  if (!terms) return '';
  const inner = `
    <span class="sponsor-card__head">${icon(SPONSOR_ICON[id] || 'star')}<b>${esc(t(`sponsor.${id}.name`))}</b></span>
    <span class="sponsor-card__cond">${esc(t(`sponsor.${id}.cond`))}</span>
    ${termsHtml(terms)}
    <span class="sponsor-card__d xsmall muted">${esc(t(`sponsor.${id}.d`))}</span>`;
  return taskId
    ? `<button class="sponsor-card sponsor-card--${id}" data-action="task-choice" data-id="${taskId}" data-choice="${id}">${inner}<span class="sponsor-card__cta">${t('sponsor.pick')}</span></button>`
    : `<div class="sponsor-card sponsor-card--${id}">${inner}</div>`;
}

/** Auswahl der drei Karten in der Postfach-Aufgabe */
export function sponsorChoice(game, n) {
  if (n.task?.kind !== 'sponsor' || n.task.status !== 'open') return '';
  const offers = (n.task.choices || []).map(c => c.key);
  return `<div class="sponsor-pick">${offers.map(id => sponsorCardHtml(game, id, { taskId: n.id })).join('')}</div>`;
}

/** Wie viele U21-Spieler oder Eigengewächse stehen in der Startelf */
export function youthStarters(game, setup) {
  return Object.values(setup?.lineup || {}).filter(id => isYouthPlayer(game.players[id])).length;
}

/**
 * Kompakte Plakette. opts.setup zeigt bei der Talentschmiede den Stand der Startelf,
 * opts.home blendet das Fixum aus, wenn es ein Auswärtsspiel ist.
 */
export function sponsorPlaque(game, { setup = null, home = true, open = null } = {}) {
  const sp = game.user.sponsor;
  if (!sp?.active) {
    if (!open) return '';
    return `<div class="sponsor-plaque sponsor-plaque--empty">${icon('coins')}<span>${t('sponsor.none')}</span>
      <button class="btn btn--sm btn--secondary" data-action="open-news" data-id="${open.id}">${t('sponsor.choose')}</button></div>`;
  }
  const id = sp.active;
  const terms = sponsorTerms(game, id);
  let extra = '';
  if (terms.cond === 'youth3' && setup) {
    const n = youthStarters(game, setup);
    extra = `<span class="chip ${n >= YOUTH_NEEDED ? 'chip--pitch' : 'chip--warn'}">${t('sponsor.youthNow', { n })}</span>`;
  }
  const money = [home ? `${t('sponsor.fixed')} ${fmt(terms.base)}` : '', terms.bonus ? `${t('sponsor.bonus')} ${fmt(terms.bonus)}` : ''].filter(Boolean).join(' · ');
  return `<div class="sponsor-plaque sponsor-plaque--${id}">
    ${icon(SPONSOR_ICON[id] || 'star')}
    <span class="sponsor-plaque__text"><b>${esc(t(`sponsor.${id}.name`))}</b><span class="small">${esc(t(`sponsor.${id}.cond`))}</span>${money ? `<span class="xsmall muted">${money}</span>` : ''}${extra}</span>
  </div>`;
}

/** Abschnitt im Vereins-Überblick: Karte plus Bilanz der Saison */
export function sponsorSection(game, open = null) {
  const sp = game.user.sponsor;
  const body = sp?.active
    ? `<div class="sponsor-sec">${sponsorCardHtml(game, sp.active)}
        <dl class="sponsor-sec__facts">
          <dt>${t('sponsor.season')}</dt><dd class="num">${icon('coins')}${fmt(sp.paid)}</dd>
          ${sponsorTerms(game, sp.active).bonus ? `<dt>${t('sponsor.hits')}</dt><dd class="num">${sp.hits}</dd>` : ''}
        </dl></div>`
    : sponsorPlaque(game, { open });
  if (!body) return '';
  return `<section class="section">
    <div class="section__head"><h2 class="section__title">${t('sponsor.title')}</h2></div>
    ${body}
  </section>`;
}
