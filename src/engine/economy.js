// =============================================================================
// Finanzen: Einnahmen, Gehälter, Soft-Cap, Prämien
// =============================================================================

import { salaryFor } from './player.js';
import { clubPlayers } from './world.js';

/** Grundeinnahme pro Heimspiel je Liga */
export const TIER_INCOME = { 6: 420, 5: 650, 4: 950, 3: 1400, 2: 2050, 1: 3000 };

/** Empfohlene Gehaltsgrenze pro Spieltag (Soft-Cap) – darüber sinkt die Kabinenstimmung */
export function wageCap(tier) {
  return Math.round(TIER_INCOME[tier] * 0.8);
}

export function weeklyWages(state, clubId) {
  return clubPlayers(state, clubId).reduce((s, p) => s + salaryFor(p.ovr), 0);
}

export function matchIncome(tier, isHome, outcome) {
  const base = TIER_INCOME[tier];
  let income = isHome ? base : Math.round(base * 0.45);
  if (outcome === 'W') income += Math.round(base * 0.35);
  if (outcome === 'D') income += Math.round(base * 0.12);
  return income;
}

/** Saisonprämie nach Tabellenplatz */
export function seasonPrize(tier, pos) {
  const base = TIER_INCOME[tier] * 4;
  const factor = [3, 2.4, 2, 1.7, 1.4, 1.2, 1, 0.9, 0.8, 0.7][pos - 1] ?? 0.7;
  return Math.round(base * factor);
}

export const CUP_PRIZES = { 1: 300, 2: 600, 3: 1200, 4: 2500, 5: 5000, 6: 12000 };
export const FINAL_FOUR_PRIZES = { semi: 1500, final: 4000 };
