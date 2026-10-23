#!/usr/bin/env node
// =============================================================================
// Google Jules REST API Helper (v1alpha) für Starting XI TCG
// =============================================================================
// Nutzung:
//   1. API-Key unter https://jules.google.com/settings#api erstellen
//   2. Lokal in .env eintragen: JULES_API_KEY=dein_key
//   3. Befehle ausführen:
//      npm run jules -- sources
//      npm run jules -- list
//      npm run jules -- ticket 1
//      npm run jules -- status <sessionId>
//      npm run jules -- msg <sessionId> "Bitte noch Test X ergänzen"
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';

const API_BASE = 'https://jules.googleapis.com/v1alpha';
const DEFAULT_SOURCE = 'sources/github/zarexyz/starting-xi-tcg';
const DEFAULT_BRANCH = 'main';

function loadApiKey() {
  if (process.env.JULES_API_KEY) return process.env.JULES_API_KEY.trim();
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const m = line.match(/^\s*JULES_API_KEY\s*=\s*(.+?)\s*$/);
      if (m) return m[1].replace(/^['"]|['"]$/g, '');
    }
  }
  console.error('Fehler: JULES_API_KEY nicht gefunden. Bitte in .env (JULES_API_KEY=...) oder als Umgebungsvariable setzen.');
  process.exit(1);
}

async function julesFetch(endpoint, opts = {}) {
  const apiKey = loadApiKey();
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
      ...(opts.headers || {})
    }
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!res.ok) {
    console.error(`Jules API Fehler (${res.status}):`, JSON.stringify(data, null, 2));
    process.exit(1);
  }
  return data;
}

const TICKETS = {
  '1': {
    title: 'v1.12: Sponsoren-Karten & Spieltags-Prämien',
    prompt: `Implementiere Ticket 1 (v1.12: Sponsoren-Karten & Spieltags-Prämien) aus docs/BACKLOG_SPIELTIEFE.md.
Beachte zwingend alle Vorgaben aus AGENTS.md und CLAUDE.md:
- Reine Engine-Logik in src/engine/clublife.js und src/engine/economy.js (deterministisch über rng, Abwärtskompatibilität in ensureClubLife).
- UI-Integration im Vereins-Reiter (src/ui/screens/club.js) und kompakter Hinweis in der Spielvorbereitung (src/ui/screens/prep.js).
- Zweisprachige Texte in src/i18n/de.js und src/i18n/en.js (gleiche Schlüssel).
- Neue Unit-Tests in tests/engine.test.js.
- Stelle sicher, dass "npm test", "npm run check" und "npm run build" fehlerfrei durchlaufen.`
  },
  '2': {
    title: 'v1.13: Kader-Rollen & Kabinen-Hierarchie',
    prompt: `Implementiere Ticket 2 (v1.13: Kader-Rollen & Kabinen-Hierarchie) aus docs/BACKLOG_SPIELTIEFE.md.
Beachte zwingend alle Vorgaben aus AGENTS.md und CLAUDE.md:
- squadRole(state, player) und benchedStreak-Logik (nur für fitte, nicht gesperrte/verletzte Spieler; Halbzeit-Einwechslung setzt Streak zurück).
- Kopplung an contractDemand in src/engine/contracts.js.
- Dezente Rollen- und Unmut-Anzeige in src/ui/components/card.js und src/ui/screens/squad.js.
- Zweisprachige Texte in src/i18n/de.js und src/i18n/en.js.
- Neue Unit-Tests in tests/engine.test.js.
- Stelle sicher, dass "npm test", "npm run check" und "npm run build" fehlerfrei durchlaufen.`
  },
  '3': {
    title: 'v1.14: Karten-Spezialisierungen (Spielertypen)',
    prompt: `Implementiere Ticket 3 (v1.14: Karten-Spezialisierungen / Spielertypen) aus docs/BACKLOG_SPIELTIEFE.md.
Beachte zwingend alle Vorgaben aus AGENTS.md und CLAUDE.md:
- Definiere TRAITS (JOKER, CLUTCH, FLANKENGOTT, TURM, ABRAEUMER, DAUERLAEUFER) in src/engine/constants.js und traitOf(player) in src/engine/player.js.
- Binde die moderaten situativen Effekte in src/engine/match.js (inkl. why.jokerGoal in analyzeMatch) ein.
- Zeige das Merkmal als dezentes Badge auf der Karte (src/ui/components/card.js) und im Spieler-Modal.
- Zweisprachige Texte in src/i18n/de.js und src/i18n/en.js.
- Neue Unit-Tests in tests/engine.test.js.
- Stelle sicher, dass "npm test", "npm run check" und "npm run build" fehlerfrei durchlaufen.`
  },
  '4': {
    title: 'v1.15: Schlüsselduell & Positions-Mismatch (Links/Mitte/Rechts)',
    prompt: `Implementiere Ticket 4 (v1.15: Schlüsselduell & Positions-Mismatch in der Vorbereitung) aus docs/BACKLOG_SPIELTIEFE.md.
Beachte zwingend alle Vorgaben aus AGENTS.md und CLAUDE.md:
- Berechne die Spur (L/C/R) aus den x-Koordinaten von FORMATIONS und gewichte in pickDefender (src/engine/match.js) Verteidiger der gegenüberliegenden Spur (L<->R, C<->C) mit Faktor 1.8x.
- Ergänze keyMatchup in src/engine/forecast.js und zeige das Schlüsselduell in src/ui/screens/prep.js an.
- Zweisprachige Texte in src/i18n/de.js und src/i18n/en.js.
- Neue Unit-Tests in tests/engine.test.js.
- Stelle sicher, dass "npm test", "npm run check" und "npm run build" fehlerfrei durchlaufen.`
  },
  '5': {
    title: 'v1.16: Karten-Evolution & Vereins-Ikonen',
    prompt: `Implementiere Ticket 5 (v1.16: Karten-Evolution & Vereins-Ikonen) aus docs/BACKLOG_SPIELTIEFE.md.
Beachte zwingend alle Vorgaben aus AGENTS.md und CLAUDE.md:
- Berechne loyaltyStatus(player) ('fanFav' ab 50 Spielen/25 Toren, 'clubLegend' ab 100 Spielen/50 Toren für den eigenen Verein) in src/engine/identity.js.
- Treue-Rabatt in src/engine/contracts.js, Fan-Stimmungsbonus in src/engine/clublife.js und Fan-Stimmungs-Malus (-8/-12) beim Verkauf in src/engine/market.js.
- Ehren-Abzeichen auf der Karte (src/ui/components/card.js) und Warnhinweis im Verkaufs-Dialog (src/ui/screens/market.js).
- Zweisprachige Texte in src/i18n/de.js und src/i18n/en.js.
- Neue Unit-Tests in tests/engine.test.js.
- Stelle sicher, dass "npm test", "npm run check" und "npm run build" fehlerfrei durchlaufen.`
  }
};

