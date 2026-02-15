import { describe, it, expect } from 'vitest'

/**
 * The EVENT_CATALOG is defined inline in EventCatalogTab.tsx (a React component).
 * We replicate the data structure here for pure unit testing without React deps.
 * If the catalog is ever extracted to a separate module, this test should import it directly.
 */

interface CatalogEntry {
  type: string
  category: string
  icon: string
  description: string
  dataFields: string[]
  example: Record<string, unknown>
}

// Mirror of the EVENT_CATALOG from EventCatalogTab.tsx
const EVENT_CATALOG: CatalogEntry[] = [
  {
    type: 'session.start',
    category: 'Session',
    icon: '🚀',
    description: 'Fired when a new Copilot CLI session begins. Contains session ID, copilot version, and workspace context.',
    dataFields: ['sessionId', 'copilotVersion', 'startTime', 'context'],
    example: { sessionId: 'abc-123', copilotVersion: '1.0.0', context: { cwd: '/project', branch: 'main' } }
  },
  {
    type: 'session.resume',
    category: 'Session',
    icon: '🔄',
    description: 'Session is resumed from a previous state.',
    dataFields: ['resumeTime', 'eventCount', 'context'],
    example: { resumeTime: 1700000000, eventCount: 42 }
  },
  {
    type: 'session.shutdown',
    category: 'Session',
    icon: '👋',
    description: 'Session ends. Contains total usage, cost data, and code change summary.',
    dataFields: ['totalPremiumRequests', 'totalApiDurationMs', 'codeChanges', 'modelMetrics'],
    example: { totalPremiumRequests: 15, totalApiDurationMs: 7700, codeChanges: { linesAdded: 6, filesModified: ['src/app.ts'] } }
  },
  {
    type: 'session.error',
    category: 'Session',
    icon: '❌',
    description: 'An error occurred during the session (e.g., API failure, rate limit).',
    dataFields: ['errorType', 'message', 'statusCode'],
    example: { errorType: 'rate_limit', message: 'Too many requests', statusCode: 429 }
  },
  {
    type: 'session.idle',
    category: 'Session',
    icon: '💤',
    description: 'Session enters idle state when no activity is happening.',
    dataFields: [],
    example: {}
  },
  {
    type: 'session.model_change',
    category: 'Session',
    icon: '🔀',
    description: 'The LLM model was switched during the session.',
    dataFields: ['previousModel', 'newModel'],
    example: { previousModel: 'claude-sonnet-4', newModel: 'gpt-4.1' }
  },
  {
    type: 'user.message',
    category: 'User',
    icon: '💬',
    description: 'User sends a prompt to the copilot agent. Includes the message content and agent mode.',
    dataFields: ['content', 'agentMode', 'attachments'],
    example: { content: 'Fix the auth bug', agentMode: 'interactive' }
  },
  {
    type: 'assistant.turn_start',
    category: 'Assistant',
    icon: '🤔',
    description: 'Agent begins processing the user request. A turn may include multiple tool calls.',
    dataFields: ['turnId'],
    example: { turnId: 'turn-1' }
  },
  {
    type: 'assistant.message',
    category: 'Assistant',
    icon: '🤖',
    description: 'Agent generates a text response to the user.',
    dataFields: ['content'],
    example: { content: 'I will fix the auth module...' }
  },
  {
    type: 'assistant.turn_end',
    category: 'Assistant',
    icon: '✅',
    description: 'Agent completes its current turn. The user can now send another message.',
    dataFields: ['turnId'],
    example: { turnId: 'turn-1' }
  },
  {
    type: 'assistant.usage',
    category: 'Assistant',
    icon: '📊',
    description: 'Token usage for a single API request. Tracks input/output tokens, model, and cost.',
    dataFields: ['inputTokens', 'outputTokens', 'model', 'cost', 'cacheReadTokens'],
    example: { inputTokens: 1500, outputTokens: 500, model: 'claude-sonnet-4', cost: 0.035 }
  },
  {
    type: 'assistant.intent',
    category: 'Assistant',
    icon: '🎯',
    description: 'Agent declares its intent — a short description of what it plans to do.',
    dataFields: ['intent'],
    example: { intent: 'Fixing authentication logic' }
  },
  {
    type: 'tool.execution_start',
    category: 'Tool',
    icon: '⚙️',
    description: 'Agent starts executing a tool (edit, bash, grep, view, glob, etc.).',
    dataFields: ['toolCallId', 'toolName', 'arguments'],
    example: { toolName: 'edit', toolCallId: 'call_123', arguments: { path: 'src/app.ts' } }
  },
  {
    type: 'tool.execution_complete',
    category: 'Tool',
    icon: '✓',
    description: 'Tool execution finishes. Includes success/failure status and result.',
    dataFields: ['toolCallId', 'toolName', 'success', 'result'],
    example: { toolName: 'edit', toolCallId: 'call_123', success: true, result: 'File edited successfully' }
  },
  {
    type: 'tool.user_requested',
    category: 'Tool',
    icon: '🙋',
    description: 'User explicitly requested a tool execution.',
    dataFields: ['toolCallId', 'toolName'],
    example: { toolName: 'bash', toolCallId: 'call_456' }
  },
  {
    type: 'subagent.started',
    category: 'SubAgent',
    icon: '🐒',
    description: 'A sub-agent is dispatched for a parallel task (explore, task, general-purpose).',
    dataFields: ['agentName', 'agentDisplayName', 'agentDescription'],
    example: { agentName: 'explore', agentDisplayName: 'Explorer Agent' }
  },
  {
    type: 'subagent.completed',
    category: 'SubAgent',
    icon: '🎉',
    description: 'A sub-agent successfully completes its assigned task.',
    dataFields: ['agentName'],
    example: { agentName: 'task' }
  },
  {
    type: 'subagent.failed',
    category: 'SubAgent',
    icon: '💥',
    description: 'A sub-agent failed to complete its task.',
    dataFields: ['agentName'],
    example: { agentName: 'task' }
  }
]

