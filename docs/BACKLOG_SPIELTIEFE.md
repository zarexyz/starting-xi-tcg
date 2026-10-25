# Starting XI TCG — Backlog für echte Spieltiefe (ab v1.12+)

> **Abgleich mit dem aktuellen Stand (`v1.0` – `v1.11`):**  
> Alle Features aus `v1.0` bis `v1.11` (Derbys/Rivalitäten, Elf der Saison, 4-Seiten-Rückblick, ungefragte KI-Angebote, Jugendakademie, Wochenplan, Eingespieltheit/Startelf-Konstanz, 8 Spielstile + lernende KI, Wetter, Pressekonferenz, Standardschützen, Halbzeit-Entscheidung & Pausenwechsel) sind **bereits im Code umgesetzt** (siehe [`CLAUDE.md`](../CLAUDE.md)).

---

## Ticket 1: Sponsoren-Karten & Spieltags-Prämien (`v1.12` — Wirtschaftliche Identität)

### Problem & Spieltiefe
Aktuell hängen die Einnahmen pro Spieltag nur vom Liga-Tier, dem Tabellenplatz und der Fan-Stimmung (`fanIncomeFactor`) ab. Es fehlt ein greifbares **Sub-Ziel im einzelnen Spiel**, das die Aufstellung und die Halbzeit-Ansage (`allOut` vs. `hold`) beeinflusst.

### Konzept („Alles ist eine Karte“)
Zu Saisonbeginn legt der Vorstand dem Spieler **3 zufällige Sponsoren-Karten** zur Wahl vor. Man unterschreibt genau **eine** für die laufende Saison. Jede Sponsoren-Karte kombiniert ein **Grundgeld pro Heimspiel** mit einer **Bedingungs-Prämie**:
- **Sicherheits-Partner (`safe`):** Hohes Fixum pro Heimspiel (+15 %), keine Leistungsprämie. Ideal für Abstiegskampf.
- **Spektakel-Sponsor (`goals3`):** Kleineres Fixum (-10 % Heimbasis), aber kräftige Prämie bei **3+ eigenen Toren** im Spiel. Zwingt zur Frage: *Bei 2:0 zur Pause auf `allOut` gehen für die Prämie – oder Sieg absichern?*
- **Bollwerk-Sponsor (`cleanSheet`):** Kleineres Fixum (-5 % Heimbasis), Prämie für jedes **Zu-Null-Spiel (Weiße Weste)**. Belohnt `MAUERN` oder `hold` in der 2. Halbzeit.
- **Talentschmiede-Sponsor (`youth3`):** Prämie an jedem Spieltag, an dem **mindestens 3 U21-Spieler (`age <= 21`) oder Eigengewächse (`fromYouth`)** in der Startelf stehen. Verknüpft Finanzen direkt mit der Jugendakademie (`v1.9`).
- **Favoritenschreck-Sponsor (`underdog`):** Große Sonderprämie bei Punktgewinn (Sieg oder Remis) gegen stärkere Teams (`oppStrength >= userStrength + 3`), im Pokal oder im Derby.

### Technische Umsetzung
- **Engine (`src/engine/clublife.js` & `src/engine/economy.js`):**
  - `SPONSOR_KEYS = ['safe', 'goals3', 'cleanSheet', 'youth3', 'underdog']` mit sauber kalibrierten Faktoren.
  - In `ensureClubLife(state)`: `state.user.sponsor = { active: null, offers: [...], season: state.season, earned: 0 }` (abwärtskompatibel für alte Saves; zieht deterministisch 3 Angebote für die aktuelle Saison).
  - `pickSponsor(state, key)` wählt eines der 3 gezogenen Angebote. Falls beim Anpfiff noch keines gewählt wurde, bleibt es optional (oder `safe` greift als Fallback für KI/Sim).
  - Abrechnung nach jedem Pflichtspiel des Users über `ledger(state, 'ledger.sponsorBonus', amount, ...)` inklusive Ausweis im Kassenbuch.
