// =============================================================================
// Manager-Profil: gilt über alle Spielstände (Erfolge, später Duell-Teams)
// =============================================================================

const KEY = 'sxi-tcg-profile';

function safe(fn, fallback = null) {
  try { return fn(); } catch { return fallback; }
}

export function loadProfile() {
  return safe(() => ({ best: {}, tier: {}, log: [], ...JSON.parse(localStorage.getItem(KEY) || '{}') }), { best: {}, tier: {}, log: [] });
}

/** Anonyme Zähler, nur lokal gespeichert (werden nur mit dem Feedback mitgeschickt, wenn du es willst) */
export function bump(key, n = 1) {
  const p = loadProfile();
  p.counts = { ...(p.counts || {}) };
  p.counts[key] = (p.counts[key] || 0) + n;
  saveProfile(p);
}

export function counts() {
  const c = loadProfile().counts || {};
  return { matches: c.matches || 0, seasons: c.seasons || 0, packs: c.packs || 0, starts: c.starts || 0 };
}

export function saveProfile(profile) {
  safe(() => localStorage.setItem(KEY, JSON.stringify(profile)));
}
