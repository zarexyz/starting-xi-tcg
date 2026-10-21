// =============================================================================
// Spieltagsübersicht nach dem Spielbericht: alle Ergebnisse + aktuelle Tabelle
// =============================================================================

import { crestSvg } from '../components/crest.js';
import { icon } from '../icons.js';
import { esc } from '../html.js';
import { currentDay, dayLabel, matchesForDay } from '../../engine/game.js';
import { computeTable } from '../../engine/schedule.js';
import { LEAGUE_INFO } from '../../engine/world.js';
import { t } from '../../i18n/index.js';

/**
 * Baut die Daten der Übersicht direkt nach dem Spieltag.
 * pre = Spielstand vor dem Spieltag, post = danach. Liefert null, wenn es nichts
 * Sinnvolles zu zeigen gibt (z. B. wenn mit dem Spieltag die Saison endete).
 */
export function buildMatchday(pre, post) {
  const day = currentDay(pre);
  if (!day || post.season !== pre.season) return null;
  const entries = matchesForDay(post, day);
  const userTier = pre.clubs.user.tier;
  let list = entries;
  if (day.type === 'league') list = entries.filter(e => e.tier === userTier);
  if (!list.length || list.some(e => e.m.hg == null)) return null;

  const name = id => {
    const p = post.players[id] || pre.players[id];
    return p ? `${p.first[0]}. ${p.last}` : '?';
  };
  const matches = list.map(e => ({
    home: e.m.home,
    away: e.m.away,
    hg: e.m.hg,
    ag: e.m.ag,
    pens: e.m.pens || null,
    tier: e.tier || null,
    scorers: (e.m.scorers || []).map(s => ({ id: s.id, side: s.side, minute: s.minute, name: name(s.id) }))
  }));
  // Eigenes Spiel nach oben, Final-Four-Spiele nach Liga gruppiert
  matches.sort((a, b) => {
    const me = m => (m.home === 'user' || m.away === 'user' ? 0 : 1);
    if (day.type.startsWith('ff')) return (a.tier - b.tier) || me(a) - me(b);
    return me(a) - me(b);
  });

  let table = null;
  if (day.type === 'league') {
    const before = computeTable(post, userTier, day.md - 1);
    const after = computeTable(post, userTier, day.md);
    const prev = Object.fromEntries(before.map(r => [r.clubId, r.pos]));
    table = after.map(r => ({ clubId: r.clubId, pos: r.pos, p: r.p, gd: r.gd, pts: r.pts, move: day.md > 1 ? prev[r.clubId] - r.pos : 0 }));
  }
  return { label: dayLabel(pre, day), type: day.type, tier: userTier, matches, table };
}

function scorerLine(m, side) {
  const list = m.scorers.filter(s => s.side === side);
  if (!list.length) return '';
  return list.map(s => `<button class="md-scorer" data-action="open-player" data-id="${s.id}">${s.minute > 90 ? '90+' : s.minute}' ${esc(s.name)}</button>`).join('');
}

function matchRow(game, m) {
  const home = game.clubs[m.home];
  const away = game.clubs[m.away];
  if (!home || !away) return '';
  const mine = m.home === 'user' || m.away === 'user';
  const hasScorers = m.scorers.length > 0;
  return `<li class="md-match ${mine ? 'md-match--me' : ''}">
    <div class="md-match__line">
      <button class="md-team md-team--h" data-action="open-club" data-id="${home.id}"><span>${esc(home.name)}</span>${crestSvg(home, 24)}</button>
      <span class="md-score display">${m.hg}:${m.ag}${m.pens ? `<small>${m.pens.h}:${m.pens.a} ${t('w.pens')}</small>` : ''}</span>
      <button class="md-team" data-action="open-club" data-id="${away.id}">${crestSvg(away, 24)}<span>${esc(away.name)}</span></button>
    </div>
    ${hasScorers ? `<div class="md-scorers"><div class="md-scorers__h">${scorerLine(m, 'home')}</div><div class="md-scorers__a">${scorerLine(m, 'away')}</div></div>` : ''}
  </li>`;
}

function tableHtml(game, d) {
  const rows = d.table.map(r => {
    const c = game.clubs[r.clubId];
    const zone = r.pos <= 4 ? 'zone-ff' : r.pos >= 9 && d.tier < 6 ? 'zone-down' : '';
    const mv = r.move > 0 ? `<span class="md-move md-move--up" title="+${r.move}">${icon('up')}</span>` :
      r.move < 0 ? `<span class="md-move md-move--down" title="${r.move}">${icon('down')}</span>` : '<span class="md-move">–</span>';
    return `<tr class="${r.clubId === 'user' ? 'is-me' : ''} ${zone}" data-action="open-club" data-id="${r.clubId}">
      <td class="t-pos">${r.pos}</td>
      <td class="t-move">${mv}</td>
      <td class="t-club">${crestSvg(c, 22)}<span>${esc(c.name)}</span></td>
      <td class="num">${r.p}</td>
      <td class="num t-gd">${r.gd > 0 ? '+' : ''}${r.gd}</td>
      <td class="num t-pts"><b>${r.pts}</b></td>
    </tr>`;
  }).join('');
  return `<section class="section">
    <div class="section__head"><h2 class="section__title">${t('md.table')}</h2></div>
    <div class="panel panel--flush">
      <table class="table table--full">
        <thead><tr><th>#</th><th></th><th>${t('tbl.club')}</th><th class="num">${t('tbl.p')}</th><th class="num">${t('tbl.gd')}</th><th class="num">${t('tbl.pts')}</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </section>`;
}

export function matchdayFlow(game, flow) {
  const d = flow.data;
  let results = '';
  if (d.type.startsWith('ff')) {
    const tiers = [...new Set(d.matches.map(m => m.tier))];
    results = tiers.map(tier => `<h3 class="md-group small muted">${esc(LEAGUE_INFO[tier].name)}</h3>
      <ul class="md-list panel panel--flush">${d.matches.filter(m => m.tier === tier).map(m => matchRow(game, m)).join('')}</ul>`).join('');
  } else {
    results = `<ul class="md-list panel panel--flush">${d.matches.map(m => matchRow(game, m)).join('')}</ul>`;
  }
  return `<div class="fullscreen"><main class="screen report matchday">
    <p class="report__label small muted">${d.type === 'league' ? esc(LEAGUE_INFO[d.tier].name) : t('md.title')}</p>
    <h1 class="h1">${esc(d.label)}</h1>
    <section class="section">
      <div class="section__head"><h2 class="section__title">${t('md.results')}</h2></div>
      ${results}
    </section>
    ${d.table ? tableHtml(game, d) : ''}
    <div class="report__cta"><button class="btn btn--primary btn--block" data-action="close-flow">${t('w.continue')}</button></div>
  </main></div>`;
}
