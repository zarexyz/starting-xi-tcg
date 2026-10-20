// Kleine Helfer für sichere HTML-Vorlagen

const MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => MAP[c]);
}

export function fmt(n) {
  return Math.round(n).toLocaleString('de-DE');
}

export function signed(n) {
  const v = Math.round(n);
  return `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toLocaleString('de-DE')}`;
}
