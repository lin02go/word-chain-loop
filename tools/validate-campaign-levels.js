const fs = require('fs');
const vm = require('vm');

function loadGlobals(file) {
  const context = {};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
  return context;
}

const dictionary = loadGlobals('dictionary.js');
const campaign = loadGlobals('campaign-levels.js');
const words = dictionary.DICTIONARY;
const tiers = dictionary.WORD_TIERS;
const forms = dictionary.WORD_FORMS;
const starts = dictionary.WORD_STARTS;
const lemmaIds = dictionary.WORD_LEMMA_IDS;

const configs = {
  easy: { maxTier: 0, minRoute: 1, maxRoute: 2, minimumBranch: 12, minimumClosers: 3 },
  medium: { maxTier: 1, minRoute: 2, maxRoute: 3, minimumBranch: 8, minimumClosers: 2 },
  // The full hard dictionary makes the two-letter graph very dense. Campaign
  // levels therefore require at least two moves (rather than casual mode's
  // aspirational three) so late levels stay valid without obscure padding.
  hard: { maxTier: 2, minRoute: 2, maxRoute: 6, minimumBranch: 4, minimumClosers: 2 }
};

function buildMode(difficulty) {
  const config = configs[difficulty];
  const graph = new Map();
  const wordInfo = new Map();
  const qualityClosers = new Map();

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const tier = Number(tiers.charAt(i) || 2);
    const lemmaIndex = lemmaIds && lemmaIds.length >= (i + 1) * 4 ?
      parseInt(lemmaIds.substr(i * 4, 4), 36) : i;
    const info = {
      word,
      tier,
      isLemma: !forms || forms.charAt(i) === '0',
      startEligible: !starts || starts.charAt(i) === '1',
      lemma: words[lemmaIndex] || word,
      head: word.slice(0, 2),
      tail: word.slice(-2)
    };
    wordInfo.set(word, info);
    if (word.length < 3 || !/^[a-z]+$/.test(word) || tier > config.maxTier) continue;
    if (!graph.has(info.head)) graph.set(info.head, new Map());
    const edges = graph.get(info.head);
    if (!edges.has(info.tail)) edges.set(info.tail, []);
    edges.get(info.tail).push(word);
    if (tier === 0 && info.isLemma && info.startEligible && word.length <= 12) {
      if (!qualityClosers.has(info.tail)) qualityClosers.set(info.tail, []);
      qualityClosers.get(info.tail).push(word);
    }
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

  return { config, graph, wordInfo, qualityClosers, distances };
}

function countRoutes(mode, node, goal, remaining, cap, memo) {
  if (remaining === 0) return node === goal ? 1 : 0;
  const key = `${node}|${goal}|${remaining}`;
  if (memo[key] !== undefined) return memo[key];
  let total = 0;
  const edges = mode.graph.get(node);
  if (!edges) return 0;
  for (const [next, edgeWords] of edges) {
    if (total >= cap) break;
    if (!mode.distances[next] || mode.distances[next][goal] !== remaining - 1) continue;
    total += edgeWords.length * countRoutes(mode, next, goal, remaining - 1, cap, memo);
    if (total > cap) total = cap;
  }
  memo[key] = total;
  return total;
}

function shortestPath(mode, from, goal, excludedWords, excludedLemmas) {
  if (from === goal) return [];
  const queue = [{ node: from, path: [] }];
  const visited = new Set([from]);
  while (queue.length) {
    const current = queue.shift();
    const edges = mode.graph.get(current.node);
    if (!edges) continue;
    for (const [next, edgeWords] of edges) {
      const word = edgeWords.find(candidate => {
        const info = mode.wordInfo.get(candidate);
        return !excludedWords.has(candidate) && !excludedLemmas.has(info.lemma);
      });
      if (!word) continue;
      const path = current.path.concat(word);
      if (next === goal) return path;
      if (!visited.has(next)) {
        visited.add(next);
        queue.push({ node: next, path });
      }
    }
  }
  return null;
}

