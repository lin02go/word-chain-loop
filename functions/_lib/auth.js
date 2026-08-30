const encoder = new TextEncoder();
const COOKIE_NAME = 'word_loop_session';
const SESSION_SECONDS = 60 * 60 * 24 * 30;
// Workers Free allows 10 ms of CPU per request. A server-side pepper keeps
// database-only leaks resistant while this PBKDF2 cost stays within that budget.
const PASSWORD_ITERATIONS = 50000;
const MAX_BODY_BYTES = 110000;
const PEPPERED_SALT_PREFIX = 'p1.';
const DUMMY_SALT = 'AAAAAAAAAAAAAAAAAAAAAA';
const DUMMY_HASH = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
let schemaReady;

export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      ...extraHeaders,
    },
  });
}

export function handleError(error) {
  if (error instanceof HttpError) return json({ error: error.message, code: error.code }, error.status);
  console.error('Word Loop account error', error);
  return json({ error: 'Unexpected server error.', code: 'SERVER_ERROR' }, 500);
}

export function requireDatabase(env) {
  if (!env || !env.DB) throw new HttpError(503, 'DB_UNAVAILABLE', 'Account storage is unavailable.');
  return env.DB;
}

export function requirePasswordPepper(env) {
  const pepper = typeof env?.PASSWORD_PEPPER === 'string' ? env.PASSWORD_PEPPER : '';
  if (pepper.length < 32) throw new HttpError(503, 'AUTH_CONFIG', 'Account security is unavailable.');
  return pepper;
}

