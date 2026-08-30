import {
  accountPayload, assertNotRateLimited, createPasswordRecord, handleError,
  HttpError, json, newSessionRecord, normalizeEmail, passwordNeedsUpgrade,
  rateLimitKey, readJson, recordLoginFailure, requireDatabase, requirePasswordPepper,
  sessionCookie, validatePassword, verifyOrigin, verifyPassword,
} from '../../_lib/auth.js';

export async function onRequestPost(context) {
  try {
    verifyOrigin(context.request);
    const db = requireDatabase(context.env);
    const pepper = requirePasswordPepper(context.env);
    const body = await readJson(context.request);
    const email = normalizeEmail(body.email);
    const password = validatePassword(body.password);
    const key = await rateLimitKey(context.request, email);
    const attempts = await assertNotRateLimited(db, key);
    const row = await db.prepare(`SELECT id, email, nickname, password_salt AS passwordSalt,
      password_hash AS passwordHash, password_iterations AS passwordIterations FROM users WHERE email = ?`)
      .bind(email).first();
    if (!(await verifyPassword(password, row, pepper))) {
      await recordLoginFailure(db, key, attempts);
      throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
    }

    const upgradedPassword = passwordNeedsUpgrade(row) ? await createPasswordRecord(password, pepper) : null;
    const session = await newSessionRecord(row.id);
    const now = Math.floor(Date.now() / 1000);
    const writes = [
      db.prepare('DELETE FROM login_attempts WHERE attempt_key = ?').bind(key),
      db.prepare('DELETE FROM sessions WHERE user_id = ? AND expires_at <= ?').bind(row.id, now),
      db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
        .bind(session.tokenHash, row.id, session.expiresAt, session.createdAt),
    ];
    if (upgradedPassword) {
      writes.push(db.prepare(`UPDATE users SET password_salt = ?, password_hash = ?,
        password_iterations = ?, updated_at = ? WHERE id = ?`)
        .bind(upgradedPassword.salt, upgradedPassword.hash, upgradedPassword.iterations,
          new Date().toISOString(), row.id));
    }
    await db.batch(writes);
    return json(await accountPayload(db, row), 200, { 'set-cookie': sessionCookie(session.token) });
  } catch (error) {
    return handleError(error);
  }
}
