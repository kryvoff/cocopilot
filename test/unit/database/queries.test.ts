import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { Queries } from '../../../src/main/database/queries'
import type { SessionInfo, ParsedEvent } from '@shared/events'

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

CREATE TABLE IF NOT EXISTS tool_calls (
  tool_call_id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id),
  tool_name TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  success INTEGER,
  duration_ms INTEGER
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
CREATE INDEX IF NOT EXISTS idx_tool_calls_session ON tool_calls(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_start ON sessions(start_time);
`

function makeSession(overrides: Partial<SessionInfo> = {}): SessionInfo {
  return {
    id: 'sess-1',
    cwd: '/home/user/project',
    status: 'active',
    startTime: '2025-01-01T00:00:00Z',
    eventCount: 0,
    ...overrides
  }
}

function makeEvent(overrides: Partial<ParsedEvent> = {}): ParsedEvent {
  return {
    type: 'user.message',
    id: 'evt-1',
    timestamp: '2025-01-01T00:01:00Z',
    parentId: null,
    ephemeral: false,
    data: { content: 'hello' },
    knownType: true,
    ...overrides
  }
}

let db: Database.Database
let queries: Queries

describe('Queries', () => {
  beforeEach(() => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    db.exec(SCHEMA_SQL)
    queries = new Queries(db)
  })

  afterEach(() => {
    db.close()
  })

  describe('schema creation', () => {
    it('creates all 4 tables', () => {
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        .all()
        .map((r: any) => r.name)
        .sort()

      expect(tables).toEqual(['events', 'sessions', 'tool_calls', 'usage_records'])
    })
  })

  describe('upsertSession', () => {
    it('inserts a new session', () => {
      const session = makeSession()
      queries.upsertSession(session)

      const row = queries.getSession('sess-1') as any
      expect(row).toBeTruthy()
      expect(row.id).toBe('sess-1')
      expect(row.cwd).toBe('/home/user/project')
      expect(row.status).toBe('active')
      expect(row.start_time).toBe('2025-01-01T00:00:00Z')
    })

    it('updates an existing session on conflict', () => {
      const session = makeSession()
      queries.upsertSession(session)

      queries.upsertSession(
        makeSession({
          status: 'completed',
          endTime: '2025-01-01T01:00:00Z',
          summary: 'Done'
        })
      )

      const row = queries.getSession('sess-1') as any
      expect(row.status).toBe('completed')
      expect(row.end_time).toBe('2025-01-01T01:00:00Z')
      expect(row.summary).toBe('Done')
    })
  })

  describe('insertEvent', () => {
    it('inserts an event and retrieves it by session', () => {
      queries.upsertSession(makeSession())
      const event = makeEvent()
      queries.insertEvent('sess-1', event)

      const events = queries.getEventsBySession('sess-1') as any[]
      expect(events).toHaveLength(1)
      expect(events[0].id).toBe('evt-1')
      expect(events[0].type).toBe('user.message')
      expect(events[0].session_id).toBe('sess-1')
      expect(JSON.parse(events[0].data_json)).toEqual({ content: 'hello' })
    })

    it('ignores duplicate event IDs without error', () => {
      queries.upsertSession(makeSession())
      const event = makeEvent()
      queries.insertEvent('sess-1', event)
      queries.insertEvent('sess-1', event) // duplicate — should not throw

      const events = queries.getEventsBySession('sess-1') as any[]
      expect(events).toHaveLength(1)
    })
  })

  describe('insertUsageRecord', () => {
    it('inserts a usage record', () => {
      queries.upsertSession(makeSession())
      queries.insertUsageRecord('sess-1', {
        model: 'gpt-4',
        inputTokens: 100,
        outputTokens: 50,
        cacheReadTokens: 10,
        cacheWriteTokens: 5,
        cost: 0.003,
        durationMs: 1200,
        timestamp: '2025-01-01T00:05:00Z'
      })

      const rows = db.prepare('SELECT * FROM usage_records WHERE session_id = ?').all('sess-1') as any[]
      expect(rows).toHaveLength(1)
      expect(rows[0].model).toBe('gpt-4')
      expect(rows[0].input_tokens).toBe(100)
      expect(rows[0].output_tokens).toBe(50)
      expect(rows[0].cost).toBeCloseTo(0.003)
      expect(rows[0].duration_ms).toBe(1200)
    })
  })

  describe('listSessions', () => {
    it('returns sessions in start_time DESC order', () => {
      queries.upsertSession(makeSession({ id: 'sess-a', startTime: '2025-01-01T00:00:00Z' }))
      queries.upsertSession(makeSession({ id: 'sess-c', startTime: '2025-01-03T00:00:00Z' }))
      queries.upsertSession(makeSession({ id: 'sess-b', startTime: '2025-01-02T00:00:00Z' }))

      const sessions = queries.listSessions() as any[]
      expect(sessions).toHaveLength(3)
      expect(sessions[0].id).toBe('sess-c')
      expect(sessions[1].id).toBe('sess-b')
      expect(sessions[2].id).toBe('sess-a')
    })
  })

  describe('getEventsBySession', () => {
    it('filters events by session ID', () => {
      queries.upsertSession(makeSession({ id: 'sess-1' }))
      queries.upsertSession(makeSession({ id: 'sess-2' }))

      queries.insertEvent('sess-1', makeEvent({ id: 'e1', timestamp: '2025-01-01T00:01:00Z' }))
      queries.insertEvent('sess-1', makeEvent({ id: 'e2', timestamp: '2025-01-01T00:02:00Z' }))
      queries.insertEvent('sess-2', makeEvent({ id: 'e3', timestamp: '2025-01-01T00:03:00Z' }))

      const s1Events = queries.getEventsBySession('sess-1') as any[]
      const s2Events = queries.getEventsBySession('sess-2') as any[]
      expect(s1Events).toHaveLength(2)
      expect(s2Events).toHaveLength(1)
      expect(s2Events[0].id).toBe('e3')
    })

    it('respects the limit parameter', () => {
      queries.upsertSession(makeSession())

      for (let i = 0; i < 10; i++) {
        queries.insertEvent(
          'sess-1',
          makeEvent({ id: `evt-${i}`, timestamp: `2025-01-01T00:${String(i).padStart(2, '0')}:00Z` })
        )
      }

      const limited = queries.getEventsBySession('sess-1', 3) as any[]
      expect(limited).toHaveLength(3)
      // Should be ordered by timestamp ASC, so first 3
      expect(limited[0].id).toBe('evt-0')
      expect(limited[2].id).toBe('evt-2')
    })
  })
})
