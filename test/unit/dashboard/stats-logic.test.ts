import { describe, it, expect } from 'vitest'
import type { ParsedEvent } from '@shared/events'

// --- Helpers ---

function mockEvent(type: string, timestamp: string): ParsedEvent {
  return {
    type,
    id: `evt-${Math.random().toString(36).slice(2, 8)}`,
    timestamp,
    parentId: null,
    ephemeral: false,
    data: {},
    knownType: true
  }
}

// --- Pure logic extracted from dashboard components ---

// From StatsCards.tsx
function formatDuration(ms: number): string {
  if (ms <= 0) return '0s'
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`
}

function computeStats(events: ParsedEvent[]) {
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
}

// From EventTypeChart.tsx
function computeTypeCounts(events: ParsedEvent[]): [string, number][] {
  const counts = new Map<string, number>()
  for (const event of events) {
    counts.set(event.type, (counts.get(event.type) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
}

// From ActivityChart.tsx
function computeActivityBuckets(events: ParsedEvent[]) {
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
    return [
      {
        id: 'events',
        data: [{ x: new Date(minT).toISOString(), y: timestamps.length }]
      }
    ]
  }

  let bucketMs: number
  if (spanMs < 60_000) {
    bucketMs = 5_000
  } else if (spanMs < 600_000) {
    bucketMs = 10_000
  } else if (spanMs < 3_600_000) {
    bucketMs = 60_000
  } else {
    bucketMs = 300_000
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
}

// --- Tests ---

describe('StatsCards logic', () => {
  describe('formatDuration', () => {
    it('returns "0s" for zero or negative ms', () => {
      expect(formatDuration(0)).toBe('0s')
      expect(formatDuration(-1000)).toBe('0s')
    })

    it('formats seconds only', () => {
      expect(formatDuration(30_000)).toBe('30s')
      expect(formatDuration(1_000)).toBe('1s')
    })

    it('formats minutes and seconds', () => {
      expect(formatDuration(300_000)).toBe('5m 0s')
      expect(formatDuration(90_000)).toBe('1m 30s')
      expect(formatDuration(3_661_000)).toBe('61m 1s')
    })

    it('truncates sub-second remainders', () => {
      expect(formatDuration(1_500)).toBe('1s')
      expect(formatDuration(999)).toBe('0s')
    })
  })

  describe('computeStats', () => {
    it('counts event types correctly', () => {
      const events = [
        mockEvent('user.message', '2026-02-15T08:00:00.000Z'),
        mockEvent('user.message', '2026-02-15T08:00:01.000Z'),
        mockEvent('assistant.turn_start', '2026-02-15T08:00:02.000Z'),
        mockEvent('tool.execution_start', '2026-02-15T08:00:03.000Z'),
        mockEvent('tool.execution_start', '2026-02-15T08:00:04.000Z'),
        mockEvent('tool.execution_start', '2026-02-15T08:00:05.000Z'),
        mockEvent('session.error', '2026-02-15T08:00:06.000Z'),
        mockEvent('subagent.started', '2026-02-15T08:00:07.000Z'),
        mockEvent('subagent.started', '2026-02-15T08:00:08.000Z')
      ]

      const stats = computeStats(events)
      const byLabel = Object.fromEntries(stats.map((s) => [s.label, s.value]))

      expect(byLabel['Requests']).toBe(2)
      expect(byLabel['Turns']).toBe(1)
      expect(byLabel['Tool Calls']).toBe(3)
      expect(byLabel['Errors']).toBe(1)
      expect(byLabel['Sub-agents']).toBe(2)
    })

    it('returns zeros for unrelated event types', () => {
      const events = [
        mockEvent('session.start', '2026-02-15T08:00:00.000Z'),
        mockEvent('session.shutdown', '2026-02-15T08:00:30.000Z')
      ]

      const stats = computeStats(events)
      const byLabel = Object.fromEntries(stats.map((s) => [s.label, s.value]))

      expect(byLabel['Requests']).toBe(0)
      expect(byLabel['Turns']).toBe(0)
      expect(byLabel['Tool Calls']).toBe(0)
      expect(byLabel['Errors']).toBe(0)
      expect(byLabel['Sub-agents']).toBe(0)
    })

    it('computes duration from first to last event', () => {
      const events = [
        mockEvent('session.start', '2026-02-15T08:00:00.000Z'),
        mockEvent('user.message', '2026-02-15T08:00:30.000Z')
      ]

      const stats = computeStats(events)
      const byLabel = Object.fromEntries(stats.map((s) => [s.label, s.value]))

      expect(byLabel['Duration']).toBe('30s')
    })

    it('computes multi-minute duration', () => {
      const events = [
        mockEvent('session.start', '2026-02-15T08:00:00.000Z'),
        mockEvent('session.shutdown', '2026-02-15T08:05:00.000Z')
      ]

      const stats = computeStats(events)
      const byLabel = Object.fromEntries(stats.map((s) => [s.label, s.value]))

      expect(byLabel['Duration']).toBe('5m 0s')
    })

    it('returns "—" for single event', () => {
      const events = [mockEvent('session.start', '2026-02-15T08:00:00.000Z')]

      const stats = computeStats(events)
      const byLabel = Object.fromEntries(stats.map((s) => [s.label, s.value]))

      expect(byLabel['Duration']).toBe('—')
    })

    it('returns "—" for no events', () => {
      const stats = computeStats([])
      const byLabel = Object.fromEntries(stats.map((s) => [s.label, s.value]))

      expect(byLabel['Duration']).toBe('—')
    })
  })
})

describe('EventTypeChart logic', () => {
  describe('computeTypeCounts', () => {
    it('groups and counts by type, sorted descending', () => {
      const events = [
        mockEvent('tool.execution_start', '2026-02-15T08:00:00.000Z'),
        mockEvent('tool.execution_start', '2026-02-15T08:00:01.000Z'),
        mockEvent('tool.execution_start', '2026-02-15T08:00:02.000Z'),
        mockEvent('user.message', '2026-02-15T08:00:03.000Z'),
        mockEvent('user.message', '2026-02-15T08:00:04.000Z'),
        mockEvent('session.start', '2026-02-15T08:00:05.000Z')
      ]

      const counts = computeTypeCounts(events)

      expect(counts[0]).toEqual(['tool.execution_start', 3])
      expect(counts[1]).toEqual(['user.message', 2])
      expect(counts[2]).toEqual(['session.start', 1])
      expect(counts).toHaveLength(3)
    })

    it('returns empty array for no events', () => {
      expect(computeTypeCounts([])).toEqual([])
    })

    it('handles single event type', () => {
      const events = [
        mockEvent('session.start', '2026-02-15T08:00:00.000Z'),
        mockEvent('session.start', '2026-02-15T08:00:01.000Z')
      ]

      const counts = computeTypeCounts(events)

      expect(counts).toEqual([['session.start', 2]])
    })

    it('handles many distinct types with count 1', () => {
      const types = [
        'session.start',
        'user.message',
        'assistant.turn_start',
        'tool.execution_start',
        'tool.execution_complete',
        'session.shutdown'
      ]
      const events = types.map((t, i) =>
        mockEvent(t, `2026-02-15T08:00:0${i}.000Z`)
      )

      const counts = computeTypeCounts(events)

      expect(counts).toHaveLength(6)
      // All counts should be 1
      for (const [, count] of counts) {
        expect(count).toBe(1)
      }
    })
  })
})

describe('ActivityChart logic', () => {
  describe('computeActivityBuckets', () => {
    it('returns null for no events', () => {
      expect(computeActivityBuckets([])).toBeNull()
    })

    it('returns single data point for events at same timestamp', () => {
      const events = [
        mockEvent('user.message', '2026-02-15T08:00:00.000Z'),
        mockEvent('assistant.turn_start', '2026-02-15T08:00:00.000Z')
      ]

      const result = computeActivityBuckets(events)

      expect(result).not.toBeNull()
      expect(result).toHaveLength(1)
      expect(result![0].id).toBe('events')
      expect(result![0].data).toHaveLength(1)
      expect(result![0].data[0].y).toBe(2)
    })

    it('returns single data point for a single event', () => {
      const events = [mockEvent('session.start', '2026-02-15T08:00:00.000Z')]

      const result = computeActivityBuckets(events)

      expect(result).not.toBeNull()
      expect(result![0].data).toHaveLength(1)
      expect(result![0].data[0].y).toBe(1)
    })

    it('uses 5-second buckets for events spanning < 1 minute', () => {
      // Events spanning 30 seconds → should use 5s buckets → 7 buckets
      const events = [
        mockEvent('a', '2026-02-15T08:00:00.000Z'),
        mockEvent('b', '2026-02-15T08:00:10.000Z'),
        mockEvent('c', '2026-02-15T08:00:20.000Z'),
        mockEvent('d', '2026-02-15T08:00:30.000Z')
      ]

      const result = computeActivityBuckets(events)

      expect(result).not.toBeNull()
      const data = result![0].data
      // 30s span / 5s bucket = 6 + 1 = 7 buckets
      expect(data).toHaveLength(7)
      // First bucket has 1 event (0s)
      expect(data[0].y).toBe(1)
      // Second bucket has 1 event (10s → idx 2)
      expect(data[2].y).toBe(1)
      // Total events across all buckets
      const total = data.reduce((sum: number, d: { y: number }) => sum + d.y, 0)
      expect(total).toBe(4)
    })

    it('uses 10-second buckets for events spanning 1-10 minutes', () => {
      // Events spanning 5 minutes
      const events = [
        mockEvent('a', '2026-02-15T08:00:00.000Z'),
        mockEvent('b', '2026-02-15T08:02:30.000Z'),
        mockEvent('c', '2026-02-15T08:05:00.000Z')
      ]

      const result = computeActivityBuckets(events)

      expect(result).not.toBeNull()
      const data = result![0].data
      // 300s span / 10s bucket = 30 + 1 = 31 buckets
      expect(data).toHaveLength(31)
      const total = data.reduce((sum: number, d: { y: number }) => sum + d.y, 0)
      expect(total).toBe(3)
    })

    it('uses 1-minute buckets for events spanning 10-60 minutes', () => {
      // Events spanning 30 minutes
      const events = [
        mockEvent('a', '2026-02-15T08:00:00.000Z'),
        mockEvent('b', '2026-02-15T08:15:00.000Z'),
        mockEvent('c', '2026-02-15T08:30:00.000Z')
      ]

      const result = computeActivityBuckets(events)

      expect(result).not.toBeNull()
      const data = result![0].data
      // 1800s span / 60s bucket = 30 + 1 = 31 buckets
      expect(data).toHaveLength(31)
      const total = data.reduce((sum: number, d: { y: number }) => sum + d.y, 0)
      expect(total).toBe(3)
    })

    it('uses 5-minute buckets for events spanning > 1 hour', () => {
      // Events spanning 2 hours
      const events = [
        mockEvent('a', '2026-02-15T08:00:00.000Z'),
        mockEvent('b', '2026-02-15T09:00:00.000Z'),
        mockEvent('c', '2026-02-15T10:00:00.000Z')
      ]

      const result = computeActivityBuckets(events)

      expect(result).not.toBeNull()
      const data = result![0].data
      // 7200s span / 300s bucket = 24 + 1 = 25 buckets
      expect(data).toHaveLength(25)
      const total = data.reduce((sum: number, d: { y: number }) => sum + d.y, 0)
      expect(total).toBe(3)
    })

    it('preserves total event count across buckets', () => {
      // Generate many events in a 45-second window
      const events: ParsedEvent[] = []
      for (let i = 0; i < 20; i++) {
        const ms = i * 2000 // 2s apart, spanning 38s total
        const date = new Date(Date.UTC(2026, 1, 15, 8, 0, 0, 0) + ms)
        events.push(mockEvent('tool.execution_start', date.toISOString()))
      }

      const result = computeActivityBuckets(events)

      expect(result).not.toBeNull()
      const data = result![0].data
      const total = data.reduce((sum: number, d: { y: number }) => sum + d.y, 0)
      expect(total).toBe(20)
    })

    it('bucket timestamps start at first event time', () => {
      const events = [
        mockEvent('a', '2026-02-15T08:05:00.000Z'),
        mockEvent('b', '2026-02-15T08:05:20.000Z')
      ]

      const result = computeActivityBuckets(events)

      expect(result).not.toBeNull()
      const firstBucketTime = result![0].data[0].x
      expect(firstBucketTime).toBe('2026-02-15T08:05:00.000Z')
    })
  })
})
