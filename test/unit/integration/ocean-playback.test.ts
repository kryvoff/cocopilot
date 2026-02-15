import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { SessionPlayback } from '../../../src/renderer/debug/session-playback'
import { useFlipperStore } from '../../../src/renderer/modes/ocean/flipper-state'
import type { ParsedEvent } from '@shared/events'

// --- Mock monitoring store (same approach as playback-integration.test.ts) ---

const mockState = {
  events: [] as ParsedEvent[],
  sessions: [] as Array<{ id: string }>,
  selectedSessionId: null as string | null,
  playbackAddEvent: vi.fn((event: ParsedEvent) => {
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

// --- Helpers ---

const fixturesDir = resolve(__dirname, '../../fixtures/events')

function loadFixture(name: string): string {
  return readFileSync(resolve(fixturesDir, name), 'utf-8')
}

/** Play all events synchronously by advancing fake timers until completion. */
function playAllEvents(playback: SessionPlayback): void {
  playback.start()
  vi.advanceTimersByTime(60_000)
}

describe('Ocean Playback Integration', () => {
  beforeEach(() => {
    mockState.events = []
    mockState.sessions = []
    mockState.selectedSessionId = null
    vi.clearAllMocks()
    vi.useFakeTimers()

    useFlipperStore.setState({
      state: 'hidden',
      toolActive: null,
      subAgentCount: 0,
      activeSubAgents: [],
      activityLevel: 0,
      recentEventTimestamps: [],
      errorEvents: []
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // -------------------------------------------------------------------------
  // 1. State transitions through full session
  // -------------------------------------------------------------------------

  describe('flipper state transitions', () => {
    it('follows the expected state sequence through the full session', () => {
      const stateLog: Array<{ eventType: string; flipperState: string }> = []

      const playback = new SessionPlayback({
        speedMultiplier: 1000,
        onEvent: (event: ParsedEvent) => {
          useFlipperStore.getState().processEvent(event)
          // Let delayed transitions fire
          vi.advanceTimersByTime(2000)
          stateLog.push({
            eventType: event.type,
            flipperState: useFlipperStore.getState().state
          })
        }
      })
      playback.load(loadFixture('synthetic-session.jsonl'))
      playAllEvents(playback)

      const byType = (type: string) => stateLog.filter((e) => e.eventType === type)

      // session.start → entering, then idle after timeout
      expect(byType('session.start')[0].flipperState).toBe('idle')

      // assistant.turn_start → swimming
      expect(byType('assistant.turn_start').every((e) => e.flipperState === 'swimming')).toBe(true)

      // tool.execution_start → diving
      expect(byType('tool.execution_start').every((e) => e.flipperState === 'diving')).toBe(true)

      // tool.execution_complete with success:true → jumping then idle after timeout
      const successCompletes = stateLog.filter(
        (e) => e.eventType === 'tool.execution_complete' && e.flipperState === 'idle'
      )
      expect(successCompletes.length).toBeGreaterThan(0)

      // session.shutdown → hidden (after waving timeout)
      expect(byType('session.shutdown')[0].flipperState).toBe('hidden')
    })

    it('enters diving state with correct toolActive', () => {
      const toolLog: Array<{ toolName: string | null }> = []

      const playback = new SessionPlayback({
        speedMultiplier: 1000,
        onEvent: (event: ParsedEvent) => {
          useFlipperStore.getState().processEvent(event)
          if (event.type === 'tool.execution_start') {
            toolLog.push({ toolName: useFlipperStore.getState().toolActive })
          }
        }
      })
      playback.load(loadFixture('synthetic-session.jsonl'))
      playAllEvents(playback)

      // The synthetic session has tools: grep, view, edit, bash, edit, bash
      expect(toolLog.map((t) => t.toolName)).toEqual([
        'grep',
        'view',
        'edit',
        'bash',
        'edit',
        'bash'
      ])
    })

    it('tool failure triggers startled then idle', () => {
      const playback = new SessionPlayback({
        speedMultiplier: 1000,
        onEvent: (event: ParsedEvent) => {
          useFlipperStore.getState().processEvent(event)
        }
      })
      playback.load(loadFixture('synthetic-session.jsonl'))
      playback.start()

      // Advance to get failure event
      vi.advanceTimersByTime(5000)

      // Find the failure event
      const failEvent = mockState.events.find(
        (e) =>
          e.type === 'tool.execution_complete' &&
          (e.data?.success as boolean | undefined) === false
      )
      expect(failEvent).toBeDefined()

      // Feed only that event to a fresh flipper store
      useFlipperStore.setState({ state: 'diving', toolActive: 'bash' })
      useFlipperStore.getState().processEvent(failEvent!)
      expect(useFlipperStore.getState().state).toBe('startled')
      expect(useFlipperStore.getState().toolActive).toBeNull()

      vi.advanceTimersByTime(1000)
      expect(useFlipperStore.getState().state).toBe('idle')

      playback.stop()
    })

    it('tool success triggers jumping then idle', () => {
      useFlipperStore.setState({ state: 'diving', toolActive: 'edit' })
      useFlipperStore.getState().processEvent({
        type: 'tool.execution_complete',
        id: 'test-success',
        timestamp: new Date().toISOString(),
        parentId: null,
        ephemeral: false,
        data: { success: true },
        knownType: true
      })
      expect(useFlipperStore.getState().state).toBe('jumping')

      vi.advanceTimersByTime(1200)
      expect(useFlipperStore.getState().state).toBe('idle')
    })
  })

  // -------------------------------------------------------------------------
  // 2. Sub-agent tracking through playback
  // -------------------------------------------------------------------------

  describe('sub-agent tracking', () => {
    it('tracks activeSubAgents through playback lifecycle', () => {
      let maxSubAgents = 0
      let subAgentStartedCount = 0
      let subAgentCompletedCount = 0

      const playback = new SessionPlayback({
        speedMultiplier: 1000,
        onEvent: (event: ParsedEvent) => {
          useFlipperStore.getState().processEvent(event)
          const { activeSubAgents } = useFlipperStore.getState()
          maxSubAgents = Math.max(maxSubAgents, activeSubAgents.length)

          if (event.type === 'subagent.started') subAgentStartedCount++
          if (event.type === 'subagent.completed') subAgentCompletedCount++
        }
      })
      playback.load(loadFixture('synthetic-session.jsonl'))
      playAllEvents(playback)

      expect(subAgentStartedCount).toBe(1)
      expect(subAgentCompletedCount).toBe(1)
      expect(maxSubAgents).toBe(1)
      expect(useFlipperStore.getState().subAgentCount).toBe(0)
    })

    it('records correct sub-agent name', () => {
      let capturedAgentName: string | null = null

      const playback = new SessionPlayback({
        speedMultiplier: 1000,
        onEvent: (event: ParsedEvent) => {
          useFlipperStore.getState().processEvent(event)
          if (event.type === 'subagent.started') {
            const agents = useFlipperStore.getState().activeSubAgents
            capturedAgentName = agents[agents.length - 1]?.name ?? null
          }
        }
      })
      playback.load(loadFixture('synthetic-session.jsonl'))
      playAllEvents(playback)

      expect(capturedAgentName).toBe('task')
    })
  })

  // -------------------------------------------------------------------------
  // 3. Error event tracking
  // -------------------------------------------------------------------------

  describe('error event tracking', () => {
    it('records error events during playback', () => {
      const playback = new SessionPlayback({
        speedMultiplier: 1000,
        onEvent: (event: ParsedEvent) => {
          useFlipperStore.getState().processEvent(event)
        }
      })
      playback.load(loadFixture('synthetic-session.jsonl'))
      playAllEvents(playback)

      // The synthetic session has 1 tool failure (evt-017)
      const errors = useFlipperStore.getState().errorEvents
      expect(errors.length).toBeGreaterThanOrEqual(1)
      expect(errors[0].timestamp).toBeGreaterThan(0)
    })

    it('error events can be removed via removeError', () => {
      const playback = new SessionPlayback({
        speedMultiplier: 1000,
        onEvent: (event: ParsedEvent) => {
          useFlipperStore.getState().processEvent(event)
        }
      })
      playback.load(loadFixture('synthetic-session.jsonl'))
      playAllEvents(playback)

      const errors = useFlipperStore.getState().errorEvents
      expect(errors.length).toBeGreaterThanOrEqual(1)

      const firstId = errors[0].id
      useFlipperStore.getState().removeError(firstId)
      expect(useFlipperStore.getState().errorEvents.find((e) => e.id === firstId)).toBeUndefined()
    })
  })

  // -------------------------------------------------------------------------
  // 4. Full pipeline snapshot
  // -------------------------------------------------------------------------

  describe('full pipeline', () => {
    it('produces consistent snapshots across all events', () => {
      const snapshots: Array<{
        eventType: string
        flipperState: string
        toolActive: string | null
        subAgentCount: number
        errorCount: number
      }> = []

      const playback = new SessionPlayback({
        speedMultiplier: 1000,
        onEvent: (event: ParsedEvent) => {
          useFlipperStore.getState().processEvent(event)
          snapshots.push({
            eventType: event.type,
            flipperState: useFlipperStore.getState().state,
            toolActive: useFlipperStore.getState().toolActive,
            subAgentCount: useFlipperStore.getState().subAgentCount,
            errorCount: useFlipperStore.getState().errorEvents.length
          })
        }
      })
      playback.load(loadFixture('synthetic-session.jsonl'))
      playAllEvents(playback)

      expect(snapshots).toHaveLength(27)

      // First event: session starts
      expect(snapshots[0]).toMatchObject({
        eventType: 'session.start',
        flipperState: 'entering'
      })

      // Last event: session shuts down
      expect(snapshots[26]).toMatchObject({
        eventType: 'session.shutdown',
        flipperState: 'waving'
      })

      // Every tool.execution_start → diving
      const toolStarts = snapshots.filter((s) => s.eventType === 'tool.execution_start')
      expect(toolStarts.every((s) => s.flipperState === 'diving')).toBe(true)

      // Sub-agent tracking
      const saStart = snapshots.find((s) => s.eventType === 'subagent.started')!
      expect(saStart.subAgentCount).toBe(1)
      const saEnd = snapshots.find((s) => s.eventType === 'subagent.completed')!
      expect(saEnd.subAgentCount).toBe(0)

      // Error event was recorded
      const failedComplete = snapshots.find(
        (s) => s.eventType === 'tool.execution_complete' && s.flipperState === 'startled'
      )
      expect(failedComplete).toBeDefined()
      expect(failedComplete!.errorCount).toBeGreaterThan(0)
    })
  })
})
