// =============================================================================
// Starting XI TCG — Modal: Match-Arena & 3-Phasen Duell-Clash
// =============================================================================

import { renderClubCrest } from '../components/crest.js';
import { renderFUTCard } from '../components/card.js';
import { resolveDuelClash, simulateInstantMatch, TACTIC_CARDS } from '../engine/duel.js';

export function renderMatchArenaModal(matchState, equippedTactics) {
  const currentDuel = matchState.duels[matchState.currentDuelIndex] || matchState.duels[matchState.duels.length - 1];
  const isFinished = matchState.completed || matchState.currentDuelIndex >= matchState.duels.length;

  return `
    <div class="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col p-4 max-w-md mx-auto justify-between animate-fadeIn">
      
      <!-- Top Arena Scoreboard -->
      <div class="glass-panel rounded-2xl p-3 border border-pitch-emerald/40 shadow-2xl flex flex-col gap-2">
        <div class="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span class="font-bold text-pitch-emerald flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full ${isFinished ? 'bg-slate-500' : 'bg-pitch-danger animate-pulse'}"></span>
            ${isFinished ? 'VOLLZEIT (90\')' : `LIVE • ${currentDuel?.minute || matchState.currentMinute}' MINUTE`}
          </span>
          <span class="font-mono text-pitch-gold">LIGA 6 PFLICHTSPIEL</span>
        </div>

        <div class="flex items-center justify-between px-3 py-1">
          <!-- Home Club -->
          <div class="flex items-center gap-2 flex-1">
            ${renderClubCrest(matchState.homeClub, 32)}
            <span class="font-display font-bold text-xs text-slate-100 truncate">${matchState.homeClub.name}</span>
          </div>

          <!-- Score -->
          <div class="px-4 py-1.5 rounded-xl bg-slate-900 border border-slate-700 font-mono font-black text-2xl text-slate-100 flex items-center gap-2 shadow-inner">
            <span class="${matchState.homeScore > matchState.awayScore ? 'text-pitch-emerald' : ''}">${matchState.homeScore}</span>
            <span class="text-slate-600">:</span>
            <span class="${matchState.awayScore > matchState.homeScore ? 'text-pitch-emerald' : ''}">${matchState.awayScore}</span>
          </div>

          <!-- Away Club -->
          <div class="flex items-center justify-end gap-2 flex-1">
            <span class="font-display font-bold text-xs text-slate-100 truncate text-right">${matchState.awayClub.name}</span>
            ${renderClubCrest(matchState.awayClub, 32)}
          </div>
        </div>
      </div>

      <!-- Center: 3-Phasen Duell Clash -->
      ${!isFinished && currentDuel ? `
        <div class="flex-1 flex flex-col justify-center my-3 gap-3">
          
          <div class="text-center">
            <span class="font-mono text-xs text-pitch-gold font-bold px-3 py-1 rounded-full bg-yellow-500/10 border border-pitch-gold/30">
              ⚔️ SCHLÜSSEL-DUELL: MINUTE ${currentDuel.minute}'
            </span>
          </div>

          <!-- 2 Cards Clash Display -->
          <div class="flex items-center justify-around gap-2">
            <!-- Attacker Card -->
            <div class="flex flex-col items-center">
              <span class="font-mono text-[10px] text-pitch-emerald font-bold mb-1">ANGRIFF</span>
              ${renderFUTCard(currentDuel.attacker, { compact: true })}
            </div>

            <!-- VS Badge -->
            <div class="flex flex-col items-center">
              <span class="font-display font-black text-2xl italic text-slate-600">VS</span>
            </div>

            <!-- Defender Card -->
            <div class="flex flex-col items-center">
              <span class="font-mono text-[10px] text-pitch-danger font-bold mb-1">ABWEHR</span>
              ${renderFUTCard(currentDuel.defender, { compact: true })}
            </div>
          </div>

          <!-- 3-Phase Duel Telemetry Bar -->
          <div class="glass-panel rounded-xl p-3 flex flex-col gap-1.5 text-[11px] font-mono">
            <div class="flex justify-between items-center text-slate-400">
              <span>Phase 1: Tempo / Physis</span>
              <span class="text-slate-200">${currentDuel.attacker.pac} PAC vs ${currentDuel.defender.phy} PHY</span>
            </div>
            <div class="flex justify-between items-center text-slate-400">
              <span>Phase 2: Dribbling / Defense</span>
              <span class="text-slate-200">${currentDuel.attacker.dri} DRI vs ${currentDuel.defender.def} DEF</span>
            </div>
            <div class="flex justify-between items-center text-slate-400">
              <span>Phase 3: Abschluss / Torwart</span>
              <span class="text-slate-200">${currentDuel.attacker.sho} SHO vs ${currentDuel.goalkeeper?.def || 70} TW</span>
            </div>
          </div>

          <!-- In-Game 3 Tactic Cards Hand -->
          <div class="flex flex-col gap-1.5">
            <span class="font-mono text-[10px] text-slate-400 uppercase tracking-wider text-center">
              🎴 Deine Taktik-Hand (1x pro Spiel zündbar)
            </span>
            <div class="grid grid-cols-3 gap-2">
              ${equippedTactics.map(cardId => {
                const card = TACTIC_CARDS.find(c => c.id === cardId) || TACTIC_CARDS[0];
                return `
                  <button data-use-tactic="${card.id}" class="glass-panel rounded-xl p-2 flex flex-col items-center text-center border border-pitch-emerald/30 hover:border-pitch-emerald active:scale-95 transition-all">
                    <span class="text-base">${card.icon}</span>
                    <span class="font-display font-bold text-[10px] text-slate-200 truncate max-w-full">${card.name}</span>
                    <span class="font-mono text-[8px] text-pitch-emerald font-bold">+${card.boostValue} ${card.boostAttribute.toUpperCase()}</span>
                  </button>
                `;
              }).join('')}
            </div>
          </div>

        </div>
      ` : `
        <!-- Match Finished Recap View -->
        <div class="flex-1 flex flex-col justify-center items-center gap-4 text-center my-6">
          <div class="w-16 h-16 rounded-full bg-pitch-emerald/20 border-2 border-pitch-emerald flex items-center justify-center text-3xl">
            🏆
          </div>
          <div>
            <h3 class="font-display font-black text-xl text-slate-100">Abpfiff! Spiel beendet.</h3>
            <p class="font-mono text-sm text-pitch-emerald mt-1">
              Endstand: ${matchState.homeClub.name} ${matchState.homeScore} : ${matchState.awayScore} ${matchState.awayClub.name}
            </p>
          </div>

          <!-- Match Events Ticker Log -->
          <div class="w-full glass-panel rounded-xl p-3 flex flex-col gap-1.5 text-xs font-mono text-left max-h-40 overflow-y-auto">
            ${matchState.events.length ? matchState.events.map(e => `
              <div class="py-1 border-b border-slate-800 text-slate-300">
                <span class="text-pitch-gold font-bold">${e.minute}'</span> ${e.text}
              </div>
            `).join('') : '<span class="text-slate-500">Keine Tore im Spiel.</span>'}
          </div>
        </div>
      `}

      <!-- Bottom Actions -->
      <div class="flex gap-2.5">
        ${!isFinished ? `
          <button id="btn-resolve-next-duel" class="flex-1 py-3 rounded-xl bg-pitch-emerald hover:bg-emerald-400 text-pitch-dark font-display font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(0,245,155,0.4)] active:scale-98 transition-all">
            ⚔️ Duell ausspielen
          </button>
          <button id="btn-blitz-simulation" class="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-pitch-gold font-mono font-bold text-xs uppercase active:scale-98 transition-all flex items-center gap-1">
            <span>⚡ Blitz</span>
          </button>
        ` : `
          <button id="btn-finish-matchday" class="w-full py-3.5 rounded-xl bg-pitch-emerald hover:bg-emerald-400 text-pitch-dark font-display font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,245,155,0.4)] active:scale-98 transition-all">
            Ergebnis einpflegen & Weiter
          </button>
        `}
      </div>

    </div>
  `;
}
