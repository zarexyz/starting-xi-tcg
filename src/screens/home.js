// =============================================================================
// Starting XI TCG — Screen 1: Home Dashboard View (Comprehensive Command Center)
// =============================================================================

import { renderClubCrest } from '../components/crest.js';
import { renderFUTCard } from '../components/card.js';
import { calculateSquadChemistry } from '../engine/ratings.js';
import { computeLeagueTable } from '../engine/schedule.js';

export function renderHomeScreen(state) {
  const club = state.leagues.find(l => l.tier === 6)?.clubs.find(c => c.id === state.playerClubId);
  const liga = state.leagues.find(l => l.tier === 6);
  const currentMatchday = state.currentMatchday || 1;

  // Prüfen ob ein Pokal-Mittwoch (Apex Cup K.o.-Spiel) ansteht
  const isCupPending = state.cup?.activeCupMatchPending && !state.cup?.isEliminated;
  let cupOpponent = null;
  let cupRoundName = '';
  let cupPrize = 500;

  if (isCupPending) {
    const roundNum = state.cup.currentRound || 1;
    cupRoundName = state.cup.roundNames?.[roundNum] || `Runde ${roundNum}`;
    cupPrize = state.cup.prizes?.[roundNum] || 500;
    
    // Passenden Pokalgegner nach Turnier-Runde ziehen
    const targetTier = Math.max(1, 7 - roundNum);
    const targetLeague = state.leagues.find(l => l.tier === targetTier) || state.leagues[0];
    cupOpponent = targetLeague.clubs.find(c => c.id !== club.id) || state.leagues[0].clubs[1];
  }

  // Nächstes Spiel ermitteln (Liga oder Pokal)
  const scheduleDay = state.schedule.find(s => s.matchday === currentMatchday);
  const nextMatch = scheduleDay?.matches.find(m => m.homeId === club.id || m.awayId === club.id);

  let opponent = null;
  let isHome = true;
  if (isCupPending) {
    opponent = cupOpponent;
    isHome = true;
  } else if (nextMatch) {
    isHome = nextMatch.homeId === club.id;
    const oppId = isHome ? nextMatch.awayId : nextMatch.homeId;
    opponent = liga.clubs.find(c => c.id === oppId);
  }

  const starters = club.squad.filter(p => p.isStarter);
  const teamOvr = starters.length ? Math.round(starters.reduce((acc, p) => acc + p.ovr, 0) / starters.length) : 64;
  const oppStarters = opponent ? opponent.squad.filter(p => p.isStarter) : [];
  const oppOvr = oppStarters.length ? Math.round(oppStarters.reduce((acc, p) => acc + p.ovr, 0) / oppStarters.length) : 62;

  const { chemistryPercent, totalPips, maxPips } = calculateSquadChemistry(starters);

  // Liga-Tabelle berechnen
  const table = computeLeagueTable(liga.clubs, state.schedule, currentMatchday - 1);
  const myRankIdx = table.findIndex(c => c.id === club.id);
  const myRank = myRankIdx !== -1 ? myRankIdx + 1 : 1;

  // Starspieler ermitteln (Höchster OVR)
  const starPlayer = club.squad.length 
    ? [...club.squad].sort((a, b) => b.ovr - a.ovr)[0] 
    : null;

  // Gehaltskosten & Finanzvorschau
  const totalWages = starters.reduce((acc, p) => acc + Math.round(Math.pow(p.ovr / 70, 3.2) * 18), 0);
  const sponsorIncome = 250;
  const matchdayNet = sponsorIncome - totalWages;

  return `
    <div class="flex-1 flex flex-col p-3 gap-3.5 pb-24 overflow-y-auto no-scrollbar">
      
      <!-- 1. Matchday Hero Clash Card (Liga oder Apex Cup K.o.) -->
      ${isCupPending ? `
        <!-- APEX CUP MITTWOCH HERO CARD -->
        <div class="glass-card rounded-2xl p-4 border border-pitch-gold/60 shadow-[0_0_30px_rgba(255,209,92,0.25)] relative overflow-hidden bg-gradient-to-br from-amber-950/40 via-slate-900/90 to-slate-950/90">
          <div class="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-pitch-gold/15 blur-3xl pointer-events-none"></div>

          <div class="flex items-center justify-between text-xs text-slate-300 font-mono mb-3">
            <span class="flex items-center gap-1.5 font-black text-pitch-gold">
              <span class="w-2.5 h-2.5 rounded-full bg-pitch-gold animate-ping"></span>
              🏆 APEX CUP • ${cupRoundName.toUpperCase()}
            </span>
            <span class="px-2 py-0.5 rounded bg-yellow-500/10 border border-pitch-gold/30 text-[10px] font-bold text-pitch-gold">
              💰 ${cupPrize.toLocaleString()} 🪙 SIEGPRÄMIE
            </span>
          </div>

          <!-- Head to Head Clash Display -->
          <div class="flex items-center justify-between my-2">
            <div class="flex flex-col items-center flex-1">
              ${renderClubCrest(club, 50)}
              <h3 class="font-display font-extrabold text-xs text-slate-100 text-center mt-1.5 truncate max-w-[105px]">
                ${club.name}
              </h3>
              <span class="font-mono text-xs font-black text-pitch-emerald mt-0.5">${teamOvr} OVR</span>
            </div>

            <div class="flex flex-col items-center px-2">
              <span class="font-display font-black text-2xl italic text-pitch-gold">VS</span>
              <span class="text-[9px] font-mono text-pitch-danger font-extrabold uppercase tracking-wider animate-pulse">K.O.-DUELL</span>
            </div>

            <div class="flex flex-col items-center flex-1">
              ${renderClubCrest(opponent, 50)}
              <h3 class="font-display font-extrabold text-xs text-slate-100 text-center mt-1.5 truncate max-w-[105px]">
                ${opponent?.name || 'Gegner'}
              </h3>
              <span class="font-mono text-xs font-bold text-slate-300 mt-0.5">${oppOvr} OVR</span>
            </div>
          </div>

          <!-- Anpfiff CTA Button -->
          <button id="btn-start-match" data-is-cup="true" class="w-full mt-3 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 text-pitch-dark font-display font-black uppercase text-xs tracking-wider shadow-[0_0_25px_rgba(255,209,92,0.5)] active:scale-98 transition-all flex items-center justify-center gap-2">
            <span>🏆 ZUM POKAL-KRACHER ANPFEIFEN</span>
          </button>
        </div>
      ` : `
        <!-- REGULAR LIGA 6 MATCHDAY HERO -->
        <div class="glass-card rounded-2xl p-4 border border-pitch-emerald/40 shadow-2xl relative overflow-hidden bg-gradient-to-br from-slate-900/90 to-slate-950/90">
          <div class="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-pitch-emerald/10 blur-3xl pointer-events-none"></div>

          <div class="flex items-center justify-between text-xs text-slate-400 font-mono mb-3">
            <span class="flex items-center gap-1.5 font-bold text-pitch-emerald">
              <span class="w-2.5 h-2.5 rounded-full bg-pitch-emerald animate-ping"></span>
              SPIELTAG ${currentMatchday} / ${state.maxMatchdays}
            </span>
            <span class="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-300">
              ${isHome ? '🏠 HEIMSPIEL' : '✈️ AUSWÄRTSSPIEL'}
            </span>
          </div>

          <!-- Head to Head Clash Display -->
          <div class="flex items-center justify-between my-2">
            <!-- Home Club -->
            <div class="flex flex-col items-center flex-1">
              ${renderClubCrest(club, 50)}
              <h3 class="font-display font-extrabold text-xs text-slate-100 text-center mt-1.5 truncate max-w-[105px]">
                ${club.name}
              </h3>
              <span class="font-mono text-xs font-black text-pitch-emerald mt-0.5">${teamOvr} OVR</span>
            </div>

            <!-- VS Badge -->
            <div class="flex flex-col items-center px-2">
              <span class="font-display font-black text-2xl italic text-slate-600">VS</span>
              <span class="text-[9px] font-mono text-pitch-gold font-bold">ANPFIFF BEREIT</span>
            </div>

            <!-- Opponent Club -->
            <div class="flex flex-col items-center flex-1">
              ${renderClubCrest(opponent, 50)}
              <h3 class="font-display font-extrabold text-xs text-slate-100 text-center mt-1.5 truncate max-w-[105px]">
                ${opponent?.name || 'Gegner'}
              </h3>
              <span class="font-mono text-xs font-bold text-slate-400 mt-0.5">${oppOvr} OVR</span>
            </div>
          </div>

          <!-- Anpfiff CTA Button -->
          <button id="btn-start-match" class="w-full mt-3 py-3.5 rounded-xl bg-pitch-emerald hover:bg-emerald-400 text-pitch-dark font-display font-black uppercase text-xs tracking-wider shadow-[0_0_25px_rgba(0,245,155,0.4)] active:scale-98 transition-all flex items-center justify-center gap-2">
            <span>⚽ ZUM MATCHDAY-DUELL ANPFEIFEN</span>
          </button>
        </div>
      `}

      <!-- 2. Quick Deck & Synergy Status -->
      <div class="grid grid-cols-2 gap-2.5">
        <div class="glass-panel rounded-2xl p-3 flex flex-col justify-between cursor-pointer hover:border-pitch-emerald/40 transition-colors" id="btn-quick-kader">
          <span class="font-mono text-[10px] text-slate-400 uppercase tracking-wider font-bold">Team-Chemie</span>
          <div class="flex items-baseline gap-1 my-1">
            <span class="font-display font-black text-2xl text-pitch-emerald">${chemistryPercent}%</span>
            <span class="font-mono text-[10px] text-slate-400">(${totalPips}/${maxPips})</span>
          </div>
          <div class="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div class="bg-pitch-emerald h-1.5 rounded-full" style="width: ${chemistryPercent}%"></div>
          </div>
        </div>

        <div class="glass-panel rounded-2xl p-3 flex flex-col justify-between cursor-pointer hover:border-pitch-emerald/40 transition-colors" id="btn-quick-formation">
          <span class="font-mono text-[10px] text-slate-400 uppercase tracking-wider font-bold">Aufstellung</span>
          <div class="flex items-baseline gap-1 my-1">
            <span class="font-display font-black text-base text-slate-100 truncate">${club.formation || '4-3-3 Attack'}</span>
          </div>
          <span class="font-mono text-[10px] text-pitch-emerald font-bold">Kader anpassen ➔</span>
        </div>
      </div>

      <!-- 3. Schnell-Absprünge (Navigation Hub Tiles) -->
      <div class="grid grid-cols-4 gap-2">
        <button data-quick-tab="kader" class="glass-panel p-2.5 rounded-xl border border-white/5 hover:border-pitch-emerald/40 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all text-center">
          <span class="text-xl">🎴</span>
          <span class="font-display font-black text-[9px] uppercase text-slate-200">Kader</span>
        </button>
        <button data-quick-tab="markt" class="glass-panel p-2.5 rounded-xl border border-white/5 hover:border-pitch-gold/40 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all text-center">
          <span class="text-xl">🏪</span>
          <span class="font-display font-black text-[9px] uppercase text-slate-200">Packs</span>
        </button>
        <button data-quick-tab="wettbewerb" class="glass-panel p-2.5 rounded-xl border border-white/5 hover:border-sky-400/40 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all text-center">
          <span class="text-xl">🏆</span>
          <span class="font-display font-black text-[9px] uppercase text-slate-200">Wettbewerb</span>
        </button>
        <button id="btn-quick-inbox" class="glass-panel p-2.5 rounded-xl border border-white/5 hover:border-purple-400/40 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all text-center relative">
          <span class="text-xl">✉️</span>
          <span class="font-display font-black text-[9px] uppercase text-slate-200">Postfach</span>
          ${(state.inbox || []).filter(m => m.unread).length > 0 ? `
            <span class="absolute top-1 right-1 w-2 h-2 rounded-full bg-pitch-danger animate-pulse"></span>
          ` : ''}
        </button>
      </div>

      <!-- 4. Liga 6 Mini-Tabelle & Tabellenstand -->
      <div class="glass-panel rounded-2xl p-3.5 border border-white/10 flex flex-col gap-2.5 shadow-lg">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-base">📊</span>
            <div>
              <h4 class="font-display font-bold text-xs text-slate-100 uppercase tracking-wider">
                Liga 6 Blitz-Tabelle
              </h4>
              <span class="font-mono text-[9px] text-pitch-gold font-bold">
                DEIN PLATZ: #${myRank} (${club.stats.points} PKT)
              </span>
            </div>
          </div>
          <button data-quick-tab="wettbewerb" class="font-mono text-[10px] text-pitch-emerald hover:underline font-bold">
            Ganze Tabelle ➔
          </button>
        </div>

        <div class="flex flex-col gap-1 text-xs">
          ${table.slice(0, 4).map((c, idx) => {
            const isMe = c.id === club.id;
            return `
              <div class="flex items-center justify-between py-1 px-2 rounded-lg ${isMe ? 'bg-pitch-emerald/15 border border-pitch-emerald/40 text-pitch-emerald font-bold' : 'text-slate-300'}\">\n                <div class=\"flex items-center gap-2\">\n                  <span class=\"font-mono text-[10px] text-slate-400 w-3.5\">${idx + 1}.</span>\n                  <span class=\"truncate max-w-[130px] font-sans text-xs\">${c.name}</span>\n                  ${idx < 4 ? '<span class=\"text-[8px] px-1 rounded bg-emerald-950 text-pitch-emerald font-mono\">PLAYOFF</span>' : ''}\n                </div>\n                <div class=\"flex items-center gap-3 font-mono text-[11px]\">\n                  <span class=\"text-slate-400\">${c.stats.gf}:${c.stats.ga}</span>\n                  <span class=\"font-black w-5 text-right text-slate-100\">${c.stats.points} P</span>\n                </div>\n              </div>\n            `;
          }).join('')}
        </div>
      </div>

      <!-- 5. Starspieler Spotlight -->
      ${starPlayer ? `
        <div class="glass-panel rounded-2xl p-3.5 border border-pitch-gold/30 flex items-center justify-between gap-3 shadow-lg">
          <div class="flex items-center gap-3">
            ${renderFUTCard(starPlayer, { compact: true })}
            <div class="flex flex-col gap-0.5">
              <span class="font-mono text-[8px] text-pitch-gold uppercase font-black tracking-widest">STAR DES TEAMS</span>
              <h4 class="font-display font-black text-sm text-slate-100 uppercase tracking-tight">${starPlayer.name}</h4>
              <div class="flex items-center gap-2 text-[10px] font-mono text-slate-300 mt-1">
                <span>Kondition: <b class="text-pitch-emerald">${starPlayer.condition}%</b></span>
                <span>•</span>
                <span>Vertrag: <b class="text-pitch-gold">${starPlayer.contractMatches} Sp.</b></span>
              </div>
            </div>
          </div>
          <button data-quick-tab="kader" class="px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 font-display font-bold text-[10px] uppercase hover:text-white">
            Kader
          </button>
        </div>
      ` : ''}

      <!-- 6. Finanz-Barometer & Manager-Aufgaben -->
      <div class="glass-panel rounded-2xl p-3.5 border border-white/10 flex flex-col gap-2.5">
        <div class="flex items-center justify-between">
          <h4 class="font-display font-bold text-xs text-slate-200 uppercase tracking-wider">Tagesbilanz & Aufgaben</h4>
          <span class="font-mono text-[10px] ${matchdayNet >= 0 ? 'text-pitch-emerald' : 'text-pitch-danger'} font-bold">
            ${matchdayNet >= 0 ? `+${matchdayNet}` : matchdayNet} 🪙 / Spieltag
          </span>
        </div>

        <div class="flex items-center justify-between text-xs py-1 border-b border-slate-800">
          <span class="text-slate-300">1x Pflichtspiel gewinnen</span>
          <span class="font-mono text-pitch-gold font-bold">+150 🪙</span>
        </div>
        <div class="flex items-center justify-between text-xs py-1">
          <span class="text-slate-300">Team-Chemie über 80% bringen</span>
          <span class="font-mono text-pitch-emerald font-bold">1x Fitness-Pack</span>
        </div>
      </div>

    </div>
  `;
}