- **UI (`src/ui/screens/club.js` & `src/ui/screens/prep.js`):**
  - Im Vereins-Tab (`club.js`): Auswahl aus den 3 Sponsoren-Karten (solange `active === null`), danach Anzeige der aktiven Sponsoren-Karte inkl. bisher verdienten Prämien (`earned`).
  - In der Spielvorbereitung (`prep.js`): Dezenter Hinweis auf die aktive Sponsoren-Bedingung für das anstehende Spiel.

### Abnahmekriterien
- [x] Alte Spielstände ohne `state.user.sponsor` erhalten über `ensureClubLife(state)` sofort 3 gültige Angebote.
- [x] Jede der 5 Sponsoren-Varianten zahlt im Jahresmittel über eine Durchschnittssaison ähnlich viel aus (±15 %), damit `npm run check` stabil bleibt.
- [x] Alle Texte zweisprachig in `src/i18n/de.js` und `src/i18n/en.js` (`sponsor.*`, `ledger.sponsorBonus`).
- [x] Unit-Tests in `tests/engine.test.js` für Auswahl, Bedingungsprüfung, Kassenbuch-Buchung und Saisonwechsel.

### Umsetzung (v1.12.0) – Abweichungen vom Entwurf
- Logik in eigenem Modul `src/engine/sponsors.js` (angebunden über `ensureClubLife`, `playDay`, Aufgaben-Handler), statt in `clublife.js`/`economy.js`.
- Schlüssel: `safety`, `spectacle`, `wall`, `academy`, `underdog`; Bedingungen `goals3`, `cleanSheet`, `youth3`, `underdog`. Feld `paid` statt `earned`, zusätzlich `hits` (Anzahl Prämien).
- Auswahl als **blockierende Postfach-Aufgabe** (wie das Saisonziel, Karten sind die Auswahlknöpfe), nicht im Vereins-Tab. Standardwahl für Sim/Tests: `safety`, sonst die erste Karte. Der Vereins-Tab zeigt Karte und Saisonbilanz.
- Faktoren (Anteil von `TIER_INCOME`): Fixum 0,15 / 0,05 / 0,05 / 0,04 / 0,05, Prämie – / 0,26 / 0,22 / 0,07 / 0,31. Gemessen je Saison relativ zum Sicherheits-Partner: 1,05 / 0,96 / 0,94 / 0,92 (`check.mjs`, Abschnitt 5d). Sponsoren bringen insgesamt rund 1,5 × Heimeinnahme je Saison zusätzlich.
- Spieltags-Kasse: Zeile „Zuschauer & Sponsoren“ heißt jetzt „Zuschauer“, Sponsor-Fixum und -Prämie stehen getrennt.

---

## Ticket 2: Kader-Rollen & Kabinen-Hierarchie (`v1.13` — Rotations-Dilemma)

### Problem & Spieltiefe
Momentan kann man einen Top-Star (75 OVR) problemlos 6 Spiele lang gesund auf die Bank setzen, ohne dass er murrt – Moral sinkt fast nur bei Niederlagen oder Unterbezahlung (`wantsRaise`).

### Konzept
Jeder Spieler im eigenen Kader hat eine **erwartete Kader-Rolle**, die sich aus seinem OVR im Verhältnis zum Team-Schnitt und seinem Alter ergibt:
1. **Schlüsselspieler (`star`):** Top-3 OVR im Kader (ab Mindestkadergröße 15). Erwartet fast immer Startelf, wenn fit (`condition >= 75`).
2. **Stammkraft (`regular`):** Platz 4–11 nach OVR. Erwartet regelmäßige Einsätze.
3. **Rotationsspieler (`rotation`):** Platz 12–16. Akzeptiert Bankplätze, freut sich über Einwechslungen zur Pause (`v1.11`) oder Pokalspiele.
4. **Perspektivspieler (`prospect`):** `age <= 21` außerhalb der Top-11 oder niedriges OVR. Keine Einsatzansprüche, bekommt aber Moral-Boost (+2) bei Einsätzen.

