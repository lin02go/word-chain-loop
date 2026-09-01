import fs from 'node:fs/promises';
import { webcrypto } from 'node:crypto';

globalThis.crypto ||= webcrypto;
const source = await fs.readFile(new URL('../functions/_lib/auth.js', import.meta.url), 'utf8');
const resetSource = await fs.readFile(new URL('../functions/api/auth/reset-password.js', import.meta.url), 'utf8');
const resetMigration = await fs.readFile(new URL('../migrations/0004_password_reset_tokens.sql', import.meta.url), 'utf8');
const auth = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const encoder = new TextEncoder();

function base64Url(bytes) {
  return Buffer.from(bytes).toString('base64url');
}

async function legacyRecord(password, iterations = 1000) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return { passwordSalt: base64Url(salt), passwordHash: base64Url(new Uint8Array(bits)), passwordIterations: iterations };
}

const password = 'correct horse battery staple';
const pepper = 'test-only-pepper-that-is-longer-than-32-characters';
const legacy = await legacyRecord(password);
if (!(await auth.verifyPassword(password, legacy, pepper))) throw new Error('Legacy password verification failed');
if (!auth.passwordNeedsUpgrade(legacy)) throw new Error('Legacy password was not marked for upgrade');

const current = await auth.createPasswordRecord(password, pepper);
const currentRow = { passwordSalt: current.salt, passwordHash: current.hash, passwordIterations: current.iterations };
if (!(await auth.verifyPassword(password, currentRow, pepper))) throw new Error('Current password verification failed');
if (await auth.verifyPassword('incorrect password', currentRow, pepper)) throw new Error('Incorrect password was accepted');
if (auth.passwordNeedsUpgrade(currentRow)) throw new Error('Current password was marked for upgrade');

const parsedBody = await auth.readJson(new Request('https://word-loop.test/api', {
  method: 'POST',
  body: JSON.stringify({ ok: true }),
  headers: { 'content-type': 'application/json' },
}));
if (parsedBody.ok !== true) throw new Error('Bounded JSON reader changed a valid body');

let oversizedCode = '';
try {
  await auth.readJson(new Request('https://word-loop.test/api', {
    method: 'POST',
    body: 'x'.repeat(110001),
  }));
} catch (error) {
  oversizedCode = error.code;
}
if (oversizedCode !== 'PAYLOAD_TOO_LARGE') throw new Error('Streaming body limit was not enforced');

for (const marker of [
  'const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/',
  'const tokenHash = await sha256(token)',
  'used_at IS NULL AND expires_at > ?',
  'DELETE FROM sessions WHERE user_id = ?',
]) {
  if (!resetSource.includes(marker)) throw new Error(`Password-reset security marker is missing: ${marker}`);
}
for (const marker of [
  'token_hash TEXT PRIMARY KEY',
  'FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE',
]) {
  if (!resetMigration.includes(marker)) throw new Error(`Password-reset migration marker is missing: ${marker}`);
}

console.log('Authentication validation passed: password records, reset-token controls, and bounded JSON bodies verified.');
