// =============================================================================
// Statistik: Spieler, Vereine, eigener Verein. Alles anklickbar.
// =============================================================================

import { segmented } from '../shell.js';
import { crestSvg } from '../components/crest.js';
import { portraitSvg } from '../components/portrait.js';
import { icon } from '../icons.js';
import { esc } from '../html.js';
import { LEAGUE_INFO, clubPlayers } from '../../engine/world.js';
import { avgRating } from '../../engine/player.js';
import { t } from '../../i18n/index.js';
import { POS_LABEL } from '../../engine/constants.js';
import { nf1 } from '../text.js';


export const PLAYER_CATS = [
  ['goals', 'st.goals', p => p.stats.goals],
  ['assists', 'st.assists', p => p.stats.assists],
  ['scorer', 'st.scorer', p => p.stats.goals + p.stats.assists],
  ['rating', 'st.rating', p => (p.stats.apps >= 4 ? avgRating(p.stats) : null), nf1],
  ['motm', 'st.motm', p => p.stats.motm],
  ['clean', 'st.clean', p => (p.position === 'TW' ? p.stats.cleanSheets || 0 : null)],
  ['cards', 'st.cards', p => (p.stats.yellows || 0) + (p.stats.reds || 0) * 3, null, p => t('st.cardsSub', { y: p.stats.yellows || 0, r: p.stats.reds || 0 })]
];

export const CLUB_CATS = [
  ['home', 'st.home'],
  ['away', 'st.away'],
  ['form', 'st.form'],
  ['attack', 'st.goals'],
  ['defense', 'st.against'],
  ['poss', 'st.poss'],
  ['xg', 'st.xg'],
  ['cards', 'st.fair']
];

function tierPicker(game, tier) {
  return `<div class="league-picker">${[1, 2, 3, 4, 5, 6].map(t => `<button class="chip ${t === tier ? 'chip--pitch' : ''}" data-action="league-tier" data-value="${t}" aria-pressed="${t === tier}">${LEAGUE_INFO[t].short}${t === game.clubs.user.tier ? ' ★' : ''}</button>`).join('')}</div>`;
}

function catPicker(cats, active, action) {
  return `<div class="cat-picker">${cats.map(([k, l]) => `<button class="chip ${k === active ? 'chip--pitch' : ''}" data-action="${action}" data-value="${k}" aria-pressed="${k === active}">${t(l)}</button>`).join('')}</div>`;
}

function playerStats(game, tier, cat) {
  const def = PLAYER_CATS.find(c => c[0] === cat) || PLAYER_CATS[0];
  const [, label, value, fmtFn, sub] = def;
  const clubs = game.leagues[tier].clubIds;
  const list = clubs.flatMap(id => clubPlayers(game, id))
    .map(p => ({ p, v: value(p) }))
    .filter(x => x.v != null && x.v > 0)
    .sort((a, b) => b.v - a.v || b.p.stats.apps - a.p.stats.apps)
    .slice(0, 15);
  if (!list.length) return `<div class="empty"><p>${t('st.noValues')}</p></div>`;
  return `<ol class="list panel panel--flush statlist">${list.map((x, i) => {
    const c = game.clubs[x.p.clubId];
    return `<li><div class="row statrow ${x.p.clubId === 'user' ? 'is-me' : ''}">
      <span class="statrow__rank">${i + 1}</span>
      <button class="statrow__player" data-action="open-player" data-id="${x.p.id}">
        <span class="prow__face tier-${x.p.tier}" style="--club:${c.colors.primary}">${portraitSvg(x.p, { colors: c.colors })}</span>
        <span class="row__main"><span class="row__title">${esc(x.p.first[0])}. ${esc(x.p.last)}</span><span class="row__sub">${POS_LABEL[x.p.position]}, ${t('w.gamesN', { n: x.p.stats.apps })}${sub ? `, ${esc(sub(x.p))}` : ''}</span></span>
      </button>
      <button class="statrow__club" data-action="open-club" data-id="${c.id}" aria-label="${esc(c.name)}">${crestSvg(c, 24)}</button>
      <b class="statrow__val display">${fmtFn ? fmtFn(x.v) : x.v}</b>
    </div></li>`;
  }).join('')}</ol>
  <p class="xsmall muted">${t(cat === 'rating' ? 'st.footRating' : 'st.foot', { label: t(label) })}</p>`;
}

