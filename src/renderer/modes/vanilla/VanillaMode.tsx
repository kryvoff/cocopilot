import React from 'react'
import EventTimeline from './EventTimeline'
import StatsCards from './StatsCards'
import ActivityChart from './ActivityChart'
import EventTypeChart from './EventTypeChart'
import { useMonitoringStore } from '../../store/monitoring-store'

function formatMemory(rssKb: number): string {
  if (rssKb > 1024 * 1024) return `${(rssKb / 1024 / 1024).toFixed(1)} GB`
  if (rssKb > 1024) return `${(rssKb / 1024).toFixed(0)} MB`
  return `${rssKb} KB`
}

function VanillaMode(): React.JSX.Element {
  const sessions = useMonitoringStore((s) => s.sessions)
  const selectedSessionId = useMonitoringStore((s) => s.selectedSessionId)
  const selectSession = useMonitoringStore((s) => s.selectSession)
  const showAllSessions = useMonitoringStore((s) => s.showAllSessions)
  const setShowAllSessions = useMonitoringStore((s) => s.setShowAllSessions)
  const processes = useMonitoringStore((s) => s.processes)

  const filteredSessions = showAllSessions
    ? sessions
    : sessions.filter((s) => s.status === 'active' || s.status === 'idle')
  const selected = sessions.find((s) => s.id === selectedSessionId)
  const completedCount = sessions.filter(
    (s) => s.status === 'completed' || s.status === 'error'
  ).length

  // Find the process for the selected session
  const selectedProcess = selected?.pid
    ? processes.find((p) => p.pid === selected.pid)
    : processes.find((p) => p.sessionId === selected?.id)

  return (
    <div className="vanilla-mode">
      <div className="vanilla-header">
        <h2>🐵 Cocopilot — Vanilla Mode</h2>
        <div className="vanilla-header-controls">
          <select
            value={selectedSessionId ?? ''}
            onChange={(e) => selectSession(e.target.value)}
            className="session-selector"
          >
            {filteredSessions.length === 0 && (
              <option value="">No sessions</option>
            )}
            {filteredSessions.map((s) => {
              const proc = processes.find((p) => p.sessionId === s.id)
              const label = s.repository ?? s.id.slice(0, 8)
              const statusIcon = proc ? '🟢' : s.status === 'active' ? '🟡' : '⚪'
              return (
                <option key={s.id} value={s.id}>
                  {statusIcon} {label} ({s.status})
                </option>
              )
            })}
          </select>
          <span className="process-count" title="Running copilot CLI processes">
            {processes.length} process{processes.length !== 1 ? 'es' : ''}
          </span>
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
              <span>
                {selected.pid ? '🟢' : '⚪'} {selected.status}
                {selected.pid ? ` (PID ${selected.pid})` : ''}
              </span>
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
            {selectedProcess && (
              <>
                <div>
                  <strong>CPU</strong>
                  <span>{selectedProcess.cpu.toFixed(1)}%</span>
                </div>
                <div>
                  <strong>Memory</strong>
                  <span>{formatMemory(selectedProcess.rssKb)}</span>
                </div>
                <div>
                  <strong>Threads</strong>
                  <span>{selectedProcess.threads}</span>
                </div>
                <div>
                  <strong>Uptime</strong>
                  <span>{selectedProcess.elapsed}</span>
                </div>
              </>
            )}
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
