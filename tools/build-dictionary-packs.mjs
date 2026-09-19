import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dictionaryPath = path.join(root, 'dictionary.js');
const reportPath = path.join(root, 'dictionary-report.json');

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function fixedBase36(value, width = 4) {
  const encoded = value.toString(36);
  if (encoded.length > width) throw new Error(`Dictionary index ${value} exceeds ${width} base-36 digits`);
  return encoded.padStart(width, '0');
}

function quoted(value) {
  return JSON.stringify(value);
}

function overrideCount(filename) {
  const overridePath = path.join(root, 'dictionary-overrides', filename);
  if (!fs.existsSync(overridePath)) return 0;
  return fs.readFileSync(overridePath, 'utf8').split(/\r?\n/)
    .filter((line) => line.split('#', 1)[0].trim()).length;
}

function overrideWords(filename) {
  const overridePath = path.join(root, 'dictionary-overrides', filename);
  if (!fs.existsSync(overridePath)) return [];
  return fs.readFileSync(overridePath, 'utf8').split(/\r?\n/)
    .map((line) => line.split('#', 1)[0].trim().split(/\s+/)[0])
    .filter(Boolean);
}

const source = fs.readFileSync(dictionaryPath, 'utf8');
const context = {};
vm.createContext(context);
vm.runInContext(source, context, { filename: dictionaryPath });

const words = context.DICTIONARY;
const tiers = context.WORD_TIERS;
const forms = context.WORD_FORMS;
const starts = context.WORD_STARTS;
let featured = context.WORD_FEATURED || starts;
const lemmaIds = context.WORD_LEMMA_IDS;
if (!Array.isArray(words) || !words.length) throw new Error('dictionary.js did not define DICTIONARY');
for (const [name, value, multiplier] of [
  ['WORD_TIERS', tiers, 1],
  ['WORD_FORMS', forms, 1],
  ['WORD_STARTS', starts, 1],
  ['WORD_FEATURED', featured, 1],
  ['WORD_LEMMA_IDS', lemmaIds, 4],
]) {
  if (typeof value !== 'string' || value.length !== words.length * multiplier) {
    throw new Error(`${name} is not aligned with DICTIONARY`);
  }
}

const wordIndexes = new Map(words.map((word, index) => [word, index]));
const featuredMarks = [...featured];
for (const word of overrideWords('featured.txt')) {
  const index = wordIndexes.get(word);
  if (index === undefined) throw new Error(`Featured override is missing from dictionary: ${word}`);
  if (forms[index] !== '0') throw new Error(`Featured override must be a canonical lemma: ${word}`);
  featuredMarks[index] = '1';
}
for (const word of overrideWords('unfeatured.txt')) {
  const index = wordIndexes.get(word);
  if (index === undefined) throw new Error(`Unfeatured override is missing from dictionary: ${word}`);
  featuredMarks[index] = '0';
}
featured = featuredMarks.join('');

const records = words.map((word, index) => {
  const lemmaIndex = Number.parseInt(lemmaIds.slice(index * 4, index * 4 + 4), 36);
  return {
    word,
    tier: tiers[index],
    form: forms[index],
    start: starts[index],
    featured: featured[index],
    lemma: words[lemmaIndex] || word,
  };
});
// A common/standard inflection can exceptionally point at a lemma whose own
// SCOWL frequency tier is extended. Ship those lemma records as metadata
// dependencies in the initial pack so family blocking works before Hard mode
// is loaded; their tier remains 2, so they are not playable early.
const recordsByWord = new Map(records.map((record) => [record.word, record]));
const coreLemmaDependencies = new Set(
  records.filter((record) => record.tier !== '2').map((record) => record.lemma)
);
for (const dependency of coreLemmaDependencies) {
  const record = recordsByWord.get(dependency);
  if (record && !coreLemmaDependencies.has(record.lemma)) coreLemmaDependencies.add(record.lemma);
}
const core = records.filter((record) => record.tier !== '2' || coreLemmaDependencies.has(record.word));
const extended = records.filter((record) => record.tier === '2' && !coreLemmaDependencies.has(record.word));
const packed = core.concat(extended);
const packedIndexes = new Map(packed.map((record, index) => [record.word, index]));

