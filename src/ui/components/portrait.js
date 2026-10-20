// =============================================================================
// Porträt-Generator: illustrierte Spielerköpfe im einheitlichen Stil
// Licht kommt immer von links oben. Jede Kombination entsteht aus player.look.
// =============================================================================

let uid = 0;

const SKIN = [
  ['#f7dcc8', '#e9bfa3'], ['#f0c6a6', '#dca482'], ['#e2aa84', '#c98d66'],
  ['#c98c62', '#ab6f48'], ['#a86c45', '#8a5433'], ['#7e4b2c', '#643820'], ['#5c3520', '#452514']
];

const HAIR = ['#1f1712', '#3a2517', '#6a4322', '#c69a55', '#9c4220'];

function shade(hex, amt) {
  const c = hex.replace('#', '');
  const ch = i => Math.max(0, Math.min(255, Math.round(parseInt(c.slice(i, i + 2), 16) * (1 + amt))));
  return `#${[0, 2, 4].map(i => ch(i).toString(16).padStart(2, '0')).join('')}`;
}

function mix(a, b, t) {
  const pa = a.replace('#', '');
  const pb = b.replace('#', '');
  const ch = i => Math.round(parseInt(pa.slice(i, i + 2), 16) * (1 - t) + parseInt(pb.slice(i, i + 2), 16) * t);
  return `#${[0, 2, 4].map(i => ch(i).toString(16).padStart(2, '0')).join('')}`;
}

/** Gesichtsformen: Wangenbreite, Kieferbreite, Kinnhöhe */
const FACES = [
  { w: 35, jw: 19, chin: 143 }, // oval
  { w: 37, jw: 27, chin: 140 }, // kantig
  { w: 38, jw: 23, chin: 138 }, // rund
  { w: 33, jw: 19, chin: 146 } // lang
];

function facePath(f) {
  const { w, jw, chin } = f;
  return `M100 47 C${100 + w * 0.92} 47 ${100 + w} 68 ${100 + w} 94 C${100 + w} 117 ${100 + jw + 6} 130 100 ${chin} C${100 - jw - 6} 130 ${100 - w} 117 ${100 - w} 94 C${100 - w} 68 ${100 - w * 0.92} 47 100 47 Z`;
}

function hairBack(style, f, color) {
  const w = f.w;
  switch (style) {
    case 5: // Afro
      return `<path d="M100 14 C${100 + w + 26} 14 ${100 + w + 30} 50 ${100 + w + 22} 82 C${100 + w + 16} 100 ${100 + w + 4} 106 ${100 + w} 100 L${100 - w} 100 C${100 - w - 4} 106 ${100 - w - 16} 100 ${100 - w - 22} 82 C${100 - w - 30} 50 ${100 - w - 26} 14 100 14 Z" fill="${color}"/>`;
    case 7: // lang
      return `<path d="M${100 - w - 6} 70 C${100 - w - 10} 120 ${100 - w - 8} 150 ${100 - w + 4} 168 L${100 + w - 4} 168 C${100 + w + 8} 150 ${100 + w + 10} 120 ${100 + w + 6} 70 Z" fill="${shade(color, -0.12)}"/>`;
    case 6: // Dutt
      return `<circle cx="100" cy="32" r="13" fill="${color}"/><circle cx="96" cy="28" r="4" fill="#fff" opacity="0.08"/>`;
    default:
      return '';
  }
}

