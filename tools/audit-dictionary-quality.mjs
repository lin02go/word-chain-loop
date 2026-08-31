import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(root, 'dictionary-quality-report.json');
const dictionaryPath = path.join(root, 'dictionary.js');

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function loadDictionary() {
  const context = {};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(dictionaryPath, 'utf8'), context, { filename: dictionaryPath });
  return context;
}

function overrideWords(filename) {
  const file = path.join(root, 'dictionary-overrides', filename);
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split(/\r?\n/)
    .map((line) => line.split('#', 1)[0].trim().split(/\s+/)[0])
    .filter(Boolean);
}

function addEdge(graph, head, tail, word) {
  if (!graph.has(head)) graph.set(head, new Map());
  if (!graph.get(head).has(tail)) graph.get(head).set(tail, []);
  graph.get(head).get(tail).push(word);
}

function distancesFor(graph) {
  const distances = {};
  for (const start of graph.keys()) {
    const row = { [start]: 0 };
    const queue = [start];
    for (let index = 0; index < queue.length; index++) {
      const edges = graph.get(queue[index]);
      if (!edges) continue;
      for (const next of edges.keys()) {
        if (row[next] !== undefined) continue;
        row[next] = row[queue[index]] + 1;
        queue.push(next);
      }
    }
    distances[start] = row;
  }
  return distances;
}

function countRoutes(graph, distances, node, goal, remaining, cap, memo) {
  if (remaining === 0) return node === goal ? 1 : 0;
  const key = `${node}|${goal}|${remaining}`;
  if (memo[key] !== undefined) return memo[key];
  let total = 0;
  const edges = graph.get(node);
  if (!edges) return 0;
  for (const [next, edgeWords] of edges) {
    if (total >= cap || distances[next]?.[goal] !== remaining - 1) continue;
    total += edgeWords.length * countRoutes(graph, distances, next, goal, remaining - 1, cap, memo);
    if (total > cap) total = cap;
  }
  memo[key] = total;
  return total;
}

const source = loadDictionary();
const words = source.DICTIONARY;
const tiers = source.WORD_TIERS;
const forms = source.WORD_FORMS;
const starts = source.WORD_STARTS;
const lemmaIds = source.WORD_LEMMA_IDS;
const indexes = new Map(words.map((word, index) => [word, index]));
const featuredMarks = [...(source.WORD_FEATURED || starts)];
for (const word of overrideWords('featured.txt')) if (indexes.has(word)) featuredMarks[indexes.get(word)] = '1';
for (const word of overrideWords('unfeatured.txt')) if (indexes.has(word)) featuredMarks[indexes.get(word)] = '0';
const featured = featuredMarks.join('');
const info = new Map(words.map((word, index) => {
  const lemmaIndex = Number.parseInt(lemmaIds.slice(index * 4, index * 4 + 4), 36);
  return [word, {
    word, index, tier: Number(tiers[index]), isLemma: forms[index] === '0',
    start: starts[index] === '1', featured: featured[index] === '1',
    lemma: words[lemmaIndex] || word, head: word.slice(0, 2), tail: word.slice(-2),
  }];
}));

const configs = {
  easy: { maxTier: 0, minRoute: 1, maxRoute: 2, minimumBranch: 12, minimumClosers: 3 },
  medium: { maxTier: 1, minRoute: 2, maxRoute: 3, minimumBranch: 8, minimumClosers: 2 },
  hard: { maxTier: 2, minRoute: 3, maxRoute: 6, minimumBranch: 4, minimumClosers: 2 },
};

