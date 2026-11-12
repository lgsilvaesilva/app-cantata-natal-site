// Hand-made SVG illustrations in a "felt patch" style, returned as strings.
// Emotion and state words (cry, pout, naughty, nice, sleeping, awake) get
// custom faces because emoji differ between phones and could mislead;
// simple objects use emoji on a felt badge.

const INK = '#3A2418';
const SKIN = '#F7D3B4';
const CHEEK = '#F29C9C';
const RED = '#C8283C';
const GOLD = '#E8B23A';
const PINE = '#1F5C45';
const SNOW = '#FBF8F2';
const SKY = '#5B8FD6';

const svg = (body, { bg = null, stitch = true } = {}) => `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${
  bg ? `<circle cx="60" cy="60" r="56" fill="${bg}"/>` : ''
}${stitch && bg ? `<circle cx="60" cy="60" r="50" fill="none" stroke="${SNOW}" stroke-width="2" stroke-dasharray="5 5" opacity=".7"/>` : ''}${body}</svg>`;

const emoji = (char, bg, size = 58) => svg(
  `<text x="60" y="62" text-anchor="middle" dominant-baseline="central" font-size="${size}" font-family="'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif">${char}</text>`,
  { bg },
);

// ── Faces ────────────────────────────────────────────────────────────────
const head = `<circle cx="60" cy="64" r="34" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>`;
const cheeks = `<circle cx="40" cy="74" r="6" fill="${CHEEK}" opacity=".8"/><circle cx="80" cy="74" r="6" fill="${CHEEK}" opacity=".8"/>`;
const dotEyes = `<circle cx="48" cy="60" r="4" fill="${INK}"/><circle cx="72" cy="60" r="4" fill="${INK}"/>`;
const closedEyes = `<path d="M41 60 q7 6 14 0 M65 60 q7 6 14 0" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
const sadEyes = `<path d="M41 62 q7 -6 14 0 M65 62 q7 -6 14 0" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
const smile = `<path d="M46 76 q14 14 28 0" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`;

const FACES = {
  'face-cry': svg(`${head}${sadEyes}
    <path d="M47 84 q13 -10 26 0" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M44 66 q-5 10 0 16 q5 -6 0 -16z" fill="${SKY}" stroke="${INK}" stroke-width="1.5"/>
    <path d="M76 66 q-5 10 0 16 q5 -6 0 -16z" fill="${SKY}" stroke="${INK}" stroke-width="1.5"/>`, { bg: '#CFE0F5' }),
  'face-pout': svg(`${head}
    <path d="M40 50 l14 5 M80 50 l-14 5" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>${dotEyes}
    <ellipse cx="60" cy="81" rx="9" ry="6" fill="${RED}" stroke="${INK}" stroke-width="2.5"/>
    <path d="M28 70 q-6 -4 -2 -10 M92 70 q6 -4 2 -10" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>`, { bg: '#F5D9C9' }),
  'face-naughty': svg(`
    <path d="M36 38 l-6 -18 l16 10z M84 38 l6 -18 l-16 10z" fill="${RED}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
    ${head}${cheeks}
    <circle cx="48" cy="60" r="4" fill="${INK}"/><path d="M66 60 q6 -5 12 0" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
    <path d="M44 74 q18 14 32 -4" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`, { bg: '#F8D6A0' }),
  'face-nice': svg(`
    <ellipse cx="60" cy="24" rx="22" ry="6" fill="none" stroke="${GOLD}" stroke-width="5"/>
    ${head}${cheeks}${closedEyes}${smile}`, { bg: '#D9EDDC' }),
  'face-sleeping': svg(`
    ${head}${closedEyes.replace(/q7 6 14 0/g, 'q7 5 14 0')}
    <path d="M52 80 q8 4 16 0" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
    <path d="M28 44 q32 -40 64 0 q-32 -10 -64 0z" fill="${RED}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="95" cy="44" r="6" fill="${SNOW}" stroke="${INK}" stroke-width="2"/>
    <text x="92" y="26" font-family="Grandstander, sans-serif" font-weight="800" font-size="18" fill="${INK}">z</text>
    <text x="102" y="14" font-family="Grandstander, sans-serif" font-weight="800" font-size="13" fill="${INK}">z</text>`, { bg: '#C9CFEA' }),
  'face-awake': svg(`
    <g stroke="${GOLD}" stroke-width="5" stroke-linecap="round"><path d="M60 6 v10 M20 22 l7 7 M100 22 l-7 7 M8 62 h10 M102 62 h10"/></g>
    ${head}
    <circle cx="48" cy="58" r="8" fill="#fff" stroke="${INK}" stroke-width="2.5"/><circle cx="72" cy="58" r="8" fill="#fff" stroke="${INK}" stroke-width="2.5"/>
    <circle cx="48" cy="58" r="3.5" fill="${INK}"/><circle cx="72" cy="58" r="3.5" fill="${INK}"/>
    <ellipse cx="60" cy="81" rx="9" ry="7" fill="${RED}" stroke="${INK}" stroke-width="2.5"/>`, { bg: '#FBE7B0' }),
};

