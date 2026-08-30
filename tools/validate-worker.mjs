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

console.log('Worker validation passed: static and API routes are reachable.');
