// =============================================================================
// Spielbericht & Saisonbilanz
// =============================================================================

import { crestSvg } from '../components/crest.js';
import { portraitSvg } from '../components/portrait.js';
import { icon } from '../icons.js';
import { esc, fmt } from '../html.js';
import { LEAGUE_INFO } from '../../engine/world.js';
import { STYLES } from '../../engine/constants.js';
import { t } from '../../i18n/index.js';
import { POS_LABEL, POSITION_GROUP } from '../../engine/constants.js';
import { segmented } from '../shell.js';
import { txt, nf1, ledgerLabel, ffStageText, cupText } from '../text.js';

function cardMark(r, side, id) {
  const c = (r.cards || []).filter(x => x.side === side && x.playerId === id);
  if (!c.length) return '';
  const red = c.some(x => x.type !== 'Y');
  return ` <i class="${red ? 'redcard' : 'yellowcard'}" title="${red ? t('rep.sentOff') : t('rep.yellow')}"></i>`;
}

function pname(game, snapshot, id) {
  const p = game.players[id] || snapshot?.[id];
  return p ? `${p.first[0]}. ${p.last}` : 'Unbekannt';
}

const GROUP_ORDER = { GK: 0, DEF: 1, MID: 2, ATT: 3 };

/** Noten eines Teams: Startelf nach Positionen (Tor → Sturm), dann Einwechslungen */
function ratingRows(game, r, side, snapshot, colors) {
  const starters = r.lineups[side]
    .map((l, i) => ({ id: l.playerId, pos: l.pos, i }))
    .filter(x => x.id && r.ratings[x.id] != null)
    .sort((a, b) => (GROUP_ORDER[POSITION_GROUP[a.pos]] - GROUP_ORDER[POSITION_GROUP[b.pos]]) || a.i - b.i);
  const subs = r.subs.filter(s => s.side === side && r.ratings[s.inId] != null);
  const row = (id, posLabel, sub) => {
    const p = game.players[id] || snapshot?.[id];
    if (!p) return '';
    const val = r.ratings[id];
    const motm = r.motm === id;
    const outP = sub ? (game.players[sub.outId] || snapshot?.[sub.outId]) : null;
    return `<li class="row row--button" data-action="open-player" data-id="${id}">
      <span class="rate-pos xsmall">${posLabel}</span>
      <span class="prow__face tier-${p.tier}" style="--club:${colors.primary}">${portraitSvg(p, { colors })}</span>
      <div class="row__main"><div class="row__title">${esc(p.first[0])}. ${esc(p.last)}${cardMark(r, side, id)}</div><div class="row__sub">${sub ? `${t('rep.subIn')}${outP ? ` ${t('rep.subFor', { name: `${outP.first[0]}. ${outP.last}` })}` : ''}` : POS_LABEL[p.position]}</div></div>
      ${motm ? `<span class="chip chip--warn">${icon('star')}${t('rep.best')}</span>` : ''}
      <span class="grade ${val >= 7.5 ? 'grade--top' : val < 5.8 ? 'grade--low' : ''}">${nf1(val)}</span>
    </li>`;
  };
  return starters.map(x => row(x.id, POS_LABEL[x.pos], null)).join('') +
    subs.map(s => row(s.inId, '↗', s)).join('');
}

