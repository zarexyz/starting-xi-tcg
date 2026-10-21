// =============================================================================
// Home: nächstes Spiel, Tabelle, Kaderlage, Nachrichten
// =============================================================================

import { topbar, formHtml, userPosition } from '../shell.js';
import { crestSvg } from '../components/crest.js';
import { icon } from '../icons.js';
import { esc } from '../html.js';
import { currentDay, dayLabel, userMatch, nextUserMatch } from '../../engine/game.js';
import { computeTable, CUP_ROUND_NAMES } from '../../engine/schedule.js';
import { STYLES } from '../../engine/constants.js';
import { clubStrength, clubPlayers, LEAGUE_INFO } from '../../engine/world.js';
import { packArt } from '../flows/pack.js';

function tableRowsAround(game) {
  const tier = game.clubs.user.tier;
  const table = computeTable(game, tier);
  const idx = table.findIndex(r => r.clubId === 'user');
  const start = Math.max(0, Math.min(table.length - 5, idx - 2));
  return { table, rows: table.slice(start, start + 5) };
}

function compLabel(game, entry) {
  if (!entry) return '';
  if (entry.comp === 'league') return LEAGUE_INFO[game.clubs.user.tier].name;
  if (entry.comp === 'cup') return `Pokal, ${CUP_ROUND_NAMES[entry.round]}`;
  return entry.stage === 'final' ? 'Final Four, Finale' : 'Final Four, Halbfinale';
}

function matchTicket(game) {
  const day = currentDay(game);
  const today = userMatch(game, day);
  if (!today) {
    const next = nextUserMatch(game);
    return `<section class="ticket ticket--idle">
      <div class="ticket__head"><span class="chip">${icon('calendar')}${esc(dayLabel(game, day))}</span></div>
      <p class="ticket__idle">Heute spielt dein Verein nicht. ${next ? `Nächstes Spiel: ${esc(dayLabel(game, next.day))}.` : 'Die Saison ist für dich gelaufen.'}</p>
      <button class="btn btn--secondary btn--block" data-action="sim-day">${icon('forward')}Spieltag simulieren</button>
    </section>`;
  }
  const { m } = today;
  const home = game.clubs[m.home];
  const away = game.clubs[m.away];
  const opp = m.home === 'user' ? away : home;
  const tier = game.clubs.user.tier;
  const table = computeTable(game, tier);
  const formOf = id => table.find(r => r.clubId === id)?.form || [];
  const oppStyle = STYLES[opp.preferredStyle];
  const isHome = m.home === 'user';
  return `<section class="ticket" style="--home:${home.colors.primary};--away:${away.colors.primary}">
    <div class="ticket__head">
      <span class="ticket__day">${esc(dayLabel(game, day))}</span>
      <span class="chip">${esc(compLabel(game, today))}</span>
    </div>
    <div class="ticket__match">
      <div class="ticket__team">
        ${crestSvg(home, 64)}
        <b>${esc(home.name)}</b>
        <span class="num">Stärke ${clubStrength(game, home.id)}</span>
        ${formHtml(formOf(home.id))}
      </div>
      <div class="ticket__vs display">${isHome ? 'Heim' : 'Ausw.'}</div>
      <div class="ticket__team">
        ${crestSvg(away, 64)}
        <b>${esc(away.name)}</b>
        <span class="num">Stärke ${clubStrength(game, away.id)}</span>
        ${formHtml(formOf(away.id))}
      </div>
    </div>
    <div class="ticket__scout">${icon('strategy')}<span>${esc(opp.name)} spielt fast immer <b>${oppStyle.name}</b> im ${opp.preferredFormation}.</span></div>
    <button class="btn btn--primary btn--block" data-action="open-prep">${icon('whistle')}Spiel vorbereiten</button>
  </section>`;
}

function squadAlerts(game) {
  const squad = clubPlayers(game, 'user');
  const injured = squad.filter(p => p.injury);
  const tired = squad.filter(p => !p.injury && p.condition < 70);
  const banned = squad.filter(p => p.suspension);
  const items = game.user.inventory.length;
  const parts = [];
  if (injured.length) parts.push(`<li class="row row--button" data-action="tab" data-tab="squad"><span class="alert-dot alert-dot--loss">${icon('medical')}</span><div class="row__main"><div class="row__title">${injured.length} verletzt</div><div class="row__sub">${injured.map(p => esc(p.last)).join(', ')}</div></div>${icon('chevronRight', 'row__chev')}</li>`);
  if (banned.length) parts.push(`<li class="row row--button" data-action="tab" data-tab="squad"><span class="alert-dot alert-dot--loss"><i class="redcard"></i></span><div class="row__main"><div class="row__title">${banned.length} gesperrt</div><div class="row__sub">${banned.map(p => `${esc(p.last)} (${p.suspension.games} Sp.)`).join(', ')}</div></div>${icon('chevronRight', 'row__chev')}</li>`);
  if (tired.length) parts.push(`<li class="row row--button" data-action="tab" data-tab="squad"><span class="alert-dot alert-dot--warn">${icon('battery')}</span><div class="row__main"><div class="row__title">${tired.length} müde (unter 70 %)</div><div class="row__sub">Rotieren oder Fitness-Gegenstand nutzen</div></div>${icon('chevronRight', 'row__chev')}</li>`);
  if (items) parts.push(`<li class="row row--button" data-action="open-items"><span class="alert-dot">${icon('clipboard')}</span><div class="row__main"><div class="row__title">${items} Gegenstände im Spind</div><div class="row__sub">Fitness, Training, Taktik</div></div>${icon('chevronRight', 'row__chev')}</li>`);
  if (!parts.length) return '';
  return `<section class="section"><div class="section__head"><h2 class="section__title">Kaderlage</h2></div><ul class="list panel panel--flush">${parts.join('')}</ul></section>`;
}

