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

console.log('Worker validation passed: static, account, feedback, and workshop routes are reachable.');
