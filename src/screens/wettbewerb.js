// =============================================================================
// Starting XI TCG — Screen 3: Wettbewerbe (Liga, Apex Cup, Spielplan, Statistiken)
// =============================================================================

import { renderClubCrest } from '../components/crest.js';
import { computeLeagueTable } from '../engine/schedule.js';

export function renderWettbewerbScreen(state) {
  const activeSubTab = state.wettbewerbTab || 'liga';
  const selectedTier = state.selectedLeagueTier || 6;
  const league = state.leagues.find(l => l.tier === selectedTier) || state.leagues[5];
  const sortedClubs = computeLeagueTable(league.clubs);
  const playerClub = state.leagues.find(l => l.tier === 6)?.clubs.find(c => c.id === state.playerClubId);
  const viewMatchday = state.viewMatchday || state.currentMatchday || 1;

  return `
    <div class="flex-1 flex flex-col p-3 gap-3.5 pb-24 overflow-y-auto no-scrollbar">
      
      <!-- 4 Top Sub-Tabs Navigation -->
      <div class="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-slate-900 border border-white/10 shadow-lg">
        <button data-wettbewerb-tab="liga" class="py-2 rounded-xl font-display font-extrabold text-[11px] uppercase tracking-wider transition-all ${
          activeSubTab === 'liga'
            ? 'bg-pitch-emerald text-pitch-dark shadow-[0_0_12px_#00f59b]'
            : 'text-slate-400 hover:text-slate-200'
        }">
          Liga
        </button>

        <button data-wettbewerb-tab="pokal" class="py-2 rounded-xl font-display font-extrabold text-[11px] uppercase tracking-wider transition-all ${
          activeSubTab === 'pokal'
            ? 'bg-pitch-emerald text-pitch-dark shadow-[0_0_12px_#00f59b]'
            : 'text-slate-400 hover:text-slate-200'
        }">
          🥊 Pokal
        </button>

        <button data-wettbewerb-tab="spielplan" class="py-2 rounded-xl font-display font-extrabold text-[11px] uppercase tracking-wider transition-all ${
          activeSubTab === 'spielplan'
            ? 'bg-pitch-emerald text-pitch-dark shadow-[0_0_12px_#00f59b]'
            : 'text-slate-400 hover:text-slate-200'
        }">
          📅 Plan
        </button>

        <button data-wettbewerb-tab="stats" class="py-2 rounded-xl font-display font-extrabold text-[11px] uppercase tracking-wider transition-all ${
          activeSubTab === 'stats'
            ? 'bg-pitch-emerald text-pitch-dark shadow-[0_0_12px_#00f59b]'
            : 'text-slate-400 hover:text-slate-200'
        }">
          📊 Stats
        </button>
      </div>

      <!-- SUB-TAB CONTENT -->
      ${renderSubTabContent({ activeSubTab, league, sortedClubs, playerClub, selectedTier, state, viewMatchday })}

    </div>
  `;
}

function renderSubTabContent(props) {
  const { activeSubTab, league, sortedClubs, playerClub, selectedTier, state, viewMatchday } = props;

  switch (activeSubTab) {
    case 'pokal':
      return renderPokalView(playerClub);

    case 'spielplan':
      return renderSpielplanView(state, viewMatchday, playerClub);

    case 'stats':
      return renderStatsView(playerClub, league);

    case 'liga':
    default:
      return renderLigaTableView(league, sortedClubs, selectedTier, state);
  }
}

