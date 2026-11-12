// Hash router (works on any static host and keeps the back button useful).
// Before each screen renders, the previous screen's cleanup runs and all
// sound stops, so no audio or microphone survives navigation.

export function parseHash(hash) {
  const raw = (hash || '').replace(/^#/, '') || '/';
  const [path, qs = ''] = raw.split('?');
  return { path: path.startsWith('/') ? path : `/${path}`, query: new URLSearchParams(qs) };
}

function compile(pattern) {
  const keys = [];
  const re = new RegExp(`^${pattern.replace(/:[a-z]+/g, (m) => { keys.push(m.slice(1)); return '([^/]+)'; })}/?$`);
  return { re, keys };
}

export function createRouter({ routes, notFound, beforeEach }) {
  const table = routes.map(([pattern, screen]) => ({ ...compile(pattern), screen }));
  let cleanup = null;
  let renderId = 0;

  async function render() {
    const id = ++renderId;
    const { path, query } = parseHash(location.hash);
    let match = null;
    for (const r of table) {
      const m = path.match(r.re);
      if (m) { match = { screen: r.screen, params: Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])) }; break; }
    }
    if (typeof cleanup === 'function') { try { cleanup(); } catch (e) { console.error(e); } }
    cleanup = null;
    beforeEach?.(path);
    const screen = match?.screen ?? notFound;
    const result = await screen({ params: match?.params ?? {}, query, path });
    if (id !== renderId) { if (typeof result === 'function') result(); return; }
    cleanup = result;
  }

  return {
    start() {
      window.addEventListener('hashchange', render);
      return render();
    },
    navigate(hash) {
      if (location.hash === hash) render(); else location.hash = hash;
    },
    refresh: render,
  };
}
