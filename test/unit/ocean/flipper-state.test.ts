import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useFlipperStore } from '../../../src/renderer/modes/ocean/flipper-state'
import type { ParsedEvent } from '@shared/events'

/** Helper to create a minimal ParsedEvent for testing */
function makeEvent(
  type: string,
  data: Record<string, unknown> = {}
): ParsedEvent {
  return {
    type,
    id: `evt-${Date.now()}-${Math.random()}`,
    timestamp: new Date().toISOString(),
    parentId: null,
    ephemeral: false,
    data,
    knownType: true
  }
}

describe('flipper-state store', () => {
  beforeEach(() => {
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

  it('starts in hidden state', () => {
    expect(useFlipperStore.getState().state).toBe('hidden')
  })

  describe('session.start', () => {
    it('transitions to entering then idle after timeout', () => {
      useFlipperStore.getState().processEvent(makeEvent('session.start'))
      expect(useFlipperStore.getState().state).toBe('entering')

      vi.advanceTimersByTime(1500)
      expect(useFlipperStore.getState().state).toBe('idle')
    })

    it('resets toolActive, subAgentCount and activeSubAgents', () => {
      useFlipperStore.setState({
        toolActive: 'bash',
        subAgentCount: 3,
        activeSubAgents: [{ id: 'a1', name: 'explore', startTime: 1 }]
      })
      useFlipperStore.getState().processEvent(makeEvent('session.start'))
      expect(useFlipperStore.getState().toolActive).toBeNull()
      expect(useFlipperStore.getState().subAgentCount).toBe(0)
      expect(useFlipperStore.getState().activeSubAgents).toEqual([])
    })

    it('does not revert to idle if state changed before timeout', () => {
      useFlipperStore.getState().processEvent(makeEvent('session.start'))
      expect(useFlipperStore.getState().state).toBe('entering')

      useFlipperStore.getState().processEvent(makeEvent('assistant.turn_start'))
      expect(useFlipperStore.getState().state).toBe('swimming')

      vi.advanceTimersByTime(1500)
      expect(useFlipperStore.getState().state).toBe('swimming')
    })
  })

  describe('user.message', () => {
    it('transitions to idle', () => {
      useFlipperStore.setState({ state: 'swimming' })
      useFlipperStore.getState().processEvent(makeEvent('user.message'))
      expect(useFlipperStore.getState().state).toBe('idle')
    })
  })

  describe('assistant.turn_start', () => {
    it('transitions to swimming', () => {
      useFlipperStore.setState({ state: 'idle' })
      useFlipperStore.getState().processEvent(makeEvent('assistant.turn_start'))
      expect(useFlipperStore.getState().state).toBe('swimming')
    })
  })

  describe('tool.execution_start', () => {
    it('transitions to diving with toolActive', () => {
      useFlipperStore.setState({ state: 'swimming' })
      useFlipperStore
        .getState()
        .processEvent(makeEvent('tool.execution_start', { toolName: 'bash' }))
      expect(useFlipperStore.getState().state).toBe('diving')
      expect(useFlipperStore.getState().toolActive).toBe('bash')
    })

    it('sets toolActive to null when no toolName provided', () => {
      useFlipperStore.getState().processEvent(makeEvent('tool.execution_start'))
      expect(useFlipperStore.getState().state).toBe('diving')
      expect(useFlipperStore.getState().toolActive).toBeNull()
    })
  })

  describe('tool.execution_complete', () => {
    it('transitions to jumping on success then reverts to idle', () => {
      useFlipperStore.setState({ state: 'diving', toolActive: 'edit' })
      useFlipperStore
        .getState()
        .processEvent(makeEvent('tool.execution_complete', { success: true }))
      expect(useFlipperStore.getState().state).toBe('jumping')
      expect(useFlipperStore.getState().toolActive).toBeNull()

      vi.advanceTimersByTime(1200)
      expect(useFlipperStore.getState().state).toBe('idle')
    })

    it('transitions to startled on failure, adds to errorEvents, then reverts to idle', () => {
      useFlipperStore.setState({ state: 'diving', toolActive: 'bash' })
      const event = makeEvent('tool.execution_complete', { success: false })
      useFlipperStore.getState().processEvent(event)
      expect(useFlipperStore.getState().state).toBe('startled')
      expect(useFlipperStore.getState().toolActive).toBeNull()
      expect(useFlipperStore.getState().errorEvents).toHaveLength(1)
      expect(useFlipperStore.getState().errorEvents[0].id).toBe(event.id)

      vi.advanceTimersByTime(1000)
      expect(useFlipperStore.getState().state).toBe('idle')
    })

    it('does not revert startled to idle if state changed before timeout', () => {
      useFlipperStore.setState({ state: 'diving' })
      useFlipperStore
        .getState()
        .processEvent(makeEvent('tool.execution_complete', { success: false }))
      expect(useFlipperStore.getState().state).toBe('startled')

      useFlipperStore.getState().processEvent(makeEvent('assistant.turn_start'))
      expect(useFlipperStore.getState().state).toBe('swimming')

      vi.advanceTimersByTime(1000)
      expect(useFlipperStore.getState().state).toBe('swimming')
    })

    it('does not revert jumping to idle if state changed before timeout', () => {
      useFlipperStore.setState({ state: 'diving' })
      useFlipperStore
        .getState()
        .processEvent(makeEvent('tool.execution_complete', { success: true }))
      expect(useFlipperStore.getState().state).toBe('jumping')

      useFlipperStore.getState().processEvent(makeEvent('assistant.turn_start'))
      expect(useFlipperStore.getState().state).toBe('swimming')

      vi.advanceTimersByTime(1200)
      expect(useFlipperStore.getState().state).toBe('swimming')
    })

    it('treats missing success field as success', () => {
      useFlipperStore.setState({ state: 'diving', toolActive: 'edit' })
      useFlipperStore
        .getState()
        .processEvent(makeEvent('tool.execution_complete', {}))
      expect(useFlipperStore.getState().state).toBe('jumping')
    })
  })

  describe('session.shutdown', () => {
    it('transitions to waving then hidden after timeout', () => {
      useFlipperStore.setState({ state: 'idle' })
      useFlipperStore.getState().processEvent(makeEvent('session.shutdown'))
      expect(useFlipperStore.getState().state).toBe('waving')
      expect(useFlipperStore.getState().toolActive).toBeNull()

      vi.advanceTimersByTime(2000)
      expect(useFlipperStore.getState().state).toBe('hidden')
    })

    it('does not revert to hidden if state changed before timeout', () => {
      useFlipperStore.setState({ state: 'idle' })
      useFlipperStore.getState().processEvent(makeEvent('session.shutdown'))
      expect(useFlipperStore.getState().state).toBe('waving')

      useFlipperStore.getState().processEvent(makeEvent('session.start'))
      expect(useFlipperStore.getState().state).toBe('entering')

      vi.advanceTimersByTime(2000)
      // entering timeout fires at 1500ms so state becomes idle, not hidden
      expect(useFlipperStore.getState().state).toBe('idle')
    })
  })

  describe('subagent events', () => {
    it('increments subAgentCount and tracks activeSubAgents on subagent.started', () => {
      useFlipperStore.setState({ subAgentCount: 0, activeSubAgents: [] })
      useFlipperStore
        .getState()
        .processEvent(makeEvent('subagent.started', { agentId: 'a1', agentName: 'explore' }))
      expect(useFlipperStore.getState().subAgentCount).toBe(1)
      expect(useFlipperStore.getState().activeSubAgents).toHaveLength(1)
      expect(useFlipperStore.getState().activeSubAgents[0].id).toBe('a1')
      expect(useFlipperStore.getState().activeSubAgents[0].name).toBe('explore')

      useFlipperStore
        .getState()
        .processEvent(makeEvent('subagent.started', { agentId: 'a2', agentName: 'task' }))
      expect(useFlipperStore.getState().subAgentCount).toBe(2)
      expect(useFlipperStore.getState().activeSubAgents).toHaveLength(2)
    })

    it('decrements subAgentCount and removes from activeSubAgents on subagent.completed', () => {
      useFlipperStore.setState({
        subAgentCount: 2,
        activeSubAgents: [
          { id: 'a1', name: 'explore', startTime: 1 },
          { id: 'a2', name: 'task', startTime: 2 }
        ]
      })
      useFlipperStore
        .getState()
        .processEvent(makeEvent('subagent.completed', { agentId: 'a1' }))
      expect(useFlipperStore.getState().subAgentCount).toBe(1)
      expect(useFlipperStore.getState().activeSubAgents).toHaveLength(1)
      expect(useFlipperStore.getState().activeSubAgents[0].id).toBe('a2')
    })

    it('decrements subAgentCount on subagent.failed', () => {
      useFlipperStore.setState({
        subAgentCount: 1,
        activeSubAgents: [{ id: 'a1', name: 'explore', startTime: 1 }]
      })
      useFlipperStore
        .getState()
        .processEvent(makeEvent('subagent.failed', { agentId: 'a1' }))
      expect(useFlipperStore.getState().subAgentCount).toBe(0)
      expect(useFlipperStore.getState().activeSubAgents).toHaveLength(0)
    })

    it('does not go below zero', () => {
      useFlipperStore.setState({ subAgentCount: 0, activeSubAgents: [] })
      useFlipperStore
        .getState()
        .processEvent(makeEvent('subagent.completed', { agentId: 'nonexistent' }))
      expect(useFlipperStore.getState().subAgentCount).toBe(0)
      expect(useFlipperStore.getState().activeSubAgents).toHaveLength(0)
    })
  })

  describe('activityLevel', () => {
    it('increases with frequent events', () => {
      for (let i = 0; i < 10; i++) {
        useFlipperStore.getState().processEvent(makeEvent('user.message'))
      }
      expect(useFlipperStore.getState().activityLevel).toBeGreaterThan(0)
      expect(useFlipperStore.getState().activityLevel).toBeLessThanOrEqual(1)
    })

    it('reaches 1.0 with enough events in the window', () => {
      for (let i = 0; i < 25; i++) {
        useFlipperStore.getState().processEvent(makeEvent('user.message'))
      }
      expect(useFlipperStore.getState().activityLevel).toBe(1)
    })

    it('starts at 0 with no events', () => {
      expect(useFlipperStore.getState().activityLevel).toBe(0)
    })
  })

  describe('removeError', () => {
    it('removes a specific error from errorEvents', () => {
      useFlipperStore.setState({
        errorEvents: [
          { id: 'e1', timestamp: 1000 },
          { id: 'e2', timestamp: 2000 }
        ]
      })
      useFlipperStore.getState().removeError('e1')
      expect(useFlipperStore.getState().errorEvents).toHaveLength(1)
      expect(useFlipperStore.getState().errorEvents[0].id).toBe('e2')
    })

    it('does nothing when id not found', () => {
      useFlipperStore.setState({
        errorEvents: [{ id: 'e1', timestamp: 1000 }]
      })
      useFlipperStore.getState().removeError('nonexistent')
      expect(useFlipperStore.getState().errorEvents).toHaveLength(1)
    })
  })

  describe('unknown event types', () => {
    it('does not change state for unknown event types', () => {
      useFlipperStore.setState({ state: 'idle', subAgentCount: 1, toolActive: 'bash' })
      useFlipperStore.getState().processEvent(makeEvent('some.unknown.event'))
      expect(useFlipperStore.getState().state).toBe('idle')
      expect(useFlipperStore.getState().subAgentCount).toBe(1)
      expect(useFlipperStore.getState().toolActive).toBe('bash')
    })
  })

  describe('setState', () => {
    it('directly sets the flipper state', () => {
      useFlipperStore.getState().setState('diving')
      expect(useFlipperStore.getState().state).toBe('diving')
    })
  })
})
