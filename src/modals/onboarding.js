// =============================================================================
// Starting XI TCG — Modernized Club Creator & Road to Glory Onboarding
// Interactive Crest Studio (5 Shapes + Dual Color Studio)
// =============================================================================

import { renderClubCrest, CREST_SHAPES } from '../components/crest.js';

export function renderOnboardingModal(targetSlot = 'slot_1', initialValues = {}) {
  const defaultClubName = initialValues.clubName || 'FC Apex Nova';
  const defaultCrestForm = initialValues.crestForm || 'shield';
  const defaultPrimaryColor = initialValues.primaryColor || '#00f59b';
  const defaultSecondaryColor = initialValues.secondaryColor || '#ffd15c';

  const colorPresets = [
    { name: 'Smaragd', hex: '#00f59b' },
    { name: 'Gold', hex: '#ffd15c' },
    { name: 'Cyan / Sky', hex: '#0ea5e9' },
    { name: 'Karminrot', hex: '#ef4444' },
    { name: 'Violett', hex: '#a855f7' },
    { name: 'Orange', hex: '#f97316' },
    { name: 'Obsidian', hex: '#1e293b' },
    { name: 'Schneeweiß', hex: '#f8fafc' }
  ];

  return `
    <div class="fixed inset-0 z-50 bg-[#070b12] flex flex-col p-4 max-w-md mx-auto justify-between animate-fadeIn overflow-y-auto no-scrollbar select-none">
      
      <!-- Ambient Lighting -->
      <div class="absolute inset-0 bg-radial-gold opacity-20 pointer-events-none"></div>

      <!-- Top Header -->
      <div class="relative z-10 flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <span class="font-mono text-[9px] text-pitch-gold uppercase tracking-wider block font-bold">
            NEUER VEREIN • ${targetSlot.toUpperCase().replace('_', ' ')}
          </span>
          <h2 class="font-display font-black text-lg text-slate-100 uppercase tracking-tight">
            Club-Gründung & Design-Studio
          </h2>
        </div>
        <button id="btn-cancel-onboarding" class="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-400 hover:text-white font-mono text-xs font-bold">
          ✕
        </button>
      </div>

      <div class="relative z-10 flex-1 flex flex-col gap-3.5 my-3">
        
        <!-- Live Crest & Preview Hero Card -->
        <div class="glass-card rounded-2xl p-4 border border-pitch-emerald/30 shadow-2xl flex items-center gap-4 bg-gradient-to-br from-slate-900/90 to-slate-950/90">
          <div id="live-crest-preview">
            ${renderClubCrest({
              name: defaultClubName,
              crestForm: defaultCrestForm,
              primaryColor: defaultPrimaryColor,
              secondaryColor: defaultSecondaryColor
            }, 64)}
          </div>
          <div class="flex-1 truncate">
            <span class="font-mono text-[9px] text-pitch-emerald uppercase font-bold tracking-wider block">WAPPEN-VORSCHAU</span>
            <h3 id="live-club-name-preview" class="font-display font-black text-lg text-slate-100 uppercase tracking-tight truncate">
              ${defaultClubName}
            </h3>
            <span class="font-mono text-[10px] text-slate-400 block mt-0.5">Start in Liga 6 (Amateure)</span>
          </div>
        </div>

        <!-- 1. Club Name Input -->
        <div class="glass-card rounded-2xl p-3.5 flex flex-col gap-1.5 border border-slate-800">
          <label class="font-mono text-[10px] text-slate-300 font-bold uppercase tracking-wider">
            1. Vereinsname eingeben
          </label>
          <input id="input-club-name" type="text" value="${defaultClubName}" maxlength="24"
                 class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-display font-black text-pitch-emerald outline-none focus:border-pitch-emerald transition-colors" />
        </div>

        <!-- 2. Wappenform (Crest Shape Selector) -->
        <div class="glass-card rounded-2xl p-3.5 flex flex-col gap-2 border border-slate-800">
          <label class="font-mono text-[10px] text-slate-300 font-bold uppercase tracking-wider">
            2. Wappenform wählen
          </label>
          <div class="grid grid-cols-5 gap-1.5">
            ${CREST_SHAPES.map(shape => {
              const isSelected = shape.id === defaultCrestForm;
              return `
                <button type="button" data-shape-choice="${shape.id}" 
                        class="shape-btn p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${
                          isSelected 
                            ? 'bg-pitch-emerald/20 border-pitch-emerald ring-2 ring-pitch-emerald/60 text-slate-100' 
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }">
                  <span class="text-xl">${shape.icon}</span>
                  <span class="font-display font-black text-[9px] uppercase mt-1">${shape.name}</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 3. Farben-Studio (Primary & Border Colors) -->
        <div class="glass-card rounded-2xl p-3.5 flex flex-col gap-3.5 border border-slate-800">
          <label class="font-mono text-[10px] text-slate-300 font-bold uppercase tracking-wider">
            3. Vereinsfarben definieren
          </label>

          <!-- Hauptfarbe -->
          <div class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-sans text-slate-300 font-semibold">Hauptfarbe (Trikot & Füllung)</span>
              <div class="flex items-center gap-2">
                <input id="input-primary-color" type="color" value="${defaultPrimaryColor}" class="w-6 h-6 rounded-lg bg-transparent border-0 cursor-pointer" />
                <span id="hex-primary-label" class="font-mono text-[10px] text-pitch-emerald font-bold">${defaultPrimaryColor}</span>
              </div>
            </div>
            <div class="flex gap-2 overflow-x-auto no-scrollbar py-1">
              ${colorPresets.map(c => `
                <button type="button" data-preset-primary="${c.hex}" class="w-7 h-7 rounded-full border border-white/20 flex-shrink-0 transition-transform hover:scale-110 active:scale-95" style="background: ${c.hex};" title="${c.name}"></button>
              `).join('')}
            </div>
          </div>

          <!-- Randfarbe -->
          <div class="flex flex-col gap-1.5 border-t border-white/5 pt-2">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-sans text-slate-300 font-semibold">Randfarbe (Rahmen & Akzent)</span>
              <div class="flex items-center gap-2">
                <input id="input-secondary-color" type="color" value="${defaultSecondaryColor}" class="w-6 h-6 rounded-lg bg-transparent border-0 cursor-pointer" />
                <span id="hex-secondary-label" class="font-mono text-[10px] text-pitch-gold font-bold">${defaultSecondaryColor}</span>
              </div>
            </div>
            <div class="flex gap-2 overflow-x-auto no-scrollbar py-1">
              ${colorPresets.map(c => `
                <button type="button" data-preset-secondary="${c.hex}" class="w-7 h-7 rounded-full border border-white/20 flex-shrink-0 transition-transform hover:scale-110 active:scale-95" style="background: ${c.hex};" title="${c.name}"></button>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Info Box: Starter Packs Announcement -->
        <div class="glass-panel rounded-2xl p-3 border border-pitch-gold/30 bg-yellow-500/5 flex items-center gap-3">
          <span class="text-3xl">🎁</span>
          <div class="flex flex-col">
            <b class="font-display text-xs text-pitch-gold uppercase">2 Kostenlose Starter-Booster inklusive!</b>
            <span class="font-sans text-[11px] text-slate-300 leading-tight">
              1. Basiskader-Pack (18 Spieler) + 2. Starspieler-Draft (Silber/Gold Star) direkt zum Aufreißen!
            </span>
          </div>
        </div>

      </div>

      <!-- Action Button -->
      <div class="relative z-10 pt-2 pb-1">
        <button id="btn-submit-onboarding" data-target-slot="${targetSlot}" 
                class="w-full py-4 rounded-xl bg-pitch-emerald hover:bg-emerald-400 text-pitch-dark font-display font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(0,245,155,0.4)] active:scale-98 transition-all flex items-center justify-center gap-2">
          <span>Verein gründen & Starter-Packs öffnen</span>
          <span>➔</span>
        </button>
      </div>

    </div>
  `;
}
