// =============================================================================
// Starting XI TCG — Economy, Salaries & Sponsor Engine
// =============================================================================

/**
 * Berechnet das Spieltagsgehalt eines Spielers basierend auf seinem OVR
 */
export function calculatePlayerSalary(ovr) {
  const safeOvr = Math.max(50, Math.min(95, ovr || 60));
  // Exponentielle Gehaltskurve
  return Math.round(25 * Math.pow(1.075, safeOvr - 55));
}

/**
 * Berechnet die wöchentliche Finanzbilanz des Vereins
 */
export function calculateMatchdayFinances(club, matchResult = null, isHome = false) {
  const squad = club.squad || [];
  
  // Gehälter berechnen (unter Berücksichtigung von aktiven Gehaltssubventionen)
  let totalSalaries = 0;
  squad.forEach(player => {
    let sal = calculatePlayerSalary(player.ovr);
    if (player.contractDiscountUntilMatch && player.contractDiscountUntilMatch >= club.currentMatchday) {
      sal = Math.round(sal * 0.5); // 50% Rabatt durch Gold-Vertrag
    }
    totalSalaries += sal;
  });

  // Einnahmen
  let sponsorBase = 500;
  let sponsorBonus = 0;
  let ticketRevenue = isHome ? Math.floor(800 + Math.random() * 350) : 0;
  let matchPrize = 0;

  if (matchResult === 'WIN') {
    sponsorBonus = 250;
    matchPrize = 300;
  } else if (matchResult === 'DRAW') {
    sponsorBonus = 50;
    matchPrize = 100;
  } else if (matchResult === 'LOSS') {
    matchPrize = 25;
  }

  const totalIncome = sponsorBase + sponsorBonus + ticketRevenue + matchPrize;
  const netProfit = totalIncome - totalSalaries;

  return {
    totalSalaries,
    sponsorBase,
    sponsorBonus,
    ticketRevenue,
    matchPrize,
    totalIncome,
    netProfit
  };
}
