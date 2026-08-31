import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

function read(relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

function load(relative) {
  const context = {};
  vm.createContext(context);
  vm.runInContext(read(relative), context, { filename: relative });
  return context;
}

function sha256(relative) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(root, relative))).digest('hex');
}

function checkAligned(words, fields) {
  for (const [name, value, multiplier] of fields) {
    if (typeof value !== 'string' || value.length !== words.length * multiplier) {
      failures.push(`${name} is not aligned with its word array`);
    }
  }
}

function overrideWords(filename) {
  const filenamePath = path.join(root, 'dictionary-overrides', filename);
  if (!fs.existsSync(filenamePath)) return [];
  return fs.readFileSync(filenamePath, 'utf8').split(/\r?\n/)
    .map((line) => line.split('#', 1)[0].trim().split(/\s+/)[0])
    .filter(Boolean);
}

const canonical = load('dictionary.js');
const words = canonical.DICTIONARY;
if (!Array.isArray(words) || !words.length) throw new Error('dictionary.js does not define DICTIONARY');
const canonicalFeatured = canonical.WORD_FEATURED || canonical.WORD_STARTS;
checkAligned(words, [
  ['WORD_TIERS', canonical.WORD_TIERS, 1],
  ['WORD_FORMS', canonical.WORD_FORMS, 1],
  ['WORD_STARTS', canonical.WORD_STARTS, 1],
  ['WORD_FEATURED', canonicalFeatured, 1],
  ['WORD_LEMMA_IDS', canonical.WORD_LEMMA_IDS, 4],
]);

const wordSet = new Set(words);
if (wordSet.size !== words.length) failures.push('dictionary.js contains duplicate words');
for (let index = 0; index < words.length; index++) {
  if (!/^[a-z]{3,}$/.test(words[index])) failures.push(`Invalid dictionary word: ${words[index]}`);
  if (index && words[index - 1] >= words[index]) failures.push(`Dictionary order is not strictly sorted near ${words[index]}`);
  const lemmaIndex = Number.parseInt(canonical.WORD_LEMMA_IDS.slice(index * 4, index * 4 + 4), 36);
  if (!Number.isInteger(lemmaIndex) || lemmaIndex < 0 || lemmaIndex >= words.length) {
    failures.push(`Invalid lemma index for ${words[index]}`);
  }
}

const wordIndex = new Map(words.map((word, index) => [word, index]));
const featuredMarks = [...canonicalFeatured];
for (const word of overrideWords('featured.txt')) {
  const index = wordIndex.get(word);
  if (index !== undefined) featuredMarks[index] = '1';
}
for (const word of overrideWords('unfeatured.txt')) {
  const index = wordIndex.get(word);
  if (index !== undefined) featuredMarks[index] = '0';
}
const featured = featuredMarks.join('');
for (const word of overrideWords('allow.txt')) {
  if (!wordSet.has(word)) failures.push(`Allowed override is missing from dictionary: ${word}`);
}
for (const word of overrideWords('deny.txt')) {
  if (wordSet.has(word)) failures.push(`Denied override remains in dictionary: ${word}`);
}
for (const word of overrideWords('featured.txt')) {
  const index = wordIndex.get(word);
  if (index === undefined || featured[index] !== '1') failures.push(`Featured override is not featured: ${word}`);
}
for (const word of overrideWords('unfeatured.txt')) {
  const index = wordIndex.get(word);
  if (index !== undefined && featured[index] !== '0') failures.push(`Unfeatured override remains featured: ${word}`);
}

const core = load('dictionary-core.js');
const extendedContext = load('dictionary-extended.js');
const extended = extendedContext.WORD_LOOP_EXTENDED_DICTIONARY_PACK;
checkAligned(core.DICTIONARY, [
  ['core WORD_TIERS', core.WORD_TIERS, 1], ['core WORD_FORMS', core.WORD_FORMS, 1],
  ['core WORD_STARTS', core.WORD_STARTS, 1], ['core WORD_FEATURED', core.WORD_FEATURED, 1],
  ['core WORD_LEMMA_IDS', core.WORD_LEMMA_IDS, 4],
]);
if (!extended || !Array.isArray(extended.words)) failures.push('Extended dictionary pack is missing');
else checkAligned(extended.words, [
  ['extended tiers', extended.tiers, 1], ['extended forms', extended.forms, 1],
  ['extended starts', extended.starts, 1], ['extended featured', extended.featured, 1],
  ['extended lemmaIds', extended.lemmaIds, 4],
]);

if (extended) {
  const packedWords = core.DICTIONARY.concat(extended.words);
  const packedTiers = core.WORD_TIERS + extended.tiers;
  const packedForms = core.WORD_FORMS + extended.forms;
  const packedStarts = core.WORD_STARTS + extended.starts;
  const packedFeatured = core.WORD_FEATURED + extended.featured;
  const packedLemmaIds = core.WORD_LEMMA_IDS + extended.lemmaIds;
  if (packedWords.length !== words.length || new Set(packedWords).size !== words.length) {
    failures.push('Runtime packs do not contain each canonical word exactly once');
  }
  const packedIndex = new Map(packedWords.map((word, index) => [word, index]));
  for (let index = 0; index < words.length; index++) {
    const packedAt = packedIndex.get(words[index]);
    if (packedAt === undefined) continue;
    const canonicalLemmaIndex = Number.parseInt(canonical.WORD_LEMMA_IDS.slice(index * 4, index * 4 + 4), 36);
    const packedLemmaIndex = Number.parseInt(packedLemmaIds.slice(packedAt * 4, packedAt * 4 + 4), 36);
    const sameMetadata = canonical.WORD_TIERS[index] === packedTiers[packedAt] &&
      canonical.WORD_FORMS[index] === packedForms[packedAt] &&
      canonical.WORD_STARTS[index] === packedStarts[packedAt] && featured[index] === packedFeatured[packedAt];
    if (!sameMetadata || words[canonicalLemmaIndex] !== packedWords[packedLemmaIndex]) {
      failures.push(`Runtime metadata differs from canonical dictionary for ${words[index]}`);
    }
  }
  for (let index = 0; index < core.DICTIONARY.length; index++) {
    const lemmaIndex = Number.parseInt(core.WORD_LEMMA_IDS.slice(index * 4, index * 4 + 4), 36);
    if (lemmaIndex >= core.DICTIONARY.length) failures.push(`Core word has an unloaded lemma: ${core.DICTIONARY[index]}`);
  }
}

const report = JSON.parse(read('dictionary-report.json'));
if (!report.source_repository || !report.source_revision || !report.provenance_status) {
  failures.push('Dictionary report is missing source provenance');
}
if (report.word_count !== words.length) failures.push('Dictionary report word_count is stale');
if (report.dictionary_sha256 !== sha256('dictionary.js')) failures.push('Dictionary report hash is stale');
for (const filename of ['dictionary-core.js', 'dictionary-extended.js']) {
  const packReport = report.runtime_packs?.[filename];
  if (!packReport || packReport.sha256 !== sha256(filename)) failures.push(`Dictionary report hash is stale for ${filename}`);
}

if (failures.length) {
  console.error('Dictionary validation failed:');
  for (const failure of failures.slice(0, 30)) console.error(`- ${failure}`);
  if (failures.length > 30) console.error(`- …and ${failures.length - 30} more`);
  process.exit(1);
}

console.log(`Dictionary validation passed: ${words.length.toLocaleString()} canonical words; ` +
  `${core.DICTIONARY.length.toLocaleString()} initial-pack records; provenance ${report.provenance_status}.`);
