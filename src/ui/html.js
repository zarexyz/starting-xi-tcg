// Kleine Helfer für sichere HTML-Vorlagen

import { fmtNum, fmtDec } from '../i18n/index.js';

const MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => MAP[c]);
}

export function fmt(n) {
  return fmtNum(n);
}

export { fmtDec };

export function signed(n) {
  const v = Math.round(n);
  return `${v > 0 ? '+' : v < 0 ? '−' : ''}${fmtNum(Math.abs(v))}`;
}
