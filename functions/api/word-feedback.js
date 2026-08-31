import {
  handleError, HttpError, json, readJson, requireDatabase, requireSession, verifyOrigin,
} from '../_lib/auth.js';
import { FeedbackValidationError, validateWordFeedback } from '../_lib/feedback.js';

const MAX_REPORTS_PER_HOUR = 10;

export async function onRequestPost(context) {
  try {
    verifyOrigin(context.request);
    const db = requireDatabase(context.env);
    const session = await requireSession(context.request, db);
    const body = await readJson(context.request);
    let feedback;
    try {
      feedback = validateWordFeedback(body);
    } catch (error) {
      if (error instanceof FeedbackValidationError) {
        throw new HttpError(400, 'VALIDATION', error.message);
      }
      throw error;
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const usage = await db.prepare(
      'SELECT COUNT(*) AS total FROM word_feedback WHERE user_id = ? AND created_at >= ?',
    ).bind(session.user.id, oneHourAgo).first();
    if (Number(usage?.total || 0) >= MAX_REPORTS_PER_HOUR) {
      throw new HttpError(429, 'FEEDBACK_LIMIT', 'Too many reports. Please try again later.');
    }

    const duplicate = await db.prepare(`SELECT id FROM word_feedback
      WHERE user_id = ? AND word = ? AND reason = ? AND status IN ('new', 'reviewing') LIMIT 1`)
      .bind(session.user.id, feedback.word, feedback.reason).first();
    if (duplicate) return json({ accepted: true, duplicate: true, id: duplicate.id });

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.prepare(`INSERT INTO word_feedback
      (id, user_id, word, reason, note, source, difficulty, game_mode, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)`)
      .bind(
        id, session.user.id, feedback.word, feedback.reason, feedback.note,
        feedback.source, feedback.difficulty, feedback.gameMode, now, now,
      ).run();

    return json({ accepted: true, duplicate: false, id }, 201);
  } catch (error) {
    return handleError(error);
  }
}