function newsList(game) {
  const items = game.inbox.slice(0, 3);
  if (!items.length) return '';
  return `<section class="section">
    <div class="section__head"><h2 class="section__title">Nachrichten</h2><button class="link" data-action="open-inbox">Alle</button></div>
    <ul class="list panel panel--flush">
      ${items.map(n => `<li class="row row--button" data-action="open-news" data-id="${n.id}">
        ${!n.read ? '<span class="unread-dot" aria-label="ungelesen"></span>' : ''}
        <div class="row__main"><div class="row__title">${esc(n.title)}</div><div class="row__sub news-sub">${esc(n.text)}</div></div>
      </li>`).join('')}
    </ul>
  </section>`;
}

function firstSteps(game) {
  if (game.user.tipsDismissed || game.season > 1 || game.matchLog.length > 3 || game.pending) return '';
  const steps = [
    ['strategy', 'Gegner lesen', 'In der Spielvorbereitung siehst du, wie der Gegner meistens spielt. Wähle einen Stil, der ihn kontert.'],
    ['battery', 'Rotieren', 'Müde Spieler bringen weniger. Der Co-Trainer stellt auf Wunsch die fitteste Elf auf.'],
    ['trophy', 'Final Four', 'Platz 1 bis 4 spielt um den Aufstieg. Die beiden Halbfinalsieger steigen auf.'],
    ['store', 'Verstärken', 'Mit Münzen kaufst du Packs mit neuen Talenten oder Spieler auf dem Transfermarkt.']
  ];
  return `<section class="section tips">
    <div class="section__head"><h2 class="section__title">So geht's</h2><button class="link" data-action="dismiss-tips">Ausblenden</button></div>
    <ol class="tips__list">${steps.map(([ic, t, d]) => `<li><span class="alert-dot">${icon(ic)}</span><div><b>${t}</b><p class="small muted">${d}</p></div></li>`).join('')}</ol>
  </section>`;
}

export function homeScreen(game) {
  const pendingBanner = game.pending ? `<section class="pending-pack">
      <div class="pending-pack__art">${packArt(game.pending.type === 'starter' ? 'starter' : game.pending.source, 'sm')}</div>
      <div><div class="h3">${game.pending.type === 'starter' ? 'Dein Starter-Pack' : esc(game.pending.title)}</div>
      <p class="small muted">${game.pending.type === 'starter' ? 'Öffne es, um deinen Kader zu bekommen.' : 'Schließe die Wahl ab, bevor es weitergeht.'}</p>
      <button class="btn btn--reward" data-action="open-pack">Öffnen</button></div>
    </section>` : '';

  const { table, rows } = tableRowsAround(game);
  const tier = game.clubs.user.tier;
  const played = table[0]?.p || 0;
  const pos = userPosition(game);

  return `<main class="screen">
    ${topbar(game)}
    ${pendingBanner || matchTicket(game)}
    ${firstSteps(game)}

    <section class="section">
      <div class="section__head">
        <h2 class="section__title">${LEAGUE_INFO[tier].name}</h2>
        <button class="link" data-action="tab" data-tab="league">Tabelle</button>
      </div>
      <div class="panel panel--flush">
        <table class="table">
          <tbody>
            ${rows.map(r => {
              const c = game.clubs[r.clubId];
              const zone = r.pos <= 4 ? 'zone-ff' : r.pos >= 9 && tier < 6 ? 'zone-down' : '';
              return `<tr class="${r.clubId === 'user' ? 'is-me' : ''} ${zone}">
                <td class="t-pos">${r.pos}</td>
                <td class="t-club">${crestSvg(c, 22)}<span>${esc(c.name)}</span></td>
                <td class="num t-gd">${r.gd > 0 ? '+' : ''}${r.gd}</td>
                <td class="num t-pts"><b>${r.pts}</b></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      <p class="xsmall muted legend"><span class="legend__ff"></span>Platz 1–4: Final Four${tier < 6 ? ' <span class="legend__down"></span>Platz 9–10: Abstieg' : ''}. Nach ${played} von 18 Spieltagen bist du ${pos}.</p>
    </section>

    ${squadAlerts(game)}
    ${newsList(game)}
  </main>`;
}