export async function ensureSchema(db) {
  if (schemaReady) return schemaReady;
  schemaReady = db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      password_iterations INTEGER NOT NULL,
      nickname TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(email)
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS login_attempts (
      attempt_key TEXT PRIMARY KEY,
      failures INTEGER NOT NULL,
      reset_at INTEGER NOT NULL,
      blocked_until INTEGER NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS player_progress (
      user_id TEXT PRIMARY KEY,
      snapshot_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`),
  ]).catch((error) => {
    schemaReady = null;
    throw error;
  });
  return schemaReady;
}

export function verifyOrigin(request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) throw new HttpError(403, 'INVALID_ORIGIN', 'Invalid request origin.');
}

export async function readJson(request) {
  const length = Number(request.headers.get('content-length') || 0);
  if (length > MAX_BODY_BYTES) throw new HttpError(413, 'PAYLOAD_TOO_LARGE', 'Request is too large.');
  try { return await request.json(); }
  catch { throw new HttpError(400, 'INVALID_JSON', 'Invalid JSON body.'); }
}

export function normalizeEmail(value) {
  const email = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (email.length < 3 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, 'VALIDATION', 'Enter a valid email address.');
  }
  return email;
}

export function validatePassword(value) {
  if (typeof value !== 'string' || value.length < 10 || value.length > 128) {
    throw new HttpError(400, 'VALIDATION', 'Password must contain 10–128 characters.');
  }
  return value;
}

export function validateNickname(value) {
  const nickname = typeof value === 'string' ? value.trim() : '';
  const length = Array.from(nickname).length;
  if (length < 2 || length > 24 || /[<>\u0000-\u001f\u007f]/.test(nickname)) {
    throw new HttpError(400, 'VALIDATION', 'Player name must contain 2–24 safe characters.');
  }
  return nickname;
}

function randomBytes(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function toBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', typeof value === 'string' ? encoder.encode(value) : value);
  return toBase64Url(new Uint8Array(digest));
}

async function pepperPassword(password, pepper) {
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(pepper), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(password)));
}

async function derivePassword(password, salt, iterations, pepper) {
  const passwordBytes = pepper ? await pepperPassword(password, pepper) : encoder.encode(password);
  const material = await crypto.subtle.importKey('raw', passwordBytes, 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, material, 256);
  return new Uint8Array(bits);
}

export async function createPasswordRecord(password, pepper) {
  const salt = randomBytes(16);
  const hash = await derivePassword(validatePassword(password), salt, PASSWORD_ITERATIONS, pepper);
  return {
    salt: PEPPERED_SALT_PREFIX + toBase64Url(salt),
    hash: toBase64Url(hash),
    iterations: PASSWORD_ITERATIONS,
  };
}

export async function verifyPassword(password, record, pepper) {
  const storedSalt = record?.passwordSalt || PEPPERED_SALT_PREFIX + DUMMY_SALT;
  const peppered = storedSalt.startsWith(PEPPERED_SALT_PREFIX);
  const salt = fromBase64Url(peppered ? storedSalt.slice(PEPPERED_SALT_PREFIX.length) : storedSalt);
  const expected = fromBase64Url(record?.passwordHash || DUMMY_HASH);
  const actual = await derivePassword(
    password,
    salt,
    Number(record?.passwordIterations) || PASSWORD_ITERATIONS,
    peppered ? pepper : null,
  );
  if (actual.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < actual.length; index += 1) difference |= actual[index] ^ expected[index];
  return Boolean(record) && difference === 0;
}

export function passwordNeedsUpgrade(record) {
  return !record?.passwordSalt?.startsWith(PEPPERED_SALT_PREFIX) ||
    Number(record?.passwordIterations) !== PASSWORD_ITERATIONS;
}

function cookies(request) {
  const values = {};
  for (const part of (request.headers.get('cookie') || '').split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    values[part.slice(0, separator).trim()] = part.slice(separator + 1).trim();
  }
  return values;
}

export function sessionCookie(token) {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_SECONDS}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export async function newSessionRecord(userId) {
  const token = toBase64Url(randomBytes(32));
  const now = Math.floor(Date.now() / 1000);
  return { token, tokenHash: await sha256(token), userId, createdAt: now, expiresAt: now + SESSION_SECONDS };
}

export async function getSession(request, db) {
  const token = cookies(request)[COOKIE_NAME];
  if (!token) return null;
  const tokenHash = await sha256(token);
  const row = await db.prepare(`SELECT u.id, u.email, u.nickname, s.expires_at AS expiresAt
    FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?`).bind(tokenHash).first();
  const now = Math.floor(Date.now() / 1000);
  if (!row || Number(row.expiresAt) <= now) {
    if (row) await db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();
    return null;
  }
  return { tokenHash, user: { id: row.id, email: row.email, nickname: row.nickname } };
}

export async function requireSession(request, db) {
  const session = await getSession(request, db);
  if (!session) throw new HttpError(401, 'AUTH_REQUIRED', 'Sign in required.');
  return session;
}

export async function accountPayload(db, user) {
  const progress = await db.prepare('SELECT updated_at AS updatedAt FROM player_progress WHERE user_id = ?').bind(user.id).first();
  return {
    authenticated: true,
    email: user.email,
    profile: { nickname: user.nickname, displayName: user.nickname },
    hasCloudProgress: Boolean(progress),
    progressUpdatedAt: progress?.updatedAt || null,
  };
}

export async function rateLimitKey(request, email) {
  const ip = request.headers.get('cf-connecting-ip') || 'local';
  return sha256(`${email}\n${ip}`);
}

export async function assertNotRateLimited(db, key) {
  const row = await db.prepare('SELECT failures, reset_at AS resetAt, blocked_until AS blockedUntil FROM login_attempts WHERE attempt_key = ?').bind(key).first();
  const now = Math.floor(Date.now() / 1000);
  if (row && Number(row.blockedUntil) > now) throw new HttpError(429, 'RATE_LIMITED', 'Too many attempts.');
  return row;
}

export async function recordLoginFailure(db, key, previous) {
  const now = Math.floor(Date.now() / 1000);
  const activeWindow = previous && Number(previous.resetAt) > now;
  const failures = (activeWindow ? Number(previous.failures) : 0) + 1;
  const resetAt = activeWindow ? Number(previous.resetAt) : now + 900;
  const blockedUntil = failures >= 8 ? now + 900 : 0;
  await db.prepare(`INSERT INTO login_attempts (attempt_key, failures, reset_at, blocked_until) VALUES (?, ?, ?, ?)
    ON CONFLICT(attempt_key) DO UPDATE SET failures = excluded.failures, reset_at = excluded.reset_at, blocked_until = excluded.blocked_until`)
    .bind(key, failures, resetAt, blockedUntil).run();
}
