import { DAYS, PHASES } from '../../data/lessons.js';
import { VOCAB_BY_ID } from '../../data/vocabulary.js';
import { artSvg } from '../ui/illustrations.js';
import { art, h } from '../ui/dom.js';

export const ACT_SLUGS = { palavras: 'vocab', ouvir: 'listen', falar: 'pronounce', cantar: 'sing' };
export const SLUG_OF = Object.fromEntries(Object.entries(ACT_SLUGS).map(([slug, key]) => [key, slug]));

export function dayData(param) {
  const n = Number(param);
  return Number.isInteger(n) ? DAYS.find((d) => d.day === n) ?? null : null;
}

export const phaseOf = (day) => PHASES.find((p) => p.days.includes(day));

/**
 * 🔊 button using the browser voice. If the voice does not start, the
 * button says so instead of pretending a sound played.
 */
export function sayButton(text, tts, { lang = 'en', rate = 0.85, label = 'Ouvir', slow = false } = {}) {
  if (!tts.supported) return null;
  const b = h('button', {
    type: 'button', class: 'say-btn', 'aria-label': `${label}: ${text}`,
  }, h('span', { class: 'ico', 'aria-hidden': 'true' }, slow ? '🐢' : '🔊'), h('span', {}, label));
  b.addEventListener('click', async () => {
    const ok = await tts.speak(text, { lang, rate: slow ? 0.55 : rate });
    if (!ok) {
      b.lastChild.textContent = 'Sem voz neste aparelho';
      b.disabled = true;
    }
  });
  return b;
}

export const speakText = (word) => word.say ?? word.en;

export function wordChip(wordId, tts) {
  const w = VOCAB_BY_ID[wordId];
  return h('li', { class: 'word-chip' },
    art(artSvg(w.art)),
    h('span', { class: 'word-chip__en', lang: 'en' }, w.en),
    h('span', { class: 'word-chip__pt' }, w.pt),
    sayButton(speakText(w), tts, { label: 'Ouvir' }));
}

export function notFound(app, message = 'Este dia não existe.') {
  app.append(h('section', { class: 'patch stack' },
    h('h1', {}, 'Ops!'), h('p', {}, message),
    h('a', { class: 'btn btn--berry', href: '#/mapa' }, 'Voltar ao mapa')));
}
