// =============================================================================
// Mannschaft: Kapitän und Vize, Rückennummern, Vorstellung zum Spielstart
// =============================================================================

import { portraitSvg } from '../components/portrait.js';
import { flagSvg } from '../components/flag.js';
import { icon } from '../icons.js';
import { esc } from '../html.js';
import { clubPlayers } from '../../engine/world.js';
import { POS_LABEL, POSITION_NAMES, POSITION_GROUP, ATTR_NAMES } from '../../engine/constants.js';
import { characterOf, captainScore, MAX_NUMBER } from '../../engine/identity.js';
import { t } from '../../i18n/index.js';

const GROUPS = ['GK', 'DEF', 'MID', 'ATT'];
const POS_ORDER = ['TW', 'LV', 'IV', 'RV', 'ZDM', 'ZM', 'ZOM', 'LM', 'RM', 'LF', 'ST', 'RF'];

/** Binde als kleines Abzeichen (C oder V), leer für alle anderen */
export function armbandBadge(game, id) {
  const role = game.user.captain === id ? 'C' : game.user.vice === id ? 'V' : null;
  return role ? `<span class="armband armband--${role}" title="${role === 'C' ? t('cap.captain') : t('cap.vice')}">${role}</span>` : '';
}

/** Rückennummer als kleine Nummer vor dem Namen */
export function numberTag(p) {
  return p.clubId === 'user' && p.number ? `<span class="pnum">${p.number}</span>` : '';
}

function candidateRow(game, p) {
  const colors = game.clubs.user.colors;
  const isC = game.user.captain === p.id;
  const isV = game.user.vice === p.id;
  return `<li class="row cap-row">
    <button class="cap-row__who" data-action="open-player" data-id="${p.id}">
      <span class="prow__face tier-${p.tier}" style="--club:${colors.primary}">${portraitSvg(p, { colors })}</span>
      <span class="row__main">
        <span class="row__title">${numberTag(p)}${esc(p.first[0])}. ${esc(p.last)}</span>
        <span class="row__sub">${POS_LABEL[p.position]}, ${t('w.ageShort', { age: p.age })}, ${ATTR_NAMES.men} ${p.attrs.men}</span>
      </span>
    </button>
    <button class="cap-pick ${isC ? 'is-on' : ''}" data-action="set-armband" data-id="${p.id}" data-role="C" aria-pressed="${isC}" aria-label="${t('cap.setC')}" title="${t('cap.setC')}">C</button>
    <button class="cap-pick ${isV ? 'is-on' : ''}" data-action="set-armband" data-id="${p.id}" data-role="V" aria-pressed="${isV}" aria-label="${t('cap.setV')}" title="${t('cap.setV')}">V</button>
  </li>`;
}

/** Auswahl für Kapitän und Vize; limit = Anzahl der Vorschläge (sonst alle) */
export function captainList(game, limit = 0) {
  let squad = clubPlayers(game, 'user').sort((a, b) => captainScore(b) - captainScore(a));
  if (limit) {
    const top = squad.slice(0, limit);
    // Wer gerade die Binde trägt, bleibt immer sichtbar
    for (const id of [game.user.captain, game.user.vice]) {
      const p = game.players[id];
      if (p && !top.includes(p)) top.push(p);
    }
    squad = top;
  }
  return `<ul class="list panel panel--flush cap-list">${squad.map(p => candidateRow(game, p)).join('')}</ul>`;
}

export function captainSheetBody(game) {
  return `<p class="small muted">${t('cap.sheetHint')}</p>${captainList(game)}`;
}

/** Block im Kader: wer trägt die Binde, mit Knopf zum Ändern */
export function captainPanel(game) {
  const c = game.players[game.user.captain];
  const v = game.players[game.user.vice];
  if (!c) return '';
  const one = (p, role) => p ? `<button class="cap-panel__p" data-action="open-player" data-id="${p.id}">
      <span class="prow__face tier-${p.tier}" style="--club:${game.clubs.user.colors.primary}">${portraitSvg(p, { colors: game.clubs.user.colors })}</span>
      <span><small class="muted">${role === 'C' ? t('cap.captain') : t('cap.vice')}</small><b>${numberTag(p)}${esc(p.last)}</b></span>
    </button>` : '';
  return `<section class="section section--tight">
    <div class="section__head"><h2 class="section__title">${t('cap.panel')}</h2>
      <button class="link" data-action="open-captain">${t('cap.change')}</button></div>
    <div class="panel cap-panel">${one(c, 'C')}${one(v, 'V')}</div>
  </section>`;
}

