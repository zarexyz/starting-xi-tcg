#!/usr/bin/env node
// =============================================================================
// Google Jules REST API Helper (v1alpha) — Review, Audit & Polish
// =============================================================================
// Nutzung:
//   npm run jules -- sources
//   npm run jules -- list
//   npm run jules -- audit full       (Kompletter Code-, Edge-Case- & UI-Audit)
//   npm run jules -- audit engine     (Engine-, Savegame- & Balancing-Audit)
//   npm run jules -- audit ui         (Mobile-UX-, Layout- & Darkmode-Audit)
//   npm run jules -- status <id>      (Status & Ergebnisse einer Session abrufen)
//   npm run jules -- msg <id> "..."   (Rückfrage/Anweisung an Jules senden)
//   npm run jules -- approve <id>     (Vorgeschlagenen Plan von Jules freigeben)
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
  console.error('Fehler: JULES_API_KEY nicht gefunden. Bitte in .env eintragen.');
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

const AUDITS = {
  full: {
    title: 'Review & Code-Audit v1.11 (Engine, Edge Cases & Mobile UI)',
    prompt: `Führe ein gründliches Code-Review und Qualitäts-Audit des aktuellen Stands (v1.11) durch. Lies zuerst CLAUDE.md und AGENTS.md.
Prüfe insbesondere:
1. Engine & Edge Cases (src/engine/):
   - Gibt es Randfälle bei der neuen Halbzeit-Entscheidung (v1.11: previewUserMatch, setHalftime, Pausenwechsel bei vorherigen Verletzungen/Platzverweisen in Hälfte 1), bei Verträgen/Transfers, Jugendakademie oder Saisonübergängen?
   - Gibt es Stellen, an denen alte Spielstände (Migration/ensure...) oder fehlende Felder zu Fehlern oder NaN-Werten führen können?
2. UI, Mobile-Darstellung & i18n (src/ui/, src/styles/main.css, src/i18n/):
   - Gibt es auf schmalen Smartphone-Screens (360px Breite) Layout-Brüche, abgeschnittene Elemente, fehlende Scrollbarkeit oder Kontrastprobleme im Hell-/Dunkelmodus?
   - Werden irgendwo Texte hartcodiert oder fehlen Platzhalter zwischen de.js und en.js?
3. Tests (tests/engine.test.js):
   - Führe "npm test", "npm run check" und "npm run build" aus.
   - Erstelle einen klaren Analysebericht mit den gefundenen Schwachstellen und behebe echte Bugs/Randfälle direkt inklusive passender Unit-Tests.`
  },
  engine: {
    title: 'Engine- & Edge-Case-Audit (src/engine/)',
    prompt: `Prüfe alle Module in src/engine/ auf Logikfehler, Determinismus-Brüche, Savegame-Kompatibilität und Edge Cases (insb. rund um v1.9 Vereinsleben, v1.10 Extras/Standards/PK und v1.11 Halbzeit-Wechsel). Führe npm test und npm run check aus und ergänze fehlende Randfall-Tests in tests/engine.test.js.`
  },
  ui: {
    title: 'Mobile-UI, UX & Darkmode Polish Audit (src/ui/ & main.css)',
    prompt: `Prüfe alle Screens in src/ui/screens/, die Komponenten in src/ui/components/ und src/styles/main.css auf Mobile-Usability (360px-412px Breite), Touch-Bedienbarkeit, abgeschnittene Texte, Modals und Darkmode-Kontraste. Behebe gefundene Darstellungsprobleme sauber ohne Eingriff in die Spielmechanik.`
  }
};

async function main() {
  const [cmd, arg1, ...rest] = process.argv.slice(2);

  if (!cmd || cmd === 'help') {
    console.log(`Jules CLI (Review & Audit Modus):
  npm run jules -- sources                      Verbundene GitHub-Repos anzeigen
  npm run jules -- list                         Aktuelle Sessions & Status anzeigen
  npm run jules -- audit <full|engine|ui>       Code-Review & Audit in Jules starten
  npm run jules -- prompt "<Titel>" "<Prompt>"  Eigenen Prüf-/Polish-Auftrag starten
  npm run jules -- status <sessionId>           Status, Plan & Aktivitäten einer Session
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
      const pr = s.outputs?.find(o => o.pullRequest)?.pullRequest?.url || 'in Arbeit / kein PR';
      console.log(`- [${s.id}] ${s.title || '(ohne Titel)'} | State: ${s.state || '?'} -> ${pr}`);
    }
    return;
  }

  if (cmd === 'audit') {
    const a = AUDITS[arg1 || 'full'];
    if (!a) {
      console.error(`Unbekannter Audit-Typ "${arg1}". Verfügbar: full, engine, ui.`);
      process.exit(1);
    }
    const data = await julesFetch('/sessions', {
      method: 'POST',
      body: JSON.stringify({
        title: a.title,
        prompt: a.prompt,
        sourceContext: {
          source: DEFAULT_SOURCE,
          githubRepoContext: { startingBranch: DEFAULT_BRANCH }
        },
        requirePlanApproval: true
      })
    });
    console.log(`Jules Audit-Session gestartet!`);
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
        requirePlanApproval: true
      })
    });
    console.log(`Jules-Session gestartet: https://jules.google.com/session/${data.id}`);
    return;
  }

  if (cmd === 'status') {
    if (!arg1) { console.error('Bitte sessionId angeben.'); process.exit(1); }
    const session = await julesFetch(`/sessions/${arg1}`);
    const acts = await julesFetch(`/sessions/${arg1}/activities?pageSize=20`);
    console.log('=== Session ===');
    console.log(JSON.stringify(session, null, 2));
    console.log('=== Aktivitäten ===');
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
