// =============================================================================
// Starting XI TCG — Persistence Layer (IndexedDB with LocalStorage Fallback)
// =============================================================================

const DB_NAME = 'StartingXiTCG_DB';
const DB_VERSION = 1;
const STORE_NAME = 'gameState';
const KEY_NAME = 'activeSave';

function openDatabase() {
  return new Promise((resolve, reject) => {
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

export async function saveGameState(state) {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(KEY_NAME, serialized);

    const db = await openDatabase();
    if (db) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(serialized, KEY_NAME);
    }
  } catch (err) {
    console.warn('Auto-Save Error:', err);
  }
}

export async function loadGameState() {
  try {
    const db = await openDatabase();
    if (db) {
      const data = await new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(KEY_NAME);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      });
      if (data) return JSON.parse(data);
    }

    const localData = localStorage.getItem(KEY_NAME);
    if (localData) return JSON.parse(localData);
  } catch (err) {
    console.warn('Auto-Load Error:', err);
  }
  return null;
}

export async function clearGameState() {
  try {
    localStorage.removeItem(KEY_NAME);
    const db = await openDatabase();
    if (db) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(KEY_NAME);
    }
  } catch (err) {}
}
