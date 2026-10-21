// =============================================================================
// Starting XI TCG — Einstieg: Rendering, Navigation, Eingaben
// =============================================================================

import { store, subscribe, notify, act, setUi, setView, toast, startGame, resumeGame, updateSettings } from './state/store.js';
import { deleteGame } from './state/storage.js';
import { exportSave, pickSaveFile, parseSave } from './state/backup.js';
import {
  createGame, openStarterPack, pickDraft, closePending, buyPack, useItem, setUserSetup, autoLineup,
  placePlayer, swapPlayers, releasePlayer, playDay, setAutoLineup, acknowledgeDevReport, dismissTips, acknowledgeSeasonSummary, markRead, markAllRead, userMatch, ensureUserSetup
} from './engine/game.js';
import { CONSUMABLES } from './engine/packs.js';
import { clubPlayers } from './engine/world.js';

import { tabbar, sheet } from './ui/shell.js';
import { titleScreen, foundScreen } from './ui/screens/title.js';
import { homeScreen } from './ui/screens/home.js';
import { squadScreen, playerSheet } from './ui/screens/squad.js';
import { clubSheet } from './ui/screens/clubpage.js';
import { leagueScreen } from './ui/screens/league.js';
import { marketScreen } from './ui/screens/market.js';
import { clubScreen } from './ui/screens/club.js';
import { inboxSheet, newsSheet, itemsSheet } from './ui/sheets.js';
import { packFlow } from './ui/flows/pack.js';
import { prepFlow } from './ui/flows/prep.js';
import { matchFlow, startMatch, stopMatch, matchControl } from './ui/flows/match.js';
import { resultFlow, seasonFlow } from './ui/flows/result.js';
import { devFlow } from './ui/flows/develop.js';
import { transfersView, transferSheetButtons, foreignPlayerActions, transferHandlers, offersSheetBody } from './ui/screens/transfers.js';
import { setTransferRenderers } from './ui/screens/squad.js';
import { playSound } from './ui/sound.js';
import { icon } from './ui/icons.js';
import { esc } from './ui/html.js';
import { loadLocalFonts } from './fonts.js';

loadLocalFonts();

setTransferRenderers(transferSheetButtons, foreignPlayerActions);

const app = document.getElementById('app');

// -----------------------------------------------------------------------------
// Rendering
// -----------------------------------------------------------------------------

let confirmFn = null;
let lastFlowKey = null;

function confirmSheet(c) {
  return sheet(c.title, `
    <p>${esc(c.text)}</p>
    <div class="confirm-actions">
      <button class="btn btn--secondary" data-action="close-sheet">Abbrechen</button>
      <button class="btn ${c.danger ? 'btn--danger' : 'btn--primary'}" data-action="confirm-yes">${esc(c.yes)}</button>
    </div>`);
}

function askConfirm(title, text, yes, fn, danger = true) {
  confirmFn = fn;
  setUi({ sheet: { type: 'confirm', title, text, yes, danger } });
}

function sheetHtml(game, ui) {
  const s = ui.sheet;
  if (!s) return '';
  if (s.type === 'confirm') return confirmSheet(s);
  if (!game) return '';
  if (s.type === 'player') return playerSheet(game, s.id, { back: !!s.prev });
  if (s.type === 'club') return clubSheet(game, s.id, { back: !!s.prev });
  if (s.type === 'inbox') return inboxSheet(game);
  if (s.type === 'news') return newsSheet(game, s.id);
  if (s.type === 'items') return itemsSheet(game, ui);
  if (s.type === 'offers') return sheet('Angebote', offersSheetBody(game, s.id));
  return '';
}

function flowHtml(game, ui) {
  const f = ui.flow;
  if (f?.type === 'prep') return prepFlow(game, ui);
  if (f?.type === 'match') return matchFlow(game, f);
  if (f?.type === 'result') return resultFlow(game, f);
  if (f?.type === 'pack' && game.pending) return packFlow(game, ui);
  if (!f && game.seasonSummary) return seasonFlow(game);
  if (!f && game.devReport) return devFlow(game);
  return '';
}

