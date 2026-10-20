// Schriften lokal einbinden, damit die App auch offline richtig aussieht.
// Im Build löst Vite diese Pakete auf und packt die Schriften in die App.
// Es gibt bewusst keine Verbindung zu Google Fonts (Datenschutz).
// Ohne Build (reine Vorschau) greifen die Ersatzschriften.
export function loadLocalFonts() {
  const imports = [
    () => import('@fontsource/big-shoulders-display/800.css'),
    () => import('@fontsource/big-shoulders-display/900.css'),
    () => import('@fontsource/figtree/400.css'),
    () => import('@fontsource/figtree/600.css'),
    () => import('@fontsource/figtree/700.css')
  ];
  for (const load of imports) load().catch(() => {});
}
