// =============================================================================
// Starting XI TCG — Main Application Entry & UI Orchestrator
// =============================================================================

import { store } from './state/store.js';
import { listAllSlots, getActiveSlotId } from './state/storage.js';
import { renderHeader } from './components/header.js';
import { renderNavbar } from './components/navbar.js';
import { renderHomeScreen } from './screens/home.js';
import { renderKaderScreen } from './screens/kader.js';
import { renderWettbewerbScreen } from './screens/wettbewerb.js';
import { renderMarktScreen } from './screens/markt.js';
import { renderVereinScreen } from './screens/verein.js';
import { renderTitleScreen } from './screens/title_screen.js';
import { renderMainMenuScreen } from './screens/main_menu.js';
import { renderMatchArenaModal } from './modals/match_arena.js';
import { renderPackWalkoutModal, renderPackConfirmModal } from './modals/pack_walkout.js';
import { renderPostfachModal, renderMessageDetailModal } from './modals/postfach.js';
import { renderConsumablesModal } from './modals/consumables.js';
import { renderSettingsModal } from './modals/settings.js';
import { renderOnboardingModal } from './modals/onboarding.js';
import { renderPlayerInspectModal } from './modals/player_inspect.js';
import { renderClubCrest } from './components/crest.js';
import { PACK_TIERS, openPack } from './engine/packs.js';
import { setupMatchSimulation, resolveDuelClash, simulateInstantMatch, TACTIC_CARDS } from './engine/duel.js';
import { playClickSound, playCardFlipSound, playPackTearSound, playGoalChime, isSoundEnabled, setSoundEnabled } from './engine/audio.js';

let activeMatchState = null;
let draggedPlayerId = null;

// Application Navigation & Flow State
let isTitleScreenActive = true;
let isMainMenuActive = false;
let isOnboardingActive = false;
let activeInboxFilter = 'all';
let activeInspectTab = 'info';
let activeConsumableFilter = 'all';
let activeDetailMessage = null;
let onboardingTargetSlot = 'slot_1';

// Onboarding Live Form State (Crest Creator)
let onboardingFormState = {
  clubName: 'FC Apex Nova',
  crestForm: 'shield',
  primaryColor: '#00f59b',
  secondaryColor: '#ffd15c',
  captainRole: 'ST'
};

// Global HTML5 Drag & Drop handlers
window.handleCardDragStart = function(e, playerId) {
  draggedPlayerId = playerId;
  playCardFlipSound();
  if (e.dataTransfer) {
    e.dataTransfer.setData('text/plain', playerId);
    e.dataTransfer.effectAllowed = 'move';
  }
};

window.handleCardDragOver = function(e) {
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
};

window.handleCardDrop = function(e, targetSlot) {
  e.preventDefault();
  const playerId = draggedPlayerId || (e.dataTransfer ? e.dataTransfer.getData('text/plain') : null);
  if (!playerId) return;

  const club = store.getPlayerClub();
  const draggedPlayer = club.squad.find(p => p.id === playerId);
  if (!draggedPlayer) return;

  playCardFlipSound();

  if (targetSlot === 'bench') {
    draggedPlayer.isStarter = false;
    store.notify();
  } else {
    const targetStarter = club.squad.find(p => p.isStarter && (p.currentSlot === targetSlot || p.id === targetSlot));
    if (targetStarter) {
      store.swapPlayers(playerId, targetStarter.id, targetSlot);
    } else {
      draggedPlayer.isStarter = true;
      draggedPlayer.currentSlot = targetSlot;
      store.notify();
    }
  }
  draggedPlayerId = null;
};