function render() {
  const { game, ui } = store;

  // Während das Live-Match läuft, steuert die Animation das DOM selbst
  if (ui.flow?.type === 'match' && document.querySelector('.matchflow')) {
    renderToast();
    return;
  }

  // Fokus und Scrollposition in Sheets merken
  const active = document.activeElement;
  const focusKey = active?.dataset?.input;
  const selStart = active?.selectionStart;
  const sheetScroll = document.querySelector('.sheet')?.scrollTop || 0;
  const flowScroll = document.querySelector('.fullscreen > .screen')?.scrollTop || 0;

  let html = '';
  if (ui.screen === 'title') html = titleScreen(store);
  else if (ui.screen === 'found') html = foundScreen(store);
  else if (game) {
    const tab = ui.tab;
    let screen = '';
    if (tab === 'home') screen = homeScreen(game, ui);
    if (tab === 'squad') screen = squadScreen(game, ui);
    if (tab === 'league') screen = leagueScreen(game, ui);
    if (tab === 'market') screen = marketScreen(game, ui, { transfers: transfersView });
    if (tab === 'club') screen = clubScreen(game, ui, store);
    html = screen + tabbar(tab) + flowHtml(game, ui);
  }
  html += sheetHtml(game, ui);
  html += ui.toast ? `<div class="toast" role="status">${esc(ui.toast)}</div>` : '';
  app.innerHTML = html;
  document.body.classList.toggle('has-overlay', !!(ui.sheet || ui.flow || game?.seasonSummary || game?.devReport));

  if (focusKey) {
    const el = app.querySelector(`[data-input="${focusKey}"]`);
    if (el) {
      el.focus();
      if (selStart != null && el.setSelectionRange) el.setSelectionRange(selStart, selStart);
    }
  }
  const sh = document.querySelector('.sheet');
  if (sh && sheetScroll) sh.scrollTop = sheetScroll;
  const fl = document.querySelector('.fullscreen > .screen');
  const flowKey = ui.flow ? ui.flow.type : game?.seasonSummary ? 'season' : game?.devReport ? 'dev' : null;
  if (fl && flowScroll && flowKey && flowKey === lastFlowKey) fl.scrollTop = flowScroll;
  lastFlowKey = flowKey;
}

function renderToast() {
  document.querySelector('.toast')?.remove();
  if (store.ui.toast) app.insertAdjacentHTML('beforeend', `<div class="toast" role="status">${esc(store.ui.toast)}</div>`);
}

subscribe(render);

// -----------------------------------------------------------------------------
// Aktionen
// -----------------------------------------------------------------------------

function openPackFlow() {
  setUi({ flow: { type: 'pack' }, pack: { stage: 'sealed', flipped: [] }, sheet: null });
}

/** Heimatland-Vorschlag bei der Gründung, nach Gerätesprache */
function defaultCountry() {
  const lang = (navigator.language || 'de').toLowerCase();
  const map = { 'de-at': 'AUT', 'de': 'GER', 'en-us': 'USA', 'en': 'ENG', 'es-mx': 'MEX', 'es-ar': 'ARG', 'es-co': 'COL', 'es': 'ESP', 'it': 'ITA', 'fr-be': 'BEL', 'nl-be': 'BEL', 'fr': 'FRA', 'nl': 'NED', 'pt-br': 'BRA', 'pt': 'POR', 'tr': 'TUR', 'pl': 'POL', 'hr': 'CRO', 'sr': 'SRB', 'el': 'GRE', 'da': 'DEN', 'sv': 'SWE', 'ja': 'JPN' };
  return map[lang] || map[lang.slice(0, 2)] || 'GER';
}

/** Spieler- oder Vereinsseite öffnen; aus einer anderen Detailseite heraus mit Zurück-Knopf */
function openDetail(type, id) {
  const cur = store.ui.sheet;
  if (cur && cur.type === type && cur.id === id) return;
  const prev = cur && ['player', 'club', 'news'].includes(cur.type) ? cur : null;
  if (type === 'player' && !store.game?.players[id]) { toast('Dieser Spieler hat seine Karriere beendet.'); return; }
  setUi({ sheet: { type, id, prev } });
}