export function resultFlow(game, flow, ui = {}) {
  const { result: r, side, outcome, label, analysis, finance, snapshot } = flow.data;
  const home = game.clubs[r.homeId];
  const away = game.clubs[r.awayId];
  const title = outcome === 'W' ? t('rep.win') : outcome === 'L' ? t('rep.loss') : t('rep.draw');
  const oppSide = side === 'home' ? 'away' : 'home';
  const showSide = ui.repSide === 'opp' ? oppSide : side;
  const ratingClub = game.clubs[showSide === 'home' ? r.homeId : r.awayId];

  const stat = (labelTxt, a, b, fmtFn = v => v) => {
    const total = a + b || 1;
    return `<div class="stat-row">
      <b class="num">${fmtFn(a)}</b>
      <div class="stat-row__mid"><span>${labelTxt}</span><div class="split"><span style="width:${(a / total) * 100}%"></span></div></div>
      <b class="num">${fmtFn(b)}</b>
    </div>`;
  };

  return `<div class="fullscreen"><main class="screen report">
    <p class="report__label small muted">${esc(label)}</p>
    <h1 class="h1 report__title report__title--${outcome}">${title}</h1>
    <section class="final" style="--home:${home.colors.primary};--away:${away.colors.primary}">
      <div class="final__team" data-action="open-club" data-id="${home.id}" role="button">${crestSvg(home, 56)}<b>${esc(home.name)}</b></div>
      <div class="final__score display">${r.hg}:${r.ag}${r.pens ? `<small>${r.pens.h}:${r.pens.a} ${t('w.pens')}</small>` : ''}</div>
      <div class="final__team" data-action="open-club" data-id="${away.id}" role="button">${crestSvg(away, 56)}<b>${esc(away.name)}</b></div>
    </section>
    ${r.goals.length ? `<ul class="goals">${r.goals.map(g => `<li class="goals__item goals__item--${g.side}" data-action="open-player" data-id="${g.scorerId}">
      <span class="num">${g.minute > 90 ? '90+' : g.minute}'</span>${icon('ball')}<span>${esc(pname(game, snapshot, g.scorerId))}${g.assistId ? ` <small class="muted">(${esc(pname(game, snapshot, g.assistId))})</small>` : ''}</span>
    </li>`).join('')}</ul>` : `<p class="small muted report__center">${t('rep.noGoals')}</p>`}
    ${(r.cards || []).filter(c => c.type !== 'Y' || c.side === side).length ? `<ul class="goals goals--cards">${(r.cards || []).filter(c => c.type !== 'Y' || c.side === side).map(c => `<li class="goals__item goals__item--${c.side}" data-action="open-player" data-id="${c.playerId}">
      <span class="num">${c.minute}'</span><i class="${c.type === 'Y' ? 'yellowcard' : 'redcard'}"></i><span>${esc(pname(game, snapshot, c.playerId))}${c.type === 'YR' ? ` <small class="muted">(${t('ban.yellowRed')})</small>` : ''}${c.type !== 'Y' && c.side === side ? ` <small class="neg">${t('sq.bannedShort')}</small>` : ''}</span>
    </li>`).join('')}</ul>` : ''}

    <section class="section">
      <div class="section__head"><h2 class="section__title">${t('rep.why')}</h2></div>
      <ul class="reasons">${analysis.map(a => `<li class="reason reason--${a.impact > 0 ? 'plus' : a.impact < 0 ? 'minus' : 'neutral'}">
        <span class="reason__icon">${icon(a.impact > 0 ? 'up' : a.impact < 0 ? 'down' : 'strategy')}</span><span>${esc(txt(a))}</span>
      </li>`).join('')}</ul>
      <p class="xsmall muted">${t('rep.styles', { a: STYLES[r.styles[0]].name, b: STYLES[r.styles[1]].name, fa: r.formations[0], fb: r.formations[1] })}</p>
    </section>

    <section class="section">
      <div class="section__head"><h2 class="section__title">${t('lg.stats')}</h2></div>
      <div class="panel stats">
        ${stat(t('st.poss'), r.possession[0], r.possession[1], v => `${v} %`)}
        ${stat(t('rep.attacks'), r.stats.shots[0], r.stats.shots[1])}
        ${stat(t('rep.bigChances'), r.stats.onTarget[0], r.stats.onTarget[1])}
        ${stat(t('st.xg'), r.stats.xg[0], r.stats.xg[1], v => nf1(v))}
      </div>
    </section>

    <section class="section">
      <div class="section__head"><h2 class="section__title">${t('rep.ratings')}</h2></div>
      ${segmented([['mine', t('rep.mine')], ['opp', t('rep.opp')]], ui.repSide === 'opp' ? 'opp' : 'mine', 'rep-side')}
      <ul class="list panel panel--flush rate-list">${ratingRows(game, r, showSide, snapshot, ratingClub.colors)}</ul>
    </section>

    ${finance?.length ? `<section class="section">
      <div class="section__head"><h2 class="section__title">${t('rep.cash')}</h2></div>
      <ul class="list panel panel--flush">${finance.map(f => `<li class="row"><span class="row__main">${esc(ledgerLabel(f))}</span><b class="num ${f.amount >= 0 ? 'pos' : 'neg'}">${f.amount >= 0 ? '+' : '−'}${fmt(Math.abs(f.amount))}</b></li>`).join('')}</ul>
    </section>` : ''}

    <div class="report__cta"><button class="btn btn--primary btn--block" data-action="result-continue">${t('w.continue')}</button></div>
  </main></div>`;
}

