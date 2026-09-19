import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const catalogCheck = spawnSync(process.execPath, ['tools/build-custom-level-catalog.mjs', '--check'], { encoding: 'utf8' });
if (catalogCheck.status !== 0) throw new Error((catalogCheck.stderr || catalogCheck.stdout || 'Workshop catalog check failed.').trim());

const custom = await import(new URL('../functions/_lib/custom-levels.js', import.meta.url));
const entry = custom.catalogEntry('remarkable', 'easy');
if (!entry || entry.shortestMoves !== 1 || !Array.isArray(entry.computedRoute) || entry.computedRoute[0] !== 'remarkable') {
  throw new Error('Known campaign-quality start is missing from the workshop catalog.');
}

const arbitrary = custom.validateCustomLevelSubmission({
  title: 'Outside the catalog', startWord: 'abalone', difficulty: 'easy',
  submittedRoute: ['abalone', 'nearest', 'stab'],
});
if (custom.catalogEntry('abalone', 'easy') || arbitrary.startWord !== 'abalone' || arbitrary.computed.computedRoute[0] !== 'abalone') {
  throw new Error('A structurally valid starting word outside the catalog must be accepted.');
}

const normalized = custom.validateCustomLevelSubmission({
  title: '  A Remarkable Return  ', startWord: ' Remarkable ', difficulty: 'easy',
  submittedRoute: entry.computedRoute, description: '  Short and readable.  ', showCreator: true,
});
if (normalized.title !== 'A Remarkable Return' || normalized.startWord !== 'remarkable' || normalized.computed.dictionaryVersion.length !== 64) {
  throw new Error('Valid custom level submission was not normalized.');
}

const checkedUrls = [];
await custom.verifyEnglishWords(['remarkable', 'lecture'], async (url) => {
  checkedUrls.push(url);
  return { ok: true, status: 200, json: async () => [{ word: 'verified' }] };
});
if (checkedUrls.length !== 2) throw new Error('Every distinct submitted word must be verified.');
let invalidWordRejected = false;
try {
  await custom.verifyEnglishWords(['notaword'], async (url) => ({
    ok: !url.includes('dictionaryapi.dev'),
    status: url.includes('dictionaryapi.dev') ? 404 : 200,
    json: async () => [],
  }));
} catch (error) {
  invalidWordRejected = error instanceof custom.CustomLevelValidationError;
}
if (!invalidWordRejected) throw new Error('A word rejected by both dictionary providers must not be accepted.');

for (const invalid of [
  { title: '', startWord: 'remarkable', difficulty: 'easy', submittedRoute: entry.computedRoute },
  { title: 'Broken', startWord: 'remarkable', difficulty: 'easy', submittedRoute: ['remarkable', 'apple'] },
  { title: 'Forged', startWord: 'zz', difficulty: 'easy', submittedRoute: ['zz', 'zz'] },
]) {
  let rejected = false;
  try { custom.validateCustomLevelSubmission(invalid); } catch (error) {
    rejected = error instanceof custom.CustomLevelValidationError;
  }
  if (!rejected) throw new Error(`Invalid custom level was accepted: ${JSON.stringify(invalid)}`);
}

const sources = {
  endpoint: await fs.readFile(new URL('../functions/api/custom-levels.js', import.meta.url), 'utf8'),
  community: await fs.readFile(new URL('../functions/api/community-levels.js', import.meta.url), 'utf8'),
  admin: await fs.readFile(new URL('../functions/api/admin/custom-levels.js', import.meta.url), 'utf8'),
  migration: await fs.readFile(new URL('../migrations/0003_custom_level_workshop.sql', import.meta.url), 'utf8'),
  client: await fs.readFile(new URL('../workshop.js', import.meta.url), 'utf8'),
};

for (const marker of ['requireSession', 'MAX_SUBMISSIONS_PER_HOUR', 'validateCustomLevelSubmission', 'verifyEnglishWords', "status IN ('pending', 'published')"]) {
  if (!sources.endpoint.includes(marker)) throw new Error(`Custom level endpoint is missing: ${marker}`);
}
for (const marker of ['requireAdmin', 'validateReview', "status === 'published'"]) {
  if (!sources.admin.includes(marker)) throw new Error(`Admin review endpoint is missing: ${marker}`);
}
for (const marker of ['CREATE TABLE IF NOT EXISTS custom_level_submissions', "role IN ('player', 'admin')", 'idx_custom_levels_published']) {
  if (!sources.migration.includes(marker)) throw new Error(`Workshop migration is missing: ${marker}`);
}
for (const marker of [
  'wordloop:completed', 'game.findShortestPath', 'submittedRoute', 'textContent',
  'WorkshopController.prototype.resetDraft', "getElementById('workshopForm').reset()", 'self.resetDraft();',
]) {
  if (!sources.client.includes(marker)) throw new Error(`Workshop client is missing: ${marker}`);
}
if (!sources.community.includes("status = 'published'")) throw new Error('Community endpoint must expose published levels only.');

console.log('Workshop validation passed: catalog, payload rules, moderation, and client flow verified.');
