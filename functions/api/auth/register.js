import {
  accountPayload, createPasswordRecord, handleError, HttpError, json,
  newSessionRecord, normalizeEmail, readJson, requireDatabase, sessionCookie,
  requirePasswordPepper, validateNickname, validatePassword, verifyOrigin,
} from '../../_lib/auth.js';

export async function onRequestPost(context) {
  try {
    verifyOrigin(context.request);
    const db = requireDatabase(context.env);
    const pepper = requirePasswordPepper(context.env);
    const body = await readJson(context.request);
    const email = normalizeEmail(body.email);
    const password = validatePassword(body.password);
    const nickname = validateNickname(body.nickname);
    const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existing) throw new HttpError(409, 'EMAIL_EXISTS', 'Email is already registered.');

    const passwordRecord = await createPasswordRecord(password, pepper);
    const user = { id: crypto.randomUUID(), email, nickname, role: 'player' };
    const session = await newSessionRecord(user.id);
    const now = new Date().toISOString();
    await db.batch([
      db.prepare(`INSERT INTO users (id, email, password_salt, password_hash, password_iterations, nickname, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(user.id, email, passwordRecord.salt, passwordRecord.hash, passwordRecord.iterations, nickname, now, now),
      db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
        .bind(session.tokenHash, user.id, session.expiresAt, session.createdAt),
    ]);
    return json(await accountPayload(db, user), 201, { 'set-cookie': sessionCookie(session.token) });
  } catch (error) {
    if (String(error?.message || '').includes('UNIQUE constraint failed: users.email')) {
      return json({ error: 'Email is already registered.', code: 'EMAIL_EXISTS' }, 409);
    }
    return handleError(error);
  }
}