function snapshotPlayers(game, clubIds) {
  const snap = {};
  for (const id of clubIds) for (const p of clubPlayers(game, id)) snap[p.id] = structuredClone(p);
  return snap;
}

function kickoff(instant) {
  const pre = store.game;
  const entry = userMatch(pre);
  if (!entry) return;
  const snapshot = snapshotPlayers(pre, [entry.m.home, entry.m.away]);
  const res = act(playDay);
  if (!res || res.error) return;
  const data = { ...res, snapshot };
  if (instant) {
    setUi({ flow: { type: 'result', data } });
    window.scrollTo(0, 0);
    return;
  }
  store.ui.flow = { type: 'match', data };
  document.querySelector('.matchflow')?.remove();
  notify();
  startMatch(store.game, store.ui.flow, store.settings);
}

function simDay() {
  const res = act(playDay);
  if (res && !res.error) {
    kickoffResultToast(res);
  } else {
    toast('Spieltag gespielt.');
  }
}

function kickoffResultToast(res) {
  const r = res.result;
  toast(`${res.label}: ${r.hg}:${r.ag}`);
}

function lineupTap({ slot, id, from }) {
  const game = store.game;
  const setup = ensureUserSetup(structuredClone(game));
  const sel = store.ui.selected;
  const tapped = from === 'slot' ? setup.lineup[slot] || null : id || null;
  if (!sel) {
    if (tapped) { setUi({ selected: tapped }); playSound('tap', store.settings); }
    return;
  }
  if (sel === tapped) { setUi({ selected: null }); return; }
  const inSquad = pid => Object.values(setup.lineup).includes(pid) || setup.bench.includes(pid);
  // Zwei Spieler außerhalb des Kaders: nur die Auswahl wechseln
  if (from === 'reserve' && !inSquad(sel)) { setUi({ selected: tapped }); return; }
  const target = tapped ? { playerId: tapped } : from === 'slot' ? { slot } : { bench: true };
  const res = act(swapPlayers, sel, target);
  if (res && res.ok === false && res.reason === 'injured') toast('Verletzte Spieler können nicht spielen.');
  if (res && res.ok === false && res.reason === 'suspended') toast('Gesperrte Spieler können nicht spielen.');
  setUi({ selected: null });
  if (res?.ok) playSound('tap', store.settings);
}

function useItemAction(itemId, playerId = null) {
  const item = store.game.user.inventory.find(i => i.id === itemId);
  if (!item) return;
  const def = CONSUMABLES[item.type];
  const target = playerId || store.ui.sheet?.playerId || null;
  if ((def.target === 'player' || def.target === 'injured') && !target) {
    setUi({ sheet: { type: 'items', itemId } });
    return;
  }
  const res = act(useItem, itemId, target);
  if (res?.ok) {
    toast(res.message);
    playSound('pick', store.settings);
    const back = store.ui.sheet?.playerId && def.target !== 'team' ? { type: 'player', id: store.ui.sheet.playerId } : null;
    setUi({ sheet: back });
  }
}

