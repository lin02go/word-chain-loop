PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS word_feedback (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  word TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('not_word', 'too_obscure', 'wrong_definition', 'missing_word', 'other')),
  note TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL CHECK (source IN ('manual', 'definition', 'rejected_input')),
  difficulty TEXT NOT NULL DEFAULT '' CHECK (difficulty IN ('', 'easy', 'medium', 'hard')),
  game_mode TEXT NOT NULL DEFAULT '' CHECK (game_mode IN ('', 'casual', 'campaign')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'accepted', 'rejected')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_word_feedback_status_created
  ON word_feedback(status, created_at);

CREATE INDEX IF NOT EXISTS idx_word_feedback_user_created
  ON word_feedback(user_id, created_at);

PRAGMA optimize;
