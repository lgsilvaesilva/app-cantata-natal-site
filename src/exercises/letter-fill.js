// Tap the missing letters, in order. Wrong letters wiggle; no penalty.

import { VOCAB_BY_ID } from '../../data/vocabulary.js';
import { letterFillSetup, nextMissing, praiseFor } from '../game.js';
import { artSvg } from '../ui/illustrations.js';
import { announce, art, btn, h } from '../ui/dom.js';
import { sayButton, speakText } from '../screens/shared.js';

export function letterFillExercise(el, item, api) {
  const { ctx, day } = api;
  const { tts, progress } = ctx;
  const word = VOCAB_BY_ID[item.word];
  const { slots, tiles } = letterFillSetup(item);
  const filled = {};
  let missed = false;
  const feedback = h('div', { 'aria-live': 'polite' });

  const slotEls = slots.map((s) => h('span', { class: `slot ${s.missing ? 'slot--missing' : ''}` }, s.missing ? '' : s.ch));
  const slotRow = h('div', { class: 'slots', lang: 'en', role: 'group', 'aria-label': 'Palavra com letras faltando' }, slotEls);

  function describe() {
    const spoken = slots.map((s, i) => (s.missing && !filled[i] ? 'espaço' : s.ch)).join(' ');
    slotRow.setAttribute('aria-label', `Palavra: ${spoken}`);
    const next = nextMissing(slots, filled);
    slotEls.forEach((elx, i) => elx.classList.toggle('slot--next', next?.index === i));
  }

  const tileEls = tiles.map((t) => {
    const b = h('button', { type: 'button', class: 'btn tile', 'aria-label': `Letra ${t.ch}` }, t.ch);
    b.addEventListener('click', () => {
      const next = nextMissing(slots, filled);
      if (!next) return;
      if (t.ch === next.ch) {
        filled[next.index] = true;
        slotEls[next.index].textContent = t.ch;
        slotEls[next.index].classList.add('slot--filled');
        b.hidden = true;
        describe();
        if (!nextMissing(slots, filled)) done();
        else { const firstVisible = tileEls.find((x) => !x.hidden); firstVisible?.focus(); }
      } else {
        if (!missed) { missed = true; progress.recordMiss(item.word, day); }
        b.classList.remove('is-shaking');
        void b.offsetWidth;
        b.classList.add('is-shaking');
        const hint = `Essa não é a letra. Ouça a palavra “${word.en}” e tente outra.`;
        announce(hint);
        feedback.replaceChildren(h('div', { class: 'feedback feedback--hint' }, h('p', {}, hint)));
      }
    });
    return b;
  });

  function done() {
    const praise = praiseFor(item);
    announce(praise);
    const next = btn('Próximo', { cls: 'btn--pine', icon: '⭐', onClick: () => api.complete() });
    feedback.replaceChildren(h('div', { class: 'feedback' }, h('p', { class: 'feedback__title' }, praise), next));
    next.focus();
  }

  describe();
  el.append(
    h('div', { class: 'prompt' }, h('p', { class: 'prompt__text' }, 'Complete a palavra com as letras que faltam.'),
      sayButton('Complete a palavra com as letras que faltam.', tts, { lang: 'pt', rate: 1, label: 'Ouvir a pergunta' })),
    h('div', { class: 'stimulus stack' },
      art(artSvg(word.art), 'hero-art hero-art--small'),
      h('div', { class: 'btn-row btn-row--center' }, sayButton(speakText(word), tts, { label: 'Ouvir a palavra' })),
      slotRow),
    h('div', { class: 'tiles', role: 'group', 'aria-label': 'Letras para escolher' }, tileEls),
    feedback,
  );
  return () => {};
}
