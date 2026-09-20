import fs from 'node:fs';
import vm from 'node:vm';

function loadGlobals(file) {
  const context = { module: { exports: {} } };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
  return { ...context, ...context.module.exports };
}

const daily = loadGlobals('daily-challenges.js');
const campaign = loadGlobals('campaign-levels.js');
const failures = [];
const challenges = daily.DAILY_CHALLENGES;
const difficulties = new Set(['easy', 'medium', 'hard']);
const dailyClientText = fs.readFileSync('daily-challenge.js', 'utf8');

try {
  new vm.Script(dailyClientText, { filename: 'daily-challenge.js' });
} catch (error) {
  failures.push(`daily challenge controller has invalid JavaScript: ${error.message}`);
}
if (!dailyClientText.includes("window.location.protocol === 'http:'") ||
    !dailyClientText.includes('if (!canUseBackend())')) {
  failures.push('daily challenge API must avoid requests from unsupported URL protocols');
}
try {
  let fetchCalled = false;
  const blockedFetch = () => { fetchCalled = true; return Promise.resolve(); };
  const fileContext = {
    window: { location: { protocol: 'file:' }, fetch: blockedFetch },
    document: {}, console, fetch: blockedFetch,
  };
  vm.createContext(fileContext);
  vm.runInContext(dailyClientText, fileContext, { filename: 'daily-challenge.js' });
  await fileContext.window.DailyChallengeController.prototype.fetchJson('/api/daily-challenge/complete', {
    method: 'POST', body: '{}',
  }).then(() => failures.push('file protocol daily API unexpectedly resolved')).catch(() => {});
  if (fetchCalled) failures.push('file protocol daily API reached fetch instead of failing safely');
} catch (error) {
  failures.push(`file protocol daily API guard failed: ${error.message}`);
}

if (!Array.isArray(challenges)) {
  failures.push('DAILY_CHALLENGES must be an array');
} else if (challenges.length < 30) {
  failures.push(`daily challenge pool must contain at least 30 entries; found ${challenges.length}`);
}

if (daily.DAILY_CHALLENGE_TIME_ZONE !== 'Asia/Shanghai') {
  failures.push('daily challenge timezone must be Asia/Shanghai');
}

const campaignByWord = new Map((campaign.CAMPAIGN_LEVELS || []).map((level) => [level.startWord, level]));
const ids = new Set();
const words = new Set();
const titles = new Set();
const counts = { easy: 0, medium: 0, hard: 0 };

for (let index = 0; index < (challenges || []).length; index++) {
  const challenge = challenges[index];
  const label = `entry ${index + 1}`;
  const expectedId = `daily-${String(index + 1).padStart(3, '0')}`;
  if (!challenge || typeof challenge !== 'object') {
    failures.push(`${label} must be an object`);
    continue;
  }
  if (challenge.id !== expectedId) failures.push(`${label} must use sequential id ${expectedId}`);
  if (ids.has(challenge.id)) failures.push(`${label} has duplicate id ${challenge.id}`);
  ids.add(challenge.id);
  if (typeof challenge.title !== 'string' || challenge.title.trim().length < 2 || challenge.title.length > 20) {
    failures.push(`${label} has an invalid title`);
  }
  if (titles.has(challenge.title)) failures.push(`${label} has duplicate title ${challenge.title}`);
  titles.add(challenge.title);
  if (typeof challenge.startWord !== 'string' || !/^[a-z]{3,45}$/.test(challenge.startWord)) {
    failures.push(`${label} has an invalid startWord`);
  }
  if (words.has(challenge.startWord)) failures.push(`${label} has duplicate startWord ${challenge.startWord}`);
  words.add(challenge.startWord);
  if (!difficulties.has(challenge.difficulty)) failures.push(`${label} has an invalid difficulty`);
  else counts[challenge.difficulty]++;
  if (!Number.isInteger(challenge.parMoves) || challenge.parMoves < 1 || challenge.parMoves > 8) {
    failures.push(`${label} has parMoves outside 1-8`);
  }
  if (!Number.isInteger(challenge.maxMoves) || challenge.maxMoves < challenge.parMoves || challenge.maxMoves > 12) {
    failures.push(`${label} has maxMoves outside parMoves-12`);
  }
  if (!Number.isInteger(challenge.hintLimit) || challenge.hintLimit < 0 || challenge.hintLimit > 3) {
    failures.push(`${label} has hintLimit outside 0-3`);
  }

  const source = campaignByWord.get(challenge.startWord);
  if (!source) {
    failures.push(`${label} startWord is not backed by a campaign level`);
    continue;
  }
  const expectedPar = source.minimumIntermediateWords + source.parSlack;
  const expectedMax = Math.max(expectedPar + 1, source.minimumIntermediateWords + source.maxSlack);
  if (challenge.difficulty !== source.difficulty) failures.push(`${label} difficulty differs from campaign`);
  if (challenge.parMoves !== expectedPar) failures.push(`${label} parMoves differs from campaign (${expectedPar})`);
  if (challenge.maxMoves !== expectedMax) failures.push(`${label} maxMoves differs from campaign (${expectedMax})`);
  if (challenge.hintLimit !== source.hintLimit) failures.push(`${label} hintLimit differs from campaign (${source.hintLimit})`);
}

for (const difficulty of difficulties) {
  if (counts[difficulty] < 8) failures.push(`pool must contain at least 8 ${difficulty} entries`);
}

try {
  const first = daily.getDailyChallenge('2026-01-01');
  const second = daily.getDailyChallenge('2026-01-02');
  const wrapped = daily.getDailyChallenge(`2026-01-${String(challenges.length + 1).padStart(2, '0')}`);
  if (first.challengeIndex !== 0 || first.challenge !== challenges[0]) failures.push('epoch must select the first challenge');
  if (second.challengeIndex !== 1 || second.challenge !== challenges[1]) failures.push('consecutive dates must advance one challenge');
  if (challenges.length <= 30 && (wrapped.challengeIndex !== 0 || wrapped.challenge !== challenges[0])) {
    failures.push('daily challenge rotation must wrap deterministically');
  }
  const beforeShanghaiMidnight = daily.dailyChallengeDateKey(new Date('2026-09-18T15:59:59.000Z'));
  const afterShanghaiMidnight = daily.dailyChallengeDateKey(new Date('2026-09-18T16:00:00.000Z'));
  if (beforeShanghaiMidnight !== '2026-09-18' || afterShanghaiMidnight !== '2026-09-19') {
    failures.push('date keys must change at midnight in Asia/Shanghai');
  }
} catch (error) {
  failures.push(`date rotation failed: ${error.message}`);
}

const summary = {
  valid: failures.length === 0,
  challengeCount: Array.isArray(challenges) ? challenges.length : 0,
  difficultyCounts: counts,
  timezone: daily.DAILY_CHALLENGE_TIME_ZONE,
  campaignBacked: Array.isArray(challenges) ? challenges.length - failures.filter((item) => item.includes('not backed')).length : 0,
  failures
};

console.log(JSON.stringify(summary, null, 2));
process.exitCode = failures.length === 0 ? 0 : 1;
