PRAGMA foreign_keys = ON;

ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'player'
  CHECK (role IN ('player', 'admin'));

CREATE TABLE IF NOT EXISTS custom_level_submissions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  start_word TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  submitted_route_json TEXT NOT NULL,
  computed_route_json TEXT NOT NULL,
  shortest_moves INTEGER NOT NULL CHECK (shortest_moves > 0),
  challenge_moves INTEGER NOT NULL CHECK (challenge_moves > 0),
  route_count INTEGER NOT NULL CHECK (route_count >= 0),
  branch_word_count INTEGER NOT NULL CHECK (branch_word_count >= 0),
  quality_closer_count INTEGER NOT NULL CHECK (quality_closer_count >= 0),
  max_moves INTEGER NOT NULL CHECK (max_moves >= shortest_moves),
  hint_limit INTEGER NOT NULL CHECK (hint_limit >= 0),
  description TEXT NOT NULL DEFAULT '',
  show_creator INTEGER NOT NULL DEFAULT 1 CHECK (show_creator IN (0, 1)),
  dictionary_version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'published', 'rejected', 'withdrawn')),
  review_note TEXT NOT NULL DEFAULT '',
  reviewed_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  published_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_custom_levels_status_created
  ON custom_level_submissions(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_custom_levels_user_created
  ON custom_level_submissions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_custom_levels_published
  ON custom_level_submissions(status, published_at DESC);

PRAGMA optimize;
