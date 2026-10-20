// =============================================================================
// Starting XI TCG — Screen 2: Kader & Taktikboard (3D-Pitch View)
// =============================================================================

import { renderFUTCard } from '../components/card.js';
import { calculateSquadChemistry } from '../engine/ratings.js';

export function renderKaderScreen(state) {
  const club = state.leagues.find(l => l.tier === 6)?.clubs.find(c => c.id === state.playerClubId);
  const starters = club.squad.filter(p => p.isStarter);
  const bench = club.squad.filter(p => !p.isStarter);

  const teamOvr = starters.length ? (starters.reduce((acc, p) => acc + p.ovr, 0) / starters.length).toFixed(1) : '64.0';
  const { chemistryPercent, totalPips, maxPips, pips } = calculateSquadChemistry(starters);

  // Finde Spieler für die 11 Positionen im 4-3-3
  const getSlot = (pos) => starters.find(p => p.currentSlot === pos) || starters.find(p => p.position === pos) || starters[0];

  const st = getSlot('ST');
  const lf = getSlot('LF');
  const rf = getSlot('RF');
  const zom = getSlot('ZOM');
  const zm = getSlot('ZM');
  const zdm = getSlot('ZDM');
  const lv = getSlot('LV');
  const iv1 = starters.filter(p => p.currentSlot === 'IV')[0] || getSlot('IV');
  const iv2 = starters.filter(p => p.currentSlot === 'IV')[1] || getSlot('IV');
  const rv = getSlot('RV');
  const tw = getSlot('TW');

  return `
    <div class="flex-1 flex flex-col p-3 gap-3 pb-24 overflow-y-auto no-scrollbar">
      
      <!-- Top Tactics Bar -->
      <div class="glass-panel rounded-xl p-3 flex items-center justify-between">
        <div>
          <span class="font-mono text-[10px] text-slate-400 uppercase tracking-wider block">Formation</span>
          <span class="font-display font-extrabold text-sm text-pitch-emerald">4-3-3 Attack ▾</span>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-right">
            <span class="font-mono text-[10px] text-slate-400 uppercase block">Team-OVR</span>
            <span class="font-display font-black text-sm text-slate-100">${teamOvr} ⭐</span>
          </div>
          <div class="text-right">
            <span class="font-mono text-[10px] text-slate-400 uppercase block">Chemie</span>
            <span class="font-display font-black text-sm text-pitch-emerald">${chemistryPercent}% (${totalPips}/${maxPips})</span>
          </div>
        </div>
      </div>

      <!-- Tactical Pitch (Vertical 3D Ground) -->
      <div class="relative rounded-2xl p-4 border border-pitch-emerald/30 overflow-hidden shadow-2xl flex flex-col justify-between"
           style="background: radial-gradient(circle at 50% 30%, #152722 0%, #0a1114 80%, #06090c 100%); min-height: 460px;">
        
        <!-- Pitch Field Line Markings (SVG Overlay) -->
        <svg class="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
          <!-- Outer Boundary -->
          <rect x="5%" y="4%" width="90%" height="92%" fill="none" stroke="#00f59b" stroke-width="2"/>
          <!-- Halfway Line -->
          <line x1="5%" y1="50%" x2="95%" y2="50%" stroke="#00f59b" stroke-width="2"/>
          <!-- Center Circle -->
          <circle cx="50%" cy="50%" r="45" fill="none" stroke="#00f59b" stroke-width="2"/>
          <!-- Penalty Boxes -->
          <rect x="25%" y="4%" width="50%" height="18%" fill="none" stroke="#00f59b" stroke-width="1.5"/>
          <rect x="25%" y="78%" width="50%" height="18%" fill="none" stroke="#00f59b" stroke-width="1.5"/>
        </svg>

        <!-- ATTACK ROW (LF, ST, RF) -->
        <div class="relative z-10 flex justify-around items-center">
          ${renderPitchSlot(lf, 'LF', pips[lf?.id])}
          ${renderPitchSlot(st, 'ST', pips[st?.id])}
          ${renderPitchSlot(rf, 'RF', pips[rf?.id])}
        </div>

        <!-- MIDFIELD ROW (ZM, ZOM, ZDM) -->
        <div class="relative z-10 flex justify-around items-center my-2">
          ${renderPitchSlot(zm, 'ZM', pips[zm?.id])}
          ${renderPitchSlot(zom, 'ZOM', pips[zom?.id])}
          ${renderPitchSlot(zdm, 'ZDM', pips[zdm?.id])}
        </div>

        <!-- DEFENSE ROW (LV, IV, IV, RV) -->
        <div class="relative z-10 flex justify-around items-center">
          ${renderPitchSlot(lv, 'LV', pips[lv?.id])}
          ${renderPitchSlot(iv1, 'IV', pips[iv1?.id])}
          ${renderPitchSlot(iv2, 'IV', pips[iv2?.id])}
          ${renderPitchSlot(rv, 'RV', pips[rv?.id])}
        </div>

        <!-- GOALKEEPER (TW) -->
        <div class="relative z-10 flex justify-center items-center mt-2">
          ${renderPitchSlot(tw, 'TW', pips[tw?.id])}
        </div>

      </div>

      <!-- Bench Drawer & Consumables Trigger -->
      <div class="glass-panel rounded-xl p-3 flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="font-display font-bold text-xs text-slate-200 uppercase tracking-wider">
            Ersatzbank (${bench.length} Spieler)
          </span>
          <button id="btn-open-consumables" class="px-2.5 py-1 rounded-lg bg-pitch-emerald/20 hover:bg-pitch-emerald/30 border border-pitch-emerald text-pitch-emerald font-mono font-bold text-[11px] flex items-center gap-1 active:scale-95 transition-all">
            <span>📦</span>
            <span>Verbrauchskarten (${state.inventory.length})</span>
          </button>
        </div>

        <!-- Horizontal Bench Cards Scroll -->
        <div class="flex gap-2.5 overflow-x-auto no-scrollbar py-1">
          ${bench.map(player => renderFUTCard(player, { compact: true, chemistryPips: 2 })).join('')}
        </div>
      </div>

    </div>
  `;
}

function renderPitchSlot(player, slotName, pips = 2) {
  if (!player) return `<div class="w-16 h-20 border-2 border-dashed border-slate-700 rounded-lg flex items-center justify-center text-[10px] text-slate-500 font-mono">${slotName}</div>`;

  return `
    <div class="flex flex-col items-center cursor-pointer transition-transform hover:scale-105 active:scale-95" data-starter-id="${player.id}">
      <div class="w-14 h-18 rounded-lg p-1 flex flex-col justify-between items-center shadow-lg border relative"
           style="background: linear-gradient(180deg, #161f30 0%, #0d1320 100%); border-color: ${player.tier === 'gold' ? '#ffd15c' : (player.tier === 'special' ? '#00f59b' : '#64748b')};">
        <div class="w-full flex items-center justify-between text-[9px] font-mono leading-none">
          <b class="text-pitch-gold">${player.ovr}</b>
          <span class="text-slate-400">${player.position}</span>
        </div>
        <div class="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-200">
          ${player.shortName.substring(0, 2)}
        </div>
        <span class="font-sans font-semibold text-[8px] text-slate-200 truncate max-w-full text-center leading-none">
          ${player.shortName}
        </span>
      </div>
      <span class="font-mono text-[9px] text-pitch-emerald font-bold mt-0.5">${slotName}</span>
    </div>
  `;
}
