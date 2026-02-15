import { useEffect, useRef } from 'react'
import { useMonitoringStore } from '../../store/monitoring-store'
import { useCocoStore } from './coco-state'
import type { CocoState } from './Coco'

/**
 * Hook that connects monitoring events to Coco's animation state.
 * Audio is managed globally in App.tsx via useAudio/useEventSounds.
 */
export function useIslandEvents(): CocoState {
  const events = useMonitoringStore((s) => s.events)
  const selectedSessionId = useMonitoringStore((s) => s.selectedSessionId)
  const cocoState = useCocoStore((s) => s.state)
  const processEvent = useCocoStore((s) => s.processEvent)
  const setCocoState = useCocoStore((s) => s.setState)
  const prevLengthRef = useRef(events.length)

  // When no session is selected, hide Coco
  useEffect(() => {
    if (!selectedSessionId) {
      setCocoState('hidden')
    }
  }, [selectedSessionId, setCocoState])

  // Process new events through the coco state store
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

  return cocoState
}
