// =============================================================================
// Starting XI TCG — Upgraded Procedural Athletic Player Avatar Engine (SVG)
// High-contrast, stylized 3D-shaded athletic player busts with rim lighting & jersey details
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

const SKIN_TONES = [
  { base: '#f7cfb0', shadow: '#d69d78', deepShadow: '#a66846', highlight: '#ffe8d6' },
  { base: '#e4b288', shadow: '#ba8056', deepShadow: '#8e5630', highlight: '#f5d3b3' },
  { base: '#c68c62', shadow: '#9c6139', deepShadow: '#6e3c1a', highlight: '#dfaa83' },
  { base: '#99633e', shadow: '#744020', deepShadow: '#4e250e', highlight: '#b98059' },
  { base: '#6e4125', shadow: '#4d2812', deepShadow: '#2f1506', highlight: '#8d5939' },
  { base: '#442616', shadow: '#2c150a', deepShadow: '#190a04', highlight: '#5e3722' }
];

const HAIR_PALETTES = [
  { base: '#151414', mid: '#2a2828', highlight: '#4a4646' }, // Jet Black
  { base: '#2b1b17', mid: '#422822', highlight: '#633e36' }, // Dark Espresso
  { base: '#4a2311', mid: '#6e391f', highlight: '#995431' }, // Chestnut / Auburn
  { base: '#8a5c21', mid: '#ad7b34', highlight: '#d19d4e' }, // Golden Brown
  { base: '#c49a3c', mid: '#deb759', highlight: '#fae08c' }, // Blonde
  { base: '#cbd5e1', mid: '#e2e8f0', highlight: '#ffffff' }  // Platinum / Silver
];

