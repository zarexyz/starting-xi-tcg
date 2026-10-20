// =============================================================================
// Starting XI TCG — Athletic Vector Silhouette Player Avatar Engine (SVG)
// Professional sports-card styling: stylized athletic silhouettes, sharp rim lighting,
// club kit colors, chest crest, and glowing positional aura (PAC, SHO, DEF, MID, TW)
// =============================================================================

function hashSeed(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function createPRNG(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Positional Backlight Auras
const POSITION_AURAS = {
  TW: {
    name: 'GK Shield',
    glow: '#f59e0b', // Amber/Gold glow
    particle: '#fbbf24',
    secondary: '#d97706'
  },
  IV: {
    name: 'Defender Rock',
    glow: '#3b82f6', // Cobalt Blue
    particle: '#60a5fa',
    secondary: '#1d4ed8'
  },
  LV: {
    name: 'Wing Defender',
    glow: '#06b6d4', // Cyan
    particle: '#38bdf8',
    secondary: '#0284c7'
  },
  RV: {
    name: 'Wing Defender',
    glow: '#06b6d4', // Cyan
    particle: '#38bdf8',
    secondary: '#0284c7'
  },
  ZM: {
    name: 'Midfield Engine',
    glow: '#10b981', // Emerald
    particle: '#34d399',
    secondary: '#059669'
  },
  ZDM: {
    name: 'Midfield Anchor',
    glow: '#10b981', // Emerald
    particle: '#34d399',
    secondary: '#047857'
  },
  ZOM: {
    name: 'Playmaker Glow',
    glow: '#8b5cf6', // Violet
    particle: '#a78bfa',
    secondary: '#6d28d9'
  },
  LM: {
    name: 'Pace Wing',
    glow: '#06b6d4', // Cyan Pace
    particle: '#22d3ee',
    secondary: '#0891b2'
  },
  RM: {
    name: 'Pace Wing',
    glow: '#06b6d4', // Cyan Pace
    particle: '#22d3ee',
    secondary: '#0891b2'
  },
  LF: {
    name: 'Winger Strike',
    glow: '#ec4899', // Pink / Magenta Pace
    particle: '#f472b6',
    secondary: '#db2777'
  },
  RF: {
    name: 'Winger Strike',
    glow: '#ec4899', // Pink / Magenta Pace
    particle: '#f472b6',
    secondary: '#db2777'
  },
  ST: {
    name: 'Striker Crimson Fire',
    glow: '#ef4444', // Red / Crimson Finisher
    particle: '#f87171',
    secondary: '#b91c1c'
  }
};

const SKIN_TONES = [
  { base: '#f3c5a8', shadow: '#c48967', deep: '#8c5030', rim: '#ffece0' },
  { base: '#deb085', shadow: '#ad744c', deep: '#784323', rim: '#fae3cd' },
  { base: '#be875e', shadow: '#8f5732', deep: '#5f3214', rim: '#ddb18f' },
  { base: '#905b38', shadow: '#64381b', deep: '#3d1c09', rim: '#b57b55' },
  { base: '#643c22', shadow: '#42220e', deep: '#261104', rim: '#875635' },
  { base: '#3a2316', shadow: '#241208', deep: '#120702', rim: '#543623' }
];

const HAIR_PALETTES = [
  { fill: '#141416', rim: '#484d58' }, // Jet Black Silhouette
  { fill: '#281a13', rim: '#5e4336' }, // Dark Espresso
  { fill: '#452617', rim: '#8f563b' }, // Auburn / Chestnut
  { fill: '#735226', rim: '#b89053' }, // Honey Brown
  { fill: '#ab8b4b', rim: '#fae19b' }, // Golden
  { fill: '#828c9b', rim: '#e2e8f0' }  // Platinum Silver
];

export function generatePlayerAvatarSVG(player, options = {}) {
  const seed = hashSeed(player.id || player.name || 'avatar_seed_v4');
  const rng = createPRNG(seed);

  const primaryColor = options.primaryColor || '#00f59b';
  const secondaryColor = options.secondaryColor || '#ffd15c';
  const pos = (player.position || 'ST').toUpperCase();
  const aura = POSITION_AURAS[pos] || POSITION_AURAS.ST;

  const skin = SKIN_TONES[Math.floor(rng() * SKIN_TONES.length)];
  const hair = HAIR_PALETTES[Math.floor(rng() * HAIR_PALETTES.length)];
  const hairStyle = Math.floor(rng() * 7);
  const hasBeard = (player.age || 25) >= 22 && rng() > 0.45;
  const beardStyle = Math.floor(rng() * 3);

  const isGK = pos === 'TW';
  const kitColor = isGK ? '#ea580c' : primaryColor;
  const accentColor = isGK ? '#fef08a' : secondaryColor;

  const uid = `av4_${(player.id || 'p').replace(/[^a-zA-Z0-9]/g, '')}_${Math.floor(rng() * 9999)}`;

  // Silhouette Hairstyles with Rim Shading
  let hairMarkup = '';
  switch (hairStyle) {
    case 0: // Taper Fade Athletic
      hairMarkup = `
        <path d="M 50 62 C 48 30, 112 30, 110 62 C 110 70, 108 78, 108 78 C 104 62, 94 48, 80 48 C 66 48, 56 62, 52 78 Z" fill="${hair.fill}"/>
        <path d="M 52 46 Q 80 34 108 46" stroke="${hair.rim}" stroke-width="2.5" fill="none" opacity="0.8"/>
        <line x1="60" y1="44" x2="68" y2="52" stroke="#ffffff" stroke-width="1.8" opacity="0.5"/>
      `;
      break;
    case 1: // Dynamic Volumetric Quiff
      hairMarkup = `
        <path d="M 46 64 C 42 22, 88 12, 112 24 C 120 28, 118 48, 112 64 C 105 48, 92 38, 78 38 C 64 38, 53 48, 46 64 Z" fill="${hair.fill}"/>
        <path d="M 56 34 Q 82 20 108 30" stroke="${hair.rim}" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.9"/>
        <path d="M 64 44 Q 84 32 102 40" stroke="${hair.rim}" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.7"/>
      `;
      break;
    case 2: // Tight Afro / Textured Fade
      hairMarkup = `
        <path d="M 48 62 C 42 26, 52 14, 80 12 C 108 14, 118 26, 112 62 C 106 48, 94 38, 80 38 C 66 38, 54 48, 48 62 Z" fill="${hair.fill}"/>
        <circle cx="58" cy="24" r="10" fill="${hair.fill}"/>
        <circle cx="80" cy="18" r="11" fill="${hair.fill}"/>
        <circle cx="102" cy="24" r="10" fill="${hair.fill}"/>
        <path d="M 54 26 Q 80 14 106 26" stroke="${hair.rim}" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.75"/>
      `;
      break;
    case 3: // Undercut Slick
      hairMarkup = `
        <path d="M 44 64 C 42 26, 86 16, 114 26 C 118 40, 114 64, 114 64 C 106 50, 94 42, 80 42 C 64 42, 54 50, 44 64 Z" fill="${hair.fill}"/>
        <path d="M 50 36 Q 80 22 106 32" stroke="${hair.rim}" stroke-width="3.5" fill="none" opacity="0.85"/>
      `;
      break;
    case 4: // Athletic Braids with Pro Headband
      hairMarkup = `
        <path d="M 46 62 C 44 24, 116 24, 114 62 Z" fill="${hair.fill}"/>
        <!-- White Pro Sweatband -->
        <path d="M 45 56 Q 80 46 115 56" stroke="#ffffff" stroke-width="5.5" fill="none"/>
        <path d="M 40 64 Q 34 90 38 108" stroke="${hair.fill}" stroke-width="5" stroke-linecap="round" fill="none"/>
        <path d="M 48 66 Q 44 96 46 112" stroke="${hair.fill}" stroke-width="5" stroke-linecap="round" fill="none"/>
        <path d="M 112 66 Q 116 96 114 112" stroke="${hair.fill}" stroke-width="5" stroke-linecap="round" fill="none"/>
        <path d="M 120 64 Q 126 90 122 108" stroke="${hair.fill}" stroke-width="5" stroke-linecap="round" fill="none"/>
      `;
      break;
    case 5: // Athletic Forward Spikes
      hairMarkup = `
        <polygon points="46,64 52,28 64,42 76,18 88,42 100,22 108,38 114,64" fill="${hair.fill}"/>
        <polygon points="68,38 76,24 84,38" fill="${hair.rim}" opacity="0.8"/>
      `;
      break;
    default: // Clean Modern Crop
      hairMarkup = `
        <path d="M 46 64 C 44 28, 116 28, 114 64 C 106 50, 92 42, 80 42 C 68 42, 54 50, 46 64 Z" fill="${hair.fill}"/>
        <path d="M 54 42 Q 80 34 106 42" stroke="${hair.rim}" stroke-width="3" fill="none" opacity="0.75"/>
      `;
  }

  // Athletic Silhouette Beard
  let beardMarkup = '';
  if (hasBeard) {
    if (beardStyle === 0) {
      beardMarkup = `
        <!-- Designer Shadow -->
        <path d="M 58 100 C 62 118, 98 118, 102 100 C 98 122, 62 122, 58 100 Z" fill="${hair.fill}" opacity="0.45"/>
      `;
    } else if (beardStyle === 1) {
      beardMarkup = `
        <!-- Sharp Contour Beard -->
        <path d="M 55 80 C 58 106, 68 122, 80 124 C 92 122, 102 106, 105 80 C 108 106, 96 128, 80 128 C 64 128, 52 106, 55 80 Z" fill="${hair.fill}"/>
        <path d="M 68 96 Q 80 94 92 96" stroke="${hair.fill}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      `;
    } else {
      beardMarkup = `
        <!-- Sporty Goatee -->
        <path d="M 70 94 Q 80 91 90 94 Q 80 98 70 94 Z" fill="${hair.fill}"/>
        <path d="M 72 104 Q 80 102 88 104 C 88 118, 72 118, 72 104 Z" fill="${hair.fill}"/>
      `;
    }
  }

  return `
    <svg viewBox="0 0 160 170" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="player-avatar-svg drop-shadow-lg select-none">
      <defs>
        <!-- Dynamic Positional Backdrop Aura -->
        <radialGradient id="${uid}_aura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${aura.glow}" stop-opacity="0.8"/>
          <stop offset="55%" stop-color="${aura.secondary}" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="${aura.glow}" stop-opacity="0"/>
        </radialGradient>

        <!-- Dynamic Holographic Rays for Aura -->
        <linearGradient id="${uid}_halo_beam" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${aura.particle}" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="${aura.glow}" stop-opacity="0"/>
        </linearGradient>

        <!-- Athletic Silhouette Face Shading -->
        <radialGradient id="${uid}_face_grad" cx="55%" cy="36%" r="58%">
          <stop offset="0%" stop-color="${skin.rim}"/>
          <stop offset="42%" stop-color="${skin.base}"/>
          <stop offset="78%" stop-color="${skin.shadow}"/>
          <stop offset="100%" stop-color="${skin.deep}"/>
        </radialGradient>

        <!-- Athletic Neck Gradient -->
        <linearGradient id="${uid}_neck_grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${skin.deep}"/>
          <stop offset="60%" stop-color="${skin.shadow}"/>
          <stop offset="100%" stop-color="${skin.base}"/>
        </linearGradient>

        <!-- Jersey Fabric Gradient with Premium Shoulder Glow -->
        <linearGradient id="${uid}_jersey_grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${kitColor}"/>
          <stop offset="65%" stop-color="${kitColor}"/>
          <stop offset="100%" stop-color="#0b1120"/>
        </linearGradient>

        <!-- Dynamic Specular Edge Rim Light (TCG Foil Effect) -->
        <linearGradient id="${uid}_rim_light" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.6"/>
          <stop offset="25%" stop-color="#ffffff" stop-opacity="0.05"/>
          <stop offset="75%" stop-color="#ffffff" stop-opacity="0.05"/>
          <stop offset="100%" stop-color="${aura.particle}" stop-opacity="0.85"/>
        </linearGradient>
      </defs>

      <!-- 0. BACKDROP: GLOWING POSITIONAL AURA (PAC / SHO / DEF / MID) -->
      <g id="aura_layer" opacity="0.85">
        <circle cx="80" cy="78" r="56" fill="url(#${uid}_aura)"/>
        <!-- Dynamic Angle Beams -->
        <polygon points="80,10 86,75 80,78 74,75" fill="url(#${uid}_halo_beam)" opacity="0.4"/>
        <polygon points="140,40 85,76 80,78 82,72" fill="url(#${uid}_halo_beam)" opacity="0.35"/>
        <polygon points="20,40 78,72 80,78 75,76" fill="url(#${uid}_halo_beam)" opacity="0.35"/>
      </g>

      <!-- 1. ATHLETIC TORSO & CLUB JERSEY -->
      <g id="jersey_layer">
        <!-- Broad Athletic Shoulders & Chest Silhouette -->
        <path d="M 8 170 C 12 128, 42 116, 60 112 L 100 112 C 118 116, 148 128, 152 170 Z" fill="url(#${uid}_jersey_grad)"/>
        <!-- Specular Highlight Overlay -->
        <path d="M 8 170 C 12 128, 42 116, 60 112 L 100 112 C 118 116, 148 128, 152 170 Z" fill="url(#${uid}_rim_light)"/>

        <!-- Contrast Athletic Collar (V-Neck Sport) -->
        <path d="M 58 112 Q 80 126 102 112 L 94 130 Q 80 142 66 130 Z" fill="${accentColor}"/>
        <path d="M 68 116 Q 80 132 92 116 L 80 134 Z" fill="#0b1120"/>

        <!-- Modern Shoulder Racing Stripes -->
        <path d="M 28 142 L 56 113" stroke="${accentColor}" stroke-width="2.5" stroke-opacity="0.75" fill="none"/>
        <path d="M 132 142 L 104 113" stroke="${accentColor}" stroke-width="2.5" stroke-opacity="0.75" fill="none"/>
        <path d="M 22 148 L 48 119" stroke="${accentColor}" stroke-width="1.5" stroke-opacity="0.5" fill="none"/>
        <path d="M 138 148 L 112 119" stroke="${accentColor}" stroke-width="1.5" stroke-opacity="0.5" fill="none"/>

        <!-- Mini Club Crest on Left Chest -->
        <g transform="translate(46, 138)">
          <circle cx="0" cy="0" r="7" fill="#0f172a" stroke="${accentColor}" stroke-width="1.4"/>
          <!-- Star / Shield Emblem -->
          <polygon points="0,-4 1.5,-1 5,-1 2.2,1.2 3.3,4.5 0,2.3 -3.3,4.5 -2.2,1.2 -5,-1 -1.5,-1" fill="${accentColor}"/>
        </g>

        <!-- Sleek Front Sponsor Line -->
        <line x1="68" y1="152" x2="92" y2="152" stroke="${accentColor}" stroke-width="2" stroke-opacity="0.4" stroke-linecap="round"/>
      </g>

      <!-- 2. ATHLETIC NECK & TRAPEZIUS -->
      <g id="neck_layer">
        <path d="M 63 88 L 63 120 Q 80 124 97 120 L 97 88 Z" fill="url(#${uid}_neck_grad)"/>
        <!-- Sternocleidomastoid Definition (Athletic muscle shadow) -->
        <path d="M 72 94 L 76 112" stroke="${skin.deep}" stroke-width="2.2" stroke-linecap="round" opacity="0.6"/>
        <path d="M 88 94 L 84 112" stroke="${skin.rim}" stroke-width="1.8" stroke-linecap="round" opacity="0.5"/>
      </g>

      <!-- 3. SCULPTED ATHLETIC HEAD SILHOUETTE (Clean, stylized, confident) -->
      <g id="head_layer">
        <!-- Ears Silhouette -->
        <ellipse cx="50" cy="76" rx="4.5" ry="7.5" fill="${skin.shadow}"/>
        <ellipse cx="110" cy="76" rx="4.5" ry="7.5" fill="${skin.base}"/>

        <!-- Athletic Jawline & Head Contour -->
        <path d="M 53 62 C 51 36, 109 36, 107 62 C 107 86, 98 112, 80 114 C 62 112, 53 86, 53 62 Z" fill="url(#${uid}_face_grad)"/>

        <!-- Sharp Cheekbone & Jaw Chisel Shadow -->
        <path d="M 54 66 C 54 84, 61 103, 75 111 C 62 103, 56 86, 56 66 Z" fill="${skin.deep}" opacity="0.35"/>
        <path d="M 106 66 C 106 84, 99 103, 85 111 C 98 103, 104 86, 104 66 Z" fill="${skin.rim}" opacity="0.45"/>

        <!-- Confident Athletic Brow Line & Eye Silhouette -->
        <path d="M 59 64 Q 69 61 77 64" stroke="${hair.fill}" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M 83 64 Q 91 61 101 64" stroke="${hair.fill}" stroke-width="3" stroke-linecap="round" fill="none"/>

        <!-- Focused Stylized Eyes (Clean Vector Slits with Iris Glow) -->
        <path d="M 64 72 Q 70 69 76 72 Q 70 75 64 72 Z" fill="#ffffff" opacity="0.9"/>
        <circle cx="70.5" cy="72" r="1.8" fill="${hair.fill}"/>
        <circle cx="71.2" cy="71.3" r="0.6" fill="#ffffff"/>

        <path d="M 84 72 Q 90 69 96 72 Q 90 75 84 72 Z" fill="#ffffff" opacity="0.9"/>
        <circle cx="89.5" cy="72" r="1.8" fill="${hair.fill}"/>
        <circle cx="90.2" cy="71.3" r="0.6" fill="#ffffff"/>

        <!-- Clean Chiseled Nose Bridge -->
        <path d="M 79 66 L 77 82 Q 80 85 83 82 L 81 66 Z" fill="${skin.shadow}" opacity="0.85"/>
        <circle cx="77.5" cy="83" r="1.2" fill="${skin.deep}"/>
        <circle cx="82.5" cy="83" r="1.2" fill="${skin.deep}"/>

        <!-- Confident Mouth -->
        <path d="M 72 93 Q 80 96 88 93" stroke="${skin.deep}" stroke-width="2.2" stroke-linecap="round" fill="none"/>

        <!-- Athletic Beard (if present) -->
        ${beardMarkup}
      </g>

      <!-- 4. HAIRSTYLE SILHOUETTE WITH CRISP RIM LIGHT -->
      <g id="hair_layer">
        ${hairMarkup}
      </g>

      <!-- 5. POSITIONAL BADGE EMBLEM GLOW ON TOP -->
      <g id="position_aura_tag" transform="translate(132, 22)">
        <circle cx="0" cy="0" r="11" fill="#0f172a" stroke="${aura.glow}" stroke-width="1.8" filter="drop-shadow(0 0 6px ${aura.glow})"/>
        <text x="0" y="3.5" font-family="'Space Grotesk', system-ui, sans-serif" font-size="7.5" font-weight="900" text-anchor="middle" fill="${aura.particle}">
          ${pos}
        </text>
      </g>
    </svg>
  `;
}
