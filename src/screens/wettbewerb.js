// =============================================================================
// Starting XI TCG — Screen 3: Wettbewerbe (Zweistufige Navigation & echte Daten)
// =============================================================================

import { renderClubCrest } from '../components/crest.js';
import { computeLeagueTable } from '../engine/schedule.js';

export function renderWettbewerbScreen(state) {
  const activeCompetition = state.wettbewerbCompetition || 'liga'; // 'liga' | 'pokal'
  const activeSubTab = state.wettbewerbTab || 'overview'; // 'overview' | 'spielplan' | 'stats'

  const selectedTier = state.selectedLeagueTier || 6;
  const league = state.leagues.find(l => l.tier === selectedTier) || state.leagues[5];
  const sortedClubs = computeLeagueTable(league.clubs);
  const playerClub = state.leagues.find(l => l.tier === 6)?.clubs.find(c => c.id === state.playerClubId);
  const viewMatchday = state.viewMatchday || state.currentMatchday || 1;

  return `
    <div class="flex-1 flex flex-col p-3 gap-3.5 pb-24 overflow-y-auto no-scrollbar">
      
      <!-- LEVEL 1: TOP COMPETITION SWITCHER (LIGA vs POKAL) -->
      <div class="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-900 border border-white/10 shadow-xl">
        <button data-comp-switch="liga" class="py-2.5 rounded-xl font-display font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
          activeCompetition === 'liga'
            ? 'bg-pitch-emerald text-pitch-dark shadow-[0_0_15px_#00f59b]'
            : 'text-slate-400 hover:text-slate-100'
        }">
          <span>🏆</span>
          <span>Liga-Betrieb</span>
        </button>

        <button data-comp-switch="pokal" class="py-2.5 rounded-xl font-display font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
          activeCompetition === 'pokal'
            ? 'bg-pitch-emerald text-pitch-dark shadow-[0_0_15px_#00f59b]'
            : 'text-slate-400 hover:text-slate-100'
        }">
          <span>🥊</span>
          <span>Der Apex Cup</span>
        </button>
      </div>

      <!-- LEVEL 2: SUB-NAVIGATION (ÜBERSICHT | SPIELPLAN | STATS) -->
      <div class="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-950/80 border border-white/5">
        <button data-wettbewerb-subtab="overview" class="py-1.5 rounded-lg font-display font-bold text-[11px] uppercase tracking-wider transition-all ${
          activeSubTab === 'overview'
            ? 'bg-slate-800 text-pitch-emerald border border-pitch-emerald/40'
            : 'text-slate-400 hover:text-slate-200'
        }">
          Übersicht
        </button>

        <button data-wettbewerb-subtab="spielplan" class="py-1.5 rounded-lg font-display font-bold text-[11px] uppercase tracking-wider transition-all ${
          activeSubTab === 'spielplan'
            ? 'bg-slate-800 text-pitch-emerald border border-pitch-emerald/40'
            : 'text-slate-400 hover:text-slate-200'
        }">
          Spielplan
        </button>

        <button data-wettbewerb-subtab="stats" class="py-1.5 rounded-lg font-display font-bold text-[11px] uppercase tracking-wider transition-all ${
          activeSubTab === 'stats'
            ? 'bg-slate-800 text-pitch-emerald border border-pitch-emerald/40'
            : 'text-slate-400 hover:text-slate-200'
        }">
          Statistiken
        </button>
      </div>

      <!-- MAIN CONTENT VIEW -->
      ${
        activeCompetition === 'liga'
          ? renderLigaContent({ activeSubTab, league, sortedClubs, playerClub, selectedTier, state, viewMatchday })
          : renderPokalContent({ activeSubTab, playerClub, state, viewMatchday })
      }

    </div>
  `;
}

