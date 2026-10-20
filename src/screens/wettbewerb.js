// =============================================================================
// Starting XI TCG — Screen 3: Wettbewerb & Liga-Tabelle View
// =============================================================================

import { renderClubCrest } from '../components/crest.js';
import { computeLeagueTable } from '../engine/schedule.js';

export function renderWettbewerbScreen(state) {
  const selectedTier = state.selectedLeagueTier || 6;
  const league = state.leagues.find(l => l.tier === selectedTier) || state.leagues[5];
  const sortedClubs = computeLeagueTable(league.clubs);
  const playerClub = state.leagues.find(l => l.tier === 6)?.clubs.find(c => c.id === state.playerClubId);

  return `
    <div class="flex-1 flex flex-col p-3 gap-3 pb-24 overflow-y-auto no-scrollbar">
      
      <!-- Sub-Nav & League Picker -->
      <div class="flex items-center justify-between gap-2">
        <div class="flex gap-1.5 p-1 rounded-xl bg-slate-900 border border-pitch-border flex-1">
          <button class="flex-1 py-1 px-2 rounded-lg bg-pitch-emerald text-pitch-dark font-display font-extrabold text-[11px] uppercase tracking-wider">
            Tabelle
          </button>
          <button class="flex-1 py-1 px-2 rounded-lg text-slate-400 hover:text-slate-200 font-display font-bold text-[11px] uppercase tracking-wider">
            Final Four
          </button>
        </div>

        <select id="select-league-tier" class="bg-slate-900 border border-pitch-border rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-pitch-emerald outline-none">
          ${state.leagues.map(l => `
            <option value="${l.tier}" ${l.tier === selectedTier ? 'selected' : ''}>
              ${l.name}
            </option>
          `).join('')}
        </select>
      </div>

      <!-- League Table Card -->
      <div class="glass-card rounded-2xl p-3 border border-pitch-border shadow-2xl flex flex-col gap-1">
        <!-- Table Header -->
        <div class="grid grid-cols-12 text-[10px] font-mono text-slate-400 pb-2 border-b border-slate-800 px-1">
          <span class="col-span-1 text-center">#</span>
          <span class="col-span-6">VEREIN</span>
          <span class="col-span-1 text-center">SP</span>
          <span class="col-span-2 text-center">TD</span>
          <span class="col-span-2 text-right pr-1">PKT</span>
        </div>

        <!-- Table Rows -->
        <div class="flex flex-col gap-1 my-1">
          ${sortedClubs.map((club, idx) => {
            const rank = idx + 1;
            const isPromotion = rank <= 4;
            const isRelegation = rank >= 9 && selectedTier < 6;
            const isPlayer = club.isPlayer;

            let rowClass = 'bg-slate-900/40 text-slate-300';
            let rankColor = 'text-slate-400';

            if (isPromotion) {
              rowClass = isPlayer ? 'bg-pitch-emerald/20 border-l-4 border-pitch-emerald' : 'bg-pitch-emerald/5';
              rankColor = 'text-pitch-emerald font-black';
            } else if (isRelegation) {
              rowClass = 'bg-pitch-danger/10 border-l-2 border-pitch-danger';
              rankColor = 'text-pitch-danger';
            }

            const gd = club.stats.gf - club.stats.ga;
            const gdString = gd > 0 ? `+${gd}` : `${gd}`;

            return `
              <div class="grid grid-cols-12 items-center text-xs p-1.5 rounded-lg transition-colors ${rowClass} ${isPlayer ? 'ring-1 ring-pitch-emerald/50' : ''}">
                <span class="col-span-1 text-center font-mono ${rankColor}">${rank}</span>
                <div class="col-span-6 flex items-center gap-2 truncate">
                  ${renderClubCrest(club, 20)}
                  <span class="font-display font-bold truncate ${isPlayer ? 'text-pitch-emerald' : 'text-slate-100'}">
                    ${club.name}
                  </span>
                </div>
                <span class="col-span-1 text-center font-mono text-slate-400">${club.stats.played}</span>
                <span class="col-span-2 text-center font-mono text-slate-400">${gdString}</span>
                <span class="col-span-2 text-right pr-1 font-mono font-black text-slate-100">${club.stats.points}</span>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Promotion / Final Four Indicator -->
        <div class="mt-2 p-2.5 rounded-xl bg-pitch-emerald/10 border border-pitch-emerald/30 flex items-center justify-between text-xs">
          <div class="flex items-center gap-2">
            <span class="text-pitch-emerald">⚡</span>
            <span class="font-mono text-[11px] text-slate-300">
              <b>Plätze 1–4</b> spielen das <b class="text-pitch-emerald">Final Four</b>!
            </span>
          </div>
          <span class="font-mono text-[10px] text-pitch-emerald font-bold">BEIDE FINALISTEN STEIGEN AUF</span>
        </div>
      </div>

      <!-- Playoff Halbfinal-Vorschau -->
      <div class="glass-panel rounded-xl p-3 flex flex-col gap-2">
        <h4 class="font-display font-bold text-xs text-slate-200 uppercase tracking-wider flex items-center justify-between">
          <span>⚔️ Final-Four Halbfinal-Paarungen</span>
          <span class="font-mono text-[10px] text-pitch-emerald">NACH SPIELTAG 18</span>
        </h4>
        <div class="grid grid-cols-2 gap-2 text-xs font-mono">
          <div class="p-2 rounded-lg bg-slate-900 border border-slate-800">
            <span class="text-[10px] text-slate-500 block">HALBFINALE 1</span>
            <span class="text-pitch-emerald font-bold truncate block">1. ${sortedClubs[0]?.name}</span>
            <span class="text-slate-400 font-bold truncate block">4. ${sortedClubs[3]?.name}</span>
          </div>
          <div class="p-2 rounded-lg bg-slate-900 border border-slate-800">
            <span class="text-[10px] text-slate-500 block">HALBFINALE 2</span>
            <span class="text-slate-300 font-bold truncate block">2. ${sortedClubs[1]?.name}</span>
            <span class="text-slate-400 font-bold truncate block">3. ${sortedClubs[2]?.name}</span>
          </div>
        </div>
      </div>

    </div>
  `;
}
