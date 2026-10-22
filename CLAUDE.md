# Starting XI TCG – Leitfaden für die Arbeit am Code

Mobiler Fußballmanager mit Sammelkarten (Vanilla JS, ES-Module, Vite, später Android über Capacitor).
Leitprinzip des Spiels: **Alles ist eine Karte.** Sprache im Code, in Kommentaren und mit dem Nutzer: **Deutsch**.

Planung liegt im claude.ai-Projekt (nicht im Repo): „Backlog v1.1+“, „Stand v1.0“, „Umsetzung v1.10–v1.13“ (Tickets mit Abnahmekriterien). Vor jeder Aufgabe das passende Ticket lesen.

## Ablauf je Aufgabe (Definition of Done)

1. Ticket lesen, betroffene Dateien lesen, erst dann ändern.
2. `npm test` – alle Tests grün. Neue Engine-Logik bekommt einen Test in `tests/engine.test.js`.
3. Bei Änderungen an Match-Engine, Stilen, Wetter, Standards, Zufriedenheit, Akademie, Wirtschaft: `npm run check` – alle Zeilen `OK`. Abweichung entweder beheben oder Zielwert im Ticket begründet anpassen.
4. Texte: jeder neue Schlüssel in **`src/i18n/de.js` und `src/i18n/en.js`** (Parität prüfen, siehe unten).
5. Browser-Rauchtest (siehe unten) ohne Seitenfehler, Screenshots der geänderten Ansicht anschauen (Handybreite 390 px, hell und dunkel).
6. `APP_VERSION` in `src/config.js` und `version` in `package.json` bei Versionsabschluss erhöhen.
7. Commit, Push auf beide Branches, Deploy prüfen (siehe unten).
8. Backlog im Projekt nachziehen: Erledigtes abhaken, Neues einsortieren. Kurzfassung für den Nutzer auf Deutsch.

## Befehle

```bash
npm test                 # Engine-Tests (node --test), ~1 min
npm run check            # Balancing mit Zielwerten (~12 s), Exit 1 bei Abweichung
npm run check:fast       # kleinere Stichprobe für zwischendurch
npm run sim              # 10 Saisons Karriere, Ausgabe je Saison
node scripts/sim/calibrate.mjs   # Heimsieg/Remis/Auswärts und Stärkeabstand
```

**Browser ohne Build:** Die App läuft direkt aus dem Repo (ES-Module, kein Bundler nötig). `node_modules` fehlt in der Sandbox, `npx vite` scheitert am Proxy – das ist normal, Vercel baut selbst.

```bash
cd /home/claude/starting-xi-tcg && (setsid nohup python3 -m http.server 5190 >/dev/null 2>&1 &)
python3 scripts/ui/smoke.py <ausgabeordner> http://localhost:5190/      # [en] als 3. Argument für Englisch
```
Der Server stirbt nach einer Weile; dann neu starten. Google Fonts sind in der Sandbox gesperrt (Schrift fällt zurück, kein Fehler).
Eigene Playwright-Skripte nach dem Muster von `scripts/ui/smoke.py` schreiben. Klicks auf Elemente unter Overlays per `page.evaluate("document.querySelector(...).click()")`.

## Git und Deploy

- Arbeitsbranch `claude/v1-roadmap`. **Push auf `main` = Produktion** (Vercel, starting-xi-tcg.vercel.app).
- Push: `git push -q origin HEAD:claude/v1-roadmap && git push -q origin HEAD:main`
- Deploy-Status: `gh api repos/zarexyz/starting-xi-tcg/commits/<sha>/status --jq '.state'` (bis `success`). Warten mit `timeout 20 tail -f /dev/null`, nicht mit `sleep`.
- Commit-Nachrichten auf Deutsch, Präfix mit Version („v1.10: …“).

## Architektur

```
src/engine/   reine Spiellogik, kein DOM. Jede Funktion verändert den übergebenen Spielstand direkt.
src/state/    Store (act), Speichern, Profil, Sicherung
src/ui/       screens/ (Reiter), flows/ (Vollbild-Abläufe: prep, match, result, pack …), components/, sheets.js
src/i18n/     de.js, en.js, index.js (t)
src/main.js   Rendering, Aktionen (handlers), Einstiege
tests/        engine.test.js
scripts/sim/  check.mjs (Zielwerte), calibrate.mjs; scripts/ui/smoke.py
```

Wichtige Engine-Dateien:
- `game.js` – createGame, playDay (Spieltag), Saisonende, useItem, Setup (`ensureUserSetup`), `previewUserMatch`/`setHalftime` (Halbzeit), `addNews`, `ledger`
- `match.js` – `buildTeam`, `simulateMatch` (Kern), Schlüsselszenen, Ticker, `analyzeMatch` (Spielbericht „Warum?“), `predictMatch`
- `constants.js` – Stile (Kreis, `styleMatchup`), Formationen, Positionen, Werte
- `ai.js` – KI-Aufstellung, Stilwahl mit Lernen (`learnStyle`)
- `clublife.js` – Zufriedenheit, Saisonziel, Wochenplan, Akademie (v1.9)
- `extras.js` – Wetter, Pressekonferenz, Standardschützen (v1.10)
- `forecast.js` – Siegprognose, **rechnet bewusst mit neutralem Stil** (sonst ließe sich der passende Stil ablesen)
- `news.js`, `stories.js` – News und Geschichten; `migrate.js` – alte Spielstände

### Regeln, die schon Fehler verursacht haben

