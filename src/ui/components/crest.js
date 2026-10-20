// =============================================================================
// Vereinswappen: Form, Muster und Vereinsfarben – für alle 60 Vereine erzeugt
// =============================================================================

let uid = 0;

const SHAPES = {
  shield: 'M50 4 L90 16 V50 C90 76 72 92 50 100 C28 92 10 76 10 50 V16 Z',
  round: 'M50 4 A46 46 0 1 1 49.9 4 Z',
  hexagon: 'M50 3 L92 27 V73 L50 97 L8 73 V27 Z',
  diamond: 'M50 2 L96 50 L50 98 L4 50 Z',
  crown: 'M10 30 L28 14 L50 26 L72 14 L90 30 V58 C90 80 72 94 50 100 C28 94 10 80 10 58 Z'
};

export const CREST_SHAPES = Object.keys(SHAPES);

function textColor(hex) {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#1b2433' : '#ffffff';
}

export function crestSvg(club, size = 40) {
  const id = `cr${++uid}`;
  const shape = SHAPES[club.crest?.shape] || SHAPES.shield;
  const p = club.colors.primary;
  const s = club.colors.secondary;
  const pattern = club.crest?.pattern ?? 0;
  let fill = '';
  if (pattern === 1) {
    fill = [20, 44, 68].map(x => `<rect x="${x}" y="0" width="12" height="100" fill="${s}" opacity="0.9"/>`).join('');
  } else if (pattern === 2) {
    fill = `<path d="M-10 70 L70 -10 L95 -10 L-10 95 Z" fill="${s}" opacity="0.9"/>`;
  } else if (pattern === 3) {
    fill = `<rect x="0" y="38" width="100" height="22" fill="${s}" opacity="0.9"/>`;
  }
  const label = club.short || '';
  const fg = pattern === 3 ? textColor(s) : textColor(p);
  return `<svg class="crest" width="${size}" height="${size}" viewBox="0 0 100 104" role="img" aria-label="Wappen ${club.name}">
    <defs><clipPath id="${id}"><path d="${shape}"/></clipPath></defs>
    <path d="${shape}" fill="${p}"/>
    <g clip-path="url(#${id})">${fill}<rect x="0" y="0" width="100" height="40" fill="#fff" opacity="0.08"/></g>
    <path d="${shape}" fill="none" stroke="${s}" stroke-width="5"/>
    <path d="${shape}" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="1"/>
    <text x="50" y="${club.crest?.shape === 'crown' ? 66 : 61}" text-anchor="middle" font-family="Big Shoulders Display, Arial Narrow, sans-serif" font-weight="800" font-size="30" fill="${fg}" letter-spacing="1">${label}</text>
  </svg>`;
}
