// A day's mission: focus words and four gifts (one per activity).

import { ACTIVITY_INFO, ACTIVITY_KEYS } from '../../data/lessons.js';
import { artSvg } from '../ui/illustrations.js';
import { h, star, stars } from '../ui/dom.js';
import { dayData, isDayLocked, lockedDay, notFound, phaseOf, SLUG_OF, wordChip } from './shared.js';

export function missionScreen(app, { params }, ctx) {
  const { progress, tts } = ctx;
  const d = dayData(params.day);
  if (!d) { notFound(app); return; }
  if (isDayLocked(progress, d.day)) { lockedDay(app, d.day, ctx); return; }
  const phase = phaseOf(d.day);
  const review = progress.reviewWords(d.day, d.focus);
  const nextAct = ACTIVITY_KEYS.find((a) => !progress.isDone(d.day, a));

  const gifts = ACTIVITY_KEYS.map((key) => {
    const info = ACTIVITY_INFO[key];
    const done = progress.isDone(d.day, key);
    return h('li', { class: `gift ${done ? 'is-done' : ''} ${key === nextAct ? 'is-next' : ''}` },
      h('a', { class: 'gift__link', href: `#/dia/${d.day}/${SLUG_OF[key]}`, 'aria-label': `${info.title}. ${done ? 'Concluído, estrela ganha. Pode jogar de novo.' : 'Ainda não aberto.'}` },
        h('span', { class: 'gift__art', html: artSvg(info.icon), 'aria-hidden': 'true' }),
        h('span', { class: 'gift__label', 'aria-hidden': 'true' }, info.short),
        h('span', { class: 'gift__state', 'aria-hidden': 'true' }, done ? star(true) : h('span', { class: 'gift__open' }, 'Abrir'))));
  });

  app.append(h('section', { class: 'mission stack stack--lg' },
    h('header', { class: 'mission__head' },
      h('p', { class: 'mission__phase' }, `${phase.emoji} ${phase.title}`),
      h('h1', {}, `Dia ${d.day}`),
      h('p', { class: 'mission__goal' }, `Meta de hoje: ${d.goal}`),
      stars(progress.starsForDay(d.day))),
    h('div', { class: 'patch stack' },
      h('h2', {}, 'Palavras do dia'),
      h('ul', { class: 'word-chips' }, d.focus.map((id) => wordChip(id, tts))),
      review.length ? h('p', { class: 'mission__review' }, `⭐ Bônus de revisão hoje: ${review.length === 1 ? 'uma palavra' : 'duas palavras'} para treinar de novo.`) : null),
    h('ol', { class: 'gifts', 'aria-label': 'Atividades do dia' }, gifts),
    progress.isDayComplete(d.day)
      ? h('div', { class: 'patch patch--paper stack mission__done' },
        h('h2', {}, 'Missão completa! 🎉'),
        h('p', {}, 'Você pode jogar qualquer presente de novo para treinar.'),
        h('p', {}, `🏅 Você ganhou a carta do dia ${d.day}!`),
        h('div', { class: 'btn-row' },
          h('a', { class: 'btn btn--gold', href: `#/cartas/${d.day}` }, h('span', { class: 'ico', 'aria-hidden': 'true' }, '🏅'), h('span', {}, 'Minha carta')),
          d.day < 15 ? h('a', { class: 'btn btn--berry', href: `#/dia/${d.day + 1}` }, `Ir para o dia ${d.day + 1}`) : h('a', { class: 'btn btn--berry', href: '#/cantata' }, 'Ir para a Grande Cantata'),
          h('a', { class: 'btn btn--small', href: '#/mapa' }, 'Ver o mapa')))
      : h('div', { class: 'btn-row' },
        h('a', { class: 'btn btn--berry', href: `#/dia/${d.day}/${SLUG_OF[nextAct]}` },
          h('span', { class: 'ico', 'aria-hidden': 'true' }, '🎁'), h('span', {}, `Abrir: ${ACTIVITY_INFO[nextAct].short}`)))));
}