// Global 3D Card Tilt & Holographic tracking
window.handleCardTilt = function (e, cardEl) {
  const rect = cardEl.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  const rotateX = ((y - centerY) / centerY) * -10;
  const rotateY = ((x - centerX) / centerX) * 10;
  cardEl.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.03, 1.03, 1.03)`;

  const sheen = cardEl.querySelector('.card-holo-sheen');
  if (sheen) {
    const moveX = (x / rect.width) * 100;
    const moveY = (y / rect.height) * 100;
    sheen.style.backgroundPosition = `${moveX}% ${moveY}%`;
    sheen.style.opacity = '0.7';
  }
};

window.resetCardTilt = function (cardEl) {
  cardEl.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  const sheen = cardEl.querySelector('.card-holo-sheen');
  if (sheen) {
    sheen.style.opacity = '0.35';
  }
};

async function renderApp() {
  const appEl = document.getElementById('app');
  const modalRoot = document.getElementById('modal-root');
  const state = store.getState();

  // 1. Physischer Startbildschirm ("Berühre den Bildschirm, um fortzufahren")
  if (isTitleScreenActive) {
    appEl.innerHTML = renderTitleScreen();
    modalRoot.innerHTML = '';
    setupTitleScreenEvents();
    return;
  }

  // 1.5 Onboarding (Vereinsgründung bei Spielneustart)
  if (isOnboardingActive) {
    const slots = await listAllSlots();
    const activeSlotId = getActiveSlotId();
    appEl.innerHTML = renderMainMenuScreen(slots, activeSlotId, false);
    modalRoot.innerHTML = renderOnboardingModal(onboardingTargetSlot, onboardingFormState);
    setupOnboardingEvents();
    return;
  }

  // 2. Hauptmenü (3 Speicherslots)
  if (isMainMenuActive) {
    const slots = await listAllSlots();
    const activeSlotId = getActiveSlotId();
    const hasRunningGame = !!(state && store.getPlayerClub());
    appEl.innerHTML = renderMainMenuScreen(slots, activeSlotId, hasRunningGame);
    modalRoot.innerHTML = '';
    setupMainMenuEvents();
    return;
  }

  // 3. Wenn noch kein Spielstand existiert -> Hauptmenü
  if (!state || !store.getPlayerClub()) {
    isMainMenuActive = true;
    renderApp();
    return;
  }

  // 4. Regulärer In-Game Header & Screen Render
  const headerHTML = renderHeader(state);

  let screenHTML = '';
  switch (state.activeTab) {
    case 'kader':
      screenHTML = renderKaderScreen(state);
      break;
    case 'wettbewerb':
      screenHTML = renderWettbewerbScreen(state);
      break;
    case 'markt':
      screenHTML = renderMarktScreen(state);
      break;
    case 'verein':
      screenHTML = renderVereinScreen(state);
      break;
    case 'home':
    default:
      screenHTML = renderHomeScreen(state);
      break;
  }

  const navbarHTML = renderNavbar(state.activeTab);

  appEl.innerHTML = `
    ${headerHTML}
    ${screenHTML}
    ${navbarHTML}
  `;

  // Modals
  renderModals(state, modalRoot);

  // Global Listeners
  setupGlobalEvents(state);
}

function renderModals(state, modalRoot) {
  if (!state.activeModal) {
    modalRoot.innerHTML = '';
    return;
  }

  const club = store.getPlayerClub();

  switch (state.activeModal) {
    case 'match_arena':
      modalRoot.innerHTML = renderMatchArenaModal(activeMatchState, state.equippedTactics || ['t_second_wind', 't_park_bus', 't_counter_frenzy']);
      setupMatchArenaEvents();
      break;
    case 'pack_confirm':
      modalRoot.innerHTML = renderPackConfirmModal(state.pendingPack, club.coins);
      setupPackConfirmEvents();
      break;
    case 'pack_walkout':
      modalRoot.innerHTML = renderPackWalkoutModal(state.activePackResult);
      setupPackWalkoutEvents();
      break;
    case 'postfach':
      modalRoot.innerHTML = renderPostfachModal(state.inbox, activeInboxFilter);
      if (activeDetailMessage) {
        modalRoot.innerHTML += renderMessageDetailModal(activeDetailMessage);
      }
      setupPostfachEvents();
      break;
    case 'consumables':
      modalRoot.innerHTML = renderConsumablesModal(state.inventory, club.squad, activeConsumableFilter);
      setupConsumablesEvents();
      break;
    case 'settings':
      modalRoot.innerHTML = renderSettingsModal(state);
      setupSettingsEvents();
      break;
    case 'player_inspect':
      modalRoot.innerHTML = renderPlayerInspectModal(state.inspectedPlayer, club, activeInspectTab);
      setupPlayerInspectEvents();
      break;
    case 'onboarding':
      modalRoot.innerHTML = renderOnboardingModal(onboardingTargetSlot, onboardingFormState);
      setupOnboardingEvents();
      break;
    default:
      modalRoot.innerHTML = '';
  }
}

function setupTitleScreenEvents() {
  const container = document.getElementById('title-screen-container');
  if (!container) return;

  container.addEventListener('click', async () => {
    playClickSound();
    isTitleScreenActive = false;

    // Prüfen, ob ein aktiver Spielstand vorliegt
    const state = store.getState();
    if (state && store.getPlayerClub()) {
      isMainMenuActive = false;
    } else {
      isMainMenuActive = true;
    }
    renderApp();
  });
}

function setupMainMenuEvents() {
  // Zurück zum laufenden Spiel
  document.getElementById('btn-return-to-game')?.addEventListener('click', () => {
    playClickSound();
    isMainMenuActive = false;
    renderApp();
  });

  // Slot laden
  document.querySelectorAll('[data-load-slot]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const slotId = btn.dataset.loadSlot;
      playClickSound();
      const success = await store.loadGameSlot(slotId);
      if (success) {
        isMainMenuActive = false;
        playCardFlipSound();
        renderApp();
      }
    });
  });

  // Neues Spiel in Slot starten
  document.querySelectorAll('[data-new-slot]').forEach(btn => {
    btn.addEventListener('click', () => {
      onboardingTargetSlot = btn.dataset.newSlot;
      onboardingFormState = {
        clubName: 'FC Apex Nova',
        crestForm: 'shield',
        primaryColor: '#00f59b',
        secondaryColor: '#ffd15c',
        captainRole: 'ST'
      };
      playClickSound();
      isMainMenuActive = false;
      isOnboardingActive = true;
      renderApp();
    });
  });

  // Slot löschen
  document.querySelectorAll('[data-delete-slot]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const slotId = btn.dataset.deleteSlot;
      if (confirm(`Möchtest du ${slotId.toUpperCase().replace('_', ' ')} wirklich unwiderruflich löschen?`)) {
        await store.deleteGameSlot(slotId);
        playClickSound();
        renderApp();
      }
    });
  });
}

function setupGlobalEvents(state) {
  // Tab Navigation
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      if (tab) {
        playClickSound();
        store.setActiveTab(tab);
      }
    });
  });

  // Header Postfach & Settings
  document.getElementById('btn-header-inbox')?.addEventListener('click', () => {
    playClickSound();
    activeDetailMessage = null;
    store.openModal('postfach');
  });

  document.getElementById('btn-header-settings')?.addEventListener('click', () => {
    playClickSound();
    store.openModal('settings');
  });

  // Formation Dropdown
  document.getElementById('select-formation')?.addEventListener('change', (e) => {
    playClickSound();
    store.setFormation(e.target.value);
  });

  // Player Card Click -> Full Detail Inspect Modal
  document.querySelectorAll('[data-inspect-player]').forEach(el => {
    el.addEventListener('click', () => {
      const pId = el.dataset.inspectPlayer;
      const club = store.getPlayerClub();
      state.inspectedPlayer = club.squad.find(p => p.id === pId);
      if (state.inspectedPlayer) {
        playCardFlipSound();
        store.openModal('player_inspect');
      }
    });
  });

  // Quick Links auf Home
  document.getElementById('btn-quick-kader')?.addEventListener('click', () => {
    playClickSound();
    store.setActiveTab('kader');
  });

  document.getElementById('btn-quick-draft')?.addEventListener('click', () => {
    playClickSound();
    store.setActiveTab('markt');
  });

  // Match Anpfiff Trigger
  document.getElementById('btn-start-match')?.addEventListener('click', () => {
    playClickSound();
    const club = store.getPlayerClub();
    const liga = state.leagues.find(l => l.tier === 6);
    const scheduleDay = state.schedule.find(s => s.matchday === state.currentMatchday);
    const match = scheduleDay?.matches.find(m => m.homeId === club.id || m.awayId === club.id);

    if (match) {
      const isHome = match.homeId === club.id;
      const oppId = isHome ? match.awayId : match.homeId;
      const opponent = liga.clubs.find(c => c.id === oppId);

      activeMatchState = setupMatchSimulation(isHome ? club : opponent, isHome ? opponent : club);
      store.openModal('match_arena');
    }
  });

  // Consumables Button auf Kader
  document.getElementById('btn-open-consumables')?.addEventListener('click', () => {
    playClickSound();
    store.openModal('consumables');
  });

  // League Selector auf Wettbewerb
  const leagueSelect = document.getElementById('select-league-tier');
  if (leagueSelect) {
    leagueSelect.addEventListener('change', (e) => {
      playClickSound();
      store.getState().selectedLeagueTier = parseInt(e.target.value, 10);
      store.notify();
    });
  }

  // Wettbewerb 2-Ebenen Navigation
  document.querySelectorAll('[data-comp-switch]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      playClickSound();
      store.getState().wettbewerbCompetition = e.currentTarget.dataset.compSwitch;
      store.notify();
    });
  });

  document.querySelectorAll('[data-wettbewerb-subtab]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      playClickSound();
      store.getState().wettbewerbTab = e.currentTarget.dataset.wettbewerbSubtab;
      store.notify();
    });
  });

  document.getElementById('btn-quick-start-from-stats')?.addEventListener('click', () => {
    document.getElementById('btn-start-match')?.click();
  });

  // Spielplan Matchday Slider
  document.getElementById('btn-prev-matchday')?.addEventListener('click', (e) => {
    const day = parseInt(e.currentTarget.dataset.day, 10);
    if (day >= 1) {
      playClickSound();
      store.getState().viewMatchday = day;
      store.notify();
    }
  });

  document.getElementById('btn-next-matchday')?.addEventListener('click', (e) => {
    const day = parseInt(e.currentTarget.dataset.day, 10);
    if (day <= (store.getState().maxMatchdays || 18)) {
      playClickSound();
      store.getState().viewMatchday = day;
      store.notify();
    }
  });

  // Pack Buttons auf Markt (Öffnet erst Kaufen? Bestätigung)
  document.querySelectorAll('[data-prompt-pack]').forEach(btn => {
    btn.addEventListener('click', () => {
      const packId = btn.dataset.promptPack;
      const pack = PACK_TIERS.find(p => p.id === packId);
      if (pack) {
        playClickSound();
        state.pendingPack = pack;
        store.openModal('pack_confirm');
      }
    });
  });

  // Home Quick Tab Shortcuts
  document.querySelectorAll('[data-quick-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.quickTab;
      if (tab) {
        playClickSound();
        store.setActiveTab(tab);
      }
    });
  });

  document.getElementById('btn-quick-inbox')?.addEventListener('click', () => {
    playClickSound();
    activeDetailMessage = null;
    store.openModal('postfach');
  });

  document.getElementById('btn-quick-formation')?.addEventListener('click', () => {
    playClickSound();
    store.setActiveTab('kader');
  });

  // Shelf Left/Right Buttons on Markt
  const shelf = document.getElementById('booster-shelf-container');
  document.getElementById('btn-shelf-scroll-left')?.addEventListener('click', () => {
    playClickSound();
    shelf?.scrollBy({ left: -180, behavior: 'smooth' });
  });

  document.getElementById('btn-shelf-scroll-right')?.addEventListener('click', () => {
    playClickSound();
    shelf?.scrollBy({ left: 180, behavior: 'smooth' });
  });

  // Kader: Tap-to-Swap Handler
  document.querySelectorAll('[data-card-swap-trigger]').forEach(el => {
    el.addEventListener('click', (e) => {
      // Don't trigger if inspect button was clicked
      if (e.target.closest('[data-inspect-player]')) return;

      const clickedPlayerId = el.dataset.cardSwapTrigger;
      const currentSelected = store.getState().selectedPlayerIdForSwap;

      if (!currentSelected) {
        // Select card A
        store.getState().selectedPlayerIdForSwap = clickedPlayerId;
        playCardFlipSound();
        renderApp();
      } else if (currentSelected === clickedPlayerId) {
        // Deselect card A
        store.getState().selectedPlayerIdForSwap = null;
        playClickSound();
        renderApp();
      } else {
        // Swap card A with card B
        store.swapPlayers(currentSelected, clickedPlayerId);
        store.getState().selectedPlayerIdForSwap = null;
        playGoalChime();
        renderApp();
      }
    });
  });

  // Kader: Empty Slot Trigger
  document.querySelectorAll('[data-empty-slot-trigger]').forEach(el => {
    el.addEventListener('click', () => {
      const slotName = el.dataset.emptySlotTrigger;
      const currentSelected = store.getState().selectedPlayerIdForSwap;
      if (currentSelected) {
        store.swapPlayers(currentSelected, null, slotName);
        store.getState().selectedPlayerIdForSwap = null;
        playGoalChime();
        renderApp();
      }
    });
  });

  // Kader: Cancel Swap Button
  document.getElementById('btn-cancel-swap-mode')?.addEventListener('click', () => {
    playClickSound();
    store.getState().selectedPlayerIdForSwap = null;
    renderApp();
  });
}

function setupPackConfirmEvents() {
  const state = store.getState();
  const club = store.getPlayerClub();

  document.getElementById('btn-cancel-buy-pack')?.addEventListener('click', () => {
    playClickSound();
    state.pendingPack = null;
    store.closeModal();
  });

  document.getElementById('btn-confirm-buy-pack')?.addEventListener('click', () => {
    const pack = state.pendingPack;
    if (pack && club.coins >= pack.price) {
      playClickSound();
      club.coins -= pack.price;
      const packResult = openPack(pack.id);
      packResult.isTorn = false;
      state.activePackResult = packResult;
      state.pendingPack = null;
      store.openModal('pack_walkout');
    }
  });
}

function setupMatchArenaEvents() {
  if (!activeMatchState) return;

  if (!activeMatchState.usedTactics) activeMatchState.usedTactics = [];
  if (activeMatchState.activeTacticId === undefined) activeMatchState.activeTacticId = null;

  // In-Game Taktik-Hand: Zünden & Einsetzen von Taktikkarten
  document.querySelectorAll('[data-activate-tactic]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tacticId = btn.dataset.activateTactic;
      if (activeMatchState.usedTactics.includes(tacticId)) return;

      playClickSound();
      if (activeMatchState.activeTacticId === tacticId) {
        activeMatchState.activeTacticId = null; // Toggle aus
      } else {
        activeMatchState.activeTacticId = tacticId; // Scharf schalten
      }
      store.notify();
    });
  });

  document.getElementById('btn-resolve-next-duel')?.addEventListener('click', () => {
    if (activeMatchState && !activeMatchState.completed) {
      const duel = activeMatchState.duels[activeMatchState.currentDuelIndex];
      const activeTactic = TACTIC_CARDS.find(t => t.id === activeMatchState.activeTacticId);

      resolveDuelClash(duel, activeTactic);

      if (activeTactic) {
        activeMatchState.usedTactics.push(activeTactic.id);
        activeMatchState.activeTacticId = null;
      }

      const tacticNote = activeTactic ? ` [🎴 ${activeTactic.name} aktiv!]` : '';

      if (duel.outcome === 'GOAL') {
        playGoalChime();
        if (duel.isHomeAttacking) {
          activeMatchState.homeScore++;
          activeMatchState.events.push({ minute: duel.minute, text: `⚽ TOR für ${activeMatchState.homeClub.name}! ${duel.attacker.name} überwindet die Abwehr und netzt ein!${tacticNote}` });
        } else {
          activeMatchState.awayScore++;
          activeMatchState.events.push({ minute: duel.minute, text: `⚽ TOR für ${activeMatchState.awayClub.name}! ${duel.attacker.name} trifft eiskalt!${tacticNote}` });
        }
      } else if (duel.outcome === 'TACKLED') {
        playCardFlipSound();
        activeMatchState.events.push({ minute: duel.minute, text: `🛑 Starker Zweikampf! ${duel.defender.name} stoppt den Vorstoß von ${duel.attacker.name} (${duel.minute}').${tacticNote}` });
      } else {
        playCardFlipSound();
        activeMatchState.events.push({ minute: duel.minute, text: `🧤 Glanzparade von ${duel.goalkeeper?.shortName || 'TW'} (${duel.minute}'). Glänzend pariert!${tacticNote}` });
      }

      activeMatchState.currentDuelIndex++;
      if (activeMatchState.currentDuelIndex >= activeMatchState.duels.length) {
        activeMatchState.completed = true;
      }
      store.notify();
    }
  });

  document.getElementById('btn-blitz-simulation')?.addEventListener('click', () => {
    if (activeMatchState && !activeMatchState.completed) {
      playGoalChime();
      simulateInstantMatch(activeMatchState);
      store.notify();
    }
  });

  document.getElementById('btn-finish-matchday')?.addEventListener('click', () => {
    if (activeMatchState) {
      playClickSound();
      const club = store.getPlayerClub();
      const isHome = activeMatchState.homeClub.id === club.id;
      const myScore = isHome ? activeMatchState.homeScore : activeMatchState.awayScore;
      const oppScore = isHome ? activeMatchState.awayScore : activeMatchState.homeScore;

      let result = 'DRAW';
      if (myScore > oppScore) result = 'WIN';
      if (myScore < oppScore) result = 'LOSS';

      club.stats.played++;
      club.stats.gf += myScore;
      club.stats.ga += oppScore;
      if (result === 'WIN') { club.stats.won++; club.stats.points += 3; }
      else if (result === 'DRAW') { club.stats.drawn++; club.stats.points += 1; }
      else { club.stats.lost++; }

      store.finalizeMatchday({ result, isHome });
      activeMatchState = null;
      store.closeModal();
    }
  });
}

