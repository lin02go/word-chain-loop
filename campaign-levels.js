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
];
