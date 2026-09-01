import fs from 'node:fs/promises';

const source = await fs.readFile(new URL('../dist/server/index.js', import.meta.url), 'utf8');
const worker = (await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)).default;
const assets = { fetch: async (request) => new Response(new URL(request.url).pathname) };

const root = await worker.fetch(new Request('https://example.test/'), { ASSETS: assets });
if ((await root.text()) !== '/index.html') throw new Error('Root asset routing failed');

const missing = await worker.fetch(new Request('https://example.test/api/missing'), { ASSETS: assets });
if (missing.status !== 404 || (await missing.json()).code !== 'NOT_FOUND') throw new Error('Unknown API routing failed');

const account = await worker.fetch(new Request('https://example.test/api/auth/me'), { ASSETS: assets });
if (account.status !== 503 || (await account.json()).code !== 'DB_UNAVAILABLE') throw new Error('Account API routing failed');

const passwordReset = await worker.fetch(new Request('https://example.test/api/auth/reset-password', {
  method: 'POST',
  headers: { origin: 'https://example.test', 'content-type': 'application/json' },
  body: JSON.stringify({ token: 'a'.repeat(43), password: 'a secure test password' }),
}), { ASSETS: assets });
if (passwordReset.status !== 503 || (await passwordReset.json()).code !== 'DB_UNAVAILABLE') {
  throw new Error('Password-reset API routing failed');
}

const resetStatements = [];
const resetDb = {
  prepare(query) {
    return {
      query,
      values: [],
      bind(...values) { this.values = values; return this; },
      async first() {
        if (query.includes('FROM password_reset_tokens')) return { userId: 'user-1' };
        throw new Error(`Unexpected password-reset query: ${query}`);
      },
    };
  },
  async batch(statements) {
    resetStatements.push(...statements);
    return [{ meta: { changes: 1 } }, { meta: { changes: 1 } }, { meta: { changes: 2 } }];
  },
};
const completedReset = await worker.fetch(new Request('https://example.test/api/auth/reset-password', {
  method: 'POST',
  headers: { origin: 'https://example.test', 'content-type': 'application/json' },
  body: JSON.stringify({ token: 'b'.repeat(43), password: 'a secure test password' }),
}), { DB: resetDb, PASSWORD_PEPPER: 'test-only-pepper-that-is-longer-than-32-characters', ASSETS: assets });
if (completedReset.status !== 200 || (await completedReset.json()).reset !== true) {
  throw new Error('Password-reset transaction failed');
}
if (!resetStatements.some((statement) => statement.query.includes('DELETE FROM sessions'))) {
  throw new Error('Password reset did not revoke existing sessions');
}

const feedback = await worker.fetch(new Request('https://example.test/api/word-feedback', {
  method: 'POST',
  headers: { origin: 'https://example.test', 'content-type': 'application/json' },
  body: JSON.stringify({ word: 'apple', reason: 'other' }),
}), { ASSETS: assets });
if (feedback.status !== 503 || (await feedback.json()).code !== 'DB_UNAVAILABLE') throw new Error('Feedback API routing failed');

const customLevels = await worker.fetch(new Request('https://example.test/api/custom-levels'), { ASSETS: assets });
if (customLevels.status !== 503 || (await customLevels.json()).code !== 'DB_UNAVAILABLE') throw new Error('Custom-level API routing failed');

const community = await worker.fetch(new Request('https://example.test/api/community-levels'), { ASSETS: assets });
if (community.status !== 503 || (await community.json()).code !== 'DB_UNAVAILABLE') throw new Error('Community-level API routing failed');

console.log('Worker validation passed: static, account, password-reset, feedback, and workshop routes are reachable.');