function setupPackWalkoutEvents() {
  const packResult = store.getState().activePackResult;
  if (!packResult) return;

  const tearStrip = document.getElementById('foil-tear-strip');
  let startX = 0;
  let isDragging = false;

  const triggerTear = () => {
    if (packResult.isTorn) return;
    playPackTearSound();
    if (tearStrip) {
      tearStrip.classList.add('foil-tear-active');
    }
    setTimeout(() => {
      packResult.isTorn = true;
      playGoalChime();
      store.notify();
    }, 450);
  };

  if (tearStrip) {
    tearStrip.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      isDragging = true;
    }, { passive: true });

    tearStrip.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const currentX = e.touches[0].clientX;
      if (currentX - startX > 35) {
        isDragging = false;
        triggerTear();
      }
    }, { passive: true });

    tearStrip.addEventListener('touchend', () => { isDragging = false; });

    tearStrip.addEventListener('mousedown', (e) => {
      startX = e.clientX;
      isDragging = true;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      if (e.clientX - startX > 35) {
        isDragging = false;
        triggerTear();
      }
    });

    window.addEventListener('mouseup', () => { isDragging = false; });
    tearStrip.addEventListener('click', () => { triggerTear(); });
  }

  document.getElementById('btn-trigger-pack-tear')?.addEventListener('click', () => {
    triggerTear();
  });

  document.querySelectorAll('[data-pick-candidate]').forEach(el => {
    el.addEventListener('click', () => {
      playCardFlipSound();
      const candidateId = el.dataset.pickCandidate;
      packResult.selectedCandidate = packResult.candidates.find(c => c.id === candidateId);
      store.notify();
    });
  });

  document.getElementById('btn-confirm-pack-rewards')?.addEventListener('click', () => {
    playClickSound();
    const club = store.getPlayerClub();
    const state = store.getState();

    if (packResult.isStarterFoundation && packResult.cards) {
      club.squad = packResult.cards;
      playGoalChime();
      // Check for next starter pack (the star player draft!)
      const nextPackId = state.starterPacksPending?.shift();
      if (nextPackId) {
        const nextResult = openPack(nextPackId);
        nextResult.isTorn = false;
        state.activePackResult = nextResult;
        store.openModal('pack_walkout');
        return;
      }
    } else if (packResult.isDraft && packResult.selectedCandidate) {
      store.addDraftedPlayer(packResult.selectedCandidate);
      playGoalChime();
    } else if (!packResult.isDraft && packResult.cards) {
      store.getState().inventory.push(...packResult.cards);
    }
    store.getState().activePackResult = null;
    store.closeModal();
  });
}

