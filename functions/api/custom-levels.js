import {
  handleError, HttpError, json, readJson, requireDatabase, requireSession, verifyOrigin,
} from '../_lib/auth.js';
import {
  CustomLevelValidationError, CustomLevelWordCheckError, levelPayload, validateCustomLevelSubmission, verifyEnglishWords,
} from '../_lib/custom-levels.js';

const MAX_SUBMISSIONS_PER_HOUR = 6;
const SELECT_COLUMNS = `l.id, l.title, l.start_word AS startWord, l.difficulty,
  l.submitted_route_json AS submittedRouteJson, l.computed_route_json AS computedRouteJson,
  l.shortest_moves AS shortestMoves, l.challenge_moves AS challengeMoves, l.route_count AS routeCount,
  l.branch_word_count AS branchWordCount, l.quality_closer_count AS qualityCloserCount,
  l.max_moves AS maxMoves, l.hint_limit AS hintLimit, l.description, l.show_creator AS showCreator,
  l.dictionary_version AS dictionaryVersion, l.status, l.review_note AS reviewNote,
  l.created_at AS createdAt, l.published_at AS publishedAt, u.nickname AS creatorNickname`;

export async function onRequestGet(context) {
  try {
    const db = requireDatabase(context.env);
    const session = await requireSession(context.request, db);
    const result = await db.prepare(`SELECT ${SELECT_COLUMNS}
      FROM custom_level_submissions l JOIN users u ON u.id = l.user_id
      WHERE l.user_id = ? ORDER BY l.created_at DESC LIMIT 60`).bind(session.user.id).all();
    return json({ levels: (result.results || []).map((row) => levelPayload(row, { own: true })) });
  } catch (error) {
    return handleError(error);
  }
}

export async function onRequestPost(context) {
  try {
    verifyOrigin(context.request);
    const db = requireDatabase(context.env);
    const session = await requireSession(context.request, db);
    let level;
    try { level = validateCustomLevelSubmission(await readJson(context.request)); }
    catch (error) {
      if (error instanceof CustomLevelValidationError) throw new HttpError(400, 'VALIDATION', error.message);
      throw error;
    }
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const usage = await db.prepare('SELECT COUNT(*) AS total FROM custom_level_submissions WHERE user_id = ? AND created_at >= ?')
      .bind(session.user.id, oneHourAgo).first();
    if (Number(usage?.total || 0) >= MAX_SUBMISSIONS_PER_HOUR) {
      throw new HttpError(429, 'SUBMISSION_LIMIT', 'Too many level submissions. Please try again later.');
    }
    const duplicate = await db.prepare(`SELECT id FROM custom_level_submissions
      WHERE user_id = ? AND start_word = ? AND difficulty = ? AND status IN ('pending', 'published') LIMIT 1`)
      .bind(session.user.id, level.startWord, level.difficulty).first();
    if (duplicate) throw new HttpError(409, 'DUPLICATE_LEVEL', 'You already submitted this level.');

    try { await verifyEnglishWords(level.submittedRoute); }
    catch (error) {
      if (error instanceof CustomLevelValidationError) throw new HttpError(400, 'INVALID_WORD', error.message);
      if (error instanceof CustomLevelWordCheckError) throw new HttpError(503, 'WORD_CHECK_UNAVAILABLE', error.message);
      throw error;
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const computed = level.computed;
    await db.prepare(`INSERT INTO custom_level_submissions
      (id, user_id, title, start_word, difficulty, submitted_route_json, computed_route_json,
       shortest_moves, challenge_moves, route_count, branch_word_count, quality_closer_count,
       max_moves, hint_limit, description, show_creator, dictionary_version, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`)
      .bind(
        id, session.user.id, level.title, level.startWord, level.difficulty,
        JSON.stringify(level.submittedRoute), JSON.stringify(computed.computedRoute),
        computed.shortestMoves, computed.challengeMoves, computed.routeCount, computed.branchWordCount,
        computed.qualityCloserCount, computed.maxMoves, computed.hintLimit, level.description,
        level.showCreator ? 1 : 0, computed.dictionaryVersion, now, now,
      ).run();
    return json({ accepted: true, id, status: 'pending' }, 201);
  } catch (error) {
    return handleError(error);
  }
}
