// The Grande Cantata: rehearse the whole school excerpt with a live
// "what's now / what's next" card, then record a longer performance.

import { SEGMENTS } from '../../data/segments.js';
import { artSvg } from '../ui/illustrations.js';
import { art, btn, h } from '../ui/dom.js';
import { recorderPanel } from '../ui/recorder-panel.js';
import { segmentControls } from '../ui/segment-controls.js';

const SECTION_ART = {
  'chorus-1': ['santa', 'sleigh'], 'verse1-a': ['eyes', 'face-cry'], 'verse1-b': ['face-pout', 'question'],
  'chorus-2': ['santa', 'town'], 'list-a': ['list', 'twice'], 'list-b': ['face-naughty', 'face-nice'],
  'chorus-3': ['cheer', 'santa'], 'sleep-a': ['face-sleeping', 'face-awake'], 'sleep-b': ['thumbs-down', 'thumbs-up', 'heart'],
  'verse2-a': ['eyes', 'face-cry'], 'verse2-b': ['face-pout', 'question'], 'chorus-4': ['cheer', 'party'],
  woohoo: ['party'], finale: ['santa', 'town'],
};

export function cantataScreen(app, _route, ctx) {
  const { tv, player, segments, progress, coordinator } = ctx;
  const singAlong = progress.state.prefs.singAlongRecording;
  tv.show();
  coordinator.setAllowMusicWhileRecording(singAlong);
  const cleanups = [];
  let support = 'card';

  const now = h('div', { class: 'now-card', 'aria-live': 'off' });
  const supportBtns = [['card', 'Com figuras'], ['keywords', 'Só palavras'], ['none', 'Sem ajuda']].map(([value, label]) => {
    const b = btn(label, { cls: 'btn--small toggle-chip', 'aria-pressed': String(value === support), onClick: () => { support = value; supportBtns.forEach((x) => x.setAttribute('aria-pressed', String(x === b))); paintNow(player.state); } });
    return b;
  });

  const calibrated = segments.list().filter((s) => s.calibrated);
  let lastKey = '';
  function paintNow(s) {
    const t = s.segment ? s.segment.t : null;
    const idx = t == null ? -1 : calibrated.findIndex((x) => t >= x.start - 0.2 && t < x.end);
    const key = `${idx}|${support}|${t == null}`;
    if (key === lastKey) return;
    lastKey = key;
    if (t == null) {
      now.replaceChildren(h('p', { class: 'now-card__idle' }, '🎶 Toque a música e acompanhe aqui as palavras de cada parte.'));
      return;
    }
    const cur = calibrated[idx];
    const next = idx >= 0 ? calibrated[idx + 1] : calibrated.find((x) => x.start > t);
    const part = (seg, cls, title) => h('div', { class: `now-card__part ${cls}` },
      h('p', { class: 'now-card__label' }, title),
      support === 'card' ? h('div', { class: 'now-card__art' }, (SECTION_ART[seg.id] ?? []).map((a) => art(artSvg(a)))) : null,
      support !== 'none' ? h('p', { class: 'now-card__words', lang: 'en' }, seg.hint) : h('p', { class: 'now-card__words' }, '🎤'));
    now.replaceChildren(
      cur ? part(cur, 'is-now', 'Agora') : h('div', { class: 'now-card__part is-now' }, h('p', { class: 'now-card__label' }, 'Escute…')),
      next ? part(next, 'is-next', 'Prepare-se') : null,
    );
  }
  cleanups.push(player.subscribe(paintNow));

  const full = segmentControls('full', ctx, { label: 'Tocar o trecho inteiro' });
  cleanups.push(full.cleanup);

  const rec = recorderPanel(ctx, {
    kind: 'grande-cantata',
    maxSeconds: progress.state.prefs.cantataMaxSeconds,
    recordLabel: singAlong ? 'Gravar cantando com a música' : 'Gravar minha apresentação',
    onStarted: singAlong && full.calibrated ? () => full.play() : null,
  });
  cleanups.push(rec.cleanup);

  app.append(h('section', { class: 'cantata stack stack--lg' },
    h('header', { class: 'cantata__stage' },
      h('div', { class: 'cantata__curtain cantata__curtain--l', 'aria-hidden': 'true' }),
      h('div', { class: 'cantata__curtain cantata__curtain--r', 'aria-hidden': 'true' }),
      h('div', { class: 'cantata__title' },
        h('h1', {}, 'A Grande Cantata'),
        h('p', {}, 'Ensaie o trecho inteiro da escola e grave a sua apresentação.'))),
    h('section', { class: 'patch stack', 'aria-labelledby': 'ensaio' },
      h('h2', { id: 'ensaio' }, '1. Ensaio com a música'),
      h('div', { class: 'btn-row', role: 'group', 'aria-label': 'Quanta ajuda mostrar' }, supportBtns),
      full.el,
      full.calibrated ? now : null,
      !full.calibrated && calibrated.length === 0 ? h('p', {}, 'Dica: depois que um adulto configurar os trechos, as palavras de cada parte aparecem aqui enquanto a música toca.') : null),
    h('section', { class: 'patch stack', 'aria-labelledby': 'gravar' },
      h('h2', { id: 'gravar' }, '2. Minha apresentação de Natal'),
      singAlong
        ? h('p', { class: 'banner' }, '🎧 Use fones de ouvido: a música toca junto e o microfone grava só a sua voz.')
        : h('p', {}, 'A música para durante a gravação. Cante tudo sozinho, como no palco!'),
      rec.el)));
  paintNow(player.state);

  return () => cleanups.forEach((fn) => fn());
}