async function main() {
  const [cmd, arg1, ...rest] = process.argv.slice(2);

  if (!cmd || cmd === 'help') {
    console.log(`Jules CLI für Starting XI TCG:
  npm run jules -- sources                      Verbundene GitHub-Repos anzeigen
  npm run jules -- list                         Letzte Sessions & PR-Links anzeigen
  npm run jules -- ticket <1..5> [branch]       Backlog-Ticket 1–5 starten (AUTO_CREATE_PR)
  npm run jules -- prompt "<Titel>" "<Prompt>"  Freien Auftrag an Jules senden
  npm run jules -- status <sessionId>           Status & letzte Aktivitäten einer Session
  npm run jules -- msg <sessionId> "<Text>"     Nachricht an laufende Session senden
  npm run jules -- approve <sessionId>          Plan einer Session freigeben`);
    return;
  }

  if (cmd === 'sources') {
    const data = await julesFetch('/sources');
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (cmd === 'list') {
    const data = await julesFetch('/sessions?pageSize=10');
    for (const s of data.sessions || []) {
      const pr = s.outputs?.find(o => o.pullRequest)?.pullRequest?.url || 'noch kein PR';
      console.log(`- [${s.id}] ${s.title || '(ohne Titel)'} -> ${pr}`);
    }
    return;
  }

  if (cmd === 'ticket') {
    const t = TICKETS[arg1];
    if (!t) {
      console.error(`Unbekanntes Ticket "${arg1}". Verfügbar: 1, 2, 3, 4, 5.`);
      process.exit(1);
    }
    const branch = rest[0] || DEFAULT_BRANCH;
    const data = await julesFetch('/sessions', {
      method: 'POST',
      body: JSON.stringify({
        title: t.title,
        prompt: t.prompt,
        sourceContext: {
          source: DEFAULT_SOURCE,
          githubRepoContext: { startingBranch: branch }
        },
        automationMode: 'AUTO_CREATE_PR'
      })
    });
    console.log(`Jules-Session gestartet!`);
    console.log(`  ID:    ${data.id}`);
    console.log(`  Titel: ${data.title}`);
    console.log(`  Web:   https://jules.google.com/session/${data.id}`);
    return;
  }

  if (cmd === 'prompt') {
    const title = arg1;
    const prompt = rest.join(' ');
    if (!title || !prompt) {
      console.error('Nutzung: npm run jules -- prompt "<Titel>" "<Auftrag>"');
      process.exit(1);
    }
    const data = await julesFetch('/sessions', {
      method: 'POST',
      body: JSON.stringify({
        title,
        prompt,
        sourceContext: {
          source: DEFAULT_SOURCE,
          githubRepoContext: { startingBranch: DEFAULT_BRANCH }
        },
        automationMode: 'AUTO_CREATE_PR'
      })
    });
    console.log(`Jules-Session gestartet: https://jules.google.com/session/${data.id}`);
    return;
  }

  if (cmd === 'status') {
    if (!arg1) { console.error('Bitte sessionId angeben.'); process.exit(1); }
    const session = await julesFetch(`/sessions/${arg1}`);
    const acts = await julesFetch(`/sessions/${arg1}/activities?pageSize=10`);
    console.log('=== Session ===');
    console.log(JSON.stringify(session, null, 2));
    console.log('=== Letzte Aktivitäten ===');
    console.log(JSON.stringify(acts, null, 2));
    return;
  }

  if (cmd === 'msg') {
    const msg = rest.join(' ');
    if (!arg1 || !msg) { console.error('Nutzung: npm run jules -- msg <sessionId> "<Text>"'); process.exit(1); }
    await julesFetch(`/sessions/${arg1}:sendMessage`, {
      method: 'POST',
      body: JSON.stringify({ prompt: msg })
    });
    console.log(`Nachricht an Session ${arg1} gesendet.`);
    return;
  }

  if (cmd === 'approve') {
    if (!arg1) { console.error('Bitte sessionId angeben.'); process.exit(1); }
    await julesFetch(`/sessions/${arg1}:approvePlan`, { method: 'POST', body: '{}' });
    console.log(`Plan für Session ${arg1} freigegeben.`);
    return;
  }

  console.error(`Unbekannter Befehl: ${cmd}`);
  process.exit(1);
}

main();
