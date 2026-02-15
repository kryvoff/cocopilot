import React from 'react'
import { useMonitoringStore } from '../store/monitoring-store'
import { useAppStore } from '../store/app-store'
import type { AppMode } from '@shared/events'

const MODES: { id: AppMode; label: string }[] = [
  { id: 'vanilla', label: '📊 Vanilla' },
  { id: 'island', label: '🏝️ Island' },
  { id: 'ocean', label: '🌊 Ocean' },
  { id: 'learn', label: '📚 Learn' }
]

function StatusBar(): React.JSX.Element {
  const sessions = useMonitoringStore((s) => s.sessions)
  const selectedSessionId = useMonitoringStore((s) => s.selectedSessionId)
  const selectSession = useMonitoringStore((s) => s.selectSession)
  const processes = useMonitoringStore((s) => s.processes)
  const mode = useAppStore((s) => s.mode)
  const setMode = useAppStore((s) => s.setMode)
  const audioEnabled = useAppStore((s) => s.audioEnabled)
  const setAudioEnabled = useAppStore((s) => s.setAudioEnabled)
  const hudVisible = useAppStore((s) => s.hudVisible)
  const setHudVisible = useAppStore((s) => s.setHudVisible)
  const showCompletedSessions = useAppStore((s) => s.showCompletedSessions)

  const activeSessions = sessions.filter((s) => s.status === 'active' || s.status === 'idle')
  const completedSessions = sessions.filter((s) => s.status !== 'active' && s.status !== 'idle')
  const completedCount = completedSessions.length
  const processCount = processes.length

  return (
    <div className="status-bar">
      <div className="status-bar-left">
        <span className="status-indicator" title={`${processCount} Copilot CLI process${processCount !== 1 ? 'es' : ''} running, ${activeSessions.length} session${activeSessions.length !== 1 ? 's' : ''} with recent activity`}>
          {processCount > 0 ? '🟢' : '⚪'} {activeSessions.length} session{activeSessions.length !== 1 ? 's' : ''}
        </span>
        {sessions.length > 0 && (
          <select
            value={selectedSessionId ?? ''}
            onChange={(e) => selectSession(e.target.value)}
            className="status-session-selector"
          >
            {activeSessions.map((s) => {
              const proc = processes.find((p) => p.sessionId === s.id)
              const label = s.repository ?? s.id.slice(0, 8)
              const statusIcon = proc ? '🟢' : '🟡'
              const statusLabel = proc ? 'running' : 'idle'
              return (
                <option key={s.id} value={s.id}>
                  {statusIcon} {label} ({statusLabel}) • {s.eventCount} events
                </option>
              )
            })}
            {showCompletedSessions && completedCount > 0 && (
              <option disabled>── {completedCount} completed ──</option>
            )}
            {showCompletedSessions &&
              completedSessions.map((s) => {
                const label = s.repository ?? s.id.slice(0, 8)
                return (
                  <option key={s.id} value={s.id}>
                    ⚪ {label} (ended) • {s.eventCount} events
                  </option>
                )
              })}
          </select>
        )}
      </div>
      <div className="status-bar-right">
        <button
          className="mode-button icon-toggle"
          onClick={() => setHudVisible(!hudVisible)}
          title={hudVisible ? 'Hide events panel' : 'Show events panel'}
        >
          <span className={`icon-toggle-icon ${!hudVisible ? 'icon-toggle-off' : ''}`}>📋</span>
        </button>
        <button
          className="mode-button icon-toggle"
          onClick={() => setAudioEnabled(!audioEnabled)}
          title={audioEnabled ? 'Mute audio' : 'Enable audio'}
        >
          <span className={`icon-toggle-icon ${!audioEnabled ? 'icon-toggle-off' : ''}`}>🔊</span>
        </button>
        {MODES.map((m) => (
          <button
            key={m.id}
            className={`mode-button ${mode === m.id ? 'active' : ''}`}
            onClick={() => setMode(m.id)}
          >
            {m.label}
          </button>
        ))}
        <button
          className={`mode-button ${mode === 'settings' ? 'active' : ''}`}
          onClick={() => setMode('settings')}
        >
          ⚙️
        </button>
      </div>
    </div>
  )
}

export default StatusBar
