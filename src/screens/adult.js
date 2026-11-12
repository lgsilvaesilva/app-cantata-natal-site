// Área do adulto: progress overview, any-day access, settings, privacy and reset.

import { DAYS } from '../../data/lessons.js';
import { VOCAB_BY_ID } from '../../data/vocabulary.js';
import { MAX_STARS } from '../progress.js';
import { btn, h } from '../ui/dom.js';
import { confirmDialog, requireAdult } from '../ui/overlays.js';

export async function adultGuard(ctx) {
  const ok = await requireAdult('A área do adulto tem a calibração da música, privacidade e configurações.');
  if (!ok) ctx.navigate('#/mapa');
  return ok;
}

export async function adultScreen(app, _route, ctx) {
  if (!(await adultGuard(ctx))) return;
  const { progress, segments, storage } = ctx;
  const p = progress.state;
  const uncal = segments.uncalibrated();
  const reviewList = Object.entries(p.review).sort((a, b) => b[1].misses - a[1].misses);

  const singAlong = h('input', { type: 'checkbox', id: 'pref-singalong', checked: p.prefs.singAlongRecording || null });
  singAlong.addEventListener('change', () => progress.setPref('singAlongRecording', singAlong.checked));

  const resetBtn = btn('Recomeçar jornada', {
    cls: 'btn--berry', icon: '🗑',
    onClick: async () => {
      const ok = await confirmDialog({
        title: 'Recomeçar a jornada?',
        text: 'Isso apaga estrelas, dias concluídos e palavras de revisão deste aparelho. Os trechos calibrados da música continuam salvos.',
        confirmLabel: 'Sim, apagar progresso',
      });
      if (ok) { progress.reset(); ctx.navigate('#/'); }
    },
  });

  app.append(h('section', { class: 'adult stack stack--lg' },
    h('header', {}, h('h1', {}, 'Área do adulto'),
      h('p', {}, 'Acompanhe a jornada, configure a música e entenda a privacidade.')),

    !storage.persistent ? h('p', { class: 'banner' }, '⚠️ Este navegador não permite guardar dados (modo privado ou dados bloqueados). O progresso e a calibração valem só nesta sessão.') : null,

    h('section', { class: 'patch stack', 'aria-labelledby': 'a-progress' },
      h('h2', { id: 'a-progress' }, 'Progresso'),
      h('p', {}, `${progress.completedDays()} de ${DAYS.length} dias completos, ${progress.totalStars()} de ${MAX_STARS} estrelas.`),
      h('p', {}, 'Abrir qualquer dia:'),
      h('div', { class: 'day-grid' }, DAYS.map((d) => h('a', {
        class: `btn btn--small ${progress.isDayComplete(d.day) ? 'btn--pine' : ''}`,
        href: `#/dia/${d.day}`, 'aria-label': `Dia ${d.day}: ${progress.starsForDay(d.day)} de 4 estrelas`,
      }, String(d.day)))),
      h('h3', {}, 'Palavras para revisar'),
      reviewList.length
        ? h('ul', { class: 'review-list' }, reviewList.map(([id, r]) => h('li', {}, h('strong', { lang: 'en' }, VOCAB_BY_ID[id]?.en ?? id), ` (${VOCAB_BY_ID[id]?.pt ?? ''}): ${r.misses} ${r.misses === 1 ? 'erro' : 'erros'}`)))
        : h('p', {}, 'Nenhuma por enquanto. As palavras erradas voltam como bônus no dia seguinte.')),

    h('section', { class: 'patch stack', 'aria-labelledby': 'a-music' },
      h('h2', { id: 'a-music' }, 'Música (YouTube)'),
      h('p', {}, uncal.length === 0
        ? 'Todos os trechos estão configurados. ✅'
        : `${14 - uncal.length} de 14 trechos configurados. Os desafios de escuta e canto precisam dos trechos.`),
      h('div', { class: 'btn-row' },
        h('a', { class: 'btn btn--gold', href: '#/adulto/trechos' }, h('span', { class: 'ico', 'aria-hidden': 'true' }, '🎚'), h('span', {}, 'Calibrar trechos')),
        h('a', { class: 'btn btn--small', href: '#/adulto/diagnostico' }, h('span', { class: 'ico', 'aria-hidden': 'true' }, '🩺'), h('span', {}, 'Diagnóstico do aparelho')))),

    h('section', { class: 'patch stack', 'aria-labelledby': 'a-rec' },
      h('h2', { id: 'a-rec' }, 'Gravação'),
      h('label', { class: 'switch', for: 'pref-singalong' }, singAlong,
        h('span', {}, 'Na Grande Cantata, tocar a música durante a gravação (use fones de ouvido)')),
      h('p', {}, 'Sem fones, o som da música vaza para o microfone. A gravação sempre contém só o microfone; nunca a música original.')),

    h('section', { class: 'patch stack', 'aria-labelledby': 'a-privacy' },
      h('h2', { id: 'a-privacy' }, 'Privacidade'),
      h('ul', { class: 'privacy-list' },
        h('li', {}, 'As gravações de voz ficam só na memória desta página. Nada é enviado para servidores. Atualizar ou fechar a página apaga as gravações, exceto as que você baixar.'),
        h('li', {}, 'O navegador guarda apenas o progresso (estrelas, dias, palavras de revisão), preferências e os tempos dos trechos da música.'),
        h('li', {}, 'O app não tem contas, anúncios próprios nem análise de uso.'),
        h('li', {}, 'A música vem do player oficial do YouTube. O YouTube é um serviço do Google: ele pode usar cookies, coletar dados de uso e mostrar anúncios, conforme as regras dele. O player só é carregado quando uma atividade com música é aberta.'))),

    h('section', { class: 'patch stack', 'aria-labelledby': 'a-reset' },
      h('h2', { id: 'a-reset' }, 'Recomeçar'),
      resetBtn)));
}
