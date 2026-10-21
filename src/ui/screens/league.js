// =============================================================================
// Liga: Tabellen aller sechs Ligen, eigener Spielplan, Pokal, Final Four
// =============================================================================

import { topbar, segmented, formHtml } from '../shell.js';
import { crestSvg } from '../components/crest.js';
import { icon } from '../icons.js';
import { esc } from '../html.js';
import { computeTable, CUP_ROUND_NAMES, matchWinner } from '../../engine/schedule.js';
import { LEAGUE_INFO } from '../../engine/world.js';
import { statsView } from './stats.js';

function tableView(game, tier) {
  const table = computeTable(game, tier);
  const rows = table.map(r => {
    const c = game.clubs[r.clubId];
    const zone = r.pos <= 4 ? 'zone-ff' : r.pos >= 9 && tier < 6 ? 'zone-down' : '';
    return `<tr class="${r.clubId === 'user' ? 'is-me' : ''} ${zone}" data-action="open-club" data-id="${r.clubId}">
      <td class="t-pos">${r.pos}</td>
      <td class="t-club">${crestSvg(c, 22)}<span>${esc(c.name)}</span></td>
      <td class="num">${r.p}</td>
      <td class="num t-wdl">${r.w}-${r.d}-${r.l}</td>
      <td class="num t-gd">${r.gd > 0 ? '+' : ''}${r.gd}</td>
      <td class="num t-pts"><b>${r.pts}</b></td>
    </tr>`;
  }).join('');
  return `
    <div class="league-picker">${[1, 2, 3, 4, 5, 6].map(t => `<button class="chip ${t === tier ? 'chip--pitch' : ''}" data-action="league-tier" data-value="${t}" aria-pressed="${t === tier}">${LEAGUE_INFO[t].short}${t === game.clubs.user.tier ? ' ★' : ''}</button>`).join('')}</div>
    <h2 class="section__title league-name">${LEAGUE_INFO[tier].name}</h2>
    <div class="panel panel--flush">
      <table class="table table--full">
        <thead><tr><th>#</th><th>Verein</th><th class="num">Sp</th><th class="num">S-U-N</th><th class="num">Diff</th><th class="num">Pkt</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <p class="xsmall muted legend"><span class="legend__ff"></span>Final Four${tier > 1 ? ' (Halbfinalsieger steigen auf)' : ' um die Meisterschaft'}${tier < 6 ? ' <span class="legend__down"></span>Abstieg' : ''}</p>
  `;
}

function resultClass(m, me) {
  const w = matchWinner(m);
  if (m.hg == null || (m.home !== me && m.away !== me)) return '';
  if (!w) return 'res-d';
  return w === me ? 'res-w' : 'res-l';
}

function fixtureRow(game, m, label) {
  const home = game.clubs[m.home];
  const away = game.clubs[m.away];
  const done = m.hg != null;
  return `<li class="row fixture ${m.home === 'user' || m.away === 'user' ? 'fixture--me' : ''}">
    <span class="fixture__label xsmall muted">${esc(label)}</span>
    <button class="fixture__team fixture__team--h" data-action="open-club" data-id="${home.id}">${esc(home.short)} ${crestSvg(home, 22)}</button>
    <span class="fixture__score display ${resultClass(m, 'user')}">${done ? `${m.hg}:${m.ag}${m.pens ? `<small>${m.pens.h}:${m.pens.a} i.E.</small>` : ''}` : '–:–'}</span>
    <button class="fixture__team" data-action="open-club" data-id="${away.id}">${crestSvg(away, 22)} ${esc(away.short)}</button>
  </li>`;
}

function scheduleView(game) {
  const tier = game.clubs.user.tier;
  const fixtures = game.leagues[tier].fixtures;
  const mine = fixtures.map((round, i) => ({ m: round.find(x => x.home === 'user' || x.away === 'user'), md: i + 1 })).filter(x => x.m);
  return `<ul class="list panel panel--flush">${mine.map(x => fixtureRow(game, x.m, `${x.md}.`)).join('')}</ul>`;
}

