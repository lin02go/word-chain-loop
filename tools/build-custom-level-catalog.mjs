import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(root, 'functions', '_generated', 'custom-level-catalog.js');
const checkOnly = process.argv.includes('--check');
const configs = {
  easy: { maxTier: 0, maxStartTier: 0, minRoute: 1, maxRoute: 2, minimumBranch: 12, minimumClosers: 3, maxSlack: 3, hintLimit: 2 },
  medium: { maxTier: 1, maxStartTier: 0, minRoute: 2, maxRoute: 3, minimumBranch: 8, minimumClosers: 2, maxSlack: 3, hintLimit: 1 },
  hard: { maxTier: 2, maxStartTier: 1, minRoute: 3, maxRoute: 6, minimumBranch: 4, minimumClosers: 2, maxSlack: 4, hintLimit: 0 },
};

async function loadDictionary() {
  const context = vm.createContext({ window: {} });
  vm.runInContext(await fs.readFile(path.join(root, 'dictionary-core.js'), 'utf8'), context, { filename: 'dictionary-core.js' });
  vm.runInContext(await fs.readFile(path.join(root, 'dictionary-extended.js'), 'utf8'), context, { filename: 'dictionary-extended.js' });
  const pack = context.WORD_LOOP_EXTENDED_DICTIONARY_PACK || context.window.WORD_LOOP_EXTENDED_DICTIONARY_PACK;
  const words = context.DICTIONARY.concat(pack.words);
  return {
    words,
    tiers: context.WORD_TIERS + pack.tiers,
    forms: context.WORD_FORMS + pack.forms,
    starts: context.WORD_STARTS + pack.starts,
    featured: context.WORD_FEATURED + pack.featured,
    lemmaIds: context.WORD_LEMMA_IDS + pack.lemmaIds,
  };
}

function addEdge(graph, from, to, word) {
  if (!graph.has(from)) graph.set(from, new Map());
  const edges = graph.get(from);
  if (!edges.has(to)) edges.set(to, []);
  edges.get(to).push(word);
}

function buildDistances(graph) {
  const table = new Map();
  for (const start of graph.keys()) {
    const row = new Map([[start, 0]]);
    const queue = [start];
    for (let index = 0; index < queue.length; index++) {
      const node = queue[index];
      for (const next of (graph.get(node) || new Map()).keys()) {
        if (row.has(next)) continue;
        row.set(next, row.get(node) + 1);
        queue.push(next);
      }
    }
    table.set(start, row);
  }
  return table;
}

function shortestPath(graph, from, goal, infoByWord, excludedWords, excludedLemmas) {
  if (from === goal) return [];
  const queue = [{ node: from, path: [] }];
  const visited = new Set([from]);
  for (let index = 0; index < queue.length; index++) {
    const current = queue[index];
    for (const [next, words] of (graph.get(current.node) || new Map())) {
      const word = words.find((candidate) => !excludedWords.has(candidate) && !excludedLemmas.has(infoByWord.get(candidate).lemma));
      if (!word) continue;
      const route = current.path.concat(word);
      if (next === goal) return route;
      if (!visited.has(next)) {
        visited.add(next);
        queue.push({ node: next, path: route });
      }
    }
  }
  return null;
}

function countRoutes(graph, distances, node, goal, remaining, cap, memo) {
  if (remaining === 0) return node === goal ? 1 : 0;
  const key = `${node}|${goal}|${remaining}`;
  if (memo.has(key)) return memo.get(key);
  let total = 0;
  for (const [next, words] of (graph.get(node) || new Map())) {
    if (total >= cap || distances.get(next)?.get(goal) !== remaining - 1) continue;
    total += words.length * countRoutes(graph, distances, next, goal, remaining - 1, cap, memo);
    if (total > cap) total = cap;
  }
  memo.set(key, total);
  return total;
}

