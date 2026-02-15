import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { SessionPlayback } from '../../../src/renderer/debug/session-playback'

// Mock zustand store
const mockState = {
  events: [] as Array<{ type: string; id: string }>,
  sessions: [] as Array<{ id: string }>,
  selectedSessionId: null as string | null,
  playbackAddEvent: vi.fn((event: { type: string; id: string }) => {
    mockState.events.push(event)
  }),
  playbackSetSession: vi.fn((session: { id: string }) => {
    mockState.sessions = [session]
    mockState.selectedSessionId = session.id
  }),
  playbackReset: vi.fn(() => {
    mockState.events = []
    mockState.sessions = []
    mockState.selectedSessionId = null
  })
}

vi.mock('../../../src/renderer/store/monitoring-store', () => ({
  useMonitoringStore: {
    getState: () => mockState
  }
}))

const fixturesDir = resolve(__dirname, '../../fixtures/events')

function loadFixture(name: string): string {
  return readFileSync(resolve(fixturesDir, name), 'utf-8')
}

describe('SessionPlayback', () => {
  beforeEach(() => {
    mockState.events = []
    mockState.sessions = []
    mockState.selectedSessionId = null
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('loads events from JSONL content', () => {
    const playback = new SessionPlayback()
    const content = loadFixture('synthetic-session.jsonl')
    playback.load(content)

    const progress = playback.getProgress()
    expect(progress.total).toBe(27)
    expect(progress.current).toBe(0)
  })

  it('is not running after construction', () => {
    const playback = new SessionPlayback()
    expect(playback.isRunning()).toBe(false)
  })

  it('does not start without events loaded', () => {
    const playback = new SessionPlayback()
    playback.start()
    expect(playback.isRunning()).toBe(false)
  })

  it('creates a session and injects the first event on start', () => {
    const playback = new SessionPlayback({ speedMultiplier: 100 })
    playback.load(loadFixture('synthetic-session.jsonl'))
    playback.start()

    expect(mockState.playbackSetSession).toHaveBeenCalledOnce()
    const sessionArg = mockState.playbackSetSession.mock.calls[0][0]
    expect(sessionArg.id).toBe('syn-test-001')
    expect(sessionArg.status).toBe('active')
    expect(sessionArg.repository).toBe('acme/widget-api')

    // First event should have been injected
    expect(mockState.playbackAddEvent).toHaveBeenCalledOnce()
    expect(mockState.events[0].type).toBe('session.start')
    expect(playback.isRunning()).toBe(true)

    playback.stop()
  })

  it('plays events with timing', () => {
    const onEvent = vi.fn()
    const playback = new SessionPlayback({ speedMultiplier: 100, onEvent })
    playback.load(loadFixture('synthetic-session.jsonl'))
    playback.start()

    // First event fires immediately
    expect(onEvent).toHaveBeenCalledTimes(1)
    expect(mockState.events).toHaveLength(1)

    // Advance timers to play second event (2 seconds / 100 speed = 20ms, min 50ms)
    vi.advanceTimersByTime(60)
    expect(mockState.events).toHaveLength(2)
    expect(mockState.events[1].type).toBe('user.message')

    playback.stop()
  })

  it('fires onComplete when all events are played', () => {
    const onComplete = vi.fn()
    const playback = new SessionPlayback({ speedMultiplier: 1000, onComplete })
    playback.load(loadFixture('synthetic-session.jsonl'))
    playback.start()

    // Advance enough time for all events to play
    vi.advanceTimersByTime(60 * 1000)

    expect(onComplete).toHaveBeenCalledOnce()
    expect(playback.isRunning()).toBe(false)
    expect(playback.getProgress().current).toBe(27)
  })

  it('stops playback when stop() is called', () => {
    const playback = new SessionPlayback({ speedMultiplier: 100 })
    playback.load(loadFixture('synthetic-session.jsonl'))
    playback.start()

    expect(playback.isRunning()).toBe(true)
    playback.stop()
    expect(playback.isRunning()).toBe(false)

    const countAtStop = mockState.events.length
    vi.advanceTimersByTime(10_000)
    // No more events after stop
    expect(mockState.events.length).toBe(countAtStop)
  })

  it('reports progress correctly', () => {
    const playback = new SessionPlayback({ speedMultiplier: 1000 })
    playback.load(loadFixture('synthetic-session.jsonl'))

    expect(playback.getProgress()).toEqual({ current: 0, total: 27 })

    playback.start()
    expect(playback.getProgress().current).toBe(1)

    vi.advanceTimersByTime(1000)
    expect(playback.getProgress().current).toBeGreaterThan(1)

    playback.stop()
  })

  it('handles empty JSONL content', () => {
    const playback = new SessionPlayback()
    playback.load('')

    expect(playback.getProgress().total).toBe(0)
    playback.start()
    expect(playback.isRunning()).toBe(false)
  })

  it('uses custom speed multiplier', () => {
    const onEvent = vi.fn()
    const slowPlayback = new SessionPlayback({ speedMultiplier: 1, onEvent })
    slowPlayback.load(loadFixture('synthetic-session.jsonl'))
    slowPlayback.start()

    // At 1x speed, 2-second gap stays 2 seconds
    vi.advanceTimersByTime(100)
    // Only the first event should have fired at 1x speed after 100ms
    expect(onEvent).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(2000)
    expect(onEvent).toHaveBeenCalledTimes(2)

    slowPlayback.stop()
  })
})
