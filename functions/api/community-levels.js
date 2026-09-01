import { handleError, json, requireDatabase } from '../_lib/auth.js';
import { levelPayload } from '../_lib/custom-levels.js';

export async function onRequestGet(context) {
  try {
    const db = requireDatabase(context.env);
    const url = new URL(context.request.url);
    const page = Math.max(1, Math.min(1000, Number.parseInt(url.searchParams.get('page') || '1', 10) || 1));
    const pageSize = 24;
    const [countResult, rowsResult] = await db.batch([
      db.prepare("SELECT COUNT(*) AS total FROM custom_level_submissions WHERE status = 'published'"),
      db.prepare(`SELECT l.id, l.title, l.start_word AS startWord, l.difficulty,
        l.submitted_route_json AS submittedRouteJson, l.computed_route_json AS computedRouteJson,
        l.shortest_moves AS shortestMoves, l.challenge_moves AS challengeMoves, l.route_count AS routeCount,
        l.branch_word_count AS branchWordCount, l.quality_closer_count AS qualityCloserCount,
        l.max_moves AS maxMoves, l.hint_limit AS hintLimit, l.description, l.show_creator AS showCreator,
        l.dictionary_version AS dictionaryVersion, l.status, l.review_note AS reviewNote,
        l.created_at AS createdAt, l.published_at AS publishedAt, u.nickname AS creatorNickname
        FROM custom_level_submissions l JOIN users u ON u.id = l.user_id
        WHERE l.status = 'published' ORDER BY l.published_at DESC LIMIT ? OFFSET ?`)
        .bind(pageSize, (page - 1) * pageSize),
    ]);
    const total = Number(countResult.results?.[0]?.total || 0);
    return json({
      levels: (rowsResult.results || []).map((row) => levelPayload(row)),
      page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (error) {
    return handleError(error);
  }
}
