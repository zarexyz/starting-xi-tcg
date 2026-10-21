// =============================================================================
// Spielstand sichern: Export als Datei und Import aus Datei.
// Im Browser per Download, in der Android-App über Teilen (Capacitor-Plugins,
// falls installiert), sonst über die Web-Share-API.
// =============================================================================

import { SAVE_VERSION } from '../engine/game.js';
import { migrateSave } from '../engine/migrate.js';

const APP = 'starting-xi-tcg';

export function exportFileName(game) {
  const club = (game.clubs?.user?.name || 'Verein').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
  const d = new Date();
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return `starting-xi_${club}_Saison${game.season}_${date}.json`;
}

export function serializeSave(game) {
  return JSON.stringify({ app: APP, format: 1, version: game.version, exportedAt: new Date().toISOString(), game });
}

/** Liest eine Sicherungsdatei. Gibt { game } oder { error } zurück. */
export function parseSave(text) {
  let data;
  try { data = JSON.parse(text); } catch { return { error: 'Die Datei ist keine gültige Sicherung.' }; }
  const game = data?.app === APP ? data.game : data; // auch rohe Spielstände annehmen
  if (!game || typeof game !== 'object' || !game.clubs?.user || !game.players || typeof game.version !== 'number') {
    return { error: 'Die Datei ist keine Sicherung von Starting XI.' };
  }
  if (game.version > SAVE_VERSION) return { error: 'Diese Sicherung stammt aus einer neueren Version. Bitte zuerst die App aktualisieren.' };
  const migrated = migrateSave(game, SAVE_VERSION);
  if (!migrated) return { error: 'Diese Sicherung lässt sich nicht mehr laden.' };
  return { game: migrated };
}

/** Speichert die Sicherung. Gibt 'shared', 'downloaded' oder einen Fehlertext zurück. */
export async function exportSave(game) {
  const text = serializeSave(game);
  const name = exportFileName(game);
  const cap = typeof window !== 'undefined' ? window.Capacitor : null;
  // Android-App: Datei in den Cache schreiben und über das Teilen-Menü anbieten
  if (cap?.isNativePlatform?.() && cap.Plugins?.Filesystem && cap.Plugins?.Share) {
    try {
      const res = await cap.Plugins.Filesystem.writeFile({ path: name, data: text, directory: 'CACHE', encoding: 'utf8' });
      await cap.Plugins.Share.share({ title: 'Starting XI Spielstand', files: [res.uri] });
      return 'shared';
    } catch (e) {
      if (String(e?.message || e).toLowerCase().includes('cancel')) return 'cancelled';
      return 'Teilen hat nicht geklappt.';
    }
  }
  const file = typeof File !== 'undefined' ? new File([text], name, { type: 'application/json' }) : null;
  const isTouch = typeof navigator !== 'undefined' && /Android|iPhone|iPad/i.test(navigator.userAgent);
  if (isTouch && file && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Starting XI Spielstand' });
      return 'shared';
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancelled';
    }
  }
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return 'downloaded';
}

/** Öffnet die Dateiauswahl und liefert den Text der gewählten Datei (oder null) */
export function pickSaveFile() {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.style.display = 'none';
    input.addEventListener('change', async () => {
      const f = input.files?.[0];
      input.remove();
      resolve(f ? await f.text() : null);
    });
    document.body.appendChild(input);
    input.click();
  });
}
