// =============================================================================
// Starting XI TCG — Screen 5: Verein, Finanzen & Status View
// =============================================================================

import { renderClubCrest } from '../components/crest.js';
import { calculateMatchdayFinances } from '../engine/economy.js';

export function renderVereinScreen(state) {
  const club = state.leagues.find(l => l.tier === 6)?.clubs.find(c => c.id === state.playerClubId);
  const finances = calculateMatchdayFinances(club, null, true);

  return `
    <div class="flex-1 flex flex-col p-3 gap-3.5 pb-24 overflow-y-auto no-scrollbar">
      
      <!-- Club Profile Hero -->
      <div class="glass-panel rounded-2xl p-4 border border-pitch-border flex items-center gap-3.5">
        ${renderClubCrest(club, 54)}
        <div class="flex flex-col">
          <h2 class="font-display font-black text-base text-slate-100">${club.name}</h2>
          <span class="font-mono text-xs text-pitch-emerald font-semibold">Liga 6 • Amateur</span>
          <span class="font-sans text-[11px] text-slate-400 mt-0.5">Kadergröße: ${club.squad.length} / 23 Spieler</span>
        </div>
      </div>

      <!-- 3 KPI Cards -->
      <div class="grid grid-cols-3 gap-2">
        <div class="glass-panel rounded-xl p-2.5 flex flex-col items-center text-center">
          <span class="font-mono text-[9px] text-slate-400 uppercase">Konto</span>
          <span class="font-mono font-bold text-xs text-pitch-gold mt-1">🪙 ${club.coins.toLocaleString()}</span>
        </div>
        <div class="glass-panel rounded-xl p-2.5 flex flex-col items-center text-center">
          <span class="font-mono text-[9px] text-slate-400 uppercase">Gehälter</span>
          <span class="font-mono font-bold text-xs text-pitch-danger mt-1">-${finances.totalSalaries} 🪙</span>
        </div>
        <div class="glass-panel rounded-xl p-2.5 flex flex-col items-center text-center">
          <span class="font-mono text-[9px] text-slate-400 uppercase">Trophäen</span>
          <span class="font-mono font-bold text-xs text-pitch-cyan mt-1">🏆 0</span>
        </div>
      </div>

      <!-- Financial Breakdown -->
      <div class="glass-card rounded-2xl p-4 border border-pitch-border flex flex-col gap-2.5">
        <h3 class="font-display font-bold text-xs text-slate-200 uppercase tracking-wider">
          Finanz-Bilanz (Pro Spieltag)
        </h3>
        
        <div class="flex items-center justify-between text-xs py-1 border-b border-slate-800">
          <span class="text-slate-400">Sponsoren-Grundvergütung</span>
          <span class="font-mono font-bold text-pitch-emerald">+${finances.sponsorBase} 🪙</span>
        </div>
        <div class="flex items-center justify-between text-xs py-1 border-b border-slate-800">
          <span class="text-slate-400">Ticketverkäufe (Heimspiel)</span>
          <span class="font-mono font-bold text-pitch-emerald">ca. +1.000 🪙</span>
        </div>
        <div class="flex items-center justify-between text-xs py-1 border-b border-slate-800">
          <span class="text-slate-400">Spielergehälter (Kader)</span>
          <span class="font-mono font-bold text-pitch-danger">-${finances.totalSalaries} 🪙</span>
        </div>

        <div class="flex items-center justify-between text-xs pt-1">
          <span class="font-display font-extrabold text-slate-200 uppercase">Netto-Überschuss / Defizit</span>
          <span class="font-mono font-black text-sm ${finances.netProfit >= 0 ? 'text-pitch-emerald' : 'text-pitch-danger'}">
            ${finances.netProfit >= 0 ? '+' : ''}${finances.netProfit} 🪙
          </span>
        </div>
      </div>

      <!-- Active Sponsor Contracts -->
      <div class="flex flex-col gap-2">
        <h3 class="font-display font-bold text-xs text-slate-300 uppercase tracking-wider">Sponsoren-Verträge</h3>

        <div class="glass-panel rounded-xl p-3 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-xl">⚡</span>
            <div>
              <h4 class="font-display font-bold text-xs text-slate-100">Nova Energy (Hauptsponsor)</h4>
              <p class="font-sans text-[11px] text-slate-400">500 🪙 Basis + 250 🪙 Siegprämie</p>
            </div>
          </div>
          <span class="font-mono text-[10px] text-pitch-emerald font-bold px-2 py-0.5 rounded bg-pitch-emerald/10 border border-pitch-emerald/30">AKTIV</span>
        </div>

        <div class="glass-panel rounded-xl p-3 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-xl">👕</span>
            <div>
              <h4 class="font-display font-bold text-xs text-slate-100">Apex Athletics (Ausrüster)</h4>
              <p class="font-sans text-[11px] text-slate-400">Prämie bei Einzug ins Final Four: +2.000 🪙</p>
            </div>
          </div>
          <span class="font-mono text-[10px] text-pitch-emerald font-bold px-2 py-0.5 rounded bg-pitch-emerald/10 border border-pitch-emerald/30">AKTIV</span>
        </div>
      </div>

      <!-- Infrastructure / Stadium Backlog Notice -->
      <div class="glass-panel rounded-xl p-3 border border-slate-700/40 flex items-center gap-3 text-xs text-slate-400">
        <span class="text-xl">🏟️</span>
        <div>
          <span class="font-display font-bold text-slate-300 block text-xs">Stadion & Jugendcampus</span>
          <p class="font-sans text-[11px] leading-relaxed text-slate-400">
            Physische Gebäude sind als TCG-Ausbaukarten im Phase-2-Backlog eingeplant. Im aktuellen MVP liegt der Fokus zu 100% auf dem Kader, Duellen und Transfermarkt.
          </p>
        </div>
      </div>

    </div>
  `;
}
