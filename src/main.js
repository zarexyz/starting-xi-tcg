// =============================================================================
// Starting XI TCG — Main Application Entry & UI Orchestrator
// =============================================================================

import { store } from './state/store.js';
import { renderHeader } from './components/header.js';
import { renderNavbar } from './components/navbar.js';
import { renderHomeScreen } from './screens/home.js';
import { renderKaderScreen } from './screens/kader.js';
import { renderWettbewerbScreen } from './screens/wettbewerb.js';
import { renderMarktScreen } from './screens/markt.js';
import { renderVereinScreen } from './screens/verein.js';
import { renderMatchArenaModal } from './modals/match_arena.js';
import { renderPackWalkoutModal } from './modals/pack_walkout.js';
import { renderPostfachModal } from './modals/postfach.js';
import { renderConsumablesModal } from './modals/consumables.js';
import { renderSettingsModal } from './modals/settings.js';
import { renderOnboardingModal } from './modals/onboarding.js';
import { renderPlayerInspectModal } from './modals/player_inspect.js';
import { openPack } from './engine/packs.js';
import { setupMatchSimulation, resolveDuelClash, simulateInstantMatch } from './engine/duel.js';

let activeMatchState = null;
let draggedPlayerId = null;

// Global HTML5 Drag & Drop handlers
window.handleCardDragStart = function(e, playerId) {
  draggedPlayerId = playerId;
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

function renderApp() {
  const appEl = document.getElementById('app');
  const modalRoot = document.getElementById('modal-root');
  const state = store.getState();

  // Onboarding wenn noch kein Spielstand existiert
  if (!state) {
    appEl.innerHTML = '';
    modalRoot.innerHTML = renderOnboardingModal();
    setupOnboardingEvents();
    return;
  }

  // Header
  const headerHTML = renderHeader(state);

  // Active Screen
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

  // Bottom Navigation
  const navbarHTML = renderNavbar(state.activeTab);

  appEl.innerHTML = `
    ${headerHTML}
    ${screenHTML}
    ${navbarHTML}
  `;

  // Render Modals
  renderModals(state, modalRoot);

  // Setup Event Listeners
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
      modalRoot.innerHTML = renderMatchArenaModal(activeMatchState, state.equippedTactics);
      setupMatchArenaEvents();
      break;
    case 'pack_walkout':
      modalRoot.innerHTML = renderPackWalkoutModal(state.activePackResult);
      setupPackWalkoutEvents();
      break;
    case 'postfach':
      modalRoot.innerHTML = renderPostfachModal(state.inbox);
      setupPostfachEvents();
      break;
    case 'consumables':
      modalRoot.innerHTML = renderConsumablesModal(state.inventory, club.squad);
      setupConsumablesEvents();
      break;
    case 'settings':
      modalRoot.innerHTML = renderSettingsModal(state);
      setupSettingsEvents();
      break;
    case 'player_inspect':
      modalRoot.innerHTML = renderPlayerInspectModal(state.inspectedPlayer, club);
      setupPlayerInspectEvents();
      break;
    default:
      modalRoot.innerHTML = '';
  }
}

