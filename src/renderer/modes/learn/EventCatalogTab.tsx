import React, { useState } from 'react'

interface CatalogEntry {
  type: string
  category: string
  icon: string
  description: string
  dataFields: string[]
  example: Record<string, unknown>
}

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

const CATEGORIES = ['Session', 'User', 'Assistant', 'Tool', 'SubAgent'] as const

const CATEGORY_COLORS: Record<string, string> = {
  Session: '#e94560',
  User: '#4ecca3',
  Assistant: '#6c63ff',
  Tool: '#f0a500',
  SubAgent: '#ff6b9d'
}

const styles = {
  container: {
    display: 'flex',
    height: '100%',
    overflow: 'hidden'
  } as React.CSSProperties,
  sidebar: {
    width: 280,
    minWidth: 280,
    borderRight: '1px solid #2a2a4a',
    overflowY: 'auto' as const,
    padding: '12px 0'
  } as React.CSSProperties,
  categoryHeader: {
    padding: '8px 16px 4px',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    color: '#a0a0a0'
  } as React.CSSProperties,
  eventItem: {
    padding: '8px 16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    borderLeft: '3px solid transparent',
    transition: 'background 0.15s'
  } as React.CSSProperties,
  detail: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '24px 32px'
  } as React.CSSProperties,
  detailEmpty: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#a0a0a0',
    fontSize: 16
  } as React.CSSProperties,
  detailHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16
  } as React.CSSProperties,
  detailIcon: {
    fontSize: 32
  } as React.CSSProperties,
  detailType: {
    fontSize: 20,
    fontWeight: 700,
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    color: '#4ecca3'
  } as React.CSSProperties,
  badge: {
    fontSize: 11,
    padding: '2px 8px',
    borderRadius: 4,
    fontWeight: 600
  } as React.CSSProperties,
  description: {
    fontSize: 14,
    lineHeight: 1.7,
    color: '#a0a0a0',
    marginBottom: 20
  } as React.CSSProperties,
  subheading: {
    fontSize: 13,
    fontWeight: 600,
    color: '#e0e0e0',
    marginBottom: 8,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px'
  } as React.CSSProperties,
  fieldList: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 6,
    marginBottom: 20
  } as React.CSSProperties,
  fieldTag: {
    background: '#16213e',
    border: '1px solid #2a2a4a',
    borderRadius: 4,
    padding: '3px 10px',
    fontSize: 12,
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    color: '#e0e0e0'
  } as React.CSSProperties,
  jsonBlock: {
    background: '#0f0f1a',
    border: '1px solid #2a2a4a',
    borderRadius: 6,
    padding: '14px 18px',
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    fontSize: 12,
    color: '#a0a0a0',
    whiteSpace: 'pre-wrap' as const,
    lineHeight: 1.6,
    overflowX: 'auto' as const
  } as React.CSSProperties
}

function EventCatalogTab(): React.JSX.Element {
  const [selected, setSelected] = useState<string | null>(null)
  const entry = EVENT_CATALOG.find((e) => e.type === selected)

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        {CATEGORIES.map((cat) => {
          const items = EVENT_CATALOG.filter((e) => e.category === cat)
          if (items.length === 0) return null
          return (
            <div key={cat}>
              <div style={{ ...styles.categoryHeader, color: CATEGORY_COLORS[cat] }}>
                {cat} ({items.length})
              </div>
              {items.map((item) => (
                <div
                  key={item.type}
                  onClick={() => setSelected(item.type)}
                  style={{
                    ...styles.eventItem,
                    background: selected === item.type ? '#16213e' : 'transparent',
                    borderLeftColor: selected === item.type ? CATEGORY_COLORS[item.category] : 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (selected !== item.type) e.currentTarget.style.background = '#1a1a2e'
                  }}
                  onMouseLeave={(e) => {
                    if (selected !== item.type) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <span>{item.icon}</span>
                  <span style={{ color: selected === item.type ? '#e0e0e0' : '#a0a0a0' }}>
                    {item.type}
                  </span>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {/* Detail pane */}
      {entry ? (
        <div style={styles.detail}>
          <div style={styles.detailHeader}>
            <span style={styles.detailIcon}>{entry.icon}</span>
            <div>
              <div style={styles.detailType}>{entry.type}</div>
              <span
                style={{
                  ...styles.badge,
                  background: CATEGORY_COLORS[entry.category] + '22',
                  color: CATEGORY_COLORS[entry.category]
                }}
              >
                {entry.category}
              </span>
            </div>
          </div>

          <p style={styles.description}>{entry.description}</p>

          {entry.dataFields.length > 0 && (
            <>
              <div style={styles.subheading}>Data Fields</div>
              <div style={styles.fieldList}>
                {entry.dataFields.map((f) => (
                  <span key={f} style={styles.fieldTag}>{f}</span>
                ))}
              </div>
            </>
          )}

          <div style={styles.subheading}>Example Payload</div>
          <pre style={styles.jsonBlock}>
            {JSON.stringify({ type: entry.type, id: 'evt-001', timestamp: '2026-01-15T10:00:00.000Z', data: entry.example }, null, 2)}
          </pre>
        </div>
      ) : (
        <div style={styles.detailEmpty}>
          ← Select an event type to view details
        </div>
      )}
    </div>
  )
}

export default EventCatalogTab
