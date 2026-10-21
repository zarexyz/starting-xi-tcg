# Starting XI TCG

Ein Fußballmanager fürs Handy, der drei Vorbilder verbindet: die Tiefe von Football Manager, das Sammeln von Ultimate Team und das Kartengefühl von Pokémon TCG Pocket.

Du gründest einen Verein in der Amateurliga, öffnest dein Starter-Pack, wählst deinen Starspieler und führst den Verein über Final Fours und Pokal bis an die Spitze.

## Was drin ist

- **Welt:** 60 fiktive Vereine aus 24 Ländern in 6 Ligen, Derbys und Rivalitäten, jeder Spieler existiert genau einmal
- **Sprachen:** Deutsch und Englisch (umschaltbar in den Optionen)
- **Statistik:** Torjäger, Vorlagen, Noten, Zu-null-Spiele, Heim-/Auswärts-/Formtabelle, Vereinschronik und Rekorde
- **Geschichten:** Schlagzeilen zu Serien, Comebacks, Favoritenstürzen, Derbys, ersten Toren und Meilensteinen, Gerüchte, Spieler des Monats, Torschützenkönig, Spieler und Elf der Saison
- **Spieltagsübersicht:** nach jedem Spiel alle Ergebnisse und die Tabelle mit Auf- und Abwärtspfeilen, Noten für beide Teams nach Positionen
- **Alles anklickbar:** jeder Verein und jeder Spieler öffnet seine Seite, mit Karrierestationen und Direktvergleich
- **Spieltag:** Vorbereitung mit Gegneranalyse, Spielstil (Konter-Kreislauf) und Formation, Siegprognose
- **Live-Spiel:** Ticker, Schlüsselszenen in Stufen (Durchbruch, Abschluss), Elfmeterschießen Schuss für Schuss, Gelbe und Rote Karten mit Sperren, Spielbericht mit Erklärung
- **Spielstand sichern:** Export und Import als Datei
- **Kader:** Müdigkeit, Verletzungen, Rotation, Co-Trainer-Aufstellung, Moral, Gehälter mit Soft-Cap
- **Karten:** illustrierte Porträts, 8 Werte (inklusive Mental und Torwart), Talentklassen Bronze, Silber, Gold und Ikone, Potenzial als Scout-Schätzung
- **Packs:** Starter-Pack, Draft-Packs (1 aus 3), Ausrüstungs-Packs mit Fitness, Training für einzelne Werte, Matchplänen und Taktik
- **Gegner:** Jeder Verein hat einen Trainer mit fester Spielphilosophie
- **Entwicklung:** zweimal pro Saison nach Alter, Spielzeit und Leistung, Durchschnittsnote und Form, Karriereende, Jugendakademie
- **Transfermarkt:** Kaufen mit Wechselwilligkeit, Verkaufen über Angebote, KI-Transferfenster
- **Wettbewerbe:** Liga, Pokal mit allen 60 Vereinen, Final Four mit Auf- und Abstieg

## Entwicklung

```bash
npm install
npm run dev      # Spiel im Browser
npm test         # Tests der Spiellogik
npm run sim      # zehn Saisons simulieren (Balancing-Check)
npm run build    # Produktionsbuild in dist/
```

Android-App und Play Store: siehe [docs/ANDROID.md](docs/ANDROID.md).

## Aufbau

```
src/engine/   Spiellogik ohne Oberfläche (testbar, später auch auf einem Server lauffähig)
src/state/    Spielstand, Speichern in drei Slots
src/ui/       Screens, Abläufe, Karten, Porträts, Wappen, Icons
src/styles/   Designsystem
tests/        Tests mit dem Node-Testrunner
scripts/      Kalibrierung und Saison-Simulation
```

Grundregel: `src/engine` kennt keine Oberfläche. Jede Aktion verändert den Spielstand über eine Funktion in `game.js` oder `market.js`. Der Store führt sie auf einer Kopie aus. Das ist die Grundlage für einen späteren Mehrspieler-Modus.

Alle Vereine und Spieler sind frei erfunden.
