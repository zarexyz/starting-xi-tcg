// =============================================================================
// Starting XI TCG — Modal: Booster Pack Opening & Walkout Celebration
// =============================================================================

import { renderFUTCard } from '../components/card.js';

export function renderPackWalkoutModal(packResult) {
  const { pack, isDraft, candidates, cards } = packResult;
  let selectedId = packResult.selectedCandidate?.id || candidates?.[0]?.id;

  return `
    <div class="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col p-4 max-w-md mx-auto justify-between animate-fadeIn overflow-hidden">
      
      <!-- Ambient Lighting & God-Rays -->
      <div class="absolute inset-0 bg-radial-gold pointer-events-none opacity-40"></div>
      <div class="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-pitch-gold/20 blur-3xl pointer-events-none"></div>

      <!-- Header: Walkout Badge -->
      <div class="relative z-10 text-center mt-2">
        <span class="inline-block px-4 py-1.5 rounded-full font-display font-black text-xs uppercase tracking-wider text-pitch-gold bg-yellow-500/15 border border-pitch-gold/50 shadow-[0_0_20px_rgba(255,209,92,0.4)] animate-pulse">
          ⭐ ${pack.name.toUpperCase()} REVEAL ⭐
        </span>
        <p class="font-sans text-xs text-slate-300 mt-1">${pack.subtitle}</p>
      </div>

      <!-- Center Stage -->
      <div class="relative z-10 flex-1 flex flex-col justify-center items-center my-3">
        ${isDraft ? `
          <!-- Pick 1 of 3 Selection View -->
          <div class="flex items-center justify-center gap-2 w-full overflow-x-auto py-2 no-scrollbar">
            ${candidates.map(candidate => {
              const isSelected = candidate.id === selectedId;
              return `
                <div class="flex flex-col items-center gap-2 cursor-pointer transition-transform ${isSelected ? 'scale-105' : 'opacity-70 hover:opacity-100'}"
                     data-pick-candidate="${candidate.id}">
                  ${renderFUTCard(candidate, { compact: false, selected: isSelected })}
                  <button class="px-3 py-1 rounded-lg text-[10px] font-display font-bold uppercase ${isSelected ? 'bg-pitch-emerald text-pitch-dark' : 'bg-slate-800 text-slate-400'}">
                    ${isSelected ? 'Ausgewählt ✓' : 'Wählen'}
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <!-- Consumable Cards Reveal Grid -->
          <div class="grid grid-cols-2 gap-3 w-full">
            ${cards.map(card => `
              <div class="glass-card rounded-2xl p-3 border border-slate-700 flex flex-col items-center text-center shadow-xl">
                <span class="text-3xl my-1">${card.icon}</span>
                <h4 class="font-display font-extrabold text-xs text-slate-100">${card.name}</h4>
                <span class="font-mono text-[9px] text-pitch-cyan font-bold uppercase mt-0.5">${card.title}</span>
                <p class="font-sans text-[10px] text-slate-400 mt-1 leading-snug">${card.description}</p>
              </div>
            `).join('')}
          </div>
        `}
      </div>

      <!-- Bottom Confirm Action -->
      <div class="relative z-10 flex flex-col gap-2">
        <button id="btn-confirm-pack-rewards" class="w-full py-3.5 rounded-xl bg-pitch-emerald hover:bg-emerald-400 text-pitch-dark font-display font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(0,245,155,0.5)] active:scale-98 transition-all flex items-center justify-center gap-2">
          <span>${isDraft ? 'Diesen Spieler in Verein einpflegen' : 'Alle 4 Karten ins Inventar übernehmen'}</span>
        </button>
      </div>

    </div>
  `;
}
