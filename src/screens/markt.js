// =============================================================================
// Starting XI TCG — Screen 4: Markt & Booster-Drafts View
// =============================================================================

import { PACK_TIERS } from '../engine/packs.js';

export function renderMarktScreen(state) {
  const club = state.leagues.find(l => l.tier === 6)?.clubs.find(c => c.id === state.playerClubId);

  return `
    <div class="flex-1 flex flex-col p-3 gap-3.5 pb-24 overflow-y-auto no-scrollbar">
      
      <!-- Market Header Banner -->
      <div class="glass-panel rounded-2xl p-4 border border-pitch-gold/30 flex items-center justify-between">
        <div>
          <span class="font-mono text-[10px] text-pitch-gold uppercase tracking-wider block font-bold">TCG Booster-Kiosk</span>
          <h2 class="font-display font-black text-lg text-slate-100">Drafts & Packs</h2>
        </div>
        <div class="text-right">
          <span class="font-mono text-[10px] text-slate-400 block">Dein Budget</span>
          <span class="font-mono font-bold text-sm text-pitch-gold">🪙 ${(club?.coins || 0).toLocaleString()}</span>
        </div>
      </div>

      <!-- Booster Packs Grid -->
      <div class="flex flex-col gap-3">
        <h3 class="font-display font-bold text-xs text-slate-300 uppercase tracking-wider">Verfügbare Booster & Drafts</h3>

        ${PACK_TIERS.map(pack => {
          const canAfford = (club?.coins || 0) >= pack.price;
          return `
            <div class="glass-card rounded-2xl p-4 border border-slate-700/60 hover:border-pitch-emerald/60 transition-all flex items-center justify-between shadow-lg">
              <div class="flex items-center gap-3.5 flex-1 pr-2">
                <div class="w-12 h-14 rounded-xl flex items-center justify-center text-2xl shadow-inner border"
                     style="background: radial-gradient(circle, #1f2c42 0%, #0a0d14 100%); border-color: ${pack.color};">
                  ${pack.icon}
                </div>
                <div class="flex flex-col">
                  <div class="flex items-center gap-2">
                    <h4 class="font-display font-black text-sm text-slate-100">${pack.name}</h4>
                    <span class="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                      ${pack.rarity}
                    </span>
                  </div>
                  <p class="font-sans text-xs text-slate-400 mt-0.5 leading-snug">${pack.description}</p>
                </div>
              </div>

              <!-- Price & Open CTA -->
              <button data-open-pack="${pack.id}" 
                      class="px-3.5 py-2.5 rounded-xl font-display font-bold text-xs uppercase tracking-wide active:scale-95 transition-all shrink-0 ${canAfford ? 'bg-pitch-emerald text-pitch-dark shadow-[0_0_15px_rgba(0,245,155,0.3)] hover:bg-emerald-400' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}"
                      ${!canAfford ? 'disabled' : ''}>
                ${pack.price} 🪙
              </button>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Scouting Info Banner -->
      <div class="glass-panel rounded-xl p-3 flex items-center gap-3 text-xs text-slate-400">
        <span class="text-xl">🔍</span>
        <p class="font-sans leading-relaxed text-[11px]">
          Alle gezogenen Spieler sind <b>100% Unikate</b>. Beim Rookie-Draft wählst du <b>1 von 3 Talenten</b> – die restlichen Karten fließen in den weltweiten Pool der KI-Vereine.
        </p>
      </div>

    </div>
  `;
}
