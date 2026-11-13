// Shows or hides the persistent YouTube "TV" and explains its state in
// child-friendly Portuguese. The player itself is never covered or hidden
// while playing; when a screen does not need music the TV is paused first.

import { VIDEO_URL } from '../../data/segments.js';
import { h, notice } from './dom.js';

const ERROR_TEXT = {
  offline: 'Sem internet agora. A música volta quando a conexão voltar.',
  'api-timeout': 'O YouTube está demorando para responder.',
  'api-failed': 'Não foi possível carregar o YouTube. Pode ser a internet ou um bloqueador.',
  'embed-blocked': 'O dono deste vídeo não permite tocá-lo fora do YouTube neste site.',
  'not-found': 'O vídeo não está disponível (foi removido ou é privado).',
  referrer: 'O vídeo não abriu porque a página foi aberta como arquivo. Abra o site por http:// ou https://.',
  html5: 'O navegador não conseguiu tocar o vídeo.',
  invalid: 'O vídeo não pôde ser carregado.',
  unknown: 'O vídeo não pôde ser carregado.',
};

const IS_IOS = typeof navigator !== 'undefined'
  && (/iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

export function createMusicTV({ player }) {
  const tv = document.getElementById('music-tv');
  const stage = document.getElementById('stage');
  const status = document.getElementById('tv-status');
  let visible = false;

  function openLink() {
    return h('a', { class: 'btn btn--small btn--berry', href: VIDEO_URL, target: '_blank', rel: 'noopener noreferrer' },
      h('span', { class: 'ico', 'aria-hidden': 'true' }, '▶'), h('span', {}, 'Abrir no YouTube'));
  }

  function render(s) {
    status.replaceChildren();
    if (!visible) return;
    const error = s.offline && s.phase !== 'ready' ? 'offline' : s.error;
    if (s.phase === 'loading') {
      status.append(notice('info', '⏳', h('p', {}, 'Carregando a música…')));
    } else if (error) {
      const retry = ['api-timeout', 'api-failed', 'offline', 'html5', 'unknown'].includes(error)
        ? h('button', { type: 'button', class: 'btn btn--small', onClick: () => player.retry() }, 'Tentar de novo')
        : null;
      status.append(notice('error', '📺',
        h('p', {}, ERROR_TEXT[error] ?? ERROR_TEXT.unknown),
        h('p', {}, 'Os jogos de palavras continuam funcionando.'),
        h('div', { class: 'btn-row' }, retry, openLink())));
    } else if (s.needsTap) {
      status.append(notice('', '👆', h('p', {}, h('strong', {}, 'Toque no vídeo para começar a música.')),
        h('p', {}, 'Alguns celulares pedem um toque no próprio vídeo na primeira vez.')));
    } else if (s.slow) {
      status.append(notice('info', '🐢', h('p', {}, 'A internet está lenta… a música já vai tocar.')));
    } else if (s.offline) {
      status.append(notice('info', '📶', h('p', {}, 'Parece que a internet caiu. Se a música parar, espere a conexão voltar.')));
    } else if (IS_IOS) {
      // A web page cannot unmute the YouTube player when the silent switch is on.
      status.append(h('p', { class: 'tv__tip' }, '🔔 Sem som? Desligue o modo silencioso do iPhone e aumente o volume.'));
    }
  }

  player.subscribe(render);

  return {
    get visible() { return visible; },
    show() {
      visible = true;
      tv.hidden = false;
      stage.classList.add('has-tv');
      player.init();
      render(player.state);
    },
    hide() {
      if (!visible) return;
      player.stop();
      visible = false;
      tv.hidden = true;
      stage.classList.remove('has-tv');
      render(player.state);
    },
  };
}