function setupGlobalEvents(state) {
  // Tab Navigation
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tab = btn.dataset.tab;
      if (tab) store.setActiveTab(tab);
    });
  });

  // Header Postfach & Settings
  document.getElementById('btn-header-inbox')?.addEventListener('click', () => {
    store.openModal('postfach');
  });

  document.getElementById('btn-header-settings')?.addEventListener('click', () => {
    store.openModal('settings');
  });

  // Formation Dropdown
  document.getElementById('select-formation')?.addEventListener('change', (e) => {
    store.setFormation(e.target.value);
  });

  // Player Card Click -> Full Detail Inspect Modal
  document.querySelectorAll('[data-inspect-player]').forEach(el => {
    el.addEventListener('click', () => {
      const pId = el.dataset.inspectPlayer;
      const club = store.getPlayerClub();
      state.inspectedPlayer = club.squad.find(p => p.id === pId);
      if (state.inspectedPlayer) {
        store.openModal('player_inspect');
      }
    });
  });

  document.getElementById('btn-header-settings')?.addEventListener('click', () => {
    store.openModal('settings');
  });

  // Quick Links auf Home
  document.getElementById('btn-quick-kader')?.addEventListener('click', () => {
    store.setActiveTab('kader');
  });

  document.getElementById('btn-quick-draft')?.addEventListener('click', () => {
    store.setActiveTab('markt');
  });

  // Match Anpfiff Trigger
  document.getElementById('btn-start-match')?.addEventListener('click', () => {
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
    store.openModal('consumables');
  });

  // League Selector auf Wettbewerb
  const leagueSelect = document.getElementById('select-league-tier');
  if (leagueSelect) {
    leagueSelect.addEventListener('change', (e) => {
      store.getState().selectedLeagueTier = parseInt(e.target.value, 10);
      store.notify();
    });
  }

  // Wettbewerb 4 Sub-Tabs
  document.querySelectorAll('[data-wettbewerb-tab]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      store.getState().wettbewerbTab = e.currentTarget.dataset.wettbewerbTab;
      store.notify();
    });
  });

  // Spielplan Matchday Slider
  document.getElementById('btn-prev-matchday')?.addEventListener('click', (e) => {
    const day = parseInt(e.currentTarget.dataset.day, 10);
    if (day >= 1) {
      store.getState().viewMatchday = day;
      store.notify();
    }
  });

  document.getElementById('btn-next-matchday')?.addEventListener('click', (e) => {
    const day = parseInt(e.currentTarget.dataset.day, 10);
    if (day <= (store.getState().maxMatchdays || 18)) {
      store.getState().viewMatchday = day;
      store.notify();
    }
  });

  // Pack Buttons auf Markt
  document.querySelectorAll('[data-open-pack]').forEach(btn => {
    btn.addEventListener('click', () => {
      const packId = btn.dataset.openPack;
      const club = store.getPlayerClub();
      const packResult = openPack(packId);

      if (club.coins >= packResult.pack.price) {
        club.coins -= packResult.pack.price;
        store.getState().activePackResult = packResult;
        store.openModal('pack_walkout');
      }
    });
  });

  // Tausch von Starter und Bankspieler
  let selectedStarterId = null;
  document.querySelectorAll('[data-starter-id]').forEach(el => {
    el.addEventListener('click', () => {
      selectedStarterId = el.dataset.starterId;
      document.querySelectorAll('[data-starter-id]').forEach(x => x.classList.remove('ring-2', 'ring-pitch-emerald'));
      el.classList.add('ring-2', 'ring-pitch-emerald');
    });
  });

  document.querySelectorAll('[data-player-id]').forEach(el => {
    el.addEventListener('click', () => {
      const benchId = el.dataset.playerId;
      if (selectedStarterId && benchId && selectedStarterId !== benchId) {
        store.swapPlayers(selectedStarterId, benchId);
        selectedStarterId = null;
      }
    });
  });
}

