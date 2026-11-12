import { MAX_STARS } from '../progress.js';
import { artSvg } from '../ui/illustrations.js';
import { btn, h } from '../ui/dom.js';
import { requireAdult } from '../ui/overlays.js';

export function welcomeScreen(app, _route, ctx) {
  const { progress, navigate, tts } = ctx;
  const started = progress.state.started || progress.totalStars() > 0;

  const say = tts.supported
    ? h('button', {
      type: 'button', class: 'say-btn', 'aria-label': 'Ouvir as instruções',
      onClick: () => tts.speak('Vamos aprender a música do Papai Noel! Toque no botão vermelho para começar.', { lang: 'pt', rate: 1 }),
    }, h('span', { class: 'ico', 'aria-hidden': 'true' }, '🔊'), 'Ouvir')
    : null;

  app.append(h('section', { class: 'welcome' },
    h('div', { class: 'welcome__sky', 'aria-hidden': 'true' },
      h('span', { class: 'welcome__sleigh', html: artSvg('santa') })),
    h('div', { class: 'welcome__card patch' },
      h('p', { class: 'welcome__kicker' }, 'Christmas Singing Journey'),
      h('h1', { class: 'welcome__title' }, 'Missão Cantata de Natal'),
      h('p', { class: 'welcome__lead' },
        '15 dias de jogos para aprender as palavras e cantar ',
        h('span', { lang: 'en' }, 'Santa Claus Is Coming to Town'), '.'),
      h('ul', { class: 'welcome__how', 'aria-label': 'Como funciona' },
        h('li', {}, h('span', { 'aria-hidden': 'true' }, '🎁'), 'Abra 4 presentes por dia'),
        h('li', {}, h('span', { 'aria-hidden': 'true' }, '⭐'), `Ganhe estrelas (até ${MAX_STARS})`),
        h('li', {}, h('span', { 'aria-hidden': 'true' }, '🎤'), 'Cante na Grande Cantata')),
      h('div', { class: 'btn-row btn-row--center' },
        btn(started ? 'Continuar a aventura' : 'Começar a aventura', {
          cls: 'btn--berry welcome__go', icon: '🎄',
          onClick: () => { progress.markStarted(); navigate('#/mapa'); },
        }),
        say),
      h('button', {
        type: 'button', class: 'linklike welcome__adult',
        onClick: async () => { if (await requireAdult('A área do adulto tem a calibração da música, privacidade e configurações.')) navigate('#/adulto'); },
      }, 'Área do adulto'))));
}
