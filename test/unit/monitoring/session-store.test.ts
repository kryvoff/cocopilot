import { describe, it, expect, beforeEach } from 'vitest'
import { SessionStore } from '../../../src/main/monitoring/session-store'
import { parseEventsContent } from '../../../src/main/monitoring/event-parser'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const fixturesDir = resolve(__dirname, '../../fixtures/events')

describe('SessionStore', () => {
  let store: SessionStore

  beforeEach(() => {
    store = new SessionStore()
  })

  it('starts with no sessions', () => {
    expect(store.getAllSessions()).toHaveLength(0)
    expect(store.getActiveSessions()).toHaveLength(0)
  })

  it('adds a session', () => {
    store.addSession('test-1', '/test/dir')
    expect(store.getAllSessions()).toHaveLength(1)
    expect(store.getSession('test-1')?.status).toBe('active')
  })

  it('does not duplicate sessions', () => {
    store.addSession('test-1', '/test/dir')
    store.addSession('test-1', '/test/dir')
    expect(store.getAllSessions()).toHaveLength(1)
  })

  it('processes events from simple-session fixture', () => {
    const content = readFileSync(resolve(fixturesDir, 'simple-session.jsonl'), 'utf-8')
    const events = parseEventsContent(content)

    store.addSession('test-session-1', '/test')

    for (const event of events) {
      store.addEvent('test-session-1', event)
    }

    const session = store.getSession('test-session-1')!
    expect(session.copilotVersion).toBe('0.0.410')
    expect(session.repository).toBe('test/project')
    expect(session.branch).toBe('main')
    expect(session.status).toBe('completed') // after shutdown
    expect(session.eventCount).toBe(8)
  })

  it('tracks session status transitions', () => {
    store.addSession('s1', '/test')
    expect(store.getSession('s1')?.status).toBe('active')

    store.addEvent('s1', {
      type: 'session.idle',
      id: 'e1',
      timestamp: '2026-01-01T00:00:00Z',
      parentId: null,
      ephemeral: true,
      data: {},
      knownType: true
    })
    expect(store.getSession('s1')?.status).toBe('idle')

    store.addEvent('s1', {
      type: 'user.message',
      id: 'e2',
      timestamp: '2026-01-01T00:01:00Z',
      parentId: null,
      ephemeral: false,
      data: { content: 'hello' },
      knownType: true
    })
    expect(store.getSession('s1')?.status).toBe('active')

    store.addEvent('s1', {
      type: 'session.shutdown',
      id: 'e3',
      timestamp: '2026-01-01T00:02:00Z',
      parentId: null,
      ephemeral: true,
      data: {},
      knownType: true
    })
    expect(store.getSession('s1')?.status).toBe('completed')
  })

  it('auto-creates session on event if not existing', () => {
    store.addEvent('auto-session', {
      type: 'session.start',
      id: 'e1',
      timestamp: '2026-01-01T00:00:00Z',
      parentId: null,
      ephemeral: false,
      data: { copilotVersion: '0.0.420' },
      knownType: true
    })

    expect(store.getSession('auto-session')).toBeDefined()
    expect(store.getSession('auto-session')?.copilotVersion).toBe('0.0.420')
  })

  it('returns events with limit', () => {
    store.addSession('s1', '/test')
    for (let i = 0; i < 50; i++) {
      store.addEvent('s1', {
        type: 'session.info',
        id: `e-${i}`,
        timestamp: `2026-01-01T00:${String(i).padStart(2, '0')}:00Z`,
        parentId: null,
        ephemeral: false,
        data: {},
        knownType: true
      })
    }

    expect(store.getEvents('s1')).toHaveLength(50)
    expect(store.getEvents('s1', 10)).toHaveLength(10)
  })

  it('provides schema compatibility info', () => {
    const compat = store.getSchemaCompatibility()
    expect(compat.knownEventTypes.length).toBeGreaterThan(30)
    expect(compat.unknownEventTypes).toEqual([])
  })
})
