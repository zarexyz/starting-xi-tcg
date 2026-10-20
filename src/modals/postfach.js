// =============================================================================
// Starting XI TCG — Modal: Postfach & Mitteilungen (Centered Top Modal)
// With Individual Message Detail Pop-Up Box & Auto-Read on Open
// =============================================================================

export function renderPostfachModal(inbox = [], activeFilter = 'all') {
  const filteredInbox = inbox.filter(msg => {
    if (activeFilter === 'urgent') return msg.type === 'ALERT';
    if (activeFilter === 'finance') return msg.type === 'SPONSOR';
    return true;
  });

  const unreadCount = inbox.filter(m => m.unread).length;

  return `
    <div class="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex flex-col justify-center items-center p-4 max-w-md mx-auto animate-fadeIn select-none">
      
      <!-- Centered Modal Container -->
      <div class="glass-modal rounded-3xl p-5 border border-pitch-emerald/40 shadow-2xl flex flex-col w-full max-h-[88vh] overflow-hidden">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <span class="text-xl">✉️</span>
            <div>
              <h3 class="font-display font-black text-sm text-slate-100 uppercase tracking-wide">Postfach & Mitteilungen</h3>
              <span class="font-mono text-[10px] text-pitch-emerald font-bold">
                ${unreadCount} UNGELESENE NACHRICHTEN
              </span>
            </div>
          </div>
          <button id="btn-close-modal" class="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold">
            ✕
          </button>
        </div>

        <!-- Filter Chips -->
        <div class="flex gap-2 my-3">
          <button data-filter-inbox="all" class="px-3 py-1 rounded-full font-display font-extrabold text-[10px] uppercase transition-all ${
            activeFilter === 'all' ? 'bg-pitch-emerald text-pitch-dark' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }">
            Alle (${inbox.length})
          </button>
          <button data-filter-inbox="urgent" class="px-3 py-1 rounded-full font-display font-bold text-[10px] uppercase transition-all ${
            activeFilter === 'urgent' ? 'bg-pitch-emerald text-pitch-dark' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }">
            Dringend
          </button>
          <button data-filter-inbox="finance" class="px-3 py-1 rounded-full font-display font-bold text-[10px] uppercase transition-all ${
            activeFilter === 'finance' ? 'bg-pitch-emerald text-pitch-dark' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }">
            Finanzen
          </button>
        </div>

        <!-- Message Cards Stream -->
        <div class="flex-1 flex flex-col gap-2.5 overflow-y-auto no-scrollbar pr-1 pb-2">
          ${filteredInbox.length ? filteredInbox.map(msg => {
            const isAlert = msg.type === 'ALERT';
            const isSponsor = msg.type === 'SPONSOR';

            let borderStyle = msg.unread ? 'border-pitch-emerald/60 bg-slate-900/90' : 'border-slate-800 bg-slate-950/60 opacity-80';
            if (isAlert) borderStyle = msg.unread ? 'border-pitch-danger/80 bg-red-950/30' : 'border-red-900/30 bg-red-950/10 opacity-75';
            if (isSponsor) borderStyle = msg.unread ? 'border-pitch-gold/80 bg-amber-950/30' : 'border-yellow-900/30 bg-amber-950/10 opacity-75';

            return `
              <div class="glass-card rounded-2xl p-3 border ${borderStyle} flex flex-col gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all"
                   data-open-message="${msg.id}">
                
                <div class="flex items-start justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-xs">${isAlert ? '⚠️' : (isSponsor ? '🏆' : '📌')}</span>
                    <h4 class="font-display font-bold text-xs ${isAlert ? 'text-pitch-danger' : 'text-slate-100'}">
                      ${msg.title}
                    </h4>
                  </div>
                  <div class="flex items-center gap-1.5">
                    ${msg.unread ? `
                      <span class="w-2 h-2 rounded-full bg-pitch-emerald shadow-[0_0_8px_#00f59b] animate-pulse"></span>
                    ` : ''}
                    <span class="font-mono text-[9px] text-slate-400">${msg.date}</span>
                  </div>
                </div>

                <p class="font-sans text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  ${msg.text}
                </p>

                <div class="flex items-center justify-between text-[10px] text-pitch-emerald font-mono pt-1">
                  <span>Antippen zum Öffnen</span>
                  <span>➔</span>
                </div>

              </div>
            `;
          }).join('') : '<p class="text-center text-slate-500 my-8 font-sans text-xs">Keine Mitteilungen in diesem Ordner.</p>'}
        </div>

        <!-- Mark All Read Action -->
        <div class="pt-3 border-t border-slate-800/80">
          <button id="btn-mark-all-read" class="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-display font-bold text-xs uppercase tracking-wider border border-white/5 active:scale-98 transition-all">
            Alle als gelesen markieren
          </button>
        </div>

      </div>
    </div>
  `;
}

/**
 * Dedicated Pop-Up Dialog for reading a single message in full detail
 */
export function renderMessageDetailModal(msg) {
  if (!msg) return '';

  const isAlert = msg.type === 'ALERT';
  const isSponsor = msg.type === 'SPONSOR';

  let icon = '📌';
  let badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
  if (isAlert) {
    icon = '⚠️';
    badgeColor = 'bg-red-950 text-red-300 border-red-500/50';
  } else if (isSponsor) {
    icon = '🏆';
    badgeColor = 'bg-amber-950 text-pitch-gold border-pitch-gold/50';
  }

  return `
    <div class="fixed inset-0 z-60 bg-black/90 backdrop-blur-2xl flex flex-col justify-center items-center p-4 max-w-md mx-auto animate-fadeIn select-none">
      <div class="glass-modal rounded-3xl p-5 border ${isAlert ? 'border-pitch-danger/60' : 'border-pitch-emerald/60'} shadow-2xl flex flex-col w-full max-w-sm">
        
        <!-- Header -->
        <div class="flex items-start justify-between gap-3 pb-3 border-b border-white/10">
          <div class="flex items-center gap-2.5">
            <span class="text-2xl">${icon}</span>
            <div>
              <span class="px-2 py-0.5 rounded-md font-mono text-[8px] font-black uppercase border ${badgeColor}">
                ${msg.type || 'INFO'}
              </span>
              <h3 class="font-display font-black text-sm text-slate-100 uppercase tracking-tight mt-1 leading-snug">
                ${msg.title}
              </h3>
            </div>
          </div>
          <button id="btn-close-message-detail" class="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold text-xs">
            ✕
          </button>
        </div>

        <!-- Meta -->
        <div class="flex items-center justify-between font-mono text-[9px] text-slate-400 my-2.5 px-1">
          <span>Gesendet: ${msg.date}</span>
          <span class="text-pitch-emerald">Status: Gelesen ✓</span>
        </div>

        <!-- Body Text -->
        <div class="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5 my-1 text-xs text-slate-200 leading-relaxed font-sans">
          ${msg.text}
        </div>

        <!-- Contextual Action Buttons -->
        <div class="flex flex-col gap-2 mt-4">
          ${isAlert && msg.playerId ? `
            <button data-renew-contract="${msg.playerId}" class="w-full py-3 rounded-xl bg-pitch-emerald hover:bg-emerald-400 text-pitch-dark font-display font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,245,155,0.4)] active:scale-95 transition-all">
              Vertrag verlängern für 220 🪙
            </button>
          ` : ''}

          <button id="btn-confirm-message-read" class="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-display font-bold text-xs uppercase tracking-wider border border-white/10 active:scale-95 transition-all">
            Schließen
          </button>
        </div>

      </div>
    </div>
  `;
}
