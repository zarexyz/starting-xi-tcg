// =============================================================================
// Entwicklungsbericht: Wer hat zugelegt, wer baut ab?
// =============================================================================

import { cardHtml } from '../components/card.js';
import { portraitSvg } from '../components/portrait.js';
import { icon } from '../icons.js';
import { esc } from '../html.js';
import { t } from '../../i18n/index.js';
import { POS_LABEL } from '../../engine/constants.js';
import { nf1 } from '../text.js';

export function devFlow(game) {
  const r = game.devReport;
  const colors = game.clubs.user.colors;
  const changes = r.changes.map(c => ({ ...c, p: game.players[c.id] })).filter(c => c.p);
  const risers = changes.filter(c => c.delta > 0).slice(0, 3);
  const fallers = changes.filter(c => c.delta < 0);
  const sum = changes.reduce((s, c) => s + c.delta, 0);
  return `<div class="fullscreen"><main class="screen devreport">
    <p class="small muted">${esc(r.tk ? t(r.tk, r.tp) : r.title)}</p>
    <h1 class="h1">${t('dev.title')}</h1>
    <p>${sum > 0 ? t('dev.up', { n: sum }) : sum < 0 ? t('dev.down', { n: -sum }) : t('dev.same')} ${t('dev.hint')}</p>
    ${risers.length ? `<section class="section">
      <div class="section__head"><h2 class="section__title">${t('dev.risers')}</h2></div>
      <div class="devreport__cards">${risers.map(c => `<div class="devcard">
        ${cardHtml(c.p, { size: 'sm', colors })}
        <span class="devcard__delta">+${c.delta}</span>
      </div>`).join('')}</div>
    </section>` : ''}
    <section class="section">
      <div class="section__head"><h2 class="section__title">${t('dev.all')}</h2><span class="small muted">${changes.length}</span></div>
      <ul class="list panel panel--flush">${changes.map(c => `<li class="row row--button" data-action="open-player" data-id="${c.id}">
        <span class="prow__face tier-${c.p.tier}" style="--club:${colors.primary}">${portraitSvg(c.p, { colors })}</span>
        <div class="row__main"><div class="row__title">${esc(c.p.first[0])}. ${esc(c.p.last)}</div><div class="row__sub">${POS_LABEL[c.p.position]}, ${t('w.ageShort', { age: c.p.age })}, ${t('w.appsN', { n: c.apps })}${c.avg != null ? `, ${t('w.avg')} ${nf1(c.avg)}` : ''}${devReason(c) ? ` · ${devReason(c)}` : ''}</div></div>
        <span class="num devrow__from">${c.before}</span>${icon('arrowRight', 'devrow__arrow')}<b class="num">${c.after}</b>
        <span class="devrow__delta ${c.delta > 0 ? 'pos' : c.delta < 0 ? 'neg' : 'muted'}">${c.delta > 0 ? '+' : c.delta < 0 ? '−' : '±'}${Math.abs(c.delta)}</span>
      </li>`).join('')}</ul>
    </section>
    ${fallers.length ? `<p class="small muted">${t('dev.fallers', { n: fallers.length })}</p>` : ''}
    <div class="report__cta"><button class="btn btn--primary btn--block" data-action="dev-continue">${t('w.continue')}</button></div>
  </main></div>`;
}

/** Kleine Karrierekurve für das Spielerprofil */
export function historyChart(p) {
  const h = p.ovrHistory || [];
  if (h.length < 2) return '';
  const w = 300;
  const ht = 90;
  const pad = 18;
  const vals = h.map(x => x.ovr);
  const min = Math.min(...vals) - 2;
  const max = Math.max(...vals) + 2;
  const x = i => pad + (i * (w - pad * 2)) / (h.length - 1);
  const y = v => ht - pad - ((v - min) / Math.max(1, max - min)) * (ht - pad * 2);
  const pts = h.map((d, i) => `${x(i).toFixed(1)},${y(d.ovr).toFixed(1)}`).join(' ');
  return `<figure class="hist">
    <svg viewBox="0 0 ${w} ${ht}" role="img" aria-label="${t('dev.chart', { from: h[0].ovr, to: h[h.length - 1].ovr })}">
      <polyline points="${pts}" fill="none" stroke="var(--pitch)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      ${h.map((d, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(d.ovr).toFixed(1)}" r="${i === h.length - 1 ? 4.5 : 3}" fill="${i === h.length - 1 ? 'var(--pitch)' : 'var(--paper)'}" stroke="var(--pitch)" stroke-width="2"/>`).join('')}
      <text x="${x(0)}" y="${ht - 3}" font-size="10" fill="var(--ink-3)" text-anchor="start">S${h[0].s}</text>
      <text x="${x(h.length - 1)}" y="${ht - 3}" font-size="10" fill="var(--ink-3)" text-anchor="end">S${h[h.length - 1].s}</text>
      <text x="${x(h.length - 1)}" y="${(y(h[h.length - 1].ovr) - 8).toFixed(1)}" font-size="12" font-weight="700" fill="var(--ink)" text-anchor="end">${h[h.length - 1].ovr}</text>
    </svg>
  </figure>`;
}

/** Kurze Begründung: Alter, Spielzeit oder Leistung */
function devReason(c) {
  const age = c.p.age;
  if (c.delta > 0 && c.avg != null && c.avg >= 7) return t('dev.r.form');
  if (c.delta <= 0 && age <= 23 && c.share != null && c.share < 0.35) return t('dev.r.minutes');
  if (c.delta > 0 && age <= 23) return t('dev.r.talent');
  if (c.delta < 0 && age >= 30) return t('dev.r.age');
  if (c.delta < 0 && c.avg != null && c.avg < 6.2) return t('dev.r.poor');
  return '';
}
