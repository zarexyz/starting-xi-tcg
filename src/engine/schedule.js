// =============================================================================
// Starting XI TCG — Schedule & Final Four Tournament Engine
// =============================================================================

/**
 * Erzeugt einen fairen Round-Robin Spielplan (10 Teams = 9 Spieltage Hinrunde + 9 Spieltage Rückrunde)
 */
export function generateLeagueSchedule(clubs) {
  const n = clubs.length;
  if (n % 2 !== 0) throw new Error('League requires even number of clubs');

  const rounds = [];
  const teamList = [...clubs];

  // Berger-Tables / Polygon-Methode für 9 Spieltage
  for (let r = 0; r < n - 1; r++) {
    const matchdayMatches = [];
    for (let i = 0; i < n / 2; i++) {
      const home = teamList[i];
      const away = teamList[n - 1 - i];

      // Heimrecht abwechseln
      if (r % 2 === 1) {
        matchdayMatches.push({ homeId: away.id, awayId: home.id, homeScore: null, awayScore: null, played: false });
      } else {
        matchdayMatches.push({ homeId: home.id, awayId: away.id, homeScore: null, awayScore: null, played: false });
      }
    }
    rounds.push(matchdayMatches);

    // Rotation (Team 0 bleibt fest, Rest rotiert im Uhrzeigersinn)
    const fixed = teamList[0];
    const rotating = teamList.slice(1);
    rotating.unshift(rotating.pop());
    teamList.splice(0, teamList.length, fixed, ...rotating);
  }

  // Rückrunde (gespiegelte Heim-/Auswärtsrechte)
  const fullSeason = [];
  rounds.forEach((mDay, idx) => {
    fullSeason.push({
      matchday: idx + 1,
      matches: mDay
    });
  });

  rounds.forEach((mDay, idx) => {
    const reversed = mDay.map(m => ({
      homeId: m.awayId,
      awayId: m.homeId,
      homeScore: null,
      awayScore: null,
      played: false
    }));
    fullSeason.push({
      matchday: idx + 10,
      matches: reversed
    });
  });

  return fullSeason;
}

/**
 * Sortiert die Liga-Tabelle nach Punkten, Tordifferenz, erzielten Toren
 */
export function computeLeagueTable(clubs) {
  return [...clubs].sort((a, b) => {
    if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
    const diffA = a.stats.gf - a.stats.ga;
    const diffB = b.stats.gf - b.stats.ga;
    if (diffB !== diffA) return diffB - diffA;
    return b.stats.gf - a.stats.gf;
  });
}

/**
 * Erzeugt das Final-Four Playoff-Bracket aus den Plätzen 1 bis 4 der Tabelle
 */
export function generateFinalFourBracket(sortedClubs, leagueTier) {
  const c1 = sortedClubs[0];
  const c2 = sortedClubs[1];
  const c3 = sortedClubs[2];
  const c4 = sortedClubs[3];

  return {
    leagueTier,
    status: 'SEMIFINALS', // 'SEMIFINALS' | 'FINAL' | 'COMPLETED'
    semiA: {
      team1: c1,
      team2: c4,
      score1: null,
      score2: null,
      winner: null,
      penalties: false
    },
    semiB: {
      team1: c2,
      team2: c3,
      score1: null,
      score2: null,
      winner: null,
      penalties: false
    },
    final: {
      team1: null,
      team2: null,
      score1: null,
      score2: null,
      winner: null,
      penalties: false
    },
    promotedTeams: [] // Beide Halbfinalsieger steigen auf (in Ligen 6–2)
  };
}
