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
import { itemCard } from './pack.js';
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
  const { result: r, side, outcome, label, analysis, finance, snapshot, interview } = flow.data;
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
      </li>`).join('')}${interview ? `<li class="reason reason--neutral"><span class="reason__icon">${icon('megaphone')}</span><span>${t('why.iv.' + interview)}</span></li>` : ''}</ul>
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

    ${flow.data.reward ? `<section class="section">
      <div class="section__head"><h2 class="section__title">${t('rep.reward')}</h2></div>
      ${itemCard(flow.data.reward)}
      <p class="xsmall muted">${t('rep.rewardX')}</p>
    </section>` : ''}

    ${finance?.length ? `<section class="section">
      <div class="section__head"><h2 class="section__title">${t('rep.cash')}</h2></div>
      <ul class="list panel panel--flush">${finance.map(f => `<li class="row"><span class="row__main">${esc(ledgerLabel(f))}</span><b class="num ${f.amount >= 0 ? 'pos' : 'neg'}">${f.amount >= 0 ? '+' : '−'}${fmt(Math.abs(f.amount))}</b></li>`).join('')}</ul>
    </section>` : ''}

    <div class="report__cta">
      <button class="btn btn--secondary btn--block" data-action="share-result">${icon('share')}${t('share.btn')}</button>
      <button class="btn btn--primary btn--block" data-action="result-continue">${t('w.continue')}</button>
    </div>
  </main></div>`;
}

// -----------------------------------------------------------------------------
// Saisonbilanz
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// Saisonbilanz in vier Seiten: Bilanz, Auszeichnungen, Ligen, Kader
// -----------------------------------------------------------------------------

const XI_SLOTS = [
  { pos: 'TW', x: 50, y: 88 },
  { pos: 'LV', x: 13, y: 66 }, { pos: 'IV', x: 37, y: 72 }, { pos: 'IV', x: 63, y: 72 }, { pos: 'RV', x: 87, y: 66 },
  { pos: 'ZM', x: 24, y: 45 }, { pos: 'ZDM', x: 50, y: 52 }, { pos: 'ZM', x: 76, y: 45 },
  { pos: 'LF', x: 17, y: 20 }, { pos: 'ST', x: 50, y: 14 }, { pos: 'RF', x: 83, y: 20 }
];

/** Elf der Saison auf die 4-3-3-Plätze verteilen, passende Positionen zuerst */
function placeXi(xi) {
  const groups = { GK: ['TW'], DEF: ['LV', 'IV', 'RV'], MID: ['ZDM', 'ZM', 'ZOM', 'LM', 'RM'], ATT: ['LF', 'ST', 'RF'] };
  const slotGroup = pos => Object.keys(groups).find(g => groups[g].includes(pos));
  const free = XI_SLOTS.map((sl, i) => ({ ...sl, i, g: slotGroup(sl.pos) }));
  const placed = [];
  const rest = [...xi];
  // 1. exakte Position, 2. gleiche Gruppe
  for (const exact of [true, false]) {
    for (const e of [...rest]) {
      const g = slotGroup(e.pos) || (['LM', 'RM', 'ZOM'].includes(e.pos) ? 'MID' : 'ATT');
      const slot = free.find(sl => !sl.used && (exact ? sl.pos === e.pos : sl.g === g));
      if (slot) { slot.used = true; placed.push({ ...e, x: slot.x, y: slot.y }); rest.splice(rest.indexOf(e), 1); }
    }
  }
  for (const e of rest) { const slot = free.find(sl => !sl.used); if (slot) { slot.used = true; placed.push({ ...e, x: slot.x, y: slot.y }); } }
  return placed;
}

function xiPitch(game, xi) {
  return `<div class="xi-pitch">
    <div class="pitch__lines" aria-hidden="true"><span class="pitch__half"></span><span class="pitch__circle"></span><span class="pitch__box pitch__box--top"></span><span class="pitch__box pitch__box--bottom"></span></div>
    ${placeXi(xi).map(e => {
      const p = game.players[e.id] || e.snap || { first: e.name, last: e.name };
      const c = game.clubs[e.clubId];
      const colors = c?.colors || { primary: '#888', secondary: '#ddd' };
      return `<button class="xi-pitch__p ${e.clubId === 'user' ? 'is-me' : ''}" style="left:${e.x}%;top:${e.y}%" ${game.players[e.id] ? `data-action="open-player" data-id="${e.id}"` : ''}>
        <span class="prow__face tier-${p.tier || 'bronze'}" style="--club:${colors.primary}">${p.look ? portraitSvg(p, { colors }) : ''}</span>
        <span class="xi-pitch__name">${esc((p.last || e.name).split(' ').slice(-1)[0])}</span>
        <span class="xi-pitch__rate">${nf1(e.rating)}</span>
      </button>`;
    }).join('')}
  </div>`;
}

