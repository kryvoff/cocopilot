import { useEffect, useCallback, useRef } from 'react'
import { useAppStore } from '../store/app-store'
import { AudioManager } from './audio-manager'

/**
 * React hook that initializes the AudioManager, syncs it with store settings,
 * and manages ambient audio per mode.
 *
 * Must be called exactly ONCE in App.tsx — not inside mode components.
 */
export function useAudio(): {
  playSound: (id: string) => void
  startAmbient: () => void
  stopAmbient: () => void
} {
  const audioEnabled = useAppStore((s) => s.audioEnabled)
  const audioVolume = useAppStore((s) => s.audioVolume)
  const mode = useAppStore((s) => s.mode)
  const managerRef = useRef<AudioManager | null>(null)

  // Initialize on first render
  if (!managerRef.current) {
    managerRef.current = AudioManager.getInstance()
    managerRef.current.init()
  }

  // Sync enabled/volume with store
  useEffect(() => {
    const mgr = managerRef.current!
    mgr.setEnabled(audioEnabled)
    mgr.setVolume(audioVolume)
  }, [audioEnabled, audioVolume])

  // Auto-start/stop ambient based on mode
  useEffect(() => {
    const mgr = managerRef.current!
    if (!audioEnabled) {
      mgr.stopAmbient()
      return undefined
    }

    if (mode === 'island') {
      const timer = setTimeout(() => mgr.startAmbient('island'), 800)
      return () => clearTimeout(timer)
    } else if (mode === 'ocean') {
      const timer = setTimeout(() => mgr.startAmbient('ocean'), 800)
      return () => clearTimeout(timer)
    } else {
      mgr.stopAmbient()
      return undefined
    }
  }, [mode, audioEnabled])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      managerRef.current?.stopAmbient()
    }
  }, [])

  const playSound = useCallback((id: string) => {
    managerRef.current?.play(id)
  }, [])

  const startAmbient = useCallback(() => {
    managerRef.current?.startAmbient()
  }, [])

  const stopAmbient = useCallback(() => {
    managerRef.current?.stopAmbient()
  }, [])

  return { playSound, startAmbient, stopAmbient }
}