// =============================================================================
// LIGA CONTENT (ÜBERSICHT, SPIELPLAN, STATS)
// =============================================================================
function renderLigaContent({ activeSubTab, league, sortedClubs, playerClub, selectedTier, state, viewMatchday }) {
  if (activeSubTab === 'spielplan') {
    return renderSpielplanSection(state, viewMatchday, playerClub);
  }

  if (activeSubTab === 'stats') {
    return renderRealStatsSection(playerClub, league, state);
  }

  // Default: Overview / Tabelle
  return `
    <div class="flex flex-col gap-3">
      <!-- League Picker Header -->
      <div class="flex items-center justify-between px-1">
        <div>
          <span class="font-mono text-[9px] text-slate-400 uppercase tracking-wider block">Aktuelle Spielklasse</span>
          <h2 class="font-display font-black text-sm text-slate-100 uppercase tracking-tight">${league.name}</h2>
        </div>

        <select id="select-league-tier" class="bg-slate-900 border border-pitch-emerald/50 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-pitch-emerald outline-none cursor-pointer">
          ${state.leagues.map(l => `
            <option value="${l.tier}" ${l.tier === selectedTier ? 'selected' : ''}>
              ${l.name}
            </option>
          `).join('')}
        </select>
      </div>

      <!-- League Table Card -->
      <div class="glass-card rounded-2xl p-3 border border-white/10 shadow-2xl flex flex-col gap-1">
        <div class="grid grid-cols-12 text-[10px] font-mono text-slate-400 pb-2 border-b border-white/10 px-1">
          <span class="col-span-1 text-center">#</span>
          <span class="col-span-6">VEREIN</span>
          <span class="col-span-1 text-center">SP</span>
          <span class="col-span-2 text-center">TD</span>
          <span class="col-span-2 text-right pr-1">PKT</span>
        </div>

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

        <!-- Final Four Indicator Box -->
        <div class="mt-2 p-2.5 rounded-xl bg-pitch-emerald/10 border border-pitch-emerald/30 flex items-center justify-between text-xs">
          <div class="flex items-center gap-2">
            <span class="text-pitch-emerald text-sm">⚡</span>
            <span class="font-mono text-[10px] text-slate-300">
              <b>Plätze 1–4</b> spielen das <b class="text-pitch-emerald">Final Four</b>!
            </span>
          </div>
          <span class="font-mono text-[9px] text-pitch-emerald font-bold">BEIDE FINALISTEN STEIGEN AUF</span>
        </div>
      </div>
    </div>
  `;
}

// =============================================================================
// POKAL CONTENT (APEX CUP: ÜBERSICHT, RUNDEN, PRÄMIEN)
// =============================================================================
function renderPokalContent({ activeSubTab, playerClub, state, viewMatchday }) {
  const cupRounds = [
    { name: 'Runde 1', teams: '60 Teams', prize: '500 🪙', status: 'Aktiv' },
    { name: 'Sechzehntelfinale', teams: '32 Teams', prize: '1.000 🪙', status: 'Ausstehend' },
    { name: 'Achtelfinale', teams: '16 Teams', prize: '2.000 🪙', status: 'Ausstehend' },
    { name: 'Viertelfinale', teams: '8 Teams', prize: '4.000 🪙', status: 'Ausstehend' },
    { name: 'Halbfinale', teams: '4 Teams', prize: '8.000 🪙', status: 'Ausstehend' },
    { name: 'Großes Finale', teams: '2 Teams', prize: '15.000 🪙 + Pokal', status: 'Ausstehend' }
  ];

  if (activeSubTab === 'spielplan') {
    return `
      <div class="glass-card rounded-2xl p-4 border border-pitch-gold/30 flex flex-col gap-3 shadow-xl">
        <div class="flex items-center justify-between">
          <h3 class="font-display font-black text-xs uppercase tracking-wider text-slate-100">Pokal-Termine & Auslosung</h3>
          <span class="font-mono text-[9px] text-pitch-gold font-bold">K.O.-SYSTEM</span>
        </div>
        <p class="text-xs font-sans text-slate-300 leading-relaxed">
          Die Pokalrunden finden alle 3 Spieltage parallel zum Ligabetrieb statt. Nach Matchday 3 startet Runde 1 des Apex Cups!
        </p>
        <div class="p-3 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-between">
          <span class="font-mono text-xs text-slate-300">Nächster Pokal-Termin:</span>
          <b class="font-display text-xs text-pitch-emerald">Nach Spieltag 3</b>
        </div>
      </div>
    `;
  }

  if (activeSubTab === 'stats') {
    return `
      <div class="glass-card rounded-2xl p-6 border border-white/10 text-center flex flex-col items-center justify-center my-4">
        <span class="text-4xl mb-2">🏆</span>
        <h3 class="font-display font-black text-sm text-slate-100 uppercase tracking-tight">Noch keine Pokalspiele</h3>
        <p class="font-sans text-xs text-slate-400 max-w-xs mt-1">
          Der Apex Cup startet nach Spieltag 3. Alle Tore und Trophäen-Statistiken werden hier erfasst!
        </p>
      </div>
    `;
  }

  // Default: Cup Overview
  return `
    <div class="flex flex-col gap-3">
      <!-- Cup Hero Banner -->
      <div class="glass-card rounded-2xl p-4 border border-pitch-gold/40 shadow-2xl relative overflow-hidden">
        <div class="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-pitch-gold/15 blur-2xl pointer-events-none"></div>

        <div class="flex items-center justify-between">
          <span class="font-mono text-[9px] font-black uppercase text-pitch-gold px-2 py-0.5 rounded bg-yellow-500/10 border border-pitch-gold/40">
            NATIONALE K.O.-MEISTERSCHAFT
          </span>
          <span class="text-2xl">🏆</span>
        </div>

        <h3 class="font-display font-black text-lg text-slate-100 uppercase tracking-tight mt-1">
          Der Apex Cup
        </h3>
        <p class="font-sans text-xs text-slate-300 leading-snug mt-0.5">
          Alle 60 Vereine aus allen 6 Ligen kämpfen im K.o.-Modus um den Pokalsieg und massive Prämien!
        </p>

        <!-- Player Next Cup Fixture -->
        <div class="mt-3 p-3 rounded-xl bg-slate-950/80 border border-pitch-gold/30 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            ${renderClubCrest(playerClub, 28)}
            <div>
              <span class="font-display font-extrabold text-xs text-slate-100 block">Runde 1 Auslosung</span>
              <span class="font-mono text-[10px] text-pitch-gold font-bold">vs. Dynamo Süd (Liga 6)</span>
            </div>
          </div>
          <div class="text-right">
            <span class="font-mono text-[9px] text-slate-400 block">Siegprämie</span>
            <span class="font-display font-black text-xs text-pitch-emerald">+500 🪙</span>
          </div>
        </div>
      </div>

      <!-- Cup Tournament Rounds -->
      <div class="glass-panel rounded-2xl p-3 border border-white/10 flex flex-col gap-2 shadow-lg">
        <h4 class="font-display font-black text-xs uppercase tracking-wider text-slate-200 px-1">
          Turnierbaum & Runden
        </h4>

        <div class="flex flex-col gap-1.5">
          ${cupRounds.map((round, idx) => `
            <div class="flex items-center justify-between p-2.5 rounded-xl border ${
              idx === 0
                ? 'bg-pitch-gold/10 border-pitch-gold/40 shadow-[0_0_10px_rgba(255,209,92,0.2)]'
                : 'bg-slate-900/50 border-white/5 opacity-70'
            }">
              <div class="flex items-center gap-2.5">
                <span class="w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[10px] ${
                  idx === 0 ? 'bg-pitch-gold text-pitch-dark' : 'bg-slate-800 text-slate-400'
                }">${idx + 1}</span>
                <div>
                  <b class="font-display text-xs text-slate-100 block leading-tight">${round.name}</b>
                  <span class="font-mono text-[9px] text-slate-400">${round.teams}</span>
                </div>
              </div>
              <div class="text-right">
                <span class="font-mono text-[10px] text-pitch-emerald font-bold block">${round.prize}</span>
                <span class="font-mono text-[8px] uppercase tracking-wider ${
                  idx === 0 ? 'text-pitch-gold font-extrabold' : 'text-slate-500'
                }">${round.status}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// =============================================================================
