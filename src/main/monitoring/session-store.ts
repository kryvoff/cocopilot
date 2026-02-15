import { EventEmitter } from 'events'
import { statSync } from 'fs'
import { join } from 'path'
import type { ParsedEvent, SessionInfo, SchemaCompatibility } from '@shared/events'
import { schemaTracker } from './event-parser'
import type { Queries } from '../database/queries'

export interface SessionStoreEvents {
  'session-updated': [session: SessionInfo]
  'event-added': [sessionId: string, event: ParsedEvent]
  'processes-updated': [processes: import('@shared/events').ProcessInfo[]]
}

export class SessionStore extends EventEmitter<SessionStoreEvents> {
  private sessions = new Map<string, SessionInfo>()
  private events = new Map<string, ParsedEvent[]>()
  private copilotVersion: string | null = null
  private queries: Queries | null

  constructor(queries?: Queries) {
    super()
    this.queries = queries ?? null
  }

  /** Load persisted sessions and events from the database into memory. */
  loadFromDatabase(): void {
    if (!this.queries) return

    const rows = this.queries.listSessions(10000) as Array<Record<string, unknown>>
    for (const row of rows) {
      const session: SessionInfo = {
        id: row.id as string,
        cwd: (row.cwd as string) ?? '',
        gitRoot: (row.git_root as string) ?? undefined,
        repository: (row.repository as string) ?? undefined,
        branch: (row.branch as string) ?? undefined,
        copilotVersion: (row.copilot_version as string) ?? undefined,
        status: (row.status as SessionInfo['status']) ?? 'active',
        startTime: (row.start_time as string) ?? new Date().toISOString(),
        endTime: (row.end_time as string) ?? undefined,
        summary: (row.summary as string) ?? undefined,
        eventCount: 0
      }
      this.sessions.set(session.id, session)

      const eventRows = this.queries.getEventsBySession(session.id, 100000) as Array<
        Record<string, unknown>
      >
      const events: ParsedEvent[] = eventRows.map((e) => ({
        type: e.type as string,
        id: e.id as string,
        timestamp: e.timestamp as string,
        parentId: (e.parent_id as string) ?? null,
        ephemeral: e.ephemeral === 1,
        data: JSON.parse((e.data_json as string) ?? '{}'),
        knownType: true
      }))
      this.events.set(session.id, events)
      session.eventCount = events.length

      if (session.copilotVersion) {
        this.copilotVersion = session.copilotVersion
      }
    }

    // Mark stale sessions as completed
    this.markStaleSessions()
  }

  /**
   * Mark sessions as "completed" if they appear active/idle but have no recent
   * events and no running copilot process. Called on startup and periodically.
   */
  markStaleSessions(): void {
    const staleThresholdMs = 60 * 60 * 1000 // 1 hour
    const now = Date.now()

    for (const session of this.sessions.values()) {
      if (session.status !== 'active' && session.status !== 'idle') continue

      // Check events in memory
      const events = this.events.get(session.id) ?? []
      const lastEvent = events.length > 0 ? events[events.length - 1] : null
      const lastEventTime = lastEvent ? new Date(lastEvent.timestamp).getTime() : 0

      // Check filesystem for events.jsonl mtime (more reliable than in-memory)
      let fsMtime = 0
      if (session.cwd) {
        try {
          const eventsFile = join(session.cwd, 'events.jsonl')
          const s = statSync(eventsFile)
          fsMtime = s.mtimeMs
        } catch {
          // No events file — check directory mtime
          try {
            const s = statSync(session.cwd)
            fsMtime = s.mtimeMs
          } catch {
            // Directory gone
          }
        }
      }

      const latestTime = Math.max(lastEventTime, fsMtime)

      // If no evidence of recent activity, mark as completed
      if (latestTime === 0 || now - latestTime > staleThresholdMs) {
        session.status = 'completed'
        this.queries?.upsertSession(session)
        this.emit('session-updated', session)
      }
    }
  }

  addSession(sessionId: string, dir: string): void {
    if (this.sessions.has(sessionId)) {
      // Update cwd if it was empty (loaded from DB without dir info)
      const existing = this.sessions.get(sessionId)!
      if (!existing.cwd && dir) {
        existing.cwd = dir
      }
      return
    }

    // Use events.jsonl mtime to determine if session is fresh or stale
    let startTime = new Date().toISOString()
    let status: SessionInfo['status'] = 'active'
    const staleThresholdMs = 60 * 60 * 1000 // 1 hour
    try {
      const eventsFile = join(dir, 'events.jsonl')
      const stat = statSync(eventsFile)
      startTime = stat.birthtime.toISOString()
      if (Date.now() - stat.mtimeMs > staleThresholdMs) {
        status = 'completed'
      }
    } catch {
      // No events file — check directory mtime to determine if fresh
      try {
        const dirStat = statSync(dir)
        startTime = dirStat.birthtime.toISOString()
        if (Date.now() - dirStat.mtimeMs > staleThresholdMs) {
          status = 'completed'
        }
      } catch {
        // Directory doesn't exist — just mark as active (brand new session)
      }
    }

    const session: SessionInfo = {
      id: sessionId,
      cwd: dir,
      status,
      startTime,
      eventCount: 0
    }
    this.sessions.set(sessionId, session)
    this.events.set(sessionId, [])
    this.queries?.upsertSession(session)
    this.emit('session-updated', session)
  }

