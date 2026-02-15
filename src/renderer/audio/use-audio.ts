import { useEffect, useCallback, useRef } from 'react'
import { useAppStore } from '../store/app-store'
import { AudioManager } from './audio-manager'

/**
 * React hook that initializes the AudioManager, syncs it with store settings,
 * and provides imperative methods for playing sounds.
 *
 * Auto-starts ambient audio when Island mode is active and audio is enabled.
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

  // Auto-start/stop ambient for Island mode
  useEffect(() => {
    const mgr = managerRef.current!
    if (mode === 'island' && audioEnabled) {
      mgr.startAmbient()
    } else {
      mgr.stopAmbient()
    }
  }, [mode, audioEnabled])

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
