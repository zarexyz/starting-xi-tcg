// =============================================================================
// Starting XI TCG — Reactive Game State Store
// =============================================================================

import { generateWorldDatabase, generatePlayer } from '../engine/database.js';
import { generateLeagueSchedule, computeLeagueTable, generateFinalFourBracket } from '../engine/schedule.js';
import { calculateSquadChemistry } from '../engine/ratings.js';
import { calculateMatchdayFinances } from '../engine/economy.js';
import { saveGameState, loadGameState, clearGameState } from './storage.js';
import { TACTIC_CARDS } from '../engine/duel.js';
import { CONSUMABLE_CARDS } from '../engine/packs.js';

class GameStore {
  constructor() {
    this.state = null;
    this.listeners = new Set();
  }

  getState() {
    return this.state;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    if (this.state) {
      saveGameState(this.state);
    }
    this.listeners.forEach(fn => fn(this.state));
  }

  async init() {
    const saved = await loadGameState();
    if (saved && saved.club) {
      this.state = saved;
      this.notify();
      return true;
    }
    return false;
  }

  /**
   * Startet ein neues Spiel (Road to Glory in Liga 6)
   */
  startNewGame({ clubName, primaryColor, secondaryColor, captainRole = 'ST' }) {
    const { leagues, allClubs } = generateWorldDatabase();
    const liga6 = leagues.find(l => l.tier === 6);
    const schedule = generateLeagueSchedule(liga6.clubs);

    // Spielerverein finden und konfigurieren
    const playerClub = liga6.clubs.find(c => c.isPlayer);
    playerClub.name = clubName || 'FC Apex Nova';
    playerClub.primaryColor = primaryColor || '#00f59b';
    playerClub.secondaryColor = secondaryColor || '#ffd15c';
    playerClub.coins = 3450;

    // Erzeuge 1 Gold-Star-Kapitän
    let starPos = captainRole === 'ST' ? 'ST' : (captainRole === 'MF' ? 'ZM' : 'IV');
    const starCaptain = generatePlayer(starPos, 78, null, `${clubName.split(' ')[0]} Star`);
    starCaptain.isStarter = true;
    starCaptain.currentSlot = starPos;
    starCaptain.isCaptain = true;
    
    // Tausche Starter mit dem Kapitän
    const oldStarterIdx = playerClub.squad.findIndex(p => p.currentSlot === starPos);
    if (oldStarterIdx !== -1) {
      playerClub.squad[oldStarterIdx] = starCaptain;
    } else {
      playerClub.squad.unshift(starCaptain);
    }

    // Anfangs-Inventar
    const inventory = [
      { ...CONSUMABLE_CARDS[0], instanceId: 'init_1' }, // Gold-Vertrag
      { ...CONSUMABLE_CARDS[1], instanceId: 'init_2' }, // Fitness-Express
      { ...CONSUMABLE_CARDS[1], instanceId: 'init_3' }, // Fitness-Express
      { ...CONSUMABLE_CARDS[2], instanceId: 'init_4' }, // Blitzgenesung
      { ...CONSUMABLE_CARDS[3], instanceId: 'init_5' }  // Positions-Umschulung
    ];

    // Taktikdeck-Karten
    const tacticDeck = [...TACTIC_CARDS];
    const equippedTactics = ['t_second_wind', 't_park_bus', 't_counter_frenzy'];

    // Postfach Mitteilungen
    const inbox = [
      {
        id: 'msg_1',
        title: 'Willkommen bei Starting XI TCG!',
        type: 'INFO',
        unread: true,
        date: 'Vor 10 Min.',
        text: `Herzlich willkommen als Manager von ${playerClub.name}! Dein Sponsoring-Vertrag und dein Starter-Deck stehen bereit. Führe deinen Club aus Liga 6 über das Final Four an die nationale Spitze!`
      },
      {
        id: 'msg_2',
        title: 'Sponsoren-Auszahlung erhalten',
        type: 'SPONSOR',
        unread: true,
        date: 'Vor 5 Min.',
        text: 'Antrittsprämie von Hauptsponsor Nova Energy (+500🪙) gutgeschrieben.'
      }
    ];

    this.state = {
      activeTab: 'home',
      activeModal: null, // 'postfach' | 'consumables' | 'match_arena' | 'pack_walkout' | 'settings' | 'onboarding'
      currentMatchday: 1,
      maxMatchdays: 18,
      selectedLeagueTier: 6,
      leagues,
      allClubs,
      playerClubId: playerClub.id,
      schedule,
      inventory,
      tacticDeck,
      equippedTactics,
      inbox,
      finalFour: null, // Wird nach Spieltag 18 befüllt
      activePackResult: null
    };

    this.notify();
  }

  // --- Actions ---

