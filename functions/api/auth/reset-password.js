import {
  createPasswordRecord, handleError, HttpError, json, readJson, requireDatabase,
  requirePasswordPepper, sha256, validatePassword, verifyOrigin,
} from '../../_lib/auth.js';

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

function changes(result) {
  return Number(result?.meta?.changes ?? result?.changes ?? 0);
}

export async function onRequestPost(context) {
  try {
    verifyOrigin(context.request);
    const db = requireDatabase(context.env);
    const pepper = requirePasswordPepper(context.env);
    const body = await readJson(context.request);
    const token = typeof body.token === 'string' ? body.token.trim() : '';
    const password = validatePassword(body.password);
    if (!TOKEN_PATTERN.test(token)) throw new HttpError(400, 'INVALID_RESET_TOKEN', 'The reset link is invalid or expired.');

    const tokenHash = await sha256(token);
    const now = Math.floor(Date.now() / 1000);
    const reset = await db.prepare(`SELECT user_id AS userId FROM password_reset_tokens
      WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?`).bind(tokenHash, now).first();
    if (!reset) throw new HttpError(400, 'INVALID_RESET_TOKEN', 'The reset link is invalid or expired.');

    const passwordRecord = await createPasswordRecord(password, pepper);
    const consumptionId = crypto.randomUUID();
    const updatedAt = new Date().toISOString();
    const results = await db.batch([
      db.prepare(`UPDATE password_reset_tokens SET used_at = ?, consumption_id = ?
        WHERE token_hash = ? AND user_id = ? AND used_at IS NULL AND expires_at > ?`)
        .bind(now, consumptionId, tokenHash, reset.userId, now),
      db.prepare(`UPDATE users SET password_salt = ?, password_hash = ?, password_iterations = ?, updated_at = ?
        WHERE id = ? AND EXISTS (SELECT 1 FROM password_reset_tokens
          WHERE token_hash = ? AND user_id = ? AND consumption_id = ?)`)
        .bind(passwordRecord.salt, passwordRecord.hash, passwordRecord.iterations, updatedAt,
          reset.userId, tokenHash, reset.userId, consumptionId),
      db.prepare(`DELETE FROM sessions WHERE user_id = ? AND EXISTS (SELECT 1 FROM password_reset_tokens
        WHERE token_hash = ? AND user_id = ? AND consumption_id = ?)`)
        .bind(reset.userId, tokenHash, reset.userId, consumptionId),
    ]);
    if (changes(results[0]) !== 1 || changes(results[1]) !== 1) {
      throw new HttpError(400, 'INVALID_RESET_TOKEN', 'The reset link is invalid or expired.');
    }
    return json({ reset: true });
  } catch (error) {
    return handleError(error);
  }
}
