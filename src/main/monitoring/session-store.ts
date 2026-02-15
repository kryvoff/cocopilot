import { EventEmitter } from 'events'
import type { ParsedEvent, SessionInfo, SchemaCompatibility } from '@shared/events'
import { schemaTracker } from './event-parser'

export interface SessionStoreEvents {
  'session-updated': [session: SessionInfo]
  'event-added': [sessionId: string, event: ParsedEvent]
}

export class SessionStore extends EventEmitter<SessionStoreEvents> {
  private sessions = new Map<string, SessionInfo>()
  private events = new Map<string, ParsedEvent[]>()
  private copilotVersion: string | null = null

  addSession(sessionId: string, dir: string): void {
    if (this.sessions.has(sessionId)) return

    const session: SessionInfo = {
      id: sessionId,
      cwd: dir,
      status: 'active',
      startTime: new Date().toISOString(),
      eventCount: 0
    }
    this.sessions.set(sessionId, session)
    this.events.set(sessionId, [])
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

    // Extract metadata from specific events
    this.updateSessionFromEvent(session, event)

    this.emit('session-updated', session)
    this.emit('event-added', sessionId, event)
  }

  private updateSessionFromEvent(session: SessionInfo, event: ParsedEvent): void {
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
        break
      }
      case 'session.shutdown':
        session.status = 'completed'
        session.endTime = event.timestamp
        break
      case 'session.error':
        session.status = 'error'
        break
      case 'session.idle':
        if (session.status === 'active') session.status = 'idle'
        break
      case 'session.title_changed':
        if (event.data.title) session.summary = event.data.title as string
        break
      case 'user.message':
      case 'assistant.turn_start':
        session.status = 'active'
        break
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
}
