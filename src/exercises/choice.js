// One renderer for every "pick the right option" game:
// word-pick, picture-pick, fill-gap, listen-identify, listen-count, listen-next.
// Mistakes never cost stars: the wrong option is marked, a hint appears and
// the child tries again.

import { VOCAB_BY_ID } from '../../data/vocabulary.js';
import { answerOf, isCorrect, praiseFor } from '../game.js';
import { artSvg } from '../ui/illustrations.js';
import { announce, art, btn, h } from '../ui/dom.js';
import { segmentControls } from '../ui/segment-controls.js';
import { sayButton, speakText } from '../screens/shared.js';

const LISTEN_TYPES = ['listen-identify', 'listen-count', 'listen-next'];

function optionMode(item) {
  if (item.type === 'listen-count') return 'number';
  if (item.type === 'fill-gap') return 'text';
  if (item.type === 'picture-pick') return 'picture';
  if (LISTEN_TYPES.includes(item.type)) return item.show === 'picture' ? 'picture' : 'word';
  return 'word';
}

function promptFor(item) {
  if (item.prompt) return item.prompt;
  switch (item.type) {
    case 'word-pick': return item.review ? 'Revisão bônus! Qual é a palavra desta figura?' : 'Qual é a palavra desta figura?';
    case 'picture-pick': return 'Qual figura combina com esta palavra?';
    case 'fill-gap': return 'Qual palavra completa a frase?';
    case 'listen-count': return `Ouça e conte: quantas vezes você ouve “${item.what}”?`;
    case 'listen-next': return `Ouça a música. O que vem depois de “${item.after}”?`;
    default: return item.show === 'picture' ? 'Ouça a música. Qual figura você ouviu?' : 'Ouça a música. Qual palavra você ouviu?';
  }
}

export function choiceExercise(el, item, api) {
  const { ctx, day } = api;
  const { tts, progress } = ctx;
  const word = VOCAB_BY_ID[item.word];
  const mode = optionMode(item);
  const cleanups = [];
  let misses = 0;
  let solved = false;

  // ── Stimulus ──
  const stimulus = h('div', { class: 'stimulus stack' });
  let blank = null;
  if (item.type === 'word-pick') {
    stimulus.append(art(artSvg(word.art), 'hero-art'));
  } else if (item.type === 'picture-pick') {
    stimulus.append(h('p', { class: 'big-word', lang: 'en' }, word.en),
      h('div', { class: 'btn-row btn-row--center' }, sayButton(speakText(word), tts, { label: 'Ouvir a palavra' })));
  } else if (item.type === 'fill-gap') {
    const [before, after] = item.phrase.split('___');
    blank = h('span', { class: 'blank', 'aria-label': 'lacuna' }, '?');
    stimulus.append(art(artSvg(word.art), 'hero-art hero-art--small'),
      h('p', { class: 'phrase', lang: 'en' }, before, blank, after));
  }

  let calibrated = true;
  if (LISTEN_TYPES.includes(item.type)) {
    const controls = segmentControls(item.segment, ctx, { label: 'Ouvir a música' });
    calibrated = controls.calibrated;
    cleanups.push(controls.cleanup);
    stimulus.append(controls.el);
  }

  // ── Options ──
  const feedback = h('div', { class: 'feedback-slot', 'aria-live': 'polite' });
  const buttons = item.options.map((value) => {
    const w = VOCAB_BY_ID[value];
    let content; let label;
    if (mode === 'picture') { content = art(artSvg(w.art)); label = `Figura: ${w.pt}`; }
    else if (mode === 'word') { content = h('span', { lang: 'en' }, w.en); label = null; }
    else { content = h('span', { lang: mode === 'text' ? 'en' : null }, value); label = null; }
    const b = h('button', {
      type: 'button',
      class: `choice choice--${mode}`,
      'aria-label': label,
      dataset: { value },
    }, content, h('span', { class: 'choice__mark', 'aria-hidden': 'true', hidden: true }));
    b.addEventListener('click', () => choose(value, b));
    return b;
  });
  const gridClass = mode === 'picture' ? 'choices--pictures' : mode === 'number' ? 'choices--numbers' : item.options.length === 2 ? 'choices--two' : 'choices--words';
  const choices = h('div', { class: `choices ${gridClass}`, role: 'group', 'aria-label': 'Opções' }, buttons);

  const readOptions = mode === 'word' && tts.supported
    ? h('div', { class: 'btn-row' }, h('button', {
      type: 'button', class: 'say-btn',
      onClick: async () => {
        for (const v of item.options) {
          if (!document.contains(choices)) break;
          const ok = await tts.speak(speakText(VOCAB_BY_ID[v]), { lang: 'en', rate: 0.85 });
          if (!ok) break;
        }
      },
    }, h('span', { class: 'ico', 'aria-hidden': 'true' }, '🔊'), 'Ouvir as opções'))
    : null;

  function mark(b, ok) {
    const m = b.querySelector('.choice__mark');
    m.hidden = false;
    m.textContent = ok ? '✓' : '✗';
    b.classList.add(ok ? 'is-right' : 'is-wrong');
  }

  function choose(value, b) {
    if (solved || b.disabled) return;
    if (isCorrect(item, value)) {
      solved = true;
      mark(b, true);
      for (const other of buttons) other.disabled = true;
      if (blank) { blank.textContent = answerOf(item); blank.removeAttribute('aria-label'); }
      if (item.review) progress.recordReviewHit(item.word);
      const praise = praiseFor(item);
      announce(praise);
      const next = btn('Próximo', { cls: 'btn--pine', icon: '⭐', onClick: () => api.complete() });
      feedback.replaceChildren(h('div', { class: 'feedback' },
        h('p', { class: 'feedback__title' }, praise),
        h('div', { class: 'btn-row btn-row--center' }, sayButton(speakText(word), tts, { label: 'Ouvir' }), next)));
      next.focus();
      return;
    }
    misses += 1;
    if (misses === 1) progress.recordMiss(item.word, day);
    mark(b, false);
    b.disabled = true;
    b.classList.remove('is-shaking');
    void b.offsetWidth;
    b.classList.add('is-shaking');
    const listening = LISTEN_TYPES.includes(item.type);
    const hint = misses === 1
      ? (listening ? 'Quase! Ouça a música de novo com atenção.' : `Quase! Dica: ${word.hint}`)
      : (item.type === 'listen-count' ? 'Conte nos dedinhos enquanto ouve!' : `Dica: em português, é “${word.pt.split(' / ')[0]}”.`);
    announce(hint);
    feedback.replaceChildren(h('div', { class: 'feedback feedback--hint' }, h('p', { class: 'feedback__title' }, '🤔 Tente outra vez!'), h('p', {}, hint)));
  }

  const body = [
    h('div', { class: 'prompt' }, h('p', { class: 'prompt__text' }, promptFor(item)),
      sayButton(promptFor(item), tts, { lang: 'pt', rate: 1, label: 'Ouvir a pergunta' })),
    stimulus,
  ];
  if (!calibrated) {
    body.push(h('div', { class: 'btn-row' }, btn('Pular este desafio', { cls: 'btn--small', icon: '⏭', onClick: () => api.complete({ skipped: true }) })));
  } else {
    body.push(readOptions, choices, feedback);
  }
  el.append(...body.filter(Boolean));
  return () => cleanups.forEach((fn) => fn());
}
