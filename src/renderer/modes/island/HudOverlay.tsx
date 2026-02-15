import React, { useMemo } from 'react'
import { useMonitoringStore } from '../../store/monitoring-store'
import { useAppStore } from '../../store/app-store'

function formatDuration(startTime: string): string {
  const ms = Date.now() - new Date(startTime).getTime()
  if (ms < 0) return '0s'
  const totalSeconds = Math.floor(ms / 1000)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  if (m === 0) return `${s}s`
  return `${m}m${s.toString().padStart(2, '0')}s`
}

function formatEventLabel(event: { type: string; data: Record<string, unknown> }): string {
  const shortType = event.type.split('.').pop() ?? event.type
  if (event.type === 'tool.execution_start' || event.type === 'tool.execution_complete') {
    const toolName = event.data?.toolName as string | undefined
    if (toolName) return toolName
  }
  if (event.type === 'subagent.started') {
    const name = (event.data?.agentDisplayName ?? event.data?.agentName) as string | undefined
    if (name) return name
  }
  return shortType
}

function formatEventTiming(
  event: { type: string; timestamp: string; data: Record<string, unknown> },
  allEvents: { type: string; timestamp: string; data: Record<string, unknown>; id: string }[]
): string {
  if (event.type === 'tool.execution_complete') {
    const toolCallId = event.data?.toolCallId as string | undefined
    if (toolCallId) {
      const start = allEvents.find(
        (e) => e.type === 'tool.execution_start' && e.data?.toolCallId === toolCallId
      )
      if (start) {
        const ms = new Date(event.timestamp).getTime() - new Date(start.timestamp).getTime()
        return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`
      }
    }
    return event.data?.success === false ? 'err' : 'done'
  }
  // For start events, show elapsed since event
  const elapsed = Date.now() - new Date(event.timestamp).getTime()
  if (elapsed < 2000) return 'now'
  if (elapsed < 60000) return `${Math.floor(elapsed / 1000)}s ago`
  return `${Math.floor(elapsed / 60000)}m ago`
}

const STATUS_ICONS: Record<string, string> = {
  active: '🟢',
  idle: '⚪',
  completed: '⏹️',
  error: '🔴'
}

const styles = {
  panel: {
    position: 'absolute' as const,
    bottom: 16,
    left: 16,
    pointerEvents: 'auto' as const,
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(8px)',
    borderRadius: 8,
    padding: '12px 16px',
    minWidth: 180,
    maxWidth: 240,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    fontSize: 12,
    color: '#e0e0e0',
    lineHeight: 1.5
  },
  title: {
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 8,
    color: '#ffffff'
  },
  label: {
    color: '#a0a0a0'
  },
  value: {
    color: '#e0e0e0'
  },
  separator: {
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    margin: '8px 0'
  },
  recentHeader: {
    color: '#a0a0a0',
    fontSize: 11,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 4
  },
  eventItem: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    gap: 8,
    fontSize: 11,
    color: '#c0c0c0'
  },
  eventName: {
    color: '#4ecca3',
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const
  },
  eventTiming: {
    color: '#a0a0a0',
    flexShrink: 0
  },
  noSession: {
    color: '#a0a0a0',
    fontStyle: 'italic' as const
  }
}

function HudOverlay(): React.JSX.Element | null {
  const hudVisible = useAppStore((s) => s.hudVisible)
  const { sessions, selectedSessionId, events } = useMonitoringStore()

  const session = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId) ?? null,
    [sessions, selectedSessionId]
  )

  const recentEvents = useMemo(() => events.slice(-5).reverse(), [events])

  if (!hudVisible) return null

  return (
    <div style={styles.panel}>
      <div style={styles.title}>🏝️ Island Mode</div>

      {session ? (
        <>
          <div>
            <span style={styles.label}>Session: </span>
            <span style={styles.value}>
              {STATUS_ICONS[session.status] ?? '❓'} {session.status}
            </span>
          </div>
          <div>
            <span style={styles.label}>Events: </span>
            <span style={styles.value}>{session.eventCount}</span>
          </div>
          <div>
            <span style={styles.label}>Duration: </span>
            <span style={styles.value}>{formatDuration(session.startTime)}</span>
          </div>

          {recentEvents.length > 0 && (
            <>
              <div style={styles.separator} />
              <div style={styles.recentHeader}>Recent</div>
              {recentEvents.map((event) => (
                <div key={event.id} style={styles.eventItem}>
                  <span style={styles.eventName}>• {formatEventLabel(event)}</span>
                  <span style={styles.eventTiming}>
                    {formatEventTiming(event, events)}
                  </span>
                </div>
              ))}
            </>
          )}
        </>
      ) : (
        <div style={styles.noSession}>No active session</div>
      )}
    </div>
  )
}

export default HudOverlay
