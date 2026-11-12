// Device diagnostics: the Milestone 1 evidence tool. Run it on each real
// device (iPhone/Safari, Android/Chrome, desktop) and copy the report.

import { MIME_CANDIDATES, pickMimeType, recorderSupport } from '../recorder.js';
import { canShareFiles } from '../download.js';
import { btn, h } from '../ui/dom.js';
import { recorderPanel } from '../ui/recorder-panel.js';
import { adultGuard } from './adult.js';

// Purely technical test windows on the video timeline (not lyric timestamps).
const TESTS = [{ id: 'teste-a', start: 10, end: 14 }, { id: 'teste-b', start: 60, end: 64 }];

export async function diagnosticsScreen(app, _route, ctx) {
  if (!(await adultGuard(ctx))) return;
  const { player, tts, storage, tv } = ctx;
  tv.show();
  const cleanups = [];
  const results = [];

  const MR = window.MediaRecorder;
  const env = [
    ['Navegador', navigator.userAgent],
    ['Contexto seguro (https/localhost)', String(window.isSecureContext)],
    ['Gravação suportada', recorderSupport(window)],
    ['Formato escolhido', pickMimeType(MR) || '(padrão do navegador)'],
    ...MIME_CANDIDATES.map((m) => [`  ${m}`, MR?.isTypeSupported ? String(MR.isTypeSupported(m)) : 'n/d']),
    ['Compartilhar arquivo (Salvar em Arquivos)', String(canShareFiles())],
    ['Voz do navegador (speechSynthesis)', tts.supported ? `sim, ${tts.voiceCount()} vozes, inglês: ${tts.hasVoice('en')}, português: ${tts.hasVoice('pt')}` : 'não'],
    ['localStorage', storage.persistent ? 'funciona' : 'bloqueado (progresso só nesta sessão)'],
    ['Online', String(navigator.onLine)],
  ];

  const ytInfo = h('dl', { class: 'diag__list' });
  const paintYt = (s) => {
    ytInfo.replaceChildren(
      h('dt', {}, 'Player'), h('dd', {}, `${s.phase}${s.error ? ` (erro: ${s.error})` : ''}`),
      h('dt', {}, 'Estado'), h('dd', {}, s.playback),
      h('dt', {}, 'Duração do vídeo'), h('dd', {}, s.duration ? `${s.duration.toFixed(1)} s` : '—'),
      h('dt', {}, 'Velocidades'), h('dd', {}, (s.rates || []).join(', ')),
      h('dt', {}, 'Pediu toque no vídeo'), h('dd', {}, String(s.needsTap)));
  };
  cleanups.push(player.subscribe(paintYt));

  const log = h('ol', { class: 'diag__log', 'aria-live': 'off' });
  cleanups.push(player.onLog((e) => {
    const { at, msg, ...rest } = e;
    const line = `${(at / 1000).toFixed(2)}s ${msg} ${Object.entries(rest).map(([k, v]) => `${k}=${v}`).join(' ')}`;
    log.prepend(h('li', {}, line));
    while (log.children.length > 60) log.lastChild.remove();
    if (msg === 'start-latency') results.push(`latência para tocar: ${rest.ms} ms`);
    if (msg === 'segment-end' && rest.reason === 'end') results.push(`parada no trecho ${rest.id}: alvo ${rest.target.toFixed(2)} s, parou em ${rest.t} s (desvio ${rest.overshoot} s)`);
    if (msg === 'error') results.push(`erro do YouTube: ${rest.code}`);
    paintResults();
  }));

  const resultsEl = h('ul', { class: 'diag__results' });
  function paintResults() {
    resultsEl.replaceChildren(...results.slice(-12).map((r) => h('li', {}, r)));
  }

  const rec = recorderPanel(ctx, { kind: 'voz', maxSeconds: 15, countdown: false, recordLabel: 'Testar gravação (15 s)' });
  cleanups.push(rec.cleanup);

  const reportBox = h('textarea', { class: 'textarea', readonly: true, rows: '8', id: 'diag-report' });
  const reportMsg = h('p', { role: 'status' });
  function report() {
    const s = player.state;
    const r = rec.recorder.state;
    return [
      `Diagnóstico Missão Cantata — ${new Date().toLocaleString('pt-BR')}`,
      ...env.map(([k, v]) => `${k}: ${v}`),
      `YouTube: ${s.phase}${s.error ? ` erro=${s.error}` : ''}, duração=${s.duration}, velocidades=${(s.rates || []).join('/')}`,
      ...results.map((x) => `- ${x}`),
      `Teste de gravação: ${r.status}${r.mime ? ` formato=${r.mime}` : ''}${r.error ? ` erro=${r.error}` : ''}${r.blob ? ` tamanho=${r.blob.size}B duração=${r.seconds.toFixed(1)}s` : ''}`,
    ].join('\n');
  }

  app.append(h('section', { class: 'diag stack stack--lg' },
    h('header', {},
      h('a', { class: 'btn btn--small', href: '#/adulto' }, 'Voltar à área do adulto'),
      h('h1', {}, 'Diagnóstico do aparelho'),
      h('p', {}, 'Use em cada celular, tablet ou computador para conferir se a música e o microfone funcionam. Nada daqui é enviado: o relatório só aparece na tela para você copiar.')),
    h('section', { class: 'patch stack' }, h('h2', {}, 'Navegador'),
      h('dl', { class: 'diag__list' }, env.flatMap(([k, v]) => [h('dt', {}, k), h('dd', {}, v)]))),
    h('section', { class: 'patch stack' }, h('h2', {}, 'YouTube'),
      ytInfo,
      h('div', { class: 'btn-row' },
        TESTS.map((t) => btn(`Tocar teste ${t.start}–${t.end} s`, { cls: 'btn--small btn--berry', onClick: () => player.playRange(t) })),
        btn('Repetir', { cls: 'btn--small', onClick: () => player.replay() }),
        btn('Parar', { cls: 'btn--small', onClick: () => player.stop() }),
        btn('Recarregar player', { cls: 'btn--small', onClick: () => player.retry() })),
      h('p', {}, 'Esperado: começa em menos de 3 s e para perto do fim do teste (desvio até 0,4 s, já contando a folga de segurança).'),
      resultsEl,
      h('details', {}, h('summary', {}, 'Registro detalhado'), log)),
    h('section', { class: 'patch stack' }, h('h2', {}, 'Microfone'), rec.el),
    h('section', { class: 'patch stack' }, h('h2', {}, 'Relatório'),
      btn('Gerar relatório', {
        cls: 'btn--small btn--gold',
        onClick: async () => {
          reportBox.value = report();
          try { await navigator.clipboard.writeText(reportBox.value); reportMsg.textContent = 'Relatório copiado.'; }
          catch { reportBox.select(); reportMsg.textContent = 'Selecione o texto e copie.'; }
        },
      }),
      reportBox, reportMsg)));
  paintResults();
  return () => cleanups.forEach((fn) => fn());
}