function setupPostfachEvents() {
  document.getElementById('btn-close-modal')?.addEventListener('click', () => {
    playClickSound();
    activeDetailMessage = null;
    store.closeModal();
  });

  // Filter Chips
  document.querySelectorAll('[data-filter-inbox]').forEach(btn => {
    btn.addEventListener('click', () => {
      playClickSound();
      activeInboxFilter = btn.dataset.filterInbox;
      renderApp();
    });
  });

  // Einzelne Nachricht öffnen -> Detail Pop-Up Box
  document.querySelectorAll('[data-open-message]').forEach(card => {
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      const msgId = card.dataset.openMessage;
      const msg = store.getState().inbox.find(m => m.id === msgId);
      if (msg) {
        playClickSound();
        msg.unread = false;
        activeDetailMessage = msg;
        renderApp();
      }
    });
  });

  // Detail Pop-Up Box Buttons
  document.getElementById('btn-close-message-detail')?.addEventListener('click', (e) => {
    e.stopPropagation();
    playClickSound();
    activeDetailMessage = null;
    renderApp();
  });

  document.getElementById('btn-confirm-message-read')?.addEventListener('click', (e) => {
    e.stopPropagation();
    playClickSound();
    activeDetailMessage = null;
    renderApp();
  });

  document.querySelectorAll('[data-renew-contract]').forEach(btn => {
    btn.addEventListener('click', () => {
      const pId = btn.dataset.renewContract;
      const club = store.getPlayerClub();
      const player = club.squad.find(p => p.id === pId);
      if (player && club.coins >= 220) {
        playGoalChime();
        club.coins -= 220;
        player.contractMatches += 12;
        store.getState().inbox = store.getState().inbox.filter(m => m.playerId !== pId);
        activeDetailMessage = null;
        store.notify();
      } else {
        alert('Nicht genügend Coins vorhanden (220 🪙 benötigt).');
      }
    });
  });

  document.getElementById('btn-mark-all-read')?.addEventListener('click', () => {
    playClickSound();
    store.getState().inbox.forEach(m => m.unread = false);
    store.notify();
  });
}

