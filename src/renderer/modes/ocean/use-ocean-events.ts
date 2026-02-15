import { useEffect, useRef } from 'react'
import { useMonitoringStore } from '../../store/monitoring-store'
import { useFlipperStore } from './flipper-state'
import type { FlipperState } from './flipper-state'

/**
 * Hook that connects monitoring events to Flipper's animation state.
 * Audio is managed globally in App.tsx via useAudio/useEventSounds.
 */
export function useOceanEvents(): FlipperState {
  const events = useMonitoringStore((s) => s.events)
  const selectedSessionId = useMonitoringStore((s) => s.selectedSessionId)
  const flipperState = useFlipperStore((s) => s.state)
  const processEvent = useFlipperStore((s) => s.processEvent)
  const setFlipperState = useFlipperStore((s) => s.setState)
  const prevLengthRef = useRef(events.length)

  // When no session is selected, hide Flipper
  useEffect(() => {
    if (!selectedSessionId) {
      setFlipperState('hidden')
    }
  }, [selectedSessionId, setFlipperState])

  // Process new events through the flipper state store
  useEffect(() => {
    const prevLen = prevLengthRef.current
    if (events.length > prevLen) {
      const newEvents = events.slice(prevLen)
      for (const event of newEvents) {
        processEvent(event)
      }
    }
    prevLengthRef.current = events.length
  }, [events, processEvent])

  // Reset when session changes
  useEffect(() => {
    prevLengthRef.current = 0
  }, [selectedSessionId])

  return flipperState
}
