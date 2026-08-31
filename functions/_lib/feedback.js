export const FEEDBACK_REASONS = Object.freeze([
  'not_word',
  'too_obscure',
  'wrong_definition',
  'missing_word',
  'other',
]);

export const FEEDBACK_SOURCES = Object.freeze(['manual', 'definition', 'rejected_input']);
export const FEEDBACK_DIFFICULTIES = Object.freeze(['', 'easy', 'medium', 'hard']);
export const FEEDBACK_GAME_MODES = Object.freeze(['', 'casual', 'campaign']);

export class FeedbackValidationError extends Error {}

function oneOf(value, allowed, fallback, label) {
  const normalized = typeof value === 'string' ? value.trim() : fallback;
  if (!allowed.includes(normalized)) throw new FeedbackValidationError(`Invalid ${label}.`);
  return normalized;
}

export function validateWordFeedback(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new FeedbackValidationError('Invalid feedback body.');
  }

  const word = typeof value.word === 'string' ? value.word.trim().toLowerCase() : '';
  if (!/^[a-z]{3,45}$/.test(word)) {
    throw new FeedbackValidationError('Word must contain 3–45 English letters.');
  }

  const note = typeof value.note === 'string' ? value.note.trim() : '';
  if (Array.from(note).length > 280 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(note)) {
    throw new FeedbackValidationError('Note must contain at most 280 safe characters.');
  }

  return {
    word,
    reason: oneOf(value.reason, FEEDBACK_REASONS, '', 'reason'),
    note,
    source: oneOf(value.source, FEEDBACK_SOURCES, 'manual', 'source'),
    difficulty: oneOf(value.difficulty, FEEDBACK_DIFFICULTIES, '', 'difficulty'),
    gameMode: oneOf(value.gameMode, FEEDBACK_GAME_MODES, '', 'game mode'),
  };
}
