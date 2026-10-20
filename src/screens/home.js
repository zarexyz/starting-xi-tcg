// =============================================================================
// Starting XI TCG — Screen 1: Home Dashboard View
// =============================================================================

import { renderClubCrest } from '../components/crest.js';
import { calculateSquadChemistry } from '../engine/ratings.js';

export function renderHomeScreen(state) {
  const club = state.leagues.find(l => l.tier === 6)?.clubs.find(c => c.id === state.playerClubId);
  const liga = state.leagues.find(l => l.tier === 6);
  const currentMatchday = state.currentMatchday || 1;

  // Nächstes Spiel ermitteln
  const scheduleDay = state.schedule.find(s => s.matchday === currentMatchday);
  const nextMatch = scheduleDay?.matches.find(m => m.homeId === club.id || m.awayId === club.id);

  let opponent = null;
  let isHome = true;
  if (nextMatch) {
    isHome = nextMatch.homeId === club.id;
    const oppId = isHome ? nextMatch.awayId : nextMatch.homeId;
    opponent = liga.clubs.find(c => c.id === oppId);
  }

  const starters = club.squad.filter(p => p.isStarter);
  const teamOvr = starters.length ? Math.round(starters.reduce((acc, p) => acc + p.ovr, 0) / starters.length) : 64;
  const oppStarters = opponent ? opponent.squad.filter(p => p.isStarter) : [];
  const oppOvr = oppStarters.length ? Math.round(oppStarters.reduce((acc, p) => acc + p.ovr, 0) / oppStarters.length) : 62;

  const { chemistryPercent, totalPips, maxPips } = calculateSquadChemistry(starters);

  return `
    <div class="flex-1 flex flex-col p-3 gap-3.5 pb-20 overflow-y-auto no-scrollbar">
      
      <!-- Matchday Hero Card -->
      <div class="glass-card rounded-2xl p-4 border border-pitch-emerald/30 shadow-2xl relative overflow-hidden">
        <!-- Glow Backdrop -->
        <div class="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-pitch-emerald/10 blur-3xl pointer-events-none"></div>

        <div class="flex items-center justify-between text-xs text-slate-400 font-mono mb-3">
          <span class="flex items-center gap-1.5 font-bold text-pitch-emerald">
            <span class="w-2 h-2 rounded-full bg-pitch-emerald animate-ping"></span>
            SPIELTAG ${currentMatchday} / ${state.maxMatchdays}
          </span>
          <span>${isHome ? 'HEIMSPIEL' : 'AUSWÄRTSSPIEL'}</span>
        </div>

        <!-- Head to Head Clash Display -->
        <div class="flex items-center justify-between my-2">
          <!-- Home Club -->
          <div class="flex flex-col items-center flex-1">
            ${renderClubCrest(club, 48)}
            <h3 class="font-display font-extrabold text-xs text-slate-100 text-center mt-1.5 truncate max-w-[100px]">
              ${club.name}
            </h3>
            <span class="font-mono text-xs font-bold text-pitch-emerald mt-0.5">${teamOvr} OVR</span>
          </div>

          <!-- VS Badge -->
          <div class="flex flex-col items-center px-2">
            <span class="font-display font-black text-xl italic text-slate-500">VS</span>
            <span class="text-[10px] font-mono text-slate-400">ANPFIFF BEREIT</span>
          </div>

          <!-- Opponent Club -->
          <div class="flex flex-col items-center flex-1">
            ${renderClubCrest(opponent, 48)}
            <h3 class="font-display font-extrabold text-xs text-slate-100 text-center mt-1.5 truncate max-w-[100px]">
              ${opponent?.name || 'Gegner'}
            </h3>
            <span class="font-mono text-xs font-bold text-slate-400 mt-0.5">${oppOvr} OVR</span>
          </div>
        </div>

        <!-- Anpfiff CTA Button -->
        <button id="btn-start-match" class="w-full mt-3 py-3 rounded-xl bg-pitch-emerald hover:bg-emerald-400 text-pitch-dark font-display font-black uppercase text-xs tracking-wider shadow-[0_0_20px_rgba(0,245,155,0.4)] active:scale-98 transition-all flex items-center justify-center gap-2">
          <span>⚽ ZUM MATCHDAY-DUELL</span>
        </button>
      </div>

      <!-- Quick Deck & Synergy Status -->
      <div class="grid grid-cols-2 gap-2.5">
        <div class="glass-panel rounded-xl p-3 flex flex-col justify-between">
          <span class="font-mono text-[10px] text-slate-400 uppercase tracking-wider">Team-Chemie</span>
          <div class="flex items-baseline gap-1 my-1">
            <span class="font-display font-black text-2xl text-pitch-emerald">${chemistryPercent}%</span>
            <span class="font-mono text-[10px] text-slate-400">(${totalPips}/${maxPips})</span>
          </div>
          <div class="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div class="bg-pitch-emerald h-1.5 rounded-full" style="width: ${chemistryPercent}%"></div>
          </div>
        </div>

        <div class="glass-panel rounded-xl p-3 flex flex-col justify-between cursor-pointer hover:border-pitch-emerald/50 transition-colors" id="btn-quick-kader">
          <span class="font-mono text-[10px] text-slate-400 uppercase tracking-wider">Aufstellung</span>
          <div class="flex items-baseline gap-1 my-1">
            <span class="font-display font-black text-lg text-slate-100">${club.tactics.formation}</span>
          </div>
          <span class="font-mono text-[10px] text-pitch-cyan">Taktikboard öffnen ➔</span>
        </div>
      </div>

      <!-- Booster & Draft Banner -->
      <div class="glass-panel rounded-xl p-3.5 border border-pitch-gold/30 flex items-center justify-between cursor-pointer hover:border-pitch-gold transition-colors" id="btn-quick-draft">
        <div class="flex items-center gap-3">
          <span class="text-2xl p-2 rounded-lg bg-yellow-500/10 border border-pitch-gold/30">🌟</span>
          <div class="flex flex-col">
            <h4 class="font-display font-bold text-xs text-pitch-gold uppercase tracking-wide">Rookie-Draft Pool verfügbar</h4>
            <p class="font-sans text-[11px] text-slate-400">Entdecke 3 neue Talente für dein Deck</p>
          </div>
        </div>
        <span class="font-mono font-bold text-xs text-pitch-gold">500 🪙</span>
      </div>

      <!-- Daily Manager Quests -->
      <div class="glass-panel rounded-xl p-3 flex flex-col gap-2">
        <h4 class="font-display font-bold text-xs text-slate-200 uppercase tracking-wider">Manager-Tagesaufgaben</h4>
        <div class="flex items-center justify-between text-xs py-1.5 border-b border-slate-800">
          <span class="text-slate-300">1x Pflichtspiel gewinnen</span>
          <span class="font-mono text-pitch-gold font-bold">+150 🪙</span>
        </div>
        <div class="flex items-center justify-between text-xs py-1.5">
          <span class="text-slate-300">Team-Chemie über 80% bringen</span>
          <span class="font-mono text-pitch-emerald font-bold">1x Fitness-Pack</span>
        </div>
      </div>

    </div>
  `;
}