const VALID_CATEGORIES = ['Session', 'User', 'Assistant', 'Tool', 'SubAgent']

// The major event types that must be documented
const REQUIRED_EVENT_TYPES = [
  'session.start',
  'session.shutdown',
  'user.message',
  'assistant.turn_start',
  'assistant.turn_end',
  'tool.execution_start',
  'tool.execution_complete',
  'subagent.started',
  'subagent.completed'
]

describe('Learn Mode event catalog', () => {
  describe('completeness', () => {
    it('contains all major event types', () => {
      const catalogTypes = EVENT_CATALOG.map((e) => e.type)
      for (const requiredType of REQUIRED_EVENT_TYPES) {
        expect(catalogTypes).toContain(requiredType)
      }
    })

    it('has at least 15 documented event types', () => {
      expect(EVENT_CATALOG.length).toBeGreaterThanOrEqual(15)
    })
  })

  describe('required fields', () => {
    it.each(EVENT_CATALOG.map((e) => [e.type, e]))(
      '%s has all required fields',
      (_type, entry) => {
        const e = entry as CatalogEntry
        expect(e.type).toBeTruthy()
        expect(typeof e.type).toBe('string')
        expect(e.category).toBeTruthy()
        expect(typeof e.category).toBe('string')
        expect(e.icon).toBeTruthy()
        expect(typeof e.icon).toBe('string')
        expect(e.description).toBeTruthy()
        expect(typeof e.description).toBe('string')
        expect(Array.isArray(e.dataFields)).toBe(true)
        expect(typeof e.example).toBe('object')
      }
    )
  })

  describe('categories', () => {
    it('all entries have valid categories', () => {
      for (const entry of EVENT_CATALOG) {
        expect(VALID_CATEGORIES).toContain(entry.category)
      }
    })

    it('every valid category has at least one entry', () => {
      for (const cat of VALID_CATEGORIES) {
        const entries = EVENT_CATALOG.filter((e) => e.category === cat)
        expect(entries.length).toBeGreaterThan(0)
      }
    })
  })

  describe('no duplicates', () => {
    it('has no duplicate event types', () => {
      const types = EVENT_CATALOG.map((e) => e.type)
      const uniqueTypes = new Set(types)
      expect(uniqueTypes.size).toBe(types.length)
    })
  })

  describe('descriptions', () => {
    it('all descriptions are non-empty strings with reasonable length', () => {
      for (const entry of EVENT_CATALOG) {
        expect(entry.description.length).toBeGreaterThan(10)
        expect(entry.description.length).toBeLessThan(500)
      }
    })
  })

  describe('icons', () => {
    it('all icons are single emoji characters', () => {
      for (const entry of EVENT_CATALOG) {
        // Emojis are 1-2 characters in JS string length
        expect(entry.icon.length).toBeGreaterThan(0)
        expect(entry.icon.length).toBeLessThanOrEqual(4)
      }
    })
  })
})
