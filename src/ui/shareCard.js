// =============================================================================
// Teilbare Ergebniskarte: zeichnet ein Hochformat-Bild (1080 × 1350) per Canvas
// =============================================================================

import { crestSvg } from './components/crest.js';
import { t } from '../i18n/index.js';
import { LEAGUE_INFO } from '../engine/world.js';
import { ffStageText, cupText } from './text.js';

const W = 1080;
const H = 1350;

function crestImage(club, size) {
  const svg = crestSvg(club, size).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

function shade(hex, amt) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return '#222';
  const n = parseInt(m[1], 16);
  const f = c => Math.max(0, Math.min(255, Math.round(c * (1 + amt))));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

function pname(game, snapshot, id) {
  const p = game.players[id] || snapshot?.[id];
  return p ? `${p.first[0]}. ${p.last}` : '';
}

const DISPLAY = '800 {s}px "Big Shoulders Display", "Roboto Condensed", "Arial Narrow", sans-serif';
const BODY = '{w} {s}px Figtree, system-ui, "Segoe UI", Roboto, sans-serif';
const font = (tpl, s, w = 600) => tpl.replace('{s}', s).replace('{w}', w);

function fit(ctx, text, maxW) {
  let s = text;
  while (ctx.measureText(s).width > maxW && s.length > 3) s = s.slice(0, -2);
  return s === text ? s : `${s.trim()}…`;
}

/** Erzeugt die Karte als PNG-Blob */
export async function buildResultCard(game, data) {
  const { result: r, side, outcome, label, snapshot } = data;
  const home = game.clubs[r.homeId];
  const away = game.clubs[r.awayId];
  try { await Promise.all([document.fonts.load(font(DISPLAY, 100)), document.fonts.load(font(BODY, 30, 700))]); } catch { /* Ersatzschrift */ }

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Hintergrund: Vereinsfarben im Wechsel, abgedunkelt
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, shade(home.colors.primary, -0.35));
  g.addColorStop(0.5, '#0d1b14');
  g.addColorStop(1, shade(away.colors.primary, -0.35));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  for (let i = 0; i < 9; i++) if (i % 2 === 0) ctx.fillRect(0, i * (H / 9), W, H / 9);

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = font(BODY, 34, 700);
  ctx.fillText(fit(ctx, String(label || '').toUpperCase(), W - 120), W / 2, 110);

  // Ausgang aus Sicht des eigenen Vereins
  const outcomeColor = outcome === 'W' ? '#5ee59b' : outcome === 'L' ? '#ff8a80' : '#ffd66b';
  ctx.fillStyle = outcomeColor;
  ctx.font = font(DISPLAY, 120);
  ctx.fillText((outcome === 'W' ? t('rep.win') : outcome === 'L' ? t('rep.loss') : t('rep.draw')).toUpperCase(), W / 2, 250);

  // Wappen, Namen, Ergebnis
  const [hi, ai] = await Promise.all([crestImage(home, 200), crestImage(away, 200)]);
  if (hi) ctx.drawImage(hi, 80, 350, 200, 208);
  if (ai) ctx.drawImage(ai, W - 280, 350, 200, 208);
  ctx.fillStyle = '#fff';
  const nameFit = (name, maxW) => {
    for (let s = 58; s >= 30; s -= 2) { ctx.font = font(DISPLAY, s); if (ctx.measureText(name).width <= maxW) break; }
    return name;
  };
  ctx.fillText(nameFit(home.name.toUpperCase(), 310), 180, 640);
  ctx.fillText(nameFit(away.name.toUpperCase(), 310), W - 180, 640);
  ctx.font = font(DISPLAY, 300);
  ctx.fillText(`${r.hg}:${r.ag}`, W / 2, 575);
  if (r.pens) {
    ctx.font = font(BODY, 34, 700);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText(`${r.pens.h}:${r.pens.a} ${t('w.pens')}`, W / 2, 635);
  }

  // Torschützen in zwei Spalten
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fillRect(90, 730, W - 180, 3);
  const lines = { home: [], away: [] };
  for (const gl of r.goals) lines[gl.side].push(`${gl.minute > 90 ? '90+' : gl.minute}' ${pname(game, snapshot, gl.scorerId)}`);
  const rows = Math.min(7, Math.max(lines.home.length, lines.away.length));
  ctx.font = font(BODY, 36, 600);
  ctx.fillStyle = '#fff';
  for (let i = 0; i < rows; i++) {
    ctx.textAlign = 'left';
    if (lines.home[i]) ctx.fillText(fit(ctx, lines.home[i], 420), 100, 800 + i * 56);
    ctx.textAlign = 'right';
    if (lines.away[i]) ctx.fillText(fit(ctx, lines.away[i], 420), W - 100, 800 + i * 56);
  }
  ctx.textAlign = 'center';
  if (!rows) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillText(t('rep.noGoals'), W / 2, 820); }

  // Spieler des Spiels
  const motm = r.motm && (game.players[r.motm] || snapshot?.[r.motm]);
  if (motm) {
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    const y = 1130;
    const rad = 28;
    ctx.beginPath(); ctx.roundRect?.(150, y, W - 300, 110, rad); if (!ctx.roundRect) ctx.rect(150, y, W - 300, 110); ctx.fill();
    ctx.fillStyle = '#ffd66b';
    ctx.font = font(BODY, 26, 700);
    ctx.fillText(t('share.motm').toUpperCase(), W / 2, y + 40);
    ctx.fillStyle = '#fff';
    ctx.font = font(DISPLAY, 52);
    const note = r.ratings?.[r.motm] != null ? ` · ${(Math.round(r.ratings[r.motm] * 10) / 10).toFixed(1)}` : '';
    ctx.fillText(fit(ctx, `${motm.first[0]}. ${motm.last}${note}`, W - 360), W / 2, y + 90);
  }

  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = font(BODY, 28, 700);
  ctx.fillText(t('share.footer'), W / 2, H - 48);

  return new Promise(resolve => canvas.toBlob(b => resolve(b), 'image/png'));
}

