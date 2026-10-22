import { createGame, openStarterPack, pickDraft, playDay, autoLineup } from '../src/engine/game.js';
import { clubStrength } from '../src/engine/world.js';
import { computeTable } from '../src/engine/schedule.js';
import { extendContract, ensureContract, maxYears } from '../src/engine/contracts.js';
import { weeklyWages, wageCap } from '../src/engine/economy.js';
// Aufruf: node scripts/season_sim.mjs [seed] [passiv]  – ohne „passiv“ verlängert der Manager die Verträge der besten 20
const passive = process.argv[3] === 'passiv';
function manage(s) {
  if (passive) return;
  const squad = s.clubs.user.playerIds.map(id => s.players[id]).sort((a, b) => b.ovr - a.ovr);
  squad.slice(0, 20).forEach(p => {
    const c = ensureContract(s, p);
    if (p.wantsRaise || c.until <= s.season) extendContract(s, p.id, Math.min(2, maxYears(p.age)));
  });
}
const seed = Number(process.argv[2] || 5);
const s = createGame({ seed, clubName: 'Sim FC', primary: '#000', secondary: '#fff' });
openStarterPack(s); pickDraft(s, 0);
for (let season = 1; season <= 10; season++) {
  let coinsStart = s.clubs.user.coins, injuries = 0;
  while (s.season === season) { s.seasonSummary = null; manage(s); const r = playDay(s); if (r) injuries += r.result.injuries.filter(i=>i.side===r.side).length; }
  const h = s.history[0];
  const tiers = [1,2,3,4,5,6].map(t => Math.round(s.leagues[t].clubIds.filter(i=>i!=='user').reduce((a,i)=>a+clubStrength(s,i),0)/s.leagues[t].clubIds.filter(i=>i!=="user").length));
  const n = Object.keys(s.players).length;
  console.log(`S${season} L${h.tier} Platz ${h.pos} ${h.pts}P ${h.promoted?'AUF':''}${h.relegated?'AB':''} FF:${h.ffStage||'-'} Pokal:${h.cup} | Münzen ${coinsStart}->${s.clubs.user.coins} | Team ${clubStrength(s,'user')} Kader ${s.clubs.user.playerIds.length} | Ligen ${tiers.join('/')} | Spieler ${n} | Verl. ${injuries} | Gehalt ${weeklyWages(s,'user')}/${wageCap(s.clubs.user.tier)}`);
}