function setupMatchArenaEvents() {
  document.getElementById('btn-resolve-next-duel')?.addEventListener('click', () => {
    if (activeMatchState && !activeMatchState.completed) {
      const duel = activeMatchState.duels[activeMatchState.currentDuelIndex];
      resolveDuelClash(duel);

      if (duel.outcome === 'GOAL') {
        if (duel.isHomeAttacking) {
          activeMatchState.homeScore++;
          activeMatchState.events.push({ minute: duel.minute, text: `⚽ TOR für ${activeMatchState.homeClub.name}! ${duel.attacker.name} trifft!` });
        } else {
          activeMatchState.awayScore++;
          activeMatchState.events.push({ minute: duel.minute, text: `⚽ TOR für ${activeMatchState.awayClub.name}! ${duel.attacker.name} trifft!` });
        }
      } else {
        activeMatchState.events.push({ minute: duel.minute, text: `🧤 Glanzparade von ${duel.goalkeeper?.shortName || 'TW'} (${duel.minute}').` });
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
      simulateInstantMatch(activeMatchState);
      store.notify();
    }
  });

  document.getElementById('btn-finish-matchday')?.addEventListener('click', () => {
    if (activeMatchState) {
      const club = store.getPlayerClub();
      const isHome = activeMatchState.homeClub.id === club.id;
      const myScore = isHome ? activeMatchState.homeScore : activeMatchState.awayScore;
      const oppScore = isHome ? activeMatchState.awayScore : activeMatchState.homeScore;

      let result = 'DRAW';
      if (myScore > oppScore) result = 'WIN';
      if (myScore < oppScore) result = 'LOSS';

      // Club Stats updaten
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

  document.querySelectorAll('[data-pick-candidate]').forEach(el => {
    el.addEventListener('click', () => {
      const candidateId = el.dataset.pickCandidate;
      packResult.selectedCandidate = packResult.candidates.find(c => c.id === candidateId);
      store.notify();
    });
  });

  document.getElementById('btn-confirm-pack-rewards')?.addEventListener('click', () => {
    if (packResult.isDraft && packResult.selectedCandidate) {
      store.addDraftedPlayer(packResult.selectedCandidate);
    } else if (!packResult.isDraft && packResult.cards) {
      store.getState().inventory.push(...packResult.cards);
    }
    store.getState().activePackResult = null;
    store.closeModal();
  });
}

function setupPostfachEvents() {
  document.getElementById('btn-close-modal')?.addEventListener('click', () => store.closeModal());

  document.querySelectorAll('[data-renew-contract]').forEach(btn => {
    btn.addEventListener('click', () => {
      const pId = btn.dataset.renewContract;
      const club = store.getPlayerClub();
      const player = club.squad.find(p => p.id === pId);
      if (player && club.coins >= 220) {
        club.coins -= 220;
        player.contractMatches += 12;
        // Nachricht als erledigt markieren
        store.getState().inbox = store.getState().inbox.filter(m => m.playerId !== pId);
        store.notify();
      }
    });
  });

  document.getElementById('btn-mark-all-read')?.addEventListener('click', () => {
    store.getState().inbox.forEach(m => m.unread = false);
    store.notify();
  });
}

function setupConsumablesEvents() {
  document.getElementById('btn-close-modal')?.addEventListener('click', () => store.closeModal());

  document.querySelectorAll('[data-apply-card]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cardInstId = btn.dataset.applyCard;
      const selectEl = document.querySelector(`[data-target-select="${cardInstId}"]`);
      const targetPlayerId = selectEl?.value;
      if (cardInstId && targetPlayerId) {
        store.applyConsumable(cardInstId, targetPlayerId);
      }
    });
  });
}

function setupPlayerInspectEvents() {
  const club = store.getPlayerClub();
  const player = store.getState().inspectedPlayer;

  document.getElementById('btn-close-inspect')?.addEventListener('click', () => {
    store.closeModal();
  });

  document.getElementById('btn-inspect-swap')?.addEventListener('click', () => {
    if (player) {
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
    store.openModal('consumables');
  });
}

function setupSettingsEvents() {
  document.getElementById('btn-close-modal')?.addEventListener('click', () => store.closeModal());

  document.getElementById('btn-reset-game')?.addEventListener('click', () => {
    if (confirm('Möchtest du wirklich deinen gesamten Spielstand löschen und neu starten?')) {
      store.resetSave();
    }
  });
}

function setupOnboardingEvents() {
  document.getElementById('btn-submit-onboarding')?.addEventListener('click', () => {
    const clubName = document.getElementById('input-club-name')?.value || 'FC Apex Nova';
    const primaryColor = document.getElementById('input-primary-color')?.value || '#00f59b';
    const secondaryColor = document.getElementById('input-secondary-color')?.value || '#ffd15c';
    const captainRole = document.querySelector('input[name="captainRole"]:checked')?.value || 'ST';

    store.startNewGame({ clubName, primaryColor, secondaryColor, captainRole });
  });
}

// Global App Initialization
store.subscribe(() => renderApp());
store.init().then(() => renderApp());
