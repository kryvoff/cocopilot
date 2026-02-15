import { describe, it, expect } from 'vitest'
import { getEventSummary, getAnnotation, formatTime, EVENT_ANNOTATIONS } from '../../../src/renderer/modes/learn/PlaybackTab'
import type { ParsedEvent } from '../../../src/shared/events'

function makeEvent(type: string, data: Record<string, unknown> = {}): ParsedEvent {
  return {
    type,
    id: 'test-' + Math.random().toString(36).slice(2),
    timestamp: '2025-01-15T10:30:00.000Z',
    parentId: null,
    ephemeral: false,
    data,
    knownType: true
  }
}

describe('PlaybackTab helpers', () => {
  describe('getEventSummary', () => {
    it('returns user message content truncated to 60 chars', () => {
      const event = makeEvent('user.message', { content: 'Add a health check endpoint' })
      expect(getEventSummary(event)).toBe('Add a health check endpoint')
    })

    it('returns tool name for tool.execution_start', () => {
      const event = makeEvent('tool.execution_start', { toolName: 'bash' })
      expect(getEventSummary(event)).toBe('bash')
    })

    it('returns success/failure for tool.execution_complete', () => {
      expect(getEventSummary(makeEvent('tool.execution_complete', { success: true }))).toBe('✓ success')
      expect(getEventSummary(makeEvent('tool.execution_complete', { success: false }))).toBe('✗ failed')
    })

    it('returns agent name for subagent.started', () => {
      const event = makeEvent('subagent.started', { agentName: 'explore' })
      expect(getEventSummary(event)).toBe('explore')
    })

    it('returns token info for assistant.usage', () => {
      const event = makeEvent('assistant.usage', { model: 'gpt-4', inputTokens: 100, outputTokens: 50 })
      expect(getEventSummary(event)).toBe('gpt-4 100+50 tokens')
    })

    it('returns empty string for unknown event types', () => {
      expect(getEventSummary(makeEvent('session.start'))).toBe('')
    })
  })

  describe('getAnnotation', () => {
    it('returns annotation for known event types', () => {
      expect(getAnnotation('session.start')).toContain('session begins')
      expect(getAnnotation('user.message')).toContain('prompt')
      expect(getAnnotation('session.shutdown')).toContain('ends')
    })

    it('returns fallback for unknown event types', () => {
      expect(getAnnotation('custom.unknown')).toBe('Event: custom.unknown')
    })
  })

  describe('formatTime', () => {
    it('formats ISO timestamp to HH:MM:SS', () => {
      expect(formatTime('2025-01-15T10:30:45.123Z')).toBe('10:30:45')
    })

    it('handles midnight', () => {
      expect(formatTime('2025-01-15T00:00:00.000Z')).toBe('00:00:00')
    })
  })

  describe('EVENT_ANNOTATIONS', () => {
    it('covers core event types', () => {
      const expected = [
        'session.start', 'user.message', 'assistant.turn_start',
        'tool.execution_start', 'tool.execution_complete',
        'assistant.message', 'assistant.turn_end', 'session.shutdown'
      ]
      for (const type of expected) {
        expect(EVENT_ANNOTATIONS[type]).toBeDefined()
      }
    })
  })
})
