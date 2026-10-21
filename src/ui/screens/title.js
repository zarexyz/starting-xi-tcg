// =============================================================================
// Titelbildschirm & Vereinsgründung
// =============================================================================

import { createRng } from '../../engine/rng.js';
import { createPlayer } from '../../engine/player.js';
import { cardHtml } from '../components/card.js';
import { crestSvg, CREST_SHAPES } from '../components/crest.js';
import { shortCode } from '../../engine/world.js';
import { LEAGUE_INFO, FOUNDING_COUNTRIES } from '../../engine/world.js';
import { NATIONS } from '../../engine/names.js';
import { flagSvg } from '../components/flag.js';
import { SLOTS, slotInfo } from '../../state/storage.js';
import { icon } from '../icons.js';
import { esc } from '../html.js';

let showcase = null;
function showcaseCards() {
  if (showcase) return showcase;
  const rng = createRng(2027);
  const a = createPlayer(rng, { id: 'a', position: 'LF', age: 21, ovr: 74, tier: 'silver', nation: 'NGA' });
  const b = createPlayer(rng, { id: 'b', position: 'ST', age: 25, ovr: 86, tier: 'gold', nation: 'GER' });
  const c = createPlayer(rng, { id: 'c', position: 'IV', age: 29, ovr: 63, tier: 'bronze', nation: 'ESP' });
  showcase = `
    <div class="fan">
      <div class="fan__card fan__card--l">${cardHtml(c, { size: 'md', colors: { primary: '#0369a1', secondary: '#ffffff' } })}</div>
      <div class="fan__card fan__card--r">${cardHtml(a, { size: 'md', colors: { primary: '#b91c1c', secondary: '#facc15' } })}</div>
      <div class="fan__card fan__card--c">${cardHtml(b, { size: 'md', colors: { primary: '#0f766e', secondary: '#facc15' } })}</div>
    </div>`;
  return showcase;
}

export function titleScreen(store) {
  const slots = SLOTS.map(slotInfo);
  const any = slots.some(Boolean);
  return `<main class="screen screen--bare title">
    <div class="title__hero">
      ${showcaseCards()}
      <h1 class="title__mark display">Starting XI</h1>
      <p class="title__tag">Gründe deinen Verein, sammle Spieler, führe sie von der Amateurliga an die Spitze.</p>
    </div>
    <div class="title__actions">
      ${store.ui.slotPicker || !any ? slotPicker(slots) : `
        <button class="btn btn--primary btn--block" data-action="continue">${icon('play')}Weiterspielen</button>
        <button class="btn btn--secondary btn--block" data-action="show-slots">Spielstände</button>`}
    </div>
  </main>`;
}

function slotPicker(slots) {
  return `<div class="panel panel--flush">
    <ul class="list">
      ${slots.map((s, i) => s ? `
        <li class="row">
          ${crestSvg(s, 36)}
          <div class="row__main"><div class="row__title">${esc(s.name)}</div><div class="row__sub">${LEAGUE_INFO[s.tier].name}, Saison ${s.season}</div></div>
          <button class="btn btn--sm btn--primary" data-action="load-slot" data-slot="${SLOTS[i]}">Laden</button>
          <button class="icon-btn" data-action="delete-slot" data-slot="${SLOTS[i]}" aria-label="Spielstand ${SLOTS[i]} löschen">${icon('trash')}</button>
        </li>` : `
        <li class="row">
          <span class="slot-empty">${icon('plus')}</span>
          <div class="row__main"><div class="row__title">Freier Platz ${SLOTS[i]}</div><div class="row__sub">Neuen Verein gründen</div></div>
          <button class="icon-btn" data-action="import-save" data-slot="${SLOTS[i]}" aria-label="Sicherung in Platz ${SLOTS[i]} laden" title="Sicherung laden">${icon('upload')}</button>
          <button class="btn btn--sm btn--secondary" data-action="new-game" data-slot="${SLOTS[i]}">Gründen</button>
        </li>`).join('')}
    </ul>
  </div>
  <p class="xsmall muted slot-note">${slots.every(Boolean) ? 'Um eine Sicherung zu laden, gib zuerst einen Platz frei.' : `${icon('upload')} lädt eine gesicherte Datei in einen freien Platz.`}</p>`;
}

