// =============================================================================
// Starting XI TCG — Screen 2: Kader & Taktikboard (Formationen, Chemie-Laser & D&D)
// =============================================================================

import { renderFUTCard, renderConsumableCard } from '../components/card.js';
import { calculateSquadChemistry } from '../engine/ratings.js';

export const FORMATIONS = {
  '4-3-3': {
    name: '4-3-3 Attack',
    rows: [
      { id: 'att', slots: ['LF', 'ST', 'RF'] },
      { id: 'mid', slots: ['ZM', 'ZOM', 'ZDM'] },
      { id: 'def', slots: ['LV', 'IV_1', 'IV_2', 'RV'] },
      { id: 'gk', slots: ['TW'] }
    ],
    coords: {
      'LF': [20, 11], 'ST': [50, 10], 'RF': [80, 11],
      'ZM': [22, 38], 'ZOM': [50, 36], 'ZDM': [78, 38],
      'LV': [16, 64], 'IV_1': [39, 65], 'IV_2': [61, 65], 'RV': [84, 64],
      'TW': [50, 89]
    },
    links: [
      ['LF', 'ST'], ['ST', 'RF'],
      ['LF', 'ZM'], ['ST', 'ZOM'], ['RF', 'ZDM'],
      ['ZM', 'ZOM'], ['ZOM', 'ZDM'],
      ['ZM', 'LV'], ['ZOM', 'IV_1'], ['ZOM', 'IV_2'], ['ZDM', 'RV'],
      ['LV', 'IV_1'], ['IV_1', 'IV_2'], ['IV_2', 'RV'],
      ['IV_1', 'TW'], ['IV_2', 'TW']
    ]
  },
  '4-4-2': {
    name: '4-4-2 Flach',
    rows: [
      { id: 'att', slots: ['ST_1', 'ST_2'] },
      { id: 'mid', slots: ['LM', 'ZM_1', 'ZM_2', 'RM'] },
      { id: 'def', slots: ['LV', 'IV_1', 'IV_2', 'RV'] },
      { id: 'gk', slots: ['TW'] }
    ],
    coords: {
      'ST_1': [34, 11], 'ST_2': [66, 11],
      'LM': [16, 38], 'ZM_1': [39, 38], 'ZM_2': [61, 38], 'RM': [84, 38],
      'LV': [16, 64], 'IV_1': [39, 65], 'IV_2': [61, 65], 'RV': [84, 64],
      'TW': [50, 89]
    },
    links: [
      ['ST_1', 'ST_2'],
      ['ST_1', 'LM'], ['ST_1', 'ZM_1'], ['ST_2', 'ZM_2'], ['ST_2', 'RM'],
      ['LM', 'ZM_1'], ['ZM_1', 'ZM_2'], ['ZM_2', 'RM'],
      ['LM', 'LV'], ['ZM_1', 'IV_1'], ['ZM_2', 'IV_2'], ['RM', 'RV'],
      ['LV', 'IV_1'], ['IV_1', 'IV_2'], ['IV_2', 'RV'],
      ['IV_1', 'TW'], ['IV_2', 'TW']
    ]
  },
  '4-2-3-1': {
    name: '4-2-3-1 Kompakt',
    rows: [
      { id: 'att', slots: ['ST'] },
      { id: 'am', slots: ['LM', 'ZOM', 'RM'] },
      { id: 'dm', slots: ['ZDM_1', 'ZDM_2'] },
      { id: 'def', slots: ['LV', 'IV_1', 'IV_2', 'RV'] },
      { id: 'gk', slots: ['TW'] }
    ],
    coords: {
      'ST': [50, 9],
      'LM': [20, 28], 'ZOM': [50, 28], 'RM': [80, 28],
      'ZDM_1': [35, 48], 'ZDM_2': [65, 48],
      'LV': [16, 66], 'IV_1': [39, 67], 'IV_2': [61, 67], 'RV': [84, 66],
      'TW': [50, 89]
    },
    links: [
      ['ST', 'LM'], ['ST', 'ZOM'], ['ST', 'RM'],
      ['LM', 'ZOM'], ['ZOM', 'RM'],
      ['LM', 'ZDM_1'], ['ZOM', 'ZDM_1'], ['ZOM', 'ZDM_2'], ['RM', 'ZDM_2'],
      ['ZDM_1', 'ZDM_2'],
      ['ZDM_1', 'LV'], ['ZDM_1', 'IV_1'], ['ZDM_2', 'IV_2'], ['ZDM_2', 'RV'],
      ['LV', 'IV_1'], ['IV_1', 'IV_2'], ['IV_2', 'RV'],
      ['IV_1', 'TW'], ['IV_2', 'TW']
    ]
  },
  '3-5-2': {
    name: '3-5-2 Offensiv',
    rows: [
      { id: 'att', slots: ['ST_1', 'ST_2'] },
      { id: 'mid', slots: ['LM', 'ZM_1', 'ZOM', 'ZM_2', 'RM'] },
      { id: 'def', slots: ['IV_1', 'IV_2', 'IV_3'] },
      { id: 'gk', slots: ['TW'] }
    ],
    coords: {
      'ST_1': [34, 11], 'ST_2': [66, 11],
      'LM': [14, 38], 'ZM_1': [32, 40], 'ZOM': [50, 32], 'ZM_2': [68, 40], 'RM': [86, 38],
      'IV_1': [26, 65], 'IV_2': [50, 67], 'IV_3': [74, 65],
      'TW': [50, 89]
    },
    links: [
      ['ST_1', 'ST_2'],
      ['ST_1', 'LM'], ['ST_1', 'ZOM'], ['ST_2', 'ZOM'], ['ST_2', 'RM'],
      ['LM', 'ZM_1'], ['ZM_1', 'ZOM'], ['ZOM', 'ZM_2'], ['ZM_2', 'RM'],
      ['LM', 'IV_1'], ['ZM_1', 'IV_1'], ['ZOM', 'IV_2'], ['ZM_2', 'IV_3'], ['RM', 'IV_3'],
      ['IV_1', 'IV_2'], ['IV_2', 'IV_3'],
      ['IV_1', 'TW'], ['IV_2', 'TW'], ['IV_3', 'TW']
    ]
  },
  '5-3-2': {
    name: '5-3-2 Abwehr',
    rows: [
      { id: 'att', slots: ['ST_1', 'ST_2'] },
      { id: 'mid', slots: ['ZM_1', 'ZOM', 'ZM_2'] },
      { id: 'def', slots: ['LV', 'IV_1', 'IV_2', 'IV_3', 'RV'] },
      { id: 'gk', slots: ['TW'] }
    ],
    coords: {
      'ST_1': [34, 11], 'ST_2': [66, 11],
      'ZM_1': [28, 38], 'ZOM': [50, 34], 'ZM_2': [72, 38],
      'LV': [12, 64], 'IV_1': [31, 66], 'IV_2': [50, 68], 'IV_3': [69, 66], 'RV': [88, 64],
      'TW': [50, 89]
    },
    links: [
      ['ST_1', 'ST_2'],
      ['ST_1', 'ZM_1'], ['ST_1', 'ZOM'], ['ST_2', 'ZOM'], ['ST_2', 'ZM_2'],
      ['ZM_1', 'ZOM'], ['ZOM', 'ZM_2'],
      ['ZM_1', 'LV'], ['ZM_1', 'IV_1'], ['ZOM', 'IV_2'], ['ZM_2', 'IV_3'], ['ZM_2', 'RV'],
      ['LV', 'IV_1'], ['IV_1', 'IV_2'], ['IV_2', 'IV_3'], ['IV_3', 'RV'],
      ['IV_2', 'TW']
    ]
  }
};

