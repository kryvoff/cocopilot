import React, { useState, useRef, useCallback, useEffect } from 'react'
import { SessionPlayback } from '../../debug/session-playback'
import { useMonitoringStore } from '../../store/monitoring-store'
import type { ParsedEvent } from '@shared/events'
import syntheticSession from '../../../../test/fixtures/events/synthetic-session.jsonl?raw'

const SPEED_OPTIONS = [1, 2, 5, 10]

const EVENT_ANNOTATIONS: Record<string, string> = {
  'session.start': 'A new Copilot CLI session begins. The agent initializes and records workspace context.',
  'user.message': 'The user types a prompt. The agent receives it and prepares to respond.',
  'assistant.turn_start': 'The agent starts a new turn — it will think, use tools, and compose a response.',
  'tool.execution_start': 'The agent calls a tool to interact with the codebase (read, write, or run commands).',
  'tool.execution_complete': 'The tool finishes. The agent reads the result and decides what to do next.',
  'assistant.message': 'The agent sends a text response explaining what it did.',
  'assistant.turn_end': 'The agent\'s turn is complete. It waits for the next user message.',
  'assistant.usage': 'Token usage is recorded — how many tokens were consumed for this API call.',
  'subagent.started': 'A sub-agent is spawned to handle a sub-task in parallel.',
  'subagent.completed': 'The sub-agent finishes its work and reports back.',
  'session.shutdown': 'The session ends. Total usage, costs, and code changes are summarized.'
}

function getAnnotation(type: string): string {
  return EVENT_ANNOTATIONS[type] ?? `Event: ${type}`
}

function formatTime(timestamp: string): string {
  const d = new Date(timestamp)
  return d.toISOString().substring(11, 19)
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    overflow: 'hidden'
  } as React.CSSProperties,
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    borderBottom: '1px solid #2a2a4a',
    background: '#16213e',
    flexShrink: 0
  } as React.CSSProperties,
  button: {
    background: '#4ecca3',
    color: '#1a1a2e',
    border: 'none',
    borderRadius: 6,
    padding: '6px 16px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer'
  } as React.CSSProperties,
  buttonSecondary: {
    background: 'transparent',
    color: '#a0a0a0',
    border: '1px solid #2a2a4a',
    borderRadius: 6,
    padding: '6px 14px',
    fontSize: 13,
    cursor: 'pointer'
  } as React.CSSProperties,
  speedGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8
  } as React.CSSProperties,
  speedButton: {
    background: 'transparent',
    border: '1px solid #2a2a4a',
    borderRadius: 4,
    padding: '3px 8px',
    fontSize: 11,
    cursor: 'pointer',
    color: '#a0a0a0'
  } as React.CSSProperties,
  speedButtonActive: {
    background: '#4ecca3',
    borderColor: '#4ecca3',
    color: '#1a1a2e'
  } as React.CSSProperties,
  progress: {
    fontSize: 12,
    color: '#a0a0a0',
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    marginLeft: 'auto'
  } as React.CSSProperties,
  body: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden'
  } as React.CSSProperties,
  timeline: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '8px 0'
  } as React.CSSProperties,
  annotationPanel: {
    width: 320,
    minWidth: 320,
    borderLeft: '1px solid #2a2a4a',
    padding: '20px 16px',
    overflowY: 'auto' as const,
    background: '#16213e'
  } as React.CSSProperties,
  annotationTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#e0e0e0',
    marginBottom: 8
  } as React.CSSProperties,
  annotationType: {
    fontSize: 13,
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    color: '#4ecca3',
    marginBottom: 12
  } as React.CSSProperties,
  annotationText: {
    fontSize: 13,
    lineHeight: 1.6,
    color: '#a0a0a0',
    marginBottom: 16
  } as React.CSSProperties,
  annotationData: {
    background: '#0f0f1a',
    border: '1px solid #2a2a4a',
    borderRadius: 6,
    padding: '10px 14px',
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    fontSize: 11,
    color: '#a0a0a0',
    whiteSpace: 'pre-wrap' as const,
    lineHeight: 1.5,
    maxHeight: 300,
    overflowY: 'auto' as const
  } as React.CSSProperties,
  eventRow: {
    display: 'flex',
    gap: 12,
    padding: '6px 16px',
    fontSize: 13,
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    borderLeft: '3px solid transparent',
    transition: 'background 0.15s'
  } as React.CSSProperties,
  eventRowHighlighted: {
    background: '#16213e',
    borderLeftColor: '#4ecca3'
  } as React.CSSProperties,
  eventTime: {
    color: '#a0a0a0',
    minWidth: 72
  } as React.CSSProperties,
  eventType: {
    color: '#4ecca3'
  } as React.CSSProperties,
  eventDetail: {
    color: '#666',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    flex: 1
  } as React.CSSProperties,
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#a0a0a0',
    gap: 12
  } as React.CSSProperties,
  emptyIcon: {
    fontSize: 40
  } as React.CSSProperties,
  progressBar: {
    flex: 1,
    maxWidth: 200,
    height: 4,
    background: '#2a2a4a',
    borderRadius: 2,
    overflow: 'hidden',
    marginLeft: 8
  } as React.CSSProperties,
  progressFill: {
    height: '100%',
    background: '#4ecca3',
    borderRadius: 2,
    transition: 'width 0.2s'
  } as React.CSSProperties
}

