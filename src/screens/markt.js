// =============================================================================
// Starting XI TCG — Screen 4: Markt & 3D Booster-Pack Kiosk (Foil Shelf)
// =============================================================================

import { PACK_TIERS } from '../engine/packs.js';

export function renderMarktScreen(state) {
  const club = state.leagues.find(l => l.tier === 6)?.clubs.find(c => c.id === state.playerClubId);

  return `
    <div class="flex-1 flex flex-col p-3 gap-3.5 pb-24 overflow-y-auto no-scrollbar">
      
      <!-- Market Header Banner -->
      <div class="glass-panel rounded-2xl p-4 border border-pitch-gold/30 flex items-center justify-between shadow-xl">
        <div>
          <span class="font-mono text-[9px] text-pitch-gold uppercase tracking-wider block font-bold">TCG Booster-Kiosk</span>
          <h2 class="font-display font-black text-lg text-slate-100 uppercase tracking-tight">Karten-Packs & Drafts</h2>
        </div>
        <div class="text-right">
          <span class="font-mono text-[9px] text-slate-400 uppercase block">Vereinsguthaben</span>
          <span class="font-mono font-black text-base text-pitch-gold">🪙 ${(club?.coins || 0).toLocaleString()}</span>
        </div>
      </div>

      <!-- Kiosk Shelf Carousel (Horizontal Swipe with 3D Foil Packs) -->
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between px-1">
          <span class="font-display font-bold text-xs text-slate-200 uppercase tracking-wider">
            🏪 Booster-Regal (Antippen zum Kaufen)
          </span>
          <span class="font-mono text-[9px] text-pitch-emerald font-bold">4 PACKS VERFÜGBAR</span>
        </div>

        <div class="flex gap-4 overflow-x-auto py-3 px-1 no-scrollbar snap-x snap-mandatory"
             style="-webkit-overflow-scrolling: touch; touch-action: pan-x;"
             onwheel="this.scrollLeft += event.deltaY; event.preventDefault();">
          ${PACK_TIERS.map(pack => renderPhysicalBoosterPack(pack, club?.coins || 0)).join('')}
        </div>
      </div>

      <!-- Scouting Policy & Guarantee Note -->
      <div class="glass-panel rounded-2xl p-3.5 border border-white/10 flex items-center gap-3 text-xs text-slate-300 shadow-lg">
        <span class="text-2xl">✨</span>
        <div class="flex flex-col gap-0.5">
          <b class="font-display text-xs text-slate-100 uppercase tracking-wide">100% Unikats-Garantie</b>
          <p class="font-sans leading-snug text-[11px] text-slate-400">
            Jeder gezogene Spieler existiert in der gesamten Spielwelt nur ein einziges Mal. Beim Aufreißen wischst du das Pack auf wie in Pokémon TCG Pocket!
          </p>
        </div>
      </div>

    </div>
  `;
}

/**
 * Renders a physical 3D foil booster pack with crimped edges and metallic sheen
 */
export function renderPhysicalBoosterPack(pack, userCoins) {
  const canAfford = userCoins >= pack.price;

  // Foil pack specific themes
  const foilThemes = {
    pack_rookie: {
      bg: 'linear-gradient(145deg, #064e3b 0%, #022c22 45%, #0f172a 100%)',
      border: 'border-emerald-400',
      badge: 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60',
      shadow: 'shadow-[0_12px_30px_rgba(0,245,155,0.35)]',
      accent: '#00f59b'
    },
    pack_veteran: {
      bg: 'linear-gradient(145deg, #075985 0%, #0c4a6e 45%, #0f172a 100%)',
      border: 'border-sky-400',
      badge: 'bg-sky-950/90 text-sky-300 border-sky-500/60',
      shadow: 'shadow-[0_12px_30px_rgba(56,189,248,0.35)]',
      accent: '#38bdf8'
    },
    pack_gold: {
      bg: 'linear-gradient(145deg, #78350f 0%, #451a03 45%, #181005 100%)',
      border: 'border-amber-400',
      badge: 'bg-amber-950/90 text-amber-300 border-amber-500/60',
      shadow: 'shadow-[0_12px_35px_rgba(255,209,92,0.45)]',
      accent: '#ffd15c'
    },
    pack_prestige_gold: {
      bg: 'linear-gradient(145deg, #78350f 0%, #451a03 45%, #181005 100%)',
      border: 'border-amber-400',
      badge: 'bg-amber-950/90 text-amber-300 border-amber-500/60',
      shadow: 'shadow-[0_12px_35px_rgba(255,209,92,0.45)]',
      accent: '#ffd15c'
    },
    pack_consumables: {
      bg: 'linear-gradient(145deg, #581c87 0%, #3b0764 45%, #0f172a 100%)',
      border: 'border-purple-400',
      badge: 'bg-purple-950/90 text-purple-300 border-purple-500/60',
      shadow: 'shadow-[0_12px_30px_rgba(168,85,247,0.35)]',
      accent: '#a855f7'
    }
  };

  const theme = foilThemes[pack.id] || foilThemes.pack_rookie;

  return `
    <div class="booster-pack flex-shrink-0 cursor-pointer snap-center border-2 ${theme.border} ${theme.shadow} flex flex-col justify-between"
         style="width: 145px; height: 230px; background: ${theme.bg};"
         data-prompt-pack="${pack.id}">
      
      <!-- Top Metallic Crimp Seal -->
      <div class="crimp-seal-top border-b border-black/40"></div>

      <!-- Holographic Foil Rayburst & Sheen -->
      <div class="card-rayburst opacity-30 pointer-events-none"></div>
      <div class="card-holo-sheen opacity-40"></div>

      <!-- Pack Header: Series & Badge -->
      <div class="relative z-10 px-2 pt-1 text-center">
        <span class="font-mono text-[7px] font-black uppercase tracking-widest text-slate-300 block">
          STARTING XI • SERIE 1
        </span>
        <span class="font-mono text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${theme.badge} border inline-block mt-0.5">
          ${pack.rarity}
        </span>
      </div>

      <!-- Center Pack Artwork Emblem -->
      <div class="relative z-10 flex flex-col items-center justify-center my-1 px-2 text-center">
        <div class="w-14 h-14 rounded-2xl bg-white/5 border border-white/15 flex items-center justify-center text-3xl shadow-inner mb-1">
          ${pack.icon}
        </div>
        <h4 class="font-display font-black text-xs uppercase tracking-tight text-slate-100 leading-tight">
          ${pack.name}
        </h4>
        <p class="font-sans text-[8px] text-slate-300 leading-tight mt-1 line-clamp-2">
          ${pack.description}
        </p>
      </div>

      <!-- Price CTA Badge -->
      <div class="relative z-10 px-2 pb-1.5 flex justify-center">
        <button class="w-full py-1.5 rounded-xl font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1 shadow-lg ${
          canAfford
            ? 'bg-pitch-emerald hover:bg-emerald-400 text-pitch-dark active:scale-95'
            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
        }">
          <span>🪙</span>
          <span>${pack.price}</span>
        </button>
      </div>

      <!-- Bottom Metallic Crimp Seal -->
      <div class="crimp-seal-bottom border-t border-black/40"></div>
    </div>
  `;
}
