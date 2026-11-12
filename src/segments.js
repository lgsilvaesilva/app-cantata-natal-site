// Song section timestamps: shipped defaults (data/segments.js CALIBRATION)
// merged with the adult's calibration saved on this device. Only numbers are
// stored — never audio.

import { CALIBRATION, COMPOSITES, SEGMENTS, VIDEO_ID } from '../data/segments.js';
import { readJSON } from './storage.js';

export const segmentsKey = (videoId) => `csj.segments.${videoId}`;

const round1 = (n) => Math.round(n * 10) / 10;
const isTime = (n) => typeof n === 'number' && Number.isFinite(n) && n >= 0;

/** Returns a PT-BR error message, or null when the range is valid. */
export function validateRange(start, end, duration) {
  if (start != null && !isTime(start)) return 'O início precisa ser um número igual ou maior que zero.';
  if (end != null && !isTime(end)) return 'O fim precisa ser um número igual ou maior que zero.';
  if (start != null && end != null && !(start < end)) return 'O início precisa vir antes do fim.';
  if (duration > 0) {
    if (start != null && start > duration) return `O início passa do fim do vídeo (${duration.toFixed(1)} s).`;
    if (end != null && end > duration + 0.5) return `O fim passa do fim do vídeo (${duration.toFixed(1)} s).`;
  }
  return null;
}

function parseCode(code, videoId) {
  const obj = typeof code === 'string' ? JSON.parse(code) : code;
  if (!obj || typeof obj !== 'object' || obj.video !== videoId || typeof obj.segments !== 'object') {
    throw new Error('Este código não é deste vídeo.');
  }
  return obj.segments;
}

export function createSegmentStore(storage, {
  videoId = VIDEO_ID, segments = SEGMENTS, composites = COMPOSITES, calibration = CALIBRATION,
} = {}) {
  const key = segmentsKey(videoId);
  const baseIds = new Set(segments.map((s) => s.id));
  const listeners = new Set();

  const defaults = {};
  if (calibration) {
    try {
      for (const [id, pair] of Object.entries(parseCode(calibration, videoId))) {
        if (baseIds.has(id) && Array.isArray(pair) && !validateRange(pair[0], pair[1])) {
          defaults[id] = { start: pair[0], end: pair[1] };
        }
      }
    } catch { /* invalid shipped calibration is ignored */ }
  }

  let local = {};
  const { value } = readJSON(storage, key);
  if (value && typeof value === 'object') {
    for (const [id, v] of Object.entries(value)) {
      if (!baseIds.has(id) || !v || typeof v !== 'object') continue;
      const start = isTime(v.start) ? v.start : null;
      const end = isTime(v.end) ? v.end : null;
      if (!validateRange(start, end)) local[id] = { start, end };
    }
  }

  function save() {
    storage.set(key, JSON.stringify(local));
    for (const fn of listeners) fn();
  }

  function base(id) {
    const d = defaults[id] ?? { start: null, end: null };
    const l = local[id];
    return l ? { start: l.start, end: l.end } : { ...d };
  }

  function meta(id) {
    return segments.find((s) => s.id === id) ?? composites.find((c) => c.id === id) ?? null;
  }

  /** Playable range for a base or composite segment, or null if not calibrated. */
  function resolve(id) {
    const m = meta(id);
    if (!m) return null;
    let start; let end;
    if (baseIds.has(id)) ({ start, end } = base(id));
    else { start = base(m.from).start; end = base(m.to).end; }
    if (start == null || end == null || !(start < end)) return null;
    return { id, label: m.label, start, end };
  }

  return {
    videoId,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    meta,
    resolve,
    isCalibrated: (id) => resolve(id) != null,
    /** Base sections with their current values, for the calibration screen. */
    list() {
      return segments.map((s) => {
        const v = base(s.id);
        return { ...s, ...v, calibrated: v.start != null && v.end != null && v.start < v.end, source: local[s.id] ? 'local' : defaults[s.id] ? 'default' : null };
      });
    },
    uncalibrated() { return segments.filter((s) => !resolve(s.id)).map((s) => s.id); },

    /** Partial updates allowed (e.g. only `start` while tapping along). */
    set(id, patch, duration) {
      if (!baseIds.has(id)) return 'Trecho desconhecido.';
      const cur = base(id);
      const next = {
        start: 'start' in patch ? (patch.start == null ? null : round1(patch.start)) : cur.start,
        end: 'end' in patch ? (patch.end == null ? null : round1(patch.end)) : cur.end,
      };
      const err = validateRange(next.start, next.end, duration);
      if (err) return err;
      local[id] = next;
      save();
      return null;
    },
    clear(id) {
      if (id) delete local[id]; else local = {};
      save();
    },
    /**
     * Moves every calibrated section by `delta` seconds, for when the whole
     * calibration is early or late by the same amount. Returns an error or null.
     */
    shiftAll(delta, duration) {
      const next = {};
      for (const s of segments) {
        const v = base(s.id);
        if (v.start == null || v.end == null) continue;
        const start = round1(v.start + delta);
        const end = round1(v.end + delta);
        const err = validateRange(start, end, duration);
        if (err) return `${s.label}: ${err}`;
        next[s.id] = { start, end };
      }
      local = { ...local, ...next };
      save();
      return null;
    },
    /** 'local' (set on this device), 'default' (shipped estimate) or null. */
    sourceOf: (id) => (local[id] ? 'local' : defaults[id] ? 'default' : null),

    exportCode() {
      const out = {};
      for (const s of segments) {
        const v = base(s.id);
        if (v.start != null && v.end != null && v.start < v.end) out[s.id] = [v.start, v.end];
      }
      return JSON.stringify({ video: videoId, segments: out });
    },
    /** Returns { imported, errors[] }. Throws a PT-BR message on unreadable codes. */
    importCode(code) {
      let parsed;
      try {
        parsed = parseCode(code, videoId);
      } catch (e) {
        throw new Error(e instanceof SyntaxError ? 'Não consegui ler este código. Copie e cole de novo.' : e.message);
      }
      let imported = 0;
      const errors = [];
      for (const [id, pair] of Object.entries(parsed)) {
        if (!baseIds.has(id) || !Array.isArray(pair)) { errors.push(id); continue; }
        if (validateRange(pair[0], pair[1]) || pair[0] == null || pair[1] == null) { errors.push(id); continue; }
        local[id] = { start: round1(pair[0]), end: round1(pair[1]) };
        imported += 1;
      }
      if (imported) save();
      return { imported, errors };
    },
  };
}
