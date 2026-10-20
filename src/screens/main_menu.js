// =============================================================================
// Starting XI TCG — Main Menu & 3 Save Slots Screen
// =============================================================================

import { renderClubCrest } from '../components/crest.js';

export function renderMainMenuScreen(slots = [], activeSlotId = 'slot_1', hasRunningGame = false) {
  return `
    <div class="fixed inset-0 z-50 bg-[#070b12] flex flex-col justify-between p-4 max-w-md mx-auto select-none overflow-y-auto no-scrollbar animate-fadeIn">
      
      <!-- Ambient Lighting -->
      <div class="absolute inset-0 bg-radial-gold opacity-20 pointer-events-none"></div>

      <!-- Top Header -->
      <div class="relative z-10 flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <span class="font-mono text-[9px] text-pitch-gold uppercase tracking-wider block font-bold">STARTING XI TCG</span>
          <h2 class="font-display font-black text-xl text-slate-100 uppercase tracking-tight">Hauptmenü</h2>
        </div>
        ${hasRunningGame ? `
          <button id="btn-return-to-game" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-display font-bold text-xs uppercase flex items-center gap-1.5">
            <span>Zurück zum Spiel</span>
            <span>➔</span>
          </button>
        ` : ''}
      </div>

      <!-- Subtitle -->
      <div class="relative z-10 text-center my-3">
        <h3 class="font-display font-black text-sm text-slate-200 uppercase tracking-wide">
          Wähle einen Speicherstand (3 Slots)
        </h3>
        <p class="font-sans text-[11px] text-slate-400 mt-0.5">
          Jeder Slot speichert deine gesamte Liga-Kampagne und Kartensammlung unabhängig.
        </p>
      </div>

      <!-- 3 Save Slots List -->
      <div class="relative z-10 flex-1 flex flex-col gap-3 my-2">
        ${slots.map((slot, index) => {
          const isActive = slot.id === activeSlotId;
          return `
            <div class="glass-card rounded-2xl p-4 border transition-all ${
              slot.occupied 
                ? (isActive ? 'border-pitch-emerald shadow-[0_0_20px_rgba(0,245,155,0.25)] bg-slate-900/90' : 'border-slate-800 bg-slate-950/80') 
                : 'border-dashed border-slate-700 bg-slate-950/40 hover:border-slate-600'
            } flex flex-col justify-between gap-3">
              
              <!-- Slot Header Info -->
              <div class="flex items-center justify-between border-b border-white/5 pb-2">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-xs font-black text-pitch-gold uppercase">SLOT ${index + 1}</span>
                  ${isActive && slot.occupied ? `
                    <span class="px-2 py-0.5 rounded-full bg-emerald-950 text-pitch-emerald border border-pitch-emerald/50 font-mono text-[8px] font-black uppercase">
                      AKTIV
                    </span>
                  ` : ''}
                </div>
                ${slot.occupied ? `
                  <span class="font-mono text-[9px] text-slate-400">
                    ${slot.lastSaved ? new Date(slot.lastSaved).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                ` : `
                  <span class="font-mono text-[9px] text-slate-500 uppercase">FREI</span>
                `}
              </div>

              ${slot.occupied ? `
                <!-- Occupied Slot Content -->
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    ${renderClubCrest({
                      name: slot.clubName,
                      crestForm: slot.crestForm,
                      primaryColor: slot.primaryColor,
                      secondaryColor: slot.secondaryColor
                    }, 44)}
                    <div>
                      <h4 class="font-display font-black text-sm text-slate-100 uppercase tracking-tight">${slot.clubName}</h4>
                      <div class="flex items-center gap-2 mt-0.5">
                        <span class="font-mono text-[10px] text-pitch-emerald font-semibold">Liga 6 • Tag ${slot.matchday}/18</span>
                        <span class="text-slate-600">•</span>
                        <span class="font-mono text-[10px] text-pitch-gold font-bold">🪙 ${slot.coins.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex items-center gap-2 pt-1">
                  <button data-load-slot="${slot.id}" class="flex-1 py-2.5 rounded-xl bg-pitch-emerald hover:bg-emerald-400 text-pitch-dark font-display font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(0,245,155,0.3)] active:scale-95 transition-all">
                    Spielstand Laden ➔
                  </button>
                  <button data-delete-slot="${slot.id}" class="w-10 h-10 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-400 hover:text-red-200 flex items-center justify-center text-sm active:scale-95 transition-all" title="Spielstand löschen">
                    🗑️
                  </button>
                </div>
              ` : `
                <!-- Empty Slot Content -->
                <div class="flex flex-col items-center justify-center py-4 text-center">
                  <span class="text-3xl mb-1 text-slate-600">📁</span>
                  <span class="font-display font-bold text-xs text-slate-400 uppercase">Leerer Speicherslot</span>
                  <p class="font-sans text-[10px] text-slate-500 mt-0.5">Beginne hier eine neue Kampagne in Liga 6</p>
                  
                  <button data-new-slot="${slot.id}" class="mt-3 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-pitch-emerald/50 hover:border-pitch-emerald font-display font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all flex items-center gap-2">
                    <span>+</span>
                    <span>Neues Spiel starten</span>
                  </button>
                </div>
              `}

            </div>
          `;
        }).join('')}
      </div>

      <!-- Bottom System Info -->
      <div class="relative z-10 text-center py-2 text-slate-600 font-mono text-[9px]">
        Auto-Save aktiv • Lokale Speicherung in deinem Browser
      </div>

    </div>
  `;
}
