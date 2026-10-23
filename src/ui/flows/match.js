// =============================================================================
// Live-Match: Ticker plus große Karten-Einblendungen bei Schlüsselszenen.
// Das Ergebnis steht beim Anpfiff fest – die Animation erzählt es nach.
// =============================================================================

import { crestSvg } from '../components/crest.js';
import { cardHtml } from '../components/card.js';
import { icon } from '../icons.js';
import { esc } from '../html.js';
import { playSound } from '../sound.js';
import { t } from '../../i18n/index.js';
import { txt } from '../text.js';
import { STYLES, STYLE_KEYS } from '../../engine/constants.js';

const TICK_ICON = { goal: 'ball', chance: 'target', tackle: 'shield', injury: 'medical', sub: 'swap', half: 'whistle', end: 'whistle', kickoff: 'whistle', pens: 'target' };
const tickIcon = type => type === 'yellow' ? '<i class="yellowcard"></i>' : type === 'red' ? '<i class="redcard"></i>' : icon(TICK_ICON[type] || 'info');

/** Kurzes Vibrieren auf dem Handy (falls erlaubt) */
function buzz(pattern) {
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch { /* egal */ }
}

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
      <button class="btn btn--sm btn--secondary" data-action="match-speed" id="mf-speed">${icon('forward')}${t('mf.faster')}</button>
      <button class="btn btn--sm btn--ghost" data-action="match-skip">${t('mf.skip')}</button>
    </div>
    <div id="mf-scene"></div>
  </main></div>`;
}

// -----------------------------------------------------------------------------
// Steuerung
// -----------------------------------------------------------------------------

let ctrl = null;

const DURATION = { slow: 46000, normal: 30000, fast: 16000 };

export function startMatch(game, flow, settings, hooks = {}) {
  stopMatch();
  // Mit Halbzeit: zuerst läuft die Vorschau (erste Hälfte ist identisch mit dem echten Spiel).
  // Zur Pause wird entschieden, dann kommt das echte Ergebnis per hooks.commit(decision).
  let r = flow.data.result;
  const side = flow.data.side;
  let ticker = [...r.ticker];
  let scenes = [...r.keyScenes];
  const state = {
    minute: 0,
    tickIdx: 0,
    sceneIdx: 0,
    paused: false,
    speedMul: 1,
    score: [0, 0],
    done: false,
    timer: null,
    phase: flow.data.preview && hooks.commit ? 'first' : 'full'
  };
  ctrl = state;
  const total = DURATION[settings.speed] || DURATION.normal;
  const stepMs = 100;
  const minPerStep = 90 / (total / stepMs);

  const $ = id => document.getElementById(id);

  function addTick(tk) {
    const list = $('mf-ticker');
    if (!list) return;
    const sideCls = tk.side === 'home' ? 'tick--home' : tk.side === 'away' ? 'tick--away' : 'tick--neutral';
    const mine = tk.side === side;
    const li = document.createElement('li');
    li.className = `tick tick--${tk.type} ${sideCls} ${mine ? 'tick--mine' : ''}`;
    li.innerHTML = `<span class="tick__min">${tk.minute > 90 ? '90+' : tk.minute}'</span><span class="tick__icon">${tickIcon(tk.type)}</span><span class="tick__text">${esc(txt(tk))}</span>`;
    list.prepend(li);
    if (tk.type === 'goal' && (state.score[0] !== tk.score[0] || state.score[1] !== tk.score[1])) {
      setScore(tk.score, mine);
    }
    if (tk.type === 'red' && mine) buzz(80);
    if (tk.type === 'half' || tk.type === 'end') playSound('whistle', settings);
  }

  function setScore(score, mine) {
    state.score = score;
    const sc = $('sb-score');
    if (state.done) return;
    if (sc) { sc.textContent = `${score[0]}:${score[1]}`; sc.classList.remove('bump'); void sc.offsetWidth; sc.classList.add('bump'); }
    playSound(mine ? 'goal' : 'goalAgainst', settings);
    if (mine) buzz([60, 40, 140]);
  }

  /** Schlüsselszene in Stufen: wer greift an → Durchbruch → Abschluss → Ergebnis. Weiter per Tippen. */
  function showScene(scene) {
    state.paused = true;
    const el = $('mf-scene');
    if (!el) return;
    const snap = id => game.players[id] || flow.data.snapshot?.[id];
    const att = snap(scene.attackerId);
    const def = snap(scene.defenderId);
    const keeper = snap(scene.keeperId);
    const attClub = game.clubs[scene.side === 'home' ? r.homeId : r.awayId];
    const defClub = game.clubs[scene.side === 'home' ? r.awayId : r.homeId];
    const mine = scene.side === side;
    const stamp = scene.outcome === 'GOAL' ? t('mf.goal') : scene.outcome === 'SAVE' ? t('mf.saved') : t('mf.blocked');
    const [p1, p2] = scene.phases;
    const phaseHtml = (ph, n, defName) => `
      <div class="phase phase--${n} ${ph.skipped ? 'is-skipped' : ''}">
        <div class="phase__head"><b>${n === 1 ? t('phase.break') : t('phase.finish')}</b><span>${ph.skipped ? t('mf.skipped') : t('mf.chance', { n: ph.chance })}</span></div>
        <div class="phase__duel">
          <span>${esc(t(ph.att.label))} <b>${ph.att.value}</b></span>
          <span class="phase__bar"><span style="--w:${ph.skipped ? 0 : ph.chance}%"></span></span>
          <span><b>${ph.def.value}</b> ${esc(defName)}</span>
        </div>
        ${ph.skipped ? '' : `<span class="phase__res ${ph.success ? 'is-win' : 'is-loss'}">${icon(ph.success ? 'check' : 'close')}</span>`}
      </div>`;
    el.innerHTML = `<div class="scene ${mine ? 'scene--mine' : 'scene--theirs'} scene--${scene.outcome.toLowerCase()}" data-action="scene-continue" role="dialog" aria-label="${t('mf.scene')}">
      <div class="scene__head" style="--club:${attClub.colors.primary}">
        <span class="scene__min display">${scene.minute}'</span>
        <div class="scene__attack">
          ${crestSvg(attClub, 34)}
          <span class="scene__arrow">${icon('arrowRight')}</span>
          ${crestSvg(defClub, 34)}
        </div>
        <div class="scene__who">${t('mf.attacks', { club: `<b>${esc(attClub.name)}</b>` })}</div>
        <span class="scene__tag">${mine ? t('mf.yourTeam') : t('mf.opponent')}</span>
      </div>
      <div class="scene__cards">
        <div class="scene__card scene__card--att">${att ? cardHtml(att, { size: 'sm', colors: attClub.colors }) : ''}</div>
        <div class="scene__vs display">vs</div>
        <div class="scene__card scene__card--def">
          <div class="scene__def">${def ? cardHtml(def, { size: 'sm', colors: defClub.colors }) : ''}</div>
          <div class="scene__keeper">${keeper ? cardHtml(keeper, { size: 'sm', colors: defClub.colors }) : ''}</div>
        </div>
      </div>
      <div class="scene__phases">
        ${phaseHtml(p1, 1, def ? def.last : p1.def.label)}
        ${phaseHtml(p2, 2, keeper ? keeper.last : p2.def.label)}
      </div>
      <div class="scene__stamp display">${stamp}</div>
      <p class="scene__tap small">${t('mf.tapContinue')}</p>
      <button class="btn btn--sm btn--ghost scene__skip" data-action="match-skip">${t('mf.skip')}</button>
    </div>`;
    playSound('card', settings);
    const node = el.firstElementChild;
    const f = state.speedMul > 1 ? 0.45 : 1;
    const steps = [
      [1200, 's1'],
      [2800, 's2'],
      ...(p2.skipped ? [] : [[4400, 's3'], [6000, 's4']]),
      [p2.skipped ? 4200 : 7400, 's5']
    ];
    scene.revealed = false;
    clearTimeout(state.sceneTimer);
    state.sceneTimers = steps.map(([ms, cls]) => setTimeout(() => stage(node, cls, scene, mine), ms * f));
    state.currentScene = { node, scene, mine };
  }

  function stage(node, cls, scene, mine) {
    node.classList.add(cls);
    if (cls === 's5') {
      scene.revealed = true;
      if (scene.outcome === 'GOAL') {
        // Stand aus dem Ticker übernehmen (gleiche Minute und Seite), nie hochzählen: sonst doppelt
        const gt = ticker.find(x => x.type === 'goal' && x.side === scene.side && x.minute === scene.minute);
        let s = gt ? [...gt.score] : [...state.score];
        if (!gt) s[scene.side === 'home' ? 0 : 1]++;
        s = [Math.max(s[0], state.score[0]), Math.max(s[1], state.score[1])];
        if (s[0] !== state.score[0] || s[1] !== state.score[1]) setScore(s, mine);
      } else if (mine) {
        buzz(30);
      }
      if (settings.autoScenes) state.sceneTimer = setTimeout(() => continueAfterScene(), 8000 / state.speedMul);
    }
  }

  /** Elfmeterschießen: Schuss für Schuss mit Zwischenstand */
  function showPens() {
    state.paused = true;
    state.inPens = true;
    const el = $('mf-scene');
    const kicks = r.pens.kicks;
    if (!el || !kicks?.length) { finish(); return; }
    const home = game.clubs[r.homeId];
    const away = game.clubs[r.awayId];
    const perSide = Math.max(5, Math.ceil(kicks.length / 2));
    const row = (club, key) => `<div class="pens__row">
      ${crestSvg(club, 28)}<span class="pens__name">${esc(club.short)}</span>
      <span class="pens__dots">${Array.from({ length: perSide }, (_, i) => `<i class="pens__dot" data-k="${key}${i}"></i>`).join('')}</span>
    </div>`;
    el.innerHTML = `<div class="scene scene--pens" data-action="scene-continue" role="dialog" aria-label="${t('mf.pens')}">
      <div class="pens__title display">${t('mf.pens')}</div>
      <div class="pens__score display" id="pen-score">0:0</div>
      <div class="pens__board">${row(home, 'h')}${row(away, 'a')}</div>
      <div class="pens__kick" id="pen-kick"></div>
      <p class="scene__tap small" id="pen-tap">${t('mf.nextKick')}</p>
      <button class="btn btn--sm btn--ghost scene__skip" data-action="match-skip">${t('mf.skip')}</button>
    </div>`;
    playSound('whistle', settings);
    const counts = { home: 0, away: 0 };
    let idx = 0;
    const f = state.speedMul > 1 ? 0.5 : 1;
    let pending = null;
    const reveal = () => {
      clearTimeout(state.penTimer);
      const k = pending;
      pending = null;
      if (!k) return;
      const dot = el.querySelector(`[data-k="${k.side === 'home' ? 'h' : 'a'}${counts[k.side]}"]`);
      counts[k.side]++;
      if (dot) dot.classList.add(k.scored ? 'is-in' : 'is-out');
      const sc = $('pen-score');
      if (sc) { sc.textContent = `${k.score[0]}:${k.score[1]}`; sc.classList.remove('bump'); void sc.offsetWidth; sc.classList.add('bump'); }
      $('pen-kick')?.classList.add('is-done');
      const mine = k.side === side;
      if (k.scored) playSound(mine ? 'goal' : 'goalAgainst', settings);
      else playSound('card', settings);
      if (mine && k.scored) buzz(50);
      state.penTimer = setTimeout(shoot, 1500 * f);
    };
    const shoot = () => {
      clearTimeout(state.penTimer);
      if (idx >= kicks.length) { endPens(); return; }
      const k = kicks[idx++];
      const takerClub = k.side === 'home' ? home : away;
      const keeperClub = k.side === 'home' ? away : home;
      const taker = game.players[k.takerId] || flow.data.snapshot?.[k.takerId];
      const keeper = game.players[k.keeperId] || flow.data.snapshot?.[k.keeperId];
      const box = $('pen-kick');
      if (box) {
        box.classList.remove('is-done');
        box.innerHTML = `<div class="pens__duel">
            <div class="pens__card">${taker ? cardHtml(taker, { size: 'sm', colors: takerClub.colors }) : ''}</div>
            <div class="pens__vs display">vs</div>
            <div class="pens__card">${keeper ? cardHtml(keeper, { size: 'sm', colors: keeperClub.colors }) : ''}</div>
          </div>
          <div class="pens__result display ${k.scored ? 'is-in' : 'is-out'}">${k.scored ? t('mf.in') : t('mf.saved')}</div>`;
      }
      pending = k;
      state.penTimer = setTimeout(reveal, 900 * f);
    };
    const endPens = () => {
      state.pensDone = true;
      const sc = $('pen-score');
      if (sc) sc.textContent = `${r.pens.h}:${r.pens.a}`;
      const won = (side === 'home') === (r.pens.h > r.pens.a);
      const tap = $('pen-tap');
      if (tap) tap.textContent = t('mf.toReport');
      const box = $('pen-kick');
      if (box) box.innerHTML = `<div class="pens__final display ${won ? 'is-in' : 'is-out'}">${won ? t('mf.won') : t('mf.out')}</div>`;
      if (won) buzz([60, 40, 160]);
    };
    state.penNext = () => { if (state.pensDone) finish(); else if (pending) reveal(); else shoot(); };
    state.penTimer = setTimeout(shoot, 700 * f);
  }

  /** Tippen: erst alles aufdecken, beim zweiten Mal weiter */
  function tapScene() {
    if (state.inPens) { state.penNext(); return; }
    const cur = state.currentScene;
    if (cur && !cur.scene.revealed) {
      (state.sceneTimers || []).forEach(clearTimeout);
      for (const cls of ['s1', 's2', ...(cur.scene.phases[1].skipped ? [] : ['s3', 's4'])]) cur.node.classList.add(cls);
      stage(cur.node, 's5', cur.scene, cur.mine);
      cur.node.classList.add('is-instant');
      return;
    }
    continueAfterScene();
  }
  state.tapScene = tapScene;

  function continueAfterScene() {
    clearTimeout(state.sceneTimer);
    (state.sceneTimers || []).forEach(clearTimeout);
    state.currentScene = null;
    const el = $('mf-scene');
    if (el) el.innerHTML = '';
    state.paused = false;
  }
  state.continueAfterScene = continueAfterScene;

  /** Echtes Ergebnis holen und die zweite Hälfte daraus abspielen */
  function commit(decision) {
    if (state.phase !== 'first') return true;
    const data = hooks.commit(decision);
    if (!data) return false;
    r = data.result;
    ticker = [...r.ticker];
    scenes = [...r.keyScenes];
    // Die erste Hälfte ist in beiden Tickern gleich, also passt der Index weiter
    state.sceneIdx = scenes.findIndex(s => s.minute >= 46);
    if (state.sceneIdx < 0) state.sceneIdx = scenes.length;
    state.phase = 'full';
    return true;
  }

  /** Halbzeitpause: Stil, Ansage, Wechsel */
  function showHalftime() {
    state.paused = true;
    const el = $('mf-scene');
    if (!el) { commit(null); state.paused = false; return; }
    const mine = side === 'home' ? 0 : 1;
    const diff = state.score[mine] - state.score[1 - mine];
    const tip = diff < 0 ? t('ht.tipBehind') : diff > 0 ? t('ht.tipAhead') : t('ht.tipLevel');
    const setup = game.user.setup || { lineup: {}, bench: [] };
    const gone = new Set([
      ...r.subs.filter(x => x.side === side && x.minute < 46).map(x => x.outId),
      ...r.cards.filter(x => x.side === side && x.type !== 'Y' && x.minute < 46).map(x => x.playerId),
      ...r.injuries.filter(x => x.side === side && x.minute < 46).map(x => x.playerId)
    ]);
    const usedIn = new Set(r.subs.filter(x => x.side === side && x.minute < 46).map(x => x.inId));
    const onPitch = [...r.lineups[side].map(l => l.playerId), ...usedIn].filter(id => id && !gone.has(id));
    const bench = (setup.bench || []).filter(id => !usedIn.has(id) && game.players[id] && !game.players[id].injury);
    const nm = id => { const p = game.players[id] || flow.data.snapshot?.[id]; return p ? esc(`${p.last} (${p.position})`) : '?'; };
    const cur = r.styles[mine];
    const dec = { style: null, mode: null, subs: [] };
    const subRow = i => `<div class="ht__sub">
        <select data-ht-out="${i}" aria-label="${t('ht.out')}"><option value="">${t('ht.out')}</option>${onPitch.map(id => `<option value="${id}">${nm(id)}</option>`).join('')}</select>
        <span aria-hidden="true">${icon('swap')}</span>
        <select data-ht-in="${i}" aria-label="${t('ht.in')}"><option value="">${t('ht.in')}</option>${bench.map(id => `<option value="${id}">${nm(id)}</option>`).join('')}</select>
      </div>`;
    el.innerHTML = `<div class="scene scene--ht" role="dialog" aria-label="${t('ht.title')}">
      <div class="ht__head"><div class="ht__title display">${t('ht.title')}</div><div class="ht__score display">${state.score[0]}:${state.score[1]}</div></div>
      <p class="small ht__tip">${icon('clipboard')}<span>${tip}</span></p>
      <div class="ht__block"><div class="small"><b>${t('ht.style')}</b></div>
        <div class="ht__chips">${STYLE_KEYS.map(k => `<button class="chip chip--btn ${k === cur ? 'is-active' : ''}" data-ht-style="${k}" aria-pressed="${k === cur}">${STYLES[k].name}</button>`).join('')}</div></div>
      <div class="ht__block"><div class="small"><b>${t('ht.mode')}</b></div>
        <div class="ht__chips">${['', 'allOut', 'hold'].map(k => `<button class="chip chip--btn ${k === '' ? 'is-active' : ''}" data-ht-mode="${k}" aria-pressed="${k === ''}">${t('ht.mode.' + (k || 'none'))}</button>`).join('')}</div>
        <p class="xsmall muted">${t('ht.modeHint')}</p></div>
      ${bench.length && onPitch.length ? `<div class="ht__block"><div class="small"><b>${t('ht.subs')}</b></div>${[0, 1, 2].map(subRow).join('')}</div>` : ''}
      <button class="btn btn--primary btn--block" data-ht-go="1">${icon('play')}${t('ht.go')}</button>
    </div>`;
    const node = el.firstElementChild;
    const press = (sel, attr, val) => node.querySelectorAll(sel).forEach(b => { const on = b.getAttribute(attr) === val; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', on); });
    node.addEventListener('click', ev => {
      const b = ev.target.closest('button');
      if (!b) return;
      ev.stopPropagation();
      if (b.dataset.htStyle) { dec.style = b.dataset.htStyle === r.styles[mine] ? null : b.dataset.htStyle; press('[data-ht-style]', 'data-ht-style', b.dataset.htStyle); }
      else if (b.hasAttribute('data-ht-mode')) { dec.mode = b.dataset.htMode || null; press('[data-ht-mode]', 'data-ht-mode', b.dataset.htMode); }
      else if (b.dataset.htGo) {
        const subs = [0, 1, 2].map(i => ({ outId: node.querySelector(`[data-ht-out="${i}"]`)?.value, inId: node.querySelector(`[data-ht-in="${i}"]`)?.value }))
          .filter(x => x.outId && x.inId);
        const decision = { style: dec.style, mode: dec.mode, subs };
        const any = decision.style || decision.mode || subs.length;
        if (!commit(any ? decision : null)) { finish(); return; }
        el.innerHTML = '';
        playSound('whistle', settings);
        state.paused = false;
      }
    });
  }

  function finish() {
    if (state.done) return;
    if (state.phase === 'first') commit(null);
    state.done = true;
    state.inPens = false;
    clearTimeout(state.penTimer);
    clearInterval(state.timer);
    while (state.tickIdx < ticker.length) addTick(ticker[state.tickIdx++]);
    // Absicherung: Torzahl im Ticker muss zum Endstand passen, sonst Ticker komplett neu aufbauen
    const list = $('mf-ticker');
    if (list && list.querySelectorAll('.tick--goal').length !== r.hg + r.ag) {
      console.warn('[match] Torzahl im Ticker weicht ab', list.querySelectorAll('.tick--goal').length, r.hg + r.ag);
      list.innerHTML = '';
      const keep = state.score;
      ticker.forEach(tk => addTick(tk));
      state.score = keep;
    }
    const sc = $('sb-score');
    if (sc) sc.innerHTML = `${r.hg}:${r.ag}${r.pens ? `<small class="scoreboard__pens">${r.pens.h}:${r.pens.a} ${t('w.pens')}</small>` : ''}`;
    const mn = $('sb-min');
    if (mn) mn.textContent = t('mf.end');
    const pr = $('mf-progress');
    if (pr) pr.style.width = '100%';
    const c = $('mf-controls');
    if (c) c.innerHTML = `<button class="btn btn--primary btn--block" data-action="match-report">${icon('list')}${t('mf.report')}</button>`;
    continueAfterScene();
  }
  state.finish = finish;

  state.timer = setInterval(() => {
    if (state.paused || state.done) return;
    state.minute += minPerStep * state.speedMul;
    const m = Math.min(93, state.minute);
    while (state.tickIdx < ticker.length && ticker[state.tickIdx].minute <= m && ticker[state.tickIdx].type !== 'end' && ticker[state.tickIdx].type !== 'pens') {
      const tk = ticker[state.tickIdx];
      // Schlüsselszene vor dem passenden Tickereintrag zeigen
      if (state.sceneIdx < scenes.length && scenes[state.sceneIdx].minute <= tk.minute) {
        showScene(scenes[state.sceneIdx++]);
        return;
      }
      addTick(tk);
      state.tickIdx++;
      if (tk.type === 'half' && state.phase === 'first') { showHalftime(); return; }
    }
    if (state.sceneIdx < scenes.length && scenes[state.sceneIdx].minute <= m) {
      showScene(scenes[state.sceneIdx++]);
      return;
    }
    const mn = $('sb-min');
    if (mn) mn.textContent = `${Math.min(90, Math.floor(m))}'`;
    const pr = $('mf-progress');
    if (pr) pr.style.width = `${Math.min(100, (m / 90) * 100)}%`;
    if (state.minute >= 93) {
      if (r.pens?.kicks?.length && !state.inPens) {
        while (state.tickIdx < ticker.length && ticker[state.tickIdx].type !== 'pens') addTick(ticker[state.tickIdx++]);
        const mn = $('sb-min');
        if (mn) mn.textContent = t('mf.pensShort');
        showPens();
      } else if (!state.inPens) finish();
    }
  }, stepMs);

  playSound('whistle', settings);
}

export function stopMatch() {
  if (ctrl) {
    clearInterval(ctrl.timer);
    clearTimeout(ctrl.sceneTimer);
    (ctrl.sceneTimers || []).forEach(clearTimeout);
    clearTimeout(ctrl.penTimer);
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
  if (action === 'skip') { const el = document.getElementById('mf-scene'); if (el) el.innerHTML = ''; ctrl.finish(); }
  if (action === 'continue') (ctrl.tapScene || ctrl.continueAfterScene)();
}
