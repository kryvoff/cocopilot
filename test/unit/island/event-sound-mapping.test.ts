import { describe, it, expect } from 'vitest'
import { getSoundForEvent } from '../../../src/renderer/audio/event-sound-map'

describe('getSoundForEvent', () => {
  it('maps session.start to session-start', () => {
    expect(getSoundForEvent({ type: 'session.start' })).toBe('session-start')
  })

  it('maps user.message to user-message', () => {
    expect(getSoundForEvent({ type: 'user.message' })).toBe('user-message')
  })

  it('maps session.shutdown to session-end', () => {
    expect(getSoundForEvent({ type: 'session.shutdown' })).toBe('session-end')
  })

  describe('tool.execution_start', () => {
    it('maps edit tool to tool-edit', () => {
      expect(
        getSoundForEvent({ type: 'tool.execution_start', data: { toolName: 'edit' } })
      ).toBe('tool-edit')
    })

    it('maps create tool to tool-edit', () => {
      expect(
        getSoundForEvent({ type: 'tool.execution_start', data: { toolName: 'create' } })
      ).toBe('tool-edit')
    })

    it('maps bash tool to tool-bash', () => {
      expect(
        getSoundForEvent({ type: 'tool.execution_start', data: { toolName: 'bash' } })
      ).toBe('tool-bash')
    })

    it('returns null for unknown tools', () => {
      expect(
        getSoundForEvent({ type: 'tool.execution_start', data: { toolName: 'grep' } })
      ).toBeNull()
    })

    it('returns null when no toolName provided', () => {
      expect(getSoundForEvent({ type: 'tool.execution_start' })).toBeNull()
    })

    it('returns null when data is empty object', () => {
      expect(getSoundForEvent({ type: 'tool.execution_start', data: {} })).toBeNull()
    })
  })

  describe('tool.execution_complete', () => {
    it('maps success to tool-success', () => {
      expect(
        getSoundForEvent({ type: 'tool.execution_complete', data: { success: true } })
      ).toBe('tool-success')
    })

    it('maps failure to tool-error', () => {
      expect(
        getSoundForEvent({ type: 'tool.execution_complete', data: { success: false } })
      ).toBe('tool-error')
    })

    it('treats missing success as success', () => {
      expect(
        getSoundForEvent({ type: 'tool.execution_complete', data: {} })
      ).toBe('tool-success')
    })
  })

  describe('unknown event types', () => {
    it('returns null for assistant.turn_start', () => {
      expect(getSoundForEvent({ type: 'assistant.turn_start' })).toBeNull()
    })

    it('returns null for subagent.started', () => {
      expect(getSoundForEvent({ type: 'subagent.started' })).toBeNull()
    })

    it('returns null for arbitrary unknown type', () => {
      expect(getSoundForEvent({ type: 'foo.bar.baz' })).toBeNull()
    })
  })
})
