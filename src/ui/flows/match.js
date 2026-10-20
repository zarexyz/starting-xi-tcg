// =============================================================================
// Live-Match: Ticker plus große Karten-Einblendungen bei Schlüsselszenen.
// Das Ergebnis steht beim Anpfiff fest – die Animation erzählt es nach.
// =============================================================================

import { crestSvg } from '../components/crest.js';
import { cardHtml } from '../components/card.js';
import { icon } from '../icons.js';
import { esc } from '../html.js';
import { playSound } from '../sound.js';

const TICK_ICON = { goal: 'ball', chance: 'target', tackle: 'shield', injury: 'medical', sub: 'swap', half: 'whistle', end: 'whistle', kickoff: 'whistle', pens: 'target' };

export function matchFlow(game, flow) {
  const r = flow.data.result;
  const home = game.clubs[r.homeId];
  const away = game.clubs[r.awayId];
  return `<div class="fullscreen matchflow"><main class="screen screen--bare">
    <header class="scoreboard" style="--home:${home.colors.primary};--away:${away.colors.primary}">
      <div class="scoreboard__team">${crestSvg(home, 44)}<span>${esc(home.short)}</span></div>
      <div class="scoreboard__mid">
        <div class="scoreboard__score display" id="sb-score">0:0</div>
        <div class="scoreboard__min" id="sb-min">0'</div>
      </div>
      <div class="scoreboard__team">${crestSvg(away, 44)}<span>${esc(away.short)}</span></div>
    </header>
    <div class="timeline" aria-hidden="true"><span id="mf-progress"></span><i style="left:50%"></i></div>
    <ol class="ticker" id="mf-ticker" aria-live="polite"></ol>
    <div class="matchflow__controls" id="mf-controls">
      <button class="btn btn--sm btn--secondary" data-action="match-speed" id="mf-speed">${icon('forward')}Schneller</button>
      <button class="btn btn--sm btn--ghost" data-action="match-skip">Zum Ergebnis</button>
    </div>
    <div id="mf-scene"></div>
  </main></div>`;
}

// -----------------------------------------------------------------------------
// Steuerung
// -----------------------------------------------------------------------------

let ctrl = null;

const DURATION = { slow: 46000, normal: 30000, fast: 16000 };