const handlers = {
  // Titel & Gründung
  continue: () => { if (resumeGame()) setUi({ screen: 'app', tab: 'home' }); else setUi({ slotPicker: true }); },
  'show-slots': () => setUi({ slotPicker: true }),
  'export-save': async () => {
    if (!store.game) return;
    const res = await exportSave(store.game);
    if (res === 'downloaded') toast('Sicherung gespeichert. Du findest sie in deinen Downloads.');
    else if (res === 'shared') toast('Sicherung geteilt.');
    else if (res !== 'cancelled') toast(res);
  },
  'import-save': async d => {
    const slot = Number(d.slot);
    const text = await pickSaveFile();
    if (!text) return;
    const res = parseSave(text);
    if (res.error) { toast(res.error); return; }
    startGame(slot, res.game);
    setUi({ screen: 'app', tab: 'home', slotPicker: false, sheet: null, flow: null });
    toast(`${res.game.clubs.user.name} geladen, Saison ${res.game.season}.`);
  },
  'load-slot': d => { if (resumeGame(Number(d.slot))) setUi({ screen: 'app', tab: 'home', slotPicker: false }); },
  'delete-slot': d => askConfirm('Spielstand löschen?', `Spielstand ${d.slot} wird endgültig gelöscht.`, 'Löschen', () => { deleteGame(Number(d.slot)); setUi({ sheet: null }); }),
  'new-game': d => setUi({ screen: 'found', found: { slot: Number(d.slot) || 1, name: '', primary: '#1f7a4d', secondary: '#f8fafc', shape: 'shield', pattern: 0, country: defaultCountry() } }),
  'back-title': () => setUi({ screen: 'title' }),
  'found-set': d => {
    const v = d.key === 'pattern' ? Number(d.value) : d.value;
    store.ui.found = { ...store.ui.found, [d.key]: v };
    notify();
  },
  'found-club': () => {
    const f = store.ui.found;
    const seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
    const game = createGame({ seed, clubName: f.name.trim(), primary: f.primary, secondary: f.secondary, crest: f.shape, pattern: f.pattern, country: f.country || 'GER' });
    startGame(f.slot, game);
    store.ui.screen = 'app';
    store.ui.tab = 'home';
    openPackFlow();
  },
  'to-title': () => { stopMatch(); setUi({ screen: 'title', flow: null, sheet: null, slotPicker: true }); },

  // Navigation
  tab: d => { setUi({ tab: d.tab, sheet: null, selected: null }); window.scrollTo(0, 0); },
  'squad-view': d => setView('squad', d.value),
  'league-view': d => setView('league', d.value),
  'market-view': d => setView('market', d.value),
  'club-view': d => setView('club', d.value),
  'league-tier': d => setUi({ leagueTier: Number(d.value) }),
  'go-market': () => setUi({ tab: 'market', sheet: null }),

  // Sheets
  'close-sheet': (d, el, ev) => {
    if (d.self && ev.target !== el) return;
    setUi({ sheet: null });
  },
  'confirm-yes': () => { const fn = confirmFn; confirmFn = null; setUi({ sheet: null }); fn?.(); },
  'open-inbox': () => setUi({ sheet: { type: 'inbox' } }),
  'open-news': d => { act(markRead, d.id); setUi({ sheet: { type: 'news', id: d.id } }); },
  'read-all': () => act(markAllRead),
  'open-player': d => openDetail('player', d.id),
  'open-club': d => openDetail('club', d.id),
  'sheet-back': () => setUi({ sheet: store.ui.sheet?.prev || null }),
  'stats-scope': d => setUi({ statsScope: d.value }),
  'stats-pcat': d => setUi({ statsPlayerCat: d.value }),
  'stats-ccat': d => setUi({ statsClubCat: d.value }),
  'open-items': d => setUi({ sheet: { type: 'items', playerId: d.player || null } }),
  'use-item': d => useItemAction(d.id),
  'use-item-on': d => useItemAction(store.ui.sheet.itemId, d.id),

  // Packs
  'open-pack': () => openPackFlow(),
  'buy-pack': d => {
    const res = act(buyPack, d.pack);
    if (res?.ok) { playSound('pick', store.settings); openPackFlow(); }
  },
  'pack-tear': () => tearPack(),
  'pack-next': () => { setUi({ pack: { stage: 'sealed', flipped: [] } }); },
  'pack-flip': d => flipCard(Number(d.index)),
  'pack-flip-all': () => {
    const n = store.game.pending.candidates.length;
    store.ui.pack.flipped = Array.from({ length: n }, (_, i) => i);
    store.ui.pack.justFlipped = 'all';
    playSound('flip', store.settings);
    if (store.game.pending.candidates.some(c => c.tier === 'gold' || c.tier === 'icon')) setTimeout(() => playSound('shiny', store.settings), 350);
    notify();
    setTimeout(() => { if (store.ui.pack) store.ui.pack.justFlipped = null; }, 900);
  },
  'pack-choose': d => { store.ui.pack.choice = Number(d.index); notify(); requestAnimationFrame(() => document.querySelector('.draft-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' })); },
  'pack-confirm': () => {
    const i = store.ui.pack.choice;
    const p = store.game.pending.candidates[i];
    const wasStar = store.game.pending.source === 'star';
    act(pickDraft, i);
    playSound('pick', store.settings);
    toast(`${p.first} ${p.last} ist jetzt in deinem Kader.`);
    setUi({ flow: null, pack: null, tab: wasStar ? 'home' : store.ui.tab });
    window.scrollTo(0, 0);
  },
  'pack-items-done': () => { act(closePending); setUi({ flow: null, pack: null }); },

  // Kader
  'slot-tap': d => lineupTap({ slot: d.slot, from: 'slot' }),
  'bench-tap': d => lineupTap({ id: d.id, from: 'bench' }),
  'reserve-tap': d => lineupTap({ id: d.id, from: 'reserve' }),
  deselect: () => setUi({ selected: null }),
  'auto-lineup': () => { act(autoLineup); toast('Beste verfügbare Elf aufgestellt.'); },
  'pick-for-lineup': d => { setUi({ sheet: null, tab: 'squad', selected: d.id, view: { ...store.ui.view, squad: 'lineup' } }); toast('Tippe auf die Position, die er übernehmen soll.'); },
  'to-bench': d => { act(placePlayer, d.id, { bench: true }); setUi({ sheet: null }); },
  release: d => {
    const p = store.game.players[d.id];
    askConfirm(`${p.first} ${p.last} entlassen?`, 'Der Spieler verlässt den Verein sofort und beendet seine Laufbahn. Das lässt sich nicht rückgängig machen.', 'Entlassen', () => {
      const res = act(releasePlayer, d.id);
      if (res?.ok) toast(`${p.last} hat den Verein verlassen.`);
    });
  },

  'toggle-auto': () => { const on = !store.game.user.autoLineup; act(setAutoLineup, on); toast(on ? 'Der Co-Trainer stellt ab jetzt die Elf auf.' : 'Du stellst ab jetzt selbst auf.'); },

  // Verein
  'toggle-sound': () => updateSettings({ sound: !store.settings.sound }),
  'toggle-auto-scenes': () => updateSettings({ autoScenes: !store.settings.autoScenes }),
  'set-speed': d => updateSettings({ speed: d.value }),

  // Spieltag
  'open-prep': () => { if (store.game.user.autoLineup) act(autoLineup); setUi({ flow: { type: 'prep' }, selected: null }); },
  'close-flow': () => {
    stopMatch();
    setUi({ flow: null, selected: null });
    window.scrollTo(0, 0);
  },
  'set-style': d => { act(setUserSetup, { style: d.value }); },
  'set-formation': d => { act(setUserSetup, { formation: d.value }); },
  'edit-lineup': () => setUi({ flow: null, tab: 'squad', view: { ...store.ui.view, squad: 'lineup' } }),
  'use-tactic': d => { useItemAction(d.id); },
  kickoff: () => kickoff(false),
  'kickoff-instant': () => kickoff(true),
  'sim-day': () => simDay(),
  'match-speed': () => matchControl('speed'),
  'match-skip': () => matchControl('skip'),
  'scene-continue': () => matchControl('continue'),
  'match-report': () => { stopMatch(); const data = store.ui.flow.data; setUi({ flow: { type: 'result', data } }); },
  'dismiss-tips': () => act(dismissTips),
  'dev-continue': () => { act(acknowledgeDevReport); window.scrollTo(0, 0); },
  'season-continue': () => { act(acknowledgeSeasonSummary); window.scrollTo(0, 0); },

  ...transferHandlers({ act, setUi, toast, askConfirm, store })
};