  setActiveTab(tabName) {
    if (this.state) {
      this.state.activeTab = tabName;
      this.notify();
    }
  }

  openModal(modalName, payload = null) {
    if (this.state) {
      this.state.activeModal = modalName;
      this.state.modalPayload = payload;
      this.notify();
    }
  }

  closeModal() {
    if (this.state) {
      this.state.activeModal = null;
      this.state.modalPayload = null;
      this.notify();
    }
  }

  getPlayerClub() {
    if (!this.state) return null;
    const liga = this.state.leagues.find(l => l.tier === 6);
    return liga.clubs.find(c => c.id === this.state.playerClubId);
  }

  /**
   * Wendet eine Verbrauchskarte auf einen Spieler an
   */
  applyConsumable(instanceId, targetPlayerId) {
    const club = this.getPlayerClub();
    const cardIdx = this.state.inventory.findIndex(c => c.instanceId === instanceId);
    if (cardIdx === -1) return false;

    const card = this.state.inventory[cardIdx];
    const player = club.squad.find(p => p.id === targetPlayerId);
    if (!player) return false;

    if (card.type === 'FITNESS') {
      player.condition = 100;
    } else if (card.type === 'CONTRACT') {
      player.contractMatches += 10;
      player.contractDiscountUntilMatch = this.state.currentMatchday + 10;
    } else if (card.type === 'MEDICAL') {
      player.injury = null;
    } else if (card.type === 'TACTIC' && card.retrains) {
      // Passt Primärposition an aktuellen Slot an
      player.position = player.currentSlot;
    }

    // Entferne verbrauchte Karte
    this.state.inventory.splice(cardIdx, 1);
    this.notify();
    return true;
  }

  /**
   * Nimmt einen gedrafteten Spieler auf
   */
  addDraftedPlayer(player) {
    const club = this.getPlayerClub();
    if (club.squad.length >= 23) {
      alert('Kaderlimit von 23 Spielern erreicht! Bitte erst einen Spieler freistellen.');
      return false;
    }

    player.isStarter = false;
    club.squad.push(player);
    this.notify();
    return true;
  }

  /**
   * Ändert die taktische Formation (z.B. 4-3-3, 4-4-2)
   */
  setFormation(formationKey) {
    const club = this.getPlayerClub();
    club.formation = formationKey;
    this.notify();
  }

  /**
   * Tauscht zwei Spieler oder weist einen Spieler einem Slot / der Bank zu
   */
  swapPlayers(idA, idB, targetSlot = null) {
    const club = this.getPlayerClub();
    const pA = club.squad.find(p => p.id === idA);
    const pB = idB ? club.squad.find(p => p.id === idB) : null;
    if (!pA) return;

    if (pB && pA.id !== pB.id) {
      const tempSlot = pA.currentSlot;
      const tempStarter = pA.isStarter;

      pA.currentSlot = pB.currentSlot || targetSlot || pB.position;
      pA.isStarter = pB.isStarter;

      pB.currentSlot = tempSlot || pA.position;
      pB.isStarter = tempStarter;
    } else if (targetSlot) {
      if (targetSlot === 'bench') {
        pA.isStarter = false;
      } else {
        pA.isStarter = true;
        pA.currentSlot = targetSlot;
      }
    }

    this.notify();
  }

  /**
   * Zieht das Spieltagsgehalt ab und aktualisiert Kondition & Verträge
   */
  finalizeMatchday({ result, isHome }) {
    const club = this.getPlayerClub();
    const finances = calculateMatchdayFinances(club, result, isHome);

    club.coins = Math.max(0, club.coins + finances.netProfit);

    // Kondition & Verträge abbauen
    club.squad.forEach(p => {
      if (p.isStarter) {
        p.condition = Math.max(40, p.condition - Math.floor(12 + Math.random() * 8));
        p.contractMatches = Math.max(0, p.contractMatches - 1);
      } else {
        p.condition = Math.min(100, p.condition + 15); // Erholung auf der Bank
      }

      // Vertragsalarm generieren wenn < 2 Spiele
      if (p.contractMatches === 2) {
        this.state.inbox.unshift({
          id: `alert_contract_${p.id}_${Date.now()}`,
          title: `⚠️ Vertrag läuft aus: ${p.name}`,
          type: 'ALERT',
          unread: true,
          date: 'Gerade eben',
          playerId: p.id,
          text: `Der Vertrag von ${p.name} (${p.position}, ${p.ovr} OVR) läuft in 2 Spieltagen aus! Verlängere jetzt, um einen ablösefreien Abgang zu verhindern.`
        });
      }
    });

    this.state.currentMatchday++;
    this.notify();
  }

  resetSave() {
    clearGameState();
    this.state = null;
    this.notify();
  }
}

export const store = new GameStore();
