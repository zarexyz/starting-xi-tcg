// =============================================================================
// Spielbericht & Saisonbilanz
// =============================================================================

import { crestSvg } from '../components/crest.js';
import { portraitSvg } from '../components/portrait.js';
import { icon } from '../icons.js';
import { esc, fmt } from '../html.js';
import { LEAGUE_INFO } from '../../engine/world.js';
import { STYLES } from '../../engine/constants.js';

function cardMark(r, side, id) {
  const c = (r.cards || []).filter(x => x.side === side && x.playerId === id);
  if (!c.length) return '';
  const red = c.some(x => x.type !== 'Y');
  return ` <i class="${red ? 'redcard' : 'yellowcard'}" title="${red ? 'Platzverweis' : 'Gelbe Karte'}"></i>`;
}

function pname(game, snapshot, id) {
  const p = game.players[id] || snapshot?.[id];
  return p ? `${p.first[0]}. ${p.last}` : 'Unbekannt';
}

export function resultFlow(game, flow) {
  const { result: r, side, outcome, label, analysis, finance, snapshot } = flow.data;
  const home = game.clubs[r.homeId];
  const away = game.clubs[r.awayId];
  const title = outcome === 'W' ? 'Sieg!' : outcome === 'L' ? 'Niederlage' : 'Unentschieden';
  const myLineup = r.lineups[side].map(l => l.playerId).filter(Boolean);
  const mySubs = r.subs.filter(s => s.side === side).map(s => s.inId);
  const ratings = [...myLineup, ...mySubs].map(id => ({ id, r: r.ratings[id] })).filter(x => x.r).sort((a, b) => b.r - a.r);
  const colors = game.clubs.user.colors;

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
      <div class="final__team">${crestSvg(home, 56)}<b>${esc(home.name)}</b></div>
      <div class="final__score display">${r.hg}:${r.ag}${r.pens ? `<small>${r.pens.h}:${r.pens.a} i.E.</small>` : ''}</div>
      <div class="final__team">${crestSvg(away, 56)}<b>${esc(away.name)}</b></div>
    </section>
    ${r.goals.length ? `<ul class="goals">${r.goals.map(g => `<li class="goals__item goals__item--${g.side}">
      <span class="num">${g.minute > 90 ? '90+' : g.minute}'</span>${icon('ball')}<span>${esc(pname(game, snapshot, g.scorerId))}${g.assistId ? ` <small class="muted">(${esc(pname(game, snapshot, g.assistId))})</small>` : ''}</span>
    </li>`).join('')}</ul>` : '<p class="small muted report__center">Keine Tore.</p>'}
    ${(r.cards || []).filter(c => c.type !== 'Y' || c.side === side).length ? `<ul class="goals goals--cards">${(r.cards || []).filter(c => c.type !== 'Y' || c.side === side).map(c => `<li class="goals__item goals__item--${c.side}">
      <span class="num">${c.minute}'</span><i class="${c.type === 'Y' ? 'yellowcard' : 'redcard'}"></i><span>${esc(pname(game, snapshot, c.playerId))}${c.type === 'YR' ? ' <small class="muted">(Gelb-Rot)</small>' : ''}${c.type !== 'Y' && c.side === side ? ' <small class="neg">gesperrt</small>' : ''}</span>
    </li>`).join('')}</ul>` : ''}

    <section class="section">
      <div class="section__head"><h2 class="section__title">Warum?</h2></div>
      <ul class="reasons">${analysis.map(a => `<li class="reason reason--${a.impact > 0 ? 'plus' : a.impact < 0 ? 'minus' : 'neutral'}">
        <span class="reason__icon">${icon(a.impact > 0 ? 'up' : a.impact < 0 ? 'down' : 'strategy')}</span><span>${esc(a.text)}</span>
      </li>`).join('')}</ul>
      <p class="xsmall muted">Spielstile: ${STYLES[r.styles[0]].name} gegen ${STYLES[r.styles[1]].name}, ${r.formations[0]} gegen ${r.formations[1]}.</p>
    </section>

    <section class="section">
      <div class="section__head"><h2 class="section__title">Statistik</h2></div>
      <div class="panel stats">
        ${stat('Ballbesitz', r.possession[0], r.possession[1], v => `${v} %`)}
        ${stat('Angriffe', r.stats.shots[0], r.stats.shots[1])}
        ${stat('Großchancen', r.stats.onTarget[0], r.stats.onTarget[1])}
        ${stat('Erwartete Tore', r.stats.xg[0], r.stats.xg[1], v => v.toFixed(1))}
      </div>
    </section>

    <section class="section">
      <div class="section__head"><h2 class="section__title">Deine Noten</h2></div>
      <ul class="list panel panel--flush">${ratings.map(x => {
        const p = game.players[x.id] || snapshot?.[x.id];
        if (!p) return '';
        const motm = r.motm === x.id;
        return `<li class="row">
          <span class="prow__face tier-${p.tier}" style="--club:${colors.primary}">${portraitSvg(p, { colors })}</span>
          <div class="row__main"><div class="row__title">${esc(p.first[0])}. ${esc(p.last)}${cardMark(r, side, x.id)}</div><div class="row__sub">${p.position}${mySubs.includes(x.id) ? ', eingewechselt' : ''}</div></div>
          ${motm ? `<span class="chip chip--warn">${icon('star')}Bester</span>` : ''}
          <span class="grade ${x.r >= 7.5 ? 'grade--top' : x.r < 5.8 ? 'grade--low' : ''}">${x.r.toFixed(1)}</span>
        </li>`;
      }).join('')}</ul>
    </section>

    ${finance?.length ? `<section class="section">
      <div class="section__head"><h2 class="section__title">Kasse</h2></div>
      <ul class="list panel panel--flush">${finance.map(f => `<li class="row"><span class="row__main">${esc(f.label)}</span><b class="num ${f.amount >= 0 ? 'pos' : 'neg'}">${f.amount >= 0 ? '+' : '−'}${fmt(Math.abs(f.amount))}</b></li>`).join('')}</ul>
    </section>` : ''}

    <div class="report__cta"><button class="btn btn--primary btn--block" data-action="close-flow">Weiter</button></div>
  </main></div>`;
}

// -----------------------------------------------------------------------------
// Saisonbilanz
// -----------------------------------------------------------------------------

export function seasonFlow(game) {
  const s = game.seasonSummary;
  const u = s.user;
  const club = game.clubs.user;
  const headline = u.champion ? 'Meister!' : u.promoted ? 'Aufstieg!' : u.relegated ? 'Abstieg' : `Platz ${u.pos}`;
  const sub = u.champion ? `Dein Verein ist Meister der ${LEAGUE_INFO[u.tier].name}.` :
    u.promoted ? `Nächste Saison spielt ${esc(club.name)} in der ${LEAGUE_INFO[u.tier - 1].name}.` :
      u.relegated ? `Es geht runter in die ${LEAGUE_INFO[u.tier + 1].name}. Neuer Anlauf!` :
        `Ihr bleibt in der ${LEAGUE_INFO[u.tier].name}.`;
  const youth = (s.youth || []).map(id => game.players[id]).filter(Boolean);
  return `<div class="fullscreen"><main class="screen season-end ${u.promoted || u.champion ? 'season-end--up' : u.relegated ? 'season-end--down' : ''}">
    <p class="small muted">Saison ${u.season} ist vorbei</p>
    <div class="season-end__crest">${crestSvg(club, 120)}</div>
    <h1 class="h1">${headline}</h1>
    <p>${sub}</p>
    <dl class="facts facts--4">
      <div><dt>Platz</dt><dd class="display">${u.pos}</dd></div>
      <div><dt>Punkte</dt><dd class="display">${u.pts}</dd></div>
      <div><dt>Tordiff.</dt><dd class="display">${u.gd > 0 ? '+' : ''}${u.gd}</dd></div>
      <div><dt>Prämie</dt><dd class="display">${fmt(u.prize)}</dd></div>
    </dl>
    <ul class="list panel panel--flush">
      <li class="row"><span class="alert-dot">${icon('star')}</span><div class="row__main"><div class="row__title">Final Four</div><div class="row__sub">${u.ffStage ? esc(u.ffStage) : 'nicht qualifiziert'}</div></div></li>
      <li class="row"><span class="alert-dot">${icon('trophy')}</span><div class="row__main"><div class="row__title">Pokal</div><div class="row__sub">${esc(u.cup)}</div></div></li>
      ${s.retired.length ? `<li class="row"><span class="alert-dot">${icon('user')}</span><div class="row__main"><div class="row__title">Karriereende</div><div class="row__sub">${s.retired.map(r => `${esc(r.name)} (${r.age})`).join(', ')}</div></div></li>` : ''}
      ${youth.length ? `<li class="row"><span class="alert-dot alert-dot--reward">${icon('sparkles')}</span><div class="row__main"><div class="row__title">Aus der Jugend</div><div class="row__sub">${youth.map(p => `${esc(p.first)} ${esc(p.last)} (${p.position})`).join(', ')}</div></div></li>` : ''}
    </ul>
    <p class="small muted">Alle Spieler sind ein Jahr älter geworden. Junge Talente haben zugelegt, Routiniers teils abgebaut.</p>
    <button class="btn btn--primary btn--block" data-action="season-continue">Saison ${game.season} starten</button>
  </main></div>`;
}
