// =============================================================================
// Starting XI TCG — Modal: Verbrauchsgegenstände-Inventar
// =============================================================================

export function renderConsumablesModal(inventory, squad) {
  return `
    <div class="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex flex-col justify-end max-w-md mx-auto animate-fadeIn">
      
      <!-- Slide-Up Modal Container -->
      <div class="glass-modal rounded-t-3xl p-4 border-t-2 border-pitch-emerald shadow-2xl flex flex-col max-h-[85vh] h-[600px] overflow-hidden">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <span class="text-xl">📦</span>
            <div>
              <h3 class="font-display font-black text-sm text-slate-100 uppercase tracking-wide">Karten-Inventar</h3>
              <span class="font-mono text-[10px] text-pitch-emerald font-bold">
                ${inventory.length} VERBRAUCHSKARTEN VERFÜGBAR
              </span>
            </div>
          </div>
          <button id="btn-close-modal" class="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold">
            ✕
          </button>
        </div>

        <!-- Filter Chips -->
        <div class="flex gap-2 my-3">
          <button class="px-3 py-1 rounded-full bg-pitch-emerald text-pitch-dark font-display font-extrabold text-[10px] uppercase">
            Alle (${inventory.length})
          </button>
          <button class="px-3 py-1 rounded-full bg-slate-800 text-slate-400 hover:text-slate-200 font-display font-bold text-[10px] uppercase">
            Vertrag
          </button>
          <button class="px-3 py-1 rounded-full bg-slate-800 text-slate-400 hover:text-slate-200 font-display font-bold text-[10px] uppercase">
            Fitness
          </button>
        </div>

        <!-- Consumable Cards List -->
        <div class="flex-1 flex flex-col gap-3 overflow-y-auto no-scrollbar pr-1 pb-4">
          ${inventory.length ? inventory.map(card => {
            const isGold = card.rarity === 'gold';
            const isCyan = card.rarity === 'cyan';
            const borderColor = isGold ? 'border-amber-400/50' : (isCyan ? 'border-cyan-400/50' : 'border-slate-600/60');
            const glowBg = isGold ? 'bg-amber-950/20' : (isCyan ? 'bg-cyan-950/20' : 'bg-slate-900/40');
            const badgeColor = isGold ? 'text-amber-300 border-amber-500/50 bg-amber-950/80' : (isCyan ? 'text-cyan-300 border-cyan-500/50 bg-cyan-950/80' : 'text-slate-300 border-slate-600 bg-slate-900/80');

            return `
              <div class="relative rounded-2xl p-3 border ${borderColor} ${glowBg} shadow-lg flex flex-col gap-2.5 overflow-hidden">
                <div class="card-rayburst opacity-20 pointer-events-none"></div>

                <div class="relative z-10 flex items-start gap-3">
                  <div class="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shadow-inner">
                    ${card.icon}
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center justify-between">
                      <h4 class="font-display font-black text-xs text-slate-100 uppercase tracking-wide">${card.name}</h4>
                      <span class="font-mono text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${badgeColor}">
                        ${card.type}
                      </span>
                    </div>
                    <span class="font-mono text-[10px] text-pitch-gold font-bold block mt-0.5">${card.title}</span>
                    <p class="font-sans text-[10px] text-slate-300 leading-tight mt-1">${card.description}</p>
                  </div>
                </div>

                <!-- Target Player Selector & Apply CTA -->
                <div class="relative z-10 flex items-center gap-2 pt-2 border-t border-white/10">
                  <select data-target-select="${card.instanceId}" class="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono text-slate-200 outline-none focus:border-pitch-emerald">
                    ${squad.map(p => `
                      <option value="${p.id}">
                        ${p.shortName} (${p.position}, ${p.ovr} OVR, ${p.condition}% Fit)
                      </option>
                    `).join('')}
                  </select>
                  <button data-apply-card="${card.instanceId}" class="px-4 py-1.5 rounded-xl bg-pitch-emerald hover:bg-emerald-400 text-pitch-dark font-display font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(0,245,155,0.4)] active:scale-95 transition-all">
                    Anwenden
                  </button>
                </div>
              </div>
            `;
          }).join('') : `
            <div class="flex flex-col items-center justify-center my-12 text-center text-slate-500">
              <span class="text-4xl mb-2">📭</span>
              <p class="text-xs">Dein Inventar ist leer.</p>
              <p class="text-[11px] mt-1">Ziehe neue Verbrauchskarten im TCG-Markt!</p>
            </div>
          `}
        </div>

      </div>

    </div>
  `;
}
