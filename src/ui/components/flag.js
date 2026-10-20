// =============================================================================
// Kleine Länderflaggen als SVG (Emoji-Flaggen fehlen unter Windows)
// =============================================================================

const H = (...c) => ({ dir: 'h', c });
const V = (...c) => ({ dir: 'v', c });

const FLAGS = {
  GER: H('#000000', '#dd0000', '#ffce00'),
  NED: H('#ae1c28', '#ffffff', '#21468b'),
  FRA: V('#0055a4', '#ffffff', '#ef4135'),
  ESP: { dir: 'h', c: ['#aa151b', '#f1bf00', '#f1bf00', '#aa151b'] },
  ITA: V('#009246', '#ffffff', '#ce2b37'),
  POR: { dir: 'v', c: ['#006600', '#006600', '#ff0000', '#ff0000', '#ff0000'] },
  BRA: { special: 'bra' },
  ENG: { special: 'eng' },
  SWE: { special: 'nordic', bg: '#006aa7', cross: '#fecc00' },
  POL: H('#ffffff', '#dc143c'),
  CRO: H('#ff0000', '#ffffff', '#171796'),
  AUT: H('#ed2939', '#ffffff', '#ed2939'),
  DEN: { special: 'nordic', bg: '#c8102e', cross: '#ffffff' },
  SEN: V('#00853f', '#fdef42', '#e31b23'),
  NGA: V('#008751', '#ffffff', '#008751'),
  ARG: H('#74acdf', '#ffffff', '#74acdf')
};

export function flagSvg(code, w = 20) {
  const h = Math.round(w * 0.7);
  const f = FLAGS[code] || FLAGS.GER;
  let body = '';
  if (f.special === 'bra') {
    body = `<rect width="30" height="21" fill="#009c3b"/><path d="M15 2.5 27.5 10.5 15 18.5 2.5 10.5Z" fill="#ffdf00"/><circle cx="15" cy="10.5" r="4.6" fill="#002776"/>`;
  } else if (f.special === 'eng') {
    body = `<rect width="30" height="21" fill="#fff"/><rect x="12.5" width="5" height="21" fill="#ce1124"/><rect y="8" width="30" height="5" fill="#ce1124"/>`;
  } else if (f.special === 'nordic') {
    body = `<rect width="30" height="21" fill="${f.bg}"/><rect x="9" width="4" height="21" fill="${f.cross}"/><rect y="8.5" width="30" height="4" fill="${f.cross}"/>`;
  } else if (f.dir === 'h') {
    const step = 21 / f.c.length;
    body = f.c.map((c, i) => `<rect y="${(i * step).toFixed(2)}" width="30" height="${(step + 0.2).toFixed(2)}" fill="${c}"/>`).join('');
  } else {
    const step = 30 / f.c.length;
    body = f.c.map((c, i) => `<rect x="${(i * step).toFixed(2)}" width="${(step + 0.2).toFixed(2)}" height="21" fill="${c}"/>`).join('');
  }
  return `<svg class="flag" width="${w}" height="${h}" viewBox="0 0 30 21" aria-hidden="true">${body}</svg>`;
}
