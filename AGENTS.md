# AGENTS.md — Leitfaden für Google Jules (Review, Quality Audit & Polish)

Willkommen im Repository von **Starting XI – Fußball-Manager & Sammelkartenspiel (TCG)**.
Die Haupt-Konzeption und Feature-Entwicklung erfolgt über **Claude** (dokumentiert in [`CLAUDE.md`](./CLAUDE.md)).

**Deine Rolle als Google Jules in diesem Repository:**
Du agierst als **Code-Auditor, Bug-Jäger, Test-Härter und UI/Mobile-Polierer** für den bestehenden Codestand.
- **Baue keine ungefragten neuen Spielmechaniken**, sondern prüfe bestehenden Code auf Randfälle (Edge Cases), Logikfehler, Darstellungsfehler auf schmalen Smartphone-Displays (360px–412px), Performance, Barrierefreiheit und fehlende Unit-Tests.
- Lies vor jeder Änderung zwingend [`CLAUDE.md`](./CLAUDE.md).

---

## 1. Setup & Pflicht-Prüfungen vor jedem Commit / Pull Request

Führe bei jeder Prüfung und nach jeder Code-Änderung **immer** diese drei Befehle aus:

```bash
npm test          # Alle Unit-Tests in tests/engine.test.js müssen grün sein
npm run check     # Monte-Carlo-Kalibrierung (12 Saisons + Einzelprüfungen) muss grün sein
npm run build     # Vite-Produktionsbuild muss ohne Warnungen/Fehler durchlaufen
```

---

## 2. Architektur-Grundsätze (Strikte Trennung!)

- **`src/engine/` (Reine Spiellogik, Headless):**
  - **Kein DOM, kein `window`, kein `localStorage`!**
  - Alle Zufallsentscheidungen müssen deterministisch über den übergebenen `rng` (`createRng(seed)` aus `src/engine/rng.js`) laufen – niemals `Math.random()` in der Engine verwenden.
  - Die erste Halbzeit eines Spiels (`simulateMatch` in `src/engine/match.js`) hat ihren eigenen Zufallsstrom (`rA`), damit die Halbzeit-Vorschau (`previewUserMatch`) und das endgültige Spiel in Hälfte 1 exakt übereinstimmen.
- **`src/ui/` (Darstellung & Screens):**
  - Reine View-Schicht, die den `state` liest und Aktionen über `src/engine/game.js` (bzw. die Fachmodule) auslöst.
  - Muss auf **Mobile-Screens (360px Breite)** im Hell- und Dunkelmodus (`src/styles/main.css`) ohne horizontales Überlaufen, abgeschnittene Buttons oder unlesbare Kontraste funktionieren.
- **`src/i18n/de.js` & `src/i18n/en.js` (Zweisprachigkeit):**
  - **Keine fest codierten UI- oder Nachrichten-Texte im Code!**
  - Jeder Schlüssel muss **gleichzeitig in `de.js` und `en.js`** vorhanden sein (gleiche Platzhalter `{name}`, `{n}` usw.).
- **Alte Spielstände schützen (`ensure...`):**
  - Bestehende Spielstände müssen beim Laden (`ensureClubLife`, `ensureAllContracts`, `loadGame`) immer abwärtskompatibel bleiben.
