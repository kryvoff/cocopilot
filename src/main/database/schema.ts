import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  cwd TEXT,
  git_root TEXT,
  repository TEXT,
  branch TEXT,
  copilot_version TEXT,
  model TEXT,
  agent_mode TEXT,
  status TEXT,
  start_time TEXT,
  end_time TEXT,
  total_premium_requests INTEGER,
  total_api_duration_ms INTEGER,
  total_cost_usd REAL,
  lines_added INTEGER,
  lines_removed INTEGER,
  summary TEXT
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id),
  type TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  parent_id TEXT,
  data_json TEXT,
  ephemeral INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS usage_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT REFERENCES sessions(id),
  model TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  cache_read_tokens INTEGER,
  cache_write_tokens INTEGER,
  cost REAL,
  duration_ms INTEGER,
  timestamp TEXT
);

CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_sessions_start ON sessions(start_time);
`

let db: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = path.join(app.getPath('userData'), 'cocopilot.db')
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    db.exec(SCHEMA_SQL)
    console.log(`[Database] Opened: ${dbPath}`)
  }
  return db
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}
