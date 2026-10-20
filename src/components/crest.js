// =============================================================================
// Starting XI TCG — Procedural Vector Club Crest Component (5 Modern Shapes)
// =============================================================================

export const CREST_SHAPES = [
  { id: 'shield', name: 'Schild', icon: '🛡️' },
  { id: 'hexagon', name: 'Hexagon', icon: '⬡' },
  { id: 'circle', name: 'Rund', icon: '🔘' },
  { id: 'diamond', name: 'Diamant', icon: '◆' },
  { id: 'banner', name: 'Krone', icon: '👑' }
];

export function renderClubCrest(club, size = 36) {
  const pColor = club?.primaryColor || '#00f59b';
  const sColor = club?.secondaryColor || '#ffd15c';
  const form = club?.crestForm || 'shield';
  const name = club?.name || 'AN';
  const letters = name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'FC';

  let pathData = '';
  let innerPathData = '';

  switch (form) {
    case 'hexagon':
      pathData = 'M50 5 L88 27 V73 L50 95 L12 73 V27 Z';
      innerPathData = 'M50 15 L78 32 V68 L50 85 L22 68 V32 Z';
      break;
    case 'circle':
      pathData = 'M50 6 A44 44 0 1 0 50 94 A44 44 0 1 0 50 6 Z';
      innerPathData = 'M50 14 A36 36 0 1 0 50 86 A36 36 0 1 0 50 14 Z';
      break;
    case 'diamond':
      pathData = 'M50 6 L92 50 L50 94 L8 50 Z';
      innerPathData = 'M50 16 L82 50 L50 84 L18 50 Z';
      break;
    case 'banner':
      pathData = 'M16 12 L50 24 L84 12 V65 C84 82 50 94 50 94 C50 94 16 82 16 65 Z';
      innerPathData = 'M24 22 L50 32 L76 22 V60 C76 74 50 84 50 84 C50 84 24 74 24 60 Z';
      break;
    case 'shield':
    default:
      pathData = 'M50 8 L85 22 V50 C85 72 50 92 50 92 C50 92 15 72 15 50 V22 Z';
      innerPathData = 'M50 18 L75 28 V48 C75 64 50 78 50 78 C50 78 25 64 25 48 V28 Z';
      break;
  }

  return `
    <div class="relative flex items-center justify-center shrink-0 drop-shadow-md select-none" 
         style="width: ${size}px; height: ${size}px;">
      <svg width="${size}" height="${size}" viewBox="0 0 100 100" class="absolute inset-0">
        <!-- Outer Shell -->
        <path d="${pathData}" 
              fill="${pColor}" fill-opacity="0.25" stroke="${sColor}" stroke-width="4" stroke-linejoin="round" />
        <!-- Inner Accent Ring / Lines -->
        <path d="${innerPathData}" 
              fill="${pColor}" fill-opacity="0.35" stroke="${pColor}" stroke-width="1.8" stroke-dasharray="3,3" />
      </svg>
      <span class="relative z-10 font-display font-black text-center leading-none" 
            style="font-size: ${Math.round(size * 0.34)}px; color: ${sColor}; text-shadow: 0 1px 4px rgba(0,0,0,0.9);">
        ${letters}
      </span>
    </div>
  `;
}
