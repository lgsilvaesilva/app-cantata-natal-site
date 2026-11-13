// The journey map: five villages along a sleigh path, three houses each.
// Days are never irreversibly locked: future days ask for an adult first.

import { DAYS, PHASES } from '../../data/lessons.js';
import { PHASE_COLORS } from '../card.js';
import { MAX_STARS } from '../progress.js';
import { artSvg } from '../ui/illustrations.js';
import { art, h, stars } from '../ui/dom.js';
import { requireAdult } from '../ui/overlays.js';

const ROOF = PHASE_COLORS;

function houseSvg(phaseIndex, state) {
  const roof = ROOF[phaseIndex];
  const snow = state === 'future' ? '<path d="M14 54 q10 -10 22 -4 q10 -8 22 0 q10 -6 18 4 l-4 6 h-54z" fill="#FBF8F2" stroke="#3A2418" stroke-width="2"/>' : '';
  const light = state === 'future' ? '#9AA6B8' : '#F9D46B';
  return `<svg viewBox="0 0 90 90" aria-hidden="true" focusable="false">
    <rect x="16" y="40" width="58" height="42" rx="4" fill="#FBF8F2" stroke="#3A2418" stroke-width="3"/>
    <path d="M8 44 L45 12 L82 44 Z" fill="${roof}" stroke="#3A2418" stroke-width="3" stroke-linejoin="round"/>
    ${snow}
    <rect x="25" y="52" width="14" height="14" rx="2" fill="${light}" stroke="#3A2418" stroke-width="2.5"/>
    <rect x="51" y="58" width="14" height="24" rx="2" fill="#8A5A3B" stroke="#3A2418" stroke-width="2.5"/>
  </svg>`;
}

export function mapScreen(app, _route, ctx) {
  const { progress, navigate } = ctx;
  const current = progress.currentDay();
  const seals = progress.sealsEarned().map((s) => s.id);

  async function openDay(day) {
    const done = progress.starsForDay(day) > 0;
    if (day > current && !done) {
      const ok = await requireAdult(`O dia ${day} ainda não chegou. Um adulto pode abrir qualquer dia.`);
      if (!ok) return;
    }
    navigate(`#/dia/${day}`);
  }

  const banners = [];
  if (!progress.persistent) {
    banners.push(h('p', { class: 'banner', role: 'status' }, '⚠️ Este navegador não está guardando o progresso. As estrelas valem só enquanto esta página estiver aberta.'));
  }
  if (progress.recovered) {
    banners.push(h('p', { class: 'banner', role: 'status' }, 'Parte do progresso salvo estava danificada e foi recuperada como possível.'));
  }

  const villages = PHASES.map((phase, pi) => {
    const sealEarned = seals.includes(phase.seal.id);
    const houses = phase.days.map((day, i) => {
      const n = progress.starsForDay(day);
      const complete = progress.isDayComplete(day);
      const state = complete ? 'done' : day === current ? 'today' : day < current || n > 0 ? 'open' : 'future';
      const label = `Dia ${day}. ${complete ? 'Completo' : state === 'today' ? 'Missão de hoje' : state === 'future' ? 'Ainda não chegou' : 'Em andamento'}. ${n} de 4 estrelas.`;
      return h('li', { class: `house house--${state} house--pos${i}` },
        h('button', { type: 'button', class: 'house__btn', 'aria-label': label, onClick: () => openDay(day) },
          state === 'today' ? h('span', { class: 'house__sleigh', 'aria-hidden': 'true', html: artSvg('sleigh') }) : null,
          h('span', { class: 'house__art', html: houseSvg(pi, state) }),
          h('span', { class: 'house__day', 'aria-hidden': 'true' }, String(day)),
          stars(n)));
    });
    return h('section', { class: `village village--${phase.id}`, 'aria-labelledby': `village-${phase.id}` },
      h('header', { class: 'village__head' },
        h('span', { class: 'village__emoji', 'aria-hidden': 'true' }, phase.emoji),
        h('div', {},
          h('h2', { id: `village-${phase.id}`, class: 'village__title' }, phase.title),
          h('p', { class: 'village__name' }, `${phase.village}, dias ${phase.days[0]} a ${phase.days[2]}`)),
        h('span', { class: `village__seal ${sealEarned ? 'is-earned' : ''}`, role: 'img', 'aria-label': sealEarned ? `${phase.seal.name} conquistado` : `${phase.seal.name}: ainda não conquistado` },
          art(artSvg(phase.seal.art)))),
      h('ol', { class: 'village__path' }, houses));
  });

  const total = progress.totalStars();
  app.append(h('section', { class: 'map' },
    banners,
    h('div', { class: 'map__intro' },
      h('h1', {}, 'Sua jornada até a cantata'),
      h('p', {}, `${progress.completedDays()} de ${DAYS.length} dias completos. ${total} de ${MAX_STARS} estrelas.`),
      h('div', { class: 'btn-row' },
        h('a', { class: 'btn btn--berry', href: `#/dia/${current}` }, h('span', { class: 'ico', 'aria-hidden': 'true' }, '🎁'), h('span', {}, `Ir para o dia ${current}`)),
        h('a', { class: 'btn btn--small btn--gold', href: '#/cantata' }, h('span', { class: 'ico', 'aria-hidden': 'true' }, '🎤'), h('span', {}, 'Grande Cantata')),
        h('a', { class: 'btn btn--small', href: '#/cartas' }, h('span', { class: 'ico', 'aria-hidden': 'true' }, '🏅'), h('span', {}, `Minhas cartas (${progress.completedDays()}/${DAYS.length})`)))),
    h('div', { class: 'map__villages' }, villages),
    // The adult area asks an adult to hold a button for 2 s before opening.
    h('footer', { class: 'map__footer' },
      h('a', { class: 'btn btn--small', href: '#/adulto' },
        h('span', { class: 'ico', 'aria-hidden': 'true' }, '🔑'), h('span', {}, 'Área do adulto')))));
}