// -----------------------------------------------------------------------------
// Pack-Animationen
// -----------------------------------------------------------------------------

function tearPack() {
  const packEl = document.querySelector('.packflow__pack');
  packEl?.classList.add('is-torn');
  playSound('tear', store.settings);
  setTimeout(() => {
    const game = store.game;
    if (game.pending?.type === 'starter') {
      const ids = act(openStarterPack);
      store.ui.pack = { stage: 'starter-reveal', starterIds: ids, flipped: [] };
      // pending ist jetzt die Starspieler-Wahl, aber wir zeigen erst die 18 Spieler
      store.ui.pack.showStarter = true;
      notify();
    } else {
      setUi({ pack: { stage: 'open', flipped: [] } });
    }
  }, 650);
}

function flipCard(i) {
  const pack = store.ui.pack;
  if (pack.flipped.includes(i)) return;
  pack.flipped = [...pack.flipped, i];
  pack.justFlipped = i;
  playSound('flip', store.settings);
  const c = store.game.pending.candidates[i];
  if (c.tier === 'gold' || c.tier === 'icon') setTimeout(() => playSound('shiny', store.settings), 300);
  notify();
  setTimeout(() => { if (store.ui.pack) store.ui.pack.justFlipped = null; }, 900);
}

// -----------------------------------------------------------------------------
// Eingaben
// -----------------------------------------------------------------------------

