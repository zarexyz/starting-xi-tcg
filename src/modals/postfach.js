// =============================================================================
// Starting XI TCG — Modal: Postfach & Mitteilungen (Slide-Over)
// =============================================================================

export function renderPostfachModal(inbox) {
  return `
    <div class="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex flex-col justify-end max-w-md mx-auto animate-fadeIn">
      
      <!-- Slide-Up Modal Container -->
      <div class="glass-modal rounded-t-3xl p-4 border-t-2 border-pitch-emerald shadow-2xl flex flex-col max-h-[85vh] h-[600px] overflow-hidden">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <span class="text-xl">✉️</span>
            <div>
              <h3 class="font-display font-black text-sm text-slate-100 uppercase tracking-wide">Postfach & Mitteilungen</h3>
              <span class="font-mono text-[10px] text-pitch-emerald font-bold">
                ${inbox.filter(m => m.unread).length} UNGELESENE NACHRICHTEN
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
            Alle (${inbox.length})
          </button>
          <button class="px-3 py-1 rounded-full bg-slate-800 text-slate-400 hover:text-slate-200 font-display font-bold text-[10px] uppercase">
            Dringend
          </button>
          <button class="px-3 py-1 rounded-full bg-slate-800 text-slate-400 hover:text-slate-200 font-display font-bold text-[10px] uppercase">
            Finanzen
          </button>
        </div>

        <!-- Message Cards Stream -->
        <div class="flex-1 flex flex-col gap-2.5 overflow-y-auto no-scrollbar pr-1 pb-4">
          ${inbox.length ? inbox.map(msg => {
            const isAlert = msg.type === 'ALERT';
            const isSponsor = msg.type === 'SPONSOR';

            let borderStyle = 'border-slate-800';
            if (isAlert) borderStyle = 'border-pitch-danger/50 bg-red-950/20';
            if (isSponsor) borderStyle = 'border-pitch-emerald/50 bg-emerald-950/20';

            return `
              <div class="glass-card rounded-2xl p-3 border ${borderStyle} flex flex-col gap-2">
                <div class="flex items-start justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-xs">${isAlert ? '⚠️' : (isSponsor ? '🏆' : '📌')}</span>
                    <h4 class="font-display font-bold text-xs ${isAlert ? 'text-pitch-danger' : 'text-slate-100'}">
                      ${msg.title}
                    </h4>
                  </div>
                  <span class="font-mono text-[9px] text-slate-400">${msg.date}</span>
                </div>

                <p class="font-sans text-xs text-slate-300 leading-relaxed">${msg.text}</p>

                ${isAlert ? `
                  <div class="flex gap-2 mt-1">
                    <button data-renew-contract="${msg.playerId}" class="flex-1 py-1.5 rounded-lg bg-pitch-emerald text-pitch-dark font-display font-black text-[10px] uppercase tracking-wide">
                      Verlängern für 220 🪙
                    </button>
                    <button data-dismiss-alert="${msg.id}" class="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 font-display font-bold text-[10px] uppercase">
                      Auslaufen lassen
                    </button>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('') : '<p class="text-center text-slate-500 my-8">Keine Nachrichten vorhanden.</p>'}
        </div>

        <!-- Mark All Read Action -->
        <div class="pt-2 border-t border-slate-800">
          <button id="btn-mark-all-read" class="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 font-display font-bold text-xs uppercase tracking-wide transition-colors">
            Alle als gelesen markieren
          </button>
        </div>

      </div>

    </div>
  `;
}