/** Nummernwahl für einen Spieler */
export function numberSheetBody(game, id) {
  const p = game.players[id];
  if (!p) return '';
  const holders = {};
  for (const x of clubPlayers(game, 'user')) if (x.number) holders[x.number] = x;
  const cells = [];
  const nums = [...Array.from({ length: 50 }, (_, i) => i + 1), 77, 88, MAX_NUMBER];
  for (const n of nums) {
    const h = holders[n];
    const own = h && h.id === id;
    cells.push(`<button class="numcell ${own ? 'is-own' : h ? 'is-taken' : ''}" data-action="set-number" data-id="${id}" data-n="${n}" ${own ? 'aria-pressed="true"' : ''} title="${h && !own ? esc(t('num.swap', { name: h.last })) : ''}"><b>${n}</b>${h && !own ? `<small>${esc(h.last.slice(0, 6))}</small>` : ''}</button>`);
  }
  return `<p class="small muted">${t('num.hint', { name: esc(p.last) })}</p><div class="numgrid">${cells.join('')}</div>`;
}

// -----------------------------------------------------------------------------
// Vorstellung der Mannschaft beim Start
// -----------------------------------------------------------------------------

export function meetPages(game, ids) {
  const players = ids.map(id => game.players[id]).filter(Boolean);
  const pages = GROUPS.map(g => ({ type: 'group', g, list: players.filter(p => POSITION_GROUP[p.position] === g) })).filter(p => p.list.length);
  pages.push({ type: 'captain' });
  return pages;
}

function meetCard(game, p) {
  const colors = game.clubs.user.colors;
  const ch = characterOf(p);
  return `<li><button class="meet-card tier-${p.tier}" data-action="open-player" data-id="${p.id}">
    <span class="meet-card__face" style="--club:${colors.primary}">${portraitSvg(p, { colors })}<b class="meet-card__num">${p.number || ''}</b></span>
    <span class="meet-card__main">
      <b class="meet-card__name"><small>${esc(p.first)}</small>${esc(p.last)}</b>
      <span class="meet-card__line">${flagSvg(p.nation, 16)}${POSITION_NAMES[p.position]}, ${t('w.ageShort', { age: p.age })}</span>
      <span class="meet-card__text">${esc(t(ch.key, ch.params))}</span>
    </span>
    <span class="meet-card__ovr tier-${p.tier}">${p.ovr}</span>
  </button></li>`;
}

export function meetFlow(game, ui) {
  const ids = ui.pack?.starterIds || [];
  const pages = meetPages(game, ids);
  const i = Math.max(0, Math.min(pages.length - 1, ui.pack?.meet || 0));
  const page = pages[i];
  const last = i === pages.length - 1;
  const dots = pages.map((_, k) => `<span class="meet__dot ${k === i ? 'is-on' : k < i ? 'is-done' : ''}"></span>`).join('');
  const head = page.type === 'group'
    ? `<h1 class="h1 packflow__title">${t(`meet.${page.g}`)}</h1><p class="muted">${t(`meet.${page.g}.x`)}</p>`
    : `<h1 class="h1 packflow__title">${t('meet.captainTitle')}</h1><p class="muted">${t('meet.captainHint')}</p>`;
  const body = page.type === 'group'
    ? `<ul class="meet-list" key="${i}">${page.list.sort((a, b) => POS_ORDER.indexOf(a.position) - POS_ORDER.indexOf(b.position) || b.ovr - a.ovr).map(p => meetCard(game, p)).join('')}</ul>
       <p class="xsmall muted packflow__center">${t('meet.tapHint')}</p>`
    : captainList(game, 7);
  return `<div class="fullscreen packflow"><main class="screen screen--bare meet">
    <div class="meet__top"><div class="meet__dots" aria-label="${t('meet.step', { n: i + 1, total: pages.length })}">${dots}</div>
      ${last ? '' : `<button class="link" data-action="pack-next">${t('meet.skip')}</button>`}</div>
    ${head}
    ${body}
    <div class="meet__nav">
      ${i > 0 ? `<button class="btn btn--secondary" data-action="meet-go" data-value="${i - 1}">${icon('chevronLeft')}${t('meet.back')}</button>` : ''}
      ${last ? `<button class="btn btn--primary" data-action="pack-next">${t('meet.toStar')}</button>` : `<button class="btn btn--primary" data-action="meet-go" data-value="${i + 1}">${t('meet.next')}${icon('chevronRight')}</button>`}
    </div>
  </main></div>`;
}