function cupView(game) {
  const cup = game.cup;
  const rounds = Object.keys(cup.rounds).map(Number).sort((a, b) => a - b);
  const userOut = cup.userOut;
  return `
    <p class="small muted">Alle 60 Vereine, K.-o.-System. Der klassentiefere Verein hat Heimrecht. ${userOut ? `Dein Verein ist in der Runde „${CUP_ROUND_NAMES[userOut]}“ ausgeschieden.` : cup.winner === 'user' ? 'Du hast den Pokal gewonnen!' : 'Dein Verein ist noch dabei.'}</p>
    ${rounds.slice().reverse().map(r => {
      const ms = cup.rounds[r];
      const mine = ms.filter(m => m.home === 'user' || m.away === 'user');
      const others = ms.filter(m => !(m.home === 'user' || m.away === 'user'));
      const shown = [...mine, ...others.slice(0, r >= 4 ? others.length : 5)];
      return `<section class="section section--tight">
        <div class="section__head"><h3 class="h3">${CUP_ROUND_NAMES[r]}</h3><span class="small muted">${ms.length} ${ms.length === 1 ? 'Spiel' : 'Spiele'}</span></div>
        <ul class="list panel panel--flush">${shown.map(m => fixtureRow(game, m, '')).join('')}</ul>
      </section>`;
    }).join('')}
    ${cup.winner ? `<p class="h3">Pokalsieger: <button class="link-club" data-action="open-club" data-id="${cup.winner}">${crestSvg(game.clubs[cup.winner], 22)}<span>${esc(game.clubs[cup.winner].name)}</span></button></p>` : ''}
  `;
}

function finalFourView(game) {
  const ffs = Object.values(game.finalFours);
  if (!ffs.length) {
    return `<div class="empty"><div class="h3">Noch kein Final Four</div><p>Nach dem 18. Spieltag spielen die Plätze 1–4 jeder Liga um Aufstieg und Meisterschaft.</p></div>`;
  }
  const order = [...ffs].sort((a, b) => (a.tier === game.clubs.user.tier ? -1 : b.tier === game.clubs.user.tier ? 1 : a.tier - b.tier));
  return order.map(ff => `<section class="section section--tight">
    <div class="section__head"><h3 class="h3">${LEAGUE_INFO[ff.tier].name}</h3>${ff.champion ? `<span class="chip chip--warn">${icon('trophy')}${esc(game.clubs[ff.champion].short)}</span>` : ''}</div>
    <ul class="list panel panel--flush">
      ${ff.semis.map((m, i) => fixtureRow(game, m, `HF ${i + 1}`)).join('')}
      ${ff.final ? fixtureRow(game, ff.final, 'Finale') : ''}
    </ul>
    ${ff.tier > 1 && ff.promoted.length ? `<p class="xsmall muted">Aufsteiger: ${ff.promoted.map(id => `<button class="link-club" data-action="open-club" data-id="${id}"><span>${esc(game.clubs[id].name)}</span></button>`).join(', ')}</p>` : ''}
  </section>`).join('');
}

export function leagueScreen(game, ui) {
  const view = ui.view.league || 'table';
  const tier = ui.leagueTier || game.clubs.user.tier;
  const items = [['table', 'Tabelle'], ['schedule', 'Spiele'], ['cup', 'Pokal'], ['ff', 'Final 4'], ['stats', 'Statistik']];
  let body = '';
  if (view === 'table') body = tableView(game, tier);
  if (view === 'schedule') body = scheduleView(game);
  if (view === 'cup') body = cupView(game);
  if (view === 'ff') body = finalFourView(game);
  if (view === 'stats') body = statsView(game, ui);
  return `<main class="screen">
    ${topbar(game)}
    ${segmented(items, view, 'league-view')}
    <div class="league-body">${body}</div>
  </main>`;
}

export { formHtml };
