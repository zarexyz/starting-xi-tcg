// =============================================================================
// Starting XI TCG — FUT-Style Trading Card Component
// =============================================================================

import { getEffectiveOVR } from '../engine/ratings.js';

export function renderFUTCard(player, options = {}) {
  const {
    playedPosition = player.position,
    chemistryPips = 3,
    compact = false,
    selectable = false,
    selected = false
  } = options;

  const effectiveOvr = getEffectiveOVR(player, playedPosition);
  const isOutOfPosition = effectiveOvr < player.ovr;
  const tier = player.tier || 'bronze';

  let borderColor = 'rgba(255,255,255,0.12)';
  let bgGradient = 'linear-gradient(180deg, #161f30 0%, #0d1320 100%)';
  let badgeColor = '#94a3b8';

  if (tier === 'special') {
    borderColor = '#00f59b';
    bgGradient = 'linear-gradient(180deg, #132f28 0%, #0a1715 100%)';
    badgeColor = '#00f59b';
  } else if (tier === 'gold') {
    borderColor = '#ffd15c';
    bgGradient = 'linear-gradient(180deg, #2b2513 0%, #16140b 100%)';
    badgeColor = '#ffd15c';
  } else if (tier === 'silver') {
    borderColor = '#94a3b8';
    bgGradient = 'linear-gradient(180deg, #1e2638 0%, #111622 100%)';
    badgeColor = '#e2e8f0';
  }

  // Pips indicator dots
  let pipsHTML = '';
  for (let i = 0; i < 3; i++) {
    const active = i < chemistryPips;
    pipsHTML += `<span class="w-1.5 h-1.5 rounded-full ${active ? 'bg-pitch-emerald shadow-[0_0_6px_#00f59b]' : 'bg-slate-700'}"></span>`;
  }

  if (compact) {
    return `
      <div class="fut-card relative rounded-xl p-2 flex flex-col justify-between cursor-pointer border ${selected ? 'ring-2 ring-pitch-emerald shadow-[0_0_15px_#00f59b]' : ''}"
           style="background: ${bgGradient}; border-color: ${borderColor}; min-width: 90px; height: 130px;"
           data-player-id="${player.id}">
        <!-- Top row: OVR & Flag -->
        <div class="flex items-center justify-between">
          <div class="flex flex-col items-center">
            <span class="font-display font-extrabold text-sm leading-tight" style="color: ${badgeColor};">
              ${effectiveOvr}
            </span>
            <span class="font-mono text-[9px] font-bold text-slate-400 leading-none">${player.position}</span>
          </div>
          <span class="text-xs">${player.nationFlag}</span>
        </div>

        <!-- Center: Avatar Silhouette -->
        <div class="flex justify-center items-center my-1">
          <div class="w-8 h-8 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-xs text-slate-300 font-bold">
            ${player.shortName.substring(0, 2)}
          </div>
        </div>

        <!-- Bottom: Name & Pips -->
        <div class="text-center">
          <p class="font-sans font-semibold text-[10px] text-slate-200 truncate leading-tight">${player.shortName}</p>
          <div class="flex justify-center gap-1 mt-1">${pipsHTML}</div>
        </div>
      </div>
    `;
  }

  return `
    <div class="fut-card relative rounded-2xl p-3.5 flex flex-col justify-between cursor-pointer border shadow-xl ${selected ? 'ring-2 ring-pitch-emerald shadow-[0_0_20px_#00f59b]' : ''}"
         style="background: ${bgGradient}; border-color: ${borderColor}; width: 170px; height: 240px;"
         data-player-id="${player.id}">
      
      <!-- Top Plinth: OVR, Pos, Flag -->
      <div class="flex items-start justify-between">
        <div class="flex flex-col">
          <div class="flex items-baseline gap-1">
            <span class="font-display font-black text-2xl tracking-tighter" style="color: ${badgeColor};">
              ${effectiveOvr}
            </span>
            ${isOutOfPosition ? '<span class="text-[9px] text-pitch-danger font-bold">▼</span>' : ''}
          </div>
          <span class="font-mono text-xs font-bold text-slate-300 uppercase">${player.position}</span>
        </div>
        <div class="flex flex-col items-end">
          <span class="text-lg leading-none mb-1">${player.nationFlag}</span>
          <div class="flex gap-1">${pipsHTML}</div>
        </div>
      </div>

      <!-- Avatar Graphic -->
      <div class="flex justify-center items-center my-2">
        <div class="w-16 h-16 rounded-full bg-gradient-to-b from-slate-700 to-slate-900 border-2 border-slate-600 flex items-center justify-center text-lg font-display font-extrabold text-slate-200 shadow-inner">
          ${player.shortName.substring(0, 2)}
        </div>
      </div>

      <!-- Name Ribbon -->
      <div class="text-center border-t border-slate-700/50 pt-1.5">
        <h4 class="font-display font-bold text-xs uppercase tracking-wide text-slate-100 truncate">
          ${player.name}
        </h4>
      </div>

      <!-- 6-Stat Plinth -->
      <div class="grid grid-cols-3 gap-x-2 gap-y-0.5 text-[9px] font-mono border-t border-slate-800/80 pt-1 text-slate-400">
        <div class="flex justify-between"><span>PAC</span><b class="text-slate-100">${player.pac}</b></div>
        <div class="flex justify-between"><span>DRI</span><b class="text-slate-100">${player.dri}</b></div>
        <div class="flex justify-between"><span>SHO</span><b class="text-slate-100">${player.sho}</b></div>
        <div class="flex justify-between"><span>DEF</span><b class="text-slate-100">${player.def}</b></div>
        <div class="flex justify-between"><span>PAS</span><b class="text-slate-100">${player.pas}</b></div>
        <div class="flex justify-between"><span>PHY</span><b class="text-slate-100">${player.phy}</b></div>
      </div>
    </div>
  `;
}