function getEventSummary(event: ParsedEvent): string {
  const d = event.data
  if (event.type === 'user.message') return String(d.content ?? '').substring(0, 60)
  if (event.type === 'tool.execution_start') return `${d.toolName ?? 'tool'}`
  if (event.type === 'tool.execution_complete') return d.success ? '✓ success' : '✗ failed'
  if (event.type === 'assistant.message') return String(d.content ?? '').substring(0, 60)
  if (event.type === 'subagent.started') return String(d.agentName ?? '')
  if (event.type === 'assistant.usage') return `${d.model ?? ''} ${d.inputTokens ?? 0}+${d.outputTokens ?? 0} tokens`
  return ''
}

function PlaybackTab(): React.JSX.Element {
  const [speed, setSpeed] = useState(5)
  const [running, setRunning] = useState(false)
  const [highlightedIdx, setHighlightedIdx] = useState<number | null>(null)
  const [latestEvent, setLatestEvent] = useState<ParsedEvent | null>(null)
  const playbackRef = useRef<SessionPlayback | null>(null)
  const timelineEndRef = useRef<HTMLDivElement>(null)

  const events = useMonitoringStore((s) => s.events)
  const playbackReset = useMonitoringStore((s) => s.playbackReset)

  // Auto-scroll to bottom on new events
  useEffect(() => {
    timelineEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [events.length])

  const handleStart = useCallback(() => {
    if (playbackRef.current?.isRunning()) {
      playbackRef.current.stop()
      setRunning(false)
      return
    }

    playbackReset()
    setHighlightedIdx(null)
    setLatestEvent(null)

    const pb = new SessionPlayback({
      speedMultiplier: speed,
      onEvent: (event) => {
        setLatestEvent(event)
        setHighlightedIdx((prev) => (prev ?? -1) + 1)
      },
      onComplete: () => {
        setRunning(false)
      }
    })
    pb.load(syntheticSession)
    pb.start()
    playbackRef.current = pb
    setRunning(true)
  }, [speed, playbackReset])

  const handleStop = useCallback(() => {
    playbackRef.current?.stop()
    setRunning(false)
  }, [])

  const handleReset = useCallback(() => {
    playbackRef.current?.stop()
    playbackRef.current = null
    setRunning(false)
    setHighlightedIdx(null)
    setLatestEvent(null)
    playbackReset()
  }, [playbackReset])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      playbackRef.current?.stop()
    }
  }, [])

  return (
    <div style={styles.container}>
      {/* Controls */}
      <div style={styles.controls}>
        <button style={styles.button} onClick={handleStart}>
          {running ? '⏸ Pause' : events.length > 0 ? '▶ Resume' : '▶ Play'}
        </button>
        <button style={styles.buttonSecondary} onClick={handleStop} disabled={!running}>
          ⏹ Stop
        </button>
        <button style={styles.buttonSecondary} onClick={handleReset}>
          ↺ Reset
        </button>

        <div style={styles.speedGroup}>
          <span style={{ fontSize: 11, color: '#a0a0a0' }}>Speed:</span>
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              style={{
                ...styles.speedButton,
                ...(speed === s ? styles.speedButtonActive : {})
              }}
              onClick={() => setSpeed(s)}
              disabled={running}
            >
              {s}x
            </button>
          ))}
        </div>

        <div style={styles.progressBar}>
          <div
            style={{
              ...styles.progressFill,
              width: `${events.length > 0 ? Math.min(100, (events.length / 27) * 100) : 0}%`
            }}
          />
        </div>
        <span style={styles.progress}>{events.length} / 27 events</span>
      </div>

      {/* Body */}
      <div style={styles.body}>
        {/* Event timeline */}
        <div style={styles.timeline}>
          {events.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>🎬</div>
              <div>Press Play to replay a synthetic Copilot CLI session</div>
              <div style={{ fontSize: 12, color: '#666' }}>
                Watch how events flow as the agent adds a health check endpoint
              </div>
            </div>
          ) : (
            events.map((event, i) => (
              <div
                key={event.id}
                style={{
                  ...styles.eventRow,
                  ...(highlightedIdx === i ? styles.eventRowHighlighted : {}),
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setHighlightedIdx(i)
                  setLatestEvent(event)
                }}
              >
                <span style={styles.eventTime}>{formatTime(event.timestamp)}</span>
                <span style={styles.eventType}>{event.type}</span>
                <span style={styles.eventDetail}>{getEventSummary(event)}</span>
              </div>
            ))
          )}
          <div ref={timelineEndRef} />
        </div>

        {/* Annotation panel */}
        <div style={styles.annotationPanel}>
          {latestEvent ? (
            <>
              <div style={styles.annotationTitle}>
                {EVENT_ANNOTATIONS[latestEvent.type] ? '📖' : '📄'} Event Explanation
              </div>
              <div style={styles.annotationType}>{latestEvent.type}</div>
              <div style={styles.annotationText}>
                {getAnnotation(latestEvent.type)}
              </div>
              <div style={{ ...styles.annotationTitle, fontSize: 12, marginBottom: 6 }}>
                Event Data
              </div>
              <pre style={styles.annotationData}>
                {JSON.stringify(latestEvent.data, null, 2)}
              </pre>
            </>
          ) : (
            <div style={{ color: '#666', fontSize: 13, textAlign: 'center', paddingTop: 40 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📖</div>
              Play the session or click an event to see its explanation
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PlaybackTab
export { getEventSummary, getAnnotation, formatTime, EVENT_ANNOTATIONS }
