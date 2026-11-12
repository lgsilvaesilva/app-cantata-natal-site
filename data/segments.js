// Sections of the school excerpt, in performance order.
//
// Timestamps are NOT invented. An adult calibrates them in the app
// ("Área do adulto → Calibrar trechos"). Calibration is saved on that device;
// to make it the default for every device, copy the "código de calibração"
// shown there and paste it as the value of CALIBRATION below.

export const VIDEO_ID = 'nYmPZrvThW8';
export const VIDEO_URL = `https://www.youtube.com/watch?v=${VIDEO_ID}`;

/** Base sections, in the order they are sung. */
export const SEGMENTS = [
  { id: 'chorus-1', label: 'Refrão de abertura (2×)', hint: 'Santa Claus… (2 vezes)' },
  { id: 'verse1-a', label: 'Estrofe: watch out / not cry', hint: 'watch out · cry' },
  { id: 'verse1-b', label: 'Estrofe: not pout / telling you why', hint: 'pout · why' },
  { id: 'chorus-2', label: 'Refrão (3×)', hint: 'Santa Claus… (3 vezes)' },
  { id: 'list-a', label: 'Lista: making a list / checking it twice', hint: 'list · twice' },
  { id: 'list-b', label: 'Lista: naughty and nice', hint: 'naughty · nice' },
  { id: 'chorus-3', label: 'Refrão com “whoa yeah” (3×)', hint: 'whoa yeah · Santa Claus' },
  { id: 'sleep-a', label: 'Dormindo: sleeping / awake', hint: 'sleeping · awake' },
  { id: 'sleep-b', label: 'Dormindo: bad or good / goodness', hint: 'bad · good · goodness' },
  { id: 'verse2-a', label: 'Estrofe de novo: watch out / not cry', hint: 'watch out · cry' },
  { id: 'verse2-b', label: 'Estrofe de novo: not pout / why', hint: 'pout · why' },
  { id: 'chorus-4', label: 'Refrão com “whoa yeah” e “woo hoo”', hint: 'whoa yeah · woo hoo' },
  { id: 'woohoo', label: 'Woo hoo, woo hoo', hint: 'woo hoo · woo hoo' },
  { id: 'finale', label: 'Refrão final (3×)', hint: 'Santa Claus… (3 vezes)' },
];

/**
 * Longer ranges built from base sections: they start where `from` starts and
 * end where `to` ends, so they need no extra calibration.
 */
export const COMPOSITES = [
  { id: 'verse1', label: 'Estrofe completa', from: 'verse1-a', to: 'verse1-b' },
  { id: 'part1', label: 'Refrão + estrofe + refrão', from: 'chorus-1', to: 'chorus-2' },
  { id: 'list', label: 'Parte da lista completa', from: 'list-a', to: 'list-b' },
  { id: 'start-to-list', label: 'Do início até a lista', from: 'chorus-1', to: 'chorus-3' },
  { id: 'sleep', label: 'Parte dormindo/acordado completa', from: 'sleep-a', to: 'sleep-b' },
  { id: 'verse2', label: 'Estrofe repetida completa', from: 'verse2-a', to: 'verse2-b' },
  { id: 'ending', label: 'Do “sleeping” até o fim', from: 'sleep-a', to: 'finale' },
  { id: 'full', label: 'Trecho completo da escola', from: 'chorus-1', to: 'finale' },
];

/**
 * Default calibration shipped with the app (seconds on the YouTube video).
 *
 * Source: public synced lyrics for this recording on LRCLIB (lrclib.net,
 * e.g. entry 5575665, 144 s). No audio was downloaded or analysed. Each section
 * starts at its first sung line and ends where the next one starts (or ~3.6 s
 * after its last line when an instrumental gap follows).
 * These are ESTIMATES until an adult confirms them by ear in "Calibrar
 * trechos"; the video is 145 s, so a constant offset of up to ~1 s is possible
 * ("Deslocar todos" fixes that in one tap). The recording continues after the
 * school excerpt ("Little tin horns…" at 104.6 s), which is not used.
 *
 * To replace it, paste the code from the calibration screen here.
 */
export const CALIBRATION = {
  video: 'nYmPZrvThW8',
  segments: {
    'chorus-1': [7.0, 13.0], // Santa Claus… ×2
    'verse1-a': [13.0, 16.5], // watch out / not cry
    'verse1-b': [16.5, 19.9], // not pout / telling you why
    'chorus-2': [19.9, 29.9], // Santa Claus… ×3
    'list-a': [32.5, 35.8], // making a list / checking it twice
    'list-b': [35.8, 39.5], // naughty and nice
    'chorus-3': [39.5, 49.3], // … whoa yeah, Santa Claus… ×3
    'sleep-a': [51.8, 58.4], // sleeping / awake
    'sleep-b': [58.4, 64.6], // bad or good / goodness sake (+ echo)
    'verse2-a': [64.6, 68.8], // watch out / not cry
    'verse2-b': [68.8, 71.3], // not pout / telling you why
    'chorus-4': [71.3, 82.9], // … whoa yeah, Santa Claus… ×3
    woohoo: [82.9, 91.7], // woo hoo
    finale: [91.7, 101.4], // Santa Claus… ×3 (end of the school excerpt)
  },
};
