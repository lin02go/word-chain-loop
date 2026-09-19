PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS daily_challenge_results (
  id TEXT PRIMARY KEY,
  challenge_date TEXT NOT NULL CHECK (length(challenge_date) = 10),
  player_key_hash TEXT NOT NULL,
  user_id TEXT,
  first_steps INTEGER NOT NULL CHECK (first_steps BETWEEN 1 AND 64),
  first_duration_ms INTEGER NOT NULL CHECK (first_duration_ms BETWEEN 250 AND 86400000),
  first_assisted INTEGER NOT NULL CHECK (first_assisted IN (0, 1)),
  best_steps INTEGER NOT NULL CHECK (best_steps BETWEEN 1 AND 64),
  best_duration_ms INTEGER NOT NULL CHECK (best_duration_ms BETWEEN 250 AND 86400000),
  best_assisted INTEGER NOT NULL CHECK (best_assisted IN (0, 1)),
  best_hint_count INTEGER NOT NULL DEFAULT 0 CHECK (best_hint_count BETWEEN 0 AND 64),
  best_undo_count INTEGER NOT NULL DEFAULT 0 CHECK (best_undo_count BETWEEN 0 AND 128),
  best_route_hash TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 1 CHECK (attempt_count > 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(challenge_date, player_key_hash)
);

CREATE INDEX IF NOT EXISTS idx_daily_results_date_score
  ON daily_challenge_results(challenge_date, best_assisted, best_steps, best_duration_ms);

CREATE INDEX IF NOT EXISTS idx_daily_results_user_date
  ON daily_challenge_results(user_id, challenge_date DESC);

CREATE TABLE IF NOT EXISTS daily_challenge_shares (
  code TEXT PRIMARY KEY,
  result_id TEXT NOT NULL,
  challenge_date TEXT NOT NULL CHECK (length(challenge_date) = 10),
  creator_key_hash TEXT NOT NULL,
  creator_user_id TEXT,
  creator_name TEXT NOT NULL,
  steps INTEGER NOT NULL CHECK (steps BETWEEN 1 AND 64),
  duration_ms INTEGER NOT NULL CHECK (duration_ms BETWEEN 250 AND 86400000),
  assisted INTEGER NOT NULL CHECK (assisted IN (0, 1)),
  open_count INTEGER NOT NULL DEFAULT 0 CHECK (open_count >= 0),
  start_count INTEGER NOT NULL DEFAULT 0 CHECK (start_count >= 0),
  completion_count INTEGER NOT NULL DEFAULT 0 CHECK (completion_count >= 0),
  created_at TEXT NOT NULL,
  FOREIGN KEY (result_id) REFERENCES daily_challenge_results(id) ON DELETE CASCADE,
  FOREIGN KEY (creator_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_daily_shares_result_created
  ON daily_challenge_shares(result_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_daily_shares_date_created
  ON daily_challenge_shares(challenge_date, created_at DESC);

CREATE TABLE IF NOT EXISTS daily_challenge_referrals (
  id TEXT PRIMARY KEY,
  share_code TEXT NOT NULL,
  challenge_date TEXT NOT NULL CHECK (length(challenge_date) = 10),
  player_key_hash TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('open', 'start', 'complete')),
  created_at TEXT NOT NULL,
  FOREIGN KEY (share_code) REFERENCES daily_challenge_shares(code) ON DELETE CASCADE,
  UNIQUE(share_code, player_key_hash, event_type)
);

CREATE INDEX IF NOT EXISTS idx_daily_referrals_date_event
  ON daily_challenge_referrals(challenge_date, event_type, created_at DESC);

CREATE TABLE IF NOT EXISTS daily_challenge_rate_limits (
  bucket_key TEXT PRIMARY KEY,
  hits INTEGER NOT NULL CHECK (hits > 0),
  reset_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_daily_rate_limits_expiry
  ON daily_challenge_rate_limits(reset_at);

PRAGMA optimize;
