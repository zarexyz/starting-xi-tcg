// =============================================================================
// Starting XI TCG — Einstieg: Rendering, Navigation, Eingaben
// =============================================================================

import { store, subscribe, notify, act, setUi, setView, toast, startGame, resumeGame, updateSettings, setAfterAct } from './state/store.js';
import { loadProfile, saveProfile, bump } from './state/profile.js';
import { deliverFile, deliverText } from './state/sharefile.js';
import { buildResultCard, resultCardName, buildSeasonCard, seasonCardName } from './ui/shareCard.js';
import { feedbackBody, feedbackDefaults, feedbackMessage } from './ui/screens/feedback.js';
import { FEEDBACK_MAIL } from './config.js';
import { evaluateAchievements, ACH_REWARD } from './engine/achievements.js';
import { deleteGame } from './state/storage.js';
import { exportSave, pickSaveFile, parseSave } from './state/backup.js';
import {
  createGame, openStarterPack, pickDraft, closePending, buyPack, useItem, setUserSetup, autoLineup,
  placePlayer, swapPlayers, releasePlayer, playDay, setAutoLineup, acknowledgeDevReport, dismissTips, acknowledgeSeasonSummary, markRead, markAllRead, markFeedRead, userMatch, ensureUserSetup, previewUserMatch, setHalftime
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
import { clubScreen, settingsBody } from './ui/screens/club.js';
import { inboxSheet, newsSheet, itemsSheet } from './ui/sheets.js';
import { severance } from './engine/contracts.js';
import { feedItems } from './engine/news.js';
import { feedSheet } from './ui/screens/feed.js';
import { squadPeekBody, packFlow } from './ui/flows/pack.js';
import { captainSheetBody, numberSheetBody } from './ui/screens/identity.js';
import { ensureIdentity, setArmband, setNumber } from './engine/identity.js';
import { setInterview, setSetPiece } from './engine/extras.js';
import { ensureClubLife, setPlan, planCost, upgradeAcademy, promoteProspect, releaseProspect } from './engine/clublife.js';

const ensureLife = state => { ensureIdentity(state); ensureClubLife(state); };
import { prepFlow } from './ui/flows/prep.js';
import { matchFlow, startMatch, stopMatch, matchControl } from './ui/flows/match.js';
import { buildMatchday, matchdayFlow } from './ui/flows/matchday.js';
import { resultFlow, seasonFlow } from './ui/flows/result.js';
import { devFlow } from './ui/flows/develop.js';
import { transfersView, transferSheetButtons, foreignPlayerActions, transferHandlers, sellSheetBody, contractSheetBody } from './ui/screens/transfers.js';
import { setTransferRenderers } from './ui/screens/squad.js';
import { playSound, buzz } from './ui/sound.js';
import { icon } from './ui/icons.js';
import { esc } from './ui/html.js';
import { loadLocalFonts } from './fonts.js';
import { applyTheme, applyA11y } from './ui/theme.js';
import { t, setLang, getLang, deviceLang } from './i18n/index.js';

loadLocalFonts();
applyTheme(store.settings.theme || 'auto');
applyA11y(store.settings);

setTransferRenderers(transferSheetButtons, foreignPlayerActions);

// Erfolge prüfen nach jeder Spielaktion; Belohnung wird im laufenden Spielstand gebucht
setAfterAct(st => {
  if (!st.game || st.game.pending?.type === 'starter') return;
  ensureLife(st.game);
  const profile = loadProfile();
  const unlocks = evaluateAchievements(st.game, profile);
  if (!unlocks.length) { saveProfile(profile); return; }
  let total = 0;
  for (const u of unlocks) {
    const amount = ACH_REWARD[u.tier];
    total += amount;
    st.game.clubs.user.coins += amount;
    st.game.user.ledger.unshift({ season: st.game.season, day: st.game.dayIndex, label: 'ledger.achievement', lp: { nameK: `ach.${u.id}.name`, tierK: `ach.tier.${u.tier}` }, amount });
    profile.log = [{ id: u.id, tier: u.tier, at: Date.now(), club: st.game.clubs.user.name }, ...(profile.log || [])].slice(0, 100);
  }
  saveProfile(profile);
  const first = unlocks[unlocks.length - 1];
  toast(t('ach.unlocked', { nameK: `ach.${first.id}.name`, tierK: `ach.tier.${first.tier}`, coinsC: total }) + (unlocks.length > 1 ? ` ${t('ach.more', { n: unlocks.length - 1 })}` : ''));
});

const app = document.getElementById('app');

// -----------------------------------------------------------------------------
// Rendering
// -----------------------------------------------------------------------------

let confirmFn = null;
let lastFlowKey = null;
let lastScreenKey = null;

function confirmSheet(c) {
  return sheet(c.title, `
    <p>${esc(c.text)}</p>
    <div class="confirm-actions">
      <button class="btn btn--secondary" data-action="close-sheet">${t('w.cancel')}</button>
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
  if (s.type === 'feed') return feedSheet(game, ui);
  if (s.type === 'settings') return sheet(t('set.title'), settingsBody(store));
  if (s.type === 'feedback') return sheet(t('fb.title'), feedbackBody(game, ui));
  if (s.type === 'captain') return sheet(t('cap.sheetTitle'), captainSheetBody(game));
  if (s.type === 'number') return sheet(t('num.title'), numberSheetBody(game, s.id));
  if (s.type === 'peek') return sheet(t('pf.viewSquad'), squadPeekBody(game, s.pos || []));
  if (s.type === 'sell') return sheet(t('tm.sellTitle', { name: game.players[s.id]?.last || '' }), sellSheetBody(game, s.id));
  if (s.type === 'contract') return sheet(t('ct.sheetTitle', { name: game.players[s.id]?.last || '' }), contractSheetBody(game, s.id));
  return '';
}

function flowHtml(game, ui) {
  const f = ui.flow;
  if (f?.type === 'prep') return prepFlow(game, { ...ui, prepTab: store.settings.prepTab });
  if (f?.type === 'match') return matchFlow(game, f);
  if (f?.type === 'result') return resultFlow(game, f, ui);
  if (f?.type === 'matchday') return matchdayFlow(game, f);
  if (f?.type === 'pack' && game.pending) return packFlow(game, ui);
  if (!f && game.seasonSummary) return seasonFlow(game, ui);
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
  const flowKey = ui.flow ? ui.flow.type + (ui.flow.type === 'prep' ? ':' + (store.settings.prepTab || '') : '') : game?.seasonSummary ? 'season' : game?.devReport ? 'dev' : null;
  if (fl && flowScroll && flowKey && flowKey === lastFlowKey) fl.scrollTop = flowScroll;
  lastFlowKey = flowKey;

  // Weicher Übergang nur beim Wechsel von Reiter oder Bildschirm, nicht bei jedem Neuzeichnen
  const screenKey = `${ui.screen}|${ui.tab}|${ui.view?.[ui.tab] || ''}`;
  if (lastScreenKey !== null && screenKey !== lastScreenKey && !ui.flow && !ui.sheet) {
    app.classList.add('is-entering');
    setTimeout(() => app.classList.remove('is-entering'), 320);
  }
  lastScreenKey = screenKey;
}

function renderToast() {
  document.querySelector('.toast')?.remove();
  if (store.ui.toast) app.insertAdjacentHTML('beforeend', `<div class="toast" role="status">${esc(store.ui.toast)}</div>`);
}

setLang(store.settings.lang || deviceLang());
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
  if (type === 'player' && !store.game?.players[id]) { toast(t('toast.retired')); return; }
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
  /** Spieltag wirklich spielen (optional mit Halbzeit-Entscheidung) */
  const commit = decision => {
    if (decision) act(setHalftime, decision);
    const res = act(playDay);
    if (!res || res.error) return null;
    bump('matches');
    let matchday = null;
    try { matchday = buildMatchday(pre, store.game); } catch (e) { console.warn(e); }
    return { ...res, snapshot, matchday };
  };
  if (instant || store.settings.halftime === false) {
    const data = commit(null);
    if (!data) return;
    if (instant) {
      setUi({ flow: { type: 'result', data }, repSide: 'mine' });
      window.scrollTo(0, 0);
      return;
    }
    store.ui.flow = { type: 'match', data };
    document.querySelector('.matchflow')?.remove();
    notify();
    startMatch(store.game, store.ui.flow, store.settings);
    return;
  }
  // Vorschau der ersten Hälfte (verändert den Spielstand nicht)
  const preview = previewUserMatch(pre);
  if (!preview) return;
  store.ui.flow = { type: 'match', data: { ...preview, snapshot, preview: true } };
  document.querySelector('.matchflow')?.remove();
  notify();
  startMatch(pre, store.ui.flow, store.settings, {
    commit: decision => {
      const data = commit(decision);
      if (data) store.ui.flow = { type: 'match', data };
      return data;
    }
  });
}

function simDay() {
  const res = act(playDay);
  if (res && !res.error) {
    bump('matches');
    kickoffResultToast(res);
  } else {
    toast(t('toast.dayPlayed'));
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
  if (res && res.ok === false && res.reason === 'injured') toast(t('toast.injuredCant'));
  if (res && res.ok === false && res.reason === 'suspended') toast(t('toast.bannedCant'));
  setUi({ selected: null });
  if (res?.ok) playSound('tap', store.settings);
}

function useItemAction(itemId, playerId = null) {
  const item = store.game.user.inventory.find(i => i.id === itemId);
  if (!item) return;
  const def = CONSUMABLES[item.type];
  const target = playerId || store.ui.sheet?.playerId || null;
  if ((def.target === 'player' || def.target === 'injured' || def.target === 'own') && !target) {
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
  continue: () => { if (resumeGame()) { act(ensureLife); setUi({ screen: 'app', tab: 'home' }); } else setUi({ slotPicker: true }); },
  'show-slots': () => setUi({ slotPicker: true }),
  'export-save': async () => {
    if (!store.game) return;
    const res = await exportSave(store.game);
    if (res === 'downloaded') toast(t('toast.backupSaved'));
    else if (res === 'shared') toast(t('toast.backupShared'));
    else if (res !== 'cancelled') toast(res);
  },
  'import-save': async d => {
    const slot = Number(d.slot);
    const text = await pickSaveFile();
    if (!text) return;
    const res = parseSave(text);
    if (res.error) { toast(res.error); return; }
    startGame(slot, res.game);
    act(ensureLife);
    setUi({ screen: 'app', tab: 'home', slotPicker: false, sheet: null, flow: null });
    toast(t('toast.loaded', { club: res.game.clubs.user.name, season: res.game.season }));
  },
  'load-slot': d => { if (resumeGame(Number(d.slot))) { act(ensureLife); setUi({ screen: 'app', tab: 'home', slotPicker: false }); } },
  'delete-slot': d => askConfirm(t('confirm.delete'), t('confirm.deleteX', { n: d.slot }), t('confirm.deleteBtn'), () => { deleteGame(Number(d.slot)); setUi({ sheet: null }); }),
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
  'news-read': d => act(markRead, d.id),
  'open-settings': () => setUi({ sheet: { type: 'settings' } }),
  'open-feed': () => {
    const fresh = store.ui.sheet?.type === 'news' ? (store.ui.feedFresh || []) : feedItems(store.game).filter(n => !n.read).map(n => n.id);
    setUi({ sheet: { type: 'feed' }, feedFresh: fresh });
    act(markFeedRead);
  },
  'feed-filter': d => setUi({ feedFilter: d.value }),
  'squad-peek': d => setUi({ sheet: { type: 'peek', pos: (d.pos || '').split(',').filter(Boolean) } }),
  'open-player': d => openDetail('player', d.id),
  'open-feedback': () => setUi({ sheet: { type: 'feedback' }, fb: store.ui.fb || feedbackDefaults() }),
  'fb-kind': d => setUi({ fb: { ...store.ui.fb, kind: d.value } }),
  'fb-info': () => setUi({ fb: { ...store.ui.fb, info: !store.ui.fb.info } }),
  'fb-send': async () => {
    const f = store.ui.fb;
    if (!f.text.trim()) { toast(t('fb.empty')); return; }
    const msg = feedbackMessage(store.game, f);
    if (FEEDBACK_MAIL) {
      location.href = `mailto:${FEEDBACK_MAIL}?subject=${encodeURIComponent(msg.subject)}&body=${encodeURIComponent(msg.body)}`;
      return;
    }
    const res = await deliverText(`${msg.subject}\n\n${msg.body}`, msg.subject);
    if (res === 'copied') toast(t('fb.copied'));
    if (res === 'shared') setUi({ fb: feedbackDefaults(), sheet: null });
    if (res === 'error') toast(t('share.failed'));
  },
  'share-result': async () => {
    const data = store.ui.flow?.data;
    if (!data) return;
    try {
      const blob = await buildResultCard(store.game, data);
      if (!blob) { toast(t('share.failed')); return; }
      const res = await deliverFile(blob, resultCardName(store.game, data), 'Starting XI');
      if (res === 'downloaded') toast(t('share.done'));
      else if (res === 'shared') toast(t('share.shared'));
      else if (res === 'error') toast(t('share.failed'));
    } catch (e) { console.warn(e); toast(t('share.failed')); }
  },
  'share-season': async () => {
    const game = store.game;
    if (!game?.seasonSummary) return;
    try {
      const blob = await buildSeasonCard(game);
      if (!blob) { toast(t('share.failed')); return; }
      const res = await deliverFile(blob, seasonCardName(game), 'Starting XI');
      if (res === 'downloaded') toast(t('share.done'));
      else if (res === 'shared') toast(t('share.shared'));
      else if (res === 'error') toast(t('share.failed'));
    } catch (e) { console.warn(e); toast(t('share.failed')); }
  },
  'open-captain': () => setUi({ sheet: { type: 'captain' } }),
  'open-number': d => setUi({ sheet: { type: 'number', id: d.id } }),
  'set-armband': d => {
    act(setArmband, d.id, d.role);
    if (store.ui.flow?.type !== 'pack') toast(t(d.role === 'C' ? 'toast.captain' : 'toast.vice', { name: store.game.players[d.id].last }));
  },
  'set-number': d => {
    const res = act(setNumber, d.id, Number(d.n));
    if (res?.ok) { toast(t('toast.numSet', { name: store.game.players[d.id].last, n: d.n })); setUi({ sheet: store.ui.sheet?.prev || { type: 'player', id: d.id } }); }
  },
  'set-plan': d => {
    if (planCost(store.game, d.value) > store.game.clubs.user.coins) { toast(t('acad.noMoney')); return; }
    act(setPlan, d.value);
  },
  'set-piece': d => { act(setSetPiece, d.role, d.value || null); },
  'set-interview': d => { act(setInterview, d.value); },
  'upgrade-academy': () => {
    const res = act(upgradeAcademy);
    if (res?.ok) toast(t('acad.upDone', { n: res.level }));
    else if (res?.code === 'noMoney') toast(t('acad.noMoney'));
  },
  'promote-prospect': d => {
    const name = store.game.players[d.id]?.last || '';
    const res = act(promoteProspect, d.id);
    if (res?.ok) { toast(t('acad.promoted', { name })); if (store.ui.sheet) setUi({ sheet: null }); }
    else if (res?.code === 'full') toast(t('acad.full'));
    else if (res?.code === 'noMoney') toast(t('acad.noMoney'));
  },
  'release-prospect': d => {
    const name = store.game.players[d.id]?.last || '';
    if (act(releaseProspect, d.id)?.ok) { toast(t('acad.released', { name })); if (store.ui.sheet) setUi({ sheet: null }); }
  },
  'meet-go': d => setUi({ pack: { ...store.ui.pack, stage: 'meet', meet: Number(d.value) } }),
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
    bump('packs');
    playSound('pick', store.settings);
    toast(t('toast.joined', { name: `${p.first} ${p.last}` }));
    setUi({ flow: null, pack: null, tab: wasStar ? 'home' : store.ui.tab });
    window.scrollTo(0, 0);
  },
  'pack-items-done': () => { act(closePending); setUi({ flow: null, pack: null }); },

  // Kader
  'slot-tap': d => lineupTap({ slot: d.slot, from: 'slot' }),
  'bench-tap': d => lineupTap({ id: d.id, from: 'bench' }),
  'reserve-tap': d => lineupTap({ id: d.id, from: 'reserve' }),
  deselect: () => setUi({ selected: null }),
  'auto-lineup': () => { act(autoLineup); toast(t('toast.autoXI')); },
  'pick-for-lineup': d => { setUi({ sheet: null, tab: 'squad', selected: d.id, view: { ...store.ui.view, squad: 'lineup' } }); toast(t('toast.pickPos')); },
  'to-bench': d => { act(placePlayer, d.id, { bench: true }); setUi({ sheet: null }); },
  release: d => {
    const p = store.game.players[d.id];
    askConfirm(t('confirm.release', { name: `${p.first} ${p.last}` }), t('confirm.releaseX', { n: severance(store.game, p) }), t('ps.release'), () => {
      const res = act(releasePlayer, d.id);
      if (res?.ok) toast(t('toast.left', { name: p.last }));
    });
  },

  'toggle-auto': () => { const on = !store.game.user.autoLineup; act(setAutoLineup, on); toast(on ? t('toast.autoOn') : t('toast.autoOff')); },

  // Verein
  'toggle-sound': () => updateSettings({ sound: !store.settings.sound }),
  'prep-tab': d => { updateSettings({ prepTab: d.value }); },
  'prep-fold': d => setUi({ prepOpen: { ...(store.ui.prepOpen || {}), [d.value]: !store.ui.prepOpen?.[d.value] } }),
  'toggle-auto-scenes': () => updateSettings({ autoScenes: !store.settings.autoScenes }),
  'toggle-halftime': () => updateSettings({ halftime: store.settings.halftime === false }),
  'set-speed': d => updateSettings({ speed: d.value }),
  'set-text': d => { updateSettings({ textSize: d.value }); applyA11y(store.settings); },
  'toggle-cb': () => { updateSettings({ colorblind: !store.settings.colorblind }); applyA11y(store.settings); },
  'toggle-motion': () => { updateSettings({ reduceMotion: !store.settings.reduceMotion }); applyA11y(store.settings); },
  'toggle-haptics': () => { updateSettings({ haptics: store.settings.haptics === false }); buzz(30, store.settings); },
  'set-theme': d => { applyTheme(d.value); updateSettings({ theme: d.value }); },
  'set-lang': d => { setLang(d.value); updateSettings({ lang: d.value }); },

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
  'match-report': () => { stopMatch(); const data = store.ui.flow.data; setUi({ flow: { type: 'result', data }, repSide: 'mine' }); },
  'rep-side': d => setUi({ repSide: d.value }),
  'result-continue': () => {
    const md = store.ui.flow?.data?.matchday;
    if (md) { setUi({ flow: { type: 'matchday', data: md } }); window.scrollTo(0, 0); document.querySelector('.fullscreen > .screen')?.scrollTo(0, 0); return; }
    setUi({ flow: null, selected: null });
    window.scrollTo(0, 0);
  },
  'dismiss-tips': () => act(dismissTips),
  'dev-continue': () => { act(acknowledgeDevReport); window.scrollTo(0, 0); },
  'season-continue': () => { bump('seasons'); store.ui.sePage = 0; act(acknowledgeSeasonSummary); window.scrollTo(0, 0); },
  'season-page': d => { setUi({ sePage: Number(d.value) }); document.querySelector('.fullscreen > .screen')?.scrollTo(0, 0); },

  ...transferHandlers({ act, setUi, toast, askConfirm, store })
};

// -----------------------------------------------------------------------------
// Pack-Animationen
// -----------------------------------------------------------------------------

function tearPack() {
  const packEl = document.querySelector('.packflow__pack');
  packEl?.classList.add('is-torn');
  document.querySelector('.packflow')?.classList.add('is-flash');
  buzz(35, store.settings);
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
  if (c.tier === 'gold' || c.tier === 'icon') { setTimeout(() => playSound('shiny', store.settings), 300); buzz([30, 50, 60], store.settings); }
  else buzz(15, store.settings);
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
  if (key === 'fb-text') { store.ui.fb = { ...store.ui.fb, text: el.value }; return; }
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
bump('starts');
render();

// Nur für lokale Tests: Zugriff auf den Store aus der Browser-Konsole
if (location.hostname === 'localhost' && location.port) window.__sxi = { store, setUi, act, startMatch, notify };

export { icon };