export function startMatch(game, flow, settings, onDone) {
  stopMatch();
  const r = flow.data.result;
  const side = flow.data.side;
  const ticker = [...r.ticker];
  const scenes = [...r.keyScenes];
  const state = {
    minute: 0,
    tickIdx: 0,
    sceneIdx: 0,
    paused: false,
    speedMul: 1,
    score: [0, 0],
    done: false,
    timer: null
  };
  ctrl = state;
  const total = DURATION[settings.speed] || DURATION.normal;
  const stepMs = 100;
  const minPerStep = 90 / (total / stepMs);

  const $ = id => document.getElementById(id);

  function addTick(t) {
    const list = $('mf-ticker');
    if (!list) return;
    const sideCls = t.side === 'home' ? 'tick--home' : t.side === 'away' ? 'tick--away' : 'tick--neutral';
    const mine = t.side === side;
    const li = document.createElement('li');
    li.className = `tick tick--${t.type} ${sideCls} ${mine ? 'tick--mine' : ''}`;
    li.innerHTML = `<span class="tick__min">${t.minute > 90 ? '90+' : t.minute}'</span><span class="tick__icon">${icon(TICK_ICON[t.type] || 'info')}</span><span class="tick__text">${esc(t.text)}</span>`;
    list.prepend(li);
    if (t.type === 'goal') {
      state.score = t.score;
      const sc = $('sb-score');
      if (sc) { sc.textContent = `${t.score[0]}:${t.score[1]}`; sc.classList.remove('bump'); void sc.offsetWidth; sc.classList.add('bump'); }
      playSound(mine ? 'goal' : 'goalAgainst', settings);
    }
    if (t.type === 'half' || t.type === 'end') playSound('whistle', settings);
  }

  function showScene(scene) {
    state.paused = true;
    const el = $('mf-scene');
    if (!el) return;
    const att = game.players[scene.attackerId] || flow.data.snapshot?.[scene.attackerId];
    const def = game.players[scene.defenderId] || flow.data.snapshot?.[scene.defenderId];
    const keeper = game.players[scene.keeperId] || flow.data.snapshot?.[scene.keeperId];
    const attClub = game.clubs[scene.side === 'home' ? r.homeId : r.awayId];
    const defClub = game.clubs[scene.side === 'home' ? r.awayId : r.homeId];
    const mine = scene.side === side;
    const stamp = scene.outcome === 'GOAL' ? 'Tor!' : scene.outcome === 'SAVE' ? 'Gehalten' : 'Abgewehrt';
    const phases = scene.phases.map((ph, i) => `
      <div class="phase ${ph.skipped ? 'is-skipped' : ''}" style="--delay:${400 + i * 900}ms">
        <div class="phase__head"><b>${ph.label}</b><span>${ph.skipped ? 'kam nicht dazu' : `${ph.chance} % Chance`}</span></div>
        <div class="phase__duel">
          <span>${esc(ph.att.label)} <b>${ph.att.value}</b></span>
          <span class="phase__bar"><span style="--w:${ph.skipped ? 0 : ph.chance}%"></span></span>
          <span><b>${ph.def.value}</b> ${esc(i === 1 && keeper ? keeper.last : ph.def.label)}</span>
        </div>
        ${ph.skipped ? '' : `<span class="phase__res ${ph.success ? 'is-win' : 'is-loss'}">${icon(ph.success ? 'check' : 'close')}</span>`}
      </div>`).join('');
    el.innerHTML = `<div class="scene ${mine ? 'scene--mine' : 'scene--theirs'} scene--${scene.outcome.toLowerCase()}" data-action="scene-continue" role="dialog" aria-label="Schlüsselszene">
      <div class="scene__min display">${scene.minute}'</div>
      <div class="scene__cards">
        <div class="scene__card scene__card--att">${att ? cardHtml(att, { size: 'sm', colors: attClub.colors }) : ''}</div>
        <div class="scene__vs display">vs</div>
        <div class="scene__card scene__card--def">${def ? cardHtml(def, { size: 'sm', colors: defClub.colors }) : ''}</div>
      </div>
      <div class="scene__phases">${phases}</div>
      <div class="scene__stamp display">${stamp}</div>
      <p class="scene__tap small">Tippen zum Weiterspielen</p>
      <button class="btn btn--sm btn--ghost scene__skip" data-action="match-skip">Zum Ergebnis</button>
    </div>`;
    playSound('card', settings);
    clearTimeout(state.sceneTimer);
    state.sceneTimer = setTimeout(() => continueAfterScene(), Math.max(1600, 3600 / state.speedMul));
  }

  function continueAfterScene() {
    clearTimeout(state.sceneTimer);
    const el = $('mf-scene');
    if (el) el.innerHTML = '';
    state.paused = false;
  }
  state.continueAfterScene = continueAfterScene;

  function finish() {
    if (state.done) return;
    state.done = true;
    clearInterval(state.timer);
    while (state.tickIdx < ticker.length) addTick(ticker[state.tickIdx++]);
    const sc = $('sb-score');
    if (sc) sc.textContent = `${r.hg}:${r.ag}${r.pens ? ` (${r.pens.h}:${r.pens.a})` : ''}`;
    const mn = $('sb-min');
    if (mn) mn.textContent = 'Ende';
    const pr = $('mf-progress');
    if (pr) pr.style.width = '100%';
    const c = $('mf-controls');
    if (c) c.innerHTML = `<button class="btn btn--primary btn--block" data-action="match-report">${icon('list')}Spielbericht</button>`;
    continueAfterScene();
  }
  state.finish = finish;

  state.timer = setInterval(() => {
    if (state.paused || state.done) return;
    state.minute += minPerStep * state.speedMul;
    const m = Math.min(93, state.minute);
    while (state.tickIdx < ticker.length && ticker[state.tickIdx].minute <= m && ticker[state.tickIdx].type !== 'end' && ticker[state.tickIdx].type !== 'pens') {
      const t = ticker[state.tickIdx];
      // Schlüsselszene vor dem passenden Tickereintrag zeigen
      if (state.sceneIdx < scenes.length && scenes[state.sceneIdx].minute <= t.minute) {
        showScene(scenes[state.sceneIdx++]);
        return;
      }
      addTick(t);
      state.tickIdx++;
    }
    if (state.sceneIdx < scenes.length && scenes[state.sceneIdx].minute <= m) {
      showScene(scenes[state.sceneIdx++]);
      return;
    }
    const mn = $('sb-min');
    if (mn) mn.textContent = `${Math.min(90, Math.floor(m))}'`;
    const pr = $('mf-progress');
    if (pr) pr.style.width = `${Math.min(100, (m / 90) * 100)}%`;
    if (state.minute >= 93) finish();
  }, stepMs);

  void onDone;
  playSound('whistle', settings);
}

export function stopMatch() {
  if (ctrl) {
    clearInterval(ctrl.timer);
    clearTimeout(ctrl.sceneTimer);
  }
  ctrl = null;
}

export function matchControl(action) {
  if (!ctrl) return;
  if (action === 'speed') {
    ctrl.speedMul = ctrl.speedMul === 1 ? 3 : 1;
    const b = document.getElementById('mf-speed');
    if (b) b.setAttribute('aria-pressed', ctrl.speedMul > 1);
  }
  if (action === 'skip') ctrl.finish();
  if (action === 'continue') ctrl.continueAfterScene();
}
