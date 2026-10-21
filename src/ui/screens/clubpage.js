// =============================================================================
// Vereinsseite: jeder Verein der Welt, von überall erreichbar
// =============================================================================

import { sheet, formHtml } from '../shell.js';
import { crestSvg } from '../components/crest.js';
import { flagSvg } from '../components/flag.js';
import { icon } from '../icons.js';
import { esc } from '../html.js';
import { playerRow } from './squad.js';
import { clubPlayers, clubStrength, LEAGUE_INFO, rivalsOf } from '../../engine/world.js';
import { computeTable, CUP_ROUND_NAMES } from '../../engine/schedule.js';
import { STYLES, POSITION_GROUP } from '../../engine/constants.js';
import { NATIONS } from '../../engine/names.js';

const GROUPS = [['GK', 'Tor'], ['DEF', 'Abwehr'], ['MID', 'Mittelfeld'], ['ATT', 'Angriff']];

/** Bilanz des eigenen Vereins gegen diesen Verein (aus dem Spielverlauf) */
function headToHead(game, clubId) {
  const games = (game.matchLog || []).filter(m => m.opponentId === clubId);
  const w = games.filter(m => m.outcome === 'W').length;
  const l = games.filter(m => m.outcome === 'L').length;
  return { games, w, d: games.length - w - l, l };
}

export function clubLink(game, clubId, opts = {}) {
  const c = game.clubs[clubId];
  if (!c) return '';
  return `<button type="button" class="link-club" data-action="open-club" data-id="${c.id}">${opts.crest !== false ? crestSvg(c, opts.size || 20) : ''}<span>${esc(opts.short ? c.short : c.name)}</span></button>`;
}

export function clubSheet(game, id, opts = {}) {
  const c = game.clubs[id];
  if (!c) return '';
  const table = computeTable(game, c.tier);
  const row = table.find(r => r.clubId === id);
  const squad = clubPlayers(game, id);
  const cs = c.seasonStats;
  const coachStyle = STYLES[c.preferredStyle];
  const rivals = rivalsOf(game, id).slice(0, 6);
  const h2h = id !== 'user' ? headToHead(game, id) : null;
  const scorers = [...squad].filter(p => p.stats.goals > 0).sort((a, b) => b.stats.goals - a.stats.goals || b.stats.assists - a.stats.assists).slice(0, 3);
  const nation = NATIONS[c.country];

  const historyRows = (c.history || []).slice(0, 10).map(h => `<li class="row chron">
    <span class="season-badge display">S${h.s}</span>
    <div class="row__main"><div class="row__title">${esc(LEAGUE_INFO[h.tier].name)}, Platz ${h.pos}</div>
    <div class="row__sub">${h.pts} Punkte, ${h.gf}:${h.ga} Tore${h.cup === 'W' ? ', Pokalsieger' : h.cup ? `, Pokal: ${esc(CUP_ROUND_NAMES[h.cup] || '')}` : ''}</div></div>
    ${h.champ ? `<span class="chip chip--warn">${icon('trophy')}${h.tier === 1 ? 'Meister' : 'Sieger'}</span>` : h.up ? `<span class="chip chip--pitch">${icon('up')}Auf</span>` : h.down ? `<span class="chip chip--loss">${icon('down')}Ab</span>` : ''}
  </li>`).join('');

  const body = `
    <div class="clubpage">
      <header class="clubpage__head" style="--club:${c.colors.primary};--club2:${c.colors.secondary}">
        ${crestSvg(c, 76)}
        <div>
          <div class="clubpage__meta">${c.country ? `${flagSvg(c.country, 18)}<span>${esc(c.city || nation?.name || '')}${c.city && nation ? `, ${esc(nation.name)}` : ''}</span>` : ''}</div>
          <div class="small">${esc(LEAGUE_INFO[c.tier].name)}${row ? `, Platz ${row.pos}` : ''}</div>
          ${row ? formHtml(row.form) : ''}
        </div>
      </header>

      <dl class="facts facts--3">
        <div><dt>Stärke</dt><dd class="display">${clubStrength(game, id)}</dd></div>
        <div><dt>Punkte</dt><dd class="display">${row ? row.pts : '–'}</dd></div>
        <div><dt>Kader</dt><dd class="display">${squad.length}</dd></div>
      </dl>

      ${c.coach ? `<section class="section section--tight">
        <h3 class="h3">Trainer</h3>
        <div class="row panel coach">
          ${flagSvg(c.coach.nation, 20)}
          <div class="row__main"><div class="row__title">${esc(c.coach.name)}</div><div class="row__sub">${c.coach.age} Jahre, Philosophie: <b>${esc(coachStyle?.name || '')}</b></div></div>
        </div>
      </section>` : ''}

      ${h2h && h2h.games.length ? `<section class="section section--tight">
        <h3 class="h3">Bilanz gegen dich</h3>
        <dl class="facts facts--3">
          <div><dt>Siege</dt><dd class="display pos">${h2h.w}</dd></div>
          <div><dt>Remis</dt><dd class="display">${h2h.d}</dd></div>
          <div><dt>Niederlagen</dt><dd class="display neg">${h2h.l}</dd></div>
        </dl>
        <p class="xsmall muted">Letzte Duelle: ${h2h.games.slice(0, 5).map(m => `${m.side === 'home' ? `${m.hg}:${m.ag}` : `${m.ag}:${m.hg}`}${m.pens ? ' i.E.' : ''}`).join(', ')}</p>
      </section>` : ''}

      ${rivals.length ? `<section class="section section--tight">
        <h3 class="h3">Rivalen</h3>
        <div class="rival-list">${rivals.map(r => `<button class="chip ${r.type === 'derby' ? 'chip--derby' : ''}" data-action="open-club" data-id="${r.club.id}">${crestSvg(r.club, 16)}${esc(r.club.short)}${r.type === 'derby' ? ' · Derby' : ''}</button>`).join('')}</div>
      </section>` : ''}

      ${cs && cs.games ? `<section class="section section--tight">
        <h3 class="h3">Saison ${game.season}</h3>
        <dl class="facts facts--4">
          <div><dt>Spiele</dt><dd class="display">${cs.games}</dd></div>
          <div><dt>S-U-N</dt><dd class="num">${cs.w}-${cs.d}-${cs.l}</dd></div>
          <div><dt>Tore</dt><dd class="num">${cs.gf}:${cs.ga}</dd></div>
          <div><dt>Ballbesitz</dt><dd class="num">${Math.round(cs.poss / cs.games)} %</dd></div>
        </dl>
      </section>` : ''}

      ${scorers.length ? `<section class="section section--tight">
        <h3 class="h3">Torjäger</h3>
        <ul class="list panel panel--flush">${scorers.map(p => playerRow(game, p, { extra: `${p.position}, ${p.stats.goals} Tore, ${p.stats.assists} Vorlagen` })).join('')}</ul>
      </section>` : ''}

      <section class="section section--tight">
        <h3 class="h3">Kader</h3>
        ${GROUPS.map(([g, label]) => {
          const list = squad.filter(p => POSITION_GROUP[p.position] === g).sort((a, b) => b.ovr - a.ovr);
          if (!list.length) return '';
          return `<p class="small muted group-label">${label}</p><ul class="list panel panel--flush">${list.map(p => playerRow(game, p)).join('')}</ul>`;
        }).join('')}
      </section>

      ${historyRows ? `<section class="section section--tight">
        <h3 class="h3">Chronik</h3>
        <ul class="list panel panel--flush">${historyRows}</ul>
      </section>` : ''}
    </div>`;
  return sheet(c.name, body, opts);
}
