import { createGame, openStarterPack, pickDraft, playDay, autoLineup } from '../src/engine/game.js';
import { clubStrength } from '../src/engine/world.js';
import { computeTable } from '../src/engine/schedule.js';
const seed = Number(process.argv[2] || 5);
const s = createGame({ seed, clubName: 'Sim FC', primary: '#000', secondary: '#fff' });
openStarterPack(s); pickDraft(s, 0);
for (let season = 1; season <= 10; season++) {
  let coinsStart = s.clubs.user.coins, injuries = 0;
  while (s.season === season) { s.seasonSummary = null; const r = playDay(s); if (r) injuries += r.result.injuries.filter(i=>i.side===r.side).length; }
  const h = s.history[0];
  const tiers = [1,2,3,4,5,6].map(t => Math.round(s.leagues[t].clubIds.filter(i=>i!=='user').reduce((a,i)=>a+clubStrength(s,i),0)/s.leagues[t].clubIds.filter(i=>i!=="user").length));
  const n = Object.keys(s.players).length;
  console.log(`S${season} L${h.tier} Platz ${h.pos} ${h.pts}P ${h.promoted?'AUF':''}${h.relegated?'AB':''} FF:${h.ffStage||'-'} Pokal:${h.cup} | Münzen ${coinsStart}->${s.clubs.user.coins} | Team ${clubStrength(s,'user')} Kader ${s.clubs.user.playerIds.length} | Ligen ${tiers.join('/')} | Spieler ${n} | Verl. ${injuries}`);
}
