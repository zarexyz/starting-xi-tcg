// Schriften: In der Web-Version kommen sie von Google Fonts. In der Android-App
// wird keine Verbindung zu Google aufgebaut (Datenschutz) – dort greifen die
// schmalen Systemschriften aus dem Fallback in app.css.
const GOOGLE_FONTS = 'https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800;900&family=Figtree:wght@400;500;600;700;800&display=swap';

export function loadLocalFonts() {
  try {
    if (window.Capacitor?.isNativePlatform?.()) return;
    if (document.querySelector('link[data-fonts]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = GOOGLE_FONTS;
    link.dataset.fonts = '1';
    document.head.appendChild(link);
  } catch {
    // Ohne Schriften läuft das Spiel mit den Ersatzschriften weiter
  }
}
