// =============================================================================
// Verein: Überblick, Finanzen, Chronik, Einstellungen
// =============================================================================

import { topbar, segmented } from '../shell.js';
import { crestSvg } from '../components/crest.js';
import { icon } from '../icons.js';
import { esc, fmt } from '../html.js';
import { LEAGUE_INFO, clubStrength } from '../../engine/world.js';
import { weeklyWages, wageCap, TIER_INCOME } from '../../engine/economy.js';

function overview(game) {
  const club = game.clubs.user;
  const wages = weeklyWages(game, 'user');
  const cap = wageCap(club.tier);
  const ratio = Math.min(1.4, wages / cap);
  const best = game.history.reduce((b, h) => (!b || h.tier < b.tier || (h.tier === b.tier && h.pos < b.pos) ? h : b), null);
  return `
    <section class="club-hero">
      ${crestSvg(club, 120)}
      <div>
        <h1 class="h1">${esc(club.name)}</h1>
        <p class="muted">${LEAGUE_INFO[club.tier].name}, Saison ${game.season}</p>
        <p class="small">Teamstärke <b>${clubStrength(game, 'user')}</b>, ${club.playerIds.length} Spieler</p>
      </div>
    </section>
    <section class="section">
      <div class="section__head"><h2 class="section__title">Gehälter</h2></div>
      <div class="panel">
        <div class="wage">
          <div><span class="small muted">Pro Spieltag</span><b class="display">${fmt(wages)}</b></div>
          <div><span class="small muted">Empfohlene Grenze</span><b class="display">${fmt(cap)}</b></div>
        </div>
        <div class="bar ${ratio > 1.15 ? 'bar--low' : ratio > 0.95 ? 'bar--warn' : ''}"><span style="width:${Math.min(100, ratio * 100 / 1.4)}%"></span></div>
        <p class="small ${ratio > 1.15 ? 'neg' : 'muted'}">${ratio > 1.15 ? 'Über der Grenze: Die Kabinenstimmung sinkt jeden Spieltag ein wenig.' : 'Gute Spieler kosten exponentiell mehr. Bleib unter der Grenze, sonst sinkt die Moral.'} Ein Heimspiel bringt in deiner Liga rund ${fmt(TIER_INCOME[club.tier])} ein.</p>
      </div>
    </section>
    ${best ? `<section class="section"><div class="section__head"><h2 class="section__title">Bestes Ergebnis</h2></div>
      <p>${LEAGUE_INFO[best.tier].name}, Platz ${best.pos} in Saison ${best.season}${best.champion ? ', Meister!' : ''}</p></section>` : ''}
  `;
}

function finance(game) {
  const rows = game.user.ledger;
  if (!rows.length) return `<div class="empty"><div class="h3">Noch keine Buchungen</div><p>Nach dem ersten Spieltag siehst du hier Einnahmen und Gehälter.</p></div>`;
  return `<ul class="list panel panel--flush">${rows.map(r => `<li class="row">
    <div class="row__main"><div class="row__title">${esc(r.label)}</div><div class="row__sub">Saison ${r.season}</div></div>
    <b class="num ${r.amount >= 0 ? 'pos' : 'neg'}">${r.amount >= 0 ? '+' : '−'}${fmt(Math.abs(r.amount))}</b>
  </li>`).join('')}</ul>`;
}

function history(game) {
  if (!game.history.length) return `<div class="empty"><div class="h3">Die Chronik ist noch leer</div><p>Nach deiner ersten Saison steht hier, wo dein Verein gelandet ist.</p></div>`;
  return `<ul class="list panel panel--flush">${game.history.map(h => `<li class="row">
    <span class="season-badge display">S${h.season}</span>
    <div class="row__main">
      <div class="row__title">${LEAGUE_INFO[h.tier].name}, Platz ${h.pos}</div>
      <div class="row__sub">${h.pts} Punkte${h.ffStage ? `, Final Four: ${h.ffStage}` : ''}, Pokal: ${esc(h.cup)}</div>
    </div>
    ${h.champion ? `<span class="chip chip--warn">${icon('trophy')}Meister</span>` : h.promoted ? `<span class="chip chip--pitch">${icon('up')}Aufstieg</span>` : h.relegated ? `<span class="chip chip--loss">${icon('down')}Abstieg</span>` : ''}
  </li>`).join('')}</ul>`;
}

function settings(store) {
  const s = store.settings;
  return `
    <ul class="list panel panel--flush">
      <li class="row">
        <span class="alert-dot">${icon(s.sound ? 'sound' : 'mute')}</span>
        <div class="row__main"><div class="row__title">Soundeffekte</div><div class="row__sub">Pack-Öffnen, Tore, Abpfiff</div></div>
        <button class="toggle" role="switch" aria-checked="${s.sound}" data-action="toggle-sound"><span></span></button>
      </li>
      <li class="row">
        <span class="alert-dot">${icon('forward')}</span>
        <div class="row__main"><div class="row__title">Spieltempo</div><div class="row__sub">Wie schnell der Ticker läuft</div></div>
      </li>
      <li class="row">${segmented([['slow', 'Ruhig'], ['normal', 'Normal'], ['fast', 'Schnell']], s.speed, 'set-speed')}</li>
      <li class="row">
        <span class="alert-dot">${icon('save')}</span>
        <div class="row__main"><div class="row__title">Spielstand ${store.slot}</div><div class="row__sub">Wird nach jeder Aktion automatisch gespeichert</div></div>
        <button class="btn btn--sm btn--secondary" data-action="to-title">Wechseln</button>
      </li>
    </ul>
    <p class="xsmall muted settings-note">Starting XI TCG, Version 0.2. Alle Vereine und Spieler sind frei erfunden.</p>
  `;
}

export function clubScreen(game, ui, store) {
  const view = ui.view.club || 'overview';
  const items = [['overview', 'Überblick'], ['finance', 'Finanzen'], ['history', 'Chronik'], ['settings', 'Optionen']];
  const body = { overview, finance, history }[view]?.(game) ?? settings(store);
  return `<main class="screen">
    ${topbar(game)}
    ${segmented(items, view, 'club-view')}
    <div class="club-body">${body}</div>
  </main>`;
}
