// =============================================================================
// Starting XI TCG — Modal: Verbrauchsgegenstände-Inventar
// Centered Top Dialog with Working Filter Chips & Training Cards
// =============================================================================

export function renderConsumablesModal(inventory = [], squad = [], activeFilter = 'all') {
  const filteredInventory = inventory.filter(card => {
    if (activeFilter === 'all') return true;
    return card.type?.toLowerCase() === activeFilter.toLowerCase();
  });

  const filterCounts = {
    all: inventory.length,
    training: inventory.filter(c => c.type === 'TRAINING').length,
    contract: inventory.filter(c => c.type === 'CONTRACT').length,
    fitness: inventory.filter(c => c.type === 'FITNESS').length,
    medical: inventory.filter(c => c.type === 'MEDICAL').length,
    tactic: inventory.filter(c => c.type === 'TACTIC').length
  };

  return `
    <div class="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex flex-col justify-center items-center p-4 max-w-md mx-auto animate-fadeIn select-none">
      
      <!-- Centered Modal Container -->
      <div class="glass-modal rounded-3xl p-5 border border-pitch-emerald/40 shadow-2xl flex flex-col w-full max-h-[88vh] overflow-hidden">
        
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

        <!-- Filter Chips (Horizontally Scrollable) -->
        <div class="flex gap-1.5 my-3 overflow-x-auto no-scrollbar py-1">
          <button data-filter-consumable="all" class="px-3 py-1 rounded-full font-display font-extrabold text-[10px] uppercase whitespace-nowrap transition-all ${
            activeFilter === 'all' ? 'bg-pitch-emerald text-pitch-dark' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }">
            Alle (${filterCounts.all})
          </button>
          <button data-filter-consumable="training" class="px-3 py-1 rounded-full font-display font-extrabold text-[10px] uppercase whitespace-nowrap transition-all ${
            activeFilter === 'training' ? 'bg-pitch-emerald text-pitch-dark' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }">
            Training (${filterCounts.training})
          </button>
          <button data-filter-consumable="contract" class="px-3 py-1 rounded-full font-display font-extrabold text-[10px] uppercase whitespace-nowrap transition-all ${
            activeFilter === 'contract' ? 'bg-pitch-emerald text-pitch-dark' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }">
            Vertrag (${filterCounts.contract})
          </button>
          <button data-filter-consumable="fitness" class="px-3 py-1 rounded-full font-display font-extrabold text-[10px] uppercase whitespace-nowrap transition-all ${
            activeFilter === 'fitness' ? 'bg-pitch-emerald text-pitch-dark' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }">
            Fitness (${filterCounts.fitness})
          </button>
          <button data-filter-consumable="medical" class="px-3 py-1 rounded-full font-display font-extrabold text-[10px] uppercase whitespace-nowrap transition-all ${
            activeFilter === 'medical' ? 'bg-pitch-emerald text-pitch-dark' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }">
            Medizin (${filterCounts.medical})
          </button>
          <button data-filter-consumable="tactic" class="px-3 py-1 rounded-full font-display font-extrabold text-[10px] uppercase whitespace-nowrap transition-all ${
            activeFilter === 'tactic' ? 'bg-pitch-emerald text-pitch-dark' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }">
            Taktik (${filterCounts.tactic})
          </button>
        </div>

        <!-- Consumable Cards List -->
        <div class="flex-1 flex flex-col gap-3 overflow-y-auto no-scrollbar pr-1 pb-2">
          ${filteredInventory.length ? filteredInventory.map(card => {
            const isGold = card.rarity === 'gold' || card.rarity === 'special';
            const isCyan = card.rarity === 'cyan';
            const borderColor = isGold ? 'border-amber-400/50' : (isCyan ? 'border-cyan-400/50' : 'border-slate-700');
            const glowBg = isGold ? 'bg-amber-950/20' : (isCyan ? 'bg-cyan-950/20' : 'bg-slate-900/60');
            const badgeColor = isGold ? 'text-amber-300 border-amber-500/50 bg-amber-950/80' : (isCyan ? 'text-cyan-300 border-cyan-500/50 bg-cyan-950/80' : 'text-slate-300 border-slate-600 bg-slate-900/80');

            return `
              <div class="relative rounded-2xl p-3 border ${borderColor} ${glowBg} shadow-lg flex flex-col gap-2.5 overflow-hidden">
                <div class="card-rayburst opacity-20 pointer-events-none"></div>

                <div class="relative z-10 flex items-start gap-3">
                  <div class="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shadow-inner shrink-0">
                    ${card.icon}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                      <h4 class="font-display font-black text-xs text-slate-100 uppercase tracking-wide truncate">${card.name}</h4>
                      <span class="font-mono text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${badgeColor} shrink-0">
                        ${card.type}
                      </span>
                    </div>
                    <span class="font-mono text-[10px] text-pitch-gold font-bold block mt-0.5 truncate">${card.title}</span>
                    <p class="font-sans text-[10px] text-slate-300 leading-tight mt-1">${card.description}</p>
                  </div>
                </div>

                <!-- Target Player Selector & Apply CTA -->
                <div class="relative z-10 flex items-center gap-2 pt-2 border-t border-white/5">
                  <select data-target-select="${card.instanceId}" class="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono text-slate-200 outline-none">
                    ${squad.map(p => `
                      <option value="${p.id}">${p.name} (${p.position}, ${p.ovr} OVR)${p.trainingCount ? ` [${p.trainingCount}/3 Tr.]` : ''}</option>
                    `).join('')}
                  </select>

                  <button data-apply-card="${card.instanceId}" class="px-4 py-1.5 rounded-xl bg-pitch-emerald hover:bg-emerald-400 text-pitch-dark font-display font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(0,245,155,0.3)] active:scale-95 transition-all whitespace-nowrap">
                    Anwenden ➔
                  </button>
                </div>

              </div>
            `;
          }).join('') : `
            <div class="flex flex-col items-center justify-center py-10 text-center text-slate-500">
              <span class="text-3xl mb-2">📦</span>
              <p class="font-sans text-xs">Keine Karten in dieser Kategorie vorhanden.</p>
              <span class="font-mono text-[10px] text-slate-600 mt-1">Ziehe Booster-Packs auf dem Markt für Nachschub!</span>
            </div>
          `}
        </div>

      </div>
    </div>
  `;
}