function buildMode(name) {
  const config = configs[name];
  const graph = new Map();
  const qualityGraph = new Map();
  const qualityClosers = new Map();
  const modeWords = [];
  for (const word of words) {
    const item = info.get(word);
    if (item.tier > config.maxTier) continue;
    modeWords.push(item);
    addEdge(graph, item.head, item.tail, word);
    if (item.isLemma && item.featured && word.length <= 12) {
      addEdge(qualityGraph, item.head, item.tail, word);
      if (!qualityClosers.has(item.tail)) qualityClosers.set(item.tail, []);
      qualityClosers.get(item.tail).push(item);
    }
  }
  const distances = distancesFor(graph);
  const qualityDistances = distancesFor(qualityGraph);
  const routeGraph = name === 'hard' ? qualityGraph : graph;
  const routeDistances = name === 'hard' ? qualityDistances : distances;
  const routeMemo = {};
  const candidates = [];
  for (const item of modeWords) {
    if (item.tier > (name === 'hard' ? 1 : 0) || !item.isLemma || !item.start) continue;
    if (item.word.length < 4 || item.word.length > 10 || item.head === item.tail) continue;
    const actualDistance = distances[item.tail]?.[item.head];
    const challengeDistance = routeDistances[item.tail]?.[item.head];
    if (!actualDistance || !challengeDistance || challengeDistance < config.minRoute || challengeDistance > config.maxRoute) continue;
    const outgoing = graph.get(item.tail);
    let branchWords = 0;
    let commonBranchWords = 0;
    if (outgoing) for (const edgeWords of outgoing.values()) for (const edgeWord of edgeWords) {
      branchWords++;
      if (info.get(edgeWord).tier === 0) commonBranchWords++;
    }
    if (branchWords < config.minimumBranch || commonBranchWords < 6) continue;
    const routeCount = countRoutes(routeGraph, routeDistances, item.tail, item.head, challengeDistance, 201, routeMemo);
    if (routeCount < 2 || routeCount > 200) continue;
    const closerLemmas = new Set();
    for (const closer of qualityClosers.get(item.head) || []) {
      if (closer.lemma !== item.lemma && routeDistances[item.tail]?.[closer.head] === challengeDistance - 1) {
        closerLemmas.add(closer.lemma);
      }
    }
    if (closerLemmas.size < config.minimumClosers) continue;
    candidates.push({
      word: item.word, head: item.head, tail: item.tail, actualDistance,
      challengeDistance, routeCount, familiarClosers: closerLemmas.size,
    });
  }
  const distanceDistribution = {};
  for (const candidate of candidates) {
    distanceDistribution[candidate.challengeDistance] = (distanceDistribution[candidate.challengeDistance] || 0) + 1;
  }
  return {
    candidates,
    summary: {
      candidate_count: candidates.length,
      distinct_opening_pairs: new Set(candidates.map((candidate) => candidate.head)).size,
      challenge_distance_distribution: distanceDistribution,
      examples: candidates.slice(0, 20),
    },
  };
}

const modes = Object.fromEntries(Object.keys(configs).map((name) => [name, buildMode(name)]));
const hintDemand = new Map();
const closerDemand = new Map();
for (const mode of Object.values(modes)) for (const candidate of mode.candidates) {
  hintDemand.set(candidate.tail, (hintDemand.get(candidate.tail) || 0) + 1);
  closerDemand.set(candidate.head, (closerDemand.get(candidate.head) || 0) + 1);
}
const manuallyReviewed = new Set([
  ...overrideWords('featured.txt'), ...overrideWords('unfeatured.txt'),
  ...overrideWords('allow.txt'), ...overrideWords('deny.txt'),
]);
const reviewQueue = [];
for (const item of info.values()) {
  if (!item.featured || !item.isLemma || manuallyReviewed.has(item.word)) continue;
  const hintExposure = hintDemand.get(item.head) || 0;
  const closerExposure = closerDemand.get(item.tail) || 0;
  const score = hintExposure * 2 + closerExposure * 3 + (item.word.length === 3 ? 20 : 0);
  if (!score) continue;
  const reasons = [];
  if (item.word.length === 3) reasons.push('short-featured-word');
  if (hintExposure) reasons.push('potential-hint');
  if (closerExposure) reasons.push('potential-closer');
  reviewQueue.push({ word: item.word, tier: item.tier, length: item.word.length, score, hintExposure, closerExposure, reasons });
}
reviewQueue.sort((a, b) => b.score - a.score || a.length - b.length || a.word.localeCompare(b.word));

const report = {
  schema_version: 1,
  dictionary_sha256: sha256(dictionaryPath),
  override_sha256: Object.fromEntries(['allow.txt', 'deny.txt', 'featured.txt', 'unfeatured.txt'].map((filename) => [
    filename, sha256(path.join(root, 'dictionary-overrides', filename)),
  ])),
  summary: {
    words: words.length,
    featured_words: [...featured].filter((mark) => mark === '1').length,
    manually_reviewed_words: manuallyReviewed.size,
    review_queue_total: reviewQueue.length,
  },
  mode_quality: Object.fromEntries(Object.entries(modes).map(([name, mode]) => [name, mode.summary])),
  review_queue: reviewQueue.slice(0, 200),
};
const serialized = `${JSON.stringify(report, null, 2)}\n`;

if (process.argv.includes('--check')) {
  if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, 'utf8') !== serialized) {
    console.error('Dictionary quality report is stale. Run npm run audit:dictionary.');
    process.exit(1);
  }
  if (report.mode_quality.hard.candidate_count < 100 || report.mode_quality.hard.distinct_opening_pairs < 20) {
    console.error('Hard mode quality pool is too small.');
    process.exit(1);
  }
  console.log(`Dictionary quality report passed: ${report.mode_quality.hard.candidate_count} Hard candidates across ` +
    `${report.mode_quality.hard.distinct_opening_pairs} opening pairs.`);
} else {
  fs.writeFileSync(outputPath, serialized, 'utf8');
  console.log(`Dictionary quality report written: ${reviewQueue.length} review candidates; ` +
    `${report.mode_quality.hard.candidate_count} Hard starts.`);
}
