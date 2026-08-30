import fs from 'node:fs/promises';
import { webcrypto } from 'node:crypto';

globalThis.crypto ||= webcrypto;
const source = await fs.readFile(new URL('../functions/_lib/auth.js', import.meta.url), 'utf8');
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

console.log('Authentication validation passed: legacy upgrade and peppered records verified.');