function buildMode(dictionary, config, difficulty) {
  const graph = new Map();
  const qualityGraph = new Map();
  const qualityClosers = new Map();
  const infoByWord = new Map();
  for (let index = 0; index < dictionary.words.length; index++) {
    const word = dictionary.words[index];
    const tier = Number(dictionary.tiers.charAt(index));
    if (tier > config.maxTier) continue;
    const head = word.slice(0, 2);
    const tail = word.slice(-2);
    const lemmaIndex = parseInt(dictionary.lemmaIds.slice(index * 4, index * 4 + 4), 36);
    const info = {
      word, tier, head, tail,
      lemma: dictionary.words[lemmaIndex] || word,
      isLemma: dictionary.forms.charAt(index) === '0',
      startEligible: dictionary.starts.charAt(index) === '1',
      featured: dictionary.featured.charAt(index) === '1',
    };
    infoByWord.set(word, info);
    addEdge(graph, head, tail, word);
    if (info.isLemma && info.featured && word.length <= 12) {
      addEdge(qualityGraph, head, tail, word);
      if (!qualityClosers.has(tail)) qualityClosers.set(tail, []);
      qualityClosers.get(tail).push(word);
    }
  }

  const distances = buildDistances(graph);
  const qualityDistances = buildDistances(qualityGraph);
  const routeGraph = difficulty === 'hard' ? qualityGraph : graph;
  const routeDistances = difficulty === 'hard' ? qualityDistances : distances;
  const routeMemo = new Map();
  const catalog = {};

  for (const info of infoByWord.values()) {
    if (info.tier > config.maxStartTier || !info.isLemma || !info.startEligible ||
        info.word.length < 4 || info.word.length > 10 || info.head === info.tail) continue;
    const shortestMoves = distances.get(info.tail)?.get(info.head);
    const challengeMoves = routeDistances.get(info.tail)?.get(info.head);
    if (shortestMoves === undefined || challengeMoves === undefined ||
        challengeMoves < config.minRoute || challengeMoves > config.maxRoute) continue;

    let branchWordCount = 0;
    let commonBranchCount = 0;
    for (const words of (graph.get(info.tail) || new Map()).values()) {
      branchWordCount += words.length;
      commonBranchCount += words.filter((word) => infoByWord.get(word).tier === 0).length;
    }
    if (branchWordCount < config.minimumBranch || commonBranchCount < 6) continue;

    const routeCount = countRoutes(routeGraph, routeDistances, info.tail, info.head, challengeMoves, 201, routeMemo);
    if (routeCount < 2 || routeCount > 200) continue;

    const closerLemmas = new Set();
    for (const closer of qualityClosers.get(info.head) || []) {
      const closerInfo = infoByWord.get(closer);
      if (closerInfo.lemma !== info.lemma && routeDistances.get(info.tail)?.get(closerInfo.head) === challengeMoves - 1) {
        closerLemmas.add(closerInfo.lemma);
      }
    }
    if (closerLemmas.size < config.minimumClosers) continue;

    const route = shortestPath(graph, info.tail, info.head, infoByWord, new Set([info.word]), new Set([info.lemma]));
    if (!route) continue;
    catalog[`${difficulty}:${info.word}`] = [
      info.head, shortestMoves, challengeMoves, routeCount, branchWordCount, closerLemmas.size,
      shortestMoves + config.maxSlack, config.hintLimit, [info.word, ...route],
    ];
  }
  return catalog;
}

const dictionary = await loadDictionary();
const report = JSON.parse(await fs.readFile(path.join(root, 'dictionary-report.json'), 'utf8'));
const version = report.dictionary_sha256;
const entries = {};
for (const [difficulty, config] of Object.entries(configs)) {
  Object.assign(entries, buildMode(dictionary, config, difficulty));
}
const checksum = crypto.createHash('sha256').update(JSON.stringify(entries)).digest('hex');
const source = `// Generated by tools/build-custom-level-catalog.mjs; do not edit by hand.\n` +
  `export const CUSTOM_LEVEL_DICTIONARY_VERSION=${JSON.stringify(version)};\n` +
  `export const CUSTOM_LEVEL_CATALOG_CHECKSUM=${JSON.stringify(checksum)};\n` +
  `export const CUSTOM_LEVEL_CATALOG=${JSON.stringify(entries)};\n`;

if (checkOnly) {
  const current = await fs.readFile(outputPath, 'utf8').catch(() => '');
  if (current !== source) throw new Error('Custom-level catalog is stale. Run npm run build:workshop-catalog.');
  console.log(`Custom-level catalog is current: ${Object.keys(entries).length} eligible starts.`);
} else {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, source);
  console.log(`Custom-level catalog generated: ${Object.keys(entries).length} eligible starts.`);
}
