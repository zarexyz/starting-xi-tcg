// =============================================================================
// Starting XI TCG — Reactive Game State Store
// =============================================================================

import { generateWorldDatabase, generatePlayer } from '../engine/database.js';
import { generateLeagueSchedule, computeLeagueTable, generateFinalFourBracket } from '../engine/schedule.js';
import { calculateSquadChemistry } from '../engine/ratings.js';
import { calculateMatchdayFinances } from '../engine/economy.js';
import { saveGameState, loadGameState, clearGameState, loadSlot, saveSlot, deleteSlot, getActiveSlotId, setActiveSlotId } from './storage.js';
import { TACTIC_CARDS } from '../engine/duel.js';
import { CONSUMABLE_CARDS } from '../engine/packs.js';
import { setSoundEnabled } from '../engine/audio.js';

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
    if (saved && saved.playerClubId) {
      this.state = saved;
      if (this.state.settings?.soundEnabled !== undefined) {
        setSoundEnabled(this.state.settings.soundEnabled);
      }
      this.notify();
      return true;
    }
    return false;
  }

  async loadGameSlot(slotId) {
    setActiveSlotId(slotId);
    const data = await loadSlot(slotId);
    if (data && data.playerClubId) {
      this.state = data;
      if (this.state.settings?.soundEnabled !== undefined) {
        setSoundEnabled(this.state.settings.soundEnabled);
      }
      this.notify();
      return true;
    }
    return false;
  }

  async deleteGameSlot(slotId) {
    await deleteSlot(slotId);
    const activeSlot = getActiveSlotId();
    if (activeSlot === slotId) {
      this.state = null;
    }
    this.notify();
  }

  /**
   * Startet ein neues Spiel (Road to Glory in Liga 6)
   */
  startNewGame({ clubName, primaryColor, secondaryColor, crestForm = 'shield', captainRole = 'ST', targetSlot = 'slot_1' }) {
    setActiveSlotId(targetSlot);
    const { leagues, allClubs } = generateWorldDatabase();
    const liga6 = leagues.find(l => l.tier === 6);
    const schedule = generateLeagueSchedule(liga6.clubs);

    // Spielerverein finden und konfigurieren
    const playerClub = liga6.clubs.find(c => c.isPlayer);
    playerClub.name = clubName || 'FC Apex Nova';
    playerClub.primaryColor = primaryColor || '#00f59b';
    playerClub.secondaryColor = secondaryColor || '#ffd15c';
    playerClub.crestForm = crestForm || 'shield';
    playerClub.coins = 1500;
    playerClub.squad = []; // Wird direkt durch das 18er Starter-Pack befüllt

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
      slotId: targetSlot,
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
      settings: {
        soundEnabled: true,
        simSpeed: 'blitz'
      },
      finalFour: null, // Wird nach Spieltag 18 befüllt
      activePackResult: null,
      starterPacksPending: ['pack_starter_foundation', 'pack_starter_star']
    };

    saveSlot(targetSlot, this.state);
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
    } else if (card.type === 'TRAINING') {
      if ((player.trainingCount || 0) >= 3) {
        alert('Dieser Spieler hat bereits das Maximum von 3 Trainings-Boosts absolviert!');
        return false;
      }
      player.trainingCount = (player.trainingCount || 0) + 1;
      if (card.trainMaster) {
        player.pac = Math.min(99, (player.pac || 60) + 1);
        player.sho = Math.min(99, (player.sho || 60) + 1);
        player.pas = Math.min(99, (player.pas || 60) + 1);
        player.dri = Math.min(99, (player.dri || 60) + 1);
        player.def = Math.min(99, (player.def || 60) + 1);
        player.phy = Math.min(99, (player.phy || 60) + 1);
      } else if (card.trainAttr && card.trainVal) {
        player[card.trainAttr] = Math.min(99, (player[card.trainAttr] || 60) + card.trainVal);
      }
      // OVR neu berechnen
      player.ovr = Math.round((player.pac + player.sho + player.pas + player.dri + player.def + player.phy) / 6);
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

  markMessageRead(messageId) {
    if (!this.state?.inbox) return;
    const msg = this.state.inbox.find(m => m.id === messageId);
    if (msg) {
      msg.unread = false;
      this.notify();
    }
  }

  dismissMessage(messageId) {
    if (!this.state?.inbox) return;
    this.state.inbox = this.state.inbox.filter(m => m.id !== messageId);
    this.notify();
  }

  resetSave() {
    clearGameState();
    this.state = null;
    this.notify();
  }
}

export const store = new GameStore();