function qualityRoutes(mode, startInfo, distance, limit) {
  const routes = [];
  const usedLemmas = new Set([startInfo.lemma]);
  function walk(node, remaining, path) {
    if (routes.length >= limit || remaining === 0) {
      if (remaining === 0 && node === startInfo.head) routes.push(path.slice());
      return;
    }
    const edges = mode.graph.get(node);
    if (!edges) return;
    for (const [next, edgeWords] of edges) {
      if (!mode.distances[next] || mode.distances[next][startInfo.head] !== remaining - 1) continue;
      const candidates = edgeWords.filter(word => {
        const info = mode.wordInfo.get(word);
        return info.tier === 0 && info.isLemma && info.word.length <= 12 && !usedLemmas.has(info.lemma);
      }).sort((a, b) => a.length - b.length || a.localeCompare(b));
      for (const word of candidates) {
        const lemma = mode.wordInfo.get(word).lemma;
        usedLemmas.add(lemma);
        path.push(word);
        walk(next, remaining - 1, path);
        path.pop();
        usedLemmas.delete(lemma);
        if (routes.length >= limit) return;
      }
    }
  }
  walk(startInfo.tail, distance, []);
  routes.sort((a, b) => {
    const score = route => route.reduce((total, word) => total + word.length, 0);
    return score(a) - score(b) || a.join('|').localeCompare(b.join('|'));
  });
  return routes;
}

function failureTestRoute(mode, startInfo, moveLimit) {
  const usedWords = new Set([startInfo.word]);
  const usedLemmas = new Set([startInfo.lemma]);
  function walk(node, remaining, path) {
    if (remaining === 0) return node === startInfo.head ? null : path.slice();
    const edges = mode.graph.get(node);
    if (!edges) return null;
    const candidates = [];
    for (const [next, edgeWords] of edges) for (const word of edgeWords) {
      const info = mode.wordInfo.get(word);
      if (next === startInfo.head || usedWords.has(word) || usedLemmas.has(info.lemma)) continue;
      if (info.tier !== 0 || !info.isLemma || info.word.length > 12) continue;
      candidates.push({ word, next, info });
    }
    candidates.sort((a, b) => a.word.length - b.word.length || a.word.localeCompare(b.word));
    for (const candidate of candidates) {
      usedWords.add(candidate.word);
      usedLemmas.add(candidate.info.lemma);
      const canStillFinish = shortestPath(mode, candidate.next, startInfo.head, usedWords, usedLemmas);
      if (canStillFinish) {
        path.push(candidate.word);
        const found = walk(candidate.next, remaining - 1, path);
        if (found) return found;
        path.pop();
      }
      usedWords.delete(candidate.word);
      usedLemmas.delete(candidate.info.lemma);
    }
    return null;
  }
  return walk(startInfo.tail, moveLimit, []);
}

function hintCandidateCount(mode, node, goal, usedWords, usedLemmas) {
  let count = 0;
  const edges = mode.graph.get(node);
  if (!edges) return 0;
  for (const edgeWords of edges.values()) for (const word of edgeWords) {
    const info = mode.wordInfo.get(word);
    if (usedWords.has(word) || usedLemmas.has(info.lemma)) continue;
    const nextWords = new Set(usedWords);
    const nextLemmas = new Set(usedLemmas);
    nextWords.add(word);
    nextLemmas.add(info.lemma);
    if (info.tail === goal || shortestPath(mode, info.tail, goal, nextWords, nextLemmas)) count++;
  }
  return count;
}

function hintCountsAlongRoute(mode, startInfo, route) {
  if (!route) return [];
  const usedWords = new Set([startInfo.word]);
  const usedLemmas = new Set([startInfo.lemma]);
  let node = startInfo.tail;
  const counts = [{ after: startInfo.word, required: node, count: hintCandidateCount(mode, node, startInfo.head, usedWords, usedLemmas) }];
  for (const word of route) {
    const info = mode.wordInfo.get(word);
    usedWords.add(word);
    usedLemmas.add(info.lemma);
    node = info.tail;
    counts.push({ after: word, required: node, count: hintCandidateCount(mode, node, startInfo.head, usedWords, usedLemmas) });
  }
  return counts;
}

