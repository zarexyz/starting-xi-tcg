// =============================================================================
// Feedback: Nachricht verfassen, optional mit einfachen Spielinfos
// =============================================================================

import { segmented } from '../shell.js';
import { icon } from '../icons.js';
import { esc } from '../html.js';
import { counts } from '../../state/profile.js';
import { APP_VERSION, FEEDBACK_MAIL } from '../../config.js';
import { t, getLang } from '../../i18n/index.js';

export function feedbackDefaults() {
  return { kind: 'idea', text: '', info: true };
}

/** Spielinfos als Text: nur technische Angaben, nichts Persönliches */
export function infoText(game) {
  const c = counts();
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const device = /Android/i.test(ua) ? 'Android' : /iPhone|iPad/i.test(ua) ? 'iOS' : /Windows/i.test(ua) ? 'Windows' : /Mac/i.test(ua) ? 'macOS' : /Linux/i.test(ua) ? 'Linux' : '?';
  const parts = [`v${APP_VERSION}`, getLang(), device];
  if (game) parts.push(`S${game.season}`, `Tag ${game.dayIndex}`, `Liga ${game.clubs.user.tier}`);
  return `${parts.join(' · ')}\n${t('fb.counts', c)}`;
}

export function feedbackBody(game, ui) {
  const f = ui.fb || feedbackDefaults();
  return `
    <div class="field">
      <label>${t('fb.kind')}</label>
      ${segmented([['bug', t('fb.bug')], ['idea', t('fb.idea')], ['praise', t('fb.praise')], ['other', t('fb.other')]], f.kind, 'fb-kind')}
    </div>
    <div class="field">
      <label for="fb-text">${t('fb.text')}</label>
      <textarea id="fb-text" class="input fb-text" rows="6" maxlength="2000" data-input="fb-text" placeholder="${t('fb.placeholder')}">${esc(f.text)}</textarea>
    </div>
    <div class="row fb-info">
      <div class="row__main"><div class="row__title">${t('fb.withInfo')}</div><div class="row__sub">${t('fb.infoHint')}</div></div>
      <button class="toggle" role="switch" aria-checked="${!!f.info}" aria-label="${t('fb.withInfo')}" data-action="fb-info"><span></span></button>
    </div>
    ${f.info ? `<pre class="fb-preview xsmall">${esc(infoText(game))}</pre>` : ''}
    <button class="btn btn--primary btn--block" data-action="fb-send">${icon(FEEDBACK_MAIL ? 'mail' : 'share')}${t('fb.send')}</button>`;
}

/** Fertiger Text für Mail oder Teilen */
export function feedbackMessage(game, f) {
  const kind = t(`fb.${f.kind}`);
  const body = `${f.text.trim()}${f.info ? `\n\n---\n${infoText(game)}` : ''}`;
  return { subject: t('fb.subject', { kind }), body };
}
