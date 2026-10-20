// =============================================================================
// Starting XI TCG — Title Screen ("Berühre den Bildschirm, um fortzufahren")
// =============================================================================

export function renderTitleScreen() {
  return `
    <div id="title-screen-container" 
         class="fixed inset-0 z-50 bg-[#070b12] flex flex-col justify-between items-center p-6 text-center select-none overflow-hidden cursor-pointer">
      
      <!-- Ambient Stadium Lights & Aurora -->
      <div class="absolute inset-0 bg-radial-gold opacity-30 pointer-events-none"></div>
      <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-[120px] bg-emerald-500/20 pointer-events-none animate-pulse"></div>

      <!-- Top Branding Pill -->
      <div class="mt-8 z-10 animate-fadeIn">
        <span class="inline-block px-4 py-1 rounded-full font-mono text-[10px] font-black uppercase tracking-widest text-pitch-gold bg-amber-950/40 border border-pitch-gold/40 shadow-[0_0_15px_rgba(255,209,92,0.3)]">
          ROAD TO GLORY • TACTICAL CARD GAME
        </span>
      </div>

      <!-- Center Logo & Hero Artwork -->
      <div class="flex flex-col items-center justify-center gap-4 z-10 my-auto animate-fadeIn">
        <!-- 3D Card Stack Silhouette -->
        <div class="relative w-28 h-40 flex items-center justify-center">
          <div class="absolute w-24 h-36 rounded-2xl bg-gradient-to-br from-purple-900 to-indigo-950 border border-purple-500/40 -rotate-12 shadow-2xl opacity-60"></div>
          <div class="absolute w-24 h-36 rounded-2xl bg-gradient-to-br from-amber-900 to-yellow-950 border border-pitch-gold/40 rotate-6 shadow-2xl opacity-80"></div>
          <div class="relative w-24 h-36 rounded-2xl bg-gradient-to-br from-emerald-900 to-slate-950 border-2 border-pitch-emerald shadow-[0_10px_35px_rgba(0,245,155,0.4)] flex flex-col items-center justify-center text-4xl">
            ⚽
          </div>
        </div>

        <div class="flex flex-col items-center gap-1">
          <h1 class="font-display font-black text-4xl uppercase tracking-tighter text-slate-100 drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)]">
            STARTING <span class="text-pitch-emerald">XI</span>
          </h1>
          <span class="font-mono text-xs font-black tracking-[0.3em] text-pitch-gold uppercase">
            TRADING CARD MANAGER
          </span>
        </div>
      </div>

      <!-- Bottom Tap Prompt -->
      <div class="mb-10 z-10 flex flex-col items-center gap-2 animate-fadeIn">
        <div class="px-6 py-3 rounded-2xl bg-slate-900/80 border border-pitch-emerald/50 text-pitch-emerald font-display font-black text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(0,245,155,0.3)] animate-pulse flex items-center gap-2">
          <span>👆</span>
          <span>Berühre den Bildschirm, um fortzufahren</span>
        </div>
        <span class="font-mono text-[9px] text-slate-500">v1.4 • Single-Player IndexedDB Edition</span>
      </div>

    </div>
  `;
}