export function renderKaderScreen(state) {
  const club = state.leagues.find(l => l.tier === 6)?.clubs.find(c => c.id === state.playerClubId);
  const activeFormationKey = club.formation || '4-3-3';
  const formationConfig = FORMATIONS[activeFormationKey] || FORMATIONS['4-3-3'];

  const starters = club.squad.filter(p => p.isStarter);
  const bench = club.squad.filter(p => !p.isStarter);

  const teamOvr = starters.length ? (starters.reduce((acc, p) => acc + p.ovr, 0) / starters.length).toFixed(1) : '64.0';
  const { chemistryPercent, totalPips, maxPips, pips } = calculateSquadChemistry(starters);

  // Map slots to players
  const slotPlayerMap = {};
  formationConfig.rows.forEach(r => {
    r.slots.forEach(slot => {
      const basePos = slot.split('_')[0];
      const match = starters.find(p => p.currentSlot === slot)
        || starters.find(p => p.currentSlot === basePos && !Object.values(slotPlayerMap).includes(p))
        || starters.find(p => p.position === basePos && !Object.values(slotPlayerMap).includes(p))
        || starters.find(p => !Object.values(slotPlayerMap).includes(p));
      slotPlayerMap[slot] = match;
    });
  });

  // Render SVG Chemistry Laser Lines
  const slotCoords = formationConfig.coords || {};
  let chemistryLinesSVG = '';
  formationConfig.links.forEach(([sA, sB]) => {
    const cA = slotCoords[sA];
    const cB = slotCoords[sB];
    if (!cA || !cB) return;

    const pA = slotPlayerMap[sA];
    const pB = slotPlayerMap[sB];

    let stroke = 'rgba(239, 68, 68, 0.4)';
    let dash = 'stroke-dasharray="3,3"';
    let filter = '';

    if (pA && pB) {
      if (pA.nationality === pB.nationality) {
        stroke = '#00f59b';
        dash = '';
        filter = 'filter="drop-shadow(0 0 6px #00f59b)"';
      } else if (Math.abs(pA.ovr - pB.ovr) <= 5) {
        stroke = '#ffd15c';
        dash = 'stroke-dasharray="4,2"';
        filter = 'filter="drop-shadow(0 0 5px #ffd15c)"';
      }
    }

    chemistryLinesSVG += `
      <line x1="${cA[0]}%" y1="${cA[1]}%" x2="${cB[0]}%" y2="${cB[1]}%"
            stroke="${stroke}" stroke-width="2.5" ${dash} ${filter} stroke-linecap="round" />
    `;
  });

  return `
    <div class="flex-1 flex flex-col p-3 gap-4 pb-28 overflow-y-auto no-scrollbar">
      
      <!-- Top Tactics Bar with Formation Dropdown -->
      <div class="glass-panel rounded-2xl p-3 flex items-center justify-between border border-white/10 shadow-lg">
        <div class="flex flex-col">
          <label class="font-mono text-[9px] text-slate-400 uppercase tracking-wider">Formation wählen</label>
          <select id="select-formation" class="bg-slate-900 border border-pitch-emerald/60 text-pitch-emerald font-display font-black text-sm rounded-xl px-2.5 py-1 outline-none cursor-pointer focus:ring-1 focus:ring-pitch-emerald">
            ${Object.keys(FORMATIONS).map(key => `
              <option value="${key}" ${key === activeFormationKey ? 'selected' : ''}>
                ${FORMATIONS[key].name}
              </option>
            `).join('')}
          </select>
        </div>

        <div class="flex items-center gap-4">
          <div class="text-right">
            <span class="font-mono text-[9px] text-slate-400 uppercase block">Team-OVR</span>
            <span class="font-display font-black text-sm text-slate-100">${teamOvr} ⭐</span>
          </div>
          <div class="text-right">
            <span class="font-mono text-[9px] text-slate-400 uppercase block">Chemie</span>
            <span class="font-display font-black text-sm text-pitch-emerald">${chemistryPercent}% (${totalPips}/${maxPips})</span>
          </div>
        </div>
      </div>

      <!-- Tactical Pitch (Vertical 3D Ground with Dynamic Slots & Chemistry Links) -->
      <div id="tactical-pitch"
           class="relative rounded-3xl p-3 border border-pitch-emerald/30 overflow-hidden shadow-2xl flex flex-col justify-between"
           style="background: radial-gradient(circle at 50% 30%, #152722 0%, #0a1114 80%, #06090c 100%); min-height: 520px;">
        
        <!-- Pitch Field Line Markings (SVG Overlay) -->
        <svg class="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <!-- Field Lines -->
          <g opacity="0.2">
            <rect x="5%" y="3%" width="90%" height="94%" fill="none" stroke="#00f59b" stroke-width="2"/>
            <line x1="5%" y1="50%" x2="95%" y2="50%" stroke="#00f59b" stroke-width="2"/>
            <circle cx="50%" cy="50%" r="48" fill="none" stroke="#00f59b" stroke-width="2"/>
            <rect x="24%" y="3%" width="52%" height="16%" fill="none" stroke="#00f59b" stroke-width="1.5"/>
            <rect x="24%" y="81%" width="52%" height="16%" fill="none" stroke="#00f59b" stroke-width="1.5"/>
          </g>

          <!-- Glowing Chemistry Laser Lines -->
          <g id="chemistry-links-layer">
            ${chemistryLinesSVG}
          </g>
        </svg>

        <!-- Formation Rows -->
        ${formationConfig.rows.map(row => `
          <div class="relative z-10 flex justify-around items-center my-1">
            ${row.slots.map(slot => {
              const player = slotPlayerMap[slot];
              return renderPitchSlot(player, slot, pips[player?.id] || 2);
            }).join('')}
          </div>
        `).join('')}

      </div>

      <!-- Ersatzbank (Expanded Horizontal Deck with ~108x162px Cards) -->
      <div id="bench-dropzone" class="glass-panel rounded-3xl p-3.5 border border-white/10 flex flex-col gap-2.5 shadow-xl"
           ondragover="window.handleCardDragOver(event)"
           ondrop="window.handleCardDrop(event, 'bench')">
        
        <div class="flex items-center justify-between px-1">
          <div class="flex items-center gap-2">
            <span class="text-base">🪑</span>
            <div>
              <h3 class="font-display font-black text-xs text-slate-100 uppercase tracking-wider">
                Ersatzbank (${bench.length} Spieler)
              </h3>
              <span class="font-mono text-[9px] text-slate-400">
                Tippen für Großansicht • Ziehen zum Einwechseln
              </span>
            </div>
          </div>
        </div>

        <!-- Horizontal Swipe Deck (Larger ~108x162px Cards) -->
        <div class="flex gap-3 overflow-x-auto no-scrollbar py-2 px-1 snap-x snap-mandatory">
          ${bench.map(player => `
            <div class="snap-start" data-inspect-player="${player.id}">
              ${renderFUTCard(player, { medium: true, draggable: true, chemistryPips: 2 })}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Dedicated Verbrauchskarten & Buffs Section (Scroll Down) -->
      <div class="glass-panel rounded-3xl p-3.5 border border-white/10 flex flex-col gap-3 shadow-xl">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-base">📦</span>
            <div>
              <h3 class="font-display font-black text-xs text-slate-100 uppercase tracking-wider">
                Verbrauchskarten & Buffs
              </h3>
              <span class="font-mono text-[9px] text-pitch-emerald font-bold">
                ${state.inventory.length} KARTEN IM VEREINSLAGER
              </span>
            </div>
          </div>
          <button id="btn-open-consumables" class="px-3 py-1.5 rounded-xl bg-pitch-emerald/20 hover:bg-pitch-emerald/30 border border-pitch-emerald text-pitch-emerald font-display font-black text-[10px] uppercase tracking-wider active:scale-95 transition-all">
            Inventar öffnen ➔
          </button>
        </div>

        <!-- Horizontal Item Cards List -->
        <div class="flex gap-2.5 overflow-x-auto no-scrollbar py-1">
          ${state.inventory.length ? state.inventory.map(item => renderConsumableCard(item, { compact: true })).join('') : `
            <div class="w-full py-4 text-center text-slate-500 font-sans text-xs">
              Keine Verbrauchskarten vorhanden. Ziehe Bundles auf dem TCG-Markt!
            </div>
          `}
        </div>
      </div>

    </div>
  `;
}

function renderPitchSlot(player, slotName, pips = 2) {
  const cleanSlot = slotName.replace(/_\d+$/, '');

  if (!player) {
    return `
      <div class="w-18 h-24 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center text-[10px] text-slate-500 font-mono"
           data-drop-slot="${slotName}"
           ondragover="window.handleCardDragOver(event)"
           ondrop="window.handleCardDrop(event, '${slotName}')">
        <span>⚽</span>
        <b>${cleanSlot}</b>
      </div>
    `;
  }

  return `
    <div class="flex flex-col items-center cursor-pointer transition-transform hover:scale-105 active:scale-95"
         data-starter-id="${player.id}"
         data-inspect-player="${player.id}"
         data-drop-slot="${slotName}"
         ondragover="window.handleCardDragOver(event)"
         ondrop="window.handleCardDrop(event, '${slotName}')">
      
      ${renderFUTCard(player, { compact: true, chemistryPips: pips, draggable: true, playedPosition: cleanSlot })}
      
      <span class="font-mono text-[8px] font-black text-pitch-emerald mt-1 uppercase tracking-widest px-1.5 py-0.5 rounded bg-pitch-dark/80 border border-pitch-emerald/40 drop-shadow">
        ${cleanSlot}
      </span>
    </div>
  `;
}
