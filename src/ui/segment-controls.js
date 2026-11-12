// "Ouvir trecho / Pausar / De novo / Devagar" for one song section.
// If the section is not calibrated yet, it says so honestly and points the
// adult to the calibration screen instead of faking any audio.

import { append, btn, h, notice } from './dom.js';

export function segmentControls(segmentId, ctx, { label = 'Ouvir a música', onPlayed = () => {}, compact = false } = {}) {
  const { player, segments, coordinator } = ctx;
  const range = segments.resolve(segmentId);
  const root = h('div', { class: 'segment-controls' });

  if (!range) {
    root.append(notice('', '🙋',
      h('p', {}, h('strong', {}, 'Peça a um adulto para configurar este trecho da música.')),
      h('p', {}, `Trecho: ${segments.meta(segmentId)?.label ?? segmentId}`),
      h('a', { class: 'btn btn--small', href: `#/adulto/trechos?foco=${encodeURIComponent(segmentId)}` }, 'Configurar trechos (adulto)')));
    return { el: root, cleanup() {}, calibrated: false };
  }

  let mine = false;
  let slow = false;
  const hint = h('p', { class: 'recorder__warn', role: 'status' });
  const bar = h('div', { class: 'segment-progress__bar' });
  const progress = h('div', { class: 'segment-progress', role: 'progressbar', 'aria-label': 'Andamento do trecho', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '0' }, bar);

  const playBtn = btn(label, { cls: 'btn--berry', icon: '▶', onClick: () => play() });
  const pauseBtn = btn('Pausar', { cls: 'btn--small', icon: '⏸', onClick: () => player.pause() });
  const resumeBtn = btn('Continuar', { cls: 'btn--small', icon: '▶', onClick: () => player.resume() });
  const againBtn = btn('De novo', { cls: 'btn--small', icon: '↺', onClick: () => play() });
  const slowBtn = btn('Devagar', {
    cls: 'btn--small toggle-chip', icon: '🐢', 'aria-pressed': 'false',
    onClick: () => {
      slow = !slow;
      slowBtn.setAttribute('aria-pressed', String(slow));
      player.setRate(slow ? 0.75 : 1);
    },
  });

  async function play() {
    hint.textContent = '';
    if (!coordinator.canPlayMusic()) {
      hint.textContent = 'Termine a gravação primeiro (toque em Parar).';
      return;
    }
    coordinator.beforeMusic();
    mine = true;
    if (player.state.rates.includes(0.75)) player.setRate(slow ? 0.75 : 1);
    const ok = await player.playRange(range);
    if (ok) onPlayed();
  }

  function render(s) {
    const active = mine && s.segment && s.segment.id === segmentId;
    const playing = active && ['playing', 'buffering'].includes(s.playback);
    playBtn.hidden = Boolean(active);
    pauseBtn.hidden = !playing;
    resumeBtn.hidden = !(active && s.playback === 'paused');
    againBtn.hidden = !active;
    slowBtn.hidden = !(s.rates || []).includes(0.75);
    if (active) {
      const pct = Math.max(0, Math.min(100, ((s.segment.t - s.segment.start) / (s.segment.end - s.segment.start)) * 100));
      bar.style.width = `${pct}%`;
      progress.setAttribute('aria-valuenow', String(Math.round(pct)));
    } else if (!s.segment) {
      bar.style.width = mine ? '100%' : '0%';
      progress.setAttribute('aria-valuenow', mine ? '100' : '0');
    }
  }

  append(root,
    h('div', { class: 'btn-row' }, playBtn, pauseBtn, resumeBtn, againBtn, slowBtn),
    compact ? null : progress,
    hint,
  );
  const unsub = player.subscribe(render);
  return {
    el: root,
    calibrated: true,
    play,
    cleanup() { unsub(); if (mine && player.state.segment?.id === segmentId) player.stop(); },
  };
}
