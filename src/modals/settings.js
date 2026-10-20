// =============================================================================
// Starting XI TCG — Modal: Einstellungen & Spieloptionen
// =============================================================================

import { renderClubCrest } from '../components/crest.js';

export function renderSettingsModal(state) {
  const club = state.leagues.find(l => l.tier === 6)?.clubs.find(c => c.id === state.playerClubId);

  return `
    <div class="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex flex-col justify-end max-w-md mx-auto animate-fadeIn">
      
      <!-- Slide-Up Modal Container -->
      <div class="glass-modal rounded-t-3xl p-4 border-t-2 border-pitch-emerald shadow-2xl flex flex-col max-h-[85vh] h-[550px] overflow-hidden">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <span class="text-xl">⚙️</span>
            <div>
              <h3 class="font-display font-black text-sm text-slate-100 uppercase tracking-wide">Einstellungen</h3>
              <span class="font-mono text-[10px] text-slate-400">Spieloptionen & Spielstand</span>
            </div>
          </div>
          <button id="btn-close-modal" class="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold">
            ✕
          </button>
        </div>

        <div class="flex-1 flex flex-col gap-4 overflow-y-auto no-scrollbar py-3">
          
          <!-- Section 1: Audio & Sound -->
          <div class="glass-card rounded-2xl p-3 flex flex-col gap-2.5">
            <h4 class="font-display font-bold text-xs text-slate-200 uppercase tracking-wider">Audio & Effekte</h4>
            
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-300">TCG Sound-Effekte (Karten-Flip, Walkout)</span>
              <button class="w-10 h-6 rounded-full bg-pitch-emerald flex items-center justify-end px-1 shadow-[0_0_8px_#00f59b]">
                <span class="w-4 h-4 rounded-full bg-pitch-dark"></span>
              </button>
            </div>

            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-300">Stadion-Atmosphäre</span>
              <input type="range" min="0" max="100" value="70" class="w-24 accent-pitch-emerald" />
            </div>
          </div>

          <!-- Section 2: Match-Tempo -->
          <div class="glass-card rounded-2xl p-3 flex flex-col gap-2.5">
            <h4 class="font-display font-bold text-xs text-slate-200 uppercase tracking-wider">Match-Simulation</h4>
            <div class="grid grid-cols-3 gap-1.5 text-center text-xs font-mono">
              <button class="py-1.5 rounded-xl bg-slate-800 text-slate-400 font-bold">1x Real</button>
              <button class="py-1.5 rounded-xl bg-slate-800 text-slate-400 font-bold">2x Schnell</button>
              <button class="py-1.5 rounded-xl bg-pitch-emerald text-pitch-dark font-black shadow-[0_0_10px_#00f59b]">⚡ Blitz</button>
            </div>
          </div>

          <!-- Section 3: Club & Cloud Sync -->
          <div class="glass-card rounded-2xl p-3 flex flex-col gap-2.5">
            <h4 class="font-display font-bold text-xs text-slate-200 uppercase tracking-wider">Verein & Speicherstand</h4>
            
            <div class="flex items-center gap-3">
              ${renderClubCrest(club, 36)}
              <div>
                <span class="font-display font-bold text-xs text-slate-100 block">${club.name}</span>
                <span class="font-mono text-[10px] text-pitch-emerald font-semibold">🟢 Auto-Save aktiv (IndexedDB)</span>
              </div>
            </div>

            <button id="btn-reset-game" class="w-full mt-2 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-pitch-danger text-pitch-danger font-display font-bold text-xs uppercase tracking-wide transition-colors">
              ⚠️ Spielstand zurücksetzen
            </button>
          </div>

        </div>

      </div>

    </div>
  `;
}
