// =============================================================================
// Texte aus dem Spielstand anzeigen: Schlüssel übersetzen, alte Spielstände
// (mit fertigem Text) weiter unterstützen.
// =============================================================================

import { t, fmtDec } from '../i18n/index.js';

export const newsTitle = n => (n.k ? t(`${n.k}.t`, n.p) : n.title);
export const newsText = n => (n.k ? t(`${n.k}.x`, n.p) : n.text);

/** Eintrag mit { k, p } oder altem { text } */
export const txt = o => (o.k ? t(o.k, o.p) : o.text || '');

/** Kassenbuch- und Abrechnungszeilen */
export const ledgerLabel = e => (e.label && e.label.includes('.') && !e.label.includes(' ') ? t(e.label, e.lp) : e.label);

export const injuryLabel = inj => (inj.code != null ? t(`injury.${inj.code}`) : inj.label || '');
export const banReason = s => (['yellow5', 'yellowRed', 'red'].includes(s.reason) ? t(`ban.${s.reason}`) : s.reason || '');

/** Note mit einer Nachkommastelle in der Schreibweise der Sprache */
export const nf1 = x => fmtDec(x, 1);

/** Final-Four-Stufe und Pokalrunde aus der Saisonbilanz (Codes oder alte Texte) */
export function ffStageText(code) {
  if (!code) return t('season.ffNone');
  return { W: t('season.ffW'), F: t('season.ffF'), SF: t('season.ffSF') }[code] || code;
}
export function cupText(code) {
  if (code === 'W' || code === 'Sieger') return t('season.cupW');
  if (typeof code === 'number') return code ? t(`cup.${code}`) : '–';
  return code || '–';
}

/** Titel eines offenen Packs */
export function pendingTitle(pending) {
  if (!pending) return '';
  const key = `pack.${pending.source}.name`;
  const tt = t(key);
  return tt !== key ? tt : pending.title || '';
}
