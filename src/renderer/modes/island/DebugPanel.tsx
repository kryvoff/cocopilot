import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useCocoStore } from './coco-state'
import { useMonitoringStore } from '../../store/monitoring-store'
import { AudioManager } from '../../audio/audio-manager'

const styles = {
  panel: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    background: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(6px)',
    borderRadius: 6,
    padding: '10px 14px',
    minWidth: 220,
    maxWidth: 280,
    border: '1px solid rgba(255, 255, 255, 0.15)',
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    fontSize: 11,
    color: '#c0c0c0',
    lineHeight: 1.6,
    zIndex: 100,
    pointerEvents: 'auto' as const
  },
  title: {
    fontSize: 12,
    fontWeight: 700,
    color: '#ff9800',
    marginBottom: 6
  },
  section: {
    marginBottom: 6
  },
  label: {
    color: '#888'
  },
  value: {
    color: '#e0e0e0'
  },
  separator: {
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    margin: '6px 0'
  },
  eventItem: {
    fontSize: 10,
    color: '#aaa',
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const
  },
  hint: {
    fontSize: 10,
    color: '#666',
    marginTop: 4
  },
  copyButton: {
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#c0c0c0',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    padding: '3px 8px',
    fontSize: 10,
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    cursor: 'pointer',
    marginTop: 4,
    width: '100%'
  }
}

function DebugPanel(): React.JSX.Element | null {
  const [visible, setVisible] = useState(false)
  const [fps, setFps] = useState(0)
  const frameTimesRef = useRef<number[]>([])
  const rafRef = useRef<number>(0)

  const cocoState = useCocoStore((s) => s.state)
  const toolActive = useCocoStore((s) => s.toolActive)
  const subAgentCount = useCocoStore((s) => s.subAgentCount)
  const events = useMonitoringStore((s) => s.events)

  // Toggle with 'D' key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === 'd' || e.key === 'D') {
        // Ignore if typing in an input
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
        setVisible((v) => !v)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  // FPS counter via requestAnimationFrame
  const measureFps = useCallback(() => {
    const now = performance.now()
    const times = frameTimesRef.current
    times.push(now)
    // Keep last 60 frame times
    while (times.length > 60) times.shift()
    if (times.length >= 2) {
      const elapsed = now - times[0]
      setFps(Math.round(((times.length - 1) / elapsed) * 1000))
    }
    rafRef.current = requestAnimationFrame(measureFps)
  }, [])

  useEffect(() => {
    if (visible) {
      rafRef.current = requestAnimationFrame(measureFps)
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [visible, measureFps])

  // Audio status
  const audio = AudioManager.getInstance()
  const audioEnabled = audio.isEnabled()
  const audioVolume = audio.getVolume()
  const audioState = audio.getState()

  // Last 10 events
  const recentEvents = events.slice(-10).reverse()

  const handleCopyDebugState = useCallback(() => {
    const debugState = (window as unknown as Record<string, unknown>).__cocopilot_debug
    if (debugState) {
      navigator.clipboard.writeText(JSON.stringify(debugState, null, 2))
    }
  }, [])

  if (!visible) return null

  return (
    <div style={styles.panel} data-testid="island-debug-panel">
      <div style={styles.title}>🐛 Debug Panel</div>

      <div style={styles.section}>
        <span style={styles.label}>FPS: </span>
        <span style={styles.value}>{fps}</span>
      </div>

      <div style={styles.separator} />

      <div style={styles.section}>
        <span style={styles.label}>Coco: </span>
        <span style={styles.value}>{cocoState}</span>
        {toolActive && (
          <>
            {' '}
            <span style={styles.label}>tool: </span>
            <span style={styles.value}>{toolActive}</span>
          </>
        )}
      </div>

      <div style={styles.section}>
        <span style={styles.label}>Sub-agents: </span>
        <span style={styles.value}>{subAgentCount}</span>
      </div>

      <div style={styles.separator} />

      <div style={styles.section}>
        <span style={styles.label}>Audio: </span>
        <span style={styles.value}>{audioEnabled ? 'on' : 'off'}</span>
        <span style={styles.label}> vol: </span>
        <span style={styles.value}>{Math.round(audioVolume * 100)}%</span>
      </div>
      <div style={styles.section}>
        <span style={styles.label}>Sounds: </span>
        <span style={styles.value}>
          {audioState.soundCount} loaded{audioState.initialized ? '' : ' (not init)'}
        </span>
        {audioState.ambientPlaying && (
          <span style={styles.value}> 🎵</span>
        )}
      </div>

      <div style={styles.separator} />

      <div style={styles.section}>
        <span style={styles.label}>Events ({events.length}): last 10</span>
        {recentEvents.map((evt) => (
          <div key={evt.id} style={styles.eventItem}>
            {new Date(evt.timestamp).toLocaleTimeString()} {evt.type}
          </div>
        ))}
        {recentEvents.length === 0 && (
          <div style={styles.eventItem}>No events</div>
        )}
      </div>

      <button
        style={styles.copyButton}
        onClick={handleCopyDebugState}
        data-testid="copy-debug-state"
      >
        📋 Copy Debug State
      </button>

      <div style={styles.hint}>Press D to close</div>
    </div>
  )
}

export default DebugPanel
