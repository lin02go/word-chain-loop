import {
  handleError, HttpError, json, readJson, requireDatabase, verifyOrigin,
} from '../../_lib/auth.js';
import {
  assertDailyRateLimit, playerIdentity, rateLimitIdentity, validateShareCode,
} from '../../_lib/daily-challenge.js';

const EVENT_COLUMNS = Object.freeze({
  open: 'open_count',
  start: 'start_count',
  complete: 'completion_count',
});
const MAX_REFERRALS_PER_HOUR = 60;

export async function onRequestPost(context) {
  try {
    verifyOrigin(context.request);
    const db = requireDatabase(context.env);
    const body = await readJson(context.request);
    const code = validateShareCode(body?.code);
    const eventType = typeof (body?.eventType || body?.event) === 'string' ? (body.eventType || body.event) : '';
    const counterColumn = EVENT_COLUMNS[eventType];
    if (!counterColumn) throw new HttpError(400, 'VALIDATION', 'Invalid referral event.');
    const identity = await playerIdentity(context.request, db, body?.playerKey);
    const limiterIdentity = await rateLimitIdentity(context.request, identity.playerHash);
    await assertDailyRateLimit(db, 'referral', limiterIdentity, MAX_REFERRALS_PER_HOUR, 60 * 60);

    const share = await db.prepare(`SELECT challenge_date AS challengeDate,
      creator_key_hash AS creatorKeyHash FROM daily_challenge_shares WHERE code = ?`).bind(code).first();
    if (!share) throw new HttpError(404, 'SHARE_NOT_FOUND', 'Challenge link not found.');
    if (share.creatorKeyHash === identity.playerHash) {
      return json({ accepted: true, duplicate: false, ignored: 'self_referral' });
    }

    const insert = await db.prepare(`INSERT OR IGNORE INTO daily_challenge_referrals
      (id, share_code, challenge_date, player_key_hash, event_type, created_at)
      VALUES (?, ?, ?, ?, ?, ?)`)
      .bind(
        crypto.randomUUID(), code, share.challengeDate, identity.playerHash,
        eventType, new Date().toISOString(),
      ).run();
    const inserted = Number(insert.meta?.changes || 0) > 0;
    if (inserted) {
      await db.prepare(`UPDATE daily_challenge_shares SET ${counterColumn} = ${counterColumn} + 1 WHERE code = ?`)
        .bind(code).run();
    }
    return json({ accepted: true, duplicate: !inserted, ignored: null }, inserted ? 201 : 200);
  } catch (error) {
    return handleError(error);
  }
}
