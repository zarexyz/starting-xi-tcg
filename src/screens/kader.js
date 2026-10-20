// =============================================================================
// Starting XI TCG — Screen 2: Kader & Taktikboard (Formationen, Chemie-Laser & D&D)
// Hybrid Tap-to-Swap & Touch/Mouse Drag & Drop with Clear Visual Cues
// =============================================================================

import { renderFUTCard, renderConsumableCard } from '../components/card.js';
import { calculateSquadChemistry, getPositionFitStyle } from '../engine/ratings.js';

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
      ['IV_2', 'TW']
    ]
  },
  '5-3-2': {
    name: '5-3-2 Abwehrriegel',
    rows: [
      { id: 'att', slots: ['ST_1', 'ST_2'] },
      { id: 'mid', slots: ['ZM_1', 'ZDM', 'ZM_2'] },
      { id: 'def', slots: ['LAV', 'IV_1', 'IV_2', 'IV_3', 'RAV'] },
      { id: 'gk', slots: ['TW'] }
    ],
    coords: {
      'ST_1': [35, 11], 'ST_2': [65, 11],
      'ZM_1': [30, 36], 'ZDM': [50, 42], 'ZM_2': [70, 36],
      'LAV': [12, 60], 'IV_1': [31, 66], 'IV_2': [50, 67], 'IV_3': [69, 66], 'RAV': [88, 60],
      'TW': [50, 89]
    },
    links: [
      ['ST_1', 'ST_2'],
      ['ST_1', 'ZM_1'], ['ST_2', 'ZM_2'], ['ST_1', 'ZDM'], ['ST_2', 'ZDM'],
      ['ZM_1', 'ZDM'], ['ZDM', 'ZM_2'],
      ['LAV', 'IV_1'], ['IV_1', 'IV_2'], ['IV_2', 'IV_3'], ['IV_3', 'RAV'],
      ['ZM_1', 'IV_1'], ['ZDM', 'IV_2'], ['ZM_2', 'IV_3'],
      ['IV_2', 'TW']
    ]
  }
};

