import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { SessionPlayback } from '../../../src/renderer/debug/session-playback'
import { useCocoStore } from '../../../src/renderer/modes/island/coco-state'
import { getSoundForEvent } from '../../../src/renderer/audio/event-sound-map'
import type { ParsedEvent } from '@shared/events'

// --- Mock monitoring store (same approach as session-playback.test.ts) ---

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
  // Each inter-event gap is at least 50ms; 27 events * 60ms with margin
  vi.advanceTimersByTime(60_000)
}

describe('Playback Integration', () => {
  beforeEach(() => {
    mockState.events = []
    mockState.sessions = []
    mockState.selectedSessionId = null
    vi.clearAllMocks()
    vi.useFakeTimers()

    useCocoStore.setState({
      state: 'hidden',
      toolActive: null,
      subAgentCount: 0,
      activeSubAgents: []
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // -------------------------------------------------------------------------
  // 1. Load synthetic session and verify events appear in monitoring store
  // -------------------------------------------------------------------------

  describe('events appear in monitoring store', () => {
    it('all 27 synthetic events land in the store after full playback', () => {
      const playback = new SessionPlayback({ speedMultiplier: 1000 })
      playback.load(loadFixture('synthetic-session.jsonl'))
      playAllEvents(playback)

      expect(mockState.events).toHaveLength(27)
      expect(mockState.events[0].type).toBe('session.start')
      expect(mockState.events[26].type).toBe('session.shutdown')
    })

    it('session is registered with correct metadata', () => {
      const playback = new SessionPlayback({ speedMultiplier: 1000 })
      playback.load(loadFixture('synthetic-session.jsonl'))
      playback.start()

      expect(mockState.playbackSetSession).toHaveBeenCalledOnce()
      const session = mockState.playbackSetSession.mock.calls[0][0]
      expect(session).toMatchObject({
        id: 'syn-test-001',
        status: 'active',
        repository: 'acme/widget-api',
        branch: 'feature/health-check',
        cwd: '/Users/dev/acme/widget-api'
      })

      playback.stop()
    })

    it('events are injected in chronological order', () => {
      const playback = new SessionPlayback({ speedMultiplier: 1000 })
      playback.load(loadFixture('synthetic-session.jsonl'))
      playAllEvents(playback)

      for (let i = 1; i < mockState.events.length; i++) {
        const prev = new Date(mockState.events[i - 1].timestamp).getTime()
        const curr = new Date(mockState.events[i].timestamp).getTime()
        expect(curr).toBeGreaterThanOrEqual(prev)
      }
    })
  })

  // -------------------------------------------------------------------------
  // 2. Coco state transitions match played-back events
  // -------------------------------------------------------------------------

  describe('Coco state transitions', () => {
    it('follows the expected state sequence through the full session', () => {
      const stateLog: Array<{ eventType: string; cocoState: string }> = []

      const playback = new SessionPlayback({
        speedMultiplier: 1000,
        onEvent: (event: ParsedEvent) => {
          useCocoStore.getState().processEvent(event)
          // Let any delayed state transitions (entering→idle) fire
          vi.advanceTimersByTime(2000)
          stateLog.push({
            eventType: event.type,
            cocoState: useCocoStore.getState().state
          })
        }
      })
      playback.load(loadFixture('synthetic-session.jsonl'))
      playAllEvents(playback)

      // Verify key milestones in the state log
      const byType = (type: string) => stateLog.filter((e) => e.eventType === type)

      // session.start → entering, then idle after timeout
      expect(byType('session.start')[0].cocoState).toBe('idle') // timeout already fired

      // assistant.turn_start → thinking
      expect(byType('assistant.turn_start').every((e) => e.cocoState === 'thinking')).toBe(
        true
      )

      // tool.execution_start → working
      expect(byType('tool.execution_start').every((e) => e.cocoState === 'working')).toBe(
        true
      )

      // tool.execution_complete with success:false → startled (then idle after timeout)
      const failedTool = stateLog.find(
        (e) => e.eventType === 'tool.execution_complete' && e.cocoState === 'idle'
      )
      // The failure event (evt-017) will be startled but the 2000ms advance reverts it
      expect(failedTool).toBeDefined()

      // session.shutdown → hidden (after waving timeout)
      expect(byType('session.shutdown')[0].cocoState).toBe('hidden')
    })

    it('enters working state with correct toolActive', () => {
      const toolLog: Array<{ toolName: string | null }> = []

      const playback = new SessionPlayback({
        speedMultiplier: 1000,
        onEvent: (event: ParsedEvent) => {
          useCocoStore.getState().processEvent(event)
          if (event.type === 'tool.execution_start') {
            toolLog.push({ toolName: useCocoStore.getState().toolActive })
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

    it('tool failure triggers startled state before recovery', () => {
      const playback = new SessionPlayback({
        speedMultiplier: 1000,
        onEvent: (event: ParsedEvent) => {
          useCocoStore.getState().processEvent(event)
        }
      })
      playback.load(loadFixture('synthetic-session.jsonl'))
      playback.start()

      // Advance up to event 17 (tool.execution_complete with success:false)
      // Events up to index 16 need to fire — advance generously
      vi.advanceTimersByTime(5000)

      // Find the failure event and verify the state was startled
      const failEvent = mockState.events.find(
        (e) =>
          e.type === 'tool.execution_complete' &&
          (e.data?.success as boolean | undefined) === false
      )
      expect(failEvent).toBeDefined()

      // Feed only that event to a fresh coco store to verify behavior
      useCocoStore.setState({ state: 'working', toolActive: 'bash' })
      useCocoStore.getState().processEvent(failEvent!)
      expect(useCocoStore.getState().state).toBe('startled')
      expect(useCocoStore.getState().toolActive).toBeNull()

      vi.advanceTimersByTime(1000)
      expect(useCocoStore.getState().state).toBe('idle')

      playback.stop()
    })
  })

  // -------------------------------------------------------------------------
  // 3. Event → sound mapping produces correct sounds
  // -------------------------------------------------------------------------

  describe('event-to-sound mapping', () => {
    it('produces the expected sound sequence for the full session', () => {
      const sounds: Array<{ eventType: string; sound: string | null }> = []

      const playback = new SessionPlayback({
        speedMultiplier: 1000,
        onEvent: (event: ParsedEvent) => {
          sounds.push({
            eventType: event.type,
            sound: getSoundForEvent(event)
          })
        }
      })
      playback.load(loadFixture('synthetic-session.jsonl'))
      playAllEvents(playback)

      const nonNull = sounds.filter((s) => s.sound !== null)

      // session.start → session-start
      expect(nonNull[0]).toEqual({
        eventType: 'session.start',
        sound: 'session-start'
      })

      // user.message → user-message
      const userMsgs = nonNull.filter((s) => s.eventType === 'user.message')
      expect(userMsgs.every((s) => s.sound === 'user-message')).toBe(true)

      // assistant.turn_start → user-message
      const turnStarts = nonNull.filter((s) => s.eventType === 'assistant.turn_start')
      expect(turnStarts.every((s) => s.sound === 'user-message')).toBe(true)

      // assistant.turn_end → tool-success
      const turnEnds = nonNull.filter((s) => s.eventType === 'assistant.turn_end')
      expect(turnEnds.every((s) => s.sound === 'tool-success')).toBe(true)

      // session.shutdown → session-end
      const lastNonNull = nonNull[nonNull.length - 1]
      expect(lastNonNull).toEqual({
        eventType: 'session.shutdown',
        sound: 'session-end'
      })
    })

    it('maps tool.execution_start sounds by tool name', () => {
      const playback = new SessionPlayback({ speedMultiplier: 1000 })
      playback.load(loadFixture('synthetic-session.jsonl'))
      playAllEvents(playback)

      const toolStarts = mockState.events.filter(
        (e) => e.type === 'tool.execution_start'
      )
      const toolSounds = toolStarts.map((e) => ({
        tool: e.data?.toolName as string,
        sound: getSoundForEvent(e)
      }))

      // grep → null (no special sound), view → null, edit → tool-edit, bash → tool-bash
      expect(toolSounds).toEqual([
        { tool: 'grep', sound: null },
        { tool: 'view', sound: null },
        { tool: 'edit', sound: 'tool-edit' },
        { tool: 'bash', sound: 'tool-bash' },
        { tool: 'edit', sound: 'tool-edit' },
        { tool: 'bash', sound: 'tool-bash' }
      ])
    })

    it('maps tool.execution_complete failure to tool-error', () => {
      const playback = new SessionPlayback({ speedMultiplier: 1000 })
      playback.load(loadFixture('synthetic-session.jsonl'))
      playAllEvents(playback)

      const toolCompletes = mockState.events.filter(
        (e) => e.type === 'tool.execution_complete'
      )
      const completeSounds = toolCompletes.map((e) => ({
        success: e.data?.success,
        sound: getSoundForEvent(e)
      }))

      // evt-017 has success: false
      const failures = completeSounds.filter((s) => s.success === false)
      expect(failures).toHaveLength(1)
      expect(failures[0].sound).toBe('tool-error')

      // All successes → tool-success
      const successes = completeSounds.filter((s) => s.success === true)
      expect(successes.every((s) => s.sound === 'tool-success')).toBe(true)
    })

    it('returns null for events without sound mappings', () => {
      const playback = new SessionPlayback({ speedMultiplier: 1000 })
      playback.load(loadFixture('synthetic-session.jsonl'))
      playAllEvents(playback)

      const noSoundTypes = [
        'assistant.usage',
        'assistant.message',
        'subagent.started',
        'subagent.completed'
      ]
      const noSoundEvents = mockState.events.filter((e) =>
        noSoundTypes.includes(e.type)
      )
      expect(noSoundEvents.length).toBeGreaterThan(0)
      expect(noSoundEvents.every((e) => getSoundForEvent(e) === null)).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // 4. Sub-agent tracking
  // -------------------------------------------------------------------------

  describe('sub-agent tracking', () => {
    it('tracks activeSubAgents through playback lifecycle', () => {
      let maxSubAgents = 0
      let subAgentStartedCount = 0
      let subAgentCompletedCount = 0

      const playback = new SessionPlayback({
        speedMultiplier: 1000,
        onEvent: (event: ParsedEvent) => {
          useCocoStore.getState().processEvent(event)
          const { activeSubAgents, subAgentCount } = useCocoStore.getState()
          maxSubAgents = Math.max(maxSubAgents, activeSubAgents.length)

          if (event.type === 'subagent.started') subAgentStartedCount++
          if (event.type === 'subagent.completed') subAgentCompletedCount++
        }
      })
      playback.load(loadFixture('synthetic-session.jsonl'))

      // Reset coco state before playback (session.start will reset too)
      useCocoStore.setState({ activeSubAgents: [], subAgentCount: 0 })
      playAllEvents(playback)

      // The synthetic session has 1 subagent started and 1 completed
      expect(subAgentStartedCount).toBe(1)
      expect(subAgentCompletedCount).toBe(1)
      expect(maxSubAgents).toBe(1)

      // Note: the synthetic fixture lacks data.agentId on both subagent events,
      // so the store falls back to event.id which differs between started (evt-015)
      // and completed (evt-018). The completed event won't match the started one
      // by id, leaving the sub-agent in the active list. This reflects the
      // real-world scenario where agentId must be present for proper cleanup.
      // Sub-agent count still decrements (clamped to 0).
      expect(useCocoStore.getState().subAgentCount).toBe(0)
    })

    it('records correct sub-agent name from event data', () => {
      let capturedAgentName: string | null = null

      const playback = new SessionPlayback({
        speedMultiplier: 1000,
        onEvent: (event: ParsedEvent) => {
          useCocoStore.getState().processEvent(event)
          if (event.type === 'subagent.started') {
            const agents = useCocoStore.getState().activeSubAgents
            capturedAgentName = agents[agents.length - 1]?.name ?? null
          }
        }
      })
      playback.load(loadFixture('synthetic-session.jsonl'))
      useCocoStore.setState({ activeSubAgents: [], subAgentCount: 0 })
      playAllEvents(playback)

      // The synthetic session's subagent is named "task"
      expect(capturedAgentName).toBe('task')
    })

    it('subAgentCount never goes below zero with extra completions', () => {
      // Feed a synthetic completion without a prior start
      useCocoStore.setState({ activeSubAgents: [], subAgentCount: 0 })
      useCocoStore.getState().processEvent({
        type: 'subagent.completed',
        id: 'orphan',
        timestamp: new Date().toISOString(),
        parentId: null,
        ephemeral: false,
        data: { agentId: 'nonexistent' },
        knownType: true
      })

      expect(useCocoStore.getState().subAgentCount).toBe(0)
      expect(useCocoStore.getState().activeSubAgents).toHaveLength(0)
    })
  })

  // -------------------------------------------------------------------------
  // 5. Full pipeline: playback → store → coco → sounds
  // -------------------------------------------------------------------------

  describe('full pipeline end-to-end', () => {
    it('produces consistent state across all systems for every event', () => {
      const snapshots: Array<{
        eventType: string
        storeEventCount: number
        cocoState: string
        toolActive: string | null
        subAgentCount: number
        sound: string | null
      }> = []

      const playback = new SessionPlayback({
        speedMultiplier: 1000,
        onEvent: (event: ParsedEvent) => {
          useCocoStore.getState().processEvent(event)
          snapshots.push({
            eventType: event.type,
            storeEventCount: mockState.events.length,
            cocoState: useCocoStore.getState().state,
            toolActive: useCocoStore.getState().toolActive,
            subAgentCount: useCocoStore.getState().subAgentCount,
            sound: getSoundForEvent(event)
          })
        }
      })
      playback.load(loadFixture('synthetic-session.jsonl'))
      useCocoStore.setState({ activeSubAgents: [], subAgentCount: 0 })
      playAllEvents(playback)

      expect(snapshots).toHaveLength(27)

      // First event: session starts
      expect(snapshots[0]).toMatchObject({
        eventType: 'session.start',
        storeEventCount: 1,
        cocoState: 'entering',
        sound: 'session-start'
      })

      // Last event: session shuts down
      expect(snapshots[26]).toMatchObject({
        eventType: 'session.shutdown',
        storeEventCount: 27,
        cocoState: 'waving',
        sound: 'session-end'
      })

      // Sub-agent started (evt-015, index 14)
      const saStart = snapshots.find((s) => s.eventType === 'subagent.started')!
      expect(saStart.subAgentCount).toBe(1)

      // Sub-agent completed (evt-018, index 17)
      const saEnd = snapshots.find((s) => s.eventType === 'subagent.completed')!
      expect(saEnd.subAgentCount).toBe(0)

      // Every tool.execution_start has coco in 'working' state
      const toolStarts = snapshots.filter((s) => s.eventType === 'tool.execution_start')
      expect(toolStarts.every((s) => s.cocoState === 'working')).toBe(true)

      // The failed tool complete triggers startled
      const failedComplete = snapshots.find(
        (s) => s.eventType === 'tool.execution_complete' && s.sound === 'tool-error'
      )
      expect(failedComplete).toBeDefined()
      expect(failedComplete!.cocoState).toBe('startled')
    })
  })
})
