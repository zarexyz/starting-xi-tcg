// =============================================================================
// Starting XI TCG — Persistence Layer (3 Save Slots via IndexedDB + LocalStorage)
// =============================================================================

const DB_NAME = 'StartingXiTCG_DB';
const DB_VERSION = 2;
const STORE_NAME = 'saveSlots';
const ACTIVE_SLOT_KEY = 'StartingXiTCG_activeSlot';
const LEGACY_KEY = 'activeSave';

function openDatabase() {
  return new Promise((resolve) => {
    if (!window.indexedDB) {
      resolve(null);
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

export function getActiveSlotId() {
  return localStorage.getItem(ACTIVE_SLOT_KEY) || 'slot_1';
}

export function setActiveSlotId(slotId) {
  localStorage.setItem(ACTIVE_SLOT_KEY, slotId);
}

export async function saveSlot(slotId, state) {
  if (!state) return;
  try {
    state.lastSaved = Date.now();
    state.slotId = slotId;
    const serialized = JSON.stringify(state);
    localStorage.setItem(`save_${slotId}`, serialized);

    const db = await openDatabase();
    if (db) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(serialized, slotId);
    }
  } catch (err) {
    console.warn('Save Slot Error:', err);
  }
}

export async function loadSlot(slotId) {
  try {
    const db = await openDatabase();
    if (db) {
      const data = await new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(slotId);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      });
      if (data) return JSON.parse(data);
    }

    const localData = localStorage.getItem(`save_${slotId}`);
    if (localData) return JSON.parse(localData);

    // Migration from legacy single-save key if requesting slot_1
    if (slotId === 'slot_1') {
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        const parsed = JSON.parse(legacy);
        await saveSlot('slot_1', parsed);
        localStorage.removeItem(LEGACY_KEY);
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Load Slot Error:', err);
  }
  return null;
}

export async function deleteSlot(slotId) {
  try {
    localStorage.removeItem(`save_${slotId}`);
    const db = await openDatabase();
    if (db) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(slotId);
    }
  } catch (err) {
    console.warn('Delete Slot Error:', err);
  }
}

export async function listAllSlots() {
  const slots = [
    { id: 'slot_1', label: 'Speicherstand 1' },
    { id: 'slot_2', label: 'Speicherstand 2' },
    { id: 'slot_3', label: 'Speicherstand 3' }
  ];

  const results = [];
  for (const slot of slots) {
    const data = await loadSlot(slot.id);
    if (data && data.playerClubId) {
      const club = data.leagues?.find(l => l.tier === 6)?.clubs?.find(c => c.id === data.playerClubId);
      results.push({
        id: slot.id,
        label: slot.label,
        occupied: true,
        clubName: club?.name || 'Unbekannter Club',
        crestForm: club?.crestForm || 'shield',
        primaryColor: club?.primaryColor || '#00f59b',
        secondaryColor: club?.secondaryColor || '#ffd15c',
        tier: 6,
        matchday: data.currentMatchday || 1,
        coins: club?.coins || 0,
        squadCount: club?.squad?.length || 18,
        lastSaved: data.lastSaved || null
      });
    } else {
      results.push({
        id: slot.id,
        label: slot.label,
        occupied: false
      });
    }
  }
  return results;
}

// Global auto-save helper bound to currently active slot
export async function saveGameState(state) {
  const slotId = getActiveSlotId();
  return saveSlot(slotId, state);
}

export async function loadGameState() {
  const slotId = getActiveSlotId();
  return loadSlot(slotId);
}

export async function clearGameState() {
  const slotId = getActiveSlotId();
  return deleteSlot(slotId);
}
