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

/**
 * Tool-to-creature group mapping from OceanCreatures.tsx.
 * We replicate the logic here to test it without React/Three.js dependencies.
 */
const TOOL_GROUPS: Record<string, string[]> = {
  bash: ['bash'],
  edit: ['edit', 'create'],
  search: ['grep', 'glob'],
  view: ['view'],
  web: ['web_search', 'web_fetch']
}

function toolGroup(activeTool: string | null): string | null {
  if (!activeTool) return null
  for (const [group, tools] of Object.entries(TOOL_GROUPS)) {
    if (tools.includes(activeTool)) return group
  }
  return null
}

// Creature type for each tool group
const CREATURE_MAP: Record<string, string> = {
  bash: 'Octopus',
  edit: 'Seahorse',
  search: 'Starfish',
  view: 'SeaTurtle',
  web: 'none (no creature yet)'
}

describe('ocean event-to-creature mapping', () => {
  describe('tool name → creature group', () => {
    it('maps bash to Octopus (bash group)', () => {
      expect(toolGroup('bash')).toBe('bash')
    })

    it('maps edit to Seahorse (edit group)', () => {
      expect(toolGroup('edit')).toBe('edit')
    })

    it('maps create to Seahorse (edit group)', () => {
      expect(toolGroup('create')).toBe('edit')
    })

    it('maps grep to Starfish (search group)', () => {
      expect(toolGroup('grep')).toBe('search')
    })

    it('maps glob to Starfish (search group)', () => {
      expect(toolGroup('glob')).toBe('search')
    })

    it('maps view to SeaTurtle (view group)', () => {
      expect(toolGroup('view')).toBe('view')
    })

    it('maps web_search to web group', () => {
      expect(toolGroup('web_search')).toBe('web')
    })

    it('maps web_fetch to web group', () => {
      expect(toolGroup('web_fetch')).toBe('web')
    })

    it('returns null for unknown tools', () => {
      expect(toolGroup('unknown_tool')).toBeNull()
    })

    it('returns null for null tool', () => {
      expect(toolGroup(null)).toBeNull()
    })
  })

  describe('error events create jellyfish entries', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      useFlipperStore.setState({
        state: 'diving',
        toolActive: 'bash',
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

    it('creates a jellyfish entry on tool failure', () => {
      const event = makeEvent('tool.execution_complete', { success: false })
      useFlipperStore.getState().processEvent(event)

      const errors = useFlipperStore.getState().errorEvents
      expect(errors).toHaveLength(1)
      expect(errors[0].id).toBe(event.id)
      expect(errors[0].timestamp).toBeGreaterThan(0)
    })

    it('accumulates multiple jellyfish entries', () => {
      const event1 = makeEvent('tool.execution_complete', { success: false })
      const event2 = makeEvent('tool.execution_complete', { success: false })
      useFlipperStore.getState().processEvent(event1)

      // Need to set state back to diving for next failure
      useFlipperStore.setState({ state: 'diving' })
      useFlipperStore.getState().processEvent(event2)

      expect(useFlipperStore.getState().errorEvents).toHaveLength(2)
    })

    it('does not create jellyfish on success', () => {
      useFlipperStore
        .getState()
        .processEvent(makeEvent('tool.execution_complete', { success: true }))
      expect(useFlipperStore.getState().errorEvents).toHaveLength(0)
    })

    it('removeError removes a specific jellyfish', () => {
      const event = makeEvent('tool.execution_complete', { success: false })
      useFlipperStore.getState().processEvent(event)
      expect(useFlipperStore.getState().errorEvents).toHaveLength(1)

      useFlipperStore.getState().removeError(event.id)
      expect(useFlipperStore.getState().errorEvents).toHaveLength(0)
    })
  })

  describe('sub-agent events create/remove fish schools', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      useFlipperStore.setState({
        state: 'idle',
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

    it('adds a fish school on subagent.started', () => {
      useFlipperStore
        .getState()
        .processEvent(makeEvent('subagent.started', { agentId: 'sa1', agentName: 'explore' }))

      const agents = useFlipperStore.getState().activeSubAgents
      expect(agents).toHaveLength(1)
      expect(agents[0]).toMatchObject({ id: 'sa1', name: 'explore' })
    })

    it('removes a fish school on subagent.completed', () => {
      useFlipperStore
        .getState()
        .processEvent(makeEvent('subagent.started', { agentId: 'sa1', agentName: 'explore' }))
      expect(useFlipperStore.getState().activeSubAgents).toHaveLength(1)

      useFlipperStore
        .getState()
        .processEvent(makeEvent('subagent.completed', { agentId: 'sa1' }))
      expect(useFlipperStore.getState().activeSubAgents).toHaveLength(0)
    })

    it('removes a fish school on subagent.failed', () => {
      useFlipperStore
        .getState()
        .processEvent(makeEvent('subagent.started', { agentId: 'sa1', agentName: 'task' }))
      useFlipperStore
        .getState()
        .processEvent(makeEvent('subagent.failed', { agentId: 'sa1' }))
      expect(useFlipperStore.getState().activeSubAgents).toHaveLength(0)
    })

    it('tracks multiple concurrent fish schools', () => {
      useFlipperStore
        .getState()
        .processEvent(makeEvent('subagent.started', { agentId: 'sa1', agentName: 'explore' }))
      useFlipperStore
        .getState()
        .processEvent(makeEvent('subagent.started', { agentId: 'sa2', agentName: 'task' }))
      expect(useFlipperStore.getState().activeSubAgents).toHaveLength(2)
      expect(useFlipperStore.getState().subAgentCount).toBe(2)

      useFlipperStore
        .getState()
        .processEvent(makeEvent('subagent.completed', { agentId: 'sa1' }))
      expect(useFlipperStore.getState().activeSubAgents).toHaveLength(1)
      expect(useFlipperStore.getState().activeSubAgents[0].id).toBe('sa2')
    })
  })
})
