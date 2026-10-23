// =============================================================================
// Postfach-Aufgaben (v1.11): Nachrichten mit Entscheidung (Auswahlknöpfe) und/oder
// Sprungknopf. Blockierende Aufgaben sperren in der Oberfläche das Weiterspielen.
// Die Engine (playDay, Simulationen, Tests) blockiert nie – dafür gibt es
// autoResolveTasks.
// =============================================================================
import { addNews, nextUserMatch } from './game.js';
import { chooseSeasonGoal } from './clublife.js';
import { INTERVIEW_KEYS, interviewAvailable, setInterview } from './extras.js';
import { acceptOffer, declineOffer, unlistPlayer } from './market.js';

/**
 * Handler je Art. Form:
 *   { resolve(state, task, choiceKey, news) → { ok } | { error },
 *     alive(state, task, news) → boolean,   // Bezug noch da?
 *     defaultChoice: 'decline' | (state, task) => key }
 * Die folgenden Tickets tragen ihre Handler mit registerTaskHandler ein.
 */
export const HANDLERS = {};

export function registerTaskHandler(kind, handler) {
  HANDLERS[kind] = handler;
}

export function addTask(state, kind, newsKey, params, task, extra = {}) {
  const { newsType = 'board', ...rest } = extra;
  addNews(state, newsType, newsKey, params, { ...rest, task: { kind, status: 'open', blocking: false, ...task } });
  return state.inbox[0];
}

const hasTask = n => !!n.task;

export function openTasks(state) {
  const open = (state.inbox || []).filter(n => hasTask(n) && n.task.status === 'open');
  // Reihenfolge im Postfach ist schon „neueste zuerst“; blockierende nach vorn (stabil)
  return [...open.filter(n => n.task.blocking), ...open.filter(n => !n.task.blocking)];
}

export function blockingTasks(state) {
  return openTasks(state).filter(n => n.task.blocking);
}

export function findTask(state, newsId) {
  return (state.inbox || []).find(n => n.id === newsId && hasTask(n)) || null;
}

export function resolveTask(state, newsId, choiceKey) {
  const n = findTask(state, newsId);
  if (!n || n.task.status !== 'open') return { ok: false, code: 'gone' };
  const h = HANDLERS[n.task.kind];
  let res = { ok: true };
  if (h?.resolve) {
    res = h.resolve(state, n.task, choiceKey, n) || { ok: true };
    if (res.error || res.ok === false) return res;
  }
  n.task.status = 'done';
  n.task.answer = choiceKey;
  n.read = true;
  return res;
}

/** Aufgabe ohne Antwort als erledigt markieren (z. B. Sprungknopf mit doneOnVisit) */
export function completeTask(state, newsId, answer = 'visited') {
  const n = findTask(state, newsId);
  if (!n || n.task.status !== 'open') return false;
  n.task.status = 'done';
  n.task.answer = answer;
  n.read = true;
  return true;
}

/** Erledigt Aufgaben über ihren Bezug (z. B. Angebot wurde im Transferbereich beantwortet) */
export function completeTasksByRef(state, kind, ref, answer) {
  let n = 0;
  for (const x of state.inbox || []) {
    if (hasTask(x) && x.task.status === 'open' && x.task.kind === kind && x.task.ref === ref) {
      x.task.status = 'done'; x.task.answer = answer; x.read = true; n++;
    }
  }
  return n;
}

export function expireTasks(state) {
  for (const n of state.inbox || []) {
    if (!hasTask(n) || n.task.status !== 'open') continue;
    const h = HANDLERS[n.task.kind];
    const late = n.task.expiresDay != null && n.task.expiresDay < state.dayIndex;
    const gone = h?.alive && !h.alive(state, n.task, n);
    if (late || gone) {
      // Blockierende Aufgaben mit Standardwahl schließen, wenn der Bezug weg ist, sonst nur ablaufen
      n.task.status = 'expired';
      n.read = true;
    }
  }
}

/** Nur für Simulationen und Tests: alle offenen blockierenden Aufgaben mit der Standardwahl beantworten */
export function autoResolveTasks(state, opts = {}) {
  expireTasks(state);
  for (const n of blockingTasks(state)) {
    const h = HANDLERS[n.task.kind];
    let key = h?.defaultChoice;
    if (typeof key === 'function') key = key(state, n.task);
    const forced = opts.choices?.[n.task.kind];
    if (forced && n.task.choices?.some(c => c.key === forced)) key = forced;
    if (!key) key = n.task.choices?.[0]?.key || 'ok';
    resolveTask(state, n.id, key);
    // Hat der Handler abgelehnt, nicht hängen bleiben
    if (n.task.status === 'open') { n.task.status = 'expired'; n.read = true; }
  }
}

export function ensureTasks(state) {
  if (!Array.isArray(state.inbox)) state.inbox = [];
  expireTasks(state);
  ensureInterviewTask(state);
}

// ---------------------------------------------------------------------------
// Handler: Angebote für eigene Spieler (11.3)
// ---------------------------------------------------------------------------
const offerOf = (state, task) => (state.user.offers || []).find(o => o.id === task.ref);

registerTaskHandler('offer', {
  alive: (state, task) => {
    const o = offerOf(state, task);
    return !!o && state.players[o.playerId]?.clubId === 'user';
  },
  defaultChoice: 'decline',
  resolve: (state, task, choice) => {
    const o = offerOf(state, task);
    if (!o) return { ok: false, code: 'gone' };
    if (choice === 'accept') return acceptOffer(state, task.ref);
    const pid = o.playerId;
    const res = declineOffer(state, task.ref);
    if (choice === 'declineUnlist' && res.ok) unlistPlayer(state, pid);
    return res;
  }
});

// ---------------------------------------------------------------------------
// Handler: Pressekonferenz (11.4) – nicht blockierend, verfällt am Spieltag
// ---------------------------------------------------------------------------
registerTaskHandler('interview', {
  alive: (state, task) => state.dayIndex <= Number(task.ref),
  resolve: (state, task, choice) => {
    const res = setInterview(state, choice);
    return res.ok === false ? { ok: false, code: res.code } : res;
  }
});

/** Vor dem nächsten eigenen Spiel eine Einladung zur Pressekonferenz ins Postfach legen (einmal je Spiel) */
export function ensureInterviewTask(state) {
  if (!state.user || !state.calendar?.length) return null;
  const next = nextUserMatch(state);
  if (!next || state.user.interview || !interviewAvailable(state, next)) return null;
  const ref = String(next.dayIndex);
  if ((state.inbox || []).some(n => n.task?.kind === 'interview' && n.task.ref === ref && n.season === state.season)) return null;
  const opp = state.clubs[next.m.home === 'user' ? next.m.away : next.m.home];
  return addTask(state, 'interview', 'news.ivTask', { club: opp.name }, {
    blocking: false, ref, expiresDay: next.dayIndex,
    choices: INTERVIEW_KEYS.map(k => ({ key: k, label: `iv.${k}`, hint: `iv.${k}.d`, tone: 'secondary' }))
  }, { newsType: 'press', clubId: opp.id });
}

// ---------------------------------------------------------------------------
// Handler: Saisonziel mit dem Vorstand (11.5)
// ---------------------------------------------------------------------------
registerTaskHandler('goal', {
  alive: (state, task) => String(state.season) === task.ref && !state.user.mood?.goal?.deal,
  defaultChoice: 'standard',
  resolve: (state, task, choice) => chooseSeasonGoal(state, choice)
});