function setupConsumablesEvents() {
  document.getElementById('btn-close-modal')?.addEventListener('click', () => {
    playClickSound();
    store.closeModal();
  });

  document.querySelectorAll('[data-filter-consumable]').forEach(btn => {
    btn.addEventListener('click', () => {
      activeConsumableFilter = btn.dataset.filterConsumable;
      playClickSound();
      renderApp();
    });
  });

  document.querySelectorAll('[data-apply-card]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cardInstId = btn.dataset.applyCard;
      const selectEl = document.querySelector(`[data-target-select="${cardInstId}"]`);
      const targetPlayerId = selectEl?.value;
      if (cardInstId && targetPlayerId) {
        playGoalChime();
        store.applyConsumable(cardInstId, targetPlayerId);
      }
    });
  });
}

function setupPlayerInspectEvents() {
  const club = store.getPlayerClub();
  const player = store.getState().inspectedPlayer;

  document.getElementById('btn-close-inspect')?.addEventListener('click', () => {
    playClickSound();
    store.closeModal();
  });

  document.querySelectorAll('[data-inspect-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      activeInspectTab = btn.dataset.inspectTab;
      playClickSound();
      renderApp();
    });
  });

  document.getElementById('btn-inspect-swap')?.addEventListener('click', () => {
    if (player) {
      playCardFlipSound();
      if (player.isStarter) {
        player.isStarter = false;
      } else {
        const openSlot = player.position;
        const currentStarter = club.squad.find(p => p.isStarter && (p.currentSlot === openSlot || p.position === openSlot));
        if (currentStarter) {
          store.swapPlayers(player.id, currentStarter.id);
        } else {
          player.isStarter = true;
          player.currentSlot = openSlot;
        }
      }
      store.notify();
      store.closeModal();
    }
  });

  document.getElementById('btn-inspect-consumable')?.addEventListener('click', () => {
    playClickSound();
    store.openModal('consumables');
  });
}

