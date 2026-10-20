// =============================================================================
// Starting XI TCG — High-End FUT Trading Card Component
// =============================================================================

import { getEffectiveOVR, getPositionFitStyle } from '../engine/ratings.js';
import { generatePlayerAvatarSVG } from './avatar.js';
import { getNationFlagSVG } from './flags.js';

/**
 * Renders a premium FUT-style Trading Card
 * @param {Object} player Player object
 * @param {Object} options Configuration options
 */
export function renderFUTCard(player, options = {}) {
  const {
    playedPosition = player.position,
    chemistryPips = 3,
    compact = false,
    medium = false,
    large = false,
    selectable = false,
    selected = false,
    draggable = true,
    clubColors = { primary: '#00f59b', secondary: '#ffd15c' }
  } = options;

  const effectiveOvr = getEffectiveOVR(player, playedPosition);
  const isOutOfPosition = effectiveOvr < player.ovr;
  const tier = player.tier || 'bronze';
  const age = player.age || 26;

  // Tier-specific color definitions
  const tierConfig = {
    special: {
      cssClass: 'card-tier-special',
      accentColor: '#00f59b',
      textGrad: 'from-emerald-300 via-teal-200 to-emerald-400',
      badgeBg: 'bg-emerald-950/80 border-emerald-500/60',
      namePlateBg: 'bg-gradient-to-r from-emerald-950/90 via-slate-900/95 to-emerald-950/90',
      borderGlow: 'border-emerald-400/80',
      holo: true
    },
    gold: {
      cssClass: 'card-tier-gold',
      accentColor: '#ffd15c',
      textGrad: 'from-amber-200 via-yellow-100 to-amber-400',
      badgeBg: 'bg-amber-950/80 border-amber-500/60',
      namePlateBg: 'bg-gradient-to-r from-amber-950/90 via-stone-900/95 to-amber-950/90',
      borderGlow: 'border-amber-400/80',
      holo: true
    },
    silver: {
      cssClass: 'card-tier-silver',
      accentColor: '#cbd5e1',
      textGrad: 'from-slate-100 via-white to-slate-300',
      badgeBg: 'bg-slate-900/80 border-slate-400/60',
      namePlateBg: 'bg-gradient-to-r from-slate-900/90 via-slate-800/95 to-slate-900/90',
      borderGlow: 'border-slate-300/80',
      holo: false
    },
    bronze: {
      cssClass: 'card-tier-bronze',
      accentColor: '#cd7f32',
      textGrad: 'from-orange-200 via-amber-100 to-orange-400',
      badgeBg: 'bg-orange-950/80 border-orange-600/60',
      namePlateBg: 'bg-gradient-to-r from-orange-950/90 via-neutral-900/95 to-orange-950/90',
      borderGlow: 'border-orange-500/80',
      holo: false
    }
  };

  const currentTier = tierConfig[tier] || tierConfig.bronze;

  // Pips indicator dots (Gemstone styled)
  let pipsHTML = '';
  for (let i = 0; i < 3; i++) {
    const active = i < chemistryPips;
    pipsHTML += `
      <span class="w-1.5 h-1.5 rounded-full transition-all duration-300 ${
        active
          ? 'bg-pitch-emerald shadow-[0_0_6px_#00f59b] scale-110 border border-emerald-300'
          : 'bg-slate-800/80 border border-slate-700/50 opacity-40'
      }"></span>
    `;
  }

  // Generate the high-res SVG bust
  const avatarSVG = generatePlayerAvatarSVG(player, {
    primaryColor: clubColors.primary,
    secondaryColor: clubColors.secondary
  });

  const flagSVG = getNationFlagSVG(player.nationality, compact ? 16 : 22, compact ? 11 : 15);
  const displayName = `${player.shortName || player.name} (${age})`;

  // =========================================================================
  // 1. COMPACT PITCH CARD (~74x112px for tactical grass field)
  // =========================================================================
  if (compact) {
    return `
      <div class="fut-card ${currentTier.cssClass} relative flex flex-col justify-between cursor-pointer ${
        selected ? 'ring-2 ring-pitch-emerald shadow-[0_0_20px_#00f59b] scale-105' : ''
      }"
           style="width: 74px; height: 110px; border-radius: 12px;"
           data-player-id="${player.id}"
           ${draggable ? `draggable="true" data-draggable-player="${player.id}"` : ''}>
        
        <!-- Rayburst & Holo Sheen -->
        <div class="card-rayburst opacity-40"></div>
        ${currentTier.holo ? '<div class="card-holo-sheen"></div>' : ''}

        <!-- Top Row: OVR & Flag -->
        <div class="relative z-10 flex items-center justify-between px-1.5 pt-1">
          <div class="flex flex-col items-center">
            <span class="font-display font-black text-xs leading-none bg-gradient-to-b ${currentTier.textGrad} bg-clip-text text-transparent drop-shadow">
              ${effectiveOvr}
            </span>
            <span class="font-mono text-[7px] font-black uppercase px-1 py-0.2 rounded border ${getPositionFitStyle(player.position, playedPosition)} leading-tight mt-0.5">
              ${player.position}
            </span>
          </div>
          <div class="flex items-center">
            ${flagSVG}
          </div>
        </div>

        <!-- Center: Vector Avatar Bust -->
        <div class="relative z-10 w-full flex justify-center -my-1 overflow-hidden" style="height: 52px;">
          <div class="w-14 h-14 transform scale-95 origin-top">
            ${avatarSVG}
          </div>
        </div>

        <!-- Bottom Plinth: Name & Pips -->
        <div class="relative z-10 ${currentTier.namePlateBg} border-t border-white/10 px-0.5 py-0.5 text-center">
          <p class="font-sans font-bold text-[8px] text-slate-100 truncate tracking-tight leading-none mb-0.5">
            ${player.shortName}
          </p>
          <div class="flex justify-center gap-0.5">${pipsHTML}</div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // 2. MEDIUM CARD (~108x162px for expanded Ersatzbank & ~126x186px for Duels)
  // =========================================================================
  if (medium) {
    const isDuel = options.duel || false;
    const cardWidth = isDuel ? '124px' : '108px';
    const cardHeight = isDuel ? '184px' : '162px';
    const avatarHeight = isDuel ? '82px' : '72px';
    const avatarWidth = isDuel ? 'w-24 h-24' : 'w-20 h-20';

    return `
      <div class="fut-card ${currentTier.cssClass} relative flex flex-col justify-between cursor-pointer flex-shrink-0 ${
        selected ? 'ring-2 ring-pitch-emerald shadow-[0_0_20px_#00f59b] scale-105' : ''
      }"
           style="width: ${cardWidth}; height: ${cardHeight}; border-radius: 14px;"
           data-player-id="${player.id}"
           ${draggable ? `draggable="true" data-draggable-player="${player.id}"` : ''}
           onmousemove="window.handleCardTilt(event, this)"
           onmouseleave="window.resetCardTilt(this)">
        
        <!-- Rayburst & Holo Sheen -->
        <div class="card-rayburst opacity-40"></div>
        ${currentTier.holo ? '<div class="card-holo-sheen"></div>' : ''}

        <!-- Top Row: OVR + Pos + Flag -->
        <div class="relative z-10 flex items-start justify-between px-2 pt-1.5">
          <div class="flex flex-col items-center">
            <span class="font-display font-black ${isDuel ? 'text-lg' : 'text-base'} leading-none bg-gradient-to-b ${currentTier.textGrad} bg-clip-text text-transparent drop-shadow">
              ${effectiveOvr}
            </span>
            <span class="font-mono text-[8px] font-black uppercase rounded border ${getPositionFitStyle(player.position, playedPosition)} mt-0.5 px-1 py-0.2">
              ${player.position}
            </span>
          </div>
          <div class="flex flex-col items-end gap-1">
            ${getNationFlagSVG(player.nationality, isDuel ? 22 : 18, isDuel ? 15 : 12)}
            <div class="flex gap-0.5">${pipsHTML}</div>
          </div>
        </div>

        <!-- Center: Vector Avatar Bust -->
        <div class="relative z-10 w-full flex justify-center -my-1 overflow-hidden" style="height: ${avatarHeight};">
          <div class="${avatarWidth} transform scale-100 origin-top">
            ${avatarSVG}
          </div>
        </div>

        <!-- Middle Plinth: Full Name (Age) -->
        <div class="relative z-20 ${currentTier.namePlateBg} border-t border-white/10 px-1 py-1 text-center shadow">
          <p class="font-sans font-black ${isDuel ? 'text-[10px]' : 'text-[9px]'} text-slate-100 truncate tracking-tight leading-tight">
            ${player.name || player.shortName} <span class="text-slate-400 font-mono font-normal">(${age})</span>
          </p>
        </div>

        <!-- Bottom Mini Stats Bar -->
        <div class="relative z-10 bg-slate-950/80 px-1 py-1 text-[8px] font-mono flex justify-around text-slate-300 border-t border-white/10">
          <div><b class="text-slate-100">${player.pac}</b> <span class="text-slate-500">P</span></div>
          <div><b class="text-slate-100">${player.sho}</b> <span class="text-slate-500">S</span></div>
          <div><b class="text-slate-100">${player.pas}</b> <span class="text-slate-500">A</span></div>
          <div><b class="text-slate-100">${player.def}</b> <span class="text-slate-500">D</span></div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // 3. STANDARD / SHOWCASE CARD (Draft, Booster, Arena, Inspect-Modal)
  // =========================================================================
  const isTW = player.position === 'TW';

  return `
    <div class="fut-card ${currentTier.cssClass} relative flex flex-col justify-between cursor-pointer ${
      selected ? 'ring-2 ring-pitch-emerald shadow-[0_0_25px_#00f59b] scale-[1.02]' : ''
    }"
         style="width: ${large ? '270px' : '200px'}; height: ${large ? '395px' : '300px'}; border-radius: ${large ? '22px' : '18px'};"
         data-player-id="${player.id}"
         ${draggable ? `draggable="true" data-draggable-player="${player.id}"` : ''}
         onmousemove="window.handleCardTilt(event, this)"
         onmouseleave="window.resetCardTilt(this)">
      
      <!-- Background Texture & Radiant Rayburst -->
      <div class="card-rayburst"></div>
      ${currentTier.holo ? '<div class="card-holo-sheen"></div>' : ''}

      <!-- TOP SECTION: Left Pillar (OVR, Pos, Flag, Chemie) & Avatar -->
      <div class="relative z-10 flex items-start justify-between px-3 pt-3">
        
        <!-- Left Pillar: OVR + Position + Flag + Chemie Pips -->
        <div class="flex flex-col items-center gap-1">
          <!-- OVR Badge -->
          <div class="flex flex-col items-center leading-none">
            <span class="font-display font-black ${large ? 'text-4xl' : 'text-3xl'} tracking-tighter bg-gradient-to-b ${currentTier.textGrad} bg-clip-text text-transparent drop-shadow-md">
              ${effectiveOvr}
            </span>
            ${isOutOfPosition ? '<span class="text-[9px] text-pitch-danger font-extrabold animate-pulse">▼ OOS</span>' : ''}
          </div>

          <!-- Position Badge -->
          <span class="font-mono ${large ? 'text-xs px-2 py-0.5' : 'text-[11px] px-1.5 py-0.5'} font-black tracking-wider text-slate-200 uppercase rounded ${currentTier.badgeBg} border">
            ${player.position}
          </span>

          <!-- Nation Flag -->
          <div class="mt-0.5">
            ${getNationFlagSVG(player.nationality, large ? 28 : 24, large ? 19 : 16)}
          </div>

          <!-- Chemie Label & Pips -->
          <div class="flex flex-col items-center mt-1">
            <span class="font-mono text-[7px] font-black uppercase text-slate-400 tracking-wider">Chemie</span>
            <div class="flex gap-1 mt-0.5">
              ${pipsHTML}
            </div>
          </div>
        </div>

        <!-- Center/Right: Dynamic Athletic Avatar Bust (Pop-Out) -->
        <div class="relative flex-1 flex justify-center items-end" style="height: ${large ? '165px' : '140px'}; margin-right: -4px;">
          <div class="absolute w-24 h-24 rounded-full bg-white/5 blur-xl -z-10"></div>
          <div class="${large ? 'w-36 h-40 scale-125' : 'w-28 h-32 scale-110'} transform origin-bottom drop-shadow-[0_8px_12px_rgba(0,0,0,0.6)]">
            ${avatarSVG}
          </div>
        </div>
      </div>

      <!-- MIDDLE: Namens-Plinthe mit Alter in Klammern: M. MUSTERMANN (29) -->
      <div class="relative z-20 ${currentTier.namePlateBg} border-y border-white/15 py-1 px-2 text-center shadow-lg">
        <h4 class="font-display font-black text-xs uppercase tracking-wider text-slate-100 truncate drop-shadow">
          ${displayName}
        </h4>
      </div>

      <!-- BOTTOM: 6-Stat Matrix mit abgerundeten Ecken -->
      <div class="relative z-10 px-2 pb-2.5 pt-1">
        <div class="bg-slate-950/75 border border-white/10 rounded-xl px-2.5 py-1.5 shadow-inner">
          ${
            isTW
              ? `
                <div class="grid grid-cols-2 gap-x-3 text-[10px] font-mono divide-x divide-white/10">
                  <div class="space-y-0.5 pr-1">
                    <div class="flex justify-between items-center"><span class="font-extrabold text-slate-100">${player.def || 82}</span><span class="text-slate-400 font-bold text-[9px]">DIV</span></div>
                    <div class="flex justify-between items-center"><span class="font-extrabold text-slate-100">${player.dri || 80}</span><span class="text-slate-400 font-bold text-[9px]">REF</span></div>
                    <div class="flex justify-between items-center"><span class="font-extrabold text-slate-100">${player.phy || 78}</span><span class="text-slate-400 font-bold text-[9px]">HAN</span></div>
                  </div>
                  <div class="space-y-0.5 pl-2">
                    <div class="flex justify-between items-center"><span class="font-extrabold text-slate-100">${player.pac || 75}</span><span class="text-slate-400 font-bold text-[9px]">POS</span></div>
                    <div class="flex justify-between items-center"><span class="font-extrabold text-slate-100">${player.pas || 74}</span><span class="text-slate-400 font-bold text-[9px]">KIC</span></div>
                    <div class="flex justify-between items-center"><span class="font-extrabold text-slate-100">${player.sho || 45}</span><span class="text-slate-400 font-bold text-[9px]">GK</span></div>
                  </div>
                </div>
              `
              : `
                <div class="grid grid-cols-2 gap-x-2 text-[10px] font-mono divide-x divide-white/10">
                  <div class="space-y-0.5 pr-1">
                    <div class="flex justify-between items-center">
                      <span class="font-black text-slate-100">${player.pac}</span>
                      <span class="text-slate-400 font-bold text-[9px] mr-1.5">PAC</span>
                      <span class="font-black text-slate-100">${player.dri}</span>
                      <span class="text-slate-400 font-bold text-[9px]">DRI</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="font-black text-slate-100">${player.pas}</span>
                      <span class="text-slate-400 font-bold text-[9px] mr-1.5">PAS</span>
                      <span class="font-black text-slate-100">${player.phy}</span>
                      <span class="text-slate-400 font-bold text-[9px]">PHY</span>
                    </div>
                  </div>

                  <div class="space-y-0.5 pl-1.5">
                    <div class="flex justify-between items-center">
                      <span class="font-black text-slate-100">${player.sho}</span>
                      <span class="text-slate-400 font-bold text-[9px] mr-1.5">SHO</span>
                      <span class="font-black text-slate-100">${player.def}</span>
                      <span class="text-slate-400 font-bold text-[9px]">DEF</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="font-black text-slate-100">${Math.round((player.pac + player.sho + player.dri) / 3)}</span>
                      <span class="text-slate-400 font-bold text-[9px] mr-1.5">ATT</span>
                      <span class="font-black text-slate-100">${Math.round((player.def + player.phy + player.pas) / 3)}</span>
                      <span class="text-slate-400 font-bold text-[9px]">RES</span>
                    </div>
                  </div>
                </div>
              `
          }
        </div>
      </div>
    </div>
  `;
}

