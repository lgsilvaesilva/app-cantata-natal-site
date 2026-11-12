// Learning progress: completed activities, review words and preferences.
// Stars are derived from completion flags, so repeating an activity can
// never count a star twice.

import { ACTIVITY_KEYS, DAYS, PHASES } from '../data/lessons.js';
import { readJSON } from './storage.js';

export const PROGRESS_KEY = 'csj.progress';
export const PROGRESS_VERSION = 1;
export const TOTAL_DAYS = DAYS.length;
export const MAX_STARS = TOTAL_DAYS * ACTIVITY_KEYS.length;

const DEFAULT_PREFS = { singAlongRecording: false, practiceMaxSeconds: 30, cantataMaxSeconds: 180 };

export function emptyProgress() {
  return { version: PROGRESS_VERSION, started: false, days: {}, review: {}, prefs: { ...DEFAULT_PREFS } };
}

const isDay = (n) => Number.isInteger(n) && n >= 1 && n <= TOTAL_DAYS;

/** Keeps only well-formed fields; anything unexpected is dropped. */
export function sanitizeProgress(raw) {
  const clean = emptyProgress();
  if (!raw || typeof raw !== 'object' || raw.version !== PROGRESS_VERSION) {
    return { progress: clean, recovered: raw != null };
  }
  let recovered = false;
  clean.started = raw.started === true;

  if (raw.days && typeof raw.days === 'object') {
    for (const [key, acts] of Object.entries(raw.days)) {
      const day = Number(key);
      if (!isDay(day) || !acts || typeof acts !== 'object') { recovered = true; continue; }
      const entry = {};
      for (const act of ACTIVITY_KEYS) if (acts[act] === true) entry[act] = true;
      if (Object.keys(entry).length) clean.days[day] = entry;
    }
  }
  if (raw.review && typeof raw.review === 'object') {
    for (const [wordId, r] of Object.entries(raw.review)) {
      if (r && Number.isInteger(r.misses) && r.misses > 0 && isDay(r.lastDay)) {
        clean.review[wordId] = { misses: Math.min(r.misses, 99), lastDay: r.lastDay };
      } else recovered = true;
    }
  }
  if (raw.prefs && typeof raw.prefs === 'object') {
    if (typeof raw.prefs.singAlongRecording === 'boolean') clean.prefs.singAlongRecording = raw.prefs.singAlongRecording;
    for (const k of ['practiceMaxSeconds', 'cantataMaxSeconds']) {
      const v = raw.prefs[k];
      if (Number.isInteger(v) && v >= 10 && v <= 300) clean.prefs[k] = v;
    }
  }
  return { progress: clean, recovered };
}

export function createProgress(storage) {
  const { value, corrupt } = readJSON(storage, PROGRESS_KEY);
  const sanitized = sanitizeProgress(value);
  let state = sanitized.progress;
  const recovered = corrupt || sanitized.recovered;
  const listeners = new Set();

  function save() {
    storage.set(PROGRESS_KEY, JSON.stringify(state));
    for (const fn of listeners) fn(state);
  }

  const isDone = (day, act) => state.days[day]?.[act] === true;
  const starsForDay = (day) => ACTIVITY_KEYS.filter((a) => isDone(day, a)).length;
  const isDayComplete = (day) => starsForDay(day) === ACTIVITY_KEYS.length;

  function sealsEarned() {
    return PHASES.filter((p) => p.days.every(isDayComplete)).map((p) => p.seal);
  }

  return {
    get state() { return state; },
    recovered,
    persistent: storage.persistent,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    isDone,
    starsForDay,
    isDayComplete,
    totalStars: () => DAYS.reduce((sum, d) => sum + starsForDay(d.day), 0),
    completedDays: () => DAYS.filter((d) => isDayComplete(d.day)).length,
    /** The first day not yet complete: the one the map highlights. */
    currentDay() {
      const next = DAYS.find((d) => !isDayComplete(d.day));
      return next ? next.day : TOTAL_DAYS;
    },
    sealsEarned,

    /** Idempotent. Reports what changed so the UI can celebrate only real news. */
    completeActivity(day, act) {
      if (!isDay(day) || !ACTIVITY_KEYS.includes(act)) throw new Error(`invalid activity ${day}/${act}`);
      if (isDone(day, act)) return { newStar: false, dayCompleted: false, seal: null };
      const sealsBefore = sealsEarned().map((s) => s.id);
      state.days[day] = { ...state.days[day], [act]: true };
      state.started = true;
      save();
      const seal = sealsEarned().find((s) => !sealsBefore.includes(s.id)) ?? null;
      return { newStar: true, dayCompleted: isDayComplete(day), seal };
    },

    recordMiss(wordId, day) {
      if (!wordId || !isDay(day)) return;
      const prev = state.review[wordId];
      state.review[wordId] = { misses: Math.min((prev?.misses ?? 0) + 1, 99), lastDay: day };
      save();
    },
    /** A correct answer in review lowers the count; at zero the word leaves the queue. */
    recordReviewHit(wordId) {
      const prev = state.review[wordId];
      if (!prev) return;
      if (prev.misses <= 1) delete state.review[wordId];
      else state.review[wordId] = { ...prev, misses: prev.misses - 1 };
      save();
    },
    /** Up to `limit` words missed on earlier days, most-missed first. */
    reviewWords(day, exclude = [], limit = 2) {
      return Object.entries(state.review)
        .filter(([id, r]) => r.lastDay < day && !exclude.includes(id))
        .sort((a, b) => b[1].misses - a[1].misses || a[1].lastDay - b[1].lastDay || a[0].localeCompare(b[0]))
        .slice(0, limit)
        .map(([id]) => id);
    },

    markStarted() { if (!state.started) { state.started = true; save(); } },
    setPref(key, value) {
      if (!(key in DEFAULT_PREFS)) return;
      state.prefs = { ...state.prefs, [key]: value };
      save();
    },
    reset() {
      const prefs = state.prefs;
      state = emptyProgress();
      state.prefs = prefs;
      save();
    },
  };
}
