// =============================================================================
// Verein: Überblick, Finanzen, Chronik, Einstellungen
// =============================================================================

import { topbar, segmented } from '../shell.js';
import { crestSvg } from '../components/crest.js';
import { icon } from '../icons.js';
import { esc, fmt } from '../html.js';
import { LEAGUE_INFO, clubStrength } from '../../engine/world.js';
import { weeklyWages, wageCap, TIER_INCOME } from '../../engine/economy.js';
import { t, LANGS, getLang } from '../../i18n/index.js';
import { ledgerLabel, ffStageText, cupText } from '../text.js';

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
        <p class="muted">${t('club.leagueSeason', { league: LEAGUE_INFO[club.tier].name, season: game.season })}</p>
        <p class="small">${t('club.strength', { s: clubStrength(game, 'user'), n: club.playerIds.length })}</p>
      </div>
    </section>
    <section class="section">
      <div class="section__head"><h2 class="section__title">${t('club.wages')}</h2></div>
      <div class="panel">
        <div class="wage">
          <div><span class="small muted">${t('club.perDay')}</span><b class="display">${fmt(wages)}</b></div>
          <div><span class="small muted">${t('club.cap')}</span><b class="display">${fmt(cap)}</b></div>
        </div>
        <div class="bar ${ratio > 1.15 ? 'bar--low' : ratio > 0.95 ? 'bar--warn' : ''}"><span style="width:${Math.min(100, ratio * 100 / 1.4)}%"></span></div>
        <p class="small ${ratio > 1.15 ? 'neg' : 'muted'}">${ratio > 1.15 ? t('club.overCap') : t('club.capHint')} ${t('club.homeIncome', { n: TIER_INCOME[club.tier] })}</p>
      </div>
    </section>
    ${best ? `<section class="section"><div class="section__head"><h2 class="section__title">${t('club.best')}</h2></div>
      <p>${t('club.bestText', { league: LEAGUE_INFO[best.tier].name, pos: best.pos, season: best.season })}${best.champion ? `, ${t('club.champion')}!` : ''}</p></section>` : ''}
  `;
}

function finance(game) {
  const rows = game.user.ledger;
  if (!rows.length) return `<div class="empty"><div class="h3">${t('club.noLedger')}</div><p>${t('club.noLedgerHint')}</p></div>`;
  return `<ul class="list panel panel--flush">${rows.map(r => `<li class="row">
    <div class="row__main"><div class="row__title">${esc(ledgerLabel(r))}</div><div class="row__sub">${t('w.seasonN', { n: r.season })}</div></div>
    <b class="num ${r.amount >= 0 ? 'pos' : 'neg'}">${r.amount >= 0 ? '+' : '−'}${fmt(Math.abs(r.amount))}</b>
  </li>`).join('')}</ul>`;
}

function history(game) {
  if (!game.history.length) return `<div class="empty"><div class="h3">${t('club.noHistory')}</div><p>${t('club.noHistoryHint')}</p></div>`;
  return `<ul class="list panel panel--flush">${game.history.map(h => `<li class="row">
    <span class="season-badge display">S${h.season}</span>
    <div class="row__main">
      <div class="row__title">${t('club.leaguePos', { league: LEAGUE_INFO[h.tier].name, pos: h.pos })}</div>
      <div class="row__sub">${t('w.ptsN', { n: h.pts })}${h.ffStage ? `, Final Four: ${esc(ffStageText(h.ffStage))}` : ''}, ${t('w.cup')}: ${esc(cupText(h.cup))}</div>
    </div>
    ${h.champion ? `<span class="chip chip--warn">${icon('trophy')}${t('club.champion')}</span>` : h.promoted ? `<span class="chip chip--pitch">${icon('up')}${t('w.promoted')}</span>` : h.relegated ? `<span class="chip chip--loss">${icon('down')}${t('w.relegated')}</span>` : ''}
  </li>`).join('')}</ul>`;
}

function settings(store) {
  const s = store.settings;
  return `
    <ul class="list panel panel--flush">
      <li class="row">
        <span class="alert-dot">${icon('globe')}</span>
        <div class="row__main"><div class="row__title">${t('set.lang')}</div><div class="row__sub">${t('set.langHint')}</div></div>
      </li>
      <li class="row">${segmented(LANGS, getLang(), 'set-lang')}</li>
      <li class="row">
        <span class="alert-dot">${icon(s.sound ? 'sound' : 'mute')}</span>
        <div class="row__main"><div class="row__title">${t('set.sound')}</div><div class="row__sub">${t('set.soundHint')}</div></div>
        <button class="toggle" role="switch" aria-checked="${s.sound}" data-action="toggle-sound"><span></span></button>
      </li>
      <li class="row">
        <span class="alert-dot">${icon('forward')}</span>
        <div class="row__main"><div class="row__title">${t('set.speed')}</div><div class="row__sub">${t('set.speedHint')}</div></div>
      </li>
      <li class="row">${segmented([['slow', t('set.slow')], ['normal', t('set.normal')], ['fast', t('set.fast')]], s.speed, 'set-speed')}</li>
      <li class="row">
        <span class="alert-dot">${icon('play')}</span>
        <div class="row__main"><div class="row__title">${t('set.autoScenes')}</div><div class="row__sub">${t('set.autoScenesHint')}</div></div>
        <button class="toggle" role="switch" aria-checked="${!!s.autoScenes}" data-action="toggle-auto-scenes"><span></span></button>
      </li>
      <li class="row">
        <span class="alert-dot">${icon('save')}</span>
        <div class="row__main"><div class="row__title">${t('set.slot', { n: store.slot })}</div><div class="row__sub">${t('set.slotHint')}</div></div>
        <button class="btn btn--sm btn--secondary" data-action="to-title">${t('set.switch')}</button>
      </li>
      <li class="row">
        <span class="alert-dot">${icon('download')}</span>
        <div class="row__main"><div class="row__title">${t('set.backup')}</div><div class="row__sub">${t('set.backupHint')}</div></div>
        <button class="btn btn--sm btn--secondary" data-action="export-save">${t('set.backupBtn')}</button>
      </li>
    </ul>
    <p class="xsmall muted settings-note">${t('set.note', { v: '1.4' })}</p>
  `;
}

export function clubScreen(game, ui, store) {
  const view = ui.view.club || 'overview';
  const items = [['overview', t('club.tab.overview')], ['finance', t('club.tab.finance')], ['history', t('club.tab.history')], ['settings', t('club.tab.settings')]];
  const body = { overview, finance, history }[view]?.(game) ?? settings(store);
  return `<main class="screen">
    ${topbar(game)}
    ${segmented(items, view, 'club-view')}
    <div class="club-body">${body}</div>
  </main>`;
}