/** Saisonkarte: Wappen, Überschrift, Platz, Punkte, Tordifferenz, Pokal */
export async function buildSeasonCard(game) {
  const s = game.seasonSummary;
  const u = s.user;
  const club = game.clubs.user;
  try { await Promise.all([document.fonts.load(font(DISPLAY, 100)), document.fonts.load(font(BODY, 30, 700))]); } catch { /* Ersatzschrift */ }
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const up = u.champion || u.promoted;
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, shade(club.colors.primary, -0.3));
  g.addColorStop(1, '#0d1b14');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  for (let i = 0; i < 9; i++) if (i % 2 === 0) ctx.fillRect(0, i * (H / 9), W, H / 9);
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = font(BODY, 34, 700);
  ctx.fillText(t('se.over', { season: u.season }).toUpperCase(), W / 2, 110);
  const img = await crestImage(club, 320);
  if (img) ctx.drawImage(img, W / 2 - 160, 170, 320, 333);
  ctx.fillStyle = '#fff';
  ctx.font = font(DISPLAY, 70);
  ctx.fillText(fit(ctx, club.name.toUpperCase(), W - 160), W / 2, 590);
  const head = u.champion ? t('se.champion') : u.promoted ? t('se.promoted') : u.relegated ? t('w.relegated') : t('se.placeHead', { pos: u.pos });
  ctx.fillStyle = u.relegated ? '#ff8a80' : up ? '#ffd66b' : '#5ee59b';
  ctx.font = font(DISPLAY, 150);
  ctx.fillText(fit(ctx, head.toUpperCase(), W - 120), W / 2, 740);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = font(BODY, 36, 600);
  ctx.fillText(LEAGUE_INFO[u.tier].name, W / 2, 800);

  const facts = [[t('se.place'), String(u.pos)], [t('cp.points'), String(u.pts)], [t('se.gd'), `${u.gd > 0 ? '+' : ''}${u.gd}`]];
  const cw = 280;
  facts.forEach(([label, value], i) => {
    const x = W / 2 + (i - 1) * (cw + 20);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath(); ctx.roundRect?.(x - cw / 2, 870, cw, 190, 28); if (!ctx.roundRect) ctx.rect(x - cw / 2, 870, cw, 190); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = font(BODY, 28, 700);
    ctx.fillText(label.toUpperCase(), x, 920);
    ctx.fillStyle = '#fff';
    ctx.font = font(DISPLAY, 110);
    ctx.fillText(value, x, 1030);
  });
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = font(BODY, 34, 600);
  ctx.fillText(fit(ctx, `Final Four: ${ffStageText(u.ffStage)}  ·  ${t('w.cup')}: ${cupText(u.cup)}`, W - 120), W / 2, 1160);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = font(BODY, 28, 700);
  ctx.fillText(t('share.footer'), W / 2, H - 48);
  return new Promise(resolve => canvas.toBlob(b => resolve(b), 'image/png'));
}

export function seasonCardName(game) {
  const clean = x => x.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
  return `starting-xi_${clean(game.clubs.user.name)}_Saison${game.seasonSummary.user.season}.png`;
}

export function resultCardName(game, data) {
  const r = data.result;
  const clean = s => s.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
  return `starting-xi_${clean(game.clubs[r.homeId].name)}-${clean(game.clubs[r.awayId].name)}_${r.hg}-${r.ag}.png`;
}
