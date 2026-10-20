// =============================================================================
// Starting XI TCG — Premium Stylized Athletic Player Avatar Engine (SVG)
// High-detail athletic character busts with realistic proportions, lighting & club crests
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
  { base: '#f5cbb0', shadow: '#d19472', deep: '#a36242', highlight: '#ffe8d9' },
  { base: '#e0ab82', shadow: '#b8764e', deep: '#8a4b27', highlight: '#f7d3b8' },
  { base: '#c0855c', shadow: '#965832', deep: '#693717', highlight: '#dda783' },
  { base: '#945b37', shadow: '#6e391b', deep: '#4a210b', highlight: '#b57954' },
  { base: '#683b1f', shadow: '#46220e', deep: '#2c1205', highlight: '#895535' },
  { base: '#3d2214', shadow: '#261208', deep: '#150803', highlight: '#583623' }
];

const HAIR_PALETTES = [
  { main: '#121212', mid: '#242424', light: '#454545' }, // Jet Black
  { main: '#241611', mid: '#3d251d', light: '#5e3a2f' }, // Dark Brown
  { main: '#421d0d', mid: '#66321a', light: '#8c4827' }, // Auburn / Chestnut
  { main: '#78501c', mid: '#9e6d2b', light: '#c48f43' }, // Warm Honey
  { main: '#b38d3b', mid: '#cca64f', light: '#fae38e' }, // Golden Blonde
  { main: '#94a3b8', mid: '#cbd5e1', light: '#ffffff' }  // Platinum / Silver
];

