// Celebration and adult gate overlays. Both trap focus lightly, close with
// Escape (except mid-celebration) and give focus back to where it was.

import { artSvg } from './illustrations.js';
import { announce, art, btn, h, star } from './dom.js';

const openDismissers = new Set();

/** Closes every open overlay as if Escape was pressed (used on navigation). */
export function closeAllOverlays() {
  for (const dismiss of [...openDismissers]) dismiss();
}

function openOverlay(card, { onEscape } = {}) {
  const root = document.getElementById('overlay-root');
  const previous = document.activeElement;
  const overlay = h('div', { class: 'overlay', role: 'dialog', 'aria-modal': 'true' }, card);
  const onKey = (e) => {
    if (e.key === 'Escape' && onEscape) onEscape();
    if (e.key === 'Tab') {
      const focusables = [...overlay.querySelectorAll('button, a[href], input')].filter((el) => !el.disabled);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };
  overlay.addEventListener('keydown', onKey);
  root.append(overlay);
  const dismiss = () => onEscape?.();
  openDismissers.add(dismiss);
  return () => {
    openDismissers.delete(dismiss);
    overlay.remove();
    if (previous && document.contains(previous)) previous.focus?.();
  };
}

/** Star burst. Resolves when the child taps "Continuar". */
export function celebrate({ title = 'Você ganhou uma estrela!', text = '', seal = null, starWon = true } = {}) {
  return new Promise((resolve) => {
    const sparks = Array.from({ length: 10 }, (_, i) => {
      const angle = (i / 10) * Math.PI * 2;
      const s = star(true, 'spark');
      s.style.setProperty('--dx', `${Math.cos(angle) * 120}px`);
      s.style.setProperty('--dy', `${Math.sin(angle) * 120}px`);
      s.style.animationDelay = `${(i % 3) * 60}ms`;
      return s;
    });
    const burst = h('div', { class: 'celebrate__burst', 'aria-hidden': 'true' },
      seal ? art(artSvg(seal.art)) : h('span', { html: '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z" fill="#E8B23A" stroke="#3A2418" stroke-width="1.2" stroke-linejoin="round"/></svg>' }).firstChild,
      sparks);
    const heading = h('h2', { id: 'celebrate-title' }, title);
    const go = btn('Continuar', { cls: 'btn--pine btn--wide', onClick: () => { close(); resolve(); } });
    const card = h('div', { class: 'overlay__card patch' },
      burst, heading,
      text ? h('p', {}, text) : null,
      seal ? h('p', {}, h('strong', {}, `Novo selo: ${seal.name}!`)) : null,
      !starWon ? h('p', {}, 'Você já tinha esta estrela. Que bom treinar de novo!') : null,
      go);
    const close = openOverlay(card, { onEscape: () => { close(); resolve(); } });
    card.parentElement.setAttribute('aria-labelledby', 'celebrate-title');
    announce(`${title} ${text}`);
    go.focus();
  });
}

let adultUntil = 0;
export const isAdultUnlocked = () => Date.now() < adultUntil;
export function lockAdult() { adultUntil = 0; }

/**
 * "Hold for 2 seconds" gate: easy for an adult, hard to trigger by accident
 * and needs no reading from the child. Unlocks for 10 minutes.
 */
export function requireAdult(reason = 'Esta parte é para um adulto.') {
  if (isAdultUnlocked()) return Promise.resolve(true);
  return new Promise((resolve) => {
    let timer = null;
    const hold = h('button', { type: 'button', class: 'btn btn--gold btn--wide hold-btn' },
      h('span', { class: 'hold-btn__fill', 'aria-hidden': 'true' }),
      h('span', {}, 'Segure aqui por 2 segundos'));
    const startHold = (e) => {
      if (e.type === 'keydown' && ![' ', 'Enter'].includes(e.key)) return;
      if (e.type === 'keydown') { e.preventDefault(); if (e.repeat) return; }
      if (timer) return;
      hold.classList.add('is-holding');
      timer = setTimeout(() => { adultUntil = Date.now() + 10 * 60 * 1000; close(); resolve(true); }, 2000);
    };
    const endHold = () => {
      hold.classList.remove('is-holding');
      clearTimeout(timer);
      timer = null;
    };
    hold.addEventListener('pointerdown', startHold);
    hold.addEventListener('keydown', startHold);
    for (const ev of ['pointerup', 'pointerleave', 'pointercancel', 'keyup', 'blur']) hold.addEventListener(ev, endHold);
    hold.addEventListener('contextmenu', (e) => e.preventDefault());

    const cancel = btn('Voltar', { cls: 'btn--small', onClick: () => { endHold(); close(); resolve(false); } });
    const card = h('div', { class: 'overlay__card patch' },
      h('h2', { id: 'gate-title' }, '🧑 Chame um adulto'),
      h('p', {}, reason),
      hold, cancel);
    const close = openOverlay(card, { onEscape: () => { endHold(); close(); resolve(false); } });
    card.parentElement.setAttribute('aria-labelledby', 'gate-title');
    hold.focus();
  });
}

/** Simple yes/no confirmation for destructive adult actions. */
export function confirmDialog({ title, text, confirmLabel, cancelLabel = 'Cancelar' }) {
  return new Promise((resolve) => {
    const yes = btn(confirmLabel, { cls: 'btn--berry', onClick: () => { close(); resolve(true); } });
    const no = btn(cancelLabel, { cls: 'btn--small', onClick: () => { close(); resolve(false); } });
    const card = h('div', { class: 'overlay__card patch' },
      h('h2', { id: 'confirm-title' }, title), h('p', {}, text),
      h('div', { class: 'btn-row btn-row--center' }, no, yes));
    const close = openOverlay(card, { onEscape: () => { close(); resolve(false); } });
    card.parentElement.setAttribute('aria-labelledby', 'confirm-title');
    no.focus();
  });
}