function awardsHtml(game, aw) {
  if (!aw || (!aw.scorer && !aw.pots)) return `<p class="small muted">${t('se.noAwards')}</p>`;
  const row = (e, label, value) => e ? `<li class="row row--button ${e.clubId === 'user' ? 'is-me' : ''}" ${game.players[e.id] ? `data-action="open-player" data-id="${e.id}"` : ''}>
    <span class="alert-dot alert-dot--reward">${icon('trophy')}</span>
    <div class="row__main"><div class="row__title">${esc(e.name)}</div><div class="row__sub">${label} · ${esc(e.club)}</div></div>
    <b class="num">${value}</b>
  </li>` : '';
  return `<section class="section awards">
    <div class="section__head"><h2 class="section__title">${t('aw.title')}</h2><span class="small muted">${esc(LEAGUE_INFO[aw.tier].name)}</span></div>
    <ul class="list panel panel--flush">
      ${row(aw.scorer, t('aw.scorer'), aw.scorer ? t('aw.goals', { n: aw.scorer.goals }) : '')}
      ${row(aw.pots, t('aw.pots'), aw.pots ? nf1(aw.pots.rating) : '')}
    </ul>
    ${aw.xi?.length ? `<h3 class="h3 awards__xi">${t('aw.xi')}</h3>${xiPitch(game, aw.xi)}` : ''}
  </section>`;
}

function clubLink(game, id) {
  const c = game.clubs[id];
  if (!c) return '';
  return `<button class="se-club ${id === 'user' ? 'is-me' : ''}" data-action="open-club" data-id="${id}">${crestSvg(c, 20)}<span>${esc(c.name)}</span></button>`;
}

function leaguesHtml(game, s) {
  const moves = s.moves || [];
  return `${s.cupWinner ? `<div class="se-cup">${icon('trophy')}<span>${t('se.cupWinner')}</span>${clubLink(game, s.cupWinner)}</div>` : ''}
  <div class="se-leagues">${[1, 2, 3, 4, 5, 6].map(tier => {
    const up = moves.filter(m => m.from === tier && m.to === tier - 1).map(m => m.id);
    const down = moves.filter(m => m.from === tier && m.to === tier + 1).map(m => m.id);
    const champ = s.champions?.[tier];
    const mine = s.user.tier === tier;
    return `<section class="se-league ${mine ? 'is-mine' : ''}">
      <h3 class="se-league__name">${esc(LEAGUE_INFO[tier].name)}</h3>
      ${champ ? `<div class="se-line"><span class="se-tag se-tag--gold">${icon('trophy')}${tier === 1 ? t('se.champ') : t('se.ffWinner')}</span>${clubLink(game, champ)}</div>` : ''}
      ${s.leaders?.[tier] ? `<div class="se-line"><span class="se-tag">${icon('list')}${t('se.first')}</span>${clubLink(game, s.leaders[tier])}</div>` : ''}
      ${up.length ? `<div class="se-line"><span class="se-tag se-tag--up">${icon('up')}${t('w.promoted')}</span><span class="se-clubs">${up.map(id => clubLink(game, id)).join('')}</span></div>` : ''}
      ${down.length ? `<div class="se-line"><span class="se-tag se-tag--down">${icon('down')}${t('w.relegated')}</span><span class="se-clubs">${down.map(id => clubLink(game, id)).join('')}</span></div>` : ''}
    </section>`;
  }).join('')}</div>`;
}

