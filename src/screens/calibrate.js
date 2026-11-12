// Calibration of song sections by an adult. Only timestamps are stored.
// Quick mode: play the song and tap once at the start of each section; the
// end of each section is the start of the next. Then fine-tune any row.

import { SEGMENTS } from '../../data/segments.js';
import { btn, h } from '../ui/dom.js';
import { adultGuard } from './adult.js';

const fmt = (t) => (Number.isFinite(t) ? t.toFixed(1).replace('.', ',') : '—');
const parseNum = (v) => {
  const s = String(v).trim().replace(',', '.');
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
};

export async function calibrateScreen(app, { query }, ctx) {
  if (!(await adultGuard(ctx))) return;
  const { player, segments, tv } = ctx;
  tv.show();
  const cleanups = [];

  // ── Transport ──
  const clock = h('output', { class: 'calib__clock', 'aria-live': 'off' }, '—');
  const ticker = setInterval(() => {
    clock.textContent = player.state.phase === 'ready' ? `${fmt(player.getCurrentTime())} s` : '—';
  }, 100);
  cleanups.push(() => clearInterval(ticker));
  const transport = h('div', { class: 'btn-row' },
    btn('Tocar', { cls: 'btn--small btn--pine', icon: '▶', onClick: () => player.play() }),
    btn('Pausar', { cls: 'btn--small', icon: '⏸', onClick: () => player.pause() }),
    btn('−5 s', { cls: 'btn--small', onClick: () => player.seekTo(player.getCurrentTime() - 5) }),
    btn('+5 s', { cls: 'btn--small', onClick: () => player.seekTo(player.getCurrentTime() + 5) }),
    btn('Início', { cls: 'btn--small', icon: '⏮', onClick: () => player.seekTo(0) }));

  // ── Rows ──
  const rows = new Map();
  function makeRow(seg) {
    const start = h('input', { class: 'input', type: 'text', inputmode: 'decimal', id: `s-${seg.id}`, 'aria-describedby': `m-${seg.id}` });
    const end = h('input', { class: 'input', type: 'text', inputmode: 'decimal', id: `e-${seg.id}`, 'aria-describedby': `m-${seg.id}` });
    const msg = h('p', { class: 'calib__msg', id: `m-${seg.id}`, role: 'status' });
    const chip = h('span', { class: 'calib__chip' });
    const save = (patch) => {
      const err = segments.set(seg.id, patch, player.getDuration());
      msg.textContent = err ?? 'Salvo ✓';
      msg.classList.toggle('is-error', Boolean(err));
      refresh();
    };
    const onInput = (input, key) => input.addEventListener('change', () => {
      const v = parseNum(input.value);
      if (Number.isNaN(v)) { msg.textContent = 'Use só números, por exemplo 12,5.'; msg.classList.add('is-error'); return; }
      save({ [key]: v });
    });
    onInput(start, 'start');
    onInput(end, 'end');
    const row = h('li', { class: 'calib__row', id: `row-${seg.id}` },
      h('div', { class: 'calib__row-head' }, h('h3', {}, seg.label), chip),
      h('div', { class: 'calib__fields' },
        h('div', { class: 'field' }, h('label', { for: `s-${seg.id}` }, 'Início (s)'), start,
          btn('Início = agora', { cls: 'btn--small', onClick: () => save({ start: player.getCurrentTime() }) })),
        h('div', { class: 'field' }, h('label', { for: `e-${seg.id}` }, 'Fim (s)'), end,
          btn('Fim = agora', { cls: 'btn--small', onClick: () => save({ end: player.getCurrentTime() }) }))),
      h('div', { class: 'btn-row' },
        btn('Ouvir trecho', {
          cls: 'btn--small btn--berry', icon: '▶',
          onClick: async () => {
            const r = segments.resolve(seg.id);
            if (!r) { msg.textContent = 'Defina início e fim primeiro.'; msg.classList.add('is-error'); return; }
            await player.playRange(r);
          },
        }),
        btn('Limpar', { cls: 'btn--small', onClick: () => { segments.clear(seg.id); msg.textContent = 'Trecho limpo.'; msg.classList.remove('is-error'); refresh(); } })),
      msg);
    rows.set(seg.id, { row, start, end, chip });
    return row;
  }

  // ── Quick mode ──
  let quickIndex = 0;
  const quickBtn = btn('', { cls: 'btn--gold btn--wide calib__quick-btn' });
  const quickMsg = h('p', { role: 'status', class: 'calib__msg' });
  const undoBtn = btn('Desfazer última marca', { cls: 'btn--small', icon: '↩' });
  function paintQuick() {
    quickBtn.lastChild.textContent = quickIndex < SEGMENTS.length
      ? `Começou: ${SEGMENTS[quickIndex].label}`
      : quickIndex === SEGMENTS.length ? 'Terminou o trecho da escola' : 'Marcação completa ✓';
    quickBtn.disabled = quickIndex > SEGMENTS.length;
    undoBtn.disabled = quickIndex === 0;
  }
  quickBtn.addEventListener('click', () => {
    const t = player.getCurrentTime();
    if (player.state.phase !== 'ready') { quickMsg.textContent = 'Espere o vídeo carregar e toque em Tocar.'; return; }
    const err = [];
    if (quickIndex > 0) err.push(segments.set(SEGMENTS[quickIndex - 1].id, { end: t }, player.getDuration()));
    if (quickIndex < SEGMENTS.length) err.push(segments.set(SEGMENTS[quickIndex].id, { start: t, end: null }, player.getDuration()));
    const firstErr = err.find(Boolean);
    if (firstErr) { quickMsg.textContent = `Não marquei: ${firstErr}`; return; }
    quickMsg.textContent = `Marcado em ${fmt(t)} s.`;
    quickIndex += 1;
    paintQuick();
    refresh();
  });
  undoBtn.addEventListener('click', () => {
    if (quickIndex === 0) return;
    quickIndex -= 1;
    if (quickIndex < SEGMENTS.length) segments.set(SEGMENTS[quickIndex].id, { start: null, end: null });
    if (quickIndex > 0) segments.set(SEGMENTS[quickIndex - 1].id, { end: null });
    quickMsg.textContent = 'Última marca desfeita.';
    paintQuick();
    refresh();
  });

  // ── Export / import ──
  const exportBox = h('textarea', { class: 'textarea', readonly: true, id: 'calib-export', rows: '3' });
  const importBox = h('textarea', { class: 'textarea', id: 'calib-import', rows: '3', placeholder: '{"video":"nYmPZrvThW8","segments":{…}}' });
  const ioMsg = h('p', { role: 'status', class: 'calib__msg' });
  const copyBtn = btn('Copiar código', {
    cls: 'btn--small', icon: '📋',
    onClick: async () => {
      try { await navigator.clipboard.writeText(exportBox.value); ioMsg.textContent = 'Código copiado.'; }
      catch { exportBox.select(); ioMsg.textContent = 'Não consegui copiar sozinho: o código está selecionado, copie manualmente.'; }
    },
  });
  const importBtn = btn('Usar este código', {
    cls: 'btn--small btn--pine',
    onClick: () => {
      try {
        const { imported, errors } = segments.importCode(importBox.value);
        ioMsg.textContent = `${imported} trecho(s) importado(s).${errors.length ? ` Ignorados: ${errors.join(', ')}.` : ''}`;
        refresh();
      } catch (e) { ioMsg.textContent = e.message; }
    },
  });

  const summary = h('p', { role: 'status' });
  function refresh() {
    const list = segments.list();
    for (const s of list) {
      const r = rows.get(s.id);
      if (!r) continue;
      if (document.activeElement !== r.start) r.start.value = s.start == null ? '' : fmt(s.start);
      if (document.activeElement !== r.end) r.end.value = s.end == null ? '' : fmt(s.end);
      r.chip.textContent = s.calibrated ? '✓ pronto' : 'falta configurar';
      r.chip.classList.toggle('is-ok', s.calibrated);
      r.row.classList.toggle('is-ok', s.calibrated);
    }
    const ok = list.filter((s) => s.calibrated).length;
    summary.textContent = `${ok} de ${list.length} trechos configurados.`;
    exportBox.value = segments.exportCode();
  }

  app.append(h('section', { class: 'calib stack stack--lg' },
    h('header', {},
      h('a', { class: 'btn btn--small', href: '#/adulto' }, 'Voltar à área do adulto'),
      h('h1', {}, 'Calibrar trechos da música'),
      h('p', {}, 'Marque onde cada parte do trecho da escola começa e termina no vídeo. Só os tempos (números) ficam salvos neste aparelho; nenhum áudio é salvo.'),
      summary),
    h('section', { class: 'patch stack', 'aria-labelledby': 'c-transport' },
      h('h2', { id: 'c-transport' }, 'Vídeo'),
      h('p', {}, 'Tempo atual: ', clock),
      transport),
    h('section', { class: 'patch stack', 'aria-labelledby': 'c-quick' },
      h('h2', { id: 'c-quick' }, 'Modo rápido'),
      h('ol', {},
        h('li', {}, 'Toque em Tocar (acima) e deixe a música correr desde o começo do trecho da escola.'),
        h('li', {}, 'Toque no botão amarelo no momento em que cada parte começa.'),
        h('li', {}, 'No fim, toque em “Terminou o trecho da escola”. Depois ajuste os números abaixo, se precisar.')),
      quickBtn, h('div', { class: 'btn-row' }, undoBtn), quickMsg),
    h('section', { class: 'stack', 'aria-labelledby': 'c-rows' },
      h('h2', { id: 'c-rows', class: 'on-dark' }, 'Ajuste fino'),
      h('ol', { class: 'calib__rows' }, SEGMENTS.map(makeRow))),
    h('section', { class: 'patch stack', 'aria-labelledby': 'c-io' },
      h('h2', { id: 'c-io' }, 'Levar para outro aparelho'),
      h('p', {}, 'Copie o código e cole em outro aparelho em “Usar este código”. Para deixar a calibração como padrão para todos, cole o código no arquivo data/segments.js, em CALIBRATION.'),
      h('label', { for: 'calib-export', class: 'field' }, 'Código de calibração deste aparelho'), exportBox,
      h('div', { class: 'btn-row' }, copyBtn),
      h('label', { for: 'calib-import', class: 'field' }, 'Colar código de outro aparelho'), importBox,
      h('div', { class: 'btn-row' }, importBtn), ioMsg)));

  // Resume quick mode where the calibration stopped.
  const list = segments.list();
  const firstMissing = list.findIndex((s) => s.start == null);
  quickIndex = firstMissing === -1 ? (list[list.length - 1].end == null ? SEGMENTS.length : SEGMENTS.length + 1) : firstMissing;
  paintQuick();
  refresh();
  cleanups.push(segments.subscribe(refresh));

  const focus = query.get('foco');
  if (focus && rows.get(focus)) {
    rows.get(focus).row.classList.add('is-focus');
    setTimeout(() => rows.get(focus)?.row.scrollIntoView({ block: 'center' }), 50);
  }
  return () => cleanups.forEach((fn) => fn());
}