**Das Dilemma:**
- Sitzt ein fitter **Schlüsselspieler** (`star`) 2 Pflichtspiele infolge komplett draußen (weder Startelf noch Pausenwechsel), steigt `p.benchedStreak`; ab 3 Spielen verliert er Moral (-5) und meldet sich einmalig per Nachricht.
- **Vertrags-Kopplung (`contracts.js`):** Wer seine Rolle erfüllt bekommt (`benchedStreak === 0` und hohe Einsatzquote), gewährt -5 % Gehaltsrabatt bei Vertragsverlängerung; wer mit `benchedStreak >= 3` unzufrieden auf der Bank sitzt, verlangt +10 % Aufschlag.

### Technische Umsetzung
- **Engine (`src/engine/player.js`, `src/engine/contracts.js`, `src/engine/clublife.js`):**
  - `squadRole(state, player)` berechnet `'star' | 'regular' | 'rotation' | 'prospect'` relativ zu `clubPlayers(state, 'user')`.
  - Feld `p.benchedStreak` (wird in `afterUserMatch` gepflegt: nur erhöhen, wenn `p.condition >= 75 && !p.injury && !p.suspension` und Spieler weder in `starters` noch eingewechselt; bei Einsatz Reset auf `0`).
  - In `contractDemand(state, p)`: Aufschlag/Rabatt je nach Erfüllung der Rolle.
- **UI (`src/ui/components/card.js` & `src/ui/screens/squad.js`):**
  - Rollen-Abzeichen im Spieler-Detailmodal sowie ein kleines Warn-Badge bei `benchedStreak >= 2`.

### Abnahmekriterien
- [ ] Verletzte, gesperrte oder erschöpfte Spieler (`condition < 75`) erhöhen `benchedStreak` **nicht**.
- [ ] Halbzeit-Einwechslungen (`v1.11`) zählen als Einsatz und setzen `benchedStreak` auf `0` zurück.
- [ ] `npm run check` läuft grün durch; KI-Vereine sind nicht betroffen.
- [ ] Unit-Tests in `tests/engine.test.js` für `squadRole`, `benchedStreak` und `contractDemand`.

---

## Ticket 3: Karten-Spezialisierungen / Spielertypen (`v1.14` — Charakter auf den Karten)

### Problem & Spieltiefe
Zwei Stürmer mit `OVR 66` fühlen sich aktuell fast identisch an. Im echten TCG entsteht Tiefe dadurch, dass eine Karte eine **besondere situative Fähigkeit** mitbringt, die mit dem Rest des Spiels (Wetter, Standards, Halbzeitwechsel, Pokal) interagiert.

### Konzept („Alles ist eine Karte“)
Silber-, Gold- und Icon-Spieler (sowie erfahrene Bronze-Spieler ab 26 Jahren) können **genau 1 prägnantes Merkmal (`trait`)** besitzen, das als kleiner Stempel auf der Karte steht und einen **moderaten, situativen Bonus** gibt:
- **`JOKER` (Edeljoker):** +2,5 effektive Spielstärke (`rating`), wenn der Spieler in der **Halbzeitpause (`v1.11`) eingewechselt** wird.
- **`CLUTCH` (Nervenstark):** +3 `men` in `opts.big`-Spielen (Pokal, Final Four, Relegation, Derby) und höhere Treffsicherheit im Elfmeterschießen.
- **`FLANKENGOTT` (Flankengeber):** Für `LM/RM/LF/RF/LV/RV` – erhöht im Spielstil `FLUEGEL` die Vorlagen-Gewichtung und den Durchbruch (`p1`) leicht (+0,03).
- **`TURM` (Kopfballungeheuer):** Für `IV/ST` mit hoher Physis – stärkere Gewichtung und +0,04 Abschlusschance bei **Ecken (`kind === 'corner'`)**.
- **`ABRAEUMER` (Zweikampfmonster):** Für `ZDM/IV` – erhöht `defenderHold` um +2,5, hat aber eine leicht höhere Gelb-Wahrscheinlichkeit (+10 %).
- **`DAUERLAEUFER` (Pferdelunge):** Verliert pro Spieltag 20 % weniger Kondition.