function makePack(recordsForPack) {
  return {
    words: recordsForPack.map((record) => record.word),
    tiers: recordsForPack.map((record) => record.tier).join(''),
    forms: recordsForPack.map((record) => record.form).join(''),
    starts: recordsForPack.map((record) => record.start).join(''),
    featured: recordsForPack.map((record) => record.featured).join(''),
    lemmaIds: recordsForPack.map((record) =>
      fixedBase36(packedIndexes.get(record.lemma) ?? packedIndexes.get(record.word))
    ).join(''),
  };
}

const corePack = makePack(core);
const extendedPack = makePack(extended);
const tierCounts = {
  common: records.filter((record) => record.tier === '0').length,
  standard: records.filter((record) => record.tier === '1').length,
  extended: extended.length,
};
const coreOutput = [
  '// Generated by tools/build-dictionary-packs.mjs; do not edit by hand.',
  '// Initial runtime pack: common + standard tiers.',
  `var DICTIONARY=${quoted(corePack.words)};`,
  `var WORD_TIERS=${quoted(corePack.tiers)};`,
  `var WORD_FORMS=${quoted(corePack.forms)};`,
  `var WORD_STARTS=${quoted(corePack.starts)};`,
  `var WORD_FEATURED=${quoted(corePack.featured)};`,
  `var WORD_LEMMA_IDS=${quoted(corePack.lemmaIds)};`,
  `var DICTIONARY_META=${quoted({
    tierNames: ['common', 'standard', 'extended'],
    counts: tierCounts,
    loadedThroughTier: 1,
    dependencyWords: core.filter((record) => record.tier === '2').length,
    totalWords: words.length,
  })};`,
  '',
].join('\n');
const extendedOutput = [
  '// Generated by tools/build-dictionary-packs.mjs; do not edit by hand.',
  '// Optional runtime pack: extended tier, installed when Hard mode is opened.',
  `var WORD_LOOP_EXTENDED_DICTIONARY_PACK=${quoted({
    words: extendedPack.words,
    tiers: extendedPack.tiers,
    forms: extendedPack.forms,
    starts: extendedPack.starts,
    featured: extendedPack.featured,
    lemmaIds: extendedPack.lemmaIds,
    loadedThroughTier: 2,
  })};`,
  '',
].join('\n');

const outputs = [
  ['dictionary-core.js', coreOutput],
  ['dictionary-extended.js', extendedOutput],
];
for (const [filename, output] of outputs) {
  fs.writeFileSync(path.join(root, filename), output, 'utf8');
}

const report = fs.existsSync(reportPath) ? JSON.parse(fs.readFileSync(reportPath, 'utf8')) : {};
report.source_repository ||= 'https://github.com/engramtech/scowl';
report.source_revision ||= 'unrecorded-existing-artifact';
report.provenance_status = report.source_revision === 'unrecorded-existing-artifact' ?
  'legacy-unrecorded' : 'locked';
report.build_parameters ||= {
  sizes: { common: 60, standard: 70, extended: 80, start_baseline: 35 },
  spelling_codes: ['A', 'B', 'Z', 'C', 'D'],
  variant_level: 4,
  excluded_parts_of_speech: ['abbr', 's'],
  categories: '',
  deaccent: true,
  ascii_lowercase_only: true,
  minimum_length: 3,
};
report.override_counts = {
  allowed: overrideCount('allow.txt'),
  denied: overrideCount('deny.txt'),
  featured_additions: overrideCount('featured.txt'),
  featured_removals: overrideCount('unfeatured.txt'),
};
report.dictionary_sha256 = sha256(fs.readFileSync(dictionaryPath));
report.featured_vocabulary_count = [...featured].filter((mark) => mark === '1').length;
report.runtime_packs = Object.fromEntries(outputs.map(([filename]) => {
  const buffer = fs.readFileSync(path.join(root, filename));
  const wordCount = filename === 'dictionary-core.js' ? core.length : extended.length;
  return [filename, { word_count: wordCount, bytes: buffer.length, sha256: sha256(buffer) }];
}));
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log(`Dictionary runtime packs written: ${core.length.toLocaleString()} core/standard, ${extended.length.toLocaleString()} extended.`);
