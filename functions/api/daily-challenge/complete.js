import {
  handleError, json, readJson, requireDatabase, verifyOrigin,
} from '../../_lib/auth.js';
import {
  assertDailyRateLimit, dailyStatistics, isBetterAttempt, playerIdentity,
  rateLimitIdentity, scorePayload, validateCompletion,
} from '../../_lib/daily-challenge.js';

const MAX_COMPLETIONS_PER_HOUR = 30;

export async function onRequestPost(context) {
  try {
    verifyOrigin(context.request);
    const db = requireDatabase(context.env);
    const body = await readJson(context.request);
    const attempt = await validateCompletion(body);
    const identity = await playerIdentity(context.request, db, body.playerKey);
    const limiterIdentity = await rateLimitIdentity(context.request, identity.playerHash);
    await assertDailyRateLimit(db, 'complete', limiterIdentity, MAX_COMPLETIONS_PER_HOUR, 60 * 60);

    const existing = await db.prepare(`SELECT id, best_steps AS bestSteps,
      best_duration_ms AS bestDurationMs, best_assisted AS bestAssisted,
      best_hint_count AS bestHintCount, best_undo_count AS bestUndoCount,
      attempt_count AS attemptCount
      FROM daily_challenge_results WHERE challenge_date = ? AND player_key_hash = ?`)
      .bind(attempt.date, identity.playerHash).first();
    const now = new Date().toISOString();
    let improved = false;
    let resultId = existing?.id;

    if (!existing) {
      resultId = crypto.randomUUID();
      const insert = await db.prepare(`INSERT OR IGNORE INTO daily_challenge_results
        (id, challenge_date, player_key_hash, user_id,
         first_steps, first_duration_ms, first_assisted,
         best_steps, best_duration_ms, best_assisted, best_hint_count, best_undo_count,
         best_route_hash, attempt_count, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`)
        .bind(
          resultId, attempt.date, identity.playerHash, identity.session?.user.id || null,
          attempt.steps, attempt.durationMs, attempt.assisted ? 1 : 0,
          attempt.steps, attempt.durationMs, attempt.assisted ? 1 : 0,
          attempt.hintCount, attempt.undoCount, attempt.routeHash, now, now,
        ).run();
      improved = Number(insert.meta?.changes || 0) > 0;
    }

    let current = existing || await db.prepare(`SELECT id, best_steps AS bestSteps,
      best_duration_ms AS bestDurationMs, best_assisted AS bestAssisted,
      best_hint_count AS bestHintCount, best_undo_count AS bestUndoCount,
      attempt_count AS attemptCount
      FROM daily_challenge_results WHERE challenge_date = ? AND player_key_hash = ?`)
      .bind(attempt.date, identity.playerHash).first();

    if (!improved) {
      const better = isBetterAttempt(attempt, current);
      await db.prepare(`UPDATE daily_challenge_results SET
        user_id = COALESCE(user_id, ?),
        best_steps = CASE WHEN ? = 1 THEN ? ELSE best_steps END,
        best_duration_ms = CASE WHEN ? = 1 THEN ? ELSE best_duration_ms END,
        best_assisted = CASE WHEN ? = 1 THEN ? ELSE best_assisted END,
        best_hint_count = CASE WHEN ? = 1 THEN ? ELSE best_hint_count END,
        best_undo_count = CASE WHEN ? = 1 THEN ? ELSE best_undo_count END,
        best_route_hash = CASE WHEN ? = 1 THEN ? ELSE best_route_hash END,
        attempt_count = attempt_count + 1,
        updated_at = ? WHERE id = ?`)
        .bind(
          identity.session?.user.id || null,
          better ? 1 : 0, attempt.steps,
          better ? 1 : 0, attempt.durationMs,
          better ? 1 : 0, attempt.assisted ? 1 : 0,
          better ? 1 : 0, attempt.hintCount,
          better ? 1 : 0, attempt.undoCount,
          better ? 1 : 0, attempt.routeHash,
          now, current.id,
        ).run();
      improved = better;
    }

    current = await db.prepare(`SELECT best_steps AS bestSteps,
      best_duration_ms AS bestDurationMs, best_assisted AS bestAssisted,
      best_hint_count AS bestHintCount, best_undo_count AS bestUndoCount,
      attempt_count AS attemptCount
      FROM daily_challenge_results WHERE challenge_date = ? AND player_key_hash = ?`)
      .bind(attempt.date, identity.playerHash).first();
    const statistics = await dailyStatistics(db, attempt.date);
    return json({
      accepted: true,
      improved,
      attemptCount: Number(current.attemptCount),
      personalBest: scorePayload(current),
      statistics,
      stats: statistics,
    }, existing ? 200 : 201);
  } catch (error) {
    return handleError(error);
  }
}
