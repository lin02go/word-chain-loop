import { getSession, HttpError, sha256 } from './auth.js';
import dailyChallengeCatalog from '../../daily-challenges.js';

const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000;
const CHALLENGE_EPOCH_UTC = Date.UTC(2026, 0, 1);
const DAY_MS = 24 * 60 * 60 * 1000;
const PLAYER_KEY_PATTERN = /^[A-Za-z0-9._:-]+$/;
const SHARE_CODE_PATTERN = /^[A-Za-z0-9_-]{10,20}$/;
const WORD_PATTERN = /^[a-z]{3,45}$/;
const PLAYER_COOKIE_NAME = 'word_loop_daily_player';
const PLAYER_COOKIE_SECONDS = 60 * 60 * 24 * 365;

export function beijingDay(now = Date.now()) {
  return new Date(now + BEIJING_OFFSET_MS).toISOString().slice(0, 10);
}

export function nextBeijingReset(now = Date.now()) {
  const shifted = new Date(now + BEIJING_OFFSET_MS);
  const nextUtcMidnight = Date.UTC(
    shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate() + 1,
  );
  return new Date(nextUtcMidnight - BEIJING_OFFSET_MS).toISOString();
}

export function challengeNumber(date) {
  const timestamp = Date.parse(`${date}T00:00:00Z`);
  return Math.max(1, Math.floor((timestamp - CHALLENGE_EPOCH_UTC) / DAY_MS) + 1);
}

export function dailyChallengePayload(date) {
  const selected = dailyChallengeCatalog.getDailyChallenge(date);
  const challenge = selected.challenge;
  return {
    id: challenge.id,
    date,
    challengeDate: date,
    number: selected.dayNumber + 1,
    title: challenge.title,
    startWord: challenge.startWord,
    difficulty: challenge.difficulty,
    targetMoves: challenge.parMoves,
    maxMoves: challenge.maxMoves,
    hintLimit: challenge.hintLimit,
    resetAt: Date.parse(`${date}T16:00:00Z`),
  };
}

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}

export function requireCurrentChallengeDate(value) {
  if (!validDate(value)) throw new HttpError(400, 'VALIDATION', 'Invalid challenge date.');
  if (value !== beijingDay()) throw new HttpError(409, 'CHALLENGE_EXPIRED', 'This daily challenge is no longer active.');
  return value;
}

function normalizePlayerKey(value) {
  const key = typeof value === 'string' ? value.trim() : '';
  if (key.length < 16 || key.length > 128 || !PLAYER_KEY_PATTERN.test(key)) {
    throw new HttpError(400, 'PLAYER_KEY_REQUIRED', 'A valid anonymous player key is required.');
  }
  return key;
}

function requestCookie(request, name) {
  for (const part of (request.headers.get('cookie') || '').split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0 || part.slice(0, separator).trim() !== name) continue;
    return part.slice(separator + 1).trim();
  }
  return '';
}

function randomPlayerKey() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function anonymousPlayerCookie(request) {
  if (requestCookie(request, PLAYER_COOKIE_NAME)) return {};
  const value = randomPlayerKey();
  return {
    'set-cookie': `${PLAYER_COOKIE_NAME}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${PLAYER_COOKIE_SECONDS}`,
  };
}

export async function playerIdentity(request, db, suppliedKey) {
  const session = await getSession(request, db);
  if (session) {
    return {
      playerHash: await sha256(`user:${session.user.id}`),
      session,
    };
  }
  const anonymousKey = normalizePlayerKey(
    suppliedKey || request.headers.get('x-word-loop-player-key') || requestCookie(request, PLAYER_COOKIE_NAME),
  );
  return {
    playerHash: await sha256(`anonymous:${anonymousKey}`),
    session: null,
  };
}

export async function rateLimitIdentity(request, playerHash) {
  const edgeAddress = request.headers.get('cf-connecting-ip') || 'local';
  return sha256(`${playerHash}\n${edgeAddress}`);
}

export async function assertDailyRateLimit(db, action, identity, limit, windowSeconds) {
  const bucketKey = await sha256(`${action}:${identity}`);
  const now = Math.floor(Date.now() / 1000);
  const resetAt = now + windowSeconds;
  await db.prepare(`INSERT INTO daily_challenge_rate_limits (bucket_key, hits, reset_at)
    VALUES (?, 1, ?)
    ON CONFLICT(bucket_key) DO UPDATE SET
      hits = CASE WHEN daily_challenge_rate_limits.reset_at <= ? THEN 1
        ELSE daily_challenge_rate_limits.hits + 1 END,
      reset_at = CASE WHEN daily_challenge_rate_limits.reset_at <= ? THEN excluded.reset_at
        ELSE daily_challenge_rate_limits.reset_at END`)
    .bind(bucketKey, resetAt, now, now).run();
  const row = await db.prepare(
    'SELECT hits, reset_at AS resetAt FROM daily_challenge_rate_limits WHERE bucket_key = ?',
  ).bind(bucketKey).first();
  if (Number(row?.hits || 0) > limit) {
    throw new HttpError(429, 'RATE_LIMITED', 'Too many daily challenge requests. Please try again later.');
  }
}

