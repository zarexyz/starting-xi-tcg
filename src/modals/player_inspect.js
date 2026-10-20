// =============================================================================
// Starting XI TCG — Modal: Full-Screen Player Detail & Inspection
// =============================================================================

import { renderFUTCard } from '../components/card.js';
import { calculatePlayerSalary } from '../engine/economy.js';
import { getNationFlagSVG } from '../components/flags.js';

export function renderPlayerInspectModal(player, club) {
  if (!player) return '';

  const salary = calculatePlayerSalary(player.ovr);
  const isStarter = player.isStarter;
  const isTW = player.position === 'TW';

  return `
    <div class="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex flex-col p-4 max-w-md mx-auto justify-between animate-fadeIn overflow-y-auto no-scrollbar">
      
      <!-- Ambient Lighting -->
      <div class="absolute inset-0 bg-radial-gold pointer-events-none opacity-30"></div>

      <!-- Top Header -->
      <div class="relative z-10 flex items-center justify-between pb-2 border-b border-white/10">
        <div class="flex items-center gap-2">
          ${getNationFlagSVG(player.nationality, 24, 16)}
          <div>
            <span class="font-mono text-[9px] font-black uppercase text-pitch-emerald tracking-wider">
              ${player.tier?.toUpperCase()} SPIELER-DOSSIER
            </span>
            <h3 class="font-display font-black text-sm text-slate-100 uppercase tracking-tight">
              ${player.name}
            </h3>
          </div>
        </div>
        <button id="btn-close-inspect" class="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold">
          ✕
        </button>
      </div>

      <!-- Showcase Card (3D Tilt & Enlarged for Legibility) -->
      <div class="relative z-10 flex justify-center items-center my-2">
        <div class="filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)] transform transition-transform">
          ${renderFUTCard(player, { large: true, compact: false, draggable: false })}
        </div>
      </div>

      <!-- Player Management KPIs & Actions -->
      <div class="relative z-10 flex flex-col gap-2.5">
        
        <!-- Status Grid (Kondition, Vertrag, Gehalt, Marktwert) -->
        <div class="grid grid-cols-2 gap-2 text-xs font-mono">
          <!-- Kondition -->
          <div class="glass-card rounded-xl p-2.5 border border-white/10">
            <div class="flex justify-between items-center text-slate-400 text-[10px]">
              <span>KONDITION</span>
              <b class="${player.condition < 70 ? 'text-pitch-danger' : 'text-pitch-emerald'}">${player.condition}%</b>
            </div>
            <div class="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mt-1.5">
              <div class="h-full ${player.condition < 70 ? 'bg-pitch-danger' : 'bg-pitch-emerald'}" style="width: ${player.condition}%;"></div>
            </div>
          </div>

          <!-- Vertrag -->
          <div class="glass-card rounded-xl p-2.5 border border-white/10">
            <div class="flex justify-between items-center text-slate-400 text-[10px]">
              <span>RESTVERTRAG</span>
              <b class="${player.contractMatches <= 2 ? 'text-pitch-danger animate-pulse' : 'text-pitch-gold'}">${player.contractMatches} Spiele</b>
            </div>
            <div class="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mt-1.5">
              <div class="h-full bg-pitch-gold" style="width: ${Math.min(100, (player.contractMatches / 18) * 100)}%;"></div>
            </div>
          </div>

          <!-- Gehalt -->
          <div class="glass-card rounded-xl p-2.5 border border-white/10">
            <span class="text-slate-400 text-[10px] block">SPIELTAGS-GEHALT</span>
            <span class="font-display font-black text-sm text-slate-100">${salary.toLocaleString()} 🪙</span>
          </div>

          <!-- Status -->
          <div class="glass-card rounded-xl p-2.5 border border-white/10">
            <span class="text-slate-400 text-[10px] block">STATUS</span>
            <span class="font-display font-black text-xs ${isStarter ? 'text-pitch-emerald' : 'text-slate-400'}">
              ${isStarter ? '⚽ STARTELF (' + (player.currentSlot || player.position) + ')' : '🪑 ERSATZBANK'}
            </span>
          </div>
        </div>

        <!-- Quick Action Buttons -->
        <div class="grid grid-cols-2 gap-2 mt-1">
          <button id="btn-inspect-swap" data-player-id="${player.id}" class="py-2.5 rounded-xl bg-pitch-emerald/20 hover:bg-pitch-emerald/30 border border-pitch-emerald text-pitch-emerald font-display font-black text-xs uppercase tracking-wider active:scale-95 transition-all">
            ${isStarter ? 'Auf Bank setzen' : 'In Startelf einwechseln'}
          </button>
          
          <button id="btn-inspect-consumable" class="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-display font-bold text-xs uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-1.5">
            <span>📦</span>
            <span>Item anwenden</span>
          </button>
        </div>

      </div>

    </div>
  `;
}