const modes = {};
const report = [];
const structureFailures = [];
const levelIds = new Set();
const startWords = new Set();
if (!Array.isArray(campaign.CAMPAIGN_LEVELS) || campaign.CAMPAIGN_LEVELS.length !== 100) {
  structureFailures.push('campaign must contain exactly 100 levels');
}
for (let i = 0; i < campaign.CAMPAIGN_LEVELS.length; i++) {
  const level = campaign.CAMPAIGN_LEVELS[i];
  if (level.id !== i + 1) structureFailures.push(`level ${i + 1} has a non-sequential id`);
  if (levelIds.has(level.id)) structureFailures.push(`duplicate level id ${level.id}`);
  if (startWords.has(level.startWord)) structureFailures.push(`duplicate start word ${level.startWord}`);
  levelIds.add(level.id);
  startWords.add(level.startWord);
}
let invalid = structureFailures.length;

for (const level of campaign.CAMPAIGN_LEVELS) {
  const mode = modes[level.difficulty] ||= buildMode(level.difficulty);
  const info = mode.wordInfo.get(level.startWord);
  const failures = [];
  if (!info || !mode.graph.get(info.head)?.get(info.tail)?.includes(level.startWord)) {
    failures.push('start word is not available in this difficulty');
  }
  const distance = info && mode.distances[info.tail] && mode.distances[info.tail][info.head];
  if (distance === undefined) failures.push('no route back to the opening pair');
  else if (distance < mode.config.minRoute || distance > mode.config.maxRoute) failures.push('route length is outside difficulty range');

  let branchWords = 0;
  let commonBranchWords = 0;
  const outgoing = info && mode.graph.get(info.tail);
  if (outgoing) for (const edgeWords of outgoing.values()) {
    branchWords += edgeWords.length;
    commonBranchWords += edgeWords.filter(word => mode.wordInfo.get(word).tier === 0).length;
  }
  if (branchWords < mode.config.minimumBranch) failures.push('too few permitted next words');
  if (commonBranchWords < 6) failures.push('too few common next words');

  const routeCount = distance === undefined ? 0 : countRoutes(mode, info.tail, info.head, distance, 201, {});
  if (routeCount < 2 || routeCount > 200) failures.push('shortest-route count is outside 2–200');

  const closerLemmas = new Set();
  if (distance !== undefined) for (const closer of mode.qualityClosers.get(info.head) || []) {
    const closerInfo = mode.wordInfo.get(closer);
    if (closerInfo.lemma === info.lemma) continue;
    if (mode.distances[info.tail] && mode.distances[info.tail][closerInfo.head] === distance - 1) closerLemmas.add(closerInfo.lemma);
  }
  if (closerLemmas.size < mode.config.minimumClosers) failures.push('too few reachable familiar closing words');

  const route = distance === undefined ? null : shortestPath(
    mode, info.tail, info.head, new Set([level.startWord]), new Set([info.lemma])
  );
  if (!route) failures.push('no playable route after excluding the start word family');
  const familiarRoutes = distance === undefined ? [] : qualityRoutes(mode, info, distance, 3);
  if (familiarRoutes.length < 2) failures.push('fewer than two fully familiar routes');
  const maxMoves = distance === undefined ? null : Math.max(distance + level.parSlack + 1, distance + level.maxSlack);
  const failureRoute = maxMoves === null ? null : failureTestRoute(mode, info, maxMoves);
  const failureHintCounts = failureRoute ? hintCountsAlongRoute(mode, info, failureRoute) : [];
  if (failures.length) invalid++;
  report.push({
    level: level.id,
    startWord: level.startWord,
    difficulty: level.difficulty,
    distance,
    parMoves: distance === undefined ? null : distance + level.parSlack,
    maxMoves,
    routeCount,
    familiarClosers: closerLemmas.size,
    sampleRoute: familiarRoutes[0] || route,
    familiarRouteCount: familiarRoutes.length,
    failureTestRoute: failureRoute,
    failureHintCounts,
    valid: failures.length === 0,
    failures
  });
}

const suggestions = {};
const suggestAll = process.argv.includes('--suggest');
const suggestionDifficulties = suggestAll ? Object.keys(configs) :
  [...new Set(report.filter(item => !item.valid).map(item => item.difficulty))];
