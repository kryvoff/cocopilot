import { useEffect, useRef } from 'react'
import { useMonitoringStore } from '../store/monitoring-store'
import { useAudio } from './use-audio'
import { getSoundForEvent } from './event-sound-map'

/**
 * Hook that subscribes to monitoring store events and plays the
 * corresponding sound for each new event. Should be used once
 * in a component that is always mounted (e.g. App).
 */
export function useEventSounds(): void {
  const events = useMonitoringStore((s) => s.events)
  const { playSound } = useAudio()
  const prevLengthRef = useRef(events.length)

  useEffect(() => {
    // Only react to newly appended events
    const prevLen = prevLengthRef.current
    if (events.length > prevLen) {
      const newEvents = events.slice(prevLen)
      for (const event of newEvents) {
        const soundId = getSoundForEvent(event)
        if (soundId) {
          playSound(soundId)
        }
      }
    }
    prevLengthRef.current = events.length
  }, [events, playSound])
}
