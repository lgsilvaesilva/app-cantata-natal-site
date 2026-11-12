// The single YouTube IFrame player and song-section playback.
//
// Sections are played with seekTo + playVideo and stopped with pauseVideo by a
// 50 ms poller, instead of `endSeconds`: reaching endSeconds puts the player in
// ENDED, which shows YouTube's end screen and forces a reload for every replay.
// The API does not cut audio precisely, so each range gets a little pre- and
// post-roll and sections are whole musical phrases.
//
// Every request gets a session token; any new play, stop or navigation
// invalidates the previous session, so no orphan timers keep running.

import { VIDEO_ID } from '../data/segments.js';

export const API_SRC = 'https://www.youtube.com/iframe_api';
export const PRE_ROLL = 0.3;
export const POST_ROLL = 0.4;

export const YT_ERROR_CODES = {
  2: 'invalid',
  5: 'html5',
  100: 'not-found',
  101: 'embed-blocked',
  150: 'embed-blocked',
  153: 'referrer',
};

const STATES = { '-1': 'unstarted', 0: 'ended', 1: 'playing', 2: 'paused', 3: 'buffering', 5: 'cued' };

let apiPromise = null;

function loadApi(win, timeoutMs) {
  if (win.YT?.Player) return Promise.resolve(win.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    const timer = win.setTimeout(() => reject(new Error('api-timeout')), timeoutMs);
    const previous = win.onYouTubeIframeAPIReady;
    win.onYouTubeIframeAPIReady = () => {
      win.clearTimeout(timer);
      if (typeof previous === 'function') previous();
      resolve(win.YT);
    };
    const script = win.document.createElement('script');
    script.src = API_SRC;
    script.async = true;
    script.dataset.ytApi = '1';
    script.onerror = () => { win.clearTimeout(timer); reject(new Error('api-failed')); };
    win.document.head.appendChild(script);
  }).catch((e) => {
    apiPromise = null;
    win.document.querySelectorAll('script[data-yt-api]').forEach((s) => s.remove());
    throw e;
  });
  return apiPromise;
}

