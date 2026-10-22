import { createRng } from '../../src/engine/rng.js';
import { createWorld, clubStrength } from '../../src/engine/world.js';
import { aiSetup } from '../../src/engine/ai.js';
import { buildTeam, simulateMatch } from '../../src/engine/match.js';
const rng = createRng(42);
const state = { rng: 1, nextId: 1 };
createWorld(rng, state, { name: 'Test FC', primary: '#000', secondary: '#fff' });
const ids = Object.keys(state.clubs).filter(id => id !== 'user');
let hw=0, d=0, aw=0, goals=0, n=0, strongWins=0, strongN=0;
const byGap = {};
for (let i=0;i<6000;i++){
  const a = rng.pick(ids), b = rng.pick(ids); if (a===b) continue;
  if (Math.abs(state.clubs[a].tier - state.clubs[b].tier) > 1) continue;
  const h = buildTeam(state, a, aiSetup(rng, state, a)); const w = buildTeam(state, b, aiSetup(rng, state, b));
  const r = simulateMatch(rng, h, w, {});
  n++; goals += r.hg + r.ag; if (r.hg>r.ag) hw++; else if (r.hg===r.ag) d++; else aw++;
  const gap = Math.round((clubStrength(state,a)-clubStrength(state,b))/2)*2;
  byGap[gap] = byGap[gap] || {n:0,w:0,d:0}; byGap[gap].n++; if (r.hg>r.ag) byGap[gap].w++; else if (r.hg===r.ag) byGap[gap].d++;
}
console.log('matches', n, 'goals/match', (goals/n).toFixed(2), 'home', (hw/n*100).toFixed(0), 'draw', (d/n*100).toFixed(0), 'away', (aw/n*100).toFixed(0));
for (const g of Object.keys(byGap).map(Number).sort((a,b)=>a-b)) if (byGap[g].n>40) console.log('gap', g, 'n', byGap[g].n, 'homeWin%', (byGap[g].w/byGap[g].n*100).toFixed(0), 'draw%', (byGap[g].d/byGap[g].n*100).toFixed(0));
for (let t=1;t<=6;t++) console.log('tier',t, state.leagues[t].clubIds.filter(i=>i!=='user').map(i=>clubStrength(state,i)).join(' '));
