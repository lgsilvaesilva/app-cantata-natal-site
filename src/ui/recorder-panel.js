// Record → Stop → Listen → Record again → Download / Share / Delete.
// The recording lives only in this tab's memory (see src/recorder.js).

import { createRecorder, RECORDER_MESSAGES } from '../recorder.js';
import { canShareFiles, downloadRecording, recordingFileName, shareRecording } from '../download.js';
import { btn, h, notice } from './dom.js';
import { audioSession } from '../audio-session.js';

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export function recorderPanel(ctx, {
  kind = 'voz', day = null, maxSeconds = 30, countdown = true, onRecorded = () => {},
  recordLabel = 'Gravar minha voz', beforeRecord = null, onStarted = null,
} = {}) {
  const { coordinator, player } = ctx;
  const root = h('div', { class: 'recorder' });
  const audio = h('audio', { preload: 'auto' });
  let countdownTimer = null;
  let countdownValue = 0;
  let playing = false;
  let saveNote = '';
  const shareSupported = canShareFiles();
  let prevStatus = 'idle';

  const recorder = createRecorder({
    maxSeconds,
    beforeStart: async () => {
      await coordinator.beforeRecord();
      if (beforeRecord) await beforeRecord();
      audioSession.useMic();
    },
    onChange: (s) => {
      if (s.status === 'recording' && prevStatus !== 'recording' && onStarted) onStarted();
      prevStatus = s.status;
      // Mic released: send sound back to the loud speaker (iPhone).
      if (!['requesting-permission', 'recording'].includes(s.status)) audioSession.useSpeaker();
      if (s.status === 'recorded' && s.url) onRecorded(s);
      if (s.status !== 'recorded') { saveNote = ''; stopAudio(); }
      coordinator.notify();
      render();
    },
  });
  const unregister = coordinator.register(recorder);

  audio.addEventListener('ended', () => { playing = false; render(); });
  audio.addEventListener('pause', () => { playing = false; render(); });

  function stopAudio() {
    if (!audio.paused) audio.pause();
    playing = false;
  }

  function cancelCountdown() {
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = null;
    countdownValue = 0;
  }

  function startRecording() {
    cancelCountdown();
    stopAudio();
    recorder.start();
  }

  function beginCountdown() {
    if (!countdown) { startRecording(); return; }
    player.stop();
    countdownValue = 3;
    render();
    countdownTimer = setInterval(() => {
      countdownValue -= 1;
      if (countdownValue <= 0) startRecording(); else render();
    }, 1000);
  }

  function togglePlayback() {
    const { url } = recorder.state;
    if (!url) return;
    if (playing) { stopAudio(); render(); return; }
    player.pause();
    audioSession.useSpeaker();
    if (audio.src !== url) audio.src = url;
    audio.currentTime = 0;
    audio.play().then(() => { playing = true; render(); }).catch(() => {
      saveNote = 'Não foi possível tocar a gravação neste navegador.';
      render();
    });
  }

  function fileName() {
    return recordingFileName({ kind, day, mime: recorder.state.mime });
  }

  function download() {
    downloadRecording(recorder.state.url, fileName());
    saveNote = 'O download começou. Procure o arquivo na pasta Downloads (no iPhone: app Arquivos). A gravação continua aqui até você sair da página.';
    render();
  }

  async function share() {
    const result = await shareRecording(recorder.state.blob, fileName());
    saveNote = {
      shared: 'Pronto! A gravação foi enviada para onde você escolheu.',
      cancelled: 'Compartilhamento cancelado. A gravação continua aqui.',
      unsupported: 'Este aparelho não permite compartilhar o arquivo. Use “Baixar minha gravação”.',
      failed: 'Não foi possível compartilhar. Tente “Baixar minha gravação”.',
    }[result];
    render();
  }

  let lastKey = '';
  let timerEl = null;

  function render() {
    const s = recorder.state;
    const key = [s.status, s.error, s.warning, s.autoStopped, countdownValue, playing, saveNote].join('|');
    if (key === lastKey && timerEl) {
      timerEl.textContent = s.status === 'recording' ? `${fmt(s.seconds)} / ${fmt(maxSeconds)}` : `(${fmt(s.seconds)})`;
      return;
    }
    lastKey = key;
    timerEl = null;
    const parts = [];
    if (countdownValue > 0) {
      parts.push(
        h('p', { class: 'recorder__countdown', 'aria-live': 'assertive' }, String(countdownValue)),
        h('div', { class: 'btn-row btn-row--center' },
          btn('Já!', { cls: 'btn--berry', onClick: startRecording }),
          btn('Cancelar', { cls: 'btn--small', onClick: () => { cancelCountdown(); render(); } })),
      );
    } else if (s.status === 'requesting-permission') {
      parts.push(notice('info', '🎤', h('p', {}, h('strong', {}, 'Toque em “Permitir” para usar o microfone.')),
        h('p', {}, 'O navegador pergunta só para gravar sua voz aqui nesta página.')),
      btn('Cancelar', { cls: 'btn--small', onClick: () => recorder.stop() }));
    } else if (s.status === 'recording') {
      parts.push(
        h('div', { class: 'recorder__status', role: 'status' },
          h('span', { class: 'rec-dot', 'aria-hidden': 'true' }),
          h('span', {}, 'Gravando… '),
          (timerEl = h('span', { class: 'recorder__timer' }, `${fmt(s.seconds)} / ${fmt(maxSeconds)}`))),
        s.warning ? h('p', { class: 'recorder__warn', role: 'alert' }, 'Faltam poucos segundos!') : null,
        btn('Parar', { cls: 'btn--berry btn--wide', icon: '⏹', onClick: () => recorder.stop() }),
      );
    } else if (s.status === 'processing') {
      parts.push(h('p', { class: 'recorder__status', role: 'status' }, 'Preparando sua gravação…'));
    } else if (s.status === 'recorded') {
      parts.push(
        h('p', { class: 'recorder__status', role: 'status' }, '✅ Gravação pronta! ',
          (timerEl = h('span', { class: 'recorder__timer' }, `(${fmt(s.seconds)})`))),
        s.autoStopped ? h('p', {}, 'Paramos automaticamente no tempo máximo.') : null,
        s.error === 'interrupted' ? h('p', {}, RECORDER_MESSAGES.interrupted) : null,
        h('div', { class: 'btn-row' },
          btn(playing ? 'Parar de ouvir' : 'Ouvir minha voz', { cls: 'btn--pine', icon: playing ? '⏹' : '🔊', onClick: togglePlayback }),
          btn('Gravar de novo', { cls: 'btn--small', icon: '🎙', onClick: beginCountdown })),
        h('div', { class: 'btn-row' },
          btn('Baixar minha gravação', { cls: 'btn--small btn--gold', icon: '⬇', onClick: download }),
          shareSupported ? btn('Salvar ou compartilhar', { cls: 'btn--small', icon: '📤', onClick: share }) : null,
          btn('Apagar', { cls: 'btn--small', icon: '🗑', onClick: () => recorder.discard() })),
        saveNote ? h('p', { role: 'status' }, saveNote) : null,
      );
    } else {
      if (s.status === 'error') {
        parts.push(notice('error', '🎤', h('p', {}, RECORDER_MESSAGES[s.error] ?? RECORDER_MESSAGES['record-failed'])));
      }
      parts.push(btn(s.status === 'error' ? 'Tentar gravar de novo' : recordLabel, {
        cls: 'btn--berry btn--wide', icon: '🎙',
        disabled: s.error === 'insecure' || s.error === 'unsupported' ? true : null,
        onClick: beginCountdown,
      }));
    }
    parts.push(h('p', { class: 'recorder__privacy' },
      '🔒 Sua gravação fica apenas nesta página. Para guardá-la, toque em Baixar. Ao atualizar a página, ela desaparece.'));
    root.replaceChildren(...parts.filter(Boolean), audio);
  }

  render();
  return {
    el: root,
    recorder,
    cleanup() {
      cancelCountdown();
      stopAudio();
      audio.removeAttribute('src');
      recorder.destroy();
      unregister();
      coordinator.notify();
    },
  };
}