export function createYouTubePlayer({
  host,
  videoId = VIDEO_ID,
  win = window,
  apiTimeoutMs = 15000,
  startWatchdogMs = 3000,
  slowBufferMs = 8000,
} = {}) {
  let player = null;
  let initPromise = null;
  let session = 0;
  let poll = null;
  let startTimer = null;
  let slowTimer = null;
  let requestedAt = 0;
  let lastRange = null;
  const listeners = new Set();
  const logListeners = new Set();
  const now = () => win.performance.now();

  let state = {
    phase: 'idle', // idle | loading | ready | error
    error: null, // api-timeout | api-failed | embed-blocked | not-found | ...
    playback: 'unstarted',
    needsTap: false,
    slow: false,
    offline: win.navigator?.onLine === false,
    segment: null, // { id, start, end, t }
    duration: 0,
    rates: [1],
    rate: 1,
  };

  function set(patch) {
    state = { ...state, ...patch };
    for (const fn of listeners) fn(state);
  }
  function log(msg, data = {}) {
    const entry = { at: Math.round(now()), msg, ...data };
    for (const fn of logListeners) fn(entry);
  }

  win.addEventListener('online', () => set({ offline: false }));
  win.addEventListener('offline', () => set({ offline: true }));

  function clearTimers() {
    if (poll) win.clearInterval(poll);
    if (startTimer) win.clearTimeout(startTimer);
    if (slowTimer) win.clearTimeout(slowTimer);
    poll = null; startTimer = null; slowTimer = null;
  }

  function endSession(reason) {
    if (!state.segment) { clearTimers(); return; }
    const t = safe(() => player.getCurrentTime(), state.segment.t);
    log('segment-end', { reason, id: state.segment.id, t: +t.toFixed(3), target: state.segment.end, overshoot: +(t - state.segment.end).toFixed(3) });
    clearTimers();
    session += 1;
    set({ segment: null, needsTap: false, slow: false });
  }

  function safe(fn, fallback) {
    try { return fn(); } catch { return fallback; }
  }

  function onStateChange(e) {
    const playback = STATES[e.data] ?? 'unstarted';
    log('state', { playback, t: +safe(() => player.getCurrentTime(), 0).toFixed(2) });
    if (playback === 'playing') {
      if (requestedAt) { log('start-latency', { ms: Math.round(now() - requestedAt) }); requestedAt = 0; }
      if (slowTimer) { win.clearTimeout(slowTimer); slowTimer = null; }
      set({ playback, needsTap: false, slow: false, duration: safe(() => player.getDuration(), state.duration) || state.duration });
      return;
    }
    if (playback === 'buffering') {
      if (!slowTimer) slowTimer = win.setTimeout(() => { slowTimer = null; if (state.playback === 'buffering') set({ slow: true }); }, slowBufferMs);
    } else if (slowTimer) { win.clearTimeout(slowTimer); slowTimer = null; }
    set({ playback, slow: playback === 'buffering' ? state.slow : false });
    if (playback === 'ended') endSession('ended');
  }

  function onError(e) {
    const code = YT_ERROR_CODES[e.data] ?? 'unknown';
    log('error', { code, raw: e.data });
    clearTimers();
    set({ error: code, segment: null, needsTap: false });
  }

  function init() {
    if (initPromise) return initPromise;
    set({ phase: 'loading', error: null });
    log('init');
    initPromise = loadApi(win, apiTimeoutMs).then((YT) => new Promise((resolve, reject) => {
      const readyTimer = win.setTimeout(() => reject(new Error('api-timeout')), apiTimeoutMs);
      player = new YT.Player(host, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          playsinline: 1, // stay inside the page on iPhone
          rel: 0, // related videos only from the same channel
          iv_load_policy: 3,
          enablejsapi: 1,
          origin: win.location.origin,
        },
        events: {
          onReady: () => {
            win.clearTimeout(readyTimer);
            const rates = safe(() => player.getAvailablePlaybackRates(), [1]) || [1];
            set({ phase: 'ready', duration: safe(() => player.getDuration(), 0) || 0, rates });
            log('ready', { duration: state.duration, rates: rates.join(',') });
            resolve();
          },
          onStateChange,
          onError,
          onPlaybackRateChange: (ev) => set({ rate: ev.data }),
        },
      });
    })).catch((e) => {
      const code = e.message === 'api-timeout' || e.message === 'api-failed' ? e.message : 'api-failed';
      log('error', { code });
      initPromise = null;
      set({ phase: 'error', error: win.navigator?.onLine === false ? 'offline' : code });
      throw e;
    });
    return initPromise;
  }

  async function ensureReady() {
    try {
      await init();
      return state.phase === 'ready';
    } catch {
      return false;
    }
  }

  /**
   * Plays [start, end] (seconds). Resolves to false if the player is not
   * usable. The caller must invoke this from a click so mobile browsers allow
   * sound; if they still block it, `needsTap` asks the child to tap the video.
   */
  async function playRange(range) {
    lastRange = range;
    const mine = ++session;
    clearTimers();
    if (!(await ensureReady()) || mine !== session) return false;
    if (state.error && ['embed-blocked', 'not-found', 'invalid', 'referrer'].includes(state.error)) return false;

    const duration = state.duration || safe(() => player.getDuration(), 0) || Infinity;
    const start = Math.max(0, range.start - PRE_ROLL);
    const end = Math.min(duration, range.end + POST_ROLL);
    set({ segment: { id: range.id ?? null, start, end, t: start }, needsTap: false, slow: false, error: null });
    log('play-range', { id: range.id, start, end });
    requestedAt = now();
    player.seekTo(start, true);
    player.playVideo();

    let seenInside = false;
    startTimer = win.setTimeout(() => {
      if (mine !== session) return;
      if (state.playback !== 'playing' && state.playback !== 'buffering') { set({ needsTap: true }); log('needs-tap'); }
    }, startWatchdogMs);

    poll = win.setInterval(() => {
      if (mine !== session) { win.clearInterval(poll); return; }
      const t = safe(() => player.getCurrentTime(), start);
      if (t >= start - 0.5 && t <= end) seenInside = true;
      set({ segment: { ...state.segment, t } });
      if (state.playback === 'playing' && t >= end - 0.08 * (state.rate || 1)) {
        player.pauseVideo();
        endSession('end');
      } else if (seenInside && (t > end + 2 || t < start - 2)) {
        endSession('user-seek'); // the child moved the video timeline: let them
      }
    }, 50);
    return true;
  }

  return {
    get state() { return state; },
    subscribe(fn) { listeners.add(fn); fn(state); return () => listeners.delete(fn); },
    onLog(fn) { logListeners.add(fn); return () => logListeners.delete(fn); },
    init: ensureReady,
    playRange,
    replay: () => (lastRange ? playRange(lastRange) : Promise.resolve(false)),
    pause() { if (player && state.phase === 'ready') safe(() => player.pauseVideo()); },
    resume() {
      if (!player || state.phase !== 'ready') return;
      requestedAt = now();
      safe(() => player.playVideo());
    },
    /** Pauses and forgets the current section. */
    stop() {
      if (player && state.phase === 'ready' && ['playing', 'buffering'].includes(state.playback)) safe(() => player.pauseVideo());
      endSession('stop');
    },
    setRate(r) { if (player && state.rates.includes(r)) safe(() => player.setPlaybackRate(r)); set({ rate: r }); },
    getCurrentTime: () => (player ? safe(() => player.getCurrentTime(), 0) : 0),
    getDuration: () => (player ? safe(() => player.getDuration(), 0) : 0),
    /** Free playback for the calibration screen. */
    seekTo(t) { if (player) safe(() => player.seekTo(Math.max(0, t), true)); },
    play() { if (player) { requestedAt = now(); safe(() => player.playVideo()); } },
    async retry() {
      initPromise = null;
      if (player) { safe(() => player.destroy()); player = null; }
      const fresh = win.document.createElement('div');
      fresh.id = host.id || 'yt-host';
      const current = win.document.getElementById(fresh.id);
      if (current) current.replaceWith(fresh);
      host = fresh;
      return ensureReady();
    },
  };
}
