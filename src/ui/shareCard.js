// =============================================================================
// Teilbare Ergebniskarte: zeichnet ein Hochformat-Bild (1080 × 1350) per Canvas
// =============================================================================

import { crestSvg } from './components/crest.js';
import { portraitSvg } from './components/portrait.js';
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

const FRAMES = {
  W: ['#fff2b8', '#e7b43b', '#9a6a0c'],
  D: ['#f4f6f9', '#b5bec9', '#6b7685'],
  L: ['#f0c59a', '#b9773f', '#7a4520']
};

function svgImage(svg, w, h) {
  const src = svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(src)}`;
    void w; void h;
  });
}

function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
}

/** Erzeugt die Ergebniskarte als Sammelkarte (PNG-Blob): Rahmen nach Ausgang, Spieler des Spiels als Motiv */
export async function buildResultCard(game, data) {
  const { result: r, side, outcome, label, snapshot } = data;
  const home = game.clubs[r.homeId];
  const away = game.clubs[r.awayId];
  const mine = game.clubs[side === 'home' ? r.homeId : r.awayId];
  try { await Promise.all([document.fonts.load(font(DISPLAY, 100)), document.fonts.load(font(BODY, 30, 700))]); } catch { /* Ersatzschrift */ }

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Tisch: dunkel, mit Licht in Vereinsfarbe
  ctx.fillStyle = '#0b1210'; ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 900);
  glow.addColorStop(0, shade(mine.colors.primary, -0.2));
  glow.addColorStop(1, '#0b1210');
  ctx.globalAlpha = 0.55; ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;

  // Kartenrahmen nach Ausgang: Sieg Gold, Remis Silber, Niederlage Bronze
  const [fa, fb, fc] = FRAMES[outcome] || FRAMES.D;
  const cx = 90, cy = 70, cw = W - 180, ch = H - 140;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 20;
  const fg = ctx.createLinearGradient(cx, cy, cx + cw, cy + ch);
  fg.addColorStop(0, fa); fg.addColorStop(0.45, fb); fg.addColorStop(1, fc);
  rrect(ctx, cx, cy, cw, ch, 56); ctx.fillStyle = fg; ctx.fill();
  ctx.restore();

  // Innenfläche in Vereinsfarben
  const ix = cx + 26, iy = cy + 26, iw = cw - 52, ih = ch - 52;
  const ig = ctx.createLinearGradient(ix, iy, ix, iy + ih);
  ig.addColorStop(0, shade(mine.colors.primary, -0.1));
  ig.addColorStop(0.55, shade(mine.colors.primary, -0.45));
  ig.addColorStop(1, '#0d1b14');
  rrect(ctx, ix, iy, iw, ih, 36); ctx.fillStyle = ig; ctx.fill();
  ctx.save(); rrect(ctx, ix, iy, iw, ih, 36); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  for (let i = 0; i < 12; i++) if (i % 2 === 0) ctx.fillRect(ix, iy + i * (ih / 12), iw, ih / 12);

  // Motiv: Spieler des Spiels
  const motm = r.motm && (game.players[r.motm] || snapshot?.[r.motm]);
  if (motm) {
    const img = await svgImage(portraitSvg(motm, { colors: (game.clubs[motm.clubId] || mine).colors }));
    if (img) ctx.drawImage(img, W / 2 - 200, iy + 175, 400, 440);
  } else {
    const crest = await crestImage(mine, 360);
    if (crest) ctx.drawImage(crest, W / 2 - 180, iy + 190, 360, 374);
  }
  ctx.restore();

  // Kopf: Ergebnis wie ein Wert auf der Spielerkarte
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fff';
  ctx.font = font(DISPLAY, 150);
  ctx.fillText(`${r.hg}:${r.ag}`, ix + 40, iy + 160);
  ctx.fillStyle = outcome === 'W' ? '#ffd66b' : outcome === 'L' ? '#ff8a80' : '#dfe6ee';
  ctx.font = font(DISPLAY, 46);
  ctx.fillText((outcome === 'W' ? t('rep.win') : outcome === 'L' ? t('rep.loss') : t('rep.draw')).toUpperCase().replace('!', ''), ix + 44, iy + 215);
  if (r.pens) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = font(BODY, 30, 700);
    ctx.fillText(`${r.pens.h}:${r.pens.a} ${t('w.pens')}`, ix + 44, iy + 258);
  }
  // Wappen rechts oben
  const [hi, ai] = await Promise.all([crestImage(home, 110), crestImage(away, 110)]);
  if (hi) ctx.drawImage(hi, ix + iw - 140, iy + 40, 100, 104);
  if (ai) ctx.drawImage(ai, ix + iw - 140, iy + 170, 100, 104);

  // Namensband
  const by = iy + 620;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(ix, by, iw, 150);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd66b';
  ctx.font = font(BODY, 26, 700);
  ctx.fillText(motm ? t('share.motm').toUpperCase() : fit(ctx, String(label || '').toUpperCase(), iw - 80), W / 2, by + 42);
  ctx.fillStyle = '#fff';
  const title = motm
    ? `${motm.first[0]}. ${motm.last}${r.ratings?.[r.motm] != null ? ` · ${(Math.round(r.ratings[r.motm] * 10) / 10).toFixed(1)}` : ''}`
    : `${home.short} – ${away.short}`;
  for (let sz = 76; sz >= 36; sz -= 4) { ctx.font = font(DISPLAY, sz); if (ctx.measureText(title).width <= iw - 80) break; }
  ctx.fillText(title, W / 2, by + 112);

  // Paarung als Wertezeile
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  const pair = `${home.name} – ${away.name}`.toUpperCase();
  for (let sz = 38; sz >= 22; sz -= 2) { ctx.font = font(DISPLAY, sz); if (ctx.measureText(pair).width <= iw - 60) break; }
  ctx.fillText(fit(ctx, pair, iw - 60), W / 2, by + 215);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = font(BODY, 26, 700);
  ctx.fillText(fit(ctx, String(label || '').toUpperCase(), iw - 60), W / 2, by + 255);

  // Torschützen in zwei Spalten
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(ix + 50, by + 280, iw - 100, 3);
  const lines = { home: [], away: [] };
  for (const gl of r.goals) lines[gl.side].push(`${gl.minute > 90 ? '90+' : gl.minute}' ${pname(game, snapshot, gl.scorerId)}`);
  const rows = Math.min(4, Math.max(lines.home.length, lines.away.length));
  ctx.font = font(BODY, 28, 600);
  ctx.fillStyle = '#fff';
  for (let i = 0; i < rows; i++) {
    ctx.textAlign = 'left';
    if (lines.home[i]) ctx.fillText(fit(ctx, lines.home[i], 360), ix + 60, by + 332 + i * 40);
    ctx.textAlign = 'right';
    if (lines.away[i]) ctx.fillText(fit(ctx, lines.away[i], 360), ix + iw - 60, by + 332 + i * 40);
  }
  ctx.textAlign = 'center';
  if (!rows) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillText(t('rep.noGoals'), W / 2, by + 340); }

  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = font(BODY, 24, 700);
  ctx.fillText(t('share.footer'), W / 2, iy + ih - 26);

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
