// =============================================================================
// Starting XI TCG — Modal: Pokémon TCG Pocket Style Booster Pack Opening
// Interactive foil tear swipe gesture + smooth upward card slide extraction
// + 3D card-flip reveal & Walkout flare for 80+ OVR Star Players
// =============================================================================

import { renderFUTCard, renderConsumableCard, renderFUTCardBack } from '../components/card.js';

export function renderPackWalkoutModal(packResult) {
  const { pack, isDraft, candidates, cards, isTorn, selectedCandidate } = packResult;
  let selectedId = selectedCandidate?.id || candidates?.[0]?.id;

  // Initialize revealed set
  if (!packResult.revealedIndices) {
    packResult.revealedIndices = new Set();
  }

  // Foil pack theme for the large opening foil
  const foilThemes = {
    pack_rookie: {
      bg: 'linear-gradient(145deg, #064e3b 0%, #022c22 45%, #0f172a 100%)',
      border: 'border-emerald-400',
      badge: 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60',
      shadow: 'shadow-[0_20px_50px_rgba(0,245,155,0.4)]',
      glow: 'rgba(0, 245, 155, 0.5)'
    },
    pack_veteran: {
      bg: 'linear-gradient(145deg, #075985 0%, #0c4a6e 45%, #0f172a 100%)',
      border: 'border-sky-400',
      badge: 'bg-sky-950/90 text-sky-300 border-sky-500/60',
      shadow: 'shadow-[0_20px_50px_rgba(56,189,248,0.4)]',
      glow: 'rgba(56, 189, 248, 0.5)'
    },
    pack_gold: {
      bg: 'linear-gradient(145deg, #78350f 0%, #451a03 45%, #181005 100%)',
      border: 'border-amber-400',
      badge: 'bg-amber-950/90 text-amber-300 border-amber-500/60',
      shadow: 'shadow-[0_20px_50px_rgba(255,209,92,0.5)]',
      glow: 'rgba(255, 209, 92, 0.6)'
    },
    pack_prestige_gold: {
      bg: 'linear-gradient(145deg, #78350f 0%, #451a03 45%, #181005 100%)',
      border: 'border-amber-400',
      badge: 'bg-amber-950/90 text-amber-300 border-amber-500/60',
      shadow: 'shadow-[0_20px_50px_rgba(255,209,92,0.5)]',
      glow: 'rgba(255, 209, 92, 0.6)'
    },
    pack_consumables: {
      bg: 'linear-gradient(145deg, #581c87 0%, #3b0764 45%, #0f172a 100%)',
      border: 'border-purple-400',
      badge: 'bg-purple-950/90 text-purple-300 border-purple-500/60',
      shadow: 'shadow-[0_20px_50px_rgba(168,85,247,0.4)]',
      glow: 'rgba(168, 85, 247, 0.5)'
    }
  };

  const theme = foilThemes[pack.id] || foilThemes.pack_rookie;

  // Check if any revealed player is a walkout (OVR >= 80)
  const allCardList = isDraft ? candidates : (cards || []);
  const hasRevealedWalkout = allCardList.some((c, idx) => {
    return packResult.revealedIndices.has(idx) && (c.ovr >= 80 || c.tier === 'special' || c.tier === 'gold');
  });

  return `
    <div class="fixed inset-0 z-50 bg-black/95 backdrop-blur-3xl flex flex-col p-4 max-w-md mx-auto justify-between animate-fadeIn overflow-hidden select-none">
      
      <!-- Ambient Lighting & Aura -->
      <div class="absolute inset-0 bg-radial-gold pointer-events-none opacity-40"></div>
      <div class="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none" style="background: ${theme.glow}; opacity: 0.35;"></div>

      ${hasRevealedWalkout ? `
        <!-- High-Tier Walkout Light Burst -->
        <div class="walkout-burst -top-20 left-1/2 -translate-x-1/2 z-0"></div>
      ` : ''}

      <!-- Header: Status Pill & Pack Title -->
      <div class="relative z-10 text-center mt-1">
        <span class="inline-block px-4 py-1.5 rounded-full font-display font-black text-xs uppercase tracking-wider text-pitch-gold bg-yellow-500/15 border border-pitch-gold/50 shadow-[0_0_20px_rgba(255,209,92,0.4)] animate-pulse">
          ⭐ ${pack.name.toUpperCase()} ⭐
        </span>
        <p class="font-sans text-xs text-slate-300 mt-0.5">${pack.subtitle}</p>

        ${isTorn ? `
          <div class="flex items-center justify-center gap-2 mt-2">
            <span class="font-mono text-[10px] text-pitch-emerald font-bold px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-pitch-emerald/40 animate-bounce">
              👆 Tippe Karten an zum Aufdecken!
            </span>
            <button id="btn-reveal-all-cards" class="px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[9px] font-bold border border-white/10 active:scale-95">
              ✨ Alle aufdecken
            </button>
          </div>
        ` : ''}
      </div>

      <!-- CENTER STAGE -->
      <div class="relative z-10 flex-1 flex flex-col justify-center items-center my-2 w-full overflow-hidden">
        ${!isTorn ? `
          <!-- PHASE 1: SEALED 3D FOIL PACK WITH SWIPE-TO-TEAR STRIP (POKÉMON TCG POCKET STYLE) -->
          <div class="relative flex flex-col items-center">
            
            <!-- Animated Swipe Instruction Cue -->
            <div class="mb-3 px-4 py-1.5 rounded-full bg-slate-900/90 border border-pitch-emerald/60 text-pitch-emerald font-display font-black text-xs uppercase tracking-wider shadow-[0_0_15px_#00f59b] animate-bounce flex items-center gap-2">
              <span>👉</span>
              <span>Oben wischen zum Aufreißen!</span>
            </div>

            <!-- The Big Physical Foil Pack Container -->
            <div id="sealed-pack-container" class="booster-pack border-2 ${theme.border} ${theme.shadow} flex flex-col justify-between relative overflow-hidden"
                 style="width: 230px; height: 350px; background: ${theme.bg};">
              
              <!-- ✂ TOP FOIL TEAR-STRIP (INTERACTIVE SWIPE TARGET) -->
              <div id="foil-tear-strip"
                   class="relative z-30 cursor-grab active:cursor-grabbing border-b-2 border-dashed border-white/60 bg-white/10 hover:bg-white/20 transition-colors"
                   style="height: 56px;">
                <div class="crimp-seal-top"></div>
                <div class="flex items-center justify-between px-3 pt-1 text-[9px] font-mono font-black text-white/80">
                  <span>✂ HIER REISSEN</span>
                  <span class="animate-pulse">➔ ➔ ➔</span>
                </div>
              </div>

              <!-- Foil Sheen & Hologram Layers -->
              <div class="card-rayburst opacity-40 pointer-events-none"></div>
              <div class="card-holo-sheen opacity-50"></div>

              <!-- Pack Cover Art -->
              <div class="relative z-10 flex flex-col items-center justify-center px-3 py-4 text-center my-auto">
                <div class="w-20 h-20 rounded-3xl bg-white/5 border border-white/20 flex items-center justify-center text-5xl shadow-2xl mb-3">
                  ${pack.icon}
                </div>
                <h3 class="font-display font-black text-lg uppercase tracking-tight text-slate-100 leading-tight">
                  ${pack.name}
                </h3>
                <span class="font-mono text-[9px] font-extrabold uppercase text-slate-300 mt-1 block px-2.5 py-0.5 rounded ${theme.badge} border">
                  ${pack.rarity} EDITION
                </span>
              </div>

              <!-- Bottom Metallic Crimp Seal -->
              <div class="crimp-seal-bottom border-t border-black/50"></div>
            </div>

          </div>
        ` : `
          <!-- PHASE 2: POKÉMON POCKET STYLE 3D CARD SLIDE-UP & REVEAL -->
          <div class="cards-slide-up w-full flex flex-col items-center justify-center">
            ${isDraft ? `
              <!-- Pick 1 of 3 Selection View with 3D Flip -->
              <div class="flex items-center gap-3 w-full overflow-x-auto py-3 px-2 no-scrollbar snap-x snap-mandatory justify-start sm:justify-center">
                ${candidates.map((candidate, idx) => {
                  const isRevealed = packResult.revealedIndices.has(idx);
                  const isSelected = candidate.id === selectedId;
                  const isWalkout = candidate.ovr >= 80;

                  return `
                    <div class="flex-shrink-0 flex flex-col items-center gap-2 snap-center transition-all duration-300">
                      
                      <!-- 3D Card Flip Container -->
                      <div class="card-flip-container ${isRevealed ? 'card-flipped' : ''} ${isWalkout && isRevealed ? 'drop-shadow-[0_0_20px_rgba(255,209,92,0.8)]' : ''}"
                           data-flip-card-idx="${idx}"
                           style="width: 195px; height: 290px;">
                        
                        <div class="card-flip-inner">
                          <!-- Back of Card (Shown before flip) -->
                          ${renderFUTCardBack({ width: '195px', height: '290px' })}

                          <!-- Front of Card (Revealed after flip) -->
                          <div class="card-flip-front">
                            ${renderFUTCard(candidate, { compact: false, selected: isSelected })}
                          </div>
                        </div>
                      </div>

                      <!-- Selection Button (Active once revealed) -->
                      <button class="px-4 py-1.5 rounded-xl text-xs font-display font-black uppercase tracking-wider transition-all ${
                        !isRevealed
                          ? 'opacity-40 pointer-events-none bg-slate-800 text-slate-500'
                          : (isSelected
                              ? 'bg-pitch-emerald text-pitch-dark shadow-[0_0_15px_#00f59b] scale-105'
                              : 'bg-slate-800/90 text-slate-300 hover:text-white border border-slate-700 active:scale-95')
                      }"
                              data-pick-candidate="${candidate.id}">
                        ${!isRevealed ? 'Erst aufdecken' : (isSelected ? 'Ausgewählt ✓' : 'Wählen')}
                      </button>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : (packResult.isStarterFoundation ? `
              <!-- 18-Player Foundation Squad Showcase Carousel with 3D Flip -->
              <div class="w-full flex flex-col items-center gap-2 my-auto">
                <div class="px-3 py-1 rounded-full bg-pitch-emerald/15 border border-pitch-emerald/40 text-pitch-emerald font-mono text-[10px] font-black uppercase">
                  18 GRÜNDUNGSSPIELER GEZOGEN! (11 Starter + 7 Bank)
                </div>
                <div class="flex items-center gap-3 w-full overflow-x-auto py-3 px-2 no-scrollbar snap-x"
                     style="-webkit-overflow-scrolling: touch; touch-action: pan-x;"
                     onwheel="this.scrollLeft += event.deltaY; event.preventDefault();">
                  ${cards.map((p, idx) => {
                    const isRevealed = packResult.revealedIndices.has(idx);
                    return `
                      <div class="flex-shrink-0 snap-center">
                        <div class="card-flip-container ${isRevealed ? 'card-flipped' : ''}"
                             data-flip-card-idx="${idx}"
                             style="width: 104px; height: 156px;">
                          <div class="card-flip-inner">
                            ${renderFUTCardBack({ width: '104px', height: '156px', compact: true })}
                            <div class="card-flip-front">
                              ${renderFUTCard(p, { compact: true })}
                            </div>
                          </div>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
                <span class="text-slate-400 font-sans text-[10px]">Tippe auf Karten oder „Alle aufdecken“</span>
              </div>
            ` : `
              <!-- Consumable Cards Reveal Grid with 3D Flip -->
              <div class="grid grid-cols-2 gap-3 w-full justify-items-center max-h-[380px] overflow-y-auto no-scrollbar py-2">
                ${cards.map((card, idx) => {
                  const isRevealed = packResult.revealedIndices.has(idx);
                  return `
                    <div class="card-flip-container ${isRevealed ? 'card-flipped' : ''}"
                         data-flip-card-idx="${idx}"
                         style="width: 140px; height: 180px;">
                      <div class="card-flip-inner">
                        ${renderFUTCardBack({ width: '140px', height: '180px', compact: true })}
                        <div class="card-flip-front">
                          ${renderConsumableCard(card, { compact: true, showAction: false })}
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `)}
          </div>
        `}
      </div>

      <!-- Bottom Confirm Action -->
      <div class="relative z-10 flex flex-col gap-2">
        ${isTorn ? `
          <button id="btn-confirm-pack-rewards" class="w-full py-3.5 rounded-xl bg-pitch-emerald hover:bg-emerald-400 text-pitch-dark font-display font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(0,245,155,0.5)] active:scale-98 transition-all flex items-center justify-center gap-2">
            <span>${
              packResult.isStarterFoundation 
                ? 'Basiskader übernehmen ➔ Weiter zum Starspieler-Pack' 
                : (isDraft ? 'Diesen Spieler in Verein einpflegen' : 'Alle Karten ins Inventar übernehmen')
            }</span>
          </button>
        ` : `
          <!-- Fallback button if touch swipe is not used -->
          <button id="btn-trigger-pack-tear" class="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-display font-bold text-xs uppercase tracking-wider border border-slate-700 active:scale-98 transition-all">
            Oder: Hier tippen zum Aufreißen ➔
          </button>
        `}
      </div>

    </div>
  `;
}

/**
 * Purchase confirmation modal before buying
 */
export function renderPackConfirmModal(pack, userCoins) {
  const canAfford = userCoins >= pack.price;

  return `
    <div class="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex flex-col items-center justify-center p-4 max-w-md mx-auto animate-fadeIn select-none">
      <div class="glass-modal rounded-3xl p-5 border border-pitch-gold/40 shadow-2xl flex flex-col items-center text-center max-w-xs w-full">
        
        <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl shadow-inner mb-3">
          ${pack.icon}
        </div>

        <h3 class="font-display font-black text-base text-slate-100 uppercase tracking-tight">
          ${pack.name} kaufen?
        </h3>
        
        <p class="font-sans text-xs text-slate-300 mt-1 leading-snug">
          ${pack.description}
        </p>

        <div class="my-4 px-4 py-2 rounded-2xl bg-slate-900 border border-pitch-gold/40 flex items-center gap-2">
          <span class="text-xs font-mono text-slate-400">Preis:</span>
          <span class="font-mono font-black text-base text-pitch-gold">🪙 ${pack.price.toLocaleString()}</span>
        </div>

        <div class="flex flex-col gap-2 w-full">
          <button id="btn-confirm-buy-pack" data-pack-id="${pack.id}" class="w-full py-3 rounded-xl font-display font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,245,155,0.4)] active:scale-95 transition-all ${
            canAfford ? 'bg-pitch-emerald text-pitch-dark hover:bg-emerald-400' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }" ${!canAfford ? 'disabled' : ''}>
            ${canAfford ? 'Kaufen & Öffnen ➔' : 'Zu wenig Coins'}
          </button>

          <button id="btn-cancel-buy-pack" class="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 font-display font-bold text-xs uppercase tracking-wider border border-white/5 active:scale-95 transition-all">
            Abbrechen
          </button>
        </div>

      </div>
    </div>
  `;
}
