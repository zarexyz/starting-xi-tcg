// =============================================================================
// Starting XI TCG — Procedural Vector Player Avatar Engine (SVG)
// High-contrast, stylized athletic player busts with dynamic lighting & club kits
// =============================================================================

// Simple deterministic hash from string to seed integer
function hashSeed(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Pseudo-random number generator from seed
function createPRNG(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const SKIN_TONES = [
  { base: '#f8d5b8', shadow: '#e2ab86', highlight: '#ffebdc' }, // Fair 1
  { base: '#eec19a', shadow: '#d1996c', highlight: '#fae0c9' }, // Fair/Warm
  { base: '#cf986d', shadow: '#b27448', highlight: '#dfaf86' }, // Olive/Tan
  { base: '#a86c47', shadow: '#834b28', highlight: '#c48962' }, // Caramel
  { base: '#7c4b2f', shadow: '#59321c', highlight: '#996343' }, // Warm Brown
  { base: '#4e2f1d', shadow: '#331d10', highlight: '#6b432d' }  // Deep Espresso
];

const HAIR_COLORS = [
  { main: '#1c1917', highlight: '#44403c' }, // Jet Black
  { main: '#292524', highlight: '#57534e' }, // Dark Brown
  { main: '#451a03', highlight: '#78350f' }, // Chestnut / Auburn
  { main: '#a16207', highlight: '#ca8a04' }, // Golden Brown
  { main: '#ca8a04', highlight: '#eab308' }, // Honey Blonde
  { main: '#e2e8f0', highlight: '#ffffff' }  // Platinum / Silver
];

export function generatePlayerAvatarSVG(player, options = {}) {
  const seed = hashSeed(player.id || player.name || 'avatar_seed');
  const rng = createPRNG(seed);

  const primaryColor = options.primaryColor || '#00f59b';
  const secondaryColor = options.secondaryColor || '#ffd15c';
  const isGoalkeeper = player.position === 'TW';

  // Deterministic choices
  const skin = SKIN_TONES[Math.floor(rng() * SKIN_TONES.length)];
  const hairColor = HAIR_COLORS[Math.floor(rng() * HAIR_COLORS.length)];
  const hairStyleIndex = Math.floor(rng() * 12);
  const hasFacialHair = (player.age || 25) > 21 && rng() > 0.45;
  const facialHairType = Math.floor(rng() * 4); // 0: stubble, 1: goatee, 2: trimmed beard, 3: full jaw
  const kitJerseyColor = isGoalkeeper ? '#f59e0b' : primaryColor;
  const kitAccentColor = isGoalkeeper ? '#1e293b' : secondaryColor;

  // Head and jaw coordinates
  // Canvas viewport: 0 0 160 170 (bust focus, torso clipped at bottom)
  const uid = `av_${player.id || Math.floor(rng() * 99999)}`;

  // Procedural Hair paths
  let hairPath = '';
  switch (hairStyleIndex) {
    case 0: // Buzzcut / Taper Fade
      hairPath = `
        <path d="M 52 64 C 52 38, 108 38, 108 64 C 108 72, 104 78, 104 78 C 100 68, 92 56, 80 56 C 68 56, 60 68, 56 78 Z" fill="${hairColor.main}"/>
        <path d="M 64 48 C 74 44, 86 44, 96 48 C 90 44, 70 44, 64 48 Z" fill="${hairColor.highlight}" opacity="0.6"/>
      `;
      break;
    case 1: // Modern Quiff / Pompadour
      hairPath = `
        <path d="M 50 64 C 48 30, 85 22, 106 32 C 114 36, 112 50, 108 64 C 102 54, 92 46, 78 46 C 64 46, 56 54, 50 64 Z" fill="${hairColor.main}"/>
        <path d="M 60 36 C 75 28, 95 30, 104 38 C 96 32, 75 32, 60 36 Z" fill="${hairColor.highlight}" opacity="0.75"/>
      `;
      break;
    case 2: // Curly High Top / Fade
      hairPath = `
        <path d="M 52 60 C 48 36, 56 26, 80 24 C 104 26, 112 36, 108 60 C 104 52, 94 44, 80 44 C 66 44, 56 52, 52 60 Z" fill="${hairColor.main}"/>
        <circle cx="65" cy="34" r="7" fill="${hairColor.main}"/>
        <circle cx="80" cy="30" r="8" fill="${hairColor.main}"/>
        <circle cx="95" cy="34" r="7" fill="${hairColor.main}"/>
        <circle cx="72" cy="38" r="6" fill="${hairColor.highlight}" opacity="0.5"/>
        <circle cx="88" cy="36" r="6" fill="${hairColor.highlight}" opacity="0.5"/>
      `;
      break;
    case 3: // Side Part / Classic Sweep
      hairPath = `
        <path d="M 48 64 C 46 36, 80 28, 108 36 C 112 50, 108 66, 108 66 C 102 56, 92 50, 82 50 C 66 50, 56 56, 48 64 Z" fill="${hairColor.main}"/>
        <path d="M 56 42 Q 80 34 100 42" stroke="${hairColor.highlight}" stroke-width="3" fill="none" opacity="0.6"/>
      `;
      break;
    case 4: // Dreadlocks / Braids with Headband
      hairPath = `
        <path d="M 50 62 C 48 32, 112 32, 110 62 Z" fill="${hairColor.main}"/>
        <path d="M 48 58 Q 80 52 112 58" stroke="#ffffff" stroke-width="4" fill="none"/>
        <path d="M 46 62 Q 40 85 44 95" stroke="${hairColor.main}" stroke-width="5" stroke-linecap="round" fill="none"/>
        <path d="M 52 64 Q 48 88 50 100" stroke="${hairColor.main}" stroke-width="5" stroke-linecap="round" fill="none"/>
        <path d="M 108 64 Q 112 88 110 100" stroke="${hairColor.main}" stroke-width="5" stroke-linecap="round" fill="none"/>
        <path d="M 114 62 Q 120 85 116 95" stroke="${hairColor.main}" stroke-width="5" stroke-linecap="round" fill="none"/>
      `;
      break;
    case 5: // Athletic Spikes
      hairPath = `
        <polygon points="50,62 55,38 65,48 75,30 85,48 95,32 105,44 110,62" fill="${hairColor.main}"/>
        <polygon points="68,44 75,34 82,44" fill="${hairColor.highlight}" opacity="0.6"/>
      `;
      break;
    case 6: // Wavy Medium Flow
      hairPath = `
        <path d="M 46 66 C 44 34, 116 34, 114 66 C 118 80, 114 96, 110 96 C 106 75, 102 54, 80 52 C 58 54, 54 75, 50 96 C 46 96, 42 80, 46 66 Z" fill="${hairColor.main}"/>
        <path d="M 60 44 C 74 38, 86 38, 100 44" stroke="${hairColor.highlight}" stroke-width="3" fill="none" opacity="0.5"/>
      `;
      break;
    case 7: // Top Knot / Man Bun
      hairPath = `
        <circle cx="80" cy="22" r="10" fill="${hairColor.main}"/>
        <path d="M 50 62 C 48 38, 112 38, 110 62 C 104 54, 94 48, 80 48 C 66 48, 56 54, 50 62 Z" fill="${hairColor.main}"/>
        <path d="M 74 24 Q 80 18 86 24" stroke="${hairColor.highlight}" stroke-width="2" fill="none" opacity="0.6"/>
      `;
      break;
    default: // Textured Crop
      hairPath = `
        <path d="M 50 62 C 48 36, 112 36, 110 62 C 102 54, 90 48, 80 48 C 70 48, 58 54, 50 62 Z" fill="${hairColor.main}"/>
        <path d="M 58 48 C 70 42, 90 42, 102 48" stroke="${hairColor.highlight}" stroke-width="3" stroke-dasharray="4,3" fill="none" opacity="0.7"/>
      `;
      break;
  }

  // Procedural Facial Hair
  let facialHairPath = '';
  if (hasFacialHair) {
    if (facialHairType === 0) {
      // Stubble
      facialHairPath = `
        <path d="M 64 100 C 68 114, 92 114, 96 100 C 94 116, 66 116, 64 100 Z" fill="${hairColor.main}" opacity="0.35"/>
      `;
    } else if (facialHairType === 1) {
      // Goatee
      facialHairPath = `
        <path d="M 72 96 Q 80 94 88 96 Q 80 100 72 96 Z" fill="${hairColor.main}"/>
        <path d="M 74 104 Q 80 102 86 104 C 86 114, 74 114, 74 104 Z" fill="${hairColor.main}"/>
      `;
    } else if (facialHairType === 2) {
      // Trimmed Beard
      facialHairPath = `
        <path d="M 57 82 C 60 106, 68 118, 80 119 C 92 118, 100 106, 103 82 C 106 102, 94 122, 80 122 C 66 122, 54 102, 57 82 Z" fill="${hairColor.main}"/>
        <path d="M 72 95 Q 80 93 88 95" stroke="${hairColor.main}" stroke-width="2.5" fill="none"/>
      `;
    } else {
      // Full jaw beard
      facialHairPath = `
        <path d="M 55 76 C 58 108, 68 122, 80 123 C 92 122, 102 108, 105 76 C 108 110, 96 126, 80 126 C 64 126, 52 110, 55 76 Z" fill="${hairColor.main}"/>
        <path d="M 70 94 Q 80 92 90 94 Q 80 98 70 94 Z" fill="${hairColor.main}"/>
      `;
    }
  }

  return `
    <svg viewBox="0 0 160 170" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="player-avatar-svg drop-shadow-md select-none">
      <defs>
        <!-- Dynamic Gradient for Jersey -->
        <linearGradient id="${uid}_jersey" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${kitJerseyColor}"/>
          <stop offset="100%" stop-color="${kitJerseyColor}" stop-opacity="0.75"/>
        </linearGradient>

        <!-- Athletic Rim Lighting on Jersey / Silhouette -->
        <linearGradient id="${uid}_rim" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.35"/>
          <stop offset="25%" stop-color="#ffffff" stop-opacity="0"/>
          <stop offset="85%" stop-color="#ffffff" stop-opacity="0"/>
          <stop offset="100%" stop-color="${kitAccentColor}" stop-opacity="0.5"/>
        </linearGradient>

        <!-- Shadow under neck -->
        <linearGradient id="${uid}_neck_shadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${skin.shadow}" stop-opacity="0.9"/>
          <stop offset="100%" stop-color="${skin.base}"/>
        </linearGradient>
      </defs>

      <!-- BASE TORSO & JERSEY -->
      <g id="torso">
        <!-- Shoulder & Chest Silhouette -->
        <path d="M 15 170 C 18 135, 42 122, 60 118 L 100 118 C 118 122, 142 135, 145 170 Z" fill="url(#${uid}_jersey)"/>
        <!-- Jersey Rim Light highlight -->
        <path d="M 15 170 C 18 135, 42 122, 60 118 L 100 118 C 118 122, 142 135, 145 170 Z" fill="url(#${uid}_rim)"/>

        <!-- Jersey Dynamic Accent Pattern (V-neck or center strip) -->
        <path d="M 70 120 L 80 138 L 90 120 Z" fill="${kitAccentColor}"/>
        <path d="M 76 138 L 80 170 L 84 170 L 84 138 Z" fill="${kitAccentColor}" opacity="0.6"/>

        <!-- Athletic collar seam -->
        <path d="M 60 118 Q 80 128 100 118" stroke="${kitAccentColor}" stroke-width="2.5" fill="none"/>
      </g>

      <!-- ATHLETIC NECK -->
      <g id="neck">
        <path d="M 66 94 L 66 122 Q 80 125 94 122 L 94 94 Z" fill="url(#${uid}_neck_shadow)"/>
        <!-- Sternal Notch & Traps muscle shadows -->
        <path d="M 76 114 Q 80 118 84 114" stroke="${skin.shadow}" stroke-width="1.8" fill="none" opacity="0.7"/>
        <path d="M 72 98 L 74 110" stroke="${skin.shadow}" stroke-width="1.2" opacity="0.4"/>
        <path d="M 88 98 L 86 110" stroke="${skin.highlight}" stroke-width="1.2" opacity="0.5"/>
      </g>

      <!-- HEAD & EARS -->
      <g id="head">
        <!-- Ears -->
        <ellipse cx="53" cy="78" rx="4" ry="7" fill="${skin.shadow}"/>
        <ellipse cx="107" cy="78" rx="4" ry="7" fill="${skin.base}"/>

        <!-- Athletic Head Base / Jawline -->
        <path d="M 56 64 C 54 44, 106 44, 104 64 C 104 88, 96 112, 80 114 C 64 112, 56 88, 56 64 Z" fill="${skin.base}"/>

        <!-- Left cheekbone shadow & Right highlight -->
        <path d="M 57 66 C 56 86, 64 104, 76 112 C 64 104, 58 86, 58 66 Z" fill="${skin.shadow}" opacity="0.35"/>
        <path d="M 103 66 C 104 86, 96 104, 84 112 C 96 104, 102 86, 102 66 Z" fill="${skin.highlight}" opacity="0.4"/>
      </g>

      <!-- FACIAL FEATURES -->
      <g id="face">
        <!-- Brows (Focused game face) -->
        <path d="M 63 68 Q 71 66 76 68" stroke="${hairColor.main}" stroke-width="2.6" stroke-linecap="round" fill="none"/>
        <path d="M 84 68 Q 89 66 97 68" stroke="${hairColor.main}" stroke-width="2.6" stroke-linecap="round" fill="none"/>

        <!-- Eyes -->
        <ellipse cx="69" cy="74" rx="3.2" ry="1.8" fill="#ffffff"/>
        <circle cx="70" cy="74" r="1.5" fill="${hairColor.main}"/>
        <circle cx="70.5" cy="73.5" r="0.5" fill="#ffffff"/>

        <ellipse cx="91" cy="74" rx="3.2" ry="1.8" fill="#ffffff"/>
        <circle cx="90" cy="74" r="1.5" fill="${hairColor.main}"/>
        <circle cx="90.5" cy="73.5" r="0.5" fill="#ffffff"/>

        <!-- Nose -->
        <path d="M 80 72 L 78 84 Q 80 86 82 84 Z" fill="${skin.shadow}"/>
        <ellipse cx="77" cy="85" rx="1.2" ry="0.8" fill="${skin.shadow}"/>
        <ellipse cx="83" cy="85" rx="1.2" ry="0.8" fill="${skin.shadow}"/>

        <!-- Mouth (Determined grin) -->
        <path d="M 74 94 Q 80 97 86 94" stroke="${skin.shadow}" stroke-width="2" stroke-linecap="round" fill="none"/>
        <path d="M 77 98 Q 80 99 83 98" stroke="${skin.shadow}" stroke-width="1.2" opacity="0.6" fill="none"/>

        <!-- Facial Hair (if any) -->
        ${facialHairPath}
      </g>

      <!-- HAIR STYLE -->
      <g id="hair">
        ${hairPath}
      </g>
    </svg>
  `;
}
