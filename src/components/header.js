// =============================================================================
// Starting XI TCG — Global Mobile Header Component
// =============================================================================

import { renderClubCrest } from './crest.js';

export function renderHeader(state) {
  const club = state.leagues.find(l => l.tier === 6)?.clubs.find(c => c.id === state.playerClubId);
  const unreadCount = (state.inbox || []).filter(m => m.unread).length;

  return `
    <header class="sticky top-0 z-40 bg-pitch-dark/90 backdrop-blur-md border-b border-pitch-border px-3 py-2 flex items-center justify-between">
      <!-- Left: Crest & Club Name -->
      <div class="flex items-center gap-2">
        ${renderClubCrest(club, 34)}
        <div class="flex flex-col">
          <span class="font-display font-bold text-xs tracking-tight text-slate-100 truncate max-w-[120px]">
            ${club?.name || 'FC Apex Nova'}
          </span>
          <span class="font-mono text-[10px] text-pitch-emerald font-semibold leading-none">
            ${club?.leagueName || 'Liga 6 (Amateur)'}
          </span>
        </div>
      </div>

      <!-- Center: Coins / Token Pill -->
      <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-pitch-border shadow-inner">
        <span class="text-xs">🪙</span>
        <span class="font-mono font-bold text-xs text-pitch-gold">
          ${(club?.coins || 0).toLocaleString()}
        </span>
      </div>

      <!-- Right: Postfach & Settings Actions -->
      <div class="flex items-center gap-1.5">
        <!-- Postfach Mail Button with Badge -->
        <button id="btn-header-inbox" class="relative p-2 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 text-slate-200 transition-transform active:scale-95">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="20" height="16" x="2" y="4" rx="2"/>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
          </svg>
          ${unreadCount > 0 ? `
            <span class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pitch-danger text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
              ${unreadCount}
            </span>
          ` : ''}
        </button>

        <!-- Settings Gear Button -->
        <button id="btn-header-settings" class="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 text-slate-200 transition-transform active:scale-95">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
      </div>
    </header>
  `;
}