function setupSettingsEvents() {
  document.getElementById('btn-close-modal')?.addEventListener('click', () => {
    playClickSound();
    store.closeModal();
  });

  // Zum Hauptmenü Button
  document.getElementById('btn-goto-main-menu')?.addEventListener('click', () => {
    playClickSound();
    store.closeModal();
    isMainMenuActive = true;
    renderApp();
  });

  // Sound FX Toggle
  document.getElementById('btn-toggle-sound')?.addEventListener('click', () => {
    const newState = !isSoundEnabled();
    setSoundEnabled(newState);
    if (!store.getState().settings) store.getState().settings = {};
    store.getState().settings.soundEnabled = newState;
    if (newState) playClickSound();
    store.notify();
  });

  // Match Sim Speed
  document.querySelectorAll('.sim-speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const speed = btn.dataset.simSpeed;
      if (!store.getState().settings) store.getState().settings = {};
      store.getState().settings.simSpeed = speed;
      playClickSound();
      store.notify();
    });
  });

  // Spielstand im aktuellen Slot löschen
  document.getElementById('btn-reset-current-slot')?.addEventListener('click', async () => {
    const activeSlot = getActiveSlotId();
    if (confirm(`Möchtest du deinen Spielstand in ${activeSlot.toUpperCase().replace('_', ' ')} wirklich löschen?`)) {
      await store.deleteGameSlot(activeSlot);
      isMainMenuActive = true;
      renderApp();
    }
  });
}