// SPIELPLAN SECTION (SLIDER [◀ X / 18 ▶])
// =============================================================================
function renderSpielplanSection(state, viewDay, playerClub) {
  const scheduleDay = state.schedule.find(s => s.matchday === viewDay);
  const matches = scheduleDay?.matches || [];
  const maxDay = state.maxMatchdays || 18;

  return `
    <div class="flex flex-col gap-3">
      <!-- Matchday Navigator -->
      <div class="glass-panel rounded-2xl p-3 border border-white/10 flex items-center justify-between shadow-lg">
        <button id="btn-prev-matchday" data-day="${viewDay - 1}" class="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center active:scale-95 transition-all ${
          viewDay <= 1 ? 'opacity-30 pointer-events-none' : ''
        }">
          ◀
        </button>

        <div class="text-center">
          <span class="font-mono text-[9px] text-pitch-emerald font-bold uppercase tracking-wider block">
            ${viewDay === state.currentMatchday ? '⚡ AKTUELLER SPIELTAG' : (viewDay < state.currentMatchday ? '✓ BEENDET' : 'AUSSTEHEND')}
          </span>
          <h3 class="font-display font-black text-sm text-slate-100 uppercase tracking-tight">
            Spieltag ${viewDay} von ${maxDay}
          </h3>
        </div>

        <button id="btn-next-matchday" data-day="${viewDay + 1}" class="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center active:scale-95 transition-all ${
          viewDay >= maxDay ? 'opacity-30 pointer-events-none' : ''
        }">
          ▶
        </button>
      </div>

      <!-- Matchday Matches List -->
      <div class="flex flex-col gap-2">
        ${matches.map(m => {
          const home = state.leagues[5].clubs.find(c => c.id === m.homeId);
          const away = state.leagues[5].clubs.find(c => c.id === m.awayId);
          const isPlayerMatch = m.homeId === playerClub.id || m.awayId === playerClub.id;

          const isPlayed = viewDay < state.currentMatchday;
          const isCurrent = viewDay === state.currentMatchday;

          return `
            <div class="glass-card rounded-2xl p-3 border ${
              isPlayerMatch
                ? 'border-pitch-emerald/60 bg-emerald-950/20 shadow-[0_0_15px_rgba(0,245,155,0.2)]'
                : 'border-white/10'
            } flex items-center justify-between">
              
              <div class="flex-1 flex items-center gap-2 truncate">
                ${renderClubCrest(home, 24)}
                <span class="font-display font-bold text-xs truncate ${home?.id === playerClub.id ? 'text-pitch-emerald' : 'text-slate-100'}">
                  ${home?.name || 'Heim'}
                </span>
              </div>

              <div class="px-3 py-1 rounded-xl font-mono font-black text-xs ${
                isPlayed
                  ? 'bg-slate-900 border border-slate-700 text-slate-100'
                  : (isCurrent ? 'bg-pitch-emerald/20 text-pitch-emerald border border-pitch-emerald/40' : 'bg-slate-900/60 text-slate-500')
              }">
                ${isPlayed ? `${m.homeScore ?? 1} : ${m.awayScore ?? 0}` : (isCurrent ? 'VS' : '15:30')}
              </div>

              <div class="flex-1 flex items-center justify-end gap-2 truncate">
                <span class="font-display font-bold text-xs truncate ${away?.id === playerClub.id ? 'text-pitch-emerald' : 'text-slate-100'}">
                  ${away?.name || 'Gast'}
                </span>
                ${renderClubCrest(away, 24)}
              </div>

            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// =============================================================================
