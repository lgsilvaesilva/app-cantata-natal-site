// Microphone recording kept only in memory.
//
// States: idle → requesting-permission → recording → processing → recorded
//         any of them → error (recoverable: start() again)
//
// The Blob and its object URL exist only in this tab. They are never written
// to localStorage, IndexedDB, caches or the network. Re-recording or
// discarding revokes the previous URL; the microphone tracks are stopped as
// soon as a recording ends.

// AAC in MP4 (.m4a) first: it is the only format WhatsApp and the Files app on
// iPhone accept. Safari 18.4+ can also record WebM, which they reject, so on
// Apple's WebKit plain MP4 is preferred over WebM too.
export const MIME_CANDIDATES = ['audio/mp4;codecs=mp4a.40.2', 'audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/webm'];
const APPLE_CANDIDATES = ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'];

/** Safari on Mac, or any browser on iPhone/iPad (they all use WebKit). */
export function isAppleWebKit(ua = globalThis.navigator?.userAgent ?? '', touchPoints = globalThis.navigator?.maxTouchPoints ?? 0) {
  if (/iPhone|iPad|iPod/.test(ua)) return true;
  if (/Macintosh/.test(ua) && touchPoints > 1) return true; // iPad asking for the desktop site
  return /Safari\//.test(ua) && !/Chrome|Chromium|CriOS|Edg|Firefox|FxiOS|Android/.test(ua);
}

export const RECORDER_MESSAGES = {
  insecure: 'Para usar o microfone, o site precisa abrir em https:// (ou localhost). Peça ajuda a um adulto.',
  unsupported: 'Este navegador não consegue gravar áudio. Tente o Chrome ou o Safari atualizados.',
  denied: 'O microfone foi bloqueado. Um adulto pode liberar o microfone nas configurações do navegador e tentar de novo.',
  'no-mic': 'Não encontramos um microfone neste aparelho.',
  busy: 'O microfone está sendo usado por outro aplicativo. Feche-o e tente de novo.',
  'record-failed': 'A gravação não funcionou desta vez. Vamos tentar de novo?',
  interrupted: 'A gravação foi interrompida (o microfone foi desligado).',
  empty: 'Não ouvimos nada nesta gravação. Vamos tentar de novo?',
};

export function pickMimeType(MR, apple = isAppleWebKit()) {
  if (!MR || typeof MR.isTypeSupported !== 'function') return '';
  for (const type of apple ? APPLE_CANDIDATES : MIME_CANDIDATES) {
    try {
      if (MR.isTypeSupported(type)) return type;
    } catch { /* ignore */ }
  }
  return '';
}

/** 'ok' | 'insecure' | 'unsupported' — checked before asking for permission. */
export function recorderSupport(env = globalThis) {
  if (env.isSecureContext === false) return 'insecure';
  if (!env.navigator?.mediaDevices?.getUserMedia) return env.isSecureContext ? 'unsupported' : 'insecure';
  if (typeof env.MediaRecorder !== 'function') return 'unsupported';
  return 'ok';
}

function errorCode(e) {
  switch (e?.name) {
    case 'NotAllowedError':
    case 'SecurityError':
    case 'PermissionDeniedError':
      return 'denied';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
    case 'OverconstrainedError':
      return 'no-mic';
    case 'NotReadableError':
    case 'TrackStartError':
    case 'AbortError':
      return 'busy';
    default:
      return 'record-failed';
  }
}

const MIN_BYTES = 1000;
const MIN_SECONDS = 0.3;

