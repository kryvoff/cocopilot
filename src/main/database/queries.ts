import type Database from 'better-sqlite3'
import type { ParsedEvent, SessionInfo } from '@shared/events'

export class Queries {
  private stmts: Record<string, Database.Statement> | null = null

  constructor(private db: Database.Database) {}

  private prepare(): Record<string, Database.Statement> {
    if (!this.stmts) {
      this.stmts = {
        upsertSession: this.db.prepare(`
          INSERT INTO sessions (id, cwd, git_root, repository, branch, copilot_version, status, start_time, summary)
          VALUES (@id, @cwd, @gitRoot, @repository, @branch, @copilotVersion, @status, @startTime, @summary)
          ON CONFLICT(id) DO UPDATE SET
            status = @status,
            end_time = @endTime,
            summary = @summary,
            copilot_version = COALESCE(@copilotVersion, copilot_version)
        `),
        insertEvent: this.db.prepare(`
          INSERT OR IGNORE INTO events (id, session_id, type, timestamp, parent_id, data_json, ephemeral)
          VALUES (@id, @sessionId, @type, @timestamp, @parentId, @dataJson, @ephemeral)
        `),
        insertUsage: this.db.prepare(`
          INSERT INTO usage_records (session_id, model, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, cost, duration_ms, timestamp)
          VALUES (@sessionId, @model, @inputTokens, @outputTokens, @cacheReadTokens, @cacheWriteTokens, @cost, @durationMs, @timestamp)
        `),
        getSession: this.db.prepare('SELECT * FROM sessions WHERE id = ?'),
        listSessions: this.db.prepare('SELECT * FROM sessions ORDER BY start_time DESC LIMIT ?'),
        getEventsBySession: this.db.prepare(
          'SELECT * FROM events WHERE session_id = ? ORDER BY timestamp ASC LIMIT ?'
        )
      }
    }
    return this.stmts
  }

  upsertSession(session: SessionInfo): void {
    this.prepare().upsertSession.run({
      id: session.id,
      cwd: session.cwd,
      gitRoot: session.gitRoot ?? null,
      repository: session.repository ?? null,
      branch: session.branch ?? null,
      copilotVersion: session.copilotVersion ?? null,
      status: session.status,
      startTime: session.startTime,
      endTime: session.endTime ?? null,
      summary: session.summary ?? null
    })
  }

  insertEvent(sessionId: string, event: ParsedEvent): void {
    this.prepare().insertEvent.run({
      id: event.id,
      sessionId,
      type: event.type,
      timestamp: event.timestamp,
      parentId: event.parentId,
      dataJson: JSON.stringify(event.data),
      ephemeral: event.ephemeral ? 1 : 0
    })
  }

  insertUsageRecord(
    sessionId: string,
    data: {
      model?: string
      inputTokens?: number
      outputTokens?: number
      cacheReadTokens?: number
      cacheWriteTokens?: number
      cost?: number
      durationMs?: number
      timestamp: string
    }
  ): void {
    this.prepare().insertUsage.run({
      sessionId,
      model: data.model ?? null,
      inputTokens: data.inputTokens ?? 0,
      outputTokens: data.outputTokens ?? 0,
      cacheReadTokens: data.cacheReadTokens ?? 0,
      cacheWriteTokens: data.cacheWriteTokens ?? 0,
      cost: data.cost ?? 0,
      durationMs: data.durationMs ?? 0,
      timestamp: data.timestamp
    })
  }

  listSessions(limit = 50): unknown[] {
    return this.prepare().listSessions.all(limit)
  }

  getSession(id: string): unknown {
    return this.prepare().getSession.get(id)
  }

  getEventsBySession(sessionId: string, limit = 1000): unknown[] {
    return this.prepare().getEventsBySession.all(sessionId, limit)
  }
}
