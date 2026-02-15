import React from 'react'
import EventTimeline from './EventTimeline'
import StatsCards from './StatsCards'
import ActivityChart from './ActivityChart'
import EventTypeChart from './EventTypeChart'
import { useMonitoringStore } from '../../store/monitoring-store'

function VanillaMode(): React.JSX.Element {
  const sessions = useMonitoringStore((s) => s.sessions)
  const selectedSessionId = useMonitoringStore((s) => s.selectedSessionId)
  const selectSession = useMonitoringStore((s) => s.selectSession)
  const showAllSessions = useMonitoringStore((s) => s.showAllSessions)
  const setShowAllSessions = useMonitoringStore((s) => s.setShowAllSessions)

  const filteredSessions = showAllSessions
    ? sessions
    : sessions.filter((s) => s.status === 'active' || s.status === 'idle')
  const selected = sessions.find((s) => s.id === selectedSessionId)
  const completedCount = sessions.filter(
    (s) => s.status === 'completed' || s.status === 'error'
  ).length

  return (
    <div className="vanilla-mode">
      <div className="vanilla-header">
        <h2>🐵 Cocopilot — Vanilla Mode</h2>
        <div className="vanilla-header-controls">
          {filteredSessions.length > 1 && (
            <select
              value={selectedSessionId ?? ''}
              onChange={(e) => selectSession(e.target.value)}
              className="session-selector"
            >
              {filteredSessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.repository ?? s.id.slice(0, 8)} ({s.status})
                </option>
              ))}
            </select>
          )}
          {completedCount > 0 && (
            <label className="show-all-toggle">
              <input
                type="checkbox"
                checked={showAllSessions}
                onChange={(e) => setShowAllSessions(e.target.checked)}
              />
              Show all ({sessions.length})
            </label>
          )}
        </div>
      </div>

      {selected && (
        <div className="session-info">
          <div className="info-grid">
            <div>
              <strong>Session</strong>
              <span>{selected.id.slice(0, 8)}…</span>
            </div>
            <div>
              <strong>Status</strong>
              <span>{selected.status}</span>
            </div>
            <div>
              <strong>Repository</strong>
              <span>{selected.repository ?? '—'}</span>
            </div>
            <div>
              <strong>Branch</strong>
              <span>{selected.branch ?? '—'}</span>
            </div>
            {selected.copilotVersion && (
              <div>
                <strong>Copilot</strong>
                <span>v{selected.copilotVersion}</span>
              </div>
            )}
            <div>
              <strong>Events</strong>
              <span>{selected.eventCount}</span>
            </div>
          </div>
        </div>
      )}

      <StatsCards />
      <ActivityChart />
      <EventTypeChart />
      <EventTimeline />
    </div>
  )
}

export default VanillaMode