// ECHTE STATISTIKEN (KEINE FAKE TORE VOR SAISONSTART)
// =============================================================================
function renderRealStatsSection(playerClub, league, state) {
  const gamesPlayed = playerClub.stats.played || 0;

  if (gamesPlayed === 0) {
    return `
      <div class="glass-card rounded-2xl p-8 border border-white/10 text-center flex flex-col items-center justify-center my-4 shadow-xl">
        <span class="text-4xl mb-3">📊</span>
        <h3 class="font-display font-black text-sm text-slate-100 uppercase tracking-tight">
          Noch keine Saisonspiele absolviert
        </h3>
        <p class="font-sans text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed">
          Bestreite dein erstes Pflichtspiel am 1. Spieltag gegen den SV Eisenstadt, um Torschützen, Duell-Quoten und Formkurven zu erfassen!
        </p>
        <button id="btn-quick-start-from-stats" class="mt-4 px-4 py-2 rounded-xl bg-pitch-emerald text-pitch-dark font-display font-black text-xs uppercase tracking-wider shadow-[0_0_15px_#00f59b] active:scale-95 transition-all">
          Zum ersten Spieltag ➔
        </button>
      </div>
    `;
  }

  // Real stats if games were actually played
  return `
    <div class="flex flex-col gap-3">
      <!-- Real Club KPIs -->
      <div class="glass-panel rounded-2xl p-3.5 border border-white/10 flex flex-col gap-2.5 shadow-xl">
        <h4 class="font-display font-black text-xs text-slate-100 uppercase tracking-wider px-1">
          Vereins-Performance (${playerClub.name})
        </h4>

        <div class="grid grid-cols-2 gap-2 text-xs font-mono">
          <div class="glass-card rounded-xl p-2.5 border border-white/10">
            <span class="text-slate-400 text-[10px] block">GESPIELTE SPIELE</span>
            <span class="font-display font-black text-base text-slate-100">${gamesPlayed}</span>
          </div>

          <div class="glass-card rounded-xl p-2.5 border border-white/10">
            <span class="text-slate-400 text-[10px] block">TORE PRO SPIEL</span>
            <span class="font-display font-black text-base text-pitch-emerald">
              ${(playerClub.stats.gf / gamesPlayed).toFixed(1)}
            </span>
          </div>

          <div class="glass-card rounded-xl p-2.5 border border-white/10">
            <span class="text-slate-400 text-[10px] block">GEGENTORE PRO SPIEL</span>
            <span class="font-display font-black text-base text-slate-300">
              ${(playerClub.stats.ga / gamesPlayed).toFixed(1)}
            </span>
          </div>

          <div class="glass-card rounded-xl p-2.5 border border-white/10">
            <span class="text-slate-400 text-[10px] block">BILANZ (S-U-N)</span>
            <span class="font-display font-black text-xs text-slate-200">
              ${playerClub.stats.won} S - ${playerClub.stats.drawn} U - ${playerClub.stats.lost} N
            </span>
          </div>
        </div>
      </div>
    </div>
  `;
}
