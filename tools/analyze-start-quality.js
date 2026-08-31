const fs = require('fs');
const vm = require('vm');

const source = fs.readFileSync('dictionary.js', 'utf8');
const context = {};
vm.createContext(context);
vm.runInContext(source, context);

const words = context.DICTIONARY;
const tiers = context.WORD_TIERS;
const forms = context.WORD_FORMS;
const starts = context.WORD_STARTS;
let featured = context.WORD_FEATURED || starts;
const featuredMarks = [...featured];
const wordIndexes = new Map(words.map((word, index) => [word, index]));
for (const [filename, mark] of [['featured.txt', '1'], ['unfeatured.txt', '0']]) {
  const file = `dictionary-overrides/${filename}`;
  if (!fs.existsSync(file)) continue;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const word = line.split('#', 1)[0].trim().split(/\s+/)[0];
    if (word && wordIndexes.has(word)) featuredMarks[wordIndexes.get(word)] = mark;
  }
}
featured = featuredMarks.join('');
const modeWords = [];
const graph = new Map();

for (let i = 0; i < words.length; i++) {
  if (Number(tiers[i]) > 1) continue;
  const word = words[i];
  modeWords.push({ word, index: i });
  const head = word.slice(0, 2);
  const tail = word.slice(-2);
  if (!graph.has(head)) graph.set(head, new Map());
  const edges = graph.get(head);
  if (!edges.has(tail)) edges.set(tail, []);
  edges.get(tail).push({ word, index: i });
}

const distances = {};
for (const start of graph.keys()) {
  const row = { [start]: 0 };
  const queue = [start];
  for (let q = 0; q < queue.length; q++) {
    const edges = graph.get(queue[q]);
    if (!edges) continue;
    for (const next of edges.keys()) {
      if (row[next] === undefined) {
        row[next] = row[queue[q]] + 1;
        queue.push(next);
      }
    }
  }
  distances[start] = row;
}

function countRoutes(node, goal, remaining, cap, memo) {
  if (remaining === 0) return node === goal ? 1 : 0;
  const key = `${node}|${goal}|${remaining}`;
  if (memo[key] !== undefined) return memo[key];
  let total = 0;
  const edges = graph.get(node);
  if (!edges) return 0;
  for (const [next, edgeWords] of edges) {
    if (total >= cap) break;
    if (!distances[next] || distances[next][goal] !== remaining - 1) continue;
    total += edgeWords.length * countRoutes(next, goal, remaining - 1, cap, memo);
    if (total > cap) total = cap;
  }
  memo[key] = total;
  return total;
}

const candidates = [];
const routeMemo = {};
for (const item of modeWords) {
  const { word, index } = item;
  if (Number(tiers[index]) > 0 || forms[index] !== '0' || starts[index] !== '1') continue;
  if (word.length < 4 || word.length > 10) continue;
  const head = word.slice(0, 2);
  const tail = word.slice(-2);
  if (head === tail) continue;
  const distance = distances[tail] && distances[tail][head];
  if (distance === undefined || distance < 2 || distance > 3) continue;
  const outgoing = graph.get(tail);
  let branchWords = 0;
  let commonBranchWords = 0;
  if (outgoing) for (const edgeWords of outgoing.values()) {
    branchWords += edgeWords.length;
    commonBranchWords += edgeWords.filter(x => Number(tiers[x.index]) === 0).length;
  }
  if (branchWords < 8 || commonBranchWords < 6) continue;
  const routeCount = countRoutes(tail, head, distance, 201, routeMemo);
  if (routeCount < 2 || routeCount > 200) continue;
  candidates.push({ word, head, tail, distance, routeCount });
}

for (const candidate of candidates) {
  candidate.qualityClosers = [];
  for (const { word, index } of modeWords) {
    if (word.slice(-2) !== candidate.head) continue;
    if (Number(tiers[index]) !== 0 || forms[index] !== '0' || featured[index] !== '1' || word.length > 12) continue;
    const closerHead = word.slice(0, 2);
    if (distances[candidate.tail] && distances[candidate.tail][closerHead] === candidate.distance - 1) {
      candidate.qualityClosers.push(word);
    }
  }
}

const byHead = {};
for (const c of candidates) {
  const row = byHead[c.head] ||= { head: c.head, candidates: 0, starts: [], naturalCount: 0, commonCount: 0, naturalClosers: [] };
  row.candidates++;
  if (row.starts.length < 6) row.starts.push(c.word);
}
for (const { word, index } of modeWords) {
  const row = byHead[word.slice(-2)];
  if (!row || Number(tiers[index]) !== 0) continue;
  row.commonCount++;
  if (forms[index] === '0' && featured[index] === '1' && word.length <= 12) {
    row.naturalCount++;
    if (row.naturalClosers.length < 12) row.naturalClosers.push(word);
  }
}

const rows = Object.values(byHead);
console.log(JSON.stringify({
  candidates: candidates.length,
  heads: rows.length,
  problem: ['ho', 'fa', 'wo'].map(head => byHead[head] || { head, candidates: 0 }),
  problemCandidates: candidates.filter(c => ['ho', 'fa', 'wo'].includes(c.head)).slice(0, 30),
  candidateQualityDistribution: candidates.reduce((acc, candidate) => {
    const bucket = Math.min(candidate.qualityClosers.length, 8);
    acc[bucket] = (acc[bucket] || 0) + 1;
    return acc;
  }, {}),
  survivorsAtTwoClosers: {
    total: candidates.filter(c => c.qualityClosers.length >= 2).length,
    problem: ['ho', 'fa', 'wo'].map(head => ({
      head,
      count: candidates.filter(c => c.head === head && c.qualityClosers.length >= 2).length,
      examples: candidates.filter(c => c.head === head && c.qualityClosers.length >= 2).slice(0, 8)
    }))
  },
  zeroQualityExamples: candidates.filter(c => c.qualityClosers.length === 0).slice(0, 40),
  weakest: rows.sort((a, b) => a.naturalCount - b.naturalCount || b.candidates - a.candidates).slice(0, 35),
  distribution: rows.reduce((acc, row) => {
    const bucket = Math.min(row.naturalCount, 10);
    acc[bucket] = (acc[bucket] || 0) + row.candidates;
    return acc;
  }, {})
}, null, 2));
