// =============================================================================
// Darstellung: Hell, Dunkel oder automatisch nach Gerät
// =============================================================================

const COLORS = { light: '#eef1f4', dark: '#10161d' };
let media = null;

export function effectiveTheme(setting) {
  if (setting === 'light' || setting === 'dark') return setting;
  try { return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; } catch { return 'light'; }
}

const SCALES = { normal: 1, large: 1.12, xlarge: 1.25 };

/** Barrierefreiheits-Einstellungen auf das Dokument anwenden */
export function applyA11y(settings = {}) {
  const el = document.documentElement;
  el.style.setProperty('--ui-scale', String(SCALES[settings.textSize] || 1));
  if (settings.colorblind) el.dataset.cb = '1'; else delete el.dataset.cb;
  if (settings.reduceMotion) el.dataset.motion = 'reduced'; else delete el.dataset.motion;
}

export function applyTheme(setting) {
  const theme = effectiveTheme(setting);
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLORS[theme]);
  try {
    media = media || window.matchMedia('(prefers-color-scheme: dark)');
    media.onchange = () => { if ((window.__themeSetting || 'auto') === 'auto') applyTheme('auto'); };
  } catch { /* alte Browser: kein Auto-Wechsel */ }
  window.__themeSetting = setting;
}