function integerInRange(value, min, max, label) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new HttpError(400, 'VALIDATION', `${label} is outside the allowed range.`);
  }
  return value;
}

function validateRoute(value, steps) {
  if (value === undefined || value === null) return null;
  if (!Array.isArray(value) || value.length !== steps + 1 || value.length > 65) {
    throw new HttpError(400, 'VALIDATION', 'Route length does not match the submitted step count.');
  }
  const words = value.map((item) => (typeof item === 'string' ? item.trim().toLowerCase() : ''));
  if (words.some((word) => !WORD_PATTERN.test(word))) {
    throw new HttpError(400, 'VALIDATION', 'Route contains an invalid word.');
  }
  for (let index = 1; index < words.length; index += 1) {
    if (words[index - 1].slice(-2) !== words[index].slice(0, 2)) {
      throw new HttpError(400, 'VALIDATION', 'Route contains a broken word-chain link.');
    }
  }
  if (words.at(-1).slice(-2) !== words[0].slice(0, 2)) {
    throw new HttpError(400, 'VALIDATION', 'Route does not close the word loop.');
  }
  return words;
}

export async function validateCompletion(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'VALIDATION', 'Invalid completion payload.');
  }
  const date = requireCurrentChallengeDate(body.challengeDate || body.date);
  const steps = integerInRange(body.steps ?? body.moves, 1, 64, 'Step count');
  const durationMs = integerInRange(body.durationMs ?? body.elapsedMs, 250, 86400000, 'Duration');
  if (typeof body.assisted !== 'boolean') {
    throw new HttpError(400, 'VALIDATION', 'Assisted status is required.');
  }
  const hintCount = integerInRange(body.hintCount ?? body.hintUses ?? 0, 0, 64, 'Hint count');
  const undoCount = integerInRange(body.undoCount ?? body.undoUses ?? 0, 0, 128, 'Undo count');
  if (!body.assisted && (hintCount > 0 || undoCount > 0)) {
    throw new HttpError(400, 'VALIDATION', 'Assisted status does not match the submitted actions.');
  }
  const route = validateRoute(body.route || body.chain, steps);
  const expected = dailyChallengePayload(date);
  if (body.challengeId && body.challengeId !== expected.id) {
    throw new HttpError(400, 'VALIDATION', 'Challenge identifier does not match the active daily challenge.');
  }
  if (body.startWord && String(body.startWord).toLowerCase() !== expected.startWord) {
    throw new HttpError(400, 'VALIDATION', 'Start word does not match the active daily challenge.');
  }
  if (route && route[0] !== expected.startWord) {
    throw new HttpError(400, 'VALIDATION', 'Route does not begin with the active daily challenge word.');
  }
  return {
    date,
    steps,
    durationMs,
    assisted: body.assisted,
    hintCount,
    undoCount,
    routeHash: route ? await sha256(route.join('\n')) : null,
  };
}

export function isBetterAttempt(attempt, current) {
  if (Number(attempt.assisted) !== Number(current.bestAssisted)) return !attempt.assisted;
  if (attempt.steps !== Number(current.bestSteps)) return attempt.steps < Number(current.bestSteps);
  return attempt.durationMs < Number(current.bestDurationMs);
}

export function validateShareCode(value) {
  const code = typeof value === 'string' ? value.trim() : '';
  if (!SHARE_CODE_PATTERN.test(code)) throw new HttpError(400, 'VALIDATION', 'Invalid challenge code.');
  return code;
}

export function newShareCode() {
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export async function dailyStatistics(db, date) {
  const row = await db.prepare(`SELECT COUNT(*) AS players,
    SUM(attempt_count) AS attempts,
    SUM(CASE WHEN best_assisted = 0 THEN 1 ELSE 0 END) AS unassisted
    FROM daily_challenge_results WHERE challenge_date = ?`).bind(date).first();
  return {
    players: Number(row?.players || 0),
    attempts: Number(row?.attempts || 0),
    unassistedCompletions: Number(row?.unassisted || 0),
  };
}

export function scorePayload(row) {
  return {
    steps: Number(row.bestSteps),
    durationMs: Number(row.bestDurationMs),
    assisted: Boolean(row.bestAssisted),
    hintCount: Number(row.bestHintCount || 0),
    undoCount: Number(row.bestUndoCount || 0),
  };
}