/**
 * Renders a premium TCG Consumable / Item Card (Spell/Artifact style)
 */
export function renderConsumableCard(item, options = {}) {
  const { compact = false, showAction = true } = options;
  const rarity = item.rarity || 'gold';

  const rarityThemes = {
    gold: {
      border: 'border-amber-400/80',
      shadow: 'shadow-[0_10px_25px_rgba(255,209,92,0.25)]',
      bg: 'radial-gradient(circle at 50% 25%, #3d2d11 0%, #1c1508 70%, #0d0a04 100%)',
      badge: 'bg-amber-950/80 border-amber-500/60 text-amber-300',
      gem: 'bg-amber-400 shadow-[0_0_8px_#ffd15c]',
      glow: 'rgba(255, 209, 92, 0.4)'
    },
    silver: {
      border: 'border-slate-300/80',
      shadow: 'shadow-[0_10px_25px_rgba(203,213,225,0.2)]',
      bg: 'radial-gradient(circle at 50% 25%, #2a3441 0%, #151b24 70%, #0a0d12 100%)',
      badge: 'bg-slate-900/80 border-slate-400/60 text-slate-200',
      gem: 'bg-slate-200 shadow-[0_0_8px_#ffffff]',
      glow: 'rgba(203, 213, 225, 0.35)'
    },
    cyan: {
      border: 'border-cyan-400/80',
      shadow: 'shadow-[0_10px_25px_rgba(56,189,248,0.25)]',
      bg: 'radial-gradient(circle at 50% 25%, #102e3b 0%, #081720 70%, #030a0e 100%)',
      badge: 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300',
      gem: 'bg-cyan-400 shadow-[0_0_8px_#38bdf8]',
      glow: 'rgba(56, 189, 248, 0.4)'
    },
    emerald: {
      border: 'border-emerald-400/80',
      shadow: 'shadow-[0_10px_25px_rgba(0,245,155,0.25)]',
      bg: 'radial-gradient(circle at 50% 25%, #103326 0%, #091a13 70%, #030b08 100%)',
      badge: 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300',
      gem: 'bg-emerald-400 shadow-[0_0_8px_#00f59b]',
      glow: 'rgba(0, 245, 155, 0.4)'
    }
  };

  const theme = rarityThemes[rarity] || rarityThemes.gold;

  if (compact) {
    return `
      <div class="relative rounded-2xl p-2 border ${theme.border} ${theme.shadow} flex flex-col justify-between flex-shrink-0 cursor-pointer transition-transform hover:scale-105 active:scale-95"
           style="background: ${theme.bg}; width: 108px; height: 162px;">
        <div class="flex items-center justify-between">
          <span class="w-1.5 h-1.5 rounded-full ${theme.gem}"></span>
          <span class="font-mono text-[7px] font-black uppercase px-1 py-0.5 rounded ${theme.badge} border">${item.type}</span>
        </div>
        <div class="flex flex-col items-center my-1 text-center">
          <span class="text-3xl filter drop-shadow my-0.5">${item.icon}</span>
          <h5 class="font-display font-black text-[10px] text-slate-100 uppercase tracking-tight leading-tight truncate max-w-full">${item.name}</h5>
          <span class="font-mono text-[8px] text-pitch-gold font-bold mt-0.5 truncate max-w-full">${item.title}</span>
        </div>
        ${showAction ? `
          <button data-apply-card="${item.instanceId || item.id}" class="w-full py-1 rounded-lg bg-pitch-emerald/20 hover:bg-pitch-emerald/30 border border-pitch-emerald text-pitch-emerald font-display font-black text-[8px] uppercase tracking-wider active:scale-95 transition-all">
            Anwenden ➔
          </button>
        ` : ''}
      </div>
    `;
  }

  return `
    <div class="fut-card relative rounded-2xl p-3.5 border-2 ${theme.border} ${theme.shadow} flex flex-col justify-between"
         style="background: ${theme.bg}; width: 180px; height: 260px;"
         onmousemove="window.handleCardTilt(event, this)"
         onmouseleave="window.resetCardTilt(this)">
      
      <!-- Ambient Backlight Orb -->
      <div class="absolute inset-0 card-rayburst opacity-30 pointer-events-none"></div>
      <div class="card-holo-sheen opacity-40"></div>

      <!-- Top Header: Type & Rarity Gem -->
      <div class="relative z-10 flex items-center justify-between">
        <div class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full ${theme.gem}"></span>
          <span class="font-mono text-[9px] font-black uppercase tracking-wider text-slate-300">ITEM CARD</span>
        </div>
        <span class="font-mono text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${theme.badge} border">
          ${item.type}
        </span>
      </div>

      <!-- Center Art Container -->
      <div class="relative z-10 flex flex-col items-center justify-center my-1 py-2">
        <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner relative group">
          <div class="absolute inset-0 rounded-2xl blur-lg pointer-events-none" style="background: ${theme.glow};"></div>
          <span class="text-4xl filter drop-shadow relative z-10">${item.icon}</span>
        </div>
        <h4 class="font-display font-black text-xs uppercase tracking-wider text-slate-100 mt-2 text-center drop-shadow">
          ${item.name}
        </h4>
        <span class="font-mono text-[10px] font-extrabold text-pitch-gold text-center tracking-tight mt-0.5">
          ${item.title}
        </span>
      </div>

      <!-- Bottom Description Plate -->
      <div class="relative z-10 bg-slate-950/80 border border-white/10 rounded-xl p-2 text-center shadow-inner">
        <p class="font-sans text-[9px] text-slate-300 leading-tight">
          ${item.description}
        </p>
      </div>
    </div>
  `;
}