function hairFront(style, f, color) {
  const w = f.w;
  const hi = shade(color, 0.35);
  switch (style) {
    case 0: // Buzzcut
      return `<path d="M${100 - w} 82 C${100 - w - 1} 56 ${100 - w * 0.6} 43 100 42 C${100 + w * 0.6} 43 ${100 + w + 1} 56 ${100 + w} 82 C${100 + w - 4} 70 ${100 + w * 0.5} 58 100 58 C${100 - w * 0.5} 58 ${100 - w + 4} 70 ${100 - w} 82 Z" fill="${color}" opacity="0.88"/>`;
    case 1: // kurz
      return `<path d="M${100 - w - 2} 84 C${100 - w - 4} 52 ${100 - w * 0.6} 36 100 36 C${100 + w * 0.6} 36 ${100 + w + 4} 52 ${100 + w + 2} 84 C${100 + w - 3} 70 ${100 + w - 6} 62 ${100 + 18} 60 C${100 + 6} 64 ${100 - 10} 58 ${100 - 22} 62 C${100 - w + 6} 64 ${100 - w + 2} 72 ${100 - w - 2} 84 Z" fill="${color}"/>
        <path d="M${100 - 18} 44 C${100 - 6} 39 ${100 + 8} 39 ${100 + 18} 44" stroke="${hi}" stroke-width="3" fill="none" opacity="0.5" stroke-linecap="round"/>`;
    case 2: // Seitenscheitel
      return `<path d="M${100 - w - 3} 86 C${100 - w - 6} 50 ${100 - w * 0.5} 33 ${100 + 4} 33 C${100 + w * 0.8} 33 ${100 + w + 6} 52 ${100 + w + 2} 82 C${100 + w - 4} 66 ${100 + 20} 58 ${100 - 2} 57 C${100 - 16} 60 ${100 - w + 6} 66 ${100 - w - 3} 86 Z" fill="${color}"/>
        <path d="M${100 - 12} 36 C${100 - 16} 44 ${100 - 18} 52 ${100 - 20} 58" stroke="${shade(color, -0.4)}" stroke-width="2" fill="none"/>
        <path d="M${100} 38 C${100 + 14} 37 ${100 + 24} 42 ${100 + 30} 50" stroke="${hi}" stroke-width="3" fill="none" opacity="0.45" stroke-linecap="round"/>`;
    case 3: // Tolle
      return `<path d="M${100 - w - 2} 84 C${100 - w - 2} 58 ${100 - w + 2} 42 ${100 - 16} 34 C${100 - 10} 20 ${100 + 22} 14 ${100 + 30} 28 C${100 + w + 4} 40 ${100 + w + 3} 60 ${100 + w + 1} 84 C${100 + w - 4} 70 ${100 + w - 6} 62 ${100 + 12} 58 C${100 - 4} 60 ${100 - 20} 60 ${100 - w + 4} 66 Z" fill="${color}"/>
        <path d="M${100 - 10} 30 C${100 + 2} 20 ${100 + 18} 19 ${100 + 26} 28" stroke="${hi}" stroke-width="3.5" fill="none" opacity="0.5" stroke-linecap="round"/>`;
    case 4: { // Locken
      const bumps = [];
      for (let i = 0; i < 9; i++) {
        const t = i / 8;
        const x = 100 - w + t * w * 2;
        const y = 52 - Math.sin(t * Math.PI) * 11;
        bumps.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(10 + Math.sin(i * 1.7) * 2).toFixed(1)}" fill="${color}"/>`);
      }
      return `<path d="M${100 - w - 1} 80 C${100 - w - 3} 56 ${100 - w * 0.6} 40 100 40 C${100 + w * 0.6} 40 ${100 + w + 3} 56 ${100 + w + 1} 80 C${100 + w - 6} 66 ${100 + 10} 58 100 60 C${100 - 10} 58 ${100 - w + 6} 66 ${100 - w - 1} 80 Z" fill="${color}"/>${bumps.join('')}
        <circle cx="${100 - 12}" cy="34" r="3" fill="${hi}" opacity="0.4"/><circle cx="${100 + 8}" cy="32" r="3" fill="${hi}" opacity="0.4"/>`;
    }
    case 5: // Afro (Vorderkante)
      return `<path d="M${100 - w - 3} 84 C${100 - w - 4} 60 ${100 - w * 0.6} 44 100 44 C${100 + w * 0.6} 44 ${100 + w + 4} 60 ${100 + w + 3} 84 C${100 + w - 3} 70 ${100 + w - 8} 62 100 61 C${100 - w + 8} 62 ${100 - w + 3} 70 ${100 - w - 3} 84 Z" fill="${color}"/>
        <path d="M${100 - 26} 30 C${100 - 10} 22 ${100 + 12} 22 ${100 + 26} 30" stroke="${hi}" stroke-width="4" fill="none" opacity="0.3" stroke-linecap="round"/>`;
    case 6: // Dutt (Kappe)
      return `<path d="M${100 - w - 1} 80 C${100 - w - 3} 52 ${100 - w * 0.6} 40 100 40 C${100 + w * 0.6} 40 ${100 + w + 3} 52 ${100 + w + 1} 80 C${100 + w - 6} 64 ${100 + 14} 56 100 56 C${100 - 14} 56 ${100 - w + 6} 64 ${100 - w - 1} 80 Z" fill="${color}"/>
        <path d="M${100 - 14} 46 L100 41 L${100 + 14} 46" stroke="${hi}" stroke-width="2.5" fill="none" opacity="0.45"/>`;
    case 7: // lang (Vorderteil mit Strähnen)
      return `<path d="M${100 - w - 6} 96 C${100 - w - 8} 50 ${100 - w * 0.5} 34 100 34 C${100 + w * 0.5} 34 ${100 + w + 8} 50 ${100 + w + 6} 96 C${100 + w} 78 ${100 + w - 4} 64 ${100 + 6} 56 C${100 - 8} 62 ${100 - w + 4} 70 ${100 - w - 6} 96 Z" fill="${color}"/>
        <path d="M${100 + 4} 38 C${100 + 18} 42 ${100 + 28} 52 ${100 + 32} 66" stroke="${hi}" stroke-width="3" fill="none" opacity="0.45" stroke-linecap="round"/>`;
    case 8: // Iro / Fade
      return `<path d="M${100 - w} 84 C${100 - w - 1} 58 ${100 - w * 0.6} 44 100 43 C${100 + w * 0.6} 44 ${100 + w + 1} 58 ${100 + w} 84 C${100 + w - 4} 70 ${100 + w * 0.5} 58 100 58 C${100 - w * 0.5} 58 ${100 - w + 4} 70 ${100 - w} 84 Z" fill="${color}" opacity="0.35"/>
        <path d="M${100 - 11} 60 C${100 - 13} 40 ${100 - 8} 26 100 24 C${100 + 8} 26 ${100 + 13} 40 ${100 + 11} 60 Z" fill="${color}"/>
        <path d="M100 28 C${100 + 4} 34 ${100 + 6} 44 ${100 + 5} 54" stroke="${hi}" stroke-width="2.5" fill="none" opacity="0.5" stroke-linecap="round"/>`;
    default: // Glatze mit Glanz
      return `<ellipse cx="${100 - 12}" cy="56" rx="10" ry="5" fill="#fff" opacity="0.18" transform="rotate(-20 ${100 - 12} 56)"/>`;
  }
}

