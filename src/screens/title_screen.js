// =============================================================================
// Starting XI TCG — Title Screen ("Berühre den Bildschirm, um fortzufahren")
// Featuring an Impressive 5-Card Fanned-Out Hero Arc with Holographic Sheen
// =============================================================================

export function renderTitleScreen() {
  return `
    <div id="title-screen-container" 
         class="fixed inset-0 z-50 bg-[#070b12] flex flex-col justify-between items-center p-6 text-center select-none overflow-hidden cursor-pointer">
      
      <!-- Ambient Stadium Lights & Aurora -->
      <div class="absolute inset-0 bg-radial-gold opacity-25 pointer-events-none"></div>
      <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-[32rem] h-[32rem] rounded-full blur-[140px] bg-emerald-500/20 pointer-events-none animate-pulse"></div>
      <div class="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-[100px] bg-amber-500/15 pointer-events-none"></div>

      <!-- Top Branding Pill -->
      <div class="mt-4 z-10 animate-fadeIn">
        <span class="inline-block px-4 py-1.5 rounded-full font-mono text-[10px] font-black uppercase tracking-widest text-pitch-gold bg-amber-950/40 border border-pitch-gold/40 shadow-[0_0_20px_rgba(255,209,92,0.3)]">
          ⭐ ROAD TO GLORY • TRADING CARD FOOTBALL MANAGER ⭐
        </span>
      </div>

      <!-- Center Stage: Impressive 5-Card Fanned-Out Arc -->
      <div class="relative flex-1 flex flex-col items-center justify-center w-full max-w-sm my-auto z-10 animate-fadeIn">
        
        <!-- Fanned Cards Container -->
        <div class="relative w-72 h-64 flex items-center justify-center">
          
          <!-- Card 1 (Far Left - Bronze ST 66) -->
          <div class="absolute w-28 h-44 rounded-2xl p-2 flex flex-col justify-between border-2 border-amber-800 bg-gradient-to-br from-amber-950 via-slate-900 to-amber-950 shadow-2xl transition-all"
               style="transform: translate(-95px, 20px) rotate(-22deg) scale(0.85); z-index: 10;">
            <div class="flex justify-between items-start">
              <div>
                <span class="font-display font-black text-sm text-amber-500 block leading-none">66</span>
                <span class="font-mono text-[9px] text-amber-400 font-bold">LV</span>
              </div>
              <span class="text-xs">🇩🇪</span>
            </div>
            <div class="text-center my-auto text-3xl">🏃</div>
            <div class="border-t border-amber-800/60 pt-1 text-center">
              <span class="font-display font-black text-[9px] text-amber-200 block truncate">K. BERGER</span>
              <span class="font-mono text-[8px] text-amber-400">76 PAC</span>
            </div>
          </div>

          <!-- Card 2 (Mid Left - Silver ZM 74) -->
          <div class="absolute w-28 h-44 rounded-2xl p-2 flex flex-col justify-between border-2 border-slate-300 bg-gradient-to-br from-slate-400 via-slate-800 to-slate-950 shadow-2xl transition-all"
               style="transform: translate(-50px, 0px) rotate(-11deg) scale(0.92); z-index: 20;">
            <div class="flex justify-between items-start">
              <div>
                <span class="font-display font-black text-sm text-slate-100 block leading-none">74</span>
                <span class="font-mono text-[9px] text-slate-300 font-bold">ZM</span>
              </div>
              <span class="text-xs">🇫🇷</span>
            </div>
            <div class="text-center my-auto text-3xl">⚡</div>
            <div class="border-t border-slate-600/60 pt-1 text-center">
              <span class="font-display font-black text-[9px] text-slate-100 block truncate">L. DUBOIS</span>
              <span class="font-mono text-[8px] text-slate-300">78 PAS</span>
            </div>
          </div>

          <!-- Card 3 (Center Star - Gold ST 82) -->
          <div class="absolute w-32 h-52 rounded-2xl p-2.5 flex flex-col justify-between border-2 border-pitch-gold bg-gradient-to-br from-yellow-700 via-amber-950 to-slate-950 shadow-[0_15px_45px_rgba(255,209,92,0.5)] transition-all animate-bounce"
               style="transform: translate(0px, -18px) rotate(0deg) scale(1.08); z-index: 30; animation-duration: 4s;">
            <div class="card-holo-sheen opacity-60"></div>
            <div class="relative z-10 flex justify-between items-start">
              <div>
                <span class="font-display font-black text-lg text-pitch-gold block leading-none">82</span>
                <span class="font-mono text-[10px] text-amber-300 font-bold">ST</span>
              </div>
              <span class="text-sm">🇭🇷</span>
            </div>
            <div class="relative z-10 text-center my-auto">
              <div class="w-14 h-14 mx-auto rounded-full bg-yellow-500/20 border border-pitch-gold flex items-center justify-center text-3xl shadow-inner">
                ⚽
              </div>
            </div>
            <div class="relative z-10 border-t border-pitch-gold/40 pt-1 text-center bg-black/40 rounded-lg p-1">
              <span class="font-display font-black text-[11px] text-pitch-gold block tracking-wide">M. MODRIĆ</span>
              <span class="font-mono text-[9px] text-slate-200">84 SHO • 86 PAS</span>
            </div>
          </div>

          <!-- Card 4 (Mid Right - Special Walkout IV 79) -->
          <div class="absolute w-28 h-44 rounded-2xl p-2 flex flex-col justify-between border-2 border-pitch-emerald bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 shadow-2xl transition-all"
               style="transform: translate(50px, 0px) rotate(11deg) scale(0.92); z-index: 20;">
            <div class="flex justify-between items-start">
              <div>
                <span class="font-display font-black text-sm text-pitch-emerald block leading-none">79</span>
                <span class="font-mono text-[9px] text-emerald-300 font-bold">IV</span>
              </div>
              <span class="text-xs">🇪🇸</span>
            </div>
            <div class="text-center my-auto text-3xl">🛡️</div>
            <div class="border-t border-pitch-emerald/40 pt-1 text-center">
              <span class="font-display font-black text-[9px] text-emerald-200 block truncate">A. RAMOS</span>
              <span class="font-mono text-[8px] text-emerald-400">83 DEF</span>
            </div>
          </div>

          <!-- Card 5 (Far Right - Purple Master RF 85) -->
          <div class="absolute w-28 h-44 rounded-2xl p-2 flex flex-col justify-between border-2 border-purple-500 bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 shadow-2xl transition-all"
               style="transform: translate(95px, 20px) rotate(22deg) scale(0.85); z-index: 10;">
            <div class="flex justify-between items-start">
              <div>
                <span class="font-display font-black text-sm text-purple-400 block leading-none">85</span>
                <span class="font-mono text-[9px] text-purple-300 font-bold">RF</span>
              </div>
              <span class="text-xs">🇬🇧</span>
            </div>
            <div class="text-center my-auto text-3xl">🎯</div>
            <div class="border-t border-purple-700/60 pt-1 text-center">
              <span class="font-display font-black text-[9px] text-purple-200 block truncate">H. KANE</span>
              <span class="font-mono text-[8px] text-purple-300">88 DRI</span>
            </div>
          </div>

        </div>

        <!-- Typography / Logo Block -->
        <div class="flex flex-col items-center gap-1 mt-6">
          <h1 class="font-display font-black text-4xl uppercase tracking-tighter text-slate-100 drop-shadow-[0_8px_20px_rgba(0,0,0,0.9)]">
            STARTING <span class="text-pitch-emerald">XI</span>
          </h1>
          <span class="font-mono text-xs font-black tracking-[0.35em] text-pitch-gold uppercase drop-shadow">
            TRADING CARD MANAGER
          </span>
        </div>
      </div>

      <!-- Bottom Touch-to-Continue Cue -->
      <div class="mb-8 z-10 flex flex-col items-center gap-2 animate-fadeIn">
        <div class="px-8 py-3.5 rounded-2xl bg-slate-900/90 border border-pitch-emerald/60 text-pitch-emerald font-display font-black text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(0,245,155,0.4)] animate-pulse flex items-center gap-2.5">
          <span class="text-lg">👆</span>
          <span>Berühre den Bildschirm, um fortzufahren</span>
        </div>
        <span class="font-mono text-[9px] text-slate-500">v1.5 • IndexedDB Multi-Slot Edition</span>
      </div>

    </div>
  `;
}