function setupOnboardingEvents() {
  const updateLivePreview = () => {
    const previewContainer = document.getElementById('live-crest-preview');
    const nameLabel = document.getElementById('live-club-name-preview');
    if (previewContainer) {
      previewContainer.innerHTML = renderClubCrest({
        name: onboardingFormState.clubName,
        crestForm: onboardingFormState.crestForm,
        primaryColor: onboardingFormState.primaryColor,
        secondaryColor: onboardingFormState.secondaryColor
      }, 64);
    }
    if (nameLabel) {
      nameLabel.textContent = onboardingFormState.clubName || 'FC Apex Nova';
    }
  };

  // Cancel Onboarding
  document.getElementById('btn-cancel-onboarding')?.addEventListener('click', () => {
    playClickSound();
    isOnboardingActive = false;
    store.closeModal();
    isMainMenuActive = true;
    renderApp();
  });

  // Club Name Input
  const nameInput = document.getElementById('input-club-name');
  if (nameInput) {
    nameInput.addEventListener('input', (e) => {
      onboardingFormState.clubName = e.target.value;
      updateLivePreview();
    });
  }

  // Wappen-Formen Buttons
  document.querySelectorAll('[data-shape-choice]').forEach(btn => {
    btn.addEventListener('click', () => {
      playClickSound();
      onboardingFormState.crestForm = btn.dataset.shapeChoice;
      document.querySelectorAll('[data-shape-choice]').forEach(b => {
        b.className = b.className.replace('bg-pitch-emerald/20 border-pitch-emerald ring-2 ring-pitch-emerald/60 text-slate-100', 'bg-slate-900 border-slate-800 text-slate-400');
      });
      btn.className = btn.className.replace('bg-slate-900 border-slate-800 text-slate-400', 'bg-pitch-emerald/20 border-pitch-emerald ring-2 ring-pitch-emerald/60 text-slate-100');
      updateLivePreview();
    });
  });

  // Primary Color Native & Presets
  const primaryInput = document.getElementById('input-primary-color');
  const primaryLabel = document.getElementById('hex-primary-label');
  if (primaryInput) {
    primaryInput.addEventListener('input', (e) => {
      onboardingFormState.primaryColor = e.target.value;
      if (primaryLabel) primaryLabel.textContent = e.target.value;
      updateLivePreview();
    });
  }

  document.querySelectorAll('[data-preset-primary]').forEach(btn => {
    btn.addEventListener('click', () => {
      const color = btn.dataset.presetPrimary;
      onboardingFormState.primaryColor = color;
      if (primaryInput) primaryInput.value = color;
      if (primaryLabel) primaryLabel.textContent = color;
      playClickSound();
      updateLivePreview();
    });
  });

  // Secondary Color Native & Presets
  const secondaryInput = document.getElementById('input-secondary-color');
  const secondaryLabel = document.getElementById('hex-secondary-label');
  if (secondaryInput) {
    secondaryInput.addEventListener('input', (e) => {
      onboardingFormState.secondaryColor = e.target.value;
      if (secondaryLabel) secondaryLabel.textContent = e.target.value;
      updateLivePreview();
    });
  }

  document.querySelectorAll('[data-preset-secondary]').forEach(btn => {
    btn.addEventListener('click', () => {
      const color = btn.dataset.presetSecondary;
      onboardingFormState.secondaryColor = color;
      if (secondaryInput) secondaryInput.value = color;
      if (secondaryLabel) secondaryLabel.textContent = color;
      playClickSound();
      updateLivePreview();
    });
  });

  // Submit Club Creation
  document.getElementById('btn-submit-onboarding')?.addEventListener('click', () => {
    playGoalChime();
    isOnboardingActive = false;
    isMainMenuActive = false;
    store.startNewGame({
      clubName: onboardingFormState.clubName || 'FC Apex Nova',
      crestForm: onboardingFormState.crestForm || 'shield',
      primaryColor: onboardingFormState.primaryColor || '#00f59b',
      secondaryColor: onboardingFormState.secondaryColor || '#ffd15c',
      targetSlot: onboardingTargetSlot
    });

    // Trigger Pack 1 (Starter Foundation 18-Spieler Pack)
    const state = store.getState();
    const firstPackId = state.starterPacksPending?.shift() || 'pack_starter_foundation';
    const firstResult = openPack(firstPackId);
    firstResult.isTorn = false;
    state.activePackResult = firstResult;
    store.openModal('pack_walkout');
  });
}

// Global App Initialization
store.subscribe(() => renderApp());
store.init().then(() => renderApp());
