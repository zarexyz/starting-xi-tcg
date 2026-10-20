// =============================================================================
// Starting XI TCG — Modal: Full Player Profile & Dossier (Matching Design Spec)
// Two Tabs: [Info] with 8 Attribute Progress Bars & [Statistik] with Season Stats
// =============================================================================

import { renderFUTCard } from '../components/card.js';
import { calculatePlayerSalary } from '../engine/economy.js';
import { getNationFlagSVG } from '../components/flags.js';

export function renderPlayerInspectModal(player, club, activeTab = 'info') {
  if (!player) return '';

  const salary = calculatePlayerSalary(player.ovr);
  const isStarter = player.isStarter;
  const slotName = player.currentSlot || player.position;

  // 8 Hauptattribute (6 Kern + 2 Spezial)
  const attVal = player.att || Math.round((player.sho * 0.6 + player.dri * 0.4));
  const resVal = player.res || Math.round((player.phy * 0.6 + player.def * 0.4));

  const attributes = [
    { label: 'Tempo & Antritt (PAC)', val: player.pac, max: 99, color: 'from-amber-500 to-yellow-400' },
    { label: 'Dribbling & Wendigkeit (DRI)', val: player.dri, max: 99, color: 'from-emerald-500 to-teal-400' },
    { label: 'Schießen & Abschluss (SHO)', val: player.sho, max: 99, color: 'from-orange-500 to-amber-400' },
    { label: 'Defensive & Zweikampf (DEF)', val: player.def, max: 99, color: 'from-sky-500 to-blue-400' },
    { label: 'Passen & Spielaufbau (PAS)', val: player.pas, max: 99, color: 'from-yellow-500 to-amber-300' },
    { label: 'Physische Präsenz (PHY)', val: player.phy, max: 99, color: 'from-emerald-400 to-green-500' },
    { label: 'Angriff & Offensivdrang (ATT)', val: attVal, max: 99, color: 'from-amber-400 to-orange-400' },
    { label: 'Resistenz & mentaler Fokus (RES)', val: resVal, max: 99, color: 'from-cyan-400 to-teal-400' }
  ];

  // Tier Label (z.B. STUFE C / SILBER / GOLD)
  const tierNameMap = {
    bronze: 'Stufe C (Bronze)',
    silver: 'Stufe B (Silber)',
    gold: 'Stufe A (Gold)',
    special: 'Elite Special'
  };
  const tierLabel = tierNameMap[player.tier] || 'Stufe C';

  // Position long title
  const posLongMap = {
    TW: 'Torwart',
    IV: 'Innenverteidiger',
    LV: 'Linker Verteidiger',
    RV: 'Rechter Verteidiger',
    LAV: 'Linker Außenverteidiger',
    RAV: 'Rechter Außenverteidiger',
    ZDM: 'Defensives Mittelfeld',
    ZM: 'Zentrales Mittelfeld',
    ZOM: 'Offensives Mittelfeld',
    LM: 'Linkes Mittelfeld',
    RM: 'Rechtes Mittelfeld',
    LF: 'Linker Flügel',
    RF: 'Rechter Flügel',
    ST: 'Mittelstürmer'
  };
  const positionLong = posLongMap[player.position] || player.position;

  return `
    <div class="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-start p-3 max-w-md mx-auto animate-fadeIn overflow-y-auto no-scrollbar select-none">
      
      <!-- Top Card Wrapper (Fills space cleanly) -->
      <div class="w-full glass-modal rounded-3xl p-4 border border-pitch-emerald/30 shadow-2xl flex flex-col gap-3 my-auto">
        
        <!-- Header -->
        <div class="flex items-start justify-between pb-2 border-b border-white/10">
          <div class="flex flex-col">
            <div class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-pitch-emerald"></span>
              <h2 class="font-display font-black text-lg text-slate-100 uppercase tracking-tight leading-none">
                ${player.name}
              </h2>
            </div>
            <span class="font-mono text-[10px] text-slate-400 uppercase mt-1">
              ${positionLong.toUpperCase()} (${player.position}) • ${tierLabel.toUpperCase()}
            </span>
          </div>

          <div class="flex items-center gap-2">
            <div class="text-right">
              <span class="font-mono text-[8px] text-slate-400 uppercase block font-bold">OVR</span>
              <span class="font-display font-black text-xl text-pitch-gold leading-none">${player.ovr}</span>
            </div>
            <button id="btn-close-inspect" class="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold text-xs ml-1">
              ✕
            </button>
          </div>
        </div>

        <!-- Subline Tab Switcher [INFO] vs [STATISTIK] -->
        <div class="grid grid-cols-2 gap-2">
          <button data-inspect-tab="info" class="py-2 rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'info' 
              ? 'bg-pitch-emerald/20 border-pitch-emerald text-pitch-emerald font-display font-black text-xs uppercase shadow-[0_0_12px_rgba(0,245,155,0.3)]' 
              : 'bg-slate-900 border-slate-800 text-slate-400 font-display font-bold text-xs uppercase hover:text-slate-200'
          }">
            <span>◉</span>
            <span>INFO</span>
          </button>
          <button data-inspect-tab="stats" class="py-2 rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'stats' 
              ? 'bg-pitch-emerald/20 border-pitch-emerald text-pitch-emerald font-display font-black text-xs uppercase shadow-[0_0_12px_rgba(0,245,155,0.3)]' 
              : 'bg-slate-900 border-slate-800 text-slate-400 font-display font-bold text-xs uppercase hover:text-slate-200'
          }">
            <span>📊</span>
            <span>STATISTIK</span>
          </button>
        </div>

        ${activeTab === 'info' ? `
          <!-- TAB 1: INFO VIEW -->
          <div class="flex flex-col gap-3">
            
            <!-- Centered Large Card Display -->
            <div class="flex justify-center items-center py-1">
              <div class="filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]">
                ${renderFUTCard(player, { large: true, compact: false, draggable: false })}
              </div>
            </div>

            <!-- HAUPTATTRIBUTE (8 WERTE) -->
            <div class="glass-panel rounded-2xl p-3 border border-white/5 flex flex-col gap-2">
              <div class="flex items-center justify-between pb-1 border-b border-white/5 text-[10px] font-mono">
                <span class="font-bold text-slate-300 uppercase tracking-wider">HAUPTATTRIBUTE (8 WERTE)</span>
                <span class="text-pitch-emerald font-bold">Basis-Werte</span>
              </div>

              <div class="flex flex-col gap-1.5">
                ${attributes.map(att => `
                  <div class="flex flex-col gap-0.5">
                    <div class="flex items-center justify-between text-[10px] font-sans">
                      <span class="text-slate-300">${att.label}</span>
                      <span class="font-mono font-bold text-slate-200">${att.val} / 99</span>
                    </div>
                    <div class="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                      <div class="h-full rounded-full bg-gradient-to-r ${att.color}" style="width: ${(att.val / 99) * 100}%;"></div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Status Grid (Kondition, Restvertrag, Gehalt, Status) -->
            <div class="grid grid-cols-2 gap-2 text-xs font-mono">
              <!-- Kondition -->
              <div class="glass-panel rounded-xl p-2.5 border border-white/5">
                <div class="flex justify-between items-center text-slate-400 text-[10px]">
                  <span>KONDITION</span>
                  <b class="${player.condition < 70 ? 'text-pitch-danger' : 'text-pitch-emerald'}">${player.condition}%</b>
                </div>
                <div class="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden mt-1.5">
                  <div class="h-full ${player.condition < 70 ? 'bg-pitch-danger' : 'bg-pitch-emerald'}" style="width: ${player.condition}%;"></div>
                </div>
              </div>

              <!-- Vertrag -->
              <div class="glass-panel rounded-xl p-2.5 border border-white/5">
                <div class="flex justify-between items-center text-slate-400 text-[10px]">
                  <span>RESTVERTRAG</span>
                  <b class="${player.contractMatches <= 2 ? 'text-pitch-danger animate-pulse' : 'text-pitch-gold'}">${player.contractMatches} Spiele</b>
                </div>
                <div class="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden mt-1.5">
                  <div class="h-full bg-pitch-gold" style="width: ${Math.min(100, (player.contractMatches / 18) * 100)}%;"></div>
                </div>
              </div>

              <!-- Gehalt -->
              <div class="glass-panel rounded-xl p-2.5 border border-white/5">
                <span class="text-[10px] text-slate-400 block">SPIELTAGS-GEHALT</span>
                <span class="font-display font-black text-xs text-slate-200 mt-0.5 block">
                  ${salary} <span class="text-pitch-gold">🪙</span> / Spiel
                </span>
              </div>

              <!-- Kaderstatus -->
              <div class="glass-panel rounded-xl p-2.5 border border-white/5">
                <span class="text-[10px] text-slate-400 block">KADERSTATUS</span>
                <span class="font-display font-black text-xs ${isStarter ? 'text-pitch-emerald' : 'text-slate-400'} mt-0.5 block truncate">
                  ${isStarter ? `⚽ STARTELF (${slotName})` : '🪑 ERSATZBANK'}
                </span>
              </div>
            </div>

          </div>
        ` : `
          <!-- TAB 2: SAISON-STATISTIKEN -->
          <div class="flex flex-col gap-3 py-2">
            
            <div class="glass-panel rounded-2xl p-4 border border-white/5 flex flex-col gap-3">
              <span class="font-mono text-[10px] text-pitch-gold font-bold uppercase tracking-wider">
                AKTUELLE SAISON • LIGA 6
              </span>

              <div class="grid grid-cols-3 gap-2 text-center">
                <div class="p-2.5 rounded-xl bg-slate-900/80 border border-white/5">
                  <span class="font-display font-black text-lg text-slate-100 block">${player.stats?.played || (isStarter ? 1 : 0)}</span>
                  <span class="font-mono text-[9px] text-slate-400 uppercase">Einsätze</span>
                </div>
                <div class="p-2.5 rounded-xl bg-slate-900/80 border border-white/5">
                  <span class="font-display font-black text-lg text-pitch-emerald block">${player.stats?.goals || 0}</span>
                  <span class="font-mono text-[9px] text-slate-400 uppercase">Tore</span>
                </div>
                <div class="p-2.5 rounded-xl bg-slate-900/80 border border-white/5">
                  <span class="font-display font-black text-lg text-pitch-gold block">${player.stats?.assists || 0}</span>
                  <span class="font-mono text-[9px] text-slate-400 uppercase">Vorlagen</span>
                </div>
              </div>

              <div class="grid grid-cols-3 gap-2 text-center mt-1">
                <div class="p-2.5 rounded-xl bg-slate-900/80 border border-white/5">
                  <span class="font-display font-black text-lg text-slate-100 block">${player.stats?.duelsWon || 68}%</span>
                  <span class="font-mono text-[9px] text-slate-400 uppercase">Zweikämpfe</span>
                </div>
                <div class="p-2.5 rounded-xl bg-slate-900/80 border border-white/5">
                  <span class="font-display font-black text-lg text-amber-400 block">${player.stats?.yellowCards || 0}</span>
                  <span class="font-mono text-[9px] text-slate-400 uppercase">Gelbe Karten</span>
                </div>
                <div class="p-2.5 rounded-xl bg-slate-900/80 border border-white/5">
                  <span class="font-display font-black text-lg text-pitch-emerald block">${player.stats?.avgRating || '2.3'}</span>
                  <span class="font-mono text-[9px] text-slate-400 uppercase">Notenschnitt</span>
                </div>
              </div>
            </div>

            <!-- Training Boosts Info -->
            <div class="glass-panel rounded-2xl p-3 border border-white/5 flex items-center justify-between">
              <div>
                <span class="font-mono text-[9px] text-slate-400 uppercase block">Trainingskarten angewendet</span>
                <span class="font-display font-black text-xs text-slate-200">${player.trainingCount || 0} von max. 3 Boosts</span>
              </div>
              <span class="px-2.5 py-1 rounded-full bg-pitch-emerald/10 text-pitch-emerald border border-pitch-emerald/30 font-mono text-[10px] font-bold">
                ${3 - (player.trainingCount || 0)} Plätze frei
              </span>
            </div>

          </div>
        `}

        <!-- Bottom Action CTA Buttons -->
        <div class="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
          <button id="btn-inspect-swap" class="py-3 rounded-xl ${
            isStarter ? 'bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-500/40' : 'bg-pitch-emerald hover:bg-emerald-400 text-pitch-dark'
          } font-display font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5">
            <span>${isStarter ? '⬇ Auf Bank setzen' : '⬆ In die Startelf'}</span>
          </button>

          <button id="btn-inspect-consumable" class="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-display font-bold text-xs uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-1.5">
            <span>📦</span>
            <span>Item anwenden</span>
          </button>
        </div>

      </div>
    </div>
  `;
}