function eyes(v, iris) {
  const one = x => {
    if (v === 1) {
      return `<ellipse cx="${x}" cy="98" rx="5.2" ry="4.4" fill="#fff"/><circle cx="${x + 0.6}" cy="98.4" r="3.3" fill="${iris}"/><circle cx="${x + 1.6}" cy="97.2" r="1.1" fill="#fff"/>
        <path d="M${x - 6} 96.5 C${x - 3} 92.5 ${x + 3} 92.5 ${x + 6} 96.5" stroke="#2a1d16" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    }
    if (v === 2) {
      return `<path d="M${x - 6} 98.5 C${x - 3} 95.5 ${x + 3} 95.5 ${x + 6} 98.5 C${x + 3} 100.5 ${x - 3} 100.5 ${x - 6} 98.5 Z" fill="#fff"/><circle cx="${x + 0.5}" cy="98.2" r="2.4" fill="${iris}"/>
        <path d="M${x - 6.5} 98 C${x - 3} 95 ${x + 3} 95 ${x + 6.5} 98" stroke="#2a1d16" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
    }
    return `<path d="M${x - 6} 98.5 C${x - 3} 94.5 ${x + 3} 94.5 ${x + 6} 98.5 C${x + 3} 101.5 ${x - 3} 101.5 ${x - 6} 98.5 Z" fill="#fff"/><circle cx="${x + 0.5}" cy="98.3" r="2.9" fill="${iris}"/><circle cx="${x + 1.4}" cy="97.3" r="0.9" fill="#fff"/>
      <path d="M${x - 6.5} 98 C${x - 3} 93.8 ${x + 3} 93.8 ${x + 6.5} 98" stroke="#2a1d16" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  };
  return one(85) + one(115);
}

function brows(v, color) {
  const width = v === 0 ? 3.8 : v === 1 ? 2.6 : 3.2;
  const l = v === 2 ? 'M76 89 C80 85 86 84 93 86' : 'M76 88 C80 85.5 86 85 93 86.5';
  const r = v === 2 ? 'M107 86 C114 84 120 85 124 89' : 'M107 86.5 C114 85 120 85.5 124 88';
  return `<path d="${l}" stroke="${color}" stroke-width="${width}" fill="none" stroke-linecap="round"/><path d="${r}" stroke="${color}" stroke-width="${width}" fill="none" stroke-linecap="round"/>`;
}

function nose(v, sh) {
  if (v === 1) {
    return `<path d="M103 100 C105 108 108 113 106 117 C104 119 100 119 97 118" stroke="${sh}" stroke-width="2" fill="none" stroke-linecap="round"/><ellipse cx="96" cy="117" rx="2" ry="1.2" fill="${sh}" opacity="0.6"/><ellipse cx="104" cy="117" rx="2" ry="1.2" fill="${sh}" opacity="0.6"/>`;
  }
  if (v === 2) {
    return `<path d="M102 98 L106 114 C102 118 96 118 94 115" stroke="${sh}" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M106 114 C108 110 110 106 106 100" fill="${sh}" opacity="0.18"/>`;
  }
  return `<path d="M101 100 C103 107 106 112 104 115.5 C102 117.5 98 117.5 95.5 116" stroke="${sh}" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M104 102 C107 108 109 112 107 115 L104 115.5 Z" fill="${sh}" opacity="0.18"/>`;
}

