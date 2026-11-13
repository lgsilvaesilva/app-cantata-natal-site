// Runs one activity of a day: steps through its items, then awards the star.

import { ACTIVITY_INFO, ACTIVITY_KEYS } from '../../data/lessons.js';
import { RENDERERS } from '../exercises/index.js';
import { itemsFor } from '../game.js';
import { append, btn, h } from '../ui/dom.js';
import { celebrate } from '../ui/overlays.js';
import { ACT_SLUGS, dayData, notFound, SLUG_OF } from './shared.js';

export function activityScreen(app, { params }, ctx) {
  const { progress, tv, navigate } = ctx;
  const d = dayData(params.day);
  const act = ACT_SLUGS[params.act];
  if (!d || !act) { notFound(app, 'Esta atividade não existe.'); return; }
  const info = ACTIVITY_INFO[act];

  let items;
  if (act === 'pronounce') items = d.pronounce.map((p) => ({ ...p, type: 'pronounce' }));
  else if (act === 'sing') items = d.sing.steps.map((s) => ({ ...s, type: 'sing' }));
  else items = itemsFor(d, act, progress.reviewWords(d.day, d.focus));

  const needsMusic = act === 'listen' || act === 'sing' || items.some((i) => i.segment);
  if (needsMusic) tv.show();

  let index = 0;
  let answered = 0;
  let cleanupItem = null;
  let finished = false;

  const dots = h('div', { class: 'dots', role: 'img' });
  const stage = h('div', { class: 'exercise patch stack' });

  function paintDots() {
    dots.setAttribute('aria-label', `Desafio ${Math.min(index + 1, items.length)} de ${items.length}`);
    dots.replaceChildren(...items.map((_, i) => h('span', { class: `dot ${i < index ? 'is-done' : ''} ${i === index ? 'is-current' : ''}` })));
  }

  function showItem() {
    if (cleanupItem) { cleanupItem(); cleanupItem = null; }
    ctx.coordinator.stopAll();
    stage.replaceChildren();
    paintDots();
    const item = items[index];
    if (item.review) stage.append(h('p', { class: 'review-badge' }, '⭐ Revisão bônus'));
    const render = RENDERERS[item.type];
    cleanupItem = render(stage, item, {
      ctx,
      day: d.day,
      complete: ({ skipped = false } = {}) => {
        if (!skipped) answered += 1;
        index += 1;
        if (index < items.length) { showItem(); stage.querySelector('.prompt__text, .big-word')?.scrollIntoView?.({ block: 'nearest' }); }
        else finish();
      },
    }) ?? null;
  }

  async function finish() {
    if (cleanupItem) { cleanupItem(); cleanupItem = null; }
    finished = true;
    paintDots();
    stage.replaceChildren();
    const nextAct = ACTIVITY_KEYS.find((a) => !progress.isDone(d.day, a) && a !== act);

    if (answered === 0) {
      append(stage, h('h2', {}, 'Ainda faltam os trechos da música'),
        h('p', {}, 'Para ganhar esta estrela, um adulto precisa configurar os trechos. Os outros presentes já podem ser abertos!'),
        h('div', { class: 'btn-row' },
          h('a', { class: 'btn btn--berry', href: `#/dia/${d.day}` }, 'Voltar aos presentes'),
          h('a', { class: 'btn btn--small', href: '#/adulto/trechos' }, 'Configurar trechos (adulto)')));
      return;
    }

    const result = progress.completeActivity(d.day, act);
    await celebrate({
      title: result.newStar ? 'Você ganhou uma estrela!' : 'Muito bem!',
      text: result.dayCompleted && result.newStar ? `Dia ${d.day} completo!` : '',
      seal: result.seal,
      cardDay: result.dayCompleted && result.newStar ? d.day : null,
      starWon: result.newStar,
    });
    if (!document.contains(stage)) return;

    append(stage, h('h2', {}, `${info.short}: concluído!`),
      d.sing.cantata && act === 'sing'
        ? h('p', {}, 'Agora é a hora da Grande Cantata: cante tudo e grave sua apresentação!')
        : null,
      h('div', { class: 'btn-row' },
        progress.isDayComplete(d.day) ? h('a', { class: 'btn btn--gold', href: `#/cartas/${d.day}` }, h('span', { class: 'ico', 'aria-hidden': 'true' }, '🏅'), h('span', {}, 'Ver minha carta')) : null,
        d.sing.cantata && act === 'sing' ? h('a', { class: 'btn btn--gold', href: '#/cantata' }, h('span', { class: 'ico', 'aria-hidden': 'true' }, '🎤'), h('span', {}, 'Grande Cantata')) : null,
        nextAct
          ? h('a', { class: 'btn btn--berry', href: `#/dia/${d.day}/${SLUG_OF[nextAct]}` }, h('span', { class: 'ico', 'aria-hidden': 'true' }, '🎁'), h('span', {}, `Próximo presente: ${ACTIVITY_INFO[nextAct].short}`))
          : h('a', { class: 'btn btn--berry', href: `#/dia/${d.day}` }, 'Ver os presentes do dia'),
        btn('Jogar de novo', { cls: 'btn--small', icon: '↺', onClick: () => navigate(`#/dia/${d.day}/${params.act}`) })));
    stage.querySelector('h2')?.focus?.();
  }

  app.append(h('section', { class: 'activity stack' },
    h('header', { class: 'activity__head' },
      h('a', { class: 'btn btn--small', href: `#/dia/${d.day}`, 'aria-label': `Voltar aos presentes do dia ${d.day}` },
        h('span', { class: 'ico', 'aria-hidden': 'true' }, '🎁'), h('span', {}, `Dia ${d.day}`)),
      h('div', { class: 'activity__title' }, h('h1', {}, info.title), dots)),
    stage));

  showItem();
  return () => {
    if (cleanupItem) cleanupItem();
    if (!finished) ctx.coordinator.stopAll();
  };
}