export function renderKaderScreen(state) {
  const club = state.leagues.find(l => l.tier === 6)?.clubs.find(c => c.id === state.playerClubId);
  const activeFormation = club.formation || '4-3-3';
  const formationConfig = FORMATIONS[activeFormation] || FORMATIONS['4-3-3'];

  const starters = club.squad.filter(p => p.isStarter);
  const bench = club.squad.filter(p => !p.isStarter);
  const teamOvr = starters.length ? Math.round(starters.reduce((acc, p) => acc + p.ovr, 0) / starters.length) : 60;
  const { chemistryPercent, totalPips, maxPips, pips } = calculateSquadChemistry(starters);

  const selectedSwapId = state.selectedPlayerIdForSwap || null;

  // Map starter players to formation slots
  const slotPlayerMap = {};
  const unassignedStarters = [...starters];

  formationConfig.rows.forEach(row => {
    row.slots.forEach(slot => {
      const idx = unassignedStarters.findIndex(p => p.currentSlot === slot);
      if (idx !== -1) {
        slotPlayerMap[slot] = unassignedStarters.splice(idx, 1)[0];
      }
    });
  });

  formationConfig.rows.forEach(row => {
    row.slots.forEach(slot => {
      if (!slotPlayerMap[slot]) {
        const cleanSlot = slot.replace(/_\d+$/, '');
        const idx = unassignedStarters.findIndex(p => p.position === cleanSlot);
        if (idx !== -1) {
          const p = unassignedStarters.splice(idx, 1)[0];
          p.currentSlot = slot;
          slotPlayerMap[slot] = p;
        }
      }
    });
  });

  formationConfig.rows.forEach(row => {
    row.slots.forEach(slot => {
      if (!slotPlayerMap[slot] && unassignedStarters.length) {
        const p = unassignedStarters.shift();
        p.currentSlot = slot;
        slotPlayerMap[slot] = p;
      }
    });
  });

  // Generate glowing chemistry laser lines
  let chemistryLinesSVG = '';
  formationConfig.links.forEach(([slotA, slotB]) => {
    const coordA = formationConfig.coords[slotA];
    const coordB = formationConfig.coords[slotB];
    if (!coordA || !coordB) return;

    const playerA = slotPlayerMap[slotA];
    const playerB = slotPlayerMap[slotB];

    let lineColor = 'rgba(255, 255, 255, 0.12)';
    let strokeWidth = '1.5';
    let dashArray = '4,4';

    if (playerA && playerB) {
      if (playerA.nationality === playerB.nationality) {
        lineColor = '#00f59b';
        strokeWidth = '2.5';
        dashArray = 'none';
      } else {
        lineColor = '#ffd15c';
        strokeWidth = '2';
        dashArray = 'none';
      }
    }

    chemistryLinesSVG += `
      <line x1="${coordA[0]}%" y1="${coordA[1]}%" x2="${coordB[0]}%" y2="${coordB[1]}%" 
            stroke="${lineColor}" stroke-width="${strokeWidth}" stroke-dasharray="${dashArray}" 
            stroke-linecap="round" opacity="0.85" />
    `;
  });

  return `
    <div class="flex-1 flex flex-col p-3 gap-3.5 pb-24 overflow-y-auto no-scrollbar select-none">
      
      <!-- Top Control Bar: Formation Dropdown & Squad Health -->
      <div class="glass-panel rounded-2xl p-3 border border-white/10 flex items-center justify-between shadow-xl">
        <div class="flex items-center gap-2">
          <label class="font-mono text-[9px] text-slate-400 uppercase block font-bold">Formation</label>
          <select id="select-formation" class="bg-slate-900 border border-pitch-emerald/50 rounded-xl px-2.5 py-1 text-xs font-display font-black text-pitch-emerald outline-none cursor-pointer">
            ${Object.keys(FORMATIONS).map(key => `
              <option value="${key}" ${key === activeFormation ? 'selected' : ''}>${FORMATIONS[key].name}</option>
            `).join('')}
          </select>
        </div>

        <div class="flex items-center gap-3">
          <div class="text-right">
            <span class="font-mono text-[8px] text-slate-400 uppercase block">Team-OVR</span>
            <span class="font-display font-black text-xs text-slate-100">${teamOvr} ⭐</span>
          </div>
          <div class="text-right">
            <span class="font-mono text-[8px] text-slate-400 uppercase block">Chemie</span>
            <span class="font-display font-black text-xs text-pitch-emerald">${chemistryPercent}%</span>
          </div>
        </div>
      </div>

      <!-- Swap Mode Banner when a player is selected -->
      ${selectedSwapId ? `
        <div class="px-3 py-2 rounded-2xl bg-pitch-emerald/20 border-2 border-pitch-emerald text-pitch-emerald font-display font-black text-xs uppercase flex items-center justify-between shadow-[0_0_20px_rgba(0,245,155,0.4)] animate-pulse">
          <div class="flex items-center gap-2">
            <span>🔄</span>
            <span>Tippe Ziel-Spieler oder Slot zum Tauschen an!</span>
          </div>
          <button id="btn-cancel-swap-mode" class="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 hover:text-white border border-slate-700 text-[10px] font-bold">
            Abbrechen ✕
          </button>
        </div>
      ` : ''}

      <!-- Tactical Pitch (Vertical 3D Ground with Dynamic Slots & Chemistry Links) -->
      <div id="tactical-pitch"
           class="relative rounded-3xl p-3 border border-pitch-emerald/30 overflow-hidden shadow-2xl flex flex-col justify-between"
           style="background: radial-gradient(circle at 50% 30%, #152722 0%, #0a1114 80%, #06090c 100%); min-height: 520px;">
        
        <!-- Pitch Field Line Markings (SVG Overlay) -->
        <svg class="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <g opacity="0.2">
            <rect x="5%" y="3%" width="90%" height="94%" fill="none" stroke="#00f59b" stroke-width="2"/>
            <line x1="5%" y1="50%" x2="95%" y2="50%" stroke="#00f59b" stroke-width="2"/>
            <circle cx="50%" cy="50%" r="48" fill="none" stroke="#00f59b" stroke-width="2"/>
            <rect x="24%" y="3%" width="52%" height="16%" fill="none" stroke="#00f59b" stroke-width="1.5"/>
            <rect x="24%" y="81%" width="52%" height="16%" fill="none" stroke="#00f59b" stroke-width="1.5"/>
          </g>
          <g id="chemistry-links-layer">
            ${chemistryLinesSVG}
          </g>
        </svg>

        <!-- Formation Rows -->
        ${formationConfig.rows.map(row => `
          <div class="relative z-10 flex justify-around items-center my-1">
            ${row.slots.map(slot => {
              const player = slotPlayerMap[slot];
              return renderPitchSlot(player, slot, pips[player?.id] || 2, selectedSwapId);
            }).join('')}
          </div>
        `).join('')}

      </div>

      <!-- Ersatzbank (Expanded Horizontal Deck with ~108x162px Cards) -->
      <div id="bench-dropzone" class="glass-panel rounded-3xl p-3.5 border border-white/10 flex flex-col gap-2.5 shadow-xl"
           data-drop-slot="bench"
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
                Antippen zum Tauschen • ℹ️ für Dossier
              </span>
            </div>
          </div>
        </div>

        <!-- Horizontal Swipe Deck (Larger ~108x162px Cards with Mousewheel & Touch Pan) -->
        <div class="horizontal-scroll-deck flex gap-3 overflow-x-auto py-2 px-1 snap-x snap-mandatory"
             style="-webkit-overflow-scrolling: touch; touch-action: pan-x;"
             onwheel="this.scrollLeft += event.deltaY; event.preventDefault();">
          ${bench.map(player => {
            const isSelected = player.id === selectedSwapId;
            return `
              <div class="relative flex-shrink-0 snap-start flex flex-col items-center" 
                   data-card-swap-trigger="${player.id}">
                ${renderFUTCard(player, { medium: true, draggable: true, chemistryPips: 2, selected: isSelected })}
                
                <button data-inspect-player="${player.id}" class="absolute top-1 right-1 w-6 h-6 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-white/20 text-[10px] font-bold flex items-center justify-center shadow-lg active:scale-95 z-20" title="Dossier anzeigen">
                  ℹ️
                </button>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Dedicated Verbrauchskarten Section (Scroll Down) -->
      <div class="glass-panel rounded-3xl p-3.5 border border-white/10 flex flex-col gap-3 shadow-xl">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-base">📦</span>
            <div>
              <h3 class="font-display font-black text-xs text-slate-100 uppercase tracking-wider">
                Verbrauchskarten
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

        <!-- Horizontal Item Cards List with Mousewheel & Touch Pan -->
        <div class="horizontal-scroll-deck flex gap-3 overflow-x-auto py-1 px-1"
             style="-webkit-overflow-scrolling: touch; touch-action: pan-x;"
             onwheel="this.scrollLeft += event.deltaY; event.preventDefault();">
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

const POSITION_GROUPS = {
  att: ['ST', 'LF', 'RF'],
  mid: ['ZM', 'ZOM', 'ZDM', 'LM', 'RM'],
  def: ['LV', 'RV', 'IV'],
  gk: ['TW']
};

function renderPitchSlot(player, slotName, pips = 2, selectedSwapId = null) {
  const cleanSlot = slotName.replace(/_\d+$/, '');

  if (!player) {
    return `
      <div class="w-18 h-26 border-2 border-dashed border-pitch-emerald/60 bg-emerald-950/20 rounded-xl flex flex-col items-center justify-center text-[10px] text-pitch-emerald font-mono cursor-pointer transition-transform hover:scale-105 active:scale-95"
           data-empty-slot-trigger="${slotName}"
           data-drop-slot="${slotName}"
           ondragover="window.handleCardDragOver(event)"
           ondrop="window.handleCardDrop(event, '${slotName}')">
        <span class="text-lg">➕</span>
        <b>${cleanSlot}</b>
      </div>
    `;
  }

  const isSelected = player.id === selectedSwapId;
  const badgeStyle = getPositionFitStyle(player.position, cleanSlot);

  return `
    <div class="relative flex flex-col items-center cursor-pointer transition-transform hover:scale-105 active:scale-95"
         data-card-swap-trigger="${player.id}"
         data-starter-slot="${slotName}"
         data-drop-slot="${slotName}"
         ondragover="window.handleCardDragOver(event)"
         ondrop="window.handleCardDrop(event, '${slotName}')">
      
      ${renderFUTCard(player, { compact: true, chemistryPips: pips, draggable: true, playedPosition: cleanSlot, selected: isSelected })}
      
      <button data-inspect-player="${player.id}" class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-white/20 text-[9px] font-bold flex items-center justify-center shadow-lg active:scale-95 z-20" title="Dossier anzeigen">
        ℹ️
      </button>

      <span class="font-mono text-[8px] font-black mt-1 uppercase tracking-widest px-1.5 py-0.5 rounded border drop-shadow ${badgeStyle}">
        ${cleanSlot}
      </span>
    </div>
  `;
}