function mouth(v, lip) {
  if (v === 1) return `<path d="M90 126 C95 130.5 105 130.5 110 126" stroke="${lip}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M93 129.5 C97 131.5 103 131.5 107 129.5" stroke="${lip}" stroke-width="1.4" fill="none" opacity="0.5" stroke-linecap="round"/>`;
  if (v === 2) return `<path d="M91 127 L109 127" stroke="${lip}" stroke-width="2.4" stroke-linecap="round"/><path d="M94 130 C98 131.5 102 131.5 106 130" stroke="${lip}" stroke-width="1.6" fill="none" opacity="0.45" stroke-linecap="round"/>`;
  return `<path d="M91 127 C96 129 104 129 109 127" stroke="${lip}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M94 130.5 C98 132 102 132 106 130.5" stroke="${lip}" stroke-width="1.5" fill="none" opacity="0.5" stroke-linecap="round"/>`;
}

function beard(v, f, color) {
  if (!v) return '';
  const { w, jw, chin } = f;
  const jaw = `M${100 - w + 1} 100 C${100 - w + 2} 118 ${100 - jw - 6} 131 100 ${chin + 1} C${100 + jw + 6} 131 ${100 + w - 2} 118 ${100 + w - 1} 100 C${100 + w - 6} 116 ${100 + 16} 124 ${100 + 12} 122 C${100 + 6} 119 ${100 - 6} 119 ${100 - 12} 122 C${100 - 16} 124 ${100 - w + 6} 116 ${100 - w + 1} 100 Z`;
  const tash = `M88 123 C94 119 106 119 112 123 C106 121.5 94 121.5 88 123 Z`;
  if (v === 1) return `<path d="${jaw}" fill="${color}" opacity="0.28"/><path d="${tash}" fill="${color}" opacity="0.35" stroke="${color}" stroke-opacity="0.35" stroke-width="2"/>`;
  if (v === 2) return `<path d="${jaw}" fill="${color}" opacity="0.92"/><path d="${tash}" fill="${color}" stroke="${color}" stroke-width="3"/><path d="M92 127 C96 129 104 129 108 127" stroke="${shade(color, 0.6)}" stroke-width="1.6" fill="none" opacity="0.6"/>`;
  return `<path d="M90 130 C92 ${chin + 2} 108 ${chin + 2} 110 130 C106 133 94 133 90 130 Z" fill="${color}"/><path d="${tash}" fill="${color}" stroke="${color}" stroke-width="3"/>`;
}

