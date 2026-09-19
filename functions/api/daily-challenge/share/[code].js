import { handleError, HttpError, json, requireDatabase } from '../../../_lib/auth.js';
import {
  anonymousPlayerCookie, beijingDay, dailyChallengePayload, validateShareCode,
} from '../../../_lib/daily-challenge.js';

export async function onRequestGet(context) {
  try {
    const db = requireDatabase(context.env);
    const code = validateShareCode(context.params.code);
    const share = await db.prepare(`SELECT code, challenge_date AS challengeDate,
      creator_name AS creatorName, steps, duration_ms AS durationMs, assisted,
      open_count AS openCount, start_count AS startCount, completion_count AS completionCount,
      created_at AS createdAt FROM daily_challenge_shares WHERE code = ?`).bind(code).first();
    if (!share) throw new HttpError(404, 'SHARE_NOT_FOUND', 'Challenge link not found.');
    const sharePayload = {
      date: share.challengeDate,
      moves: Number(share.steps),
      elapsedMs: Number(share.durationMs),
      assisted: Boolean(share.assisted),
      creatorName: share.creatorName,
    };
    return json({
      code: share.code,
      challengeDate: share.challengeDate,
      creatorName: share.creatorName,
      share: sharePayload,
      challenge: dailyChallengePayload(share.challengeDate),
      score: {
        steps: Number(share.steps),
        durationMs: Number(share.durationMs),
        assisted: Boolean(share.assisted),
      },
      engagement: {
        opens: Number(share.openCount),
        starts: Number(share.startCount),
        completions: Number(share.completionCount),
      },
      expired: share.challengeDate !== beijingDay(),
      createdAt: share.createdAt,
    }, 200, anonymousPlayerCookie(context.request));
  } catch (error) {
    return handleError(error);
  }
}
