import {
  handleError, HttpError, json, readJson, requireDatabase, verifyOrigin,
} from '../../../_lib/auth.js';
import {
  assertDailyRateLimit, newShareCode, playerIdentity, rateLimitIdentity,
  requireCurrentChallengeDate, scorePayload,
} from '../../../_lib/daily-challenge.js';

const MAX_SHARES_PER_HOUR = 12;

export async function onRequestPost(context) {
  try {
    verifyOrigin(context.request);
    const db = requireDatabase(context.env);
    const body = await readJson(context.request);
    const date = requireCurrentChallengeDate(body?.challengeDate || body?.date);
    const identity = await playerIdentity(context.request, db, body?.playerKey);
    const limiterIdentity = await rateLimitIdentity(context.request, identity.playerHash);
    await assertDailyRateLimit(db, 'share', limiterIdentity, MAX_SHARES_PER_HOUR, 60 * 60);

    const result = await db.prepare(`SELECT id, best_steps AS bestSteps,
      best_duration_ms AS bestDurationMs, best_assisted AS bestAssisted,
      best_hint_count AS bestHintCount, best_undo_count AS bestUndoCount
      FROM daily_challenge_results WHERE challenge_date = ? AND player_key_hash = ?`)
      .bind(date, identity.playerHash).first();
    if (!result) throw new HttpError(404, 'RESULT_NOT_FOUND', 'Complete today\'s challenge before sharing.');

    const existing = await db.prepare(`SELECT code FROM daily_challenge_shares
      WHERE result_id = ? AND steps = ? AND duration_ms = ? AND assisted = ?
      ORDER BY created_at DESC LIMIT 1`)
      .bind(result.id, result.bestSteps, result.bestDurationMs, result.bestAssisted).first();
    if (existing) {
      return json({ code: existing.code, challengeDate: date, score: scorePayload(result), reused: true });
    }

    const now = new Date().toISOString();
    const creatorName = identity.session?.user.nickname || 'Anonymous player';
    let code = null;
    for (let attempt = 0; attempt < 3 && !code; attempt += 1) {
      const candidate = newShareCode();
      const insert = await db.prepare(`INSERT OR IGNORE INTO daily_challenge_shares
        (code, result_id, challenge_date, creator_key_hash, creator_user_id, creator_name,
         steps, duration_ms, assisted, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(
          candidate, result.id, date, identity.playerHash, identity.session?.user.id || null,
          creatorName, result.bestSteps, result.bestDurationMs, result.bestAssisted, now,
        ).run();
      if (Number(insert.meta?.changes || 0) > 0) code = candidate;
    }
    if (!code) throw new HttpError(503, 'SHARE_UNAVAILABLE', 'Could not create a challenge link.');
    return json({ code, challengeDate: date, score: scorePayload(result), reused: false }, 201);
  } catch (error) {
    return handleError(error);
  }
}