document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-action]');
  if (!el || !app.contains(el)) return;
  const action = el.dataset.action;
  const fn = handlers[action];
  if (!fn) return;
  // Klick irgendwo im Sheet schließt es nicht – nur der Hintergrund
  if (el.dataset.self && ev.target !== el) return;
  ev.preventDefault();
  fn(el.dataset, el, ev);
});

document.addEventListener('input', ev => {
  const el = ev.target;
  const key = el.dataset?.input;
  if (key === 'found-name') {
    store.ui.found.name = el.value;
    notify();
  }
});

document.addEventListener('change', ev => {
  const el = ev.target;
  if (el.dataset?.input === 'found-country') { store.ui.found.country = el.value; notify(); return; }
  if (el.dataset?.input === 'formation') act(setUserSetup, { formation: el.value });
  if (el.dataset?.input === 'mkt-sort') setUi({ market: { ...(store.ui.market || {}), sort: el.value, page: 0 } });
});

// Wischen zum Aufreißen
let swipe = null;
document.addEventListener('pointerdown', ev => {
  const t = ev.target.closest('[data-swipe-tear]');
  if (t) swipe = { x: ev.clientX, w: t.getBoundingClientRect().width };
});
document.addEventListener('pointerup', ev => {
  if (swipe && ev.clientX - swipe.x > swipe.w * 0.35) tearPack();
  swipe = null;
});

// Android-Zurück-Taste (nur in der App über Capacitor verfügbar)
function handleBack() {
  const ui = store.ui;
  if (ui.sheet) { setUi({ sheet: null }); return true; }
  if (ui.flow?.type === 'match') { matchControl('skip'); return true; }
  if (ui.flow && ui.flow.type !== 'pack') { stopMatch(); setUi({ flow: null }); return true; }
  if (ui.selected) { setUi({ selected: null }); return true; }
  if (ui.screen === 'app' && ui.tab !== 'home') { setUi({ tab: 'home' }); return true; }
  if (ui.screen === 'found') { setUi({ screen: 'title' }); return true; }
  return false;
}
const capApp = window.Capacitor?.Plugins?.App;
if (capApp) {
  capApp.addListener('backButton', () => { if (!handleBack()) capApp.exitApp(); });
}

document.addEventListener('keydown', ev => {
  if (ev.key === 'Escape') {
    if (store.ui.sheet) setUi({ sheet: null });
    else if (store.ui.flow?.type === 'prep') setUi({ flow: null });
  }
});

// -----------------------------------------------------------------------------
// Start
// -----------------------------------------------------------------------------

store.ui.screen = 'title';
render();

// Nur für lokale Tests: Zugriff auf den Store aus der Browser-Konsole
if (location.hostname === 'localhost' && location.port) window.__sxi = { store, setUi, act, startMatch, notify };

export { icon };
