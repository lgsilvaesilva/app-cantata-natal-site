// Listen → Repeat slowly → Record and listen to my voice → In rhythm.
// No automatic pronunciation score: the child (or adult) decides whether to
// try again. Participation completes the item, with or without a microphone.

import { VOCAB_BY_ID } from '../../data/vocabulary.js';
import { artSvg } from '../ui/illustrations.js';
import { append, art, btn, h } from '../ui/dom.js';
import { recorderPanel } from '../ui/recorder-panel.js';
import { segmentControls } from '../ui/segment-controls.js';
import { sayButton } from '../screens/shared.js';

export function pronounceExercise(el, item, api) {
  const { ctx, day } = api;
  const { tts, progress } = ctx;
  const word = VOCAB_BY_ID[item.word];
  const say = item.say ?? item.phrase;
  const cleanups = [];
  const stepEls = [];
  const finish = btn('Pronto! Próximo', { cls: 'btn--pine btn--wide', icon: '⭐', disabled: true, onClick: () => api.complete() });

  const step = (title, ...body) => {
    const li = h('li', { class: 'step' }, h('div', { class: 'step__body' }, h('p', { class: 'step__title' }, title), body));
    stepEls.push(li);
    return li;
  };
  const markDone = (i) => stepEls[i]?.classList.add('is-done');

  const listenCtl = item.segment ? segmentControls(item.segment, ctx, { label: 'Ouvir na música', compact: true, onPlayed: () => markDone(0) }) : null;
  if (listenCtl) cleanups.push(listenCtl.cleanup);
  const rhythmCtl = item.segment ? segmentControls(item.segment, ctx, { label: 'Cantar no ritmo da música', compact: true, onPlayed: () => markDone(3) }) : null;
  if (rhythmCtl) cleanups.push(rhythmCtl.cleanup);

  const normal = sayButton(say, tts, { label: 'Ouvir a voz' });
  const slow = sayButton(say, tts, { label: 'Ouvir devagar', slow: true });
  normal?.addEventListener('click', () => markDone(0));
  slow?.addEventListener('click', () => markDone(1));
  const noModel = !tts.supported && !listenCtl?.calibrated;

  const rec = recorderPanel(ctx, {
    kind: 'voz', day, maxSeconds: progress.state.prefs.practiceMaxSeconds,
    recordLabel: 'Gravar minha voz',
    onRecorded: () => { markDone(2); finish.disabled = false; },
  });
  cleanups.push(rec.cleanup);

  const spokeAloud = btn('Falei sem gravar', {
    cls: 'btn--small btn--wide', icon: '🗣',
    onClick: () => { markDone(2); finish.disabled = false; finish.focus(); },
  });

  append(el,
    h('div', { class: 'say-card' },
      art(artSvg(word.art), 'hero-art hero-art--small'),
      h('p', { class: 'big-word big-word--phrase', lang: 'en' }, item.phrase),
      h('p', { class: 'meaning' }, word.pt)),
    noModel ? h('p', { class: 'banner' }, 'Este aparelho não tem voz em inglês e o trecho da música ainda não foi configurado. Peça a um adulto para ler a frase em voz alta.') : null,
    h('ol', { class: 'steps' },
      step('Ouça', h('div', { class: 'btn-row' }, normal), listenCtl?.el),
      step('Repita bem devagar', h('div', { class: 'btn-row' }, slow), h('p', {}, 'Fale junto, sem pressa.')),
      step('Grave e ouça a sua voz', rec.el, spokeAloud),
      step('Agora no ritmo!', rhythmCtl ? rhythmCtl.el : h('div', { class: 'btn-row' }, sayButton(say, tts, { label: 'Ouvir de novo', rate: 1 })))),
    finish,
  );
  return () => cleanups.forEach((fn) => fn());
}
