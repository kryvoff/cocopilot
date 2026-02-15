import React, { useMemo } from 'react'
import { useMonitoringStore } from '../../store/monitoring-store'

function formatDuration(ms: number): string {
  if (ms <= 0) return '0s'
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`
}

function StatsCards(): React.JSX.Element {
  const events = useMonitoringStore((s) => s.events)

  const stats = useMemo(() => {
    const countByType = (type: string): number => events.filter((e) => e.type === type).length

    let duration = '—'
    if (events.length >= 2) {
      const first = new Date(events[0].timestamp).getTime()
      const last = new Date(events[events.length - 1].timestamp).getTime()
      duration = formatDuration(last - first)
    }

    return [
      { label: 'Requests', value: countByType('user.message') },
      { label: 'Turns', value: countByType('assistant.turn_start') },
      { label: 'Tool Calls', value: countByType('tool.execution_start') },
      { label: 'Errors', value: countByType('session.error') },
      { label: 'Sub-agents', value: countByType('subagent.started') },
      { label: 'Duration', value: duration }
    ]
  }, [events])

  return (
    <div className="stats-cards">
      {stats.map((stat) => (
        <div key={stat.label} className="stat-card">
          <span className="stat-value">{stat.value}</span>
          <span className="stat-label">{stat.label}</span>
        </div>
      ))}
    </div>
  )
}

export default StatsCards
