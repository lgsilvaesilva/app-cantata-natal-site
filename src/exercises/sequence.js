// Listen, then tap the pictures in the order they are sung.

import { VOCAB_BY_ID } from '../../data/vocabulary.js';
import { isSequenceCorrect, shuffle } from '../game.js';
import { artSvg } from '../ui/illustrations.js';
import { announce, art, btn, h } from '../ui/dom.js';
import { segmentControls } from '../ui/segment-controls.js';
import { sayButton } from '../screens/shared.js';

export function sequenceExercise(el, item, api) {
  const { ctx, day } = api;
  const { tts, progress } = ctx;
  let order = shuffle(item.order);
  if (order.length > 1 && isSequenceCorrect(item.order, order)) order = [...order.slice(1), order[0]];
  let tapped = [];
  let missed = false;
  let solved = false;
  const feedback = h('div', { 'aria-live': 'polite' });
  const controls = segmentControls(item.segment, ctx, { label: 'Ouvir a música' });
  const prompt = 'Ouça a música e toque nas figuras na ordem em que aparecem.';

  const cards = order.map((id) => {
    const w = VOCAB_BY_ID[id];
    const b = h('button', { type: 'button', class: 'choice choice--picture', dataset: { value: id }, 'aria-label': `${w.en}: ${w.pt}` },
      art(artSvg(w.art)),
      h('span', { class: 'order-badge', 'aria-hidden': 'true' }),
      h('span', { class: 'choice__mark', 'aria-hidden': 'true', hidden: true }));
    b.addEventListener('click', () => tap(id, b));
    return b;
  });
  const undo = btn('Desfazer', { cls: 'btn--small', icon: '↩', onClick: () => { tapped.pop(); paint(); } });

  function paint() {
    cards.forEach((b) => {
      const pos = tapped.indexOf(b.dataset.value);
      b.classList.toggle('is-picked', pos >= 0);
      b.querySelector('.order-badge').textContent = pos >= 0 ? String(pos + 1) : '';
      b.setAttribute('aria-pressed', String(pos >= 0));
    });
    undo.disabled = tapped.length === 0 || solved;
  }

  function tap(id, b) {
    if (solved || tapped.includes(id)) return;
    tapped.push(id);
    paint();
    if (tapped.length < item.order.length) return;
    if (isSequenceCorrect(item.order, tapped)) {
      solved = true;
      cards.forEach((c) => { c.disabled = true; c.classList.add('is-right'); });
      const names = item.order.map((x) => VOCAB_BY_ID[x].en).join(', ');
      const praise = `Isso! A ordem é: ${names}.`;
      announce(praise);
      const next = btn('Próximo', { cls: 'btn--pine', icon: '⭐', onClick: () => api.complete() });
      feedback.replaceChildren(h('div', { class: 'feedback' }, h('p', { class: 'feedback__title' }, praise), next));
      next.focus();
      paint();
      return;
    }
    if (!missed) {
      missed = true;
      const firstWrong = item.order.find((x, i) => tapped[i] !== x);
      progress.recordMiss(firstWrong, day);
    }
    b.classList.add('is-shaking');
    const hint = 'Quase! Ouça de novo e tente outra vez.';
    announce(hint);
    feedback.replaceChildren(h('div', { class: 'feedback feedback--hint' }, h('p', { class: 'feedback__title' }, '🤔 Tente outra vez!'), h('p', {}, hint)));
    setTimeout(() => { tapped = []; cards.forEach((c) => c.classList.remove('is-shaking')); paint(); }, 900);
  }

  paint();
  el.append(
    h('div', { class: 'prompt' }, h('p', { class: 'prompt__text' }, prompt), sayButton(prompt, tts, { lang: 'pt', rate: 1, label: 'Ouvir a pergunta' })),
    controls.el,
  );
  if (controls.calibrated) {
    el.append(h('div', { class: `choices ${cards.length === 2 ? 'choices--two' : 'choices--pictures'}`, role: 'group', 'aria-label': 'Figuras para pôr em ordem' }, cards),
      h('div', { class: 'btn-row' }, undo), feedback);
  } else {
    el.append(h('div', { class: 'btn-row' }, btn('Pular este desafio', { cls: 'btn--small', icon: '⏭', onClick: () => api.complete({ skipped: true }) })));
  }
  return () => controls.cleanup();
}
