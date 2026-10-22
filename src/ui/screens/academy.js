// =============================================================================
// Verein lebt: Stimmung (Fans, Vorstand, Team), Saisonziel, Jugendakademie
// =============================================================================

import { portraitSvg } from '../components/portrait.js';
import { potentialStars, starsHtml } from '../components/card.js';
import { icon } from '../icons.js';
import { esc, fmt } from '../html.js';
import { POS_LABEL } from '../../engine/constants.js';
import { MAX_SQUAD } from '../../engine/constants.js';
import { teamMood, teamReason, trend, fanIncomeFactor, userPos, prospects, signingFee, academyCap, academyIntakeCount, ACADEMY_COSTS } from '../../engine/clublife.js';
import { t } from '../../i18n/index.js';

function moodRow(game, key, value, reasonKey, fx) {
  const tr = trend(game, key);
  const dir = tr >= 3 ? 'up' : tr <= -3 ? 'down' : 'flat';
  const tone = value < 35 ? 'bar--low' : value < 50 ? 'bar--warn' : '';
  return `<li class="mood-row">
    <div class="mood-row__head">
      <b>${t(`mood.${key}`)}</b>
      <span class="mood-row__trend mood-row__trend--${dir}">${dir === 'up' ? icon('up') : dir === 'down' ? icon('down') : ''}${t(`mood.${dir}`)}</span>
      <b class="num mood-row__val">${Math.round(value)}</b>
    </div>
    <div class="bar ${tone}" role="img" aria-label="${t(`mood.${key}`)} ${Math.round(value)} / 100"><span style="width:${value}%"></span></div>
    <p class="small muted">${esc(t(`mood.r.${key}.${reasonKey}`))} ${fx}</p>
  </li>`;
}

/** Stimmungsblock und Saisonziel für den Vereins-Überblick */
export function moodSection(game) {
  const m = game.user.mood;
  if (!m) return '';
  const pos = userPos(game);
  const goal = m.goal;
  const income = Math.round((fanIncomeFactor(game) - 1) * 100);
  return `<section class="section">
    <div class="section__head"><h2 class="section__title">${t('goal.title')}</h2></div>
    <div class="panel goal">
      <div class="goal__main"><span class="alert-dot">${icon('trophy')}</span><div><b>${esc(t(`goal.${goal.key}`))}</b>${pos ? `<div class="small muted">${t('goal.now', { pos })}</div>` : ''}</div></div>
      <p class="xsmall muted">${t('goal.hint')}</p>
    </div>
  </section>
  <section class="section">
    <div class="section__head"><h2 class="section__title">${t('mood.title')}</h2></div>
    <ul class="panel mood">
      ${moodRow(game, 'fans', m.fans, m.reason.fans, t('mood.fans.fx', { n: `${income >= 0 ? '+' : '−'}${Math.abs(income)}` }))}
      ${moodRow(game, 'board', m.board, m.reason.board, '')}
      ${moodRow(game, 'team', teamMood(game), teamReason(game), '')}
    </ul>
    <p class="xsmall muted">${t('mood.board.fx')} ${t('mood.team.fx')}</p>
  </section>`;
}

function prospectRow(game, p) {
  const colors = game.clubs.user.colors;
  const fee = signingFee(p);
  return `<li class="prospect">
    <button class="row row--button prow" data-action="open-player" data-id="${p.id}">
      <span class="prow__face tier-${p.tier}" style="--club:${colors.primary}">${portraitSvg(p, { colors })}</span>
      <span class="row__main">
        <span class="row__title">${esc(p.first[0])}. ${esc(p.last)}</span>
        <span class="row__sub">${POS_LABEL[p.position]}, ${t('w.ageShort', { age: p.age })}, ${t('acad.potential')} ${starsHtml(potentialStars(p))}</span>
      </span>
      <span class="prow__ovr tier-${p.tier}">${p.ovr}</span>
    </button>
    <div class="prospect__actions">
      <button class="btn btn--sm btn--secondary" data-action="promote-prospect" data-id="${p.id}">${t('acad.promote', { n: fmt(fee) })}</button>
      <button class="btn btn--sm btn--ghost" data-action="release-prospect" data-id="${p.id}">${t('acad.release')}</button>
    </div>
  </li>`;
}

export function academyView(game) {
  const a = game.user.academy;
  const list = prospects(game).sort((x, y) => y.ovr - x.ovr);
  const next = ACADEMY_COSTS[a.level + 1];
  const full = game.clubs.user.playerIds.length >= MAX_SQUAD;
  return `
    <section class="section">
      <div class="panel academy">
        <div class="academy__head"><span class="alert-dot">${icon('sparkles')}</span>
          <div><b>${t('acad.title')}</b><div class="small muted">${t('acad.level', { n: a.level })}</div></div>
          <div class="academy__pips" aria-hidden="true">${[1, 2, 3, 4, 5].map(n => `<i class="${n <= a.level ? 'is-on' : ''}"></i>`).join('')}</div>
        </div>
        <p class="small">${t('acad.effect', { n: academyIntakeCount(a.level), cap: academyCap(a.level) })}</p>
        <p class="xsmall muted">${t('acad.quality')}</p>
        ${next ? `<button class="btn btn--secondary btn--block" data-action="upgrade-academy" ${game.clubs.user.coins < next ? 'aria-disabled="true"' : ''}>${icon('up')}${t('acad.up', { n: fmt(next) })}</button>` : `<p class="small pos">${icon('check')}${t('acad.max')}</p>`}
      </div>
    </section>
    <section class="section">
      <div class="section__head"><h2 class="section__title">${t('acad.list')}</h2><span class="small muted">${list.length} / ${academyCap(a.level)}</span></div>
      ${list.length ? `<ul class="list panel panel--flush prospects">${list.map(p => prospectRow(game, p)).join('')}</ul>
        ${full ? `<p class="small neg">${t('acad.full')}</p>` : ''}
        <p class="xsmall muted">${t('acad.hint')}</p>` : `<div class="empty"><p>${t('acad.empty')}</p></div>`}
    </section>`;
}
