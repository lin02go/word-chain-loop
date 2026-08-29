export const userProfilesSchema = `CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  platform_name TEXT,
  nickname TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)`;

export const playerProgressSchema = `CREATE TABLE IF NOT EXISTS player_progress (
  user_id TEXT PRIMARY KEY,
  snapshot_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
)`;