### Technische Umsetzung
- **Engine (`src/engine/constants.js`, `src/engine/player.js`, `src/engine/match.js`):**
  - `TRAITS` in `constants.js`.
  - Deterministische Funktion `traitOf(player)` (nutzt `player.trait` oder leitet deterministisch aus `player.id` + Position + Attributen ab, sodass auch alte Spielstände sofort konsistente Merkmale für ~45 % der Spieler haben).
  - Sanfte Einbindung in `simulateMatch` (`match.js`) und Erwähnung in `analyzeMatch` (*„Warum gewonnen/verloren“*), wenn ein eingewechselter `JOKER` trifft (`why.jokerGoal`).
- **UI (`src/ui/components/card.js`):**
  - Dezentes Merkmal-Badge auf der Karte und Beschreibung im Spieler-Modal.

### Abnahmekriterien
- [ ] Maximal **ein** Merkmal pro Spieler; ca. 40–50 % aller Spieler haben ein Merkmal.
- [ ] Keine Verschiebung der Gesamt-Tor-Durchschnitte in `npm run check`.
- [ ] Wenn ein `JOKER` nach Pausen-Einwechslung trifft, zeigt `analyzeMatch` den Grund `why.jokerGoal`.
- [ ] Vollständige Übersetzung (`trait.<KEY>.name`, `trait.<KEY>.desc`, `why.jokerGoal`) in `de.js` und `en.js`.

---

## Ticket 4: Schlüsselduell & Positions-Mismatch in der Vorbereitung (`v1.15` — Taktische Aufstellung)

### Problem & Spieltiefe
In `v1.10` verrät das Scouting bereits den *schwächsten Mannschaftsteil* des Gegners. In `match.js` wird bei jedem Angriff ein Angreifer gegen einen Verteidiger gewürfelt – aber **die Seite auf dem Platz (Links / Mitte / Rechts)** ist noch entkoppelt. Es ist also egal, ob mein schneller Linksaußen (`LF`) gegen deren langsamen Rechtsverteidiger (`RV`) oder deren starken Linksverteidiger (`LV`) spielt.

### Konzept
Wir verknüpfen die Spielfeld-Zonen (**Links / Zentrum / Rechts**) sanft miteinander und machen das in der Spielvorbereitung als **„Schlüsselduell des Spieltags“** sichtbar:
- **Zonen-Kopplung:**
  - Eigener Angriff über **Links** (`LF`, `LM`) trifft bevorzugt auf die **rechte Defensivseite** des Gegners (`RV`, rechter `IV`).
  - Eigener Angriff über **Rechts** (`RF`, `RM`) trifft bevorzugt auf die **linke Defensivseite** (`LV`, linker `IV`).
  - Eigener Angriff durchs **Zentrum** (`ST`, `ZOM`, `ZM`) trifft bevorzugt auf `ZDM` und zentrale `IV`.
- **Spielvorbereitung (`prep.js`):**
  - Zeigt vor dem Anpfiff das **wichtigste 1-gegen-1-Schlüsselduell** (z. B. *„Schlüsselduell: Dein LF gegen Gegner-RV (+7 Vorteil)“*).

### Technische Umsetzung
- **Engine (`src/engine/match.js` & `src/engine/forecast.js`):**
  - Spur `slotLane(slot)` aus der `x`-Koordinate des Formations-Slots (`x < 35 => 'L'`, `x > 65 => 'R'`, sonst `'C'`).
  - In `pickDefender(rng, defSlots, shooterSlot)`: Verteidiger auf der **gegenüberliegenden Spur** (`L <-> R`, `C <-> C`) erhalten den Gewichtungsfaktor `1.8x`.
  - Neue Funktion `keyMatchup(state, userSetup, oppSetup)` liefert das markanteste 1-gegen-1-Duell für die Spielvorbereitung.
- **UI (`src/ui/screens/prep.js`):**
  - Kompakte Schlüsselduell-Anzeige in der Spielvorbereitung.

