// =============================================================================
// Datei oder Text an das Gerät übergeben: Teilen-Menü (App und Handy-Browser),
// sonst Download. Gibt 'shared', 'downloaded', 'cancelled' oder 'error' zurück.
// =============================================================================

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

export async function deliverFile(blob, name, title) {
  const cap = typeof window !== 'undefined' ? window.Capacitor : null;
  if (cap?.isNativePlatform?.() && cap.Plugins?.Filesystem && cap.Plugins?.Share) {
    try {
      const res = await cap.Plugins.Filesystem.writeFile({ path: name, data: await blobToBase64(blob), directory: 'CACHE' });
      await cap.Plugins.Share.share({ title, files: [res.uri] });
      return 'shared';
    } catch (e) {
      return String(e?.message || e).toLowerCase().includes('cancel') ? 'cancelled' : 'error';
    }
  }
  const file = typeof File !== 'undefined' ? new File([blob], name, { type: blob.type }) : null;
  const touch = typeof navigator !== 'undefined' && /Android|iPhone|iPad/i.test(navigator.userAgent);
  if (touch && file && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title }); return 'shared'; } catch (e) { if (e?.name === 'AbortError') return 'cancelled'; }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return 'downloaded';
}

/** Text teilen: Teilen-Menü, sonst Zwischenablage. Gibt 'shared', 'copied', 'cancelled' oder 'error' zurück. */
export async function deliverText(text, title) {
  const cap = typeof window !== 'undefined' ? window.Capacitor : null;
  try {
    if (cap?.isNativePlatform?.() && cap.Plugins?.Share) { await cap.Plugins.Share.share({ title, text }); return 'shared'; }
    if (navigator.share) { await navigator.share({ title, text }); return 'shared'; }
  } catch (e) {
    if (e?.name === 'AbortError' || String(e?.message || e).toLowerCase().includes('cancel')) return 'cancelled';
  }
  try { await navigator.clipboard.writeText(text); return 'copied'; } catch { return 'error'; }
}
