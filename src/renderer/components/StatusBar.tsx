import React from 'react'
import { useMonitoringStore } from '../store/monitoring-store'
import { useAppStore } from '../store/app-store'
import type { AppMode } from '@shared/events'

const MODES: { id: AppMode; label: string }[] = [
  { id: 'vanilla', label: '📊 Vanilla' },
  { id: 'island', label: '🏝️ Island' },
  { id: 'learn', label: '📚 Learn' },
  { id: 'ocean', label: '🌊 Ocean' }
]

interface StatusBarProps {
  onSettingsClick: () => void
}

function StatusBar({ onSettingsClick }: StatusBarProps): React.JSX.Element {
  const sessions = useMonitoringStore((s) => s.sessions)
  const selectedSessionId = useMonitoringStore((s) => s.selectedSessionId)
  const mode = useAppStore((s) => s.mode)
  const setMode = useAppStore((s) => s.setMode)

  const activeSessions = sessions.filter((s) => s.status === 'active' || s.status === 'idle')
  const selected = sessions.find((s) => s.id === selectedSessionId)

  return (
    <div className="status-bar">
      <div className="status-bar-left">
        <span className="status-indicator">
          {activeSessions.length > 0 ? '🟢' : '⚪'} {activeSessions.length} active
        </span>
        {selected && (
          <span className="status-session">
            {selected.repository ?? selected.cwd} • {selected.eventCount} events
          </span>
        )}
      </div>
      <div className="status-bar-right">
        {MODES.map((m) => (
          <button
            key={m.id}
            className={`mode-button ${mode === m.id ? 'active' : ''}`}
            onClick={() => setMode(m.id)}
          >
            {m.label}
          </button>
        ))}
        <button className="mode-button" onClick={onSettingsClick}>
          ⚙️
        </button>
      </div>
    </div>
  )
}

export default StatusBar