export function createRecorder({
  env = globalThis,
  maxSeconds = 30,
  warnSeconds = 5,
  beforeStart = async () => {},
  onChange = () => {},
} = {}) {
  let state = {
    status: 'idle', error: null, url: null, blob: null, mime: '', seconds: 0,
    maxSeconds, warning: false, autoStopped: false,
  };
  let attempt = 0;
  let stream = null;
  let mr = null;
  let chunks = [];
  let startedAt = 0;
  let tick = null;
  let stopWatchdog = null;
  let interrupted = false;
  const now = () => (env.performance?.now ? env.performance.now() : Date.now());

  function set(patch) {
    state = { ...state, ...patch };
    onChange(state);
  }

  function stopTracks() {
    if (stream) for (const t of stream.getTracks()) { t.onended = null; t.stop(); }
    stream = null;
  }

  function clearTimers() {
    if (tick) env.clearInterval(tick);
    if (stopWatchdog) env.clearTimeout(stopWatchdog);
    tick = null;
    stopWatchdog = null;
  }

  function revoke() {
    if (state.url) env.URL.revokeObjectURL(state.url);
  }

  function fail(code) {
    clearTimers();
    stopTracks();
    mr = null;
    chunks = [];
    set({ status: 'error', error: code, url: null, blob: null, warning: false });
  }

  function finalize() {
    if (!mr) return;
    const recorder = mr;
    mr = null;
    clearTimers();
    stopTracks();
    const seconds = (now() - startedAt) / 1000;
    const type = recorder.mimeType || state.mime || chunks[0]?.type || '';
    const blob = new env.Blob(chunks, type ? { type } : undefined);
    chunks = [];
    if (blob.size < MIN_BYTES || seconds < MIN_SECONDS) {
      set({ status: 'error', error: interrupted ? 'interrupted' : 'empty', seconds, warning: false });
      return;
    }
    const url = env.URL.createObjectURL(blob);
    set({ status: 'recorded', error: interrupted ? 'interrupted' : null, blob, url, mime: blob.type || type, seconds, warning: false });
  }

  async function start() {
    if (['requesting-permission', 'recording', 'processing'].includes(state.status)) return;
    const support = recorderSupport(env);
    if (support !== 'ok') { set({ status: 'error', error: support }); return; }

    revoke();
    interrupted = false;
    set({ status: 'requesting-permission', error: null, url: null, blob: null, seconds: 0, warning: false, autoStopped: false });
    const mine = ++attempt;
    try {
      await beforeStart();
      const s = await env.navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      if (mine !== attempt) { for (const t of s.getTracks()) t.stop(); return; }
      stream = s;
    } catch (e) {
      if (mine === attempt) fail(errorCode(e));
      return;
    }

    const mime = pickMimeType(env.MediaRecorder);
    try {
      mr = mime ? new env.MediaRecorder(stream, { mimeType: mime }) : new env.MediaRecorder(stream);
    } catch {
      try { mr = new env.MediaRecorder(stream); } catch { fail('record-failed'); return; }
    }
    chunks = [];
    mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
    mr.onstop = finalize;
    mr.onerror = () => fail('record-failed');
    for (const t of stream.getAudioTracks()) {
      t.onended = () => { if (state.status === 'recording') { interrupted = true; stop(); } };
    }
    try {
      mr.start(1000);
    } catch {
      fail('record-failed');
      return;
    }
    startedAt = now();
    set({ status: 'recording', mime: mr.mimeType || mime, seconds: 0 });
    tick = env.setInterval(() => {
      const seconds = (now() - startedAt) / 1000;
      if (seconds >= maxSeconds) { set({ seconds, autoStopped: true }); stop(); return; }
      set({ seconds, warning: seconds >= maxSeconds - warnSeconds });
    }, 250);
  }

  function stop() {
    if (state.status === 'requesting-permission') {
      attempt += 1; // the pending permission request will release the mic
      set({ status: 'idle' });
      return;
    }
    if (state.status !== 'recording' || !mr) return;
    if (tick) { env.clearInterval(tick); tick = null; }
    set({ status: 'processing', warning: false });
    try {
      if (mr.state !== 'inactive') mr.stop(); else finalize();
    } catch {
      finalize();
      return;
    }
    // Some browsers occasionally never fire `stop`: finish anyway.
    stopWatchdog = env.setTimeout(finalize, 3000);
  }

  function discard() {
    attempt += 1; // cancels a pending permission request, if any
    if (mr) {
      const recorder = mr;
      mr = null;
      recorder.ondataavailable = null;
      recorder.onstop = null;
      recorder.onerror = null;
      try { if (recorder.state !== 'inactive') recorder.stop(); } catch { /* ignore */ }
    }
    chunks = [];
    clearTimers();
    stopTracks();
    revoke();
    set({ status: 'idle', error: null, url: null, blob: null, seconds: 0, warning: false, autoStopped: false });
  }

  return {
    get state() { return state; },
    start,
    stop,
    discard,
    /** Releases everything; used when leaving a screen or closing the tab. */
    destroy() { discard(); },
  };
}