for (const difficulty of suggestionDifficulties) {
  const mode = modes[difficulty] ||= buildMode(difficulty);
  const rows = [];
  for (const info of mode.wordInfo.values()) {
    const maxStartTier = difficulty === 'hard' ? 1 : 0;
    if (info.tier > maxStartTier || !info.isLemma || !info.startEligible ||
        info.word.length < 4 || info.word.length > 10 || info.head === info.tail) continue;
    const distance = mode.distances[info.tail] && mode.distances[info.tail][info.head];
    if (distance === undefined || distance < mode.config.minRoute || distance > mode.config.maxRoute) continue;
    let branchWords = 0;
    let commonBranchWords = 0;
    for (const edgeWords of (mode.graph.get(info.tail) || new Map()).values()) {
      branchWords += edgeWords.length;
      commonBranchWords += edgeWords.filter(word => mode.wordInfo.get(word).tier === 0).length;
    }
    if (branchWords < mode.config.minimumBranch || commonBranchWords < 6) continue;
    const routeCount = countRoutes(mode, info.tail, info.head, distance, 201, {});
    if (routeCount < 2 || routeCount > 200) continue;
    const closerLemmas = new Set();
    for (const closer of mode.qualityClosers.get(info.head) || []) {
      const closerInfo = mode.wordInfo.get(closer);
      if (closerInfo.lemma !== info.lemma && mode.distances[info.tail] &&
          mode.distances[info.tail][closerInfo.head] === distance - 1) closerLemmas.add(closerInfo.lemma);
    }
    if (closerLemmas.size < mode.config.minimumClosers) continue;
    const route = shortestPath(mode, info.tail, info.head, new Set([info.word]), new Set([info.lemma]));
    if (!route) continue;
    const familiarRoutes = qualityRoutes(mode, info, distance, 3);
    if (familiarRoutes.length < 2) continue;
    rows.push({ word: info.word, tier: info.tier, distance, routeCount, familiarClosers: closerLemmas.size,
      familiarRouteCount: familiarRoutes.length, sampleRoute: familiarRoutes[0] });
  }
  if (suggestAll && rows.length > 120) {
    suggestions[difficulty] = Array.from({ length: 120 }, (_, index) =>
      rows[Math.floor(index * rows.length / 120)]
    );
  } else {
    suggestions[difficulty] = rows.slice(0, 120);
  }
}

try {
  const savedLevels = {};
  for (let id = 1; id <= 12; id++) savedLevels[id] = { completed: true };
  const controllerContext = {
    window: {},
    localStorage: {
      getItem() {
        return JSON.stringify({ version: 1, unlockedLevel: 12, lastPlayedLevel: 12, levels: savedLevels });
      }
    }
  };
  vm.createContext(controllerContext);
  vm.runInContext(fs.readFileSync('campaign.js', 'utf8'), controllerContext, { filename: 'campaign.js' });
  const prototype = controllerContext.window.CampaignController.prototype;
  const migrated = prototype.loadProgress.call({
    levels: campaign.CAMPAIGN_LEVELS,
    emptyProgress: prototype.emptyProgress
  });
  if (migrated.unlockedLevel !== 13) {
    structureFailures.push('completed legacy campaign progress must unlock level 13');
    invalid++;
  }
} catch (error) {
  structureFailures.push(`campaign progress migration failed: ${error.message}`);
  invalid++;
}

const output = { valid: invalid === 0, invalid, structureFailures, levels: report, suggestions };
const summary = {
  valid: output.valid,
  invalid: output.invalid,
  structureFailures,
  levelCount: report.length,
  difficultyCounts: report.reduce((counts, level) => {
    counts[level.difficulty] = (counts[level.difficulty] || 0) + 1;
    return counts;
  }, {}),
  failedLevels: report.filter((level) => !level.valid),
};
const printable = process.argv.includes('--suggest-only') ? { suggestions } :
  (process.argv.includes('--report') ? output : summary);
console.log(JSON.stringify(printable, null, 2));
process.exitCode = invalid === 0 ? 0 : 1;