// -----------------------------------------------------------------------------
// Vereinsgründung
// -----------------------------------------------------------------------------

export const PALETTE = ['#1f7a4d', '#0f766e', '#1d4ed8', '#0369a1', '#7e22ce', '#b91c1c', '#ea580c', '#ca8a04', '#111827', '#f8fafc'];

export function foundScreen(store) {
  const f = store.ui.found;
  const preview = { name: f.name || 'Dein Verein', short: shortCode(f.name || 'Dein Verein'), colors: { primary: f.primary, secondary: f.secondary }, crest: { shape: f.shape, pattern: f.pattern } };
  const patterns = [['0', 'Uni'], ['1', 'Streifen'], ['2', 'Schärpe'], ['3', 'Band']];
  const shapeNames = { shield: 'Schild', round: 'Rund', hexagon: 'Sechseck', diamond: 'Raute', crown: 'Krone' };
  return `<main class="screen screen--bare found">
    <div class="found__head">
      <button class="icon-btn" data-action="back-title" aria-label="Zurück">${icon('chevronLeft')}</button>
      <h1 class="h2">Verein gründen</h1>
    </div>
    <div class="found__preview">
      ${crestSvg(preview, 112)}
      <div>
        <div class="h2">${esc(preview.name)}</div>
        <div class="muted small">Start in der ${LEAGUE_INFO[6].name}</div>
      </div>
    </div>

    <div class="field">
      <label for="club-name">Vereinsname</label>
      <input class="input" id="club-name" data-input="found-name" maxlength="24" value="${esc(f.name)}" placeholder="z. B. FC Hafenstadt" autocomplete="off">
    </div>

    <div class="field found__group">
      <label for="club-country">Heimatland</label>
      <div class="country-select">
        ${flagSvg(f.country || 'GER', 24)}
        <select id="club-country" class="input" data-input="found-country">
          ${FOUNDING_COUNTRIES.map(c => [c, NATIONS[c]?.name || c]).sort((a, b) => a[1].localeCompare(b[1])).map(([c, n]) => `<option value="${c}" ${c === (f.country || 'GER') ? 'selected' : ''}>${esc(n)}</option>`).join('')}
        </select>
      </div>
      <p class="xsmall muted">Prägt die Herkunft deiner Spieler und deiner Jugend. Vereine aus deinem Land sind deine Rivalen.</p>
    </div>

    <div class="field found__group">
      <label>Wappenform</label>
      <div class="choice-grid">
        ${CREST_SHAPES.map(s => `<button class="choice" data-action="found-set" data-key="shape" data-value="${s}" aria-pressed="${f.shape === s}">${crestSvg({ ...preview, short: '', crest: { shape: s, pattern: 0 } }, 30)}${shapeNames[s]}</button>`).join('')}
      </div>
    </div>

    <div class="field found__group">
      <label>Muster</label>
      <div class="segmented">${patterns.map(([k, l]) => `<button data-action="found-set" data-key="pattern" data-value="${k}" aria-pressed="${String(f.pattern) === k}">${l}</button>`).join('')}</div>
    </div>

    <div class="field found__group">
      <label>Hauptfarbe</label>
      <div class="swatches">${PALETTE.map(c => `<button class="swatch" style="background:${c}" data-action="found-set" data-key="primary" data-value="${c}" aria-pressed="${f.primary === c}" aria-label="Farbe ${c}"></button>`).join('')}</div>
    </div>
    <div class="field found__group">
      <label>Zweitfarbe</label>
      <div class="swatches">${PALETTE.map(c => `<button class="swatch" style="background:${c}" data-action="found-set" data-key="secondary" data-value="${c}" aria-pressed="${f.secondary === c}" aria-label="Farbe ${c}"></button>`).join('')}</div>
    </div>

    <div class="found__cta">
      <p class="small muted">Du startest mit 18 Amateuren aus dem Starter-Pack und wählst danach deinen Starspieler.</p>
      <button class="btn btn--primary btn--block" data-action="found-club" ${f.name.trim().length < 3 ? 'disabled' : ''}>Verein gründen</button>
    </div>
  </main>`;
}
