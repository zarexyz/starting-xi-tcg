// =============================================================================
// Verein → Trophäen: Trophäenschrank dieses Vereins und Erfolge des Managers
// =============================================================================

import { icon } from '../icons.js';
import { esc, fmt } from '../html.js';
import { LEAGUE_INFO } from '../../engine/world.js';
import { ACHIEVEMENTS, ACH_TIERS, tierFor } from '../../engine/achievements.js';
import { loadProfile } from '../../state/profile.js';
import { t } from '../../i18n/index.js';

/** Titel aus der Chronik, gruppiert und gezählt */
function cabinet(game) {
  const groups = new Map();
  const add = (key, label, kind, season) => {
    const g = groups.get(key) || { label, kind, seasons: [] };
    g.seasons.push(season);
    groups.set(key, g);
  };
  for (const h of [...game.history].reverse()) {
    const league = LEAGUE_INFO[h.tier].name;
    if (h.ffStage === 'W' || h.champion) add(`ff${h.tier}`, h.tier === 1 ? t('tr.champion', { league }) : t('tr.ffWin', { league }), 'gold', h.season);
    if (h.cup === 'W') add('cup', t('tr.cup'), 'gold', h.season);
    if (h.pos === 1) add(`first${h.tier}`, t('tr.first', { league }), 'silver', h.season);
    if (h.promoted) add(`up${h.tier}`, t('tr.promoted', { league: LEAGUE_INFO[h.tier - 1]?.name || league }), 'bronze', h.season);
  }
  return [...groups.values()].sort((a, b) => ({ gold: 0, silver: 1, bronze: 2 }[a.kind] - { gold: 0, silver: 1, bronze: 2 }[b.kind]));
}

export function trophiesView(game, store) {
  const items = cabinet(game);
  const profile = loadProfile();
  const cab = items.length
    ? `<div class="trophy-grid">${items.map(g => `<div class="trophy trophy--${g.kind}">
        <span class="trophy__icon">${icon('trophy')}</span>
        <b class="trophy__count display">${g.seasons.length}×</b>
        <span class="trophy__label">${esc(g.label)}</span>
        <span class="trophy__seasons xsmall muted">${g.seasons.map(s => `S${s}`).join(', ')}</span>
      </div>`).join('')}</div>`
    : `<div class="empty"><div class="h3">${t('tr.empty')}</div><p>${t('tr.emptyHint')}</p></div>`;

  const rows = ACHIEVEMENTS.map(def => {
    const tier = profile.tier?.[def.id] || 0;
    let cur = 0;
    try { cur = def.value(game); } catch { cur = 0; }
    const best = Math.max(profile.best?.[def.id] || 0, cur);
    if (def.hidden && !tier) {
      return `<li class="ach ach--hidden"><span class="ach__icon">${icon('info')}</span>
        <div class="row__main"><div class="row__title">${t('ach.hidden')}</div><div class="row__sub">${t('ach.hiddenX')}</div></div></li>`;
    }
    const next = def.tiers[tier];
    const prev = tier ? def.tiers[tier - 1] : 0;
    const pct = next ? Math.max(0, Math.min(100, ((best - prev) / (next - prev)) * 100)) : 100;
    const medals = ACH_TIERS.map((k, i) => `<i class="medal medal--${k} ${i < tier ? 'is-on' : ''}" title="${t(`ach.tier.${k}`)}"></i>`).join('');
    return `<li class="ach ${tier ? `ach--${ACH_TIERS[tier - 1]}` : ''}">
      <span class="ach__icon">${icon(def.icon)}</span>
      <div class="row__main">
        <div class="row__title">${t(`ach.${def.id}.name`)} <span class="medals">${medals}</span></div>
        <div class="row__sub">${next ? t(`ach.${def.id}.desc`, { n: next }) : t('ach.done')}</div>
        ${next ? `<div class="ach__bar"><span style="width:${pct}%"></span></div><div class="xsmall muted">${t('ach.progress', { v: fmt(Math.min(best, next)), n: fmt(next) })}</div>` : ''}
      </div>
    </li>`;
  }).join('');
  const done = ACHIEVEMENTS.reduce((s, d) => s + (profile.tier?.[d.id] || 0), 0);

  return `
    <section class="section">
      <div class="section__head"><h2 class="section__title">${t('tr.cabinet')}</h2></div>
      ${cab}
    </section>
    <section class="section">
      <div class="section__head"><h2 class="section__title">${t('ach.title')}</h2><span class="small muted">${done} / ${ACHIEVEMENTS.length * 3}</span></div>
      <p class="small muted">${t('ach.intro')}</p>
      <ul class="list panel panel--flush ach-list">${rows}</ul>
    </section>`;
}