// =============================================================================
// 1. LIGA TABELLE VIEW
// =============================================================================
function renderLigaTableView(league, sortedClubs, selectedTier, state) {
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
        <!-- Table Column Headers -->
        <div class="grid grid-cols-12 text-[10px] font-mono text-slate-400 pb-2 border-b border-white/10 px-1">
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
// 2. APEX CUP (NATIONALER K.O.-POKAL ÜBER ALLE 6 LIGEN)
// =============================================================================
function renderPokalView(playerClub) {
  const cupRounds = [
    { name: 'Runde 1', teams: '60 Teams', prize: '500 🪙', status: 'Aktiv' },
    { name: '1/16-Finale', teams: '32 Teams', prize: '1.000 🪙', status: 'Ausstehend' },
    { name: 'Achtelfinale', teams: '16 Teams', prize: '2.000 🪙', status: 'Ausstehend' },
    { name: 'Viertelfinale', teams: '8 Teams', prize: '4.000 🪙', status: 'Ausstehend' },
    { name: 'Halbfinale', teams: '4 Teams', prize: '8.000 🪙', status: 'Ausstehend' },
    { name: 'Großes Finale', teams: '2 Teams', prize: '15.000 🪙 + Pokal', status: 'Ausstehend' }
  ];

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
          Alle 60 Vereine aus allen 6 Ligen kämpfen im K.o.-Modus um den nationalen Pokal und massive Siegprämien!
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

      <!-- Cup Tournament Ladder / Rounds -->
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
// 3. SPIELPLAN VIEW (INTERAKTIVER SLIDER)
// =============================================================================
function renderSpielplanView(state, viewDay, playerClub) {
  const scheduleDay = state.schedule.find(s => s.matchday === viewDay);
  const matches = scheduleDay?.matches || [];
  const maxDay = state.maxMatchdays || 18;

  return `
    <div class="flex flex-col gap-3">
      
      <!-- Matchday Interactive Navigator -->
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
              
              <!-- Home Club -->
              <div class="flex-1 flex items-center gap-2 truncate">
                ${renderClubCrest(home, 24)}
                <span class="font-display font-bold text-xs truncate ${home?.id === playerClub.id ? 'text-pitch-emerald' : 'text-slate-100'}">
                  ${home?.name || 'Heim'}
                </span>
              </div>

              <!-- Match Score / VS Badge -->
              <div class="px-3 py-1 rounded-xl font-mono font-black text-xs ${
                isPlayed
                  ? 'bg-slate-900 border border-slate-700 text-slate-100'
                  : (isCurrent ? 'bg-pitch-emerald/20 text-pitch-emerald border border-pitch-emerald/40' : 'bg-slate-900/60 text-slate-500')
              }">
                ${isPlayed ? `${m.homeScore ?? 1} : ${m.awayScore ?? 0}` : (isCurrent ? 'VS' : '15:30')}
              </div>

              <!-- Away Club -->
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
// 4. STATISTIKEN VIEW (TORJÄGER & CLUB KPIS)
// =============================================================================
function renderStatsView(playerClub, league) {
  // Generate leaderboard from league players
  const allPlayers = [];
  league.clubs.forEach(c => {
    c.squad.forEach(p => {
      allPlayers.push({ ...p, clubName: c.name, crestClub: c });
    });
  });

  // Top scorers (mock realistic ranking sorted by OVR / random variance)
  const topScorers = allPlayers
    .filter(p => ['ST', 'LF', 'RF', 'ZOM'].includes(p.position))
    .sort((a, b) => b.sho - a.sho)
    .slice(0, 5)
    .map((p, idx) => ({
      ...p,
      goals: Math.max(1, Math.round((p.sho - 50) / 4) + (idx === 0 ? 3 : 0))
    }));

  return `
    <div class="flex flex-col gap-3">
      
      <!-- Top Scorer Leaderboard -->
      <div class="glass-card rounded-2xl p-3.5 border border-white/10 shadow-xl flex flex-col gap-2">
        <div class="flex items-center justify-between pb-2 border-b border-white/10">
          <div class="flex items-center gap-2">
            <span class="text-base">⚽</span>
            <h3 class="font-display font-black text-xs text-slate-100 uppercase tracking-wider">
              Torjäger-Kanone (Liga 6)
            </h3>
          </div>
          <span class="font-mono text-[9px] text-pitch-gold font-bold">TOP KNIPSER</span>
        </div>

        <div class="flex flex-col gap-1.5 my-1">
          ${topScorers.map((scorer, idx) => `
            <div class="flex items-center justify-between p-2 rounded-xl ${
              idx === 0 ? 'bg-yellow-500/10 border border-pitch-gold/40' : 'bg-slate-900/40'
            }">
              <div class="flex items-center gap-2.5">
                <span class="font-mono font-black text-xs ${idx === 0 ? 'text-pitch-gold' : 'text-slate-400'}">
                  #${idx + 1}
                </span>
                <div>
                  <b class="font-display text-xs text-slate-100 block leading-tight">${scorer.name}</b>
                  <span class="font-mono text-[9px] text-slate-400">${scorer.clubName} (${scorer.position}, ${scorer.ovr} OVR)</span>
                </div>
              </div>
              <div class="text-right">
                <span class="font-display font-black text-sm text-pitch-emerald">${scorer.goals}</span>
                <span class="font-mono text-[8px] text-slate-400 block uppercase">Tore</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Club Performance KPIs -->
      <div class="glass-panel rounded-2xl p-3.5 border border-white/10 flex flex-col gap-2.5 shadow-xl">
        <h4 class="font-display font-black text-xs text-slate-100 uppercase tracking-wider px-1">
          Vereins-Performance (${playerClub.name})
        </h4>

        <div class="grid grid-cols-2 gap-2 text-xs font-mono">
          <div class="glass-card rounded-xl p-2.5 border border-white/10">
            <span class="text-slate-400 text-[10px] block">DUELL-ERFOLGSQUOTE</span>
            <span class="font-display font-black text-base text-pitch-emerald">64.5%</span>
          </div>

          <div class="glass-card rounded-xl p-2.5 border border-white/10">
            <span class="text-slate-400 text-[10px] block">TORE PRO SPIEL</span>
            <span class="font-display font-black text-base text-slate-100">
              ${playerClub.stats.played ? (playerClub.stats.gf / playerClub.stats.played).toFixed(1) : '2.1'}
            </span>
          </div>

          <div class="glass-card rounded-xl p-2.5 border border-white/10">
            <span class="text-slate-400 text-[10px] block">HEIMBILANZ</span>
            <span class="font-display font-black text-xs text-slate-200">
              ${playerClub.stats.won} S - ${playerClub.stats.drawn} U - ${playerClub.stats.lost} N
            </span>
          </div>

          <div class="glass-card rounded-xl p-2.5 border border-white/10">
            <span class="text-slate-400 text-[10px] block">FORM (LETZTE 5)</span>
            <div class="flex gap-1 mt-1 text-[10px] font-black">
              <span class="px-1 py-0.5 rounded bg-pitch-emerald text-pitch-dark">S</span>
              <span class="px-1 py-0.5 rounded bg-pitch-emerald text-pitch-dark">S</span>
              <span class="px-1 py-0.5 rounded bg-amber-400 text-slate-900">U</span>
              <span class="px-1 py-0.5 rounded bg-rose-500 text-white">N</span>
              <span class="px-1 py-0.5 rounded bg-pitch-emerald text-pitch-dark">S</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  `;
}
