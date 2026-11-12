// Pure game rules: answers, review items and letter tiles. No DOM here.

import { VOCAB_BY_ID, VOCABULARY } from '../data/vocabulary.js';

export function shuffle(list, rng = Math.random) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** The value a choice item expects. */
export function answerOf(item) {
  if (item.type === 'fill-gap' || item.type === 'listen-count') return item.answer;
  return item.word;
}

export const isCorrect = (item, value) => value === answerOf(item);

// Words whose pictures or meanings are too close to appear as each other's distractors.
const CONFUSABLE = [
  ['naughty', 'bad'], ['nice', 'good', 'goodness'], ['cry', 'pout'], ['woo-hoo', 'whoa-yeah'],
  ['checking', 'list', 'twice'], ['comin', 'santa-claus'],
];

export function areConfusable(a, b) {
  return CONFUSABLE.some((g) => g.includes(a) && g.includes(b));
}

/**
 * A bonus "word-pick" item for a word the child missed before. Distractors
 * come from words already met (phase ≤ current) and never from look-alikes.
 */
export function buildReviewItem(wordId, phase, rng = Math.random) {
  if (!VOCAB_BY_ID[wordId]) return null;
  const pool = VOCABULARY.filter(
    (w) => w.id !== wordId && w.phase <= Math.max(phase, VOCAB_BY_ID[wordId].phase) && !areConfusable(w.id, wordId),
  );
  const distractors = shuffle(pool, rng).slice(0, 2).map((w) => w.id);
  return { type: 'word-pick', word: wordId, options: shuffle([wordId, ...distractors], rng), review: true };
}

/** Items for an activity, with up to two review items before the vocabulary game. */
export function itemsFor(dayData, activity, reviewWordIds = [], rng = Math.random) {
  const own = (dayData[activity] ?? []).map((item) => ({ ...item, options: item.options ? shuffle(item.options, rng) : item.options }));
  if (activity !== 'vocab') return own;
  const review = reviewWordIds.map((id) => buildReviewItem(id, dayData.phase, rng)).filter(Boolean);
  return [...review, ...own];
}

/** Slots and shuffled tiles for a letter-fill item. */
export function letterFillSetup(item, rng = Math.random) {
  const letters = [...item.text];
  const slots = letters.map((ch, i) => ({ ch, missing: item.missing.includes(i) }));
  const needed = item.missing.map((i) => letters[i]);
  const tiles = shuffle([...needed, ...(item.extra ?? [])], rng).map((ch, i) => ({ id: `t${i}`, ch }));
  return { slots, tiles };
}

/** Index of the next empty slot and the letter it expects, or null when complete. */
export function nextMissing(slots, filled) {
  for (let i = 0; i < slots.length; i += 1) {
    if (slots[i].missing && !filled[i]) return { index: i, ch: slots[i].ch };
  }
  return null;
}

export function isSequenceCorrect(expected, tapped) {
  return expected.length === tapped.length && expected.every((id, i) => id === tapped[i]);
}

/** Short PT-BR praise naming the word and its meaning, e.g. "Boa! Town significa cidade!" */
export function praiseFor(item) {
  const w = VOCAB_BY_ID[item.word];
  if (!w) return 'Muito bem!';
  const starts = ['Boa!', 'Isso!', 'Muito bem!', 'Arrasou!'];
  const opener = starts[(w.id.length + (item.type?.length ?? 0)) % starts.length];
  const en = w.en.charAt(0).toUpperCase() + w.en.slice(1);
  return `${opener} ${en} significa ${w.pt.split(' / ')[0]}!`;
}