export function generatePlayerAvatarSVG(player, options = {}) {
  const seed = hashSeed(player.id || player.name || 'avatar_seed_v3');
  const rng = createPRNG(seed);

  const primaryColor = options.primaryColor || '#00f59b';
  const secondaryColor = options.secondaryColor || '#ffd15c';
  const isGoalkeeper = player.position === 'TW';

  const skin = SKIN_TONES[Math.floor(rng() * SKIN_TONES.length)];
  const hair = HAIR_PALETTES[Math.floor(rng() * HAIR_PALETTES.length)];
  const hairStyle = Math.floor(rng() * 8);
  const hasBeard = (player.age || 25) >= 22 && rng() > 0.45;
  const beardStyle = Math.floor(rng() * 3);

  const kitColor = isGoalkeeper ? '#ea580c' : primaryColor;
  const accentColor = isGoalkeeper ? '#fed7aa' : secondaryColor;
  const uid = `av3_${(player.id || 'p').replace(/[^a-zA-Z0-9]/g, '')}_${Math.floor(rng() * 9999)}`;

  // Dynamic Hairstyles
  let hairMarkup = '';
  switch (hairStyle) {
    case 0: // Taper Fade with Clean Part
      hairMarkup = `
        <path d="M 48 64 C 48 32, 112 32, 112 64 C 112 74, 108 82, 108 82 C 104 68, 95 54, 80 54 C 65 54, 56 68, 52 82 Z" fill="url(#${uid}_hair_grad)"/>
        <path d="M 58 48 Q 80 40 102 48" stroke="${hair.light}" stroke-width="2.5" fill="none" opacity="0.6"/>
        <line x1="62" y1="46" x2="68" y2="52" stroke="#ffffff" stroke-width="1.5" opacity="0.4"/>
      `;
      break;
    case 1: // Textured Athletic Quiff
      hairMarkup = `
        <path d="M 46 64 C 42 22, 85 14, 110 26 C 118 30, 116 46, 112 64 C 105 50, 93 42, 78 42 C 63 42, 53 50, 46 64 Z" fill="url(#${uid}_hair_grad)"/>
        <path d="M 56 36 Q 78 24 105 34" stroke="${hair.light}" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.8"/>
        <path d="M 62 46 Q 82 34 100 42" stroke="${hair.light}" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.6"/>
      `;
      break;
    case 2: // Curly Afro Fade
      hairMarkup = `
        <path d="M 48 62 C 44 30, 52 18, 80 16 C 108 18, 116 30, 112 62 C 106 50, 94 42, 80 42 C 66 42, 54 50, 48 62 Z" fill="url(#${uid}_hair_grad)"/>
        <circle cx="60" cy="26" r="9" fill="${hair.mid}"/>
        <circle cx="78" cy="20" r="10" fill="${hair.mid}"/>
        <circle cx="98" cy="25" r="9" fill="${hair.mid}"/>
        <circle cx="68" cy="32" r="7" fill="${hair.light}" opacity="0.45"/>
        <circle cx="88" cy="30" r="7" fill="${hair.light}" opacity="0.45"/>
      `;
      break;
    case 3: // Undercut Slick
      hairMarkup = `
        <path d="M 44 64 C 42 28, 84 18, 112 28 C 116 42, 112 64, 112 64 C 105 52, 94 46, 80 46 C 63 46, 53 52, 44 64 Z" fill="url(#${uid}_hair_grad)"/>
        <path d="M 52 38 Q 80 26 104 34" stroke="${hair.light}" stroke-width="3" fill="none" opacity="0.75"/>
      `;
      break;
    case 4: // Braids / Dreads with Pro Headband
      hairMarkup = `
        <path d="M 46 62 C 44 26, 116 26, 114 62 Z" fill="url(#${uid}_hair_grad)"/>
        <path d="M 46 58 Q 80 48 114 58" stroke="#ffffff" stroke-width="5" fill="none"/>
        <path d="M 42 64 Q 36 88 40 104" stroke="${hair.main}" stroke-width="5.5" stroke-linecap="round" fill="none"/>
        <path d="M 48 66 Q 44 94 46 108" stroke="${hair.mid}" stroke-width="5.5" stroke-linecap="round" fill="none"/>
        <path d="M 112 66 Q 116 94 114 108" stroke="${hair.mid}" stroke-width="5.5" stroke-linecap="round" fill="none"/>
        <path d="M 118 64 Q 124 88 120 104" stroke="${hair.main}" stroke-width="5.5" stroke-linecap="round" fill="none"/>
      `;
      break;
    case 5: // Athletic Spikes
      hairMarkup = `
        <polygon points="46,64 52,30 64,44 76,22 88,44 100,24 108,40 114,64" fill="url(#${uid}_hair_grad)"/>
        <polygon points="68,40 76,28 84,40" fill="${hair.light}" opacity="0.8"/>
      `;
      break;
    case 6: // Wavy Mid Flow
      hairMarkup = `
        <path d="M 42 66 C 40 26, 120 26, 118 66 C 122 84, 118 102, 112 102 C 108 78, 104 52, 80 50 C 56 52, 52 78, 48 102 C 42 102, 38 84, 42 66 Z" fill="url(#${uid}_hair_grad)"/>
        <path d="M 56 38 Q 80 30 104 38" stroke="${hair.light}" stroke-width="3" fill="none" opacity="0.7"/>
      `;
      break;
    default: // Textured Athletic Crop
      hairMarkup = `
        <path d="M 46 64 C 44 30, 116 30, 114 64 C 105 52, 92 44, 80 44 C 67 44, 55 52, 46 64 Z" fill="url(#${uid}_hair_grad)"/>
        <path d="M 54 44 Q 80 36 106 44" stroke="${hair.light}" stroke-width="2.5" fill="none" opacity="0.7"/>
      `;
  }

  // Facial Hair
  let beardMarkup = '';
  if (hasBeard) {
    if (beardStyle === 0) {
      // 5 o'clock shadow
      beardMarkup = `
        <path d="M 60 102 C 64 118, 96 118, 100 102 C 96 120, 64 120, 60 102 Z" fill="${hair.main}" opacity="0.35"/>
      `;
    } else if (beardStyle === 1) {
      // Trimmed Beard
      beardMarkup = `
        <path d="M 55 82 C 58 108, 66 123, 80 124 C 94 123, 102 108, 105 82 C 109 104, 96 128, 80 128 C 64 128, 51 104, 55 82 Z" fill="${hair.main}"/>
        <path d="M 68 98 Q 80 96 92 98" stroke="${hair.main}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      `;
    } else {
      // Goatee
      beardMarkup = `
        <path d="M 71 96 Q 80 93 89 96 Q 80 100 71 96 Z" fill="${hair.main}"/>
        <path d="M 73 105 Q 80 103 87 105 C 87 117, 73 117, 73 105 Z" fill="${hair.main}"/>
      `;
    }
  }

  return `
    <svg viewBox="0 0 160 170" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="player-avatar-svg drop-shadow-md select-none">
      <defs>
        <!-- 3D Face Shading Gradient -->
        <radialGradient id="${uid}_face_grad" cx="54%" cy="38%" r="56%">
          <stop offset="0%" stop-color="${skin.highlight}"/>
          <stop offset="45%" stop-color="${skin.base}"/>
          <stop offset="82%" stop-color="${skin.shadow}"/>
          <stop offset="100%" stop-color="${skin.deep}"/>
        </radialGradient>

        <!-- Athletic Neck Shadow -->
        <linearGradient id="${uid}_neck_grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${skin.deep}"/>
          <stop offset="65%" stop-color="${skin.shadow}"/>
          <stop offset="100%" stop-color="${skin.base}"/>
        </linearGradient>

        <!-- Hair Gradient -->
        <linearGradient id="${uid}_hair_grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${hair.mid}"/>
          <stop offset="100%" stop-color="${hair.main}"/>
        </linearGradient>

        <!-- Jersey Fabric Gradient with Shoulder Lighting -->
        <linearGradient id="${uid}_jersey_grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${kitColor}"/>
          <stop offset="60%" stop-color="${kitColor}"/>
          <stop offset="100%" stop-color="#0a0f1d"/>
        </linearGradient>

        <!-- Dynamic Specular Rim Light -->
        <linearGradient id="${uid}_rim_light" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.5"/>
          <stop offset="20%" stop-color="#ffffff" stop-opacity="0"/>
          <stop offset="78%" stop-color="#ffffff" stop-opacity="0"/>
          <stop offset="100%" stop-color="${accentColor}" stop-opacity="0.7"/>
        </linearGradient>
      </defs>

      <!-- 1. TORSO & JERSEY -->
      <g id="jersey_layer">
        <!-- Shoulder & Chest Mesh -->
        <path d="M 10 170 C 14 130, 42 118, 60 114 L 100 114 C 118 118, 146 130, 150 170 Z" fill="url(#${uid}_jersey_grad)"/>
        <path d="M 10 170 C 14 130, 42 118, 60 114 L 100 114 C 118 118, 146 130, 150 170 Z" fill="url(#${uid}_rim_light)"/>

        <!-- Athletic V-Collar -->
        <path d="M 58 114 Q 80 128 102 114 L 95 132 Q 80 144 65 132 Z" fill="${accentColor}"/>
        <path d="M 68 118 Q 80 134 92 118 L 80 136 Z" fill="#0f172a"/>

        <!-- Shoulder Seams -->
        <path d="M 30 144 L 58 114" stroke="${accentColor}" stroke-width="2" stroke-opacity="0.6" fill="none"/>
        <path d="M 130 144 L 102 114" stroke="${accentColor}" stroke-width="2" stroke-opacity="0.6" fill="none"/>

        <!-- Mini Club Crest Badge on Left Chest -->
        <circle cx="48" cy="142" r="6" fill="#0f172a" stroke="${accentColor}" stroke-width="1.2"/>
        <polygon points="48,139 51,145 45,145" fill="${accentColor}"/>
      </g>

      <!-- 2. ATHLETIC NECK & TRAPS -->
      <g id="neck_layer">
        <path d="M 63 90 L 63 122 Q 80 126 97 122 L 97 90 Z" fill="url(#${uid}_neck_grad)"/>
        <path d="M 72 96 L 76 114" stroke="${skin.deep}" stroke-width="2" stroke-linecap="round" opacity="0.65"/>
        <path d="M 88 96 L 84 114" stroke="${skin.highlight}" stroke-width="1.8" stroke-linecap="round" opacity="0.55"/>
        <path d="M 78 116 Q 80 119 82 116" stroke="${skin.deep}" stroke-width="2" fill="none" opacity="0.7"/>
      </g>

      <!-- 3. HEAD & JAW (ATHLETIC) -->
      <g id="head_layer">
        <!-- Ears -->
        <ellipse cx="50" cy="78" rx="4.5" ry="7.5" fill="${skin.shadow}"/>
        <ellipse cx="51" cy="78" rx="2.5" ry="4.5" fill="${skin.deep}"/>
        <ellipse cx="110" cy="78" rx="4.5" ry="7.5" fill="${skin.base}"/>
        <ellipse cx="109" cy="78" rx="2.5" ry="4.5" fill="${skin.shadow}"/>

        <!-- Athletic Sculpted Head -->
        <path d="M 53 64 C 51 38, 109 38, 107 64 C 107 88, 98 114, 80 116 C 62 114, 53 88, 53 64 Z" fill="url(#${uid}_face_grad)"/>

        <!-- Cheekbone & Jaw Definition -->
        <path d="M 54 68 C 54 86, 61 105, 75 113 C 62 105, 56 88, 56 68 Z" fill="${skin.deep}" opacity="0.38"/>
        <path d="M 106 68 C 106 86, 99 105, 85 113 C 98 105, 104 88, 104 68 Z" fill="${skin.highlight}" opacity="0.4"/>
      </g>

      <!-- 4. FACIAL FEATURES (DETAILED ATHLETIC LOOK) -->
      <g id="features_layer">
        <!-- Brows -->
        <path d="M 60 66 Q 70 63 78 66" stroke="${hair.main}" stroke-width="3.2" stroke-linecap="round" fill="none"/>
        <path d="M 82 66 Q 90 63 100 66" stroke="${hair.main}" stroke-width="3.2" stroke-linecap="round" fill="none"/>

        <!-- Eyes with Realistic Depth -->
        <ellipse cx="69" cy="73.5" rx="3.8" ry="2.2" fill="#ffffff"/>
        <circle cx="70" cy="73.5" r="1.8" fill="${hair.main}"/>
        <circle cx="70.8" cy="72.8" r="0.7" fill="#ffffff"/>

        <ellipse cx="91" cy="73.5" rx="3.8" ry="2.2" fill="#ffffff"/>
        <circle cx="90" cy="73.5" r="1.8" fill="${hair.main}"/>
        <circle cx="90.8" cy="72.8" r="0.7" fill="#ffffff"/>

        <!-- Nose -->
        <path d="M 79 68 L 77 84 Q 80 87 83 84 L 81 68 Z" fill="${skin.shadow}"/>
        <circle cx="77" cy="85" r="1.3" fill="${skin.deep}"/>
        <circle cx="83" cy="85" r="1.3" fill="${skin.deep}"/>
        <ellipse cx="80" cy="83.5" rx="1.2" ry="0.6" fill="${skin.highlight}"/>

        <!-- Mouth -->
        <path d="M 72 95 Q 80 98 88 95" stroke="${skin.deep}" stroke-width="2.4" stroke-linecap="round" fill="none"/>
        <path d="M 76 99 Q 80 100 84 99" stroke="${skin.shadow}" stroke-width="1.6" stroke-linecap="round" fill="none"/>

        <!-- Beard -->
        ${beardMarkup}
      </g>

      <!-- 5. HAIR -->
      <g id="hair_layer">
        ${hairMarkup}
      </g>
    </svg>
  `;
}
