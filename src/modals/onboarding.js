// =============================================================================
// Starting XI TCG — Modal: Road to Glory Onboarding (Vereinsgründung)
// =============================================================================

export function renderOnboardingModal() {
  return `
    <div class="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col p-4 max-w-md mx-auto justify-between animate-fadeIn overflow-y-auto no-scrollbar">
      
      <!-- Top Title -->
      <div class="text-center my-4">
        <span class="text-4xl mb-2 block">⚽🃏</span>
        <h1 class="font-display font-black text-2xl text-slate-100 uppercase tracking-tight">
          Starting XI TCG
        </h1>
        <p class="font-mono text-xs text-pitch-emerald mt-1 font-semibold">
          ROAD TO GLORY • VEREINSGRÜNDUNG
        </p>
      </div>

      <!-- Setup Form -->
      <div class="flex-1 flex flex-col gap-4 my-2">
        
        <!-- Club Name -->
        <div class="glass-card rounded-2xl p-4 flex flex-col gap-1.5 border border-pitch-border">
          <label class="font-mono text-xs text-slate-300 font-bold uppercase">Dein Vereinsname</label>
          <input id="input-club-name" type="text" value="FC Apex Nova" 
                 class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-display font-bold text-pitch-emerald outline-none focus:border-pitch-emerald" />
        </div>

        <!-- Color Styling -->
        <div class="glass-card rounded-2xl p-4 flex flex-col gap-3 border border-pitch-border">
          <label class="font-mono text-xs text-slate-300 font-bold uppercase">Wappen- & Trikotfarben</label>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <span class="text-[11px] font-sans text-slate-400 block mb-1">Hauptfarbe</span>
              <input id="input-primary-color" type="color" value="#00f59b" class="w-full h-10 rounded-xl bg-slate-900 cursor-pointer border border-slate-700 p-1" />
            </div>
            <div>
              <span class="text-[11px] font-sans text-slate-400 block mb-1">Rahmen / Gold</span>
              <input id="input-secondary-color" type="color" value="#ffd15c" class="w-full h-10 rounded-xl bg-slate-900 cursor-pointer border border-slate-700 p-1" />
            </div>
          </div>
        </div>

        <!-- Captain Selection -->
        <div class="glass-card rounded-2xl p-4 flex flex-col gap-2.5 border border-pitch-border">
          <label class="font-mono text-xs text-slate-300 font-bold uppercase">Wähle deinen Gold-Kapitän (78 OVR)</label>
          
          <div class="grid grid-cols-3 gap-2">
            <label class="flex flex-col items-center p-2.5 rounded-xl border border-pitch-emerald/40 bg-pitch-emerald/10 cursor-pointer">
              <input type="radio" name="captainRole" value="ST" checked class="hidden" />
              <span class="text-xl mb-1">⚡</span>
              <b class="font-display text-xs text-slate-100">Torjäger</b>
              <span class="font-mono text-[9px] text-pitch-gold">ST (78)</span>
            </label>

            <label class="flex flex-col items-center p-2.5 rounded-xl border border-slate-700 bg-slate-900/60 cursor-pointer">
              <input type="radio" name="captainRole" value="MF" class="hidden" />
              <span class="text-xl mb-1">🎯</span>
              <b class="font-display text-xs text-slate-100">Regisseur</b>
              <span class="font-mono text-[9px] text-pitch-gold">ZM (78)</span>
            </label>

            <label class="flex flex-col items-center p-2.5 rounded-xl border border-slate-700 bg-slate-900/60 cursor-pointer">
              <input type="radio" name="captainRole" value="DF" class="hidden" />
              <span class="text-xl mb-1">🛡️</span>
              <b class="font-display text-xs text-slate-100">Abwehrchef</b>
              <span class="font-mono text-[9px] text-pitch-gold">IV (78)</span>
            </label>
          </div>
        </div>

      </div>

      <!-- Start Action Button -->
      <div class="mt-4">
        <button id="btn-submit-onboarding" class="w-full py-3.5 rounded-xl bg-pitch-emerald hover:bg-emerald-400 text-pitch-dark font-display font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(0,245,155,0.4)] active:scale-98 transition-all">
          Verein in Liga 6 gründen & Starten ➔
        </button>
      </div>

    </div>
  `;
}
