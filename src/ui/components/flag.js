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
  ARG: H('#74acdf', '#ffffff', '#74acdf'),
  SCO: { special: 'sco' },
  TUR: { special: 'tur' },
  BEL: V('#000000', '#fdda24', '#ef3340'),
  SRB: H('#c6363c', '#0c4076', '#ffffff'),
  GRE: { special: 'gre' },
  MAR: { special: 'mar' },
  USA: { special: 'usa' },
  MEX: { special: 'mex' },
  COL: { dir: 'h', c: ['#fcd116', '#fcd116', '#003893', '#ce1126'] },
  JPN: { special: 'jpn' }
};

export function flagSvg(code, w = 20) {
  const h = Math.round(w * 0.7);
  const f = FLAGS[code] || FLAGS.GER;
  let body = '';
  if (f.special === 'bra') {
    body = `<rect width="30" height="21" fill="#009c3b"/><path d="M15 2.5 27.5 10.5 15 18.5 2.5 10.5Z" fill="#ffdf00"/><circle cx="15" cy="10.5" r="4.6" fill="#002776"/>`;
  } else if (f.special === 'eng') {
    body = `<rect width="30" height="21" fill="#fff"/><rect x="12.5" width="5" height="21" fill="#ce1124"/><rect y="8" width="30" height="5" fill="#ce1124"/>`;
  } else if (f.special === 'sco') {
    body = `<rect width="30" height="21" fill="#005eb8"/><path d="M0 0 30 21M30 0 0 21" stroke="#fff" stroke-width="3.4"/>`;
  } else if (f.special === 'tur') {
    body = `<rect width="30" height="21" fill="#e30a17"/><circle cx="11" cy="10.5" r="5.2" fill="#fff"/><circle cx="12.4" cy="10.5" r="4.2" fill="#e30a17"/><path d="m17.6 10.5 3.6-1.2-2.2 3.1v-3.8l2.2 3.1z" fill="#fff"/>`;
  } else if (f.special === 'gre') {
    body = `<rect width="30" height="21" fill="#0d5eaf"/>${[1, 3, 5, 7].map(i => `<rect y="${(i * 21 / 9).toFixed(2)}" width="30" height="${(21 / 9).toFixed(2)}" fill="#fff"/>`).join('')}<rect width="11.7" height="11.7" fill="#0d5eaf"/><rect x="4.7" width="2.3" height="11.7" fill="#fff"/><rect y="4.7" width="11.7" height="2.3" fill="#fff"/>`;
  } else if (f.special === 'mar') {
    body = `<rect width="30" height="21" fill="#c1272d"/><path d="M15 6.2 16.9 12.3 11.9 8.5h6.2l-5 3.8z" fill="none" stroke="#006233" stroke-width="0.9"/>`;
  } else if (f.special === 'usa') {
    body = `<rect width="30" height="21" fill="#fff"/>${[0, 2, 4, 6, 8, 10, 12].map(i => `<rect y="${(i * 21 / 13).toFixed(2)}" width="30" height="${(21 / 13 + 0.05).toFixed(2)}" fill="#b22234"/>`).join('')}<rect width="12.5" height="11.3" fill="#3c3b6e"/>`;
  } else if (f.special === 'mex') {
    body = `<rect width="10" height="21" fill="#006847"/><rect x="10" width="10" height="21" fill="#fff"/><rect x="20" width="10" height="21" fill="#ce1126"/><circle cx="15" cy="10.5" r="2.2" fill="#8c6a2f"/>`;
  } else if (f.special === 'jpn') {
    body = `<rect width="30" height="21" fill="#fff"/><circle cx="15" cy="10.5" r="5.6" fill="#bc002d"/>`;
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