// -----------------------------------------------------------------------------
// Saisonbilanz
// -----------------------------------------------------------------------------

export function seasonFlow(game) {
  const s = game.seasonSummary;
  const u = s.user;
  const club = game.clubs.user;
  const headline = u.champion ? t('se.champion') : u.promoted ? t('se.promoted') : u.relegated ? t('w.relegated') : t('prep.place', { pos: u.pos });
  const sub = u.champion ? t('se.championX', { league: LEAGUE_INFO[u.tier].name }) :
    u.promoted ? t('se.promotedX', { club: esc(club.name), league: LEAGUE_INFO[u.tier - 1].name }) :
      u.relegated ? t('se.relegatedX', { league: LEAGUE_INFO[u.tier + 1].name }) :
        t('se.stayX', { league: LEAGUE_INFO[u.tier].name });
  const youth = (s.youth || []).map(id => game.players[id]).filter(Boolean);
  return `<div class="fullscreen"><main class="screen season-end ${u.promoted || u.champion ? 'season-end--up' : u.relegated ? 'season-end--down' : ''}">
    <p class="small muted">${t('se.over', { season: u.season })}</p>
    <div class="season-end__crest">${crestSvg(club, 120)}</div>
    <h1 class="h1">${headline}</h1>
    <p>${sub}</p>
    <dl class="facts facts--4">
      <div><dt>${t('se.place')}</dt><dd class="display">${u.pos}</dd></div>
      <div><dt>${t('cp.points')}</dt><dd class="display">${u.pts}</dd></div>
      <div><dt>${t('se.gd')}</dt><dd class="display">${u.gd > 0 ? '+' : ''}${u.gd}</dd></div>
      <div><dt>${t('se.prize')}</dt><dd class="display">${fmt(u.prize)}</dd></div>
    </dl>
    <ul class="list panel panel--flush">
      <li class="row"><span class="alert-dot">${icon('star')}</span><div class="row__main"><div class="row__title">Final Four</div><div class="row__sub">${esc(ffStageText(u.ffStage))}</div></div></li>
      <li class="row"><span class="alert-dot">${icon('trophy')}</span><div class="row__main"><div class="row__title">${t('w.cup')}</div><div class="row__sub">${esc(cupText(u.cup))}</div></div></li>
      ${s.retired.length ? `<li class="row"><span class="alert-dot">${icon('user')}</span><div class="row__main"><div class="row__title">${t('se.retired')}</div><div class="row__sub">${s.retired.map(r => `${esc(r.name)} (${r.age})`).join(', ')}</div></div></li>` : ''}
      ${youth.length ? `<li class="row"><span class="alert-dot alert-dot--reward">${icon('sparkles')}</span><div class="row__main"><div class="row__title">${t('se.youth')}</div><div class="row__sub">${youth.map(p => `${esc(p.first)} ${esc(p.last)} (${POS_LABEL[p.position]})`).join(', ')}</div></div></li>` : ''}
    </ul>
    <p class="small muted">${t('se.older')}</p>
    <button class="btn btn--primary btn--block" data-action="season-continue">${t('se.start', { season: game.season })}</button>
  </main></div>`;
}
