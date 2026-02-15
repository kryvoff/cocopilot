import React, { useMemo, useRef, useEffect } from 'react'
import { useMonitoringStore } from '../../store/monitoring-store'
import { useAppStore } from '../../store/app-store'
import type { ParsedEvent } from '@shared/events'

function formatDuration(startTime: string): string {
  const ms = Date.now() - new Date(startTime).getTime()
  if (ms < 0) return '0s'
  const totalSeconds = Math.floor(ms / 1000)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  if (m === 0) return `${s}s`
  return `${m}m${s.toString().padStart(2, '0')}s`
}

function formatTimestamp(ts: string): string {
  const d = new Date(ts)
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const EVENT_ICONS: Record<string, string> = {
  'session.start': '🚀',
  'session.shutdown': '👋',
  'user.message': '💬',
  'assistant.turn_start': '🤔',
  'assistant.turn_end': '✅',
  'assistant.message': '🤖',
  'tool.execution_start': '⚙️',
  'tool.execution_complete': '✓',
  'subagent.started': '🐒',
  'subagent.completed': '🐒'
}

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

function getEventIcon(event: ParsedEvent): string {
  const toolName = event.data?.toolName as string | undefined
  if (
    toolName &&
    (event.type === 'tool.execution_start' || event.type === 'tool.execution_complete')
  ) {
    return TOOL_ICONS[toolName] ?? '⚙️'
  }
  return EVENT_ICONS[event.type] ?? '•'
}

function getEventLabel(event: ParsedEvent): string {
  if (event.type === 'tool.execution_start' || event.type === 'tool.execution_complete') {
    const toolName = event.data?.toolName as string | undefined
    if (toolName) return toolName
  }
  if (event.type === 'subagent.started' || event.type === 'subagent.completed') {
    const name = (event.data?.agentDisplayName ?? event.data?.agentName) as string | undefined
    if (name) return name
  }
  return event.type
}

function getEventDetail(event: ParsedEvent, allEvents: ParsedEvent[]): string | null {
  if (event.type === 'tool.execution_complete') {
    const toolCallId = event.data?.toolCallId as string | undefined
    const success = event.data?.success !== false
    let duration = ''
    if (toolCallId) {
      const start = allEvents.find(
        (e) => e.type === 'tool.execution_start' && e.data?.toolCallId === toolCallId
      )
      if (start) {
        const ms = new Date(event.timestamp).getTime() - new Date(start.timestamp).getTime()
        duration = ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`
      }
    }
    const indicator = success ? '✓' : '✗'
    return duration ? `${duration} ${indicator}` : indicator
  }
  return null
}

const styles = {
  panel: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    bottom: 0,
    width: 200,
    pointerEvents: 'auto' as const,
    background: 'rgba(0, 0, 0, 0.5)',
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
    padding: '10px 12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    flexShrink: 0
  },
  title: {
    fontSize: 13,
    fontWeight: 600,
    color: '#ffffff',
    marginBottom: 4
  },
  headerDetail: {
    color: '#a0a0a0',
    fontSize: 10
  },
  eventList: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '4px 0'
  },
  eventEntry: {
    padding: '4px 12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
  },
  eventTimestamp: {
    color: '#707070',
    fontSize: 10
  },
  eventLabel: {
    color: '#4ecca3',
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const
  },
  eventDetail: {
    color: '#a0a0a0',
    fontSize: 10
  },
  noSession: {
    color: '#a0a0a0',
    fontStyle: 'italic' as const,
    padding: '10px 12px'
  }
}

function HudOverlay(): React.JSX.Element | null {
  const hudVisible = useAppStore((s) => s.hudVisible)
  const { sessions, selectedSessionId, events } = useMonitoringStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  const session = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId) ?? null,
    [sessions, selectedSessionId]
  )

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
      <div style={styles.header}>
        <div style={styles.title}>🏝️ Session</div>
        {session ? (
          <div style={styles.headerDetail}>
            {STATUS_ICONS[session.status] ?? '❓'} {session.status} · {session.eventCount} events
            {' · '}
            {formatDuration(session.startTime)}
          </div>
        ) : (
          <div style={styles.noSession}>No active session</div>
        )}
      </div>

      <div ref={scrollRef} style={styles.eventList}>
        {events.map((event) => {
          const icon = getEventIcon(event)
          const label = getEventLabel(event)
          const detail = getEventDetail(event, events)
          return (
            <div key={event.id} style={styles.eventEntry}>
              <div style={styles.eventTimestamp}>{formatTimestamp(event.timestamp)}</div>
              <div style={styles.eventLabel}>
                {icon} {label}
              </div>
              {detail && <div style={styles.eventDetail}>{detail}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default HudOverlay
