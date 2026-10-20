// =============================================================================
// Starting XI TCG — Central Game State Store (Reactive State Machine)
// =============================================================================

import { loadGameState, saveGameState, clearGameState, listAllSlots, getActiveSlotId, setActiveSlotId } from './storage.js';
import { generateSchedule, generateLeagues, generatePlayer } from '../engine/database.js';
import { calculateTeamChemistry } from '../engine/chemistry.js';
import { calculateMatchdayFinances } from '../engine/economy.js';

class GameStore {
  constructor() {
    this.state = null;
    this.listeners = [];
  }

  async init() {
    this.state = await loadGameState();
    // Falls ein Spielstand existiert, Chemie und Ratings sicherheitshalber neu ermitteln
    if (this.state && this.getPlayerClub()) {
      this.recalculateClubChemistry();
    }
  }

  getState() {
    return this.state;
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    if (this.state) {
      saveGameState(this.state);
    }
    this.listeners.forEach(listener => listener(this.state));
  }

  async loadGameSlot(slotId) {
    setActiveSlotId(slotId);
    this.state = await loadGameState();
    if (this.state && this.getPlayerClub()) {
      this.recalculateClubChemistry();
    }
    this.notify();
    return !!this.state;
  }

  async deleteGameSlot(slotId) {
    const activeSlot = getActiveSlotId();
    if (activeSlot === slotId) {
      clearGameState();
      this.state = null;
    } else {
      localStorage.removeItem(`starting_xi_tcg_state_${slotId}`);
    }
    this.notify();
  }

  /**
   * Startet ein völlig neues Spiel mit Starter-Packs (Foundation + Star Draft)
   */
  startNewGame({ clubName, crestForm = 'shield', primaryColor = '#00f59b', secondaryColor = '#ffd15c', targetSlot = 'slot_1' }) {
    setActiveSlotId(targetSlot);

    const leagues = generateLeagues();
    const schedule = generateSchedule();

    const userClub = {
      id: 'club_user',
      name: clubName || 'FC Apex Nova',
      isUser: true,
      formation: '4-3-3',
      crest: {
        form: crestForm,
        primaryColor,
        secondaryColor
      },
      coins: 1000,
      fanBase: 1250,
      season: 1,
      stats: { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 },
      squad: [] // Wird gleich über das Starter-Pack befüllt!
    };

    // Ersetze Platzhalter in Liga 6
    const liga6 = leagues.find(l => l.tier === 6);
    if (liga6 && liga6.clubs.length > 0) {
      liga6.clubs[0] = userClub;
    }

    this.state = {
      userClubId: 'club_user',
      currentMatchday: 1,
      selectedLeagueTier: 6,
      wettbewerbCompetition: 'liga',
      wettbewerbTab: 'overview',
      viewMatchday: 1,
      maxMatchdays: 18,
      leagues,
      schedule,
      inventory: [
        {
          id: 'c_train_tempo',
          instanceId: `item_starter_train_${Date.now()}`,
          type: 'TRAINING',
          name: 'Sprint-Drill',
          rarity: 'silver',
          icon: '👟',
          title: '+2 Tempo permanent',
          description: 'Erhöht das Tempo & den Antritt (PAC) eines Spielers dauerhaft um +2 Punkte.',
          trainAttr: 'pac',
          trainVal: 2
        },
        {
          id: 'c_gold_contract',
          instanceId: `item_starter_contract_${Date.now()}`,
          type: 'CONTRACT',
          name: 'Gold-Vertrag',
          rarity: 'gold',
          icon: '📜',
          title: '50% Gehalts-Rabatt',
          description: 'Senkt das Gehalt eines ausgewählten Spielers um 50% für die nächsten 10 Pflichtspiele.',
          duration: 10,
          discountRate: 0.50
        },
        {
          id: 'c_fitness_express',
          instanceId: `item_starter_fitness_${Date.now()}`,
          type: 'FITNESS',
          name: 'Fitness-Express',
          rarity: 'silver',
          icon: '⚡',
          title: '100% Sofort-Kondition',
          description: 'Stellt Ausdauer und Frische eines Spielers sofort auf das Maximum von 100% wieder her.',
          healsFatigue: true
        }
      ],
      inbox: [
        {
          id: 'msg_welcome',
          title: 'Willkommen bei Starting XI TCG!',
          type: 'SYSTEM',
          unread: true,
          date: 'Gerade eben',
          text: `Herzlich willkommen als Manager von ${userClub.name}! Wir haben dir zum Start zwei Gratis-Booster bereitgestellt: Dein 18-Mann-Basisteam sowie einen Starspieler-Draft. Öffne jetzt die Packs und führe deinen Verein in die Königsklasse!`
        }
      ],
      equippedTactics: ['t_second_wind', 't_park_bus', 't_counter_frenzy'],
      activeTab: 'home',
      activeModal: null,
      pendingPack: null,
      activePackResult: null,
      starterPacksPending: ['pack_starter_star'], // Pack 2 folgt nach Foundation
      settings: {
        soundEnabled: true,
        simSpeed: 'normal'
      }
    };

    this.notify();
  }

  getPlayerClub() {
    if (!this.state?.leagues) return null;
    const liga = this.state.leagues.find(l => l.tier === 6);
    return liga?.clubs.find(c => c.id === this.state.userClubId) || null;
  }

  recalculateClubChemistry() {
    const club = this.getPlayerClub();
    if (!club || !club.squad) return;
    const starters = club.squad.filter(p => p.isStarter);
    starters.forEach(player => {
      player.chemistry = calculateTeamChemistry(player, starters, club.formation || '4-3-3');
    });
  }

  setActiveTab(tabName) {
    if (this.state) {
      this.state.activeTab = tabName;
      this.notify();
    }
  }

  openModal(modalName) {
    if (this.state) {
      this.state.activeModal = modalName;
      this.notify();
    }
  }

  closeModal() {
    if (this.state) {
      this.state.activeModal = null;
      this.notify();
    }
  }

  /**
   * Wendet eine Verbrauchs-/Itemkarte auf einen Zielspieler an
   */
  applyConsumable(cardInstanceId, targetPlayerId) {
    const club = this.getPlayerClub();
    const player = club.squad.find(p => p.id === targetPlayerId);
    const cardIdx = this.state.inventory.findIndex(c => (c.instanceId || c.id) === cardInstanceId);

    if (!player || cardIdx === -1) return false;

    const card = this.state.inventory[cardIdx];

    if (card.type === 'CONTRACT') {
      player.contractDiscount = card.discountRate || 0.50;
      player.discountMatches = card.duration || 10;
    } else if (card.type === 'FITNESS') {
      player.condition = 100;
    } else if (card.type === 'MEDICAL') {
      player.injured = false;
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
