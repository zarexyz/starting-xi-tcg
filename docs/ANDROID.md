# Von der Web-App zum Play Store

Diese Anleitung führt dich auf deinem Windows-Rechner von diesem Projekt zu einer Android-App im Google Play Store. Die App wird mit **Capacitor** verpackt: Das Spiel bleibt eine Web-App, läuft aber als echte Android-App mit eigenem Icon und funktioniert ohne Internet.

## 1. Einmalig installieren

1. **Node.js** (LTS-Version) von nodejs.org. Prüfen mit `node -v` im Terminal.
2. **Android Studio** von developer.android.com/studio. Beim ersten Start den Assistenten durchlaufen lassen, er installiert das Android SDK.
3. **Git**, falls noch nicht vorhanden.

## 2. Projekt holen und testen

```bash
git clone https://github.com/zarexyz/starting-xi-tcg.git
cd starting-xi-tcg
git checkout claude/v1-roadmap
npm install
npm test          # 16 Tests der Spiellogik müssen grün sein
npm run dev       # Spiel im Browser unter http://localhost:3000
```

## 3. Android-Projekt erzeugen (einmalig)

Vorher in `capacitor.config.json` die **App-ID** festlegen. Sie ist für immer mit der App im Play Store verbunden und kann später nicht geändert werden. Üblich ist eine umgedrehte Domain, zum Beispiel `de.deinname.startingxi`.

```bash
npm install @capacitor/core @capacitor/android @capacitor/app
npm install -D @capacitor/cli
npm run build
npx cap add android
npx @capacitor/assets generate --android   # Icon und Splash aus dem Ordner resources/
npx cap sync android
```

Danach gibt es einen Ordner `android/`. Diesen Ordner mit ins Git aufnehmen.

## 4. Auf dem eigenen Handy testen

1. Am Handy die Entwickleroptionen und **USB-Debugging** aktivieren.
2. Handy per USB anschließen.
3. `npm run android` öffnet Android Studio. Oben das Handy auswählen und auf den grünen Startknopf drücken.

Nach jeder Änderung am Spiel reicht `npm run android` erneut.

## 5. Signierte App für den Play Store bauen

In Android Studio: **Build → Generate Signed App Bundle / APK → Android App Bundle**.

- Beim ersten Mal einen **neuen Keystore** anlegen.
- **Den Keystore und das Passwort sicher aufbewahren**, zum Beispiel im Passwortmanager und zusätzlich offline. Ohne ihn kannst du keine Updates mehr veröffentlichen.
- Ergebnis ist eine `.aab`-Datei unter `android/app/release/`.

Vor jedem Update in `android/app/build.gradle` den `versionCode` um 1 erhöhen und `versionName` anpassen, zum Beispiel `1.0.1`.

## 6. Google Play Console

1. Entwicklerkonto unter play.google.com/console anlegen (einmalige Gebühr, Identitätsprüfung).
2. **App erstellen**: Name „Starting XI“, Sprache Deutsch, Spiel, kostenlos.
3. Pflichtangaben ausfüllen:
   - **Datenschutzerklärung**: Vorlage liegt unter `public/datenschutz.html`. Platzhalter ausfüllen und öffentlich erreichbar machen, zum Beispiel über Vercel unter `/datenschutz.html`.
   - **Datensicherheit**: Die App erhebt und teilt keine Daten.
   - **Inhaltseinstufung**: Fragebogen ausfüllen (kein Glücksspiel mit Echtgeld, keine Werbung).
   - **Zielgruppe**: ab 13 Jahren empfohlen, weil Packs zufällige Inhalte haben.
4. Store-Eintrag: Kurzbeschreibung, Beschreibung, Icon (512 × 512, liegt in `public/icon-512.png`), Vorschaubild 1024 × 500 und mindestens zwei Screenshots vom Handy.

## 7. Pflicht-Testphase für neue Konten

Neue private Entwicklerkonten brauchen vor der Veröffentlichung einen **geschlossenen Test mit mindestens 12 Testern, die 14 Tage am Stück dabei sind**. Erst danach kannst du den Zugang zur Produktion beantragen.

So gehst du vor:

1. In der Play Console unter **Testen → Geschlossener Test** einen Track anlegen und die `.aab` hochladen.
2. Eine Google-Gruppe oder eine E-Mail-Liste mit deinen Testern anlegen. Am besten 15 bis 20 Leute, damit Ausfälle nicht schaden.
3. Den Opt-in-Link an alle schicken. Jeder muss beitreten **und die App installieren**.
4. Niemand darf in den 14 Tagen austreten, sonst beginnt seine Zählung neu.
5. Nach den 14 Tagen unter **Dashboard → Produktionszugriff beantragen** die Fragen zum Test beantworten.

Tipp: Bitte die Tester um kurzes Feedback. Google fragt beim Antrag, was du aus dem Test gelernt hast.

## 8. Veröffentlichen

Nach der Freigabe die `.aab` im Track **Produktion** hochladen, Release-Notizen schreiben und zur Prüfung einreichen. Die erste Prüfung dauert meist einige Tage.

## Häufige Fragen

**Muss ich Vercel weiter nutzen?** Nicht für die App. Vercel ist praktisch für die Web-Version, zum Testen im Browser und um die Datenschutzerklärung zu hosten.

**Wo liegt der Spielstand?** Lokal auf dem Gerät. Bei einer Neuinstallation ist er weg. Ein Cloud-Speicher kommt erst mit dem Mehrspieler-Modus.

**Kann ich später Werbung und Käufe einbauen?** Ja, über die Capacitor-Plugins für AdMob und Google Play Billing. Dann müssen Datenschutzerklärung und Datensicherheit angepasst werden.
