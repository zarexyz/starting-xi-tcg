// =============================================================================
// Starting XI TCG — Modal: Einstellungen & Spieloptionen
// Centered Dialog with Active Slot Manager, Sound FX Toggle & Sim Speed
// =============================================================================

import { renderClubCrest } from '../components/crest.js';
import { isSoundEnabled } from '../engine/audio.js';
import { getActiveSlotId } from '../state/storage.js';

export function renderSettingsModal(state) {
  const club = state.leagues.find(l => l.tier === 6)?.clubs.find(c => c.id === state.playerClubId);
  const soundActive = isSoundEnabled();
  const simSpeed = state.settings?.simSpeed || 'blitz';
  const activeSlot = getActiveSlotId();
  const slotNum = activeSlot.replace('slot_', '');

  return `
    <div class="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex flex-col justify-center items-center p-4 max-w-md mx-auto animate-fadeIn select-none">
      
      <!-- Centered Modal Container -->
      <div class="glass-modal rounded-3xl p-5 border border-pitch-emerald/40 shadow-2xl flex flex-col w-full max-h-[88vh] overflow-hidden">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <span class="text-xl">⚙️</span>
            <div>
              <h3 class="font-display font-black text-sm text-slate-100 uppercase tracking-wide">Einstellungen</h3>
              <span class="font-mono text-[10px] text-slate-400">Optionen & Speicherverwaltung</span>
            </div>
          </div>
          <button id="btn-close-modal" class="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold">
            ✕
          </button>
        </div>

        <div class="flex-1 flex flex-col gap-3.5 overflow-y-auto no-scrollbar py-3">
          
          <!-- Section 1: Active Club & Slot -->
          <div class="glass-card rounded-2xl p-3 flex flex-col gap-2.5 border border-white/5 bg-slate-900/60">
            <div class="flex items-center justify-between">
              <span class="font-display font-bold text-xs text-slate-300 uppercase tracking-wider">Aktiver Spielstand</span>
              <span class="px-2 py-0.5 rounded-full bg-pitch-emerald/20 text-pitch-emerald border border-pitch-emerald/40 font-mono text-[9px] font-black uppercase">
                Slot ${slotNum} Aktiv
              </span>
            </div>
            
            <div class="flex items-center gap-3">
              ${renderClubCrest(club, 40)}
              <div class="flex-1 truncate">
                <span class="font-display font-black text-xs text-slate-100 uppercase block truncate">${club.name}</span>
                <span class="font-mono text-[10px] text-pitch-emerald font-semibold">🟢 Auto-Save aktiv (IndexedDB)</span>
              </div>
            </div>

            <!-- Button: Zum Hauptmenü -->
            <button id="btn-goto-main-menu" class="w-full mt-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-pitch-emerald border border-pitch-emerald/40 hover:border-pitch-emerald font-display font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
              <span>🏠</span>
              <span>Zum Hauptmenü (3 Speicherslots)</span>
            </button>
          </div>

          <!-- Section 2: Audio & Effekte (Web Audio Synthesizer) -->
          <div class="glass-card rounded-2xl p-3 flex flex-col gap-2.5 border border-white/5 bg-slate-900/60">
            <h4 class="font-display font-bold text-xs text-slate-200 uppercase tracking-wider">Audio & Effekte</h4>
            
            <div class="flex items-center justify-between text-xs">
              <div class="flex flex-col">
                <span class="text-slate-200 font-semibold">TCG Sound-Effekte</span>
                <span class="text-[10px] text-slate-400">Karten-Flip, Pack-Rip & Tor-Jubel</span>
              </div>
              <button id="btn-toggle-sound" class="w-12 h-6 rounded-full transition-colors flex items-center px-1 shadow-inner ${
                soundActive ? 'bg-pitch-emerald justify-end' : 'bg-slate-800 justify-start'
              }">
                <span class="w-4 h-4 rounded-full bg-pitch-dark shadow"></span>
              </button>
            </div>
          </div>

          <!-- Section 3: Match-Tempo (Simulations-Geschwindigkeit) -->
          <div class="glass-card rounded-2xl p-3 flex flex-col gap-2 border border-white/5 bg-slate-900/60">
            <div class="flex items-center justify-between">
              <h4 class="font-display font-bold text-xs text-slate-200 uppercase tracking-wider">Match-Simulation</h4>
              <span class="font-mono text-[9px] text-slate-400">Tempo für Duelle</span>
            </div>
            <div class="grid grid-cols-3 gap-1.5 text-center text-xs font-mono">
              <button data-sim-speed="real" class="sim-speed-btn py-2 rounded-xl border transition-all ${
                simSpeed === 'real' ? 'bg-pitch-emerald text-pitch-dark font-black border-pitch-emerald shadow-[0_0_10px_#00f59b]' : 'bg-slate-800/80 text-slate-400 border-transparent hover:text-slate-200'
              }">1x Real</button>
              <button data-sim-speed="fast" class="sim-speed-btn py-2 rounded-xl border transition-all ${
                simSpeed === 'fast' ? 'bg-pitch-emerald text-pitch-dark font-black border-pitch-emerald shadow-[0_0_10px_#00f59b]' : 'bg-slate-800/80 text-slate-400 border-transparent hover:text-slate-200'
              }">2x Schnell</button>
              <button data-sim-speed="blitz" class="sim-speed-btn py-2 rounded-xl border transition-all ${
                simSpeed === 'blitz' ? 'bg-pitch-emerald text-pitch-dark font-black border-pitch-emerald shadow-[0_0_10px_#00f59b]' : 'bg-slate-800/80 text-slate-400 border-transparent hover:text-slate-200'
              }">⚡ Blitz</button>
            </div>
          </div>

          <!-- Section 4: Danger Zone -->
          <div class="pt-1">
            <button id="btn-reset-current-slot" class="w-full py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 font-display font-bold text-xs uppercase tracking-wider border border-red-500/30 active:scale-95 transition-all flex items-center justify-center gap-1.5">
              <span>⚠️</span>
              <span>Spielstand in Slot ${slotNum} löschen</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  `;
}
