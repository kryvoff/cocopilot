import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react'
import { useMonitoringStore } from '../../store/monitoring-store'
import { useAppStore } from '../../store/app-store'
import type { ParsedEvent } from '@shared/events'

// --- Helpers ---

const TOOL_ICONS: Record<string, string> = {
  grep: '🔍',
  glob: '🔍',
  edit: '✏️',
  create: '✏️',
  bash: '🔨',
  view: '👁️',
  web_search: '🌐',
  web_fetch: '🌐',
  task: '🐒'
}

const STATUS_ICONS: Record<string, string> = {
  active: '🟢',
  idle: '⚪',
  completed: '⏹️',
  error: '🔴'
}

/** A user-message turn: the user.message event plus all child events until the next user.message */
interface TurnGroup {
  userEvent: ParsedEvent
  children: ParsedEvent[]
  /** Extracted user prompt text (truncated) */
  prompt: string
}

/** Events that appear before the first user.message (session.start, etc.) */
interface PreambleGroup {
  events: ParsedEvent[]
}

// Event types we actually render as children inside a turn
const RENDERED_CHILD_TYPES = new Set([
  'assistant.turn_start',
  'assistant.turn_end',
  'assistant.message',
  'tool.execution_start',
  'tool.execution_complete',
  'subagent.started',
  'subagent.completed',
  'session.shutdown'
])

function groupEventsByTurn(events: ParsedEvent[]): { preamble: PreambleGroup; turns: TurnGroup[] } {
  const preamble: PreambleGroup = { events: [] }
  const turns: TurnGroup[] = []

  for (const event of events) {
    if (event.type === 'user.message') {
      const content = (event.data?.content as string) ?? ''
      const prompt = content.length > 60 ? content.slice(0, 57) + '…' : content
      turns.push({ userEvent: event, children: [], prompt })
    } else if (turns.length === 0) {
      preamble.events.push(event)
    } else {
      const current = turns[turns.length - 1]
      if (RENDERED_CHILD_TYPES.has(event.type)) {
        current.children.push(event)
      }
    }
  }

  return { preamble, turns }
}