  addEvent(sessionId: string, event: ParsedEvent): void {
    let session = this.sessions.get(sessionId)
    if (!session) {
      this.addSession(sessionId, '')
      session = this.sessions.get(sessionId)!
    }

    const sessionEvents = this.events.get(sessionId) ?? []
    sessionEvents.push(event)
    this.events.set(sessionId, sessionEvents)
    session.eventCount = sessionEvents.length

    this.queries?.insertEvent(sessionId, event)

    // Extract metadata from specific events
    this.updateSessionFromEvent(session, event, sessionId)

    this.emit('session-updated', session)
    this.emit('event-added', sessionId, event)
  }

  private updateSessionFromEvent(
    session: SessionInfo,
    event: ParsedEvent,
    sessionId: string
  ): void {
    switch (event.type) {
      case 'session.start': {
        const data = event.data
        session.startTime = event.timestamp
        if (data.copilotVersion) {
          session.copilotVersion = data.copilotVersion as string
          this.copilotVersion = data.copilotVersion as string
        }
        const ctx = data.context as Record<string, unknown> | undefined
        if (ctx) {
          if (ctx.cwd) session.cwd = ctx.cwd as string
          if (ctx.gitRoot) session.gitRoot = ctx.gitRoot as string
          if (ctx.repository) session.repository = ctx.repository as string
          if (ctx.branch) session.branch = ctx.branch as string
        }
        this.queries?.upsertSession(session)
        break
      }
      case 'session.shutdown':
        session.status = 'completed'
        session.endTime = event.timestamp
        this.queries?.upsertSession(session)
        break
      case 'session.error':
        session.status = 'error'
        this.queries?.upsertSession(session)
        break
      case 'session.idle':
        if (session.status === 'active') session.status = 'idle'
        this.queries?.upsertSession(session)
        break
      case 'session.title_changed':
        if (event.data.title) session.summary = event.data.title as string
        this.queries?.upsertSession(session)
        break
      case 'user.message':
      case 'assistant.turn_start': {
        // Only mark active for recent events (not when replaying old events from disk)
        const eventAge = Date.now() - new Date(event.timestamp).getTime()
        if (eventAge < 60 * 60 * 1000) {
          session.status = 'active'
          this.queries?.upsertSession(session)
        }
        break
      }
      case 'assistant.usage': {
        const usage = event.data
        this.queries?.insertUsageRecord(sessionId, {
          model: usage.model as string | undefined,
          inputTokens: usage.inputTokens as number | undefined,
          outputTokens: usage.outputTokens as number | undefined,
          cacheReadTokens: usage.cacheReadTokens as number | undefined,
          cacheWriteTokens: usage.cacheWriteTokens as number | undefined,
          cost: usage.cost as number | undefined,
          durationMs: usage.duration as number | undefined,
          timestamp: event.timestamp
        })
        break
      }
    }
  }

  getSession(sessionId: string): SessionInfo | undefined {
    return this.sessions.get(sessionId)
  }

  getAllSessions(): SessionInfo[] {
    return [...this.sessions.values()]
  }

  getActiveSessions(): SessionInfo[] {
    return this.getAllSessions().filter((s) => s.status === 'active' || s.status === 'idle')
  }

  getEvents(sessionId: string, limit?: number): ParsedEvent[] {
    const events = this.events.get(sessionId) ?? []
    if (limit) return events.slice(-limit)
    return events
  }

  getSchemaCompatibility(): SchemaCompatibility {
    const compat = schemaTracker.getCompatibility()
    return {
      copilotVersion: this.copilotVersion,
      knownEventTypes: compat.knownTypes,
      unknownEventTypes: compat.unknownTypes,
      lastChecked: new Date().toISOString()
    }
  }

  clear(): void {
    this.sessions.clear()
    this.events.clear()
  }

  /** Update sessions with process info and mark sessions active/completed based on running processes */
  updateProcesses(processes: import('@shared/events').ProcessInfo[]): void {
    const pidBySession = new Map<string, number>()
    for (const proc of processes) {
      if (proc.sessionId) {
        pidBySession.set(proc.sessionId, proc.pid)
      }
    }

    for (const session of this.sessions.values()) {
      const pid = pidBySession.get(session.id)
      const hadPid = session.pid
      session.pid = pid

      if (pid && (session.status === 'completed' || session.status === 'idle')) {
        // Process is running but session was marked completed/idle — reactivate
        session.status = 'active'
        this.queries?.upsertSession(session)
        this.emit('session-updated', session)
      } else if (!pid && hadPid && session.status === 'active') {
        // Process stopped — mark completed
        session.status = 'completed'
        session.endTime = new Date().toISOString()
        this.queries?.upsertSession(session)
        this.emit('session-updated', session)
      }
    }

    this.emit('processes-updated', processes)
  }
}
