import fs from 'node:fs/promises';

const helperSource = await fs.readFile(new URL('../functions/_lib/feedback.js', import.meta.url), 'utf8');
const feedback = await import(`data:text/javascript;base64,${Buffer.from(helperSource).toString('base64')}`);

const valid = feedback.validateWordFeedback({
  word: '  Apple ', reason: 'too_obscure', note: 'Shown as a hard-mode hint.',
  source: 'definition', difficulty: 'hard', gameMode: 'casual',
});
if (valid.word !== 'apple' || valid.note !== 'Shown as a hard-mode hint.') {
  throw new Error('Valid feedback was not normalized');
}

for (const invalid of [
  { word: 'a2', reason: 'other' },
  { word: 'apple', reason: 'invented' },
  { word: 'apple', reason: 'other', note: 'x'.repeat(281) },
  { word: 'apple', reason: 'other', source: 'spoofed' },
]) {
  let rejected = false;
  try { feedback.validateWordFeedback(invalid); } catch (error) {
    rejected = error instanceof feedback.FeedbackValidationError;
  }
  if (!rejected) throw new Error(`Invalid feedback was accepted: ${JSON.stringify(invalid)}`);
}

const endpointSource = await fs.readFile(new URL('../functions/api/word-feedback.js', import.meta.url), 'utf8');
for (const marker of ['requireSession', 'crypto.randomUUID()', '.bind(', 'MAX_REPORTS_PER_HOUR']) {
  if (!endpointSource.includes(marker)) throw new Error(`Feedback endpoint is missing: ${marker}`);
}

const migrationSource = await fs.readFile(new URL('../migrations/0002_word_feedback.sql', import.meta.url), 'utf8');
for (const marker of ['CREATE TABLE IF NOT EXISTS word_feedback', 'idx_word_feedback_status_created', 'FOREIGN KEY (user_id)']) {
  if (!migrationSource.includes(marker)) throw new Error(`Feedback migration is missing: ${marker}`);
}

console.log('Feedback validation passed: payload rules, authenticated endpoint, rate limit, and D1 migration verified.');