/** Heim-, Auswärts- oder Formtabelle aus den Ligaspielen */
function splitTable(game, tier, mode) {
  const rows = {};
  for (const id of game.leagues[tier].clubIds) rows[id] = { id, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 };
  const rounds = game.leagues[tier].fixtures.filter(r => r.some(m => m.hg != null));
  const use = mode === 'form' ? rounds.slice(-5) : rounds;
  const add = (id, gf, ga) => {
    const r = rows[id];
    if (!r) return;
    r.p++; r.gf += gf; r.ga += ga;
    if (gf > ga) { r.w++; r.pts += 3; } else if (gf === ga) { r.d++; r.pts++; } else r.l++;
  };
  for (const round of use) for (const m of round) {
    if (m.hg == null) continue;
    if (mode !== 'away') add(m.home, m.hg, m.ag);
    if (mode !== 'home') add(m.away, m.ag, m.hg);
  }
  return Object.values(rows).sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);
}

function clubStats(game, tier, cat) {
  if (cat === 'home' || cat === 'away' || cat === 'form') {
    const rows = splitTable(game, tier, cat);
    return `<div class="panel panel--flush"><table class="table table--full">
      <thead><tr><th>#</th><th>${t('tbl.club')}</th><th class="num">${t('tbl.p')}</th><th class="num">${t('tbl.wdl')}</th><th class="num">${t('st.goals')}</th><th class="num">${t('tbl.pts')}</th></tr></thead>
      <tbody>${rows.map((r, i) => {
        const c = game.clubs[r.id];
        return `<tr class="${r.id === 'user' ? 'is-me' : ''}" data-action="open-club" data-id="${r.id}">
          <td class="t-pos">${i + 1}</td><td class="t-club">${crestSvg(c, 22)}<span>${esc(c.name)}</span></td>
          <td class="num">${r.p}</td><td class="num t-wdl">${r.w}-${r.d}-${r.l}</td><td class="num">${r.gf}:${r.ga}</td><td class="num t-pts"><b>${r.pts}</b></td>
        </tr>`;
      }).join('')}</tbody></table></div>
      <p class="xsmall muted">${cat === 'form' ? t('st.last5') : t('st.leagueOnly')}</p>`;
  }
  const metric = {
    attack: [cs => cs.gf, 'st.goals', true, v => v],
    defense: [cs => cs.ga, 'st.against', false, v => v],
    poss: [cs => (cs.games ? cs.poss / cs.games : 0), 'st.possAvg', true, v => `${Math.round(v)} %`],
    xg: [cs => cs.xg, 'st.xg', true, v => nf1(v)],
    cards: [cs => cs.yellows + cs.reds * 3, 'st.cardPts', false, v => v]
  }[cat];
  const [get, label, desc, show] = metric;
  const rows = game.leagues[tier].clubIds.map(id => ({ id, cs: game.clubs[id].seasonStats })).filter(x => x.cs && x.cs.games)
    .map(x => ({ ...x, v: get(x.cs) }))
    .sort((a, b) => (desc ? b.v - a.v : a.v - b.v));
  if (!rows.length) return `<div class="empty"><p>${t('st.noGames')}</p></div>`;
  const max = Math.max(...rows.map(r => r.v), 1);
  return `<ol class="list panel panel--flush statlist">${rows.map((r, i) => {
    const c = game.clubs[r.id];
    return `<li><button class="row statrow statrow--club ${r.id === 'user' ? 'is-me' : ''}" data-action="open-club" data-id="${r.id}">
      <span class="statrow__rank">${i + 1}</span>
      ${crestSvg(c, 26)}
      <span class="row__main"><span class="row__title">${esc(c.name)}</span><span class="statbar"><span style="width:${Math.max(4, (r.v / max) * 100)}%;background:${c.colors.primary}"></span></span></span>
      <b class="statrow__val display">${show(r.v)}</b>
    </button></li>`;
  }).join('')}</ol>
  <p class="xsmall muted">${t('st.foot', { label: t(label) })}</p>`;
}

