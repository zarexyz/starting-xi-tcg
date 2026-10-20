// =============================================================================
// Starting XI TCG — Modal: Booster Pack Opening & Walkout Celebration
// =============================================================================

import { renderFUTCard, renderConsumableCard } from '../components/card.js';

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
      <div class="relative z-10 flex-1 flex flex-col justify-center items-center my-3 w-full">
        ${isDraft ? `
          <!-- Pick 1 of 3 Selection View (Smooth horizontal carousel) -->
          <div class="flex items-center gap-3 w-full overflow-x-auto py-3 px-1 no-scrollbar snap-x snap-mandatory justify-start sm:justify-center">
            ${candidates.map(candidate => {
              const isSelected = candidate.id === selectedId;
              return `
                <div class="flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer transition-all duration-300 snap-center ${
                  isSelected ? 'scale-105 z-20' : 'opacity-65 hover:opacity-100 scale-95'
                }"
                     data-pick-candidate="${candidate.id}">
                  ${renderFUTCard(candidate, { compact: false, selected: isSelected })}
                  <button class="px-4 py-1.5 rounded-xl text-xs font-display font-black uppercase tracking-wider transition-all ${
                    isSelected
                      ? 'bg-pitch-emerald text-pitch-dark shadow-[0_0_15px_#00f59b]'
                      : 'bg-slate-800/90 text-slate-400 hover:text-slate-100 border border-slate-700'
                  }">
                    ${isSelected ? 'Ausgewählt ✓' : 'Wählen'}
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <!-- Consumable Cards Reveal Grid (Real TCG Items) -->
          <div class="grid grid-cols-2 gap-2.5 w-full justify-items-center">
            ${cards.map(card => renderConsumableCard(card, { compact: true, showAction: false })).join('')}
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
