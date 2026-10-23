# AGENTS.md — Leitfaden für Google Jules & Coding-Agenten

Willkommen im Repository von **Starting XI – Fußball-Manager & Sammelkartenspiel (TCG)**.
Lies vor jeder Änderung zwingend auch [`CLAUDE.md`](./CLAUDE.md) (vollständige Projektdokumentation bis `v1.11`) sowie [`docs/BACKLOG_SPIELTIEFE.md`](./docs/BACKLOG_SPIELTIEFE.md) (offene Feature-Tickets ab `v1.12+`).

---

## 1. Setup & Pflicht-Prüfungen vor jedem Commit / Pull Request

Führe nach jeder Code-Änderung **immer** diese drei Befehle aus. Ein Pull Request darf nur erstellt werden, wenn alle drei fehlerfrei durchlaufen:

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
- **`src/i18n/de.js` & `src/i18n/en.js` (Zweisprachigkeit):**
  - **Keine fest codierten UI- oder Nachrichten-Texte im Code!**
  - Jeder neue Schlüssel muss **gleichzeitig in `de.js` und `en.js`** angelegt werden (gleiche Platzhalter `{name}`, `{n}` usw.). `npm test` prüft die Schlüssel-Parität automatisch.
- **Alte Spielstände schützen (`ensure...`):**
  - Neue Felder im `state` müssen über `ensureClubLife(state)` (`src/engine/clublife.js`), `ensureAllContracts(state)` (`src/engine/contracts.js`) oder beim Laden in `src/engine/game.js` sauber initialisiert werden, damit bestehende Spielstände ohne Fehler weiterlaufen.

---

## 3. Goldene Design-Regeln

1. **„Alles ist eine Karte“:** Neue Elemente (Sponsoren, Spezialisierungen, Auszeichnungen, Verbrauchsgegenstände) werden als greifbare Karten oder Stempel/Plaketten auf Karten inszeniert.
2. **Jeder Spieler ist ein Unikat:** Jeder Spieler existiert in der Spielwelt genau einmal (kein Duplikat-Sammelalbum).
3. **Moderate Effekte (Balancing bewahren):**
   - Neue Boni/Mali sollen Entscheidungen färben, aber kein Pflichtprogramm sein (Richtwert: ±1,5 % bis ±3 % Stärke bzw. 0,5 bis 2 Punkte im Mittelfeld/Angriff/Abwehr – vergleichbar mit Tagesform oder Wetter).
   - Prüfe mit `npm run check`, dass Tore pro Spiel (ca. 2,5–2,9), Heimsiegquote und KI-Finanzen im grünen Korridor bleiben.
4. **Co-Trainer & Prognose (`forecast.js`, `extras.js`):**
   - Dürfen **niemals** den Konterstil gegen den nächsten Gegner verraten oder Spielstil/Formation automatisch umstellen.

---

## 4. Offene Backlog-Tickets (`v1.12` – `v1.16`)

Die detaillierten Spezifikationen und Abnahmekriterien findest du in [`docs/BACKLOG_SPIELTIEFE.md`](./docs/BACKLOG_SPIELTIEFE.md):
- **Ticket 1 (`v1.12`):** Sponsoren-Karten & Spieltags-Prämien (`clublife.js`, `economy.js`, `club.js`, `prep.js`)
- **Ticket 2 (`v1.13`):** Kader-Rollen & Kabinen-Hierarchie (`player.js`, `contracts.js`, `clublife.js`, `squad.js`)
- **Ticket 3 (`v1.14`):** Karten-Spezialisierungen / Spielertypen (`constants.js`, `player.js`, `match.js`, `card.js`)
- **Ticket 4 (`v1.15`):** Schlüsselduell & Positions-Mismatch Links/Mitte/Rechts (`match.js`, `forecast.js`, `prep.js`)
- **Ticket 5 (`v1.16`):** Karten-Evolution & „Vereins-Ikonen“ (`identity.js`, `contracts.js`, `market.js`, `card.js`)
