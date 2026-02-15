import React, { useMemo } from 'react'
import { ResponsiveLine } from '@nivo/line'
import { useMonitoringStore } from '../../store/monitoring-store'

function ActivityChart(): React.JSX.Element {
  const events = useMonitoringStore((s) => s.events)

  const chartData = useMemo(() => {
    if (events.length === 0) return null

    const timestamps = events
      .map((e) => new Date(e.timestamp).getTime())
      .filter((t) => !isNaN(t))
      .sort((a, b) => a - b)

    if (timestamps.length === 0) return null

    const minT = timestamps[0]
    const maxT = timestamps[timestamps.length - 1]
    const spanMs = maxT - minT

    if (spanMs === 0) {
      // Single point in time
      return [
        {
          id: 'events',
          data: [{ x: new Date(minT).toISOString(), y: timestamps.length }]
        }
      ]
    }

    // Choose bucket size: aim for ~20-40 buckets
    let bucketMs: number
    if (spanMs < 60_000) {
      bucketMs = 5_000 // 5s buckets for < 1min
    } else if (spanMs < 600_000) {
      bucketMs = 10_000 // 10s buckets for < 10min
    } else if (spanMs < 3_600_000) {
      bucketMs = 60_000 // 1min buckets for < 1hr
    } else {
      bucketMs = 300_000 // 5min buckets for longer
    }

    const bucketCount = Math.ceil(spanMs / bucketMs) + 1
    const buckets = new Array<number>(bucketCount).fill(0)

    for (const t of timestamps) {
      const idx = Math.min(Math.floor((t - minT) / bucketMs), bucketCount - 1)
      buckets[idx]++
    }

    const data = buckets.map((count, i) => ({
      x: new Date(minT + i * bucketMs).toISOString(),
      y: count
    }))

    return [{ id: 'events', data }]
  }, [events])

  if (!chartData) {
    return (
      <div className="activity-chart empty">
        <p>No activity data yet.</p>
      </div>
    )
  }

  return (
    <div className="activity-chart">
      <h3>Event Activity</h3>
      <div style={{ height: 200 }}>
        <ResponsiveLine
          data={chartData}
          margin={{ top: 8, right: 16, bottom: 32, left: 40 }}
          xScale={{ type: 'time', format: '%Y-%m-%dT%H:%M:%S.%LZ', precision: 'second' }}
          xFormat="time:%H:%M:%S"
          yScale={{ type: 'linear', min: 0, stacked: false }}
          axisBottom={{
            format: '%H:%M',
            tickRotation: 0,
            tickValues: 5
          }}
          axisLeft={{
            tickValues: 5
          }}
          colors={['#4ecca3']}
          lineWidth={2}
          pointSize={4}
          pointColor="#4ecca3"
          pointBorderWidth={0}
          enableArea={true}
          areaOpacity={0.15}
          enableGridX={false}
          gridYValues={5}
          curve="monotoneX"
          useMesh={true}
          theme={{
            background: 'transparent',
            text: { fill: '#a0a0a0', fontSize: 11 },
            axis: {
              ticks: { text: { fill: '#a0a0a0', fontSize: 10 } },
              legend: { text: { fill: '#a0a0a0' } }
            },
            grid: { line: { stroke: '#ffffff10' } },
            crosshair: { line: { stroke: '#e0e0e0', strokeWidth: 1, strokeOpacity: 0.5 } },
            tooltip: {
              container: {
                background: '#0f3460',
                color: '#e0e0e0',
                fontSize: 12,
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
              }
            }
          }}
          tooltip={({ point }) => (
            <div
              style={{
                background: '#0f3460',
                color: '#e0e0e0',
                padding: '6px 10px',
                borderRadius: 4,
                fontSize: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
              }}
            >
              <strong>{point.data.yFormatted}</strong> events at{' '}
              <span style={{ color: '#4ecca3' }}>{point.data.xFormatted}</span>
            </div>
          )}
        />
      </div>
    </div>
  )
}

export default ActivityChart
