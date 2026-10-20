// =============================================================================
// Starting XI TCG — Modal: Match-Arena & 3-Phasen Duell-Clash
// =============================================================================

import { renderClubCrest } from '../components/crest.js';
import { renderFUTCard } from '../components/card.js';
import { resolveDuelClash, simulateInstantMatch, TACTIC_CARDS } from '../engine/duel.js';

export function renderMatchArenaModal(matchState, equippedTactics) {
  const currentDuel = matchState.duels[matchState.currentDuelIndex] || matchState.duels[matchState.duels.length - 1];
  const isFinished = matchState.completed || matchState.currentDuelIndex >= matchState.duels.length;

  const activeTactic = TACTIC_CARDS.find(c => c.id === matchState.activeTacticId);

  return `
    <div class="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col p-3 max-w-md mx-auto justify-between animate-fadeIn overflow-y-auto no-scrollbar">
      
      <!-- Top Arena Scoreboard -->
      <div class="glass-panel rounded-2xl p-3 border border-pitch-emerald/40 shadow-2xl flex flex-col gap-2">
        <div class="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span class="font-bold ${matchState.isCupMatch ? 'text-pitch-gold' : 'text-pitch-emerald'} flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full ${isFinished ? 'bg-slate-500' : 'bg-pitch-danger animate-pulse'}"></span>
            ${isFinished ? 'SCHLUSSPFIFF' : `LIVE • ${currentDuel?.minute || matchState.currentMinute}' MINUTE`}
          </span>
          <span class="font-mono ${matchState.isCupMatch ? 'text-pitch-gold bg-yellow-500/10 border border-pitch-gold/40 px-2 py-0.5 rounded' : 'text-slate-400'} font-bold">
            ${matchState.isCupMatch ? `🏆 APEX CUP • RUNDE ${matchState.cupRound}` : 'LIGA 6 PFLICHTSPIEL'}
          </span>
        </div>

        <div class="flex items-center justify-between px-2 py-1">
          <!-- Home Club -->
          <div class="flex items-center gap-2 flex-1 truncate">
            ${renderClubCrest(matchState.homeClub, 32)}
            <span class="font-display font-extrabold text-xs text-slate-100 truncate">${matchState.homeClub.name}</span>
          </div>

          <!-- Score -->
          <div class="px-3.5 py-1 rounded-xl bg-slate-900 border border-slate-700 font-mono font-black text-2xl text-slate-100 flex items-center gap-2 shadow-inner">
            <span class="${matchState.homeScore > matchState.awayScore ? 'text-pitch-emerald' : ''}">${matchState.homeScore}</span>
            <span class="text-slate-600">:</span>
            <span class="${matchState.awayScore > matchState.homeScore ? 'text-pitch-emerald' : ''}">${matchState.awayScore}</span>
          </div>

          <!-- Away Club -->
          <div class="flex items-center justify-end gap-2 flex-1 truncate">
            <span class="font-display font-extrabold text-xs text-slate-100 truncate text-right">${matchState.awayClub.name}</span>
            ${renderClubCrest(matchState.awayClub, 32)}
          </div>
        </div>
      </div>

      <!-- Center: 3-Phasen Duell Clash -->
      ${!isFinished && currentDuel ? `
        <div class="flex-1 flex flex-col justify-center my-2 gap-2.5">
          
          <div class="text-center">
            <span class="font-mono text-xs text-pitch-gold font-black px-3.5 py-1 rounded-full bg-yellow-500/10 border border-pitch-gold/40 shadow-[0_0_15px_rgba(255,209,92,0.3)]">
              ⚔️ SCHLÜSSEL-DUELL: MINUTE ${currentDuel.minute}'
            </span>
          </div>

          <!-- 2 Large Cards Clash Display -->
          <div class="flex items-center justify-center gap-2 my-1">
            <!-- Attacker Card (Large Medium ~124x184px with Full Name) -->
            <div class="flex flex-col items-center">
              <span class="font-mono text-[9px] text-pitch-emerald font-black uppercase tracking-wider mb-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-pitch-emerald/40 shadow">
                ⚡ ANGRIFF (${currentDuel.attacker.position})
              </span>
              <div class="filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.7)]">
                ${renderFUTCard(currentDuel.attacker, { medium: true, duel: true, draggable: false })}
              </div>
            </div>

            <!-- VS Badge with Animated Glow -->
            <div class="flex flex-col items-center px-1">
              <span class="font-display font-black text-2xl italic bg-gradient-to-b from-amber-300 to-orange-500 bg-clip-text text-transparent animate-pulse drop-shadow">VS</span>
            </div>

            <!-- Defender Card (Large Medium ~124x184px with Full Name) -->
            <div class="flex flex-col items-center">
              <span class="font-mono text-[9px] text-pitch-danger font-black uppercase tracking-wider mb-1 px-2 py-0.5 rounded-full bg-rose-950/80 border border-pitch-danger/40 shadow">
                🛡️ ABWEHR (${currentDuel.defender.position})
              </span>
              <div class="filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.7)]">
                ${renderFUTCard(currentDuel.defender, { medium: true, duel: true, draggable: false })}
              </div>
            </div>
          </div>

          <!-- Live Duel Telemetry Bar -->
          <div class="glass-panel rounded-2xl p-3 border border-white/10 flex flex-col gap-1.5 text-[11px] font-mono shadow-lg">
            <div class="flex justify-between items-center text-slate-400">
              <span>Phase 1: Tempo / Physis</span>
              <span class="font-bold ${activeTactic?.boostAttribute === 'pac' || activeTactic?.boostAttribute === 'phy' ? 'text-pitch-emerald' : 'text-slate-200'}">
                ${currentDuel.attacker.pac} PAC vs ${currentDuel.defender.phy} PHY
                ${activeTactic?.boostAttribute === 'pac' ? `(+${activeTactic.boostValue} 🎴)` : ''}
              </span>
            </div>
            <div class="flex justify-between items-center text-slate-400">
              <span>Phase 2: Dribbling / Defense</span>
              <span class="font-bold ${activeTactic?.boostAttribute === 'def' || activeTactic?.boostAttribute === 'dri' ? 'text-pitch-emerald' : 'text-slate-200'}">
                ${currentDuel.attacker.dri} DRI vs ${currentDuel.defender.def} DEF
                ${activeTactic?.boostAttribute === 'def' || activeTactic?.boostAttribute === 'dri' ? `(+${activeTactic.boostValue} 🎴)` : ''}
              </span>
            </div>
            <div class="flex justify-between items-center text-slate-400">
              <span>Phase 3: Abschluss / Parade</span>
              <span class="font-bold ${activeTactic?.boostAttribute === 'sho' ? 'text-pitch-emerald' : 'text-slate-200'}">
                ${currentDuel.attacker.sho} SHO vs ${currentDuel.goalkeeper?.def || 65} TW
                ${activeTactic?.boostAttribute === 'sho' ? `(+${activeTactic.boostValue} 🎴)` : ''}
              </span>
            </div>

            ${activeTactic ? `
              <div class="mt-1 pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] text-pitch-emerald font-black bg-emerald-950/40 px-2 py-1 rounded-lg">
                <span class="flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-pitch-emerald animate-ping"></span>
                  AKTIVE TAKTIK: ${activeTactic.name}
                </span>
                <span>+${activeTactic.boostValue} ${activeTactic.boostAttribute.toUpperCase()} ✓</span>
              </div>
            ` : ''}
          </div>

          <!-- In-Game 3 Tactic Cards Hand (Interactive Fan Deck) -->
          <div class="flex flex-col gap-1 mt-1">
            <div class="flex items-center justify-between px-1">
              <span class="font-mono text-[9px] text-slate-400 uppercase tracking-wider">
                🎴 Taktik-Hand (Antippen zum Aufspielen)
              </span>
              <span class="font-mono text-[8px] text-pitch-gold">1x pro Spiel zündbar</span>
            </div>

            <div class="flex justify-center items-end gap-1.5 pt-2 pb-1">
              ${equippedTactics.map((cardId, idx) => {
                const card = TACTIC_CARDS.find(c => c.id === cardId);
                const isUsed = matchState.usedTactics?.includes(cardId);
                const isActive = matchState.activeTacticId === cardId;

                const rotationClass = idx === 0 ? '-rotate-3' : (idx === 2 ? 'rotate-3' : 'rotate-0');
                const elevationClass = isActive
                  ? '-translate-y-3 scale-105 ring-2 ring-pitch-emerald bg-emerald-950/90 shadow-[0_0_20px_#00f59b] z-20 rotate-0'
                  : (isUsed ? 'opacity-35 grayscale scale-95 cursor-not-allowed' : 'hover:-translate-y-1 hover:scale-102 cursor-pointer shadow-md');

                return `
                  <button data-activate-tactic="${card.id}" ${isUsed ? 'disabled' : ''} class="w-28 h-36 rounded-2xl p-2.5 border border-white/15 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 flex flex-col items-center justify-between text-center transition-all duration-300 relative select-none ${rotationClass} ${elevationClass}">
                    <div class="w-full flex items-center justify-between text-[8px] font-mono">
                      <span class="text-pitch-gold font-bold">TAKTIK</span>
                      <span class="text-slate-400">#0${idx + 1}</span>
                    </div>

                    <div class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shadow-inner my-1">
                      ${card.icon}
                    </div>

                    <div class="w-full">
                      <b class="font-display font-black text-[10px] uppercase text-slate-100 block leading-tight truncate">${card.name}</b>
                      <span class="font-mono text-[9px] text-pitch-emerald font-bold block mt-0.5">+${card.boostValue} ${card.boostAttribute.toUpperCase()}</span>
                    </div>

                    <div class="w-full mt-1">
                      ${isUsed ? '<span class="font-mono text-[7px] text-slate-500 uppercase block font-bold">VERBRAUCHT</span>' : ''}
                      ${isActive ? '<span class="font-mono text-[8px] text-pitch-emerald font-black uppercase block tracking-wider animate-pulse">BEREIT ➔</span>' : ''}
                      ${!isUsed && !isActive ? '<span class="font-mono text-[7px] text-slate-400 uppercase block">ANTIPPEN</span>' : ''}
                    </div>
                  </button>
                `;
              }).join('')}
            </div>
          </div>

        </div>
      ` : `
        <!-- Match Finished Recap View -->
        <div class="flex-1 flex flex-col justify-center items-center my-6 gap-3">
          <span class="text-5xl my-2">🏁</span>
          <h2 class="font-display font-black text-2xl text-slate-100 uppercase tracking-tight">
            Spiel beendet!
          </h2>
          <div class="px-5 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 font-mono font-black text-3xl text-pitch-emerald shadow-2xl">
            ${matchState.homeScore} : ${matchState.awayScore}
          </div>
          <p class="font-sans text-xs text-slate-300 text-center max-w-xs mt-1">
            ${
              matchState.homeScore > matchState.awayScore
                ? 'Glanzvoller Sieg! Deine Taktik und dein Kader haben sich durchgesetzt.'
                : (matchState.homeScore === matchState.awayScore ? 'Gerechtes Unentschieden nach hart umkämpften Duellen.' : 'Niederlage. Regeneriere deine Spieler und plane die Revanche!')
            }
          </p>

          <!-- Match Events Timeline -->
          <div class="w-full glass-card rounded-2xl p-3 border border-white/10 max-h-36 overflow-y-auto no-scrollbar flex flex-col gap-1.5 my-2">
            ${matchState.events.map(ev => `
              <div class="flex items-center gap-2 text-xs font-mono text-slate-200">
                <span class="text-pitch-gold font-bold">${ev.minute}'</span>
                <span class="text-[11px]">${ev.text}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `}

      <!-- Bottom Arena Action Controls -->
      <div class="flex flex-col gap-2">
        ${!isFinished ? `
          <div class="grid grid-cols-3 gap-2">
            <button id="btn-resolve-next-duel" class="col-span-2 py-3 rounded-xl bg-pitch-emerald hover:bg-emerald-400 text-pitch-dark font-display font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,245,155,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2">
              <span>⚔️</span>
              <span>Duell ausspielen</span>
            </button>
            <button id="btn-blitz-simulation" class="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-pitch-gold font-display font-bold text-xs uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-1">
              <span>⚡</span>
              <span>Blitz</span>
            </button>
          </div>
        ` : `
          <button id="btn-finish-matchday" class="w-full py-3.5 rounded-xl bg-pitch-emerald hover:bg-emerald-400 text-pitch-dark font-display font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(0,245,155,0.5)] active:scale-98 transition-all">
            ${matchState.isCupMatch ? 'Pokalduell abschließen & Prämie verbuchen ➔' : 'Spieltag abschließen & Finanzen buchen ➔'}
          </button>
        `}
      </div>

    </div>
  `;
}