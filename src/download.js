// Explicit, user-triggered saving of a voice recording that lives in memory.
// Nothing here uploads anything: download uses a local object URL and
// "share" hands the file to the operating system's own share sheet.

const MIME_EXTENSIONS = [
  [/^audio\/webm/, 'webm'],
  [/^video\/webm/, 'webm'],
  [/^audio\/(mp4|x-m4a|m4a|aac)/, 'm4a'],
  [/^video\/mp4/, 'mp4'],
  [/^audio\/ogg/, 'ogg'],
  [/^audio\/(wav|wave|x-wav)/, 'wav'],
  [/^audio\/mpeg/, 'mp3'],
];

/** File extension that matches the format the browser actually produced. */
export function extensionForMime(mime, fallback = 'webm') {
  const m = String(mime || '').toLowerCase().trim();
  for (const [re, ext] of MIME_EXTENSIONS) if (re.test(m)) return ext;
  return fallback;
}

const pad = (n) => String(n).padStart(2, '0');

/** Uses the device's local date, e.g. minha-cantata-dia-03-2026-11-11.webm */
export function recordingFileName({ kind = 'cantata', day = null, date = new Date(), mime = '' } = {}) {
  const stamp = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}h${pad(date.getMinutes())}`;
  const base = kind === 'grande-cantata'
    ? 'minha-grande-cantata'
    : `${kind === 'voz' ? 'minha-voz' : 'minha-cantata'}${day ? `-dia-${pad(day)}` : ''}`;
  return `${base}-${stamp}-${time}.${extensionForMime(mime)}`;
}

/**
 * Starts a download through a temporary <a download>. Browsers do not report
 * whether the file was saved, so the caller must not claim it was.
 */
export function downloadRecording(url, filename, doc = document) {
  const a = doc.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.style.display = 'none';
  doc.body.appendChild(a);
  a.click();
  a.remove();
}

export function canShareFiles(nav = globalThis.navigator) {
  try {
    if (!nav?.canShare || typeof File === 'undefined') return false;
    const probe = new File([new Blob(['x'], { type: 'audio/mp4' })], 'probe.m4a', { type: 'audio/mp4' });
    return nav.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

/** Resolves to 'shared' | 'cancelled' | 'unsupported' | 'failed'. Must be called from a click. */
export async function shareRecording(blob, filename, nav = globalThis.navigator) {
  try {
    const file = new File([blob], filename, { type: blob.type || 'application/octet-stream' });
    if (!nav?.canShare?.({ files: [file] })) return 'unsupported';
    await nav.share({ files: [file], title: 'Minha gravação da cantata' });
    return 'shared';
  } catch (e) {
    return e?.name === 'AbortError' ? 'cancelled' : 'failed';
  }
}
