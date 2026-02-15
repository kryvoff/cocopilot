import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useCocoStore } from '../../../src/renderer/modes/island/coco-state'
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

describe('coco-state store', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Reset store to initial state
    useCocoStore.setState({
      state: 'hidden',
      toolActive: null,
      subAgentCount: 0
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts in hidden state', () => {
    expect(useCocoStore.getState().state).toBe('hidden')
  })

  describe('session.start', () => {
    it('transitions to entering then idle after timeout', () => {
      useCocoStore.getState().processEvent(makeEvent('session.start'))
      expect(useCocoStore.getState().state).toBe('entering')

      vi.advanceTimersByTime(1500)
      expect(useCocoStore.getState().state).toBe('idle')
    })

    it('resets toolActive and subAgentCount', () => {
      useCocoStore.setState({ toolActive: 'bash', subAgentCount: 3 })
      useCocoStore.getState().processEvent(makeEvent('session.start'))
      expect(useCocoStore.getState().toolActive).toBeNull()
      expect(useCocoStore.getState().subAgentCount).toBe(0)
    })

    it('does not revert to idle if state changed before timeout', () => {
      useCocoStore.getState().processEvent(makeEvent('session.start'))
      expect(useCocoStore.getState().state).toBe('entering')

      // Change state before timeout fires
      useCocoStore.getState().processEvent(makeEvent('assistant.turn_start'))
      expect(useCocoStore.getState().state).toBe('thinking')

      vi.advanceTimersByTime(1500)
      // Should stay thinking, not revert to idle
      expect(useCocoStore.getState().state).toBe('thinking')
    })
  })

  describe('user.message', () => {
    it('transitions to idle', () => {
      useCocoStore.setState({ state: 'thinking' })
      useCocoStore.getState().processEvent(makeEvent('user.message'))
      expect(useCocoStore.getState().state).toBe('idle')
    })
  })

  describe('assistant.turn_start', () => {
    it('transitions to thinking', () => {
      useCocoStore.setState({ state: 'idle' })
      useCocoStore.getState().processEvent(makeEvent('assistant.turn_start'))
      expect(useCocoStore.getState().state).toBe('thinking')
    })
  })

  describe('tool.execution_start', () => {
    it('transitions to working with toolActive', () => {
      useCocoStore.setState({ state: 'thinking' })
      useCocoStore
        .getState()
        .processEvent(makeEvent('tool.execution_start', { toolName: 'bash' }))
      expect(useCocoStore.getState().state).toBe('working')
      expect(useCocoStore.getState().toolActive).toBe('bash')
    })

    it('sets toolActive to null when no toolName provided', () => {
      useCocoStore.getState().processEvent(makeEvent('tool.execution_start'))
      expect(useCocoStore.getState().state).toBe('working')
      expect(useCocoStore.getState().toolActive).toBeNull()
    })
  })

  describe('tool.execution_complete', () => {
    it('transitions to idle on success and clears toolActive', () => {
      useCocoStore.setState({ state: 'working', toolActive: 'edit' })
      useCocoStore
        .getState()
        .processEvent(makeEvent('tool.execution_complete', { success: true }))
      expect(useCocoStore.getState().state).toBe('idle')
      expect(useCocoStore.getState().toolActive).toBeNull()
    })

    it('transitions to startled on failure then reverts to idle', () => {
      useCocoStore.setState({ state: 'working', toolActive: 'bash' })
      useCocoStore
        .getState()
        .processEvent(makeEvent('tool.execution_complete', { success: false }))
      expect(useCocoStore.getState().state).toBe('startled')
      expect(useCocoStore.getState().toolActive).toBeNull()

      vi.advanceTimersByTime(1000)
      expect(useCocoStore.getState().state).toBe('idle')
    })

    it('does not revert startled to idle if state changed before timeout', () => {
      useCocoStore.setState({ state: 'working' })
      useCocoStore
        .getState()
        .processEvent(makeEvent('tool.execution_complete', { success: false }))
      expect(useCocoStore.getState().state).toBe('startled')

      // Another event changes state before the timeout
      useCocoStore.getState().processEvent(makeEvent('assistant.turn_start'))
      expect(useCocoStore.getState().state).toBe('thinking')

      vi.advanceTimersByTime(1000)
      expect(useCocoStore.getState().state).toBe('thinking')
    })

    it('treats missing success field as success', () => {
      useCocoStore.setState({ state: 'working', toolActive: 'edit' })
      useCocoStore
        .getState()
        .processEvent(makeEvent('tool.execution_complete', {}))
      expect(useCocoStore.getState().state).toBe('idle')
    })
  })

  describe('session.shutdown', () => {
    it('transitions to waving then hidden after timeout', () => {
      useCocoStore.setState({ state: 'idle' })
      useCocoStore.getState().processEvent(makeEvent('session.shutdown'))
      expect(useCocoStore.getState().state).toBe('waving')
      expect(useCocoStore.getState().toolActive).toBeNull()

      vi.advanceTimersByTime(2000)
      expect(useCocoStore.getState().state).toBe('hidden')
    })

    it('does not revert to hidden if state changed before timeout', () => {
      useCocoStore.setState({ state: 'idle' })
      useCocoStore.getState().processEvent(makeEvent('session.shutdown'))
      expect(useCocoStore.getState().state).toBe('waving')

      // New session starts before timeout
      useCocoStore.getState().processEvent(makeEvent('session.start'))
      expect(useCocoStore.getState().state).toBe('entering')

      vi.advanceTimersByTime(2000)
      // Should not go to hidden — entering timeout fires at 1500ms instead
      expect(useCocoStore.getState().state).toBe('idle')
    })
  })

  describe('subagent events', () => {
    it('increments subAgentCount on subagent.started', () => {
      useCocoStore.setState({ subAgentCount: 0 })
      useCocoStore.getState().processEvent(makeEvent('subagent.started'))
      expect(useCocoStore.getState().subAgentCount).toBe(1)

      useCocoStore.getState().processEvent(makeEvent('subagent.started'))
      expect(useCocoStore.getState().subAgentCount).toBe(2)
    })

    it('decrements subAgentCount on subagent.completed', () => {
      useCocoStore.setState({ subAgentCount: 2 })
      useCocoStore.getState().processEvent(makeEvent('subagent.completed'))
      expect(useCocoStore.getState().subAgentCount).toBe(1)
    })

    it('decrements subAgentCount on subagent.failed', () => {
      useCocoStore.setState({ subAgentCount: 1 })
      useCocoStore.getState().processEvent(makeEvent('subagent.failed'))
      expect(useCocoStore.getState().subAgentCount).toBe(0)
    })

    it('does not go below zero', () => {
      useCocoStore.setState({ subAgentCount: 0 })
      useCocoStore.getState().processEvent(makeEvent('subagent.completed'))
      expect(useCocoStore.getState().subAgentCount).toBe(0)
    })
  })

  describe('unknown event types', () => {
    it('does not change state for unknown event types', () => {
      useCocoStore.setState({ state: 'idle', subAgentCount: 1, toolActive: 'bash' })
      useCocoStore.getState().processEvent(makeEvent('some.unknown.event'))
      expect(useCocoStore.getState().state).toBe('idle')
      expect(useCocoStore.getState().subAgentCount).toBe(1)
      expect(useCocoStore.getState().toolActive).toBe('bash')
    })
  })

  describe('setState', () => {
    it('directly sets the coco state', () => {
      useCocoStore.getState().setState('working')
      expect(useCocoStore.getState().state).toBe('working')
    })
  })
})
