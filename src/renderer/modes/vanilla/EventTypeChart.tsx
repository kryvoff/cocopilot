import React, { useMemo } from 'react'
import { useMonitoringStore } from '../../store/monitoring-store'

function EventTypeChart(): React.JSX.Element {
  const events = useMonitoringStore((s) => s.events)

  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const event of events) {
      counts.set(event.type, (counts.get(event.type) ?? 0) + 1)
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
  }, [events])

  if (typeCounts.length === 0) {
    return (
      <div className="event-type-chart empty">
        <p>No event data to chart.</p>
      </div>
    )
  }

  const maxCount = typeCounts[0][1]

  return (
    <div className="event-type-chart">
      <h3>Event Types</h3>
      <div className="chart-rows">
        {typeCounts.map(([type, count]) => (
          <div key={type} className="chart-row">
            <span className="chart-label">{type}</span>
            <div className="chart-bar-track">
              <div
                className="chart-bar"
                style={{ width: `${(count / maxCount) * 100}%` }}
              />
            </div>
            <span className="chart-count">{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default EventTypeChart
