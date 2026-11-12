// Sing along with a section. Support fades from picture cards, to keywords,
// to nothing. A star is for participation: no voice detection.

import { artSvg } from '../ui/illustrations.js';
import { append, announce, art, btn, h } from '../ui/dom.js';
import { recorderPanel } from '../ui/recorder-panel.js';
import { segmentControls } from '../ui/segment-controls.js';

export function singExercise(el, step, api) {
  const { ctx, day } = api;
  const repeats = step.repeats ?? 1;
  let count = 0;
  const cleanups = [];
  const controls = segmentControls(step.segment, ctx, { label: 'Tocar e cantar junto' });
  cleanups.push(controls.cleanup);
  const range = ctx.segments.resolve(step.segment);

  const title = step.support === 'none' ? 'Agora sem ajuda: você já sabe!' : 'Cante junto com a música!';
  let support;
  if (step.support === 'card') {
    support = h('div', { class: 'keyword-card' }, step.keywords.map((k, i) => h('div', { class: 'keyword' },
      step.art[i] ? art(artSvg(step.art[i])) : null, h('span', { lang: 'en' }, k))));
  } else if (step.support === 'keywords') {
    support = h('div', { class: 'keyword-card keyword-card--text' }, step.keywords.map((k) => h('div', { class: 'keyword' }, h('span', { lang: 'en' }, k))));
  } else {
    support = h('div', { class: 'keyword-card keyword-card--none' }, h('div', { class: 'keyword' }, art(artSvg('gift-sing')), h('span', {}, 'Só você e a música!')));
  }

  const counter = h('div', { class: 'dots', role: 'img' });
  const paintCounter = () => {
    counter.setAttribute('aria-label', `Cantou ${count} de ${repeats} ${repeats === 1 ? 'vez' : 'vezes'}`);
    counter.replaceChildren(...Array.from({ length: repeats }, (_, i) => h('span', { class: `dot ${i < count ? 'is-done' : ''}` })));
  };
  paintCounter();

  const sang = btn('Cantei!', {
    cls: 'btn--pine btn--wide', icon: '🎤',
    onClick: () => {
      count += 1;
      paintCounter();
      if (count >= repeats) { api.complete(); return; }
      announce(`Muito bem! Mais ${repeats - count} ${repeats - count === 1 ? 'vez' : 'vezes'}.`);
      sang.querySelector('span:last-child').textContent = 'Cantei mais uma vez!';
    },
  });

  const maxSeconds = range ? Math.min(300, Math.max(30, Math.ceil(range.end - range.start + 15))) : 60;
  const rec = recorderPanel(ctx, { kind: 'cantata', day, maxSeconds, recordLabel: 'Gravar meu canto' });
  cleanups.push(rec.cleanup);

  append(el,
    h('div', { class: 'prompt' }, h('p', { class: 'prompt__text' }, title)),
    h('p', { class: 'sing__section' }, ctx.segments.meta(step.segment)?.label ?? ''),
    support,
    controls.el,
    !controls.calibrated ? h('p', {}, 'Sem o trecho configurado, você pode cantar sozinho e tocar em “Cantei!”.') : null,
    repeats > 1 ? h('div', { class: 'sing__repeats' }, h('p', {}, `Cante ${repeats} vezes`), counter) : null,
    sang,
    h('details', { class: 'sing__record' },
      h('summary', {}, '🎙 Quer gravar seu canto? (opcional)'),
      h('p', {}, 'Para gravar, a música para. Cante sozinho: depois ouça como ficou!'),
      rec.el),
  );
  return () => cleanups.forEach((fn) => fn());
}