### Abnahmekriterien
- [ ] Die Spur-Zuordnung (`L`/`C`/`R`) wird automatisch aus den bestehenden `x`-Koordinaten von `FORMATIONS` berechnet.
- [ ] In `pickDefender` bleibt die Gesamtwahrscheinlichkeit für `broke` (`p1`) im Ligaschnitt neutral (`npm run check` grün).
- [ ] Unit-Test prüft, dass ein `LF` signifikant häufiger gegen den gegnerischen `RV` ins Duell geht als gegen den `LV`.

---

## Ticket 5: Karten-Evolution & „Vereins-Ikonen“ (`v1.16` — Emotionale Bindung vs. Wirtschaft)

### Problem & Spieltiefe
Da jeder Spieler auf der Welt ein Unikat ist, wächst man über mehrere Saisons mit seinen gezogenen Karten zusammen. Ein treuer Stammspieler aus Liga 6, der den Verein durch 3 Aufstiege geschossen hat, wird in Liga 3 bisher rein rechnerisch einfach verkauft. Es fehlt ein mechanisches & visuelles Gewicht für **Vereinstreue**.

### Konzept („Alles ist eine Karte“)
Spieler, die für den **eigenen Verein** besondere Meilensteine erreichen, verdienen sich einen dauerhaften **Ehren-Stempel (Ribbon)** auf ihrer Karte:
1. **Publikumsliebling (`fanFav`):** Ab **50 Pflichtspielen** (oder 25 Toren) für deinen Verein.
   - *Effekt:* Steht er in der Startelf, gibt es +0,5 Fan-Stimmung nach Siegen; er verlangt bei Vertragsverlängerungen 10 % weniger Gehalt (`Vereinstreue`).
   - *Dilemma beim Verkauf:* Verkaufst du oder entlässt du einen Publikumsliebling, fällt die **Fan-Stimmung (`u.mood.fans`) sofort um -8 Punkte** und die Zeitung schreibt eine emotionale Schlagzeile.
2. **Vereins-Legende (`clubLegend`):** Ab **100 Pflichtspielen** (oder 50 Toren) für deinen Verein.
   - *Effekt:* Karte erhält eine edle Ehren-Plakette; zählt für die Kapitäns-Wertung (`leadBonus` in `clublife.js`) wie +10 `men` und gibt 15 % Treue-Rabatt bei Vertragsverlängerung.
   - *Karriereende-Bonus:* Beendet eine **Vereins-Legende** bei dir im Kader ihre Karriere (`retirements`), erhältst du einmalig eine kostenlose **Gold-Trainingskarte** (*„Weitergabe der Erfahrung“*).

### Technische Umsetzung
- **Engine (`src/engine/identity.js`, `src/engine/contracts.js`, `src/engine/market.js`, `src/engine/clublife.js`):**
  - `loyaltyStatus(player)` liefert `null | 'fanFav' | 'clubLegend'` anhand der Pflichtspiele/Tore für `'user'`.
  - In `contracts.js` (`contractDemand`): Faktor `0.90` für `fanFav`, `0.85` für `clubLegend`.
  - In `market.js` (Verkauf/Entlassung): Prüft `loyaltyStatus(player)` -> zieht Fan-Stimmung ab (-8 bzw. -12) und erzeugt `addNews(state, 'mood', 'news.soldFanFav', ...)`.
- **UI (`src/ui/components/card.js` & `src/ui/screens/market.js`):**
  - Dezentes Treue-Abzeichen auf der Karte; Warnhinweis im Verkaufs-Dialog (*„Achtung: Publikumsliebling – Verkauf kostet Fan-Stimmung (-8)“*).

### Abnahmekriterien
- [ ] Meilensteine zählen nur Pflichtspiele/Tore für den **eigenen Verein** (bei Vereinswechsel zu einem KI-Klub erlischt der Status).
- [ ] Verkaufs-Dialog zeigt vor dem Bestätigen transparent den Fan-Stimmungs-Abzug an.
- [ ] Alle Texte in `de.js` und `en.js` vorhanden; Unit-Tests für Gehaltsrabatt und Fan-Malus bei Verkauf.
