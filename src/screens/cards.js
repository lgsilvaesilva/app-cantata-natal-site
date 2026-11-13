// "Minhas cartas": the album of day cards, and one card to save or share.
// A card is earned when its day has all four stars; nothing extra is stored.

import { DAYS } from '../../data/lessons.js';
import { cardFileName, cardModel, renderCardPng } from '../card.js';
import { canShareFiles, downloadRecording, shareFile } from '../download.js';
import { artSvg } from '../ui/illustrations.js';
import { append, art, btn, h, linkBtn, notice } from '../ui/dom.js';
import { notFound } from './shared.js';

function thumb(day, earned) {
  const m = cardModel(day);
  const label = earned ? `Carta do dia ${day}: conquistada. Abrir.` : `Carta do dia ${day}: complete as 4 estrelas do dia ${day} para ganhar.`;
  return h('li', { class: `card-thumb ${earned ? 'is-earned' : 'is-locked'}`, style: `--card-color: ${m.color}` },
    h('a', { class: 'card-thumb__link', href: `#/cartas/${day}`, 'aria-label': label },
      h('span', { class: 'card-thumb__day', 'aria-hidden': 'true' }, `Dia ${day}`),
      earned
        ? h('span', { class: 'card-thumb__art', 'aria-hidden': 'true' }, m.words.slice(0, 2).map((w) => art(artSvg(w.art))))
        : h('span', { class: 'card-thumb__lock', 'aria-hidden': 'true' }, '?'),
      h('span', { class: 'card-thumb__word', 'aria-hidden': 'true', lang: earned ? 'en' : null }, earned ? m.words[0].en : '🔒')));
}

export function cardsScreen(app, _route, ctx) {
  const { progress } = ctx;
  const earned = DAYS.filter((d) => progress.isDayComplete(d.day)).length;
  app.append(h('section', { class: 'cards stack stack--lg' },
    h('header', { class: 'cards__head' },
      h('h1', {}, 'Minhas cartas'),
      h('p', {}, earned
        ? `Você tem ${earned} de ${DAYS.length} cartas. Toque numa carta para baixar ou compartilhar.`
        : 'Complete as 4 estrelas de um dia para ganhar a primeira carta!')),
    h('ol', { class: 'card-album', 'aria-label': 'Cartas dos 15 dias' },
      DAYS.map((d) => thumb(d.day, progress.isDayComplete(d.day)))),
    h('div', { class: 'btn-row' }, linkBtn('Voltar ao mapa', '#/mapa', { cls: 'btn--small', icon: '🗺️' }))));
}

export function cardScreen(app, { params }, ctx) {
  const { progress } = ctx;
  const m = cardModel(params.day);
  if (!m) { notFound(app, 'Esta carta não existe.'); return; }

  const back = h('div', { class: 'btn-row' },
    linkBtn('Minhas cartas', '#/cartas', { cls: 'btn--small', icon: '🏅' }),
    linkBtn(`Dia ${m.day}`, `#/dia/${m.day}`, { cls: 'btn--small', icon: '🎁' }));

  if (!progress.isDayComplete(m.day)) {
    app.append(h('section', { class: 'cards stack' },
      h('header', { class: 'cards__head' }, h('h1', {}, `Carta do dia ${m.day}`)),
      h('div', { class: 'patch stack' },
        h('p', { class: 'cards__locked' }, '🔒'),
        h('p', {}, `Esta carta ainda está guardada. Complete as 4 estrelas do dia ${m.day} para ganhar!`),
        h('div', { class: 'btn-row' }, linkBtn(`Ir para o dia ${m.day}`, `#/dia/${m.day}`, { cls: 'btn--berry', icon: '🎁' }))),
      back));
    return;
  }

  let url = null;
  let blob = null;
  let alive = true;
  const filename = cardFileName(m.day);
  const frame = h('div', { class: 'card-preview', role: 'status' }, h('p', {}, 'Preparando sua carta…'));
  const actions = h('div', { class: 'btn-row' });
  const note = h('div', { 'aria-live': 'polite' });

  const say = (kind, icon, text) => note.replaceChildren(notice(kind, icon, h('p', {}, text)));

  function download() {
    downloadRecording(url, filename);
    say('info', 'ℹ️', 'O download começou. Procure a imagem na pasta Downloads (no iPhone: app Arquivos). Para guardar no app Fotos, toque em Compartilhar e depois em "Salvar imagem", ou toque e segure a carta.');
  }

  async function share() {
    const result = await shareFile(blob, filename);
    const msg = {
      shared: ['info', '✅', 'Pronto! A carta foi enviada para onde você escolheu.'],
      cancelled: null,
      unsupported: ['error', '⚠️', 'Este aparelho não compartilha imagens daqui. Use "Baixar carta".'],
      failed: ['error', '⚠️', 'Não deu para compartilhar. Tente "Baixar carta".'],
    }[result];
    if (msg) say(...msg); else note.replaceChildren();
  }

  renderCardPng(m.day).then((b) => {
    if (!alive) return;
    blob = b;
    url = URL.createObjectURL(b);
    frame.removeAttribute('role');
    frame.replaceChildren(h('img', { src: url, alt: `Carta do dia ${m.day}: Parabéns! Dia ${m.day} completo. Palavras: ${m.words.map((w) => w.en).join(', ')}.`, width: 1080, height: 1350 }));
    append(actions,
      btn('Baixar carta', { cls: 'btn--gold', icon: '⬇', onClick: download }),
      canShareFiles(globalThis.navigator, 'image/png') ? btn('Compartilhar', { cls: 'btn--small', icon: '📤', onClick: share }) : null);
  }).catch((e) => {
    console.error(e);
    if (alive) frame.replaceChildren(notice('error', '⚠️', h('p', {}, 'Não foi possível desenhar a carta neste navegador.')));
  });

  app.append(h('section', { class: 'cards stack' },
    h('header', { class: 'cards__head' },
      h('h1', {}, `Carta do dia ${m.day}`),
      h('p', {}, `${m.phase.emoji} ${m.phase.village}`)),
    frame, actions, note, back));

  return () => { alive = false; if (url) URL.revokeObjectURL(url); };
}
