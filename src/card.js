// "Carta do dia": a certificate with the day's words, earned when all four
// stars of a day are complete. It is derived from progress (nothing new is
// stored) and drawn on a <canvas> so the family can save or share a PNG.

import { DAYS, PHASES } from '../data/lessons.js';
import { VOCAB_BY_ID } from '../data/vocabulary.js';
import { artSvg } from './ui/illustrations.js';

/** One colour per village, shared with the map's roofs. */
export const PHASE_COLORS = ['#C8283C', '#2F5FA8', '#E8B23A', '#7A4BA0', '#1F5C45'];

const pad = (n) => String(n).padStart(2, '0');

export function cardModel(day) {
  const d = DAYS.find((x) => x.day === Number(day));
  if (!d) return null;
  const pi = PHASES.findIndex((p) => p.days.includes(d.day));
  const phase = PHASES[pi];
  return {
    day: d.day,
    total: DAYS.length,
    phase,
    color: PHASE_COLORS[pi],
    goal: d.goal,
    words: d.focus.map((id) => {
      const w = VOCAB_BY_ID[id];
      return { id, en: w.en, pt: w.pt, art: w.art };
    }),
  };
}

export const cardFileName = (day) => `carta-dia-${pad(day)}.png`;

// ── Drawing ──────────────────────────────────────────────────────────────
const W = 1080;
const H = 1350;
const INK = '#3A2418';
const INK_SOFT = '#6B5446';
const CREAM = '#FBF8F2';
const GOLD = '#E8B23A';
const DISPLAY = "'Grandstander', 'Chalkboard SE', 'Comic Sans MS', sans-serif";
const BODY = "'Atkinson Hyperlegible', -apple-system, 'Segoe UI', sans-serif";
const EMOJI = "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif";
const STAR = 'M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z';

function loadSvg(svg) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('svg failed')); };
    img.src = url;
  });
}

/** Largest font size (down to `min`) at which `text` fits in `maxW`. */
function fitFont(ctx, text, maxW, size, min, font) {
  let s = size;
  for (; s > min; s -= 2) {
    ctx.font = font(s);
    if (ctx.measureText(text).width <= maxW) break;
  }
  ctx.font = font(s);
  return s;
}

function wrap(ctx, text, maxW, maxLines = 3) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (line && ctx.measureText(test).width > maxW) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  return lines.slice(0, maxLines);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawStar(ctx, cx, cy, size) {
  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2);
  ctx.scale(size / 24, size / 24);
  const p = new Path2D(STAR);
  ctx.fillStyle = GOLD;
  ctx.fill(p);
  ctx.lineWidth = 1.4;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  ctx.stroke(p);
  ctx.restore();
}

/** Grid of words: one row up to 3 words, two rows above that. */
function wordLayout(n) {
  if (n <= 3) return [n];
  if (n === 4) return [2, 2];
  return [Math.ceil(n / 2), Math.floor(n / 2)];
}

export async function renderCardPng(day, doc = document) {
  const m = cardModel(day);
  if (!m) throw new Error(`no card for day ${day}`);
  try {
    await Promise.all([
      doc.fonts?.load(`800 80px Grandstander`),
      doc.fonts?.load(`700 40px Grandstander`),
      doc.fonts?.load(`400 30px 'Atkinson Hyperlegible'`),
      doc.fonts?.load(`700 30px 'Atkinson Hyperlegible'`),
    ]);
  } catch { /* system fonts are fine */ }
  const [sealImg, ...wordImgs] = await Promise.all([
    loadSvg(artSvg(m.phase.seal.art)),
    ...m.words.map((w) => loadSvg(artSvg(w.art))),
  ]);

  const canvas = doc.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // Felt frame in the village colour, cream paper, stitched edge.
  ctx.fillStyle = m.color;
  ctx.fillRect(0, 0, W, H);
  roundRect(ctx, 40, 40, W - 80, H - 80, 52);
  ctx.fillStyle = CREAM;
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = INK;
  ctx.stroke();
  roundRect(ctx, 64, 64, W - 128, H - 128, 36);
  ctx.setLineDash([16, 14]);
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(58, 36, 24, 0.35)';
  ctx.stroke();
  ctx.setLineDash([]);

  // Village name and seal.
  ctx.drawImage(sealImg, W - 250, 92, 150, 150);
  ctx.textAlign = 'left';
  ctx.font = `64px ${EMOJI}`;
  ctx.fillText(m.phase.emoji, 112, 172);
  ctx.fillStyle = m.color;
  fitFont(ctx, m.phase.village, W - 460, 46, 28, (s) => `700 ${s}px ${DISPLAY}`);
  ctx.fillText(m.phase.village, 196, 162);
  ctx.fillStyle = INK_SOFT;
  ctx.font = `400 30px ${BODY}`;
  ctx.fillText(m.phase.title, 196, 204);

  // Certificate heading and four stars.
  ctx.textAlign = 'center';
  ctx.fillStyle = INK;
  ctx.font = `800 104px ${DISPLAY}`;
  ctx.fillText('Parabéns!', W / 2, 360);
  ctx.fillStyle = m.color;
  ctx.font = `800 64px ${DISPLAY}`;
  ctx.fillText(`Dia ${m.day} completo`, W / 2, 440);
  for (let i = 0; i < 4; i++) drawStar(ctx, W / 2 + (i - 1.5) * 84, 510, 72);

  // Words of the day.
  ctx.fillStyle = INK;
  ctx.font = `700 34px ${BODY}`;
  ctx.fillText('Palavras que aprendi', W / 2, 600);
  const rows = wordLayout(m.words.length);
  const top = 620;
  const areaH = 480;
  const rowH = areaH / rows.length;
  const artSize = rows.length === 1 ? (m.words.length === 3 ? 220 : 250) : 130;
  let k = 0;
  rows.forEach((count, r) => {
    const cellW = (W - 200) / count;
    const block = artSize + 110;
    const y0 = top + r * rowH + (rowH - block) / 2;
    for (let c = 0; c < count; c++, k++) {
      const w = m.words[k];
      const cx = 100 + cellW * (c + 0.5);
      ctx.drawImage(wordImgs[k], cx - artSize / 2, y0, artSize, artSize);
      ctx.fillStyle = INK;
      fitFont(ctx, w.en, cellW - 24, 52, 26, (s) => `800 ${s}px ${DISPLAY}`);
      ctx.fillText(w.en, cx, y0 + artSize + 56);
      ctx.fillStyle = INK_SOFT;
      fitFont(ctx, w.pt, cellW - 24, 30, 20, (s) => `400 ${s}px ${BODY}`);
      ctx.fillText(w.pt, cx, y0 + artSize + 96);
    }
  });

  // Goal achieved.
  roundRect(ctx, 110, 1110, W - 220, 120, 28);
  ctx.fillStyle = '#FBE7B0';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.font = `700 30px ${BODY}`;
  const lines = wrap(ctx, `Meta cumprida: ${m.goal}`, W - 300, 2);
  const ly = lines.length === 1 ? 1182 : 1160;
  lines.forEach((l, i) => ctx.fillText(l, W / 2, ly + i * 42));

  ctx.fillStyle = INK_SOFT;
  ctx.font = `700 26px ${BODY}`;
  ctx.fillText(`Missão Cantata de Natal · Carta ${m.day} de ${m.total}`, W / 2, 1268);

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
  });
}