export function generatePlayerAvatarSVG(player, options = {}) {
  const seed = hashSeed(player.id || player.name || 'avatar_seed_v2');
  const rng = createPRNG(seed);

  const primaryColor = options.primaryColor || '#00f59b';
  const secondaryColor = options.secondaryColor || '#ffd15c';
  const isGoalkeeper = player.position === 'TW';

  const skin = SKIN_TONES[Math.floor(rng() * SKIN_TONES.length)];
  const hair = HAIR_PALETTES[Math.floor(rng() * HAIR_PALETTES.length)];
  const hairStyle = Math.floor(rng() * 10);
  const hasBeard = (player.age || 25) >= 22 && rng() > 0.45;
  const beardStyle = Math.floor(rng() * 3); // 0: stubble, 1: trimmed beard, 2: athletic goatee

  const kitColor = isGoalkeeper ? '#ea580c' : primaryColor;
  const accentColor = isGoalkeeper ? '#fed7aa' : secondaryColor;
  const uid = `av2_${(player.id || 'p').replace(/[^a-zA-Z0-9]/g, '')}_${Math.floor(rng() * 9999)}`;

  // Procedural Hair Models
  let hairMarkup = '';
  switch (hairStyle) {
    case 0: // Taper Fade / Buzz
      hairMarkup = `
        <path d="M 50 66 C 50 36, 110 36, 110 66 C 110 75, 106 82, 106 82 C 102 70, 94 56, 80 56 C 66 56, 58 70, 54 82 Z" fill="url(#${uid}_hair_grad)"/>
        <path d="M 60 52 C 72 46, 88 46, 100 52" stroke="${hair.highlight}" stroke-width="2.5" fill="none" opacity="0.6"/>
      `;
      break;
    case 1: // Modern Textured Quiff
      hairMarkup = `
        <path d="M 48 64 C 44 26, 84 18, 108 28 C 116 32, 114 48, 110 64 C 104 52, 92 44, 78 44 C 64 44, 54 52, 48 64 Z" fill="url(#${uid}_hair_grad)"/>
        <!-- Hair strands / flow -->
        <path d="M 58 38 Q 78 26 104 36" stroke="${hair.highlight}" stroke-width="3.5" stroke-linecap="round" fill="none" opacity="0.75"/>
        <path d="M 64 48 Q 82 36 98 44" stroke="${hair.highlight}" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.6"/>
      `;
      break;
    case 2: // Curly Afro Fade
      hairMarkup = `
        <path d="M 50 62 C 46 32, 54 22, 80 20 C 106 22, 114 32, 110 62 C 104 52, 92 44, 80 44 C 68 44, 56 52, 50 62 Z" fill="url(#${uid}_hair_grad)"/>
        <circle cx="62" cy="30" r="8" fill="${hair.mid}"/>
        <circle cx="78" cy="24" r="9" fill="${hair.mid}"/>
        <circle cx="96" cy="28" r="8" fill="${hair.mid}"/>
        <circle cx="68" cy="34" r="6" fill="${hair.highlight}" opacity="0.5"/>
        <circle cx="88" cy="32" r="6" fill="${hair.highlight}" opacity="0.5"/>
      `;
      break;
    case 3: // Classic Undercut Sweep
      hairMarkup = `
        <path d="M 46 64 C 44 32, 82 22, 110 32 C 114 46, 110 64, 110 64 C 104 54, 94 48, 80 48 C 64 48, 54 54, 46 64 Z" fill="url(#${uid}_hair_grad)"/>
        <path d="M 54 40 Q 80 30 102 38" stroke="${hair.highlight}" stroke-width="3" fill="none" opacity="0.7"/>
        <path d="M 62 48 Q 82 40 98 46" stroke="${hair.highlight}" stroke-width="2" fill="none" opacity="0.5"/>
      `;
      break;
    case 4: // Braids / Dreads with Headband
      hairMarkup = `
        <path d="M 48 62 C 46 30, 114 30, 112 62 Z" fill="url(#${uid}_hair_grad)"/>
        <!-- Athletic Headband -->
        <path d="M 48 58 Q 80 50 112 58" stroke="#ffffff" stroke-width="4.5" fill="none"/>
        <path d="M 44 64 Q 38 88 42 102" stroke="${hair.base}" stroke-width="5" stroke-linecap="round" fill="none"/>
        <path d="M 50 66 Q 46 92 48 106" stroke="${hair.mid}" stroke-width="5" stroke-linecap="round" fill="none"/>
        <path d="M 110 66 Q 114 92 112 106" stroke="${hair.mid}" stroke-width="5" stroke-linecap="round" fill="none"/>
        <path d="M 116 64 Q 122 88 118 102" stroke="${hair.base}" stroke-width="5" stroke-linecap="round" fill="none"/>
      `;
      break;
    case 5: // Athletic Spikes
      hairMarkup = `
        <polygon points="48,64 54,34 65,46 76,26 86,46 97,28 106,42 112,64" fill="url(#${uid}_hair_grad)"/>
        <polygon points="68,42 76,30 84,42" fill="${hair.highlight}" opacity="0.7"/>
      `;
      break;
    case 6: // Wavy Surfer Flow
      hairMarkup = `
        <path d="M 44 66 C 42 30, 118 30, 116 66 C 120 84, 116 102, 110 102 C 106 80, 102 54, 80 52 C 58 54, 54 80, 50 102 C 44 102, 40 84, 44 66 Z" fill="url(#${uid}_hair_grad)"/>
        <path d="M 58 42 Q 80 34 102 42" stroke="${hair.highlight}" stroke-width="3" fill="none" opacity="0.6"/>
      `;
      break;
    default: // Clean Textured Crop
      hairMarkup = `
        <path d="M 48 64 C 46 34, 114 34, 112 64 C 104 54, 92 46, 80 46 C 68 46, 56 54, 48 64 Z" fill="url(#${uid}_hair_grad)"/>
        <path d="M 56 46 Q 80 38 104 46" stroke="${hair.highlight}" stroke-width="2.5" fill="none" opacity="0.6"/>
      `;
  }

  // Facial Hair
  let beardMarkup = '';
  if (hasBeard) {
    if (beardStyle === 0) {
      // 5 o'clock shadow
      beardMarkup = `
        <path d="M 62 102 C 66 116, 94 116, 98 102 C 94 118, 66 118, 62 102 Z" fill="${hair.base}" opacity="0.3"/>
      `;
    } else if (beardStyle === 1) {
      // Trimmed Beard & Stubble
      beardMarkup = `
        <path d="M 56 82 C 59 108, 67 122, 80 123 C 93 122, 101 108, 104 82 C 108 104, 95 127, 80 127 C 65 127, 52 104, 56 82 Z" fill="${hair.base}"/>
        <path d="M 70 98 Q 80 96 90 98" stroke="${hair.base}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      `;
    } else {
      // Goatee
      beardMarkup = `
        <path d="M 72 96 Q 80 94 88 96 Q 80 100 72 96 Z" fill="${hair.base}"/>
        <path d="M 74 105 Q 80 103 86 105 C 86 116, 74 116, 74 105 Z" fill="${hair.base}"/>
      `;
    }
  }

  return `
    <svg viewBox="0 0 160 170" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="player-avatar-svg drop-shadow-md select-none">
      <defs>
        <!-- 3D Face Shading Gradient -->
        <radialGradient id="${uid}_face_grad" cx="55%" cy="40%" r="55%">
          <stop offset="0%" stop-color="${skin.highlight}"/>
          <stop offset="50%" stop-color="${skin.base}"/>
          <stop offset="85%" stop-color="${skin.shadow}"/>
          <stop offset="100%" stop-color="${skin.deepShadow}"/>
        </radialGradient>

        <!-- Athletic Neck Shadow -->
        <linearGradient id="${uid}_neck_grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${skin.deepShadow}"/>
          <stop offset="65%" stop-color="${skin.shadow}"/>
          <stop offset="100%" stop-color="${skin.base}"/>
        </linearGradient>

        <!-- Hair Gradient -->
        <linearGradient id="${uid}_hair_grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${hair.mid}"/>
          <stop offset="100%" stop-color="${hair.base}"/>
        </linearGradient>

        <!-- Jersey Fabric Gradient with Shoulder Lighting -->
        <linearGradient id="${uid}_jersey_grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${kitColor}"/>
          <stop offset="50%" stop-color="${kitColor}"/>
          <stop offset="100%" stop-color="#0a0f1d"/>
        </linearGradient>

        <!-- Dynamic Specular Rim Light -->
        <linearGradient id="${uid}_rim_light" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.4"/>
          <stop offset="25%" stop-color="#ffffff" stop-opacity="0"/>
          <stop offset="80%" stop-color="#ffffff" stop-opacity="0"/>
          <stop offset="100%" stop-color="${accentColor}" stop-opacity="0.6"/>
        </linearGradient>
      </defs>

      <!-- 1. TORSO & JERSEY -->
      <g id="jersey_layer">
        <!-- Shoulder & Chest Mesh -->
        <path d="M 12 170 C 16 132, 42 120, 60 116 L 100 116 C 118 120, 144 132, 148 170 Z" fill="url(#${uid}_jersey_grad)"/>
        <path d="M 12 170 C 16 132, 42 120, 60 116 L 100 116 C 118 120, 144 132, 148 170 Z" fill="url(#${uid}_rim_light)"/>

        <!-- Athletic Collar & V-Neck Inset -->
        <path d="M 60 116 Q 80 128 100 116 L 94 132 Q 80 144 66 132 Z" fill="${accentColor}"/>
        <path d="M 68 120 Q 80 134 92 120 L 80 138 Z" fill="#111827"/>

        <!-- Shoulder Seams -->
        <path d="M 32 144 L 60 116" stroke="${accentColor}" stroke-width="2" stroke-opacity="0.6" fill="none"/>
        <path d="M 128 144 L 100 116" stroke="${accentColor}" stroke-width="2" stroke-opacity="0.6" fill="none"/>
      </g>

      <!-- 2. ATHLETIC NECK & TRAPS -->
      <g id="neck_layer">
        <path d="M 64 92 L 64 122 Q 80 126 96 122 L 96 92 Z" fill="url(#${uid}_neck_grad)"/>
        <!-- Sternocleidomastoid Muscle Definition -->
        <path d="M 72 96 L 76 114" stroke="${skin.deepShadow}" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
        <path d="M 88 96 L 84 114" stroke="${skin.highlight}" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
        <path d="M 78 116 Q 80 119 82 116" stroke="${skin.deepShadow}" stroke-width="1.8" fill="none" opacity="0.7"/>
      </g>

      <!-- 3. HEAD & JAW (SCULPTED) -->
      <g id="head_layer">
        <!-- Ears with Depth -->
        <ellipse cx="51" cy="78" rx="4.5" ry="7.5" fill="${skin.shadow}"/>
        <ellipse cx="52" cy="78" rx="2.5" ry="4.5" fill="${skin.deepShadow}"/>
        <ellipse cx="109" cy="78" rx="4.5" ry="7.5" fill="${skin.base}"/>
        <ellipse cx="108" cy="78" rx="2.5" ry="4.5" fill="${skin.shadow}"/>

        <!-- Athletic Jawline & Head -->
        <path d="M 54 64 C 52 40, 108 40, 106 64 C 106 88, 97 114, 80 116 C 63 114, 54 88, 54 64 Z" fill="url(#${uid}_face_grad)"/>

        <!-- Cheekbone & Jaw Shadows -->
        <path d="M 55 68 C 55 86, 62 105, 75 113 C 63 105, 57 88, 57 68 Z" fill="${skin.deepShadow}" opacity="0.35"/>
        <path d="M 105 68 C 105 86, 98 105, 85 113 C 97 105, 103 88, 103 68 Z" fill="${skin.highlight}" opacity="0.35"/>
      </g>

      <!-- 4. FACIAL FEATURES (HIGH CONTRAST) -->
      <g id="features_layer">
        <!-- Brows (Athletic Game Face) -->
        <path d="M 61 67 Q 70 64 77 67" stroke="${hair.base}" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M 83 67 Q 90 64 99 67" stroke="${hair.base}" stroke-width="3" stroke-linecap="round" fill="none"/>

        <!-- Eyes with Iris & Specular Highlight -->
        <ellipse cx="69" cy="74" rx="3.5" ry="2" fill="#ffffff"/>
        <circle cx="70" cy="74" r="1.6" fill="${hair.base}"/>
        <circle cx="70.6" cy="73.4" r="0.6" fill="#ffffff"/>

        <ellipse cx="91" cy="74" rx="3.5" ry="2" fill="#ffffff"/>
        <circle cx="90" cy="74" r="1.6" fill="${hair.base}"/>
        <circle cx="90.6" cy="73.4" r="0.6" fill="#ffffff"/>

        <!-- Nose (Sculpted with Bridge & Shadow) -->
        <path d="M 79 69 L 77 84 Q 80 87 83 84 L 81 69 Z" fill="${skin.shadow}"/>
        <circle cx="77" cy="85" r="1.2" fill="${skin.deepShadow}"/>
        <circle cx="83" cy="85" r="1.2" fill="${skin.deepShadow}"/>
        <ellipse cx="80" cy="84" rx="1" ry="0.6" fill="${skin.highlight}"/>

        <!-- Mouth -->
        <path d="M 73 95 Q 80 98 87 95" stroke="${skin.deepShadow}" stroke-width="2.2" stroke-linecap="round" fill="none"/>
        <path d="M 76 99 Q 80 100 84 99" stroke="${skin.shadow}" stroke-width="1.5" stroke-linecap="round" fill="none"/>

        <!-- Beard / Stubble -->
        ${beardMarkup}
      </g>

      <!-- 5. HAIR -->
      <g id="hair_layer">
        ${hairMarkup}
      </g>
    </svg>
  `;
}
