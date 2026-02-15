import React from 'react'
import { useMonitoringStore } from '../../store/monitoring-store'
import type { ParsedEvent } from '@shared/events'

function EventRow({ event }: { event: ParsedEvent }): React.JSX.Element {
  const time = new Date(event.timestamp).toLocaleTimeString()
  return (
    <div className={`event-row ${event.knownType ? '' : 'unknown-type'}`}>
      <span className="event-time">{time}</span>
      <span className="event-type">{event.type}</span>
      {!event.knownType && <span className="event-badge">⚠ unknown</span>}
    </div>
  )
}

function EventTimeline(): React.JSX.Element {
  const events = useMonitoringStore((s) => s.events)

  if (events.length === 0) {
    return (
      <div className="event-timeline empty">
        <p>No events yet. Start a Copilot CLI session to see activity here.</p>
      </div>
    )
  }

  return (
    <div className="event-timeline">
      <h3>Event Timeline ({events.length})</h3>
      <div className="event-list">
        {events.map((event) => (
          <EventRow key={event.id} event={event} />
        ))}
      </div>
    </div>
  )
}

export default EventTimeline
