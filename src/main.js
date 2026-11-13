// App entry: builds the shared context once and wires screens to routes.

import { createStorage } from './storage.js';
import { createProgress, MAX_STARS } from './progress.js';
import { createSegmentStore } from './segments.js';
import { createYouTubePlayer } from './youtube-player.js';
import { createTTS } from './tts.js';
import { createCoordinator } from './audio-coordinator.js';
import { createMusicTV } from './ui/music-tv.js';
import { createRouter } from './router.js';
import { append, h, star } from './ui/dom.js';
import { artSvg } from './ui/illustrations.js';
import { closeAllOverlays, isAdultUnlocked } from './ui/overlays.js';
import { audioSession } from './audio-session.js';

import { welcomeScreen } from './screens/welcome.js';
import { mapScreen } from './screens/map.js';
import { missionScreen } from './screens/mission.js';
import { activityScreen } from './screens/activity.js';
import { cantataScreen } from './screens/cantata.js';
import { adultScreen } from './screens/adult.js';
import { calibrateScreen } from './screens/calibrate.js';
import { diagnosticsScreen } from './screens/diagnostics.js';

audioSession.useSpeaker();

const storage = createStorage();
const progress = createProgress(storage);
const segments = createSegmentStore(storage);
const player = createYouTubePlayer({ host: document.getElementById('yt-host') });
const tts = createTTS();
const coordinator = createCoordinator({ player, tts });
const tv = createMusicTV({ player });
const app = document.getElementById('app');
const topbar = document.getElementById('topbar');

const ctx = {
  app, storage, progress, segments, player, tts, coordinator, tv,
  navigate: (hash) => router.navigate(hash),
};

function renderTopbar(path) {
  const isAdult = path.startsWith('/adulto');
  document.body.classList.toggle('theme-night', isAdult);
  if (path === '/') { topbar.hidden = true; return; }
  topbar.hidden = false;
  const total = progress.totalStars();
  // append() skips null; native replaceChildren would print "null".
  topbar.replaceChildren();
  append(topbar,
    h('a', { class: 'topbar__home', href: '#/mapa', 'aria-label': 'Voltar ao mapa da jornada' },
      h('span', { html: artSvg('santa'), 'aria-hidden': 'true' }),
      h('span', {}, isAdult ? '← Voltar ao jogo' : 'Mapa')),
    h('span', { class: 'topbar__spacer' }),
    // An adult who opened a day from the adult area needs a way back to it.
    !isAdult && isAdultUnlocked()
      ? h('a', { class: 'topbar__adult', href: '#/adulto' }, '🔑 Adulto')
      : null,
    h('span', { class: 'star-count', role: 'img', 'aria-label': `${total} de ${MAX_STARS} estrelas` },
      star(true), h('span', { 'aria-hidden': 'true' }, `${total}/${MAX_STARS}`)),
  );
}

const wrap = (screen) => async (route) => {
  app.replaceChildren();
  const cleanup = await screen(app, route, ctx);
  // Move focus to the new heading so screen readers announce the screen.
  const heading = app.querySelector('h1');
  if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
  window.scrollTo(0, 0);
  return cleanup;
};

const router = createRouter({
  routes: [
    ['/', wrap(welcomeScreen)],
    ['/mapa', wrap(mapScreen)],
    ['/dia/:day', wrap(missionScreen)],
    ['/dia/:day/:act', wrap(activityScreen)],
    ['/cantata', wrap(cantataScreen)],
    ['/adulto', wrap(adultScreen)],
    ['/adulto/trechos', wrap(calibrateScreen)],
    ['/adulto/diagnostico', wrap(diagnosticsScreen)],
  ],
  notFound: wrap(mapScreen),
  beforeEach(path) {
    closeAllOverlays();
    coordinator.stopAll();
    tv.hide();
    renderTopbar(path);
  },
});

progress.subscribe(() => renderTopbar(location.hash.replace(/^#/, '').split('?')[0] || '/'));

// Leaving or hiding the page must release the microphone immediately.
window.addEventListener('pagehide', () => coordinator.stopAll());
document.addEventListener('visibilitychange', () => {
  if (document.hidden && coordinator.isRecording()) coordinator.stopRecordings();
});

router.start();
