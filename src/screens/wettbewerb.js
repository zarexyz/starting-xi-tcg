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
            const isPlayer club.isPlayer;

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
// POKAL CONTENT (APEX CUP: ÜBERSICHT, TURNIERBAUM & SPIELPLAN)
// =============================================================================
function renderPokalContent({ activeSubTab, playerClub, state, viewMatchday }) {
  const selectedCupRound = state.selectedCupRound || 1;
  const cupState = state.cup || { currentRound: 1, isEliminated: false, history: [] };
  const currentCupRound = cupState.currentRound || 1;
  const isEliminated = !!cupState.isEliminated;

  const cupRounds = [
    { round: 1, name: 'Runde 1', teamsCount: 64, prize: '500 🪙', date: 'Nach Sp. 3' },
    { round: 2, name: 'Sechzehntelfinale', teamsCount: 32, prize: '1.000 🪙', date: 'Nach Sp. 6' },
    { round: 3, name: 'Achtelfinale', teamsCount: 16, prize: '2.000 🪙', date: 'Nach Sp. 9' },
    { round: 4, name: 'Viertelfinale', teamsCount: 8, prize: '4.000 🪙', date: 'Nach Sp. 12' },
    { round: 5, name: 'Halbfinale', teamsCount: 4, prize: '8.000 🪙', date: 'Nach Sp. 15' },
    { round: 6, name: 'Großes Finale', teamsCount: 2, prize: '15.000 🪙', date: 'Nach Sp. 18' }
  ].map(r => {
    let status = 'Ausstehend';
    let statusColor = 'text-slate-400 bg-slate-800/80 border-slate-700';
    if (cupState.history?.some(h => h.round === r.round && h.won)) {
      status = 'Gewonnen ✓';
      statusColor = 'text-pitch-emerald bg-emerald-950/80 border-pitch-emerald/50';
    } else if (isEliminated && r.round >= currentCupRound) {
      status = r.round === currentCupRound ? 'Ausgeschieden ✕' : 'Verpasst';
      statusColor = 'text-pitch-danger bg-red-950/80 border-pitch-danger/50';
    } else if (r.round === currentCupRound) {
      status = cupState.activeCupMatchPending ? '🔥 Jetzt spielbereit!' : 'Als Nächstes';
      statusColor = 'text-pitch-gold bg-yellow-500/15 border-pitch-gold/50';
    }
    return { ...r, status, statusColor };
  });

  const currentRoundData = cupRounds.find(r => r.round === selectedCupRound) || cupRounds[0];

  // Beispielduele für den Apex Cup Bracket (Bundesweiter K.-o.-Baum über alle 6 Ligen)
  const allLeaguesClubs = state.leagues.flatMap(l => l.clubs);
  const targetTier = Math.max(1, 7 - currentCupRound);
  const targetLeague = state.leagues.find(l => l.tier === targetTier) || state.leagues[0];
  const oppClub = targetLeague.clubs.find(c => c.id !== playerClub.id) || allLeaguesClubs[1];

  const sampleMatchups = [
    { home: playerClub, away: oppClub, isPlayerMatch: true, result: null, time: 'Nach Sp. 3' },
    { home: allLeaguesClubs.find(c => c.tier === 1) || allLeaguesClubs[0], away: allLeaguesClubs.find(c => c.tier === 5) || allLeaguesClubs[10], isPlayerMatch: false, result: null, time: 'Nach Sp. 3' },
    { home: allLeaguesClubs.find(c => c.tier === 2) || allLeaguesClubs[5], away: allLeaguesClubs.find(c => c.tier === 6 && c.id !== playerClub.id) || allLeaguesClubs[15], isPlayerMatch: false, result: null, time: 'Nach Sp. 3' },
    { home: allLeaguesClubs.find(c => c.tier === 3) || allLeaguesClubs[8], away: allLeaguesClubs.find(c => c.tier === 4) || allLeaguesClubs[12], isPlayerMatch: false, result: null, time: 'Nach Sp. 3' }
  ];

  if (activeSubTab === 'spielplan') {
    return `
      <div class="flex flex-col gap-3">
        <div class="glass-card rounded-2xl p-4 border border-pitch-gold/40 flex flex-col gap-2.5 shadow-xl relative overflow-hidden">
          <div class="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-pitch-gold/10 blur-xl pointer-events-none"></div>
          <div class="flex items-center justify-between">
            <span class="font-mono text-[9px] font-black uppercase text-pitch-gold px-2 py-0.5 rounded bg-yellow-500/10 border border-pitch-gold/40">
              POKAL-SPIELPLAN • K.O.-SYSTEM
            </span>
            <span class="text-xl">📅</span>
          </div>
          <h3 class="font-display font-black text-sm text-slate-100 uppercase tracking-tight">
            Nächste Pokalrunde: ${currentRoundData.name}
          </h3>
          <p class="text-xs font-sans text-slate-300 leading-relaxed">
            Der Apex Cup wird parallel zum Ligabetrieb alle 3 Spieltage ausgespielt. Verlierer scheiden sofort aus, Sieger erhalten Prämien und ziehen in die nächste Runde ein.
          </p>
        </div>

        <!-- Match List for Selected Round -->
        <div class="flex flex-col gap-2">
          ${sampleMatchups.map(m => `
            <div class="glass-card rounded-2xl p-3 border ${
              m.isPlayerMatch
                ? 'border-pitch-emerald/60 bg-emerald-950/30 shadow-[0_0_15px_rgba(0,245,155,0.25)]'
                : 'border-white/10'
            } flex items-center justify-between">
              <div class="flex-1 flex items-center gap-2 truncate">
                ${renderClubCrest(m.home, 24)}
                <span class="font-display font-bold text-xs truncate ${m.home.id === playerClub.id ? 'text-pitch-emerald' : 'text-slate-100'}">
                  ${m.home.name}
                </span>
              </div>

              <div class="px-3 py-1 rounded-xl font-mono font-black text-xs bg-slate-900 border border-slate-700 text-pitch-gold">
                VS
              </div>

              <div class="flex-1 flex items-center justify-end gap-2 truncate">
                <span class="font-display font-bold text-xs truncate ${m.away.id === playerClub.id ? 'text-pitch-emerald' : 'text-slate-100'}">
                  ${m.away.name}
                </span>
                ${renderClubCrest(m.away, 24)}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  if (activeSubTab === 'stats') {
    return `
      <div class="glass-card rounded-2xl p-8 border border-white/10 text-center flex flex-col items-center justify-center my-4 shadow-xl">
        <span class="text-4xl mb-3">🥊</span>
        <h3 class="font-display font-black text-sm text-slate-100 uppercase tracking-tight">
          Noch keine Pokalspiele absolviert
        </h3>
        <p class="font-sans text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed">
          Runde 1 des Apex Cups startet nach Spieltag 3. Alle Tore, Pokalsensationen und Trophäen werden hier dokumentiert!
        </p>
      </div>
    `;
  }

  // Default: Cup Overview / Interactive Tournament Bracket
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
          Alle 60 Vereine aus allen 6 Spielklassen (Bundesweit) kämpfen im K.o.-Modus um den Pokaltitel und 15.000 🪙 Prämie!
        </p>

        <!-- Player Next Cup Fixture Box -->
        ${isEliminated ? `
          <div class="mt-3 p-3 rounded-xl bg-slate-950/80 border border-red-500/40 flex items-center justify-between shadow-inner">
            <div class="flex items-center gap-2.5">
              <span class="text-2xl">❌</span>
              <div>
                <span class="font-display font-extrabold text-xs text-red-300 block">Aus dem Pokal ausgeschieden</span>
                <span class="font-mono text-[10px] text-slate-400">In Runde ${currentCupRound} unterlegen • Neuer Pokalanlauf nächste Saison</span>
              </div>
            </div>
            <span class="px-2 py-1 rounded bg-red-950 text-red-400 text-[10px] font-bold border border-red-500/30">K.O.</span>
          </div>
        ` : `
          <div class="mt-3 p-3 rounded-xl bg-slate-950/80 border border-pitch-gold/30 flex items-center justify-between shadow-inner">
            <div class="flex items-center gap-2.5">
              ${renderClubCrest(playerClub, 28)}
              <div>
                <span class="font-display font-extrabold text-xs text-slate-100 block">Runde ${currentCupRound} Auslosung</span>
                <span class="font-mono text-[10px] text-pitch-gold font-bold">vs. ${oppClub.name} (${oppClub.tier ? `Liga ${oppClub.tier}` : 'Liga 6'})</span>
              </div>
            </div>
            <div class="text-right">
              <span class="font-mono text-[9px] text-slate-400 block">Siegprämie</span>
              <span class="font-display font-black text-xs text-pitch-emerald">+${cupRounds[currentCupRound - 1]?.prize || '500 🪙'}</span>
            </div>
          </div>
        `}
      </div>

      <!-- K.-o.-Turnierbaum Runden-Wähler (Horizontal Scrollable) -->
      <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        ${cupRounds.map(r => `
          <button data-cup-round="${r.round}" class="px-3 py-1.5 rounded-xl border flex flex-col items-center flex-shrink-0 transition-all ${
            selectedCupRound === r.round
              ? 'bg-pitch-gold/20 border-pitch-gold text-pitch-gold shadow-[0_0_12px_rgba(255,209,92,0.3)]'
              : 'bg-slate-900 border-white/5 text-slate-400 hover:text-slate-200'
          }">
            <b class="font-display font-black text-[10px] uppercase whitespace-nowrap">${r.name}</b>
            <span class="font-mono text-[8px] opacity-75">${r.teamsCount} Teams</span>
          </button>
        `).join('')}
      </div>

      <!-- Detail Box zur gewählten Runde -->
      <div class="glass-panel rounded-2xl p-3.5 border border-white/10 flex flex-col gap-2.5 shadow-xl">
        <div class="flex items-center justify-between pb-2 border-b border-white/5">
          <div>
            <div class="flex items-center gap-2">
              <h4 class="font-display font-black text-xs text-slate-100 uppercase tracking-wider">
                ${currentRoundData.name} (${currentRoundData.teamsCount} Klubs)
              </h4>
              <span class="px-2 py-0.5 rounded font-mono text-[8px] font-bold border ${currentRoundData.statusColor}">
                ${currentRoundData.status}
              </span>
            </div>
            <span class="font-mono text-[10px] text-slate-400 mt-0.5 block">${currentRoundData.date} • Single Elimination</span>
          </div>
          <div class="text-right">
            <span class="font-mono text-[8px] text-slate-400 block">RUNDEN-PRÄMIE</span>
            <span class="font-display font-black text-xs text-pitch-emerald">${currentRoundData.prize}</span>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          ${sampleMatchups.map(m => `
            <div class="p-2.5 rounded-xl border ${
              m.isPlayerMatch
                ? 'bg-emerald-950/20 border-pitch-emerald/50 shadow-[0_0_12px_rgba(0,245,155,0.2)]'
                : 'bg-slate-900/60 border-white/5'
            } flex items-center justify-between text-xs">
              <div class="flex items-center gap-2 flex-1 truncate">
                ${renderClubCrest(m.home, 20)}
                <span class="font-display font-bold text-[11px] truncate ${m.home.id === playerClub.id ? 'text-pitch-emerald' : 'text-slate-200'}">
                  ${m.home.name}
                </span>
              </div>

              <span class="font-mono font-bold text-[10px] text-slate-500 px-2">VS</span>

              <div class="flex items-center justify-end gap-2 flex-1 truncate">
                <span class="font-display font-bold text-[11px] truncate ${m.away.id === playerClub.id ? 'text-pitch-emerald' : 'text-slate-200'}">
                  ${m.away.name}
                </span>
                ${renderClubCrest(m.away, 20)}
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

      <!-- Real Top Scorers (Torschützenliste) -->
      <div class="glass-panel rounded-2xl p-3.5 border border-white/10 flex flex-col gap-2 shadow-xl">
        <h4 class="font-display font-black text-xs text-slate-100 uppercase tracking-wider px-1">
          Top-Torschützen des Vereins
        </h4>

        ${(() => {
          const scorers = (playerClub.squad || [])
            .filter(p => (p.stats?.goals || 0) > 0)
            .sort((a, b) => (b.stats?.goals || 0) - (a.stats?.goals || 0));

          if (!scorers.length) {
            return `
              <div class="p-3 text-center text-xs font-sans text-slate-400">
                Noch kein Spieler hat ein Tor erzielt.
              </div>
            `;
          }

          return `
            <div class="flex flex-col gap-1.5">
              ${scorers.map((p, idx) => `
                <div class="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-white/5">
                  <div class="flex items-center gap-2">
                    <span class="w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-mono font-bold text-[10px] flex items-center justify-center">
                      ${idx + 1}
                    </span>
                    <div>
                      <b class="font-display text-xs text-slate-100 block leading-tight">${p.name}</b>
                      <span class="font-mono text-[9px] text-slate-400 uppercase">${p.position} • ${p.ovr} OVR</span>
                    </div>
                  </div>
                  <div class="text-right">
                    <span class="font-display font-black text-sm text-pitch-emerald">${p.stats.goals} ⚽</span>
                    <span class="font-mono text-[9px] text-slate-400 block">${p.stats.assists || 0} Vorlagen</span>
                  </div>
                </div>
              `).join('')}
            </div>
          `;
        })()}
      </div>
    </div>
  `;
}