const SANTA = svg(`
  <path d="M30 52 q30 -48 64 -8 l-6 10 q-26 -18 -54 4z" fill="${RED}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <circle cx="96" cy="42" r="8" fill="${SNOW}" stroke="${INK}" stroke-width="2.5"/>
  <circle cx="60" cy="66" r="24" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>
  <path d="M34 70 q2 34 26 36 q24 -2 26 -36 q-12 10 -26 8 q-14 2 -26 -8z" fill="${SNOW}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <rect x="28" y="48" width="64" height="12" rx="6" fill="${SNOW}" stroke="${INK}" stroke-width="3"/>
  <circle cx="51" cy="66" r="3.5" fill="${INK}"/><circle cx="69" cy="66" r="3.5" fill="${INK}"/>
  <circle cx="60" cy="74" r="5" fill="${CHEEK}" stroke="${INK}" stroke-width="2"/>
  <path d="M50 82 q10 6 20 0" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>`, { bg: '#F6D6D6' });

const TWICE = svg(`
  <rect x="26" y="22" width="68" height="78" rx="8" fill="${SNOW}" stroke="${INK}" stroke-width="3"/>
  <path d="M36 50 l8 8 l14 -16 M36 80 l8 8 l14 -16" fill="none" stroke="${PINE}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="80" y="60" text-anchor="middle" font-family="Grandstander, sans-serif" font-weight="800" font-size="30" fill="${RED}">2×</text>`, { bg: '#D9EDDC' });

// ── Activity gifts ───────────────────────────────────────────────────────
const gift = (box, ribbon, char) => `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <g class="gift-lid"><path d="M60 26 q-22 -22 -26 -4 q4 10 26 4 q22 6 26 -4 q-4 -18 -26 4z" fill="${ribbon}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <rect x="14" y="26" width="92" height="22" rx="6" fill="${box}" stroke="${INK}" stroke-width="3"/>
  <rect x="52" y="26" width="16" height="22" fill="${ribbon}" stroke="${INK}" stroke-width="3"/></g>
  <rect x="20" y="48" width="80" height="60" rx="6" fill="${box}" stroke="${INK}" stroke-width="3"/>
  <rect x="52" y="48" width="16" height="60" fill="${ribbon}" stroke="${INK}" stroke-width="3"/>
  <circle cx="60" cy="80" r="19" fill="${SNOW}" stroke="${INK}" stroke-width="3"/>
  <text x="60" y="81" text-anchor="middle" dominant-baseline="central" font-size="22" font-family="'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif">${char}</text>
</svg>`;

const SEALS = {
  'seal-bell': '🔔', 'seal-eyes': '👀', 'seal-list': '📜', 'seal-moon': '🌙', 'seal-star': '🌟',
};
const seal = (char) => `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <path d="M60 4 l13 12 l17 -3 l5 16 l16 7 l-4 17 l9 15 l-13 11 l1 17 l-17 4 l-8 15 l-16 -6 l-16 6 l-8 -15 l-17 -4 l1 -17 l-13 -11 l9 -15 l-4 -17 l16 -7 l5 -16 l17 3z" fill="${GOLD}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <circle cx="60" cy="62" r="34" fill="${SNOW}" stroke="${INK}" stroke-width="2.5" stroke-dasharray="4 4"/>
  <text x="60" y="63" text-anchor="middle" dominant-baseline="central" font-size="38" font-family="'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif">${char}</text>
</svg>`;

const LIBRARY = {
  santa: SANTA,
  town: emoji('🏘️', '#DCE7F3'),
  sleigh: emoji('🛷', '#F6E3C4'),
  eyes: emoji('👀', '#FBE7B0'),
  question: emoji('❓', '#F5D9C9'),
  list: emoji('📜', '#F6E3C4'),
  check: emoji('✅', '#D9EDDC'),
  twice: TWICE,
  'thumbs-up': emoji('👍', '#D9EDDC'),
  'thumbs-down': emoji('👎', '#F5D9C9'),
  heart: emoji('💖', '#F6D6D6'),
  party: emoji('🎉', '#FBE7B0'),
  cheer: emoji('🙌', '#F8D6A0'),
  ...FACES,
  'gift-words': gift(RED, GOLD, '🔤'),
  'gift-listen': gift(PINE, RED, '👂'),
  'gift-speak': gift('#2F5FA8', GOLD, '🗣️'),
  'gift-sing': gift(GOLD, RED, '🎤'),
  ...Object.fromEntries(Object.entries(SEALS).map(([k, c]) => [k, seal(c)])),
};

export const ART = Object.keys(LIBRARY);

export function artSvg(key) {
  return LIBRARY[key] ?? emoji('⭐', '#FBE7B0');
}
