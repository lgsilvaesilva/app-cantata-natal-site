// The 15-day journey. Pure data: no logic lives here.
//
// Activity item types (see src/exercises/):
//   vocab:  word-pick       picture shown → choose the English word        { word, options[vocabIds] }
//           picture-pick    English word (and 🔊) → choose the picture      { word, options[vocabIds] }
//           fill-gap        short phrase with ___ → choose the word         { word, phrase, options[text], answer }
//           letter-fill     word with missing letters → tap the letters     { word, text, missing[indexes], extra[letters] }
//   listen: listen-identify play a section → which word/picture did you hear { segment, word, show, options, prompt? }
//           listen-count    play a section → how many times?                { segment, word, what, options[text], answer }
//           listen-next     play a section → what comes after X?            { segment, word, after, show, options }
//           listen-sequence play a section → tap the pictures in order      { segment, order[vocabIds] }
//   pronounce: { phrase, word, segment? }  (model = browser voice; optional song section)
//   sing.steps: { segment, support: 'card'|'keywords'|'none', keywords[], art[], repeats? }
//
// Song text appears only as short fragments needed for the exercises.

export const ACTIVITY_KEYS = ['vocab', 'listen', 'pronounce', 'sing'];

export const ACTIVITY_INFO = {
  vocab: { title: 'Complete a palavra', short: 'Palavras', icon: 'gift-words' },
  listen: { title: 'Desafio de escuta', short: 'Ouvir', icon: 'gift-listen' },
  pronounce: { title: 'Desafio de pronúncia', short: 'Falar', icon: 'gift-speak' },
  sing: { title: 'Desafio da cantata', short: 'Cantar', icon: 'gift-sing' },
};

export const PHASES = [
  { id: 1, days: [1, 2, 3], emoji: '🎅', title: 'Papai Noel chegando', village: 'Vila do Trenó',
    seal: { id: 'bell', name: 'Selo do Sino', art: 'seal-bell' } },
  { id: 2, days: [4, 5, 6], emoji: '👀', title: 'Fique atento', village: 'Vila dos Olhinhos',
    seal: { id: 'eyes', name: 'Selo dos Olhos Atentos', art: 'seal-eyes' } },
  { id: 3, days: [7, 8, 9], emoji: '📝', title: 'A lista', village: 'Vila da Lista',
    seal: { id: 'list', name: 'Selo da Lista', art: 'seal-list' } },
  { id: 4, days: [10, 11, 12], emoji: '😴', title: 'Dormindo ou acordado', village: 'Vila da Lua',
    seal: { id: 'moon', name: 'Selo da Lua', art: 'seal-moon' } },
  { id: 5, days: [13, 14, 15], emoji: '🎤', title: 'O espetáculo', village: 'Vila do Palco',
    seal: { id: 'star', name: 'Selo da Grande Cantata', art: 'seal-star' } },
];

