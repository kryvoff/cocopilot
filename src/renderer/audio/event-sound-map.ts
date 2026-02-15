/**
 * Pure function mapping Copilot event types to sound IDs.
 * Extracted from use-event-sounds.ts for testability.
 */
export function getSoundForEvent(event: {
  type: string
  data?: Record<string, unknown>
}): string | null {
  switch (event.type) {
    case 'session.start':
      return 'session-start'
    case 'user.message':
      return 'user-message'
    case 'assistant.turn_start':
      return 'user-message'
    case 'assistant.turn_end':
      return 'tool-success'
    case 'tool.execution_start': {
      const toolName = (event.data?.toolName as string) ?? ''
      if (['edit', 'create'].includes(toolName)) return 'tool-edit'
      if (toolName === 'bash') return 'tool-bash'
      return null
    }
    case 'tool.execution_complete': {
      const success = event.data?.success as boolean | undefined
      if (success === false) return 'tool-error'
      return 'tool-success'
    }
    case 'session.shutdown':
      return 'session-end'
    default:
      return null
  }
}
