// Tiny DOM helpers. `html` is only used for our own static SVG strings.

export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value == null || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key === 'html') el.innerHTML = value;
    else if (key === 'dataset') Object.assign(el.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2).toLowerCase(), value);
    else if (value === true) el.setAttribute(key, '');
    else el.setAttribute(key, String(value));
  }
  append(el, children);
  return el;
}

/** Like Element.append, but skips null/false (native append would print "null"). */
export function append(el, ...children) {
  for (const child of children.flat(Infinity)) {
    if (child == null || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

export function art(svgString, cls = '') {
  return h('span', { class: `art ${cls}`.trim(), html: svgString, 'aria-hidden': 'true' });
}

const STAR_PATH = 'M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z';
export function star(filled = true, cls = '') {
  return h('span', {
    class: `star ${filled ? '' : 'star--empty'} ${cls}`.trim(),
    'aria-hidden': 'true',
    html: `<svg viewBox="0 0 24 24"><path d="${STAR_PATH}" fill="#E8B23A" stroke="#3A2418" stroke-width="1.6" stroke-linejoin="round"/></svg>`,
  });
}

export function stars(count, total = 4) {
  return h('span', { class: 'stars', role: 'img', 'aria-label': `${count} de ${total} estrelas` },
    Array.from({ length: total }, (_, i) => star(i < count)));
}

export function announce(message) {
  const live = document.getElementById('sr-live');
  if (!live) return;
  live.textContent = '';
  // A new text node after a frame makes screen readers repeat identical messages.
  requestAnimationFrame(() => { live.textContent = message; });
}

export function notice(kind, icon, ...content) {
  return h('div', { class: `notice ${kind ? `notice--${kind}` : ''}` },
    h('span', { class: 'notice__ico', 'aria-hidden': 'true' }, icon),
    h('div', {}, content));
}

export function btn(label, { cls = '', icon = null, onClick, ...rest } = {}) {
  return h('button', { type: 'button', class: `btn ${cls}`.trim(), onClick, ...rest },
    icon ? h('span', { class: 'ico', 'aria-hidden': 'true' }, icon) : null,
    h('span', {}, label));
}

export function linkBtn(label, href, { cls = '', icon = null, ...rest } = {}) {
  return h('a', { class: `btn ${cls}`.trim(), href, ...rest },
    icon ? h('span', { class: 'ico', 'aria-hidden': 'true' }, icon) : null,
    h('span', {}, label));
}
