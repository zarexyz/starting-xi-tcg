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

export function saveProfile(profile) {
  safe(() => localStorage.setItem(KEY, JSON.stringify(profile)));
}
