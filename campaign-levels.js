// Fixed campaign content. The route length, target and maximum moves are
// derived from the active dictionary so dictionary updates cannot silently
// leave stale hand-written answers behind.
var CAMPAIGN_LEVELS = [
  { id: 1,  startWord: 'remarkable', difficulty: 'easy',   parSlack: 0, maxSlack: 2, hintLimit: 3 },
  { id: 2,  startWord: 'life',       difficulty: 'easy',   parSlack: 1, maxSlack: 3, hintLimit: 3 },
  { id: 3,  startWord: 'email',      difficulty: 'easy',   parSlack: 1, maxSlack: 3, hintLimit: 2 },
  { id: 4,  startWord: 'beaker',     difficulty: 'easy',   parSlack: 1, maxSlack: 3, hintLimit: 2 },
  { id: 5,  startWord: 'abate',      difficulty: 'medium', parSlack: 1, maxSlack: 3, hintLimit: 2 },
  { id: 6,  startWord: 'active',     difficulty: 'medium', parSlack: 1, maxSlack: 3, hintLimit: 2 },
  { id: 7,  startWord: 'take',       difficulty: 'medium', parSlack: 1, maxSlack: 3, hintLimit: 1 },
  { id: 8,  startWord: 'hermit',     difficulty: 'medium', parSlack: 1, maxSlack: 3, hintLimit: 1 },
  { id: 9,  startWord: 'forensic',   difficulty: 'medium', parSlack: 1, maxSlack: 3, hintLimit: 1 },
  { id: 10, startWord: 'about',      difficulty: 'hard',   parSlack: 1, maxSlack: 4, hintLimit: 1 },
  { id: 11, startWord: 'abridge',    difficulty: 'hard',   parSlack: 1, maxSlack: 4, hintLimit: 1 },
  { id: 12, startWord: 'adversity',  difficulty: 'hard',   parSlack: 0, maxSlack: 3, hintLimit: 0 }
].concat([
  // Expansion: 26 approachable, 30 standard and 32 advanced levels.
  ['beacon', 'easy'], ['champion', 'easy'], ['chopper', 'easy'], ['commute', 'easy'],
  ['design', 'easy'], ['easy', 'easy'], ['electronic', 'easy'], ['emphasize', 'easy'],
  ['gesture', 'easy'], ['hearten', 'easy'], ['hydrogen', 'easy'], ['idle', 'easy'],
  ['ladder', 'easy'], ['little', 'easy'], ['macintosh', 'easy'], ['marina', 'easy'],
  ['medical', 'easy'], ['mental', 'easy'], ['noise', 'easy'], ['orchid', 'easy'],
  ['peaceful', 'easy'], ['pencil', 'easy'], ['performer', 'easy'], ['reflex', 'easy'],
  ['stellar', 'easy'], ['texture', 'easy'],

  ['abolish', 'medium'], ['accost', 'medium'], ['adventurer', 'medium'], ['amazingly', 'medium'],
  ['amphibious', 'medium'], ['anonymous', 'medium'], ['approval', 'medium'], ['arsenic', 'medium'],
  ['awesome', 'medium'], ['banana', 'medium'], ['bathe', 'medium'], ['belief', 'medium'],
  ['bystander', 'medium'], ['capable', 'medium'], ['chameleon', 'medium'], ['chef', 'medium'],
  ['coin', 'medium'], ['complicate', 'medium'], ['conference', 'medium'], ['conserve', 'medium'],
  ['copier', 'medium'], ['cougar', 'medium'], ['deposit', 'medium'], ['dominion', 'medium'],
  ['elevation', 'medium'], ['emergency', 'medium'], ['excavation', 'medium'], ['explicitly', 'medium'],
  ['feat', 'medium'], ['fence', 'medium'],

  ['abhor', 'hard'], ['absolute', 'hard'], ['accustom', 'hard'], ['affliction', 'hard'],
  ['aftermath', 'hard'], ['agonize', 'hard'], ['amorphous', 'hard'], ['apparatus', 'hard'],
  ['apron', 'hard'], ['axis', 'hard'], ['beckon', 'hard'], ['bible', 'hard'],
  ['birdcage', 'hard'], ['bologna', 'hard'], ['carbon', 'hard'], ['chimpanzee', 'hard'],
  ['cobbler', 'hard'], ['commodity', 'hard'], ['confer', 'hard'], ['container', 'hard'],
  ['cooper', 'hard'], ['county', 'hard'], ['dapper', 'hard'], ['dynasty', 'hard'],
  ['embryo', 'hard'], ['emphatic', 'hard'], ['epic', 'hard'], ['excerpt', 'hard'],
  ['explorer', 'hard'], ['federation', 'hard'], ['fertile', 'hard'], ['helium', 'hard']
].map(function(row, index) {
  var difficulty = row[1];
  return {
    id: index + 13,
    startWord: row[0],
    difficulty: difficulty,
    parSlack: 1,
    maxSlack: difficulty === 'hard' ? 4 : 3,
    hintLimit: difficulty === 'easy' ? 2 : (difficulty === 'medium' ? 1 : 0)
  };
}));

// Derived from the validated shortest route for each fixed level. Most levels
// need two intermediate words; exceptions stay explicit so validation can flag
// stale values after a dictionary update.
var CAMPAIGN_MINIMUM_INTERMEDIATE_EXCEPTIONS = { 1: 1, 9: 3, 21: 1, 36: 1, 37: 1, 38: 1 };
for (var campaignIndex = 0; campaignIndex < CAMPAIGN_LEVELS.length; campaignIndex++) {
  var campaignLevel = CAMPAIGN_LEVELS[campaignIndex];
  campaignLevel.minimumIntermediateWords = CAMPAIGN_MINIMUM_INTERMEDIATE_EXCEPTIONS[campaignLevel.id] || 2;
}
