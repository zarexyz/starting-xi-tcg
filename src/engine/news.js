// =============================================================================
// Nachrichten-Kanäle: Postfach (betrifft dich, oft mit Handlungsbedarf) und
// Zeitung (Geschichten, Liga, Welt). Gilt auch für ältere Spielstände.
// =============================================================================

const INBOX_TYPES = new Set(['welcome', 'injury', 'suspension', 'finance', 'contract', 'transfer', 'squad', 'development', 'cup', 'ff', 'trophy', 'season', 'board', 'mood', 'press']);
const MINE_TYPES = new Set(['streak', 'upset', 'comeback', 'result', 'player', 'youth', 'derby', 'rumor']);
const MINE_KEYS = new Set(['news.userTop', 'news.userLostTop', 'news.potmMine', 'news.scorerMine', 'news.potsMine', 'news.xiMine']);

export function newsChannel(n) {
  return INBOX_TYPES.has(n.type) ? 'inbox' : 'feed';
}

/** Betrifft die Meldung den eigenen Verein? (für den Filter „Mein Verein“ in der Zeitung) */
export function isMineNews(state, n) {
  if (n.mine || MINE_TYPES.has(n.type) || MINE_KEYS.has(n.k)) return true;
  return !!(n.playerId && state.players[n.playerId]?.clubId === 'user');
}

export function inboxItems(state) {
  return state.inbox.filter(n => newsChannel(n) === 'inbox');
}

export function feedItems(state, filter = 'all') {
  const list = state.inbox.filter(n => newsChannel(n) === 'feed');
  if (filter === 'mine') return list.filter(n => isMineNews(state, n));
  if (filter === 'world') return list.filter(n => !isMineNews(state, n));
  return list;
}