function getToolDuration(event: ParsedEvent, allEvents: ParsedEvent[]): string | null {
  if (event.type !== 'tool.execution_complete') return null
  const toolCallId = event.data?.toolCallId as string | undefined
  if (!toolCallId) return null
  const start = allEvents.find(
    (e) => e.type === 'tool.execution_start' && e.data?.toolCallId === toolCallId
  )
  if (!start) return null
  const ms = new Date(event.timestamp).getTime() - new Date(start.timestamp).getTime()
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`
}

function renderChildEvent(event: ParsedEvent, allEvents: ParsedEvent[]): React.JSX.Element | null {
  const toolName = (event.data?.toolName as string) ?? ''
  const toolIcon = TOOL_ICONS[toolName] ?? '⚙️'

  switch (event.type) {
    case 'assistant.turn_start':
      return <span style={childStyles.assistantText}>🤖 Working...</span>
    case 'assistant.turn_end':
      return <span style={childStyles.doneText}>✅ Done</span>
    case 'assistant.message':
      return <span style={childStyles.assistantText}>🤖 Response</span>
    case 'tool.execution_start':
      return (
        <span style={childStyles.toolText}>
          {toolIcon} {toolName || 'tool'}{' '}
          <span style={childStyles.statusRunning}>→ running…</span>
        </span>
      )
    case 'tool.execution_complete': {
      // Find matching start to get the tool name
      const callId = event.data?.toolCallId as string | undefined
      let name = toolName
      if (!name && callId) {
        const start = allEvents.find(
          (e) => e.type === 'tool.execution_start' && e.data?.toolCallId === callId
        )
        name = (start?.data?.toolName as string) ?? ''
      }
      const icon = TOOL_ICONS[name] ?? '⚙️'
      const success = event.data?.success !== false
      const dur = getToolDuration(event, allEvents)
      return (
        <span style={childStyles.toolText}>
          {icon} {name || 'tool'} →{' '}
          <span style={success ? childStyles.statusOk : childStyles.statusFail}>
            {success ? '✓' : '✗'}
          </span>
          {dur && <span style={childStyles.duration}> {dur}</span>}
        </span>
      )
    }
    case 'subagent.started': {
      const agentName =
        (event.data?.agentDisplayName as string) ?? (event.data?.agentName as string) ?? 'agent'
      return (
        <span style={childStyles.subagentText}>
          🐒 {agentName} <span style={childStyles.statusRunning}>→ running…</span>
        </span>
      )
    }
    case 'subagent.completed':
      return (
        <span style={childStyles.subagentText}>
          🐒 agent → <span style={childStyles.statusOk}>✓</span>
        </span>
      )
    case 'session.shutdown':
      return <span style={childStyles.sessionText}>👋 Session ended</span>
    default:
      return null
  }
}

// Deduplicate: when we see tool.execution_complete, skip the matching tool.execution_start
function deduplicateChildren(children: ParsedEvent[]): ParsedEvent[] {
  const completedCallIds = new Set<string>()
  for (const e of children) {
    if (e.type === 'tool.execution_complete') {
      const id = e.data?.toolCallId as string | undefined
      if (id) completedCallIds.add(id)
    }
  }
  return children.filter((e) => {
    if (e.type === 'tool.execution_start') {
      const id = e.data?.toolCallId as string | undefined
      if (id && completedCallIds.has(id)) return false
    }
    return true
  })
}

// --- Styles ---

const BORDER_COLORS = {
  user: '#4ecca3',
  assistant: '#5b9bd5',
  tool: '#e8a838',
  subagent: '#c07ef0'
}

const styles = {
  panel: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    bottom: 0,
    width: 220,
    pointerEvents: 'auto' as const,
    background: 'rgba(0, 0, 0, 0.55)',
    backdropFilter: 'blur(8px)',
    borderRight: '1px solid rgba(255, 255, 255, 0.1)',
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    fontSize: 11,
    color: '#e0e0e0',
    lineHeight: 1.4,
    display: 'flex' as const,
    flexDirection: 'column' as const,
    overflow: 'hidden' as const
  },
  header: {
    padding: '8px 10px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    flexShrink: 0,
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 6,
    fontSize: 11
  },
  headerStatus: {
    color: '#a0a0a0',
    fontSize: 10
  },
  eventList: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '2px 0'
  },
  noSession: {
    color: '#a0a0a0',
    fontStyle: 'italic' as const,
    padding: '10px 10px'
  },
  preambleEvent: {
    padding: '2px 10px',
    color: '#707070',
    fontSize: 10
  },
  // Turn group
  turnGroup: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
  },
  turnHeader: {
    padding: '5px 10px',
    cursor: 'pointer' as const,
    display: 'flex' as const,
    alignItems: 'flex-start' as const,
    gap: 4,
    borderLeft: `2px solid ${BORDER_COLORS.user}`,
    userSelect: 'none' as const
  },
  turnToggle: {
    color: '#707070',
    fontSize: 9,
    flexShrink: 0,
    marginTop: 2,
    width: 10
  },
  turnPrompt: {
    color: '#ffffff',
    fontWeight: 600,
    fontSize: 11,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    display: '-webkit-box' as const,
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    lineHeight: 1.3
  },
  childrenContainer: {
    paddingLeft: 10,
    borderLeft: `2px solid ${BORDER_COLORS.assistant}`
  },
  childRow: {
    padding: '1px 10px 1px 6px',
    fontSize: 10,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const
  }
}

const childStyles = {
  assistantText: { color: '#7eadd8' },
  doneText: { color: '#4ecca3' },
  toolText: { color: '#b0b0b0' },
  subagentText: { color: '#c8a0e8' },
  sessionText: { color: '#707070' },
  statusRunning: { color: '#e8a838' },
  statusOk: { color: '#4ecca3' },
  statusFail: { color: '#e85050' },
  duration: { color: '#707070' }
}

// --- Components ---

function TurnSection({
  turn,
  allEvents,
  defaultExpanded
}: {
  turn: TurnGroup
  allEvents: ParsedEvent[]
  defaultExpanded: boolean
}): React.JSX.Element {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const toggle = useCallback(() => setExpanded((v) => !v), [])
  const dedupedChildren = useMemo(() => deduplicateChildren(turn.children), [turn.children])

  return (
    <div style={styles.turnGroup}>
      <div style={styles.turnHeader} onClick={toggle}>
        <span style={styles.turnToggle}>{expanded ? '▼' : '▶'}</span>
        <span style={styles.turnPrompt}>💬 {turn.prompt || 'User message'}</span>
      </div>
      {expanded && dedupedChildren.length > 0 && (
        <div style={styles.childrenContainer}>
          {dedupedChildren.map((child) => {
            const rendered = renderChildEvent(child, allEvents)
            if (!rendered) return null
            return (
              <div key={child.id} style={styles.childRow}>
                {rendered}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function HudOverlay(): React.JSX.Element | null {
  const hudVisible = useAppStore((s) => s.hudVisible)
  const mode = useAppStore((s) => s.mode)
  const modeEmoji = mode === 'ocean' ? '🌊' : '🏝️'
  const { sessions, selectedSessionId, events } = useMonitoringStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  const session = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId) ?? null,
    [sessions, selectedSessionId]
  )

  const { preamble, turns } = useMemo(() => groupEventsByTurn(events), [events])

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    const el = scrollRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [events])

  if (!hudVisible) return null

  return (
    <div style={styles.panel}>
      {/* Simplified session header */}
      <div style={styles.header}>
        <span>{modeEmoji}</span>
        {session ? (
          <span style={styles.headerStatus}>
            {STATUS_ICONS[session.status] ?? '❓'} {session.status} · {session.eventCount} events
          </span>
        ) : (
          <span style={styles.noSession}>No active session</span>
        )}
      </div>

      <div ref={scrollRef} style={styles.eventList}>
        {/* Preamble: session.start etc. before first user message */}
        {preamble.events.map((event) => (
          <div key={event.id} style={styles.preambleEvent}>
            {event.type === 'session.start' ? '🚀 Session started' : event.type}
          </div>
        ))}

        {/* Turn groups */}
        {turns.map((turn, i) => (
          <TurnSection
            key={turn.userEvent.id}
            turn={turn}
            allEvents={events}
            defaultExpanded={i >= turns.length - 2}
          />
        ))}
      </div>
    </div>
  )
}

export default HudOverlay
