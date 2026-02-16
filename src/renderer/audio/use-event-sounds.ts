import { useEffect, useRef } from 'react'
import { useMonitoringStore } from '../store/monitoring-store'
import { useAudio } from './use-audio'
import { getSoundForEvent } from './event-sound-map'

/**
 * Hook that subscribes to monitoring store events and plays the
 * corresponding sound for each new event. Should be used once
 * in a component that is always mounted (e.g. App).
 *
 * Bulk loads (initial load, session switch) are skipped to avoid
 * playing hundreds of sounds simultaneously.
 */
export function useEventSounds(): void {
  const events = useMonitoringStore((s) => s.events)
  const selectedSessionId = useMonitoringStore((s) => s.selectedSessionId)
  const { playSound } = useAudio()
  const prevLengthRef = useRef(0)
  const initializedRef = useRef(false)

  // Reset when session changes so the next batch load is skipped
  useEffect(() => {
    initializedRef.current = false
    prevLengthRef.current = 0
  }, [selectedSessionId])

  useEffect(() => {
    const prevLen = prevLengthRef.current
    const newCount = events.length - prevLen

    // Skip bulk loads (initial load, session switch, etc.)
    // Only play sounds for small incremental updates (real-time events)
    if (!initializedRef.current || newCount > 5) {
      prevLengthRef.current = events.length
      initializedRef.current = true
      // Even during bulk loads, play session lifecycle sounds if they're at the edges
      if (newCount > 0) {
        const lastEvent = events[events.length - 1]
        if (lastEvent?.type === 'session.shutdown') {
          const soundId = getSoundForEvent(lastEvent)
          if (soundId) playSound(soundId)
        }
        if (newCount === events.length) {
          // Initial load — play session.start if it's the first event
          const firstEvent = events[0]
          if (firstEvent?.type === 'session.start') {
            const soundId = getSoundForEvent(firstEvent)
            if (soundId) playSound(soundId)
          }
        }
      }
      return
    }

    if (newCount > 0) {
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