function myClubStats(game) {
  const rec = game.clubRecords || { players: {} };
  const all = Object.entries(rec.players).map(([id, r]) => ({ id, ...r }));
  const byApps = [...all].sort((a, b) => b.apps - a.apps).slice(0, 5);
  const byGoals = [...all].filter(r => r.goals).sort((a, b) => b.goals - a.goals).slice(0, 5);
  const h = game.history || [];
  const titles = h.filter(x => x.champion).length;
  const ups = h.filter(x => x.promoted).length;
  const cups = h.filter(x => x.cup === 'W' || x.cup === 'Sieger').length;
  const log = game.matchLog || [];
  const recRow = (r, val) => {
    const alive = game.players[r.id];
    return `<li><${alive ? `button class="row statrow" data-action="open-player" data-id="${r.id}"` : 'div class="row statrow"'}>
      <span class="row__main"><span class="row__title">${esc(r.name)}${alive && alive.clubId === 'user' ? '' : ` <small class="muted">(${t('st.former')})</small>`}</span><span class="row__sub">${POS_LABEL[r.pos]}, ${t('w.gamesN', { n: r.apps })}, ${t('w.goalsN', { n: r.goals })}</span></span>
      <b class="statrow__val display">${val(r)}</b>
    </${alive ? 'button' : 'div'}></li>`;
  };
  return `
    <dl class="facts facts--3">
      <div><dt>${t('st.titles')}</dt><dd class="display">${titles}</dd></div>
      <div><dt>${t('st.ups')}</dt><dd class="display">${ups}</dd></div>
      <div><dt>${t('st.cups')}</dt><dd class="display">${cups}</dd></div>
    </dl>
    <dl class="facts facts--2">
      <div><dt>${t('st.bestWin')}</dt><dd>${rec.bestWin ? `<b class="display">${rec.bestWin.score}</b><small class="muted"> ${t('st.vsSeason', { opp: esc(rec.bestWin.oppName || ''), season: rec.bestWin.season })}</small>` : '–'}</dd></div>
      <div><dt>${t('st.worstLoss')}</dt><dd>${rec.worstLoss ? `<b class="display">${rec.worstLoss.score}</b><small class="muted"> ${t('st.vsSeason', { opp: esc(rec.worstLoss.oppName || ''), season: rec.worstLoss.season })}</small>` : '–'}</dd></div>
    </dl>
    ${byApps.length ? `<section class="section section--tight"><h3 class="h3">${t('st.recApps')}</h3><ul class="list panel panel--flush">${byApps.map(r => recRow(r, x => x.apps)).join('')}</ul></section>` : ''}
    ${byGoals.length ? `<section class="section section--tight"><h3 class="h3">${t('st.recGoals')}</h3><ul class="list panel panel--flush">${byGoals.map(r => recRow(r, x => x.goals)).join('')}</ul></section>` : ''}
    ${!all.length ? `<div class="empty"><p>${t('st.noRecords')}</p></div>` : ''}
    <p class="xsmall muted">${log.length ? t('st.since') : ''}</p>`;
}

export function statsView(game, ui) {
  const scope = ui.statsScope || 'players';
  const tier = ui.leagueTier || game.clubs.user.tier;
  let body = '';
  if (scope === 'players') {
    const cat = ui.statsPlayerCat || 'goals';
    body = tierPicker(game, tier) + catPicker(PLAYER_CATS.map(c => [c[0], c[1]]), cat, 'stats-pcat') + playerStats(game, tier, cat);
  } else if (scope === 'clubs') {
    const cat = ui.statsClubCat || 'home';
    body = tierPicker(game, tier) + catPicker(CLUB_CATS, cat, 'stats-ccat') + clubStats(game, tier, cat);
  } else {
    body = myClubStats(game);
  }
  return `${segmented([['players', t('st.players')], ['clubs', t('st.clubs')], ['mine', t('st.mine')]], scope, 'stats-scope')}
    <div class="stats-body">${body}</div>`;
}
