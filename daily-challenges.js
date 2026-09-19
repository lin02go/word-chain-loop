// Curated daily challenge content. Every entry is derived from a campaign
// level that is validated against the active dictionary by the campaign
// validator. Keep this file as a traditional script so it can be loaded by a
// browser <script> tag and by Node's validation tools.
var DAILY_CHALLENGE_TIME_ZONE = 'Asia/Shanghai';
var DAILY_CHALLENGE_EPOCH = '2026-01-01';

var DAILY_CHALLENGES = [
  { id: 'daily-001', title: '非凡开场', startWord: 'remarkable', difficulty: 'easy', parMoves: 1, maxMoves: 3, hintLimit: 3 },
  { id: 'daily-002', title: '生命回响', startWord: 'life', difficulty: 'easy', parMoves: 3, maxMoves: 5, hintLimit: 3 },
  { id: 'daily-003', title: '信箱折返', startWord: 'email', difficulty: 'easy', parMoves: 3, maxMoves: 5, hintLimit: 2 },
  { id: 'daily-004', title: '烧杯实验', startWord: 'beaker', difficulty: 'easy', parMoves: 3, maxMoves: 5, hintLimit: 2 },
  { id: 'daily-005', title: '灯塔来信', startWord: 'beacon', difficulty: 'easy', parMoves: 3, maxMoves: 5, hintLimit: 2 },
  { id: 'daily-006', title: '冠军巡游', startWord: 'champion', difficulty: 'easy', parMoves: 3, maxMoves: 5, hintLimit: 2 },
  { id: 'daily-007', title: '旋翼归航', startWord: 'chopper', difficulty: 'easy', parMoves: 3, maxMoves: 5, hintLimit: 2 },
  { id: 'daily-008', title: '通勤环线', startWord: 'commute', difficulty: 'easy', parMoves: 3, maxMoves: 5, hintLimit: 2 },
  { id: 'daily-009', title: '设计闭环', startWord: 'design', difficulty: 'easy', parMoves: 3, maxMoves: 5, hintLimit: 2 },
  { id: 'daily-010', title: '轻松一圈', startWord: 'easy', difficulty: 'easy', parMoves: 3, maxMoves: 5, hintLimit: 2 },

  { id: 'daily-011', title: '渐弱回声', startWord: 'abate', difficulty: 'medium', parMoves: 3, maxMoves: 5, hintLimit: 2 },
  { id: 'daily-012', title: '活力轨迹', startWord: 'active', difficulty: 'medium', parMoves: 3, maxMoves: 5, hintLimit: 2 },
  { id: 'daily-013', title: '拿下这一环', startWord: 'take', difficulty: 'medium', parMoves: 3, maxMoves: 5, hintLimit: 1 },
  { id: 'daily-014', title: '隐士之路', startWord: 'hermit', difficulty: 'medium', parMoves: 3, maxMoves: 5, hintLimit: 1 },
  { id: 'daily-015', title: '鉴证迷踪', startWord: 'forensic', difficulty: 'medium', parMoves: 4, maxMoves: 6, hintLimit: 1 },
  { id: 'daily-016', title: '破除迷局', startWord: 'abolish', difficulty: 'medium', parMoves: 3, maxMoves: 5, hintLimit: 1 },
  { id: 'daily-017', title: '狭路相逢', startWord: 'accost', difficulty: 'medium', parMoves: 3, maxMoves: 5, hintLimit: 1 },
  { id: 'daily-018', title: '冒险归途', startWord: 'adventurer', difficulty: 'medium', parMoves: 3, maxMoves: 5, hintLimit: 1 },
  { id: 'daily-019', title: '惊奇转身', startWord: 'amazingly', difficulty: 'medium', parMoves: 3, maxMoves: 5, hintLimit: 1 },
  { id: 'daily-020', title: '两栖漫游', startWord: 'amphibious', difficulty: 'medium', parMoves: 3, maxMoves: 5, hintLimit: 1 },

  { id: 'daily-021', title: '言外之环', startWord: 'about', difficulty: 'hard', parMoves: 3, maxMoves: 6, hintLimit: 1 },
  { id: 'daily-022', title: '桥接难题', startWord: 'abridge', difficulty: 'hard', parMoves: 3, maxMoves: 6, hintLimit: 1 },
  { id: 'daily-023', title: '逆境归来', startWord: 'adversity', difficulty: 'hard', parMoves: 2, maxMoves: 5, hintLimit: 0 },
  { id: 'daily-024', title: '厌恶迷宫', startWord: 'abhor', difficulty: 'hard', parMoves: 3, maxMoves: 6, hintLimit: 0 },
  { id: 'daily-025', title: '绝对回环', startWord: 'absolute', difficulty: 'hard', parMoves: 3, maxMoves: 6, hintLimit: 0 },
  { id: 'daily-026', title: '习惯拐点', startWord: 'accustom', difficulty: 'hard', parMoves: 3, maxMoves: 6, hintLimit: 0 },
  { id: 'daily-027', title: '困境突围', startWord: 'affliction', difficulty: 'hard', parMoves: 3, maxMoves: 6, hintLimit: 0 },
  { id: 'daily-028', title: '余波未平', startWord: 'aftermath', difficulty: 'hard', parMoves: 3, maxMoves: 6, hintLimit: 0 },
  { id: 'daily-029', title: '曲折归途', startWord: 'agonize', difficulty: 'hard', parMoves: 3, maxMoves: 6, hintLimit: 0 },
  { id: 'daily-030', title: '无形之环', startWord: 'amorphous', difficulty: 'hard', parMoves: 3, maxMoves: 6, hintLimit: 0 }
];

function dailyChallengeDateKey(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  var date = value instanceof Date ? value : new Date(value === undefined ? Date.now() : value);
  if (Number.isNaN(date.getTime())) throw new TypeError('Invalid daily challenge date');
  var parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: DAILY_CHALLENGE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  var values = {};
  for (var index = 0; index < parts.length; index++) {
    if (parts[index].type !== 'literal') values[parts[index].type] = parts[index].value;
  }
  return values.year + '-' + values.month + '-' + values.day;
}

function dailyChallengeDayNumber(dateKey) {
  var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) throw new TypeError('Invalid daily challenge date key');
  var epoch = DAILY_CHALLENGE_EPOCH.split('-').map(Number);
  var current = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  var origin = Date.UTC(epoch[0], epoch[1] - 1, epoch[2]);
  return Math.floor((current - origin) / 86400000);
}

function getDailyChallenge(value) {
  var dateKey = dailyChallengeDateKey(value);
  var dayNumber = dailyChallengeDayNumber(dateKey);
  var challengeIndex = ((dayNumber % DAILY_CHALLENGES.length) + DAILY_CHALLENGES.length) % DAILY_CHALLENGES.length;
  return {
    dateKey: dateKey,
    dayNumber: dayNumber,
    challengeIndex: challengeIndex,
    challenge: DAILY_CHALLENGES[challengeIndex]
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DAILY_CHALLENGE_TIME_ZONE: DAILY_CHALLENGE_TIME_ZONE,
    DAILY_CHALLENGE_EPOCH: DAILY_CHALLENGE_EPOCH,
    DAILY_CHALLENGES: DAILY_CHALLENGES,
    dailyChallengeDateKey: dailyChallengeDateKey,
    dailyChallengeDayNumber: dailyChallengeDayNumber,
    getDailyChallenge: getDailyChallenge
  };
}
