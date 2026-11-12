import { choiceExercise } from './choice.js';
import { letterFillExercise } from './letter-fill.js';
import { sequenceExercise } from './sequence.js';
import { pronounceExercise } from './pronounce.js';
import { singExercise } from './sing.js';

/** Every renderer has the same shape: (el, item, api) => cleanup */
export const RENDERERS = {
  'word-pick': choiceExercise,
  'picture-pick': choiceExercise,
  'fill-gap': choiceExercise,
  'listen-identify': choiceExercise,
  'listen-count': choiceExercise,
  'listen-next': choiceExercise,
  'letter-fill': letterFillExercise,
  'listen-sequence': sequenceExercise,
  pronounce: pronounceExercise,
  sing: singExercise,
};
