import {
  handleError, HttpError, json, readJson, requireAdmin, requireDatabase, verifyOrigin,
} from '../../_lib/auth.js';
import { CustomLevelValidationError, levelPayload, validateReview } from '../../_lib/custom-levels.js';

const SELECT_COLUMNS = `l.id, l.title, l.start_word AS startWord, l.difficulty,
  l.submitted_route_json AS submittedRouteJson, l.computed_route_json AS computedRouteJson,
  l.shortest_moves AS shortestMoves, l.challenge_moves AS challengeMoves, l.route_count AS routeCount,
  l.branch_word_count AS branchWordCount, l.quality_closer_count AS qualityCloserCount,
  l.max_moves AS maxMoves, l.hint_limit AS hintLimit, l.description, l.show_creator AS showCreator,
  l.dictionary_version AS dictionaryVersion, l.status, l.review_note AS reviewNote,
  l.created_at AS createdAt, l.published_at AS publishedAt,
  u.nickname AS creatorNickname, u.email AS creatorEmail`;

export async function onRequestGet(context) {
  try {
    const db = requireDatabase(context.env);
    await requireAdmin(context.request, db);
    const requested = new URL(context.request.url).searchParams.get('status') || 'pending';
    const status = ['pending', 'published', 'rejected'].includes(requested) ? requested : 'pending';
    const result = await db.prepare(`SELECT ${SELECT_COLUMNS}
      FROM custom_level_submissions l JOIN users u ON u.id = l.user_id
      WHERE l.status = ? ORDER BY l.created_at ASC LIMIT 80`).bind(status).all();
    return json({ levels: (result.results || []).map((row) => levelPayload(row, { admin: true })) });
  } catch (error) {
    return handleError(error);
  }
}

export async function onRequestPatch(context) {
  try {
    verifyOrigin(context.request);
    const db = requireDatabase(context.env);
    const session = await requireAdmin(context.request, db);
    let review;
    try { review = validateReview(await readJson(context.request)); }
    catch (error) {
      if (error instanceof CustomLevelValidationError) throw new HttpError(400, 'VALIDATION', error.message);
      throw error;
    }
    const existing = await db.prepare('SELECT id FROM custom_level_submissions WHERE id = ?').bind(review.id).first();
    if (!existing) throw new HttpError(404, 'LEVEL_NOT_FOUND', 'Custom level not found.');
    const now = new Date().toISOString();
    const status = review.action === 'publish' ? 'published' : 'rejected';
    await db.prepare(`UPDATE custom_level_submissions
      SET status = ?, review_note = ?, reviewed_by = ?, updated_at = ?, published_at = ? WHERE id = ?`)
      .bind(status, review.reviewNote, session.user.id, now, status === 'published' ? now : null, review.id).run();
    return json({ id: review.id, status, updatedAt: now });
  } catch (error) {
    return handleError(error);
  }
}
