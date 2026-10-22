// =============================================================================
// Store: hält Spielstand (game) und Oberflächenzustand (ui) getrennt.
// Spielaktionen laufen immer auf einer Kopie des Spielstands – schlägt etwas
// fehl, bleibt der alte Stand unverändert.
// =============================================================================

import { saveGame, loadGame, activeSlot, loadSettings, saveSettings } from './storage.js';

const listeners = new Set();

/** Wird nach jeder erfolgreichen Spielaktion aufgerufen (z. B. für Erfolge) */
let afterAct = null;
export function setAfterAct(fn) { afterAct = fn; }

export const store = {
  game: null,
  slot: null,
  settings: loadSettings(),
  ui: {
    screen: 'title', // title | found | app
    tab: 'home',
    view: {},
    sheet: null,
    flow: null,
    selected: null,
    toast: null
  }
};

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function notify() {
  listeners.forEach(fn => fn(store));
}

/** Spielaktion ausführen: fn(stateCopy, ...args) */
export function act(fn, ...args) {
  if (!store.game) return null;
  const next = structuredClone(store.game);
  const result = fn(next, ...args);
  if (result && result.error) {
    toast(result.error);
    notify();
    return result;
  }
  store.game = next;
  if (afterAct) { try { afterAct(store); } catch (e) { console.warn(e); } }
  persist();
  notify();
  return result;
}

export function setUi(patch) {
  Object.assign(store.ui, patch);
  notify();
}

export function setView(tab, view) {
  store.ui.view = { ...store.ui.view, [tab]: view };
  notify();
}

let toastTimer = null;
export function toast(text) {
  store.ui.toast = text;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { store.ui.toast = null; notify(); }, 2600);
  notify();
}

export function persist() {
  if (store.game && store.slot) saveGame(store.slot, store.game);
}

export function startGame(slot, game) {
  store.slot = slot;
  store.game = game;
  persist();
}

export function resumeGame(slot = activeSlot()) {
  if (!slot) return false;
  const g = loadGame(slot);
  if (!g) return false;
  store.slot = slot;
  store.game = g;
  return true;
}

export function updateSettings(patch) {
  store.settings = { ...store.settings, ...patch };
  saveSettings(store.settings);
  notify();
}