/**
 * player.look → SVG. opts.colors = { primary, secondary } für das Trikot.
 */
export function portraitSvg(player, opts = {}) {
  const id = `pt${++uid}`;
  const look = player.look || {};
  const [skin, skinShade] = SKIN[look.skin ?? 1];
  const face = FACES[look.face ?? 0];
  const age = player.age || 24;
  let hairColor = HAIR[look.hairColor ?? 1];
  if (age >= 31) hairColor = mix(hairColor, '#9aa0a6', Math.min(0.55, (age - 30) * 0.12));
  const style = look.hair ?? 1;
  const beardV = age < 20 ? Math.min(look.beard ?? 0, 1) : look.beard ?? 0;
  const primary = opts.colors?.primary || '#1f7a4d';
  const secondary = opts.colors?.secondary || '#ffffff';
  const iris = (look.skin ?? 1) <= 1 && (look.eyes ?? 0) === 1 ? '#3d6b8c' : '#2f2118';
  const lip = shade(skinShade, -0.25);
  const sh = shade(skinShade, -0.12);

  return `<svg class="portrait" viewBox="0 0 200 220" aria-hidden="true" preserveAspectRatio="xMidYMax meet">
    <defs>
      <radialGradient id="${id}s" cx="0.38" cy="0.32" r="0.85">
        <stop offset="0" stop-color="${shade(skin, 0.06)}"/><stop offset="0.6" stop-color="${skin}"/><stop offset="1" stop-color="${skinShade}"/>
      </radialGradient>
      <linearGradient id="${id}j" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${shade(primary, 0.18)}"/><stop offset="1" stop-color="${shade(primary, -0.28)}"/>
      </linearGradient>
      <clipPath id="${id}f"><path d="${facePath(face)}"/></clipPath>
    </defs>
    ${hairBack(style, face, hairColor)}
    <path d="M84 126 L116 126 L118 166 L82 166 Z" fill="${skinShade}"/>
    <path d="M84 132 C92 146 108 146 116 132 L116 150 C108 156 92 156 84 150 Z" fill="${shade(skinShade, -0.15)}" opacity="0.55"/>
    <path d="M8 220 C12 186 44 166 80 158 C88 166 112 166 120 158 C156 166 188 186 192 220 Z" fill="url(#${id}j)"/>
    <path d="M80 158 C88 172 112 172 120 158 L126 160 C118 180 82 180 74 160 Z" fill="${secondary}"/>
    <path d="M48 176 C46 190 44 204 44 220 M152 176 C154 190 156 204 156 220" stroke="${shade(primary, -0.35)}" stroke-width="2" fill="none" opacity="0.5"/>
    <path d="M120 158 C156 166 188 186 192 220 L170 220 C166 196 146 176 120 166 Z" fill="#000" opacity="0.12"/>
    <ellipse cx="${100 - face.w}" cy="101" rx="6.5" ry="10" fill="${skinShade}"/>
    <ellipse cx="${100 + face.w}" cy="101" rx="6.5" ry="10" fill="${skinShade}"/>
    <path d="${facePath(face)}" fill="url(#${id}s)"/>
    <g clip-path="url(#${id}f)">
      <path d="M128 50 C142 80 140 120 112 150 L150 150 L150 50 Z" fill="${skinShade}" opacity="0.45"/>
    </g>
    ${beard(beardV, face, shade(hairColor, -0.1))}
    ${eyes(look.eyes ?? 0, iris)}
    ${brows(look.brows ?? 0, shade(hairColor, -0.15))}
    ${nose(look.nose ?? 0, sh)}
    ${mouth(look.mouth ?? 0, lip)}
    ${age >= 32 ? `<path d="M73 101 l-4 2 M73 105 l-4 1 M127 101 l4 2 M127 105 l4 1" stroke="${sh}" stroke-width="1.2" opacity="0.6" stroke-linecap="round"/>` : ''}
    ${hairFront(style, face, hairColor)}
  </svg>`;
}
