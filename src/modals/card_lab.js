// =============================================================================
// Starting XI TCG — Modal: Card Design Lab (Showcase & Quality Inspection)
// =============================================================================

import { renderFUTCard, renderConsumableCard } from '../components/card.js';
import { CONSUMABLE_CARDS } from '../engine/packs.js';

export function renderCardLabModal() {
  const showcasePlayers = [
    {
      id: 'demo_special',
      name: 'Max Mustermann',
      shortName: 'M. Mustermann',
      age: 29,
      position: 'ST',
      nationality: 'GER',
      nationName: 'Deutschland',
      nationFlag: '🇩🇪',
      ovr: 88,
      tier: 'special',
      pac: 88,
      dri: 86,
      sho: 89,
      def: 45,
      pas: 84,
      phy: 78
    },
    {
      id: 'demo_gold',
      name: 'Luka Modric',
      shortName: 'L. Modric',
      age: 34,
      position: 'ZM',
      nationality: 'CRO',
      nationName: 'Kroatien',
      nationFlag: '🇭🇷',
      ovr: 82,
      tier: 'gold',
      pac: 73,
      dri: 85,
      sho: 78,
      def: 72,
      pas: 89,
      phy: 66
    },
    {
      id: 'demo_silver',
      name: 'Jonathan Tah',
      shortName: 'J. Tah',
      age: 28,
      position: 'IV',
      nationality: 'GER',
      nationName: 'Deutschland',
      nationFlag: '🇩🇪',
      ovr: 72,
      tier: 'silver',
      pac: 74,
      dri: 61,
      sho: 35,
      def: 75,
      pas: 68,
      phy: 82
    },
    {
      id: 'demo_bronze',
      name: 'Tim Müller',
      shortName: 'T. Müller',
      age: 19,
      position: 'LV',
      nationality: 'GER',
      nationName: 'Deutschland',
      nationFlag: '🇩🇪',
      ovr: 62,
      tier: 'bronze',
      pac: 78,
      dri: 60,
      sho: 48,
      def: 60,
      pas: 58,
      phy: 64
    }
  ];

  return `
    <div class="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col p-4 max-w-md mx-auto justify-between animate-fadeIn overflow-hidden">
      
      <!-- Ambient Lighting -->
      <div class="absolute inset-0 bg-radial-gold pointer-events-none opacity-30"></div>

      <!-- Header -->
      <div class="relative z-10 flex items-center justify-between pb-3 border-b border-white/10">
        <div>
          <span class="inline-block px-2.5 py-0.5 rounded-full font-mono text-[9px] font-black uppercase text-pitch-emerald bg-pitch-emerald/15 border border-pitch-emerald/40 mb-1">
            TCG STUDIO & DESIGN-LAB
          </span>
          <h2 class="font-display font-black text-lg text-slate-100 uppercase tracking-tight">
            Karten-Inspektion
          </h2>
        </div>
        <button id="btn-close-modal" class="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold">
          ✕
        </button>
      </div>

      <!-- Instruction note -->
      <p class="relative z-10 text-[11px] font-sans text-slate-300 text-center my-1">
        Bewege die Maus oder wische über die Karten für den <b class="text-pitch-gold">3D-Tilt & Holo-Foil-Effekt</b>:
      </p>

      <!-- Center Carousel: 4 Tiers of Player Cards -->
      <div class="relative z-10 flex-1 flex flex-col justify-center my-2 overflow-hidden">
        <div class="flex items-center gap-4 overflow-x-auto py-4 px-2 no-scrollbar snap-x snap-mandatory">
          ${showcasePlayers.map(player => `
            <div class="flex-shrink-0 flex flex-col items-center gap-2 snap-center">
              <span class="font-mono text-[9px] font-black uppercase tracking-wider text-slate-400">
                ${player.tier.toUpperCase()} TIER
              </span>
              ${renderFUTCard(player, { compact: false })}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Consumable Cards Section Footer -->
      <div class="relative z-10 glass-card rounded-2xl p-2.5 border border-white/10 flex flex-col gap-2">
        <span class="font-mono text-[9px] font-black uppercase tracking-wider text-pitch-cyan">
          📦 VERBRAUCHS- & SPELL-KARTEN
        </span>
        <div class="flex gap-2 overflow-x-auto no-scrollbar py-1">
          ${CONSUMABLE_CARDS.map(item => renderConsumableCard(item, { compact: true, showAction: false })).join('')}
        </div>
      </div>

      <!-- Close Action -->
      <div class="relative z-10 mt-2">
        <button id="btn-close-modal" class="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-display font-bold text-xs uppercase tracking-wider border border-slate-700">
          Zurück zum Spiel ➔
        </button>
      </div>

    </div>
  `;
}