export const DAYS = [
  // ───────────────────────── Fase 1 · Papai Noel chegando ─────────────────────────
  {
    day: 1, phase: 1, focus: ['santa-claus', 'town'],
    goal: 'Ouvir e cantar o refrão com ajuda',
    vocab: [
      { type: 'word-pick', word: 'santa-claus', options: ['santa-claus', 'town', 'list'] },
      { type: 'word-pick', word: 'town', options: ['town', 'cry', 'nice'] },
      { type: 'picture-pick', word: 'santa-claus', options: ['santa-claus', 'town', 'sleeping'] },
    ],
    listen: [
      { type: 'listen-identify', segment: 'chorus-1', word: 'town', show: 'word', options: ['town', 'cry', 'list'] },
      { type: 'listen-identify', segment: 'chorus-1', word: 'santa-claus', show: 'picture',
        options: ['santa-claus', 'list', 'sleeping'],
        prompt: 'Quem está chegando? Ouça e escolha a figura.' },
    ],
    pronounce: [
      { phrase: 'Santa Claus', word: 'santa-claus' },
      { phrase: 'town', word: 'town' },
    ],
    sing: {
      steps: [
        { segment: 'chorus-1', support: 'card', keywords: ['Santa Claus', 'town'], art: ['santa', 'town'], repeats: 2 },
        { segment: 'chorus-1', support: 'card', keywords: ['Santa Claus', 'town'], art: ['santa', 'town'] },
      ],
    },
  },
  {
    day: 2, phase: 1, focus: ['comin', 'town'],
    goal: 'Cantar o refrão no ritmo da gravação',
    vocab: [
      { type: 'word-pick', word: 'comin', options: ['comin', 'watch-out', 'list'] },
      { type: 'picture-pick', word: 'town', options: ['town', 'santa-claus', 'sleeping'] },
      { type: 'word-pick', word: 'santa-claus', options: ['santa-claus', 'why', 'twice'] },
    ],
    listen: [
      { type: 'listen-identify', segment: 'chorus-1', word: 'comin', show: 'picture', options: ['comin', 'sleeping', 'cry'],
        prompt: 'O que o Papai Noel está fazendo? Ouça e escolha.' },
      { type: 'listen-identify', segment: 'chorus-2', word: 'town', show: 'word', options: ['town', 'pout', 'list'] },
    ],
    pronounce: [
      { phrase: "comin' to town", word: 'comin', say: 'coming to town' },
      { phrase: "Santa Claus is comin' to town", word: 'comin', say: 'Santa Claus is coming to town', segment: 'chorus-1' },
    ],
    sing: {
      steps: [
        { segment: 'chorus-1', support: 'card', keywords: ['Santa Claus', "comin' to town"], art: ['santa', 'sleigh'], repeats: 2 },
        { segment: 'chorus-2', support: 'card', keywords: ['Santa Claus', "comin' to town"], art: ['santa', 'sleigh'] },
      ],
    },
  },
  {
    day: 3, phase: 1, focus: ['santa-claus', 'comin', 'town'],
    goal: 'Cantar o refrão com menos ajuda',
    vocab: [
      { type: 'picture-pick', word: 'comin', options: ['comin', 'list', 'cry'] },
      { type: 'word-pick', word: 'town', options: ['town', 'nice', 'why'] },
      { type: 'picture-pick', word: 'santa-claus', options: ['santa-claus', 'town', 'awake'] },
    ],
    listen: [
      { type: 'listen-identify', segment: 'chorus-2', word: 'santa-claus', show: 'word', options: ['santa-claus', 'naughty', 'sleeping'] },
      { type: 'listen-identify', segment: 'finale', word: 'town', show: 'picture', options: ['town', 'list', 'cry'],
        prompt: 'Para onde o Papai Noel está vindo? Ouça e escolha.' },
    ],
    pronounce: [
      { phrase: "Santa Claus is comin' to town", word: 'comin', say: 'Santa Claus is coming to town', segment: 'chorus-1' },
      { phrase: 'to town', word: 'town' },
    ],
    sing: {
      steps: [
        { segment: 'chorus-1', support: 'keywords', keywords: ['Santa Claus', 'town'], art: ['santa', 'town'], repeats: 2 },
        { segment: 'chorus-2', support: 'none', keywords: [], art: ['santa'] },
      ],
    },
  },

  // ───────────────────────── Fase 2 · Fique atento ─────────────────────────
  {
    day: 4, phase: 2, focus: ['watch-out', 'cry'],
    goal: 'Cantar o começo da estrofe',
    vocab: [
      { type: 'word-pick', word: 'watch-out', options: ['watch-out', 'town', 'nice'] },
      { type: 'word-pick', word: 'cry', options: ['cry', 'list', 'santa-claus'] },
      { type: 'fill-gap', word: 'cry', phrase: 'You better not ___', options: ['cry', 'town', 'list'], answer: 'cry' },
    ],
    listen: [
      { type: 'listen-identify', segment: 'verse1-a', word: 'cry', show: 'word', options: ['cry', 'list', 'town'] },
      { type: 'listen-identify', segment: 'verse1-a', word: 'watch-out', show: 'word', options: ['watch-out', 'checking'],
        prompt: 'Qual destas duas você ouviu?' },
    ],
    pronounce: [
      { phrase: 'watch out', word: 'watch-out', segment: 'verse1-a' },
      { phrase: 'You better not cry', word: 'cry' },
    ],
    sing: {
      steps: [
        { segment: 'verse1-a', support: 'card', keywords: ['watch out', 'not cry'], art: ['eyes', 'face-cry'], repeats: 2 },
        { segment: 'chorus-1', support: 'keywords', keywords: ['Santa Claus', 'town'], art: ['santa'] },
      ],
    },
  },
  {
    day: 5, phase: 2, focus: ['pout', 'why'],
    goal: 'Juntar as quatro frases da estrofe',
    vocab: [
      { type: 'word-pick', word: 'pout', options: ['pout', 'why', 'town'] },
      { type: 'word-pick', word: 'why', options: ['why', 'list', 'nice'] },
      { type: 'fill-gap', word: 'why', phrase: "I'm telling you ___", options: ['why', 'town', 'list'], answer: 'why' },
    ],
    listen: [
      { type: 'listen-identify', segment: 'verse1-b', word: 'pout', show: 'picture', options: ['pout', 'santa-claus', 'list'] },
      { type: 'listen-sequence', segment: 'verse1', order: ['cry', 'pout'] },
    ],
    pronounce: [
      { phrase: 'not pout', word: 'pout' },
      { phrase: "I'm telling you why", word: 'why', segment: 'verse1-b' },
    ],
    sing: {
      steps: [
        { segment: 'verse1-b', support: 'card', keywords: ['not pout', 'why'], art: ['face-pout', 'question'], repeats: 2 },
        { segment: 'verse1', support: 'card', keywords: ['watch out', 'cry', 'pout', 'why'], art: ['eyes', 'face-cry', 'face-pout', 'question'] },
      ],
    },
  },
  {
    day: 6, phase: 2, focus: ['watch-out', 'cry', 'pout', 'why'],
    goal: 'Estrofe + refrão',
    vocab: [
      { type: 'fill-gap', word: 'watch-out', phrase: 'You better watch ___', options: ['out', 'town', 'twice'], answer: 'out' },
      { type: 'picture-pick', word: 'cry', options: ['cry', 'santa-claus', 'list'] },
      { type: 'fill-gap', word: 'pout', phrase: 'You better not ___', options: ['pout', 'list', 'town'], answer: 'pout' },
    ],
    listen: [
      { type: 'listen-sequence', segment: 'verse1', order: ['watch-out', 'cry', 'pout'] },
      { type: 'listen-identify', segment: 'verse1-b', word: 'why', show: 'word', options: ['why', 'nice'],
        prompt: 'Qual destas duas você ouviu?' },
      { type: 'listen-identify', segment: 'chorus-2', word: 'town', show: 'picture', options: ['town', 'pout', 'list'] },
    ],
    pronounce: [
      { phrase: 'You better watch out', word: 'watch-out', segment: 'verse1-a' },
      { phrase: 'You better not pout', word: 'pout' },
    ],
    sing: {
      steps: [
        { segment: 'verse1', support: 'keywords', keywords: ['watch out', 'cry', 'pout', 'why'], art: ['eyes', 'face-cry', 'face-pout', 'question'] },
        { segment: 'part1', support: 'keywords', keywords: ['Santa Claus', 'watch out', 'cry', 'pout', 'why'], art: ['santa', 'eyes'] },
      ],
    },
  },

  // ───────────────────────── Fase 3 · A lista ─────────────────────────
  {
    day: 7, phase: 3, focus: ['list', 'twice'],
    goal: 'Cantar o começo da parte da lista',
    vocab: [
      { type: 'word-pick', word: 'list', options: ['list', 'cry', 'awake'] },
      { type: 'word-pick', word: 'twice', options: ['twice', 'why', 'town'] },
      { type: 'letter-fill', word: 'list', text: 'list', missing: [1], extra: ['a', 'o'] },
    ],
    listen: [
      { type: 'listen-identify', segment: 'list-a', word: 'list', show: 'picture', options: ['list', 'town', 'cry'] },
      { type: 'listen-identify', segment: 'list-a', word: 'twice', show: 'word', options: ['twice', 'nice'],
        prompt: 'Elas rimam! Qual destas duas você ouviu?' },
    ],
    pronounce: [
      { phrase: 'making a list', word: 'list', segment: 'list-a' },
      { phrase: 'checking it twice', word: 'twice' },
    ],
    sing: {
      steps: [
        { segment: 'list-a', support: 'card', keywords: ['list', 'twice'], art: ['list', 'twice'], repeats: 2 },
        { segment: 'list-a', support: 'keywords', keywords: ['list', 'twice'], art: ['list'] },
      ],
    },
  },
  {
    day: 8, phase: 3, focus: ['naughty', 'nice'],
    goal: 'Completar a parte da lista',
    vocab: [
      { type: 'word-pick', word: 'naughty', options: ['naughty', 'nice', 'why'] },
      { type: 'word-pick', word: 'nice', options: ['nice', 'naughty', 'town'] },
      { type: 'fill-gap', word: 'nice', phrase: "who's naughty and ___", options: ['nice', 'cry', 'list'], answer: 'nice' },
    ],
    listen: [
      { type: 'listen-identify', segment: 'list-b', word: 'naughty', show: 'word', options: ['naughty', 'cry', 'awake'] },
      { type: 'listen-sequence', segment: 'list-b', order: ['naughty', 'nice'] },
    ],
    pronounce: [
      { phrase: 'naughty', word: 'naughty' },
      { phrase: 'naughty and nice', word: 'nice', segment: 'list-b' },
    ],
    sing: {
      steps: [
        { segment: 'list-b', support: 'card', keywords: ['naughty', 'nice'], art: ['face-naughty', 'face-nice'], repeats: 2 },
        { segment: 'list', support: 'card', keywords: ['list', 'twice', 'naughty', 'nice'], art: ['list', 'twice', 'face-naughty', 'face-nice'] },
      ],
    },
  },
  {
    day: 9, phase: 3, focus: ['list', 'twice', 'naughty', 'nice'],
    goal: 'Cantar do começo até a lista',
    vocab: [
      { type: 'letter-fill', word: 'twice', text: 'twice', missing: [2], extra: ['a', 'e'] },
      { type: 'fill-gap', word: 'list', phrase: "He's making a ___", options: ['list', 'nice', 'awake'], answer: 'list' },
      { type: 'picture-pick', word: 'naughty', options: ['naughty', 'sleeping', 'santa-claus'] },
    ],
    listen: [
      { type: 'listen-sequence', segment: 'list', order: ['list', 'twice', 'naughty'] },
      { type: 'listen-identify', segment: 'chorus-3', word: 'whoa-yeah', show: 'word', options: ['whoa-yeah', 'cry', 'list'],
        prompt: 'Uma palavra nova de festa! Qual você ouviu?' },
    ],
    pronounce: [
      { phrase: "Gonna find out who's naughty and nice", word: 'naughty', say: "Going to find out who's naughty and nice", segment: 'list-b' },
      { phrase: 'checking it twice', word: 'twice', segment: 'list-a' },
    ],
    sing: {
      steps: [
        { segment: 'list', support: 'keywords', keywords: ['list', 'twice', 'naughty', 'nice'], art: ['list', 'face-nice'] },
        { segment: 'start-to-list', support: 'keywords', keywords: ['Santa Claus', 'watch out', 'list', 'nice'], art: ['santa', 'eyes', 'list'] },
      ],
    },
  },

  // ───────────────────────── Fase 4 · Dormindo ou acordado ─────────────────────────
  {
    day: 10, phase: 4, focus: ['sleeping', 'awake'],
    goal: 'Cantar as duas primeiras frases da parte nova',
    vocab: [
      { type: 'word-pick', word: 'sleeping', options: ['sleeping', 'awake', 'list'] },
      { type: 'word-pick', word: 'awake', options: ['awake', 'sleeping', 'pout'] },
      { type: 'letter-fill', word: 'sleeping', text: 'sleeping', missing: [2, 3], extra: ['a', 'o'] },
    ],
    listen: [
      { type: 'listen-identify', segment: 'sleep-a', word: 'sleeping', show: 'picture', options: ['sleeping', 'pout', 'list'] },
      { type: 'listen-identify', segment: 'sleep-a', word: 'awake', show: 'word', options: ['awake', 'twice'],
        prompt: 'Qual destas duas você ouviu?' },
    ],
    pronounce: [
      { phrase: 'sleeping', word: 'sleeping' },
      { phrase: 'awake', word: 'awake', segment: 'sleep-a' },
    ],
    sing: {
      steps: [
        { segment: 'sleep-a', support: 'card', keywords: ['sleeping', 'awake'], art: ['face-sleeping', 'face-awake'], repeats: 2 },
        { segment: 'sleep-a', support: 'keywords', keywords: ['sleeping', 'awake'], art: ['face-sleeping'] },
      ],
    },
  },
  {
    day: 11, phase: 4, focus: ['bad', 'good', 'goodness'],
    goal: 'Completar a parte dormindo/acordado',
    vocab: [
      { type: 'word-pick', word: 'good', options: ['good', 'bad', 'list'] },
      { type: 'word-pick', word: 'bad', options: ['bad', 'good', 'town'] },
      { type: 'fill-gap', word: 'goodness', phrase: 'Be good for ___ sake', options: ['goodness', 'town', 'list'], answer: 'goodness' },
    ],
    listen: [
      { type: 'listen-identify', segment: 'sleep-b', word: 'good', show: 'picture', options: ['good', 'cry', 'list'] },
      { type: 'listen-sequence', segment: 'sleep-b', order: ['bad', 'good'] },
    ],
    pronounce: [
      { phrase: 'bad or good', word: 'bad' },
      { phrase: 'be good for goodness sake', word: 'goodness', segment: 'sleep-b' },
    ],
    sing: {
      steps: [
        { segment: 'sleep-b', support: 'card', keywords: ['bad', 'good', 'goodness'], art: ['thumbs-down', 'thumbs-up', 'heart'], repeats: 2 },
        { segment: 'sleep', support: 'card', keywords: ['sleeping', 'awake', 'bad', 'good'], art: ['face-sleeping', 'face-awake', 'thumbs-down', 'thumbs-up'] },
      ],
    },
  },
  {
    day: 12, phase: 4, focus: ['sleeping', 'awake', 'bad', 'good', 'goodness'],
    goal: 'Cantar a parte completa sem muita ajuda',
    vocab: [
      { type: 'letter-fill', word: 'awake', text: 'awake', missing: [1, 3], extra: ['n', 'r'] },
      { type: 'letter-fill', word: 'goodness', text: 'goodness', missing: [2, 3], extra: ['a', 'i'] },
      { type: 'fill-gap', word: 'sleeping', phrase: "He sees you when you're ___", options: ['sleeping', 'list', 'twice'], answer: 'sleeping' },
    ],
    listen: [
      { type: 'listen-sequence', segment: 'sleep', order: ['sleeping', 'awake', 'good'] },
      { type: 'listen-identify', segment: 'verse2-a', word: 'watch-out', show: 'picture', options: ['watch-out', 'sleeping', 'list'],
        prompt: 'Essa parte voltou! Qual figura combina?' },
    ],
    pronounce: [
      { phrase: "He sees you when you're sleeping", word: 'sleeping', segment: 'sleep-a' },
      { phrase: 'He knows when you are awake', word: 'awake' },
    ],
    sing: {
      steps: [
        { segment: 'sleep', support: 'keywords', keywords: ['sleeping', 'awake', 'bad', 'good'], art: ['face-sleeping', 'thumbs-up'] },
        { segment: 'sleep', support: 'none', keywords: [], art: ['face-sleeping'] },
      ],
    },
  },

  // ───────────────────────── Fase 5 · O espetáculo ─────────────────────────
  {
    day: 13, phase: 5, focus: ['woo-hoo', 'whoa-yeah'],
    goal: 'Cantar tudo com atenção às entradas e ao ritmo',
    vocab: [
      { type: 'word-pick', word: 'woo-hoo', options: ['woo-hoo', 'why', 'list'] },
      { type: 'word-pick', word: 'whoa-yeah', options: ['whoa-yeah', 'cry', 'town'] },
      { type: 'fill-gap', word: 'whoa-yeah', phrase: "comin' to town, whoa ___", options: ['yeah', 'list', 'cry'], answer: 'yeah' },
    ],
    listen: [
      { type: 'listen-count', segment: 'finale', word: 'santa-claus', what: 'Santa Claus', options: ['1', '2', '3'], answer: '3' },
      { type: 'listen-next', segment: 'verse2-a', word: 'cry', after: 'watch out', show: 'picture', options: ['cry', 'sleeping', 'list'] },
      { type: 'listen-identify', segment: 'woohoo', word: 'woo-hoo', show: 'picture', options: ['woo-hoo', 'sleeping', 'list'] },
    ],
    pronounce: [
      { phrase: 'woo hoo', word: 'woo-hoo', segment: 'woohoo' },
      { phrase: 'whoa yeah', word: 'whoa-yeah', segment: 'chorus-3' },
    ],
    sing: {
      steps: [
        { segment: 'chorus-4', support: 'card', keywords: ['whoa yeah', 'woo hoo'], art: ['cheer', 'party'] },
        { segment: 'verse2-b', support: 'keywords', keywords: ['pout', 'why'], art: ['face-pout', 'question'] },
        { segment: 'full', support: 'keywords', keywords: ['Santa Claus', 'watch out', 'list', 'sleeping', 'woo hoo'], art: ['santa', 'eyes', 'list', 'face-sleeping', 'party'] },
      ],
    },
  },
  {
    day: 14, phase: 5, focus: ['watch-out', 'list', 'sleeping', 'goodness', 'woo-hoo'],
    goal: 'Ensaio de palco com pouca ajuda',
    vocab: [
      { type: 'letter-fill', word: 'naughty', text: 'naughty', missing: [1, 2], extra: ['o', 'e'] },
      { type: 'fill-gap', word: 'town', phrase: "Santa Claus is comin' to ___", options: ['town', 'list', 'cry'], answer: 'town' },
      { type: 'picture-pick', word: 'awake', options: ['awake', 'sleeping', 'santa-claus'] },
    ],
    listen: [
      { type: 'listen-count', segment: 'chorus-2', word: 'santa-claus', what: 'Santa Claus', options: ['2', '3', '4'], answer: '3' },
      { type: 'listen-sequence', segment: 'start-to-list', order: ['watch-out', 'list'] },
      { type: 'listen-identify', segment: 'verse2-b', word: 'pout', show: 'word', options: ['pout', 'good', 'twice'] },
    ],
    pronounce: [
      { phrase: 'You better watch out, you better not cry', word: 'watch-out', segment: 'verse2-a' },
      { phrase: 'So be good for goodness sake', word: 'goodness', segment: 'sleep-b' },
    ],
    sing: {
      steps: [
        { segment: 'full', support: 'keywords', keywords: ['Santa Claus', 'watch out', 'list', 'sleeping', 'woo hoo'], art: ['santa', 'list', 'party'] },
        { segment: 'full', support: 'none', keywords: [], art: ['santa'] },
      ],
    },
  },
  {
    day: 15, phase: 5, focus: ['santa-claus', 'nice', 'list', 'awake'],
    goal: 'A Grande Cantata!',
    vocab: [
      { type: 'word-pick', word: 'santa-claus', options: ['santa-claus', 'goodness', 'twice'] },
      { type: 'picture-pick', word: 'nice', options: ['nice', 'naughty', 'sleeping'] },
      { type: 'fill-gap', word: 'list', phrase: "He's making a ___ and checking it twice", options: ['list', 'cry', 'why'], answer: 'list' },
    ],
    listen: [
      { type: 'listen-next', segment: 'sleep-a', word: 'awake', after: 'sleeping', show: 'word', options: ['awake', 'cry', 'list'] },
      { type: 'listen-identify', segment: 'finale', word: 'town', show: 'word', options: ['town', 'nice', 'why'] },
    ],
    pronounce: [
      { phrase: "Santa Claus is comin' to town!", word: 'santa-claus', say: 'Santa Claus is coming to town', segment: 'finale' },
      { phrase: 'woo hoo', word: 'woo-hoo' },
    ],
    sing: {
      cantata: true,
      steps: [
        { segment: 'full', support: 'none', keywords: [], art: ['santa'] },
      ],
    },
  },
];