export function seasonFlow(game, ui = {}) {
  const s = game.seasonSummary;
  const u = s.user;
  const club = game.clubs.user;
  const page = Math.max(0, Math.min(3, ui.sePage || 0));
  const headline = u.champion ? t('se.champion') : u.promoted ? t('se.promoted') : u.relegated ? t('w.relegated') : t('se.placeHead', { pos: u.pos });
  const sub = u.champion ? t('se.championX', { league: LEAGUE_INFO[u.tier].name }) :
    u.promoted ? t('se.promotedX', { club: esc(club.name), league: LEAGUE_INFO[u.tier - 1].name }) :
      u.relegated ? t('se.relegatedX', { league: LEAGUE_INFO[u.tier + 1].name }) :
        t('se.stayX', { league: LEAGUE_INFO[u.tier].name });
  const youth = (s.youth || []).map(id => game.players[id]).filter(Boolean);
  const intake = (s.academy?.intake || []).map(id => game.players[id]).filter(Boolean);
  const pages = [t('se.p.result'), t('se.p.awards'), t('se.p.leagues'), t('se.p.squad')];

  let body = '';
  if (page === 0) {
    body = `<div class="season-end__crest">${crestSvg(club, 110)}</div>
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
        ${u.goal ? `<li class="row"><span class="alert-dot ${u.goal.met ? '' : 'alert-dot--loss'}">${icon(u.goal.met ? 'check' : 'close')}</span><div class="row__main"><div class="row__title">${t('goal.title')}</div><div class="row__sub">${esc(t(`goal.${u.goal.key}`))}. ${u.goal.met ? (u.goal.bonus ? t('se.goalMet', { amountC: u.goal.bonus }) : t('se.goalMetNoBonus')) : t('se.goalMissed')}</div></div></li>` : ''}
      </ul>
      <button class="btn btn--secondary btn--block se-share" data-action="share-season">${icon('share')}${t('share.season')}</button>`;
  } else if (page === 1) {
    body = awardsHtml(game, s.awards);
  } else if (page === 2) {
    body = leaguesHtml(game, s);
  } else {
    const left = s.leftFree || [];
    body = `<ul class="list panel panel--flush">
        ${s.retired.length ? `<li class="row"><span class="alert-dot">${icon('user')}</span><div class="row__main"><div class="row__title">${t('se.retired')}</div><div class="row__sub">${s.retired.map(r => `${esc(r.name)} (${r.age})`).join(', ')}</div></div></li>` : ''}
        ${left.length ? `<li class="row"><span class="alert-dot alert-dot--loss">${icon('swap')}</span><div class="row__main"><div class="row__title">${t('se.leftFree')}</div><div class="row__sub">${left.map(l => esc(l.name)).join(', ')}</div></div></li>` : ''}
        ${youth.length ? `<li class="row"><span class="alert-dot alert-dot--reward">${icon('sparkles')}</span><div class="row__main"><div class="row__title">${t('se.youth')}</div><div class="row__sub">${youth.map(p => `${esc(p.first)} ${esc(p.last)} (${POS_LABEL[p.position]})`).join(', ')}</div></div></li>` : ''}
        ${intake.length ? `<li class="row"><span class="alert-dot alert-dot--reward">${icon('sparkles')}</span><div class="row__main"><div class="row__title">${t('acad.intake')}</div><div class="row__sub">${intake.map(p => `${esc(p.first)} ${esc(p.last)} (${POS_LABEL[p.position]})`).join(', ')}</div></div></li>` : ''}
        ${!s.retired.length && !left.length && !youth.length && !intake.length ? `<li class="row"><div class="row__main"><div class="row__sub">${t('se.noChanges')}</div></div></li>` : ''}
      </ul>
      <p class="small muted">${t('se.older')}</p>`;
  }

  return `<div class="fullscreen"><main class="screen season-end ${u.promoted || u.champion ? 'season-end--up' : u.relegated ? 'season-end--down' : ''}">
    <p class="small muted">${t('se.over', { season: u.season })}</p>
    <div class="se-steps">${pages.map((p, i) => `<button class="se-step ${i === page ? 'is-on' : ''}" data-action="season-page" data-value="${i}">${p}</button>`).join('')}</div>
    <div class="se-body">${body}</div>
    <div class="se-nav">
      ${page > 0 ? `<button class="btn btn--secondary" data-action="season-page" data-value="${page - 1}">${icon('chevronLeft')}${t('w.back')}</button>` : '<span></span>'}
      ${page < 3 ? `<button class="btn btn--primary" data-action="season-page" data-value="${page + 1}">${t('w.continue')}${icon('chevronRight')}</button>`
        : `<button class="btn btn--primary" data-action="season-continue">${t('se.start', { season: game.season })}</button>`}
    </div>
  </main></div>`;
}
