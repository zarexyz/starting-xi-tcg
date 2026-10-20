// =============================================================================
// Starting XI TCG — Procedural Vector Club Crest Component
// =============================================================================

export function renderClubCrest(club, size = 36) {
  const pColor = club?.primaryColor || '#00f59b';
  const sColor = club?.secondaryColor || '#ffd15c';
  const name = club?.name || 'AN';
  const letters = name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

  return `
    <div class="relative flex items-center justify-center shrink-0 rounded-full shadow-lg" 
         style="width: ${size}px; height: ${size}px; background: radial-gradient(circle, #161f30 0%, #0a0d14 100%); border: 2px solid ${pColor};">
      <svg width="${size}" height="${size}" viewBox="0 0 100 100" class="absolute inset-0">
        <!-- Shield Path -->
        <path d="M50 8 L85 22 V50 C85 72 50 92 50 92 C50 92 15 72 15 50 V22 Z" 
              fill="${pColor}" fill-opacity="0.15" stroke="${sColor}" stroke-width="3" />
        <!-- Shield Inner Accents -->
        <path d="M50 18 L75 28 V48 C75 64 50 78 50 78 C50 78 25 64 25 48 V28 Z" 
              fill="${pColor}" fill-opacity="0.3" stroke="${pColor}" stroke-width="1.5" stroke-dasharray="3,3" />
      </svg>
      <span class="font-display font-extrabold text-[${Math.round(size * 0.36)}px] tracking-tighter" 
            style="color: ${sColor}; text-shadow: 0 0 8px rgba(0,0,0,0.8);">
        ${letters}
      </span>
    </div>
  `;
}
