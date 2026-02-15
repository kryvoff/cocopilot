import { useEffect, useRef } from 'react'
import { useMonitoringStore } from '../../store/monitoring-store'
import { useEventSounds } from '../../audio/use-event-sounds'
import { useAudio } from '../../audio/use-audio'
import { useFlipperStore } from './flipper-state'
import type { FlipperState } from './flipper-state'

/**
 * Hook that connects monitoring events to Flipper's animation state and sounds.
 * Should be called once inside OceanMode.
 */
export function useOceanEvents(): FlipperState {
  const events = useMonitoringStore((s) => s.events)
  const selectedSessionId = useMonitoringStore((s) => s.selectedSessionId)
  const flipperState = useFlipperStore((s) => s.state)
  const processEvent = useFlipperStore((s) => s.processEvent)
  const setFlipperState = useFlipperStore((s) => s.setState)
  const prevLengthRef = useRef(events.length)

  // Activate sound hooks inside Ocean mode
  useEventSounds()
  useAudio()

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
