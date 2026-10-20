// =============================================================================
// Speicherstände: drei Slots im lokalen Speicher des Geräts
// =============================================================================

import { SAVE_VERSION } from '../engine/game.js';
import { migrateSave } from '../engine/migrate.js';

const KEY = slot => `sxi-tcg-save-${slot}`;
const ACTIVE = 'sxi-tcg-active-slot';
const SETTINGS = 'sxi-tcg-settings';

export const SLOTS = [1, 2, 3];

function safe(fn, fallback = null) {
  try { return fn(); } catch { return fallback; }
}

export function saveGame(slot, state) {
  return safe(() => {
    localStorage.setItem(KEY(slot), JSON.stringify(state));
    localStorage.setItem(ACTIVE, String(slot));
    return true;
  }, false);
}

export function loadGame(slot) {
  return safe(() => {
    const raw = localStorage.getItem(KEY(slot));
    if (!raw) return null;
    const state = JSON.parse(raw);
    return migrateSave(state, SAVE_VERSION);
  });
}

export function deleteGame(slot) {
  safe(() => localStorage.removeItem(KEY(slot)));
}

export function activeSlot() {
  return safe(() => Number(localStorage.getItem(ACTIVE)) || null);
}

/** Kurzinfo für die Slot-Auswahl, ohne den ganzen Spielstand zu parsen, wenn möglich */
export function slotInfo(slot) {
  const s = loadGame(slot);
  if (!s) return null;
  const club = s.clubs.user;
  return { slot, name: club.name, tier: club.tier, season: s.season, colors: club.colors, crest: club.crest, short: club.short };
}

export function loadSettings() {
  return safe(() => ({ sound: true, speed: 'normal', ...JSON.parse(localStorage.getItem(SETTINGS) || '{}') }), { sound: true, speed: 'normal' });
}

export function saveSettings(settings) {
  safe(() => localStorage.setItem(SETTINGS, JSON.stringify(settings)));
}