1. **Rückgabe von Engine-Aktionen:** `act(fn, …)` in `src/state/store.js` arbeitet auf einer Kopie. Gibt `fn` ein Objekt mit `error` zurück, wird **der Text als Toast angezeigt** und die Kopie verworfen. Also:
   - Fehler für den Nutzer: `return { error: t('schluessel') }` (immer übersetzt, nie Code-Strings).
   - Fehler, die die Oberfläche selbst behandelt: `return { ok: false, code: 'noMoney' }` und im Handler `res?.code` auswerten.
2. **Alte Spielstände:** Neue Felder nie nur in `createGame` anlegen. Immer zusätzlich eine `ensure…(state)`-Funktion (Muster: `ensureClubLife`, `ensureIdentity`), aufgerufen in `ensureLife` in `main.js` (Weiterspielen, Laden, neues Spiel) und wo nötig in der Engine. Felder lesen mit Fallback (`state.user.x || …`). `SAVE_VERSION` (game.js) nur bei echter Umrechnung erhöhen, dann `migrate.js` ergänzen.
3. **Live-Spiel und Spielstand:** Das Ergebnis steht beim Anpfiff fest, `ui/flows/match.js` erzählt es nach. Der Spielstand im Live-Spiel kommt **nur aus Ticker-Einträgen vom Typ `goal` (Feld `score`)**. Szenen zählen nie selbst hoch (früherer Fehler: doppelt gezählte Tore).
4. **Halbzeit-Determinismus:** `simulateMatch` nutzt eigene Zufallsströme je Abschnitt (1. Hälfte, 2. Hälfte, Karten/Verletzungen, Nachbereitung). Das eigene Spiel bekommt in `playDay` einen festen Zufall (`userMatchSeed`). Dadurch zeigt `previewUserMatch` exakt die erste Hälfte des späteren echten Spiels. **Nichts, was in der ersten Hälfte passiert, darf von der Pausenentscheidung oder von Ereignissen der zweiten Hälfte abhängen** (auch Ticker-Texte und Szenenauswahl sind je Hälfte gewählt). Test: „Halbzeit: erste Hälfte bleibt gleich …“. Neue Zufallsziehungen in `simulateMatch` nur über den Strom der jeweiligen Hälfte (`r` in der Chancen-Schleife, `rC` für Karten/Verletzungen, `rng` = Nachbereitung nach der Schleife).
5. **Rendering während des Live-Spiels:** `render()` in `main.js` rendert nicht, solange `.matchflow` existiert. Das Halbzeit-Panel hängt eigene Klick-Listener an (Attribute `data-ht-*`), nicht `data-action`.
6. **Prognose verrät keinen Stil:** In `forecast.js` und in Co-Trainer-Vorschlägen nie den passenden Stil gegen den Gegner nennen. Stil-Wissen gibt es nur über Scouting (Trainer-Philosophie, Scouting-Karte).
7. **Effekte moderat halten:** Neue Systeme sollen Entscheidungen färben, nicht dominieren. Richtwert: einzelner Effekt höchstens etwa wie die Form (±2 % Stärke, 1–3 Punkte Mittelfeld). Prüfen mit `npm run check`.
8. **Kein Pay-to-Win:** Spielrelevantes gibt es nie gegen Echtgeld (Premium und Shop nur Komfort und Optik).

## Texte (i18n)

- `t(key, params)`; Platzhalter `{name}`. Endungen: `xK` = Wert ist selbst ein Schlüssel (`styleK: 'style.KONTER.name'`), `xC` = Münzbetrag mit Tausendertrennung, `xD` = Dezimalzahl. Mehrzahl über `n` mit `_one`/`_other`.
- News: Schlüssel `news.<typ>.t` (Titel) und `.x` (Text), angelegt mit `addNews(state, type, 'news.<typ>', params, extra)`. Wechsel-Schlagzeilen immer „X übernimmt Y“.
- Neue Schlüssel am Dateiende vor `};` anhängen. Parität prüfen:
  ```bash
  python3 - <<'E'
  import re
  k=lambda f:set(re.findall(r'(?:^|,)\s*["\']([A-Za-z0-9_.]+)["\']\s*:',open(f).read(),re.M))
  d,e=k('src/i18n/de.js'),k('src/i18n/en.js'); print('nur DE:',sorted(d-e)); print('nur EN:',sorted(e-d))
  E
  ```
- Stil der deutschen Texte: kurz, klar, ohne Anglizismen wo möglich („News“ ist gewollt).

## Oberfläche

- Aktionen: Elemente mit `data-action="name"` und `data-*`-Werten, Handler im Objekt `handlers` in `main.js` (`'name': d => act(engineFn, d.value)`).
- Farben und Größen nur über CSS-Variablen (`--paper`, `--line`, `--ink`, `--pitch-dark`, `--pitch-soft`, `--floodlight`, `--s-1…`, `--t-sm…`, `--r-md`). Darkmode, Farbsehschwäche-Modus, UI-Skalierung und reduzierte Bewegung hängen daran. Keine festen Farben außer in Overlays wie `.scene`.
- Handybreite 390 px ist Maßstab. Touch-Ziele mindestens 36–44 px. Icons aus `src/ui/icons.js` (`icon('name')`), fehlende dort ergänzen.
- Wiederverwendbare Bausteine: `style-tile`/`style-grid` (Auswahlkacheln), `chip chip--btn` (Auswahlchips), `section`/`section__head`, `row` (Listen), `cardHtml` (Spielerkarte), `crestSvg` (Wappen).

## Tests schreiben

- Hilfsfunktion `newStartedGame(seed)` in `tests/engine.test.js` (Spiel mit geöffnetem Starter-Pack). Vor `playDay` ggf. `s.pending = null`.
- Mehrsaison-Prüfungen gehören nach `scripts/sim/check.mjs` (mit Zielbereich), nicht in die Unit-Tests.
