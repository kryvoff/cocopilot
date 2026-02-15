import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppMode } from '@shared/events'
import { DEFAULT_SETTINGS } from '@shared/events'

interface AppState {
  mode: AppMode
  defaultMode: AppMode
  audioEnabled: boolean
  audioVolume: number
  hudVisible: boolean
  showCompletedSessions: boolean
  setMode: (mode: AppMode) => void
  setDefaultMode: (mode: AppMode) => void
  setAudioEnabled: (enabled: boolean) => void
  setAudioVolume: (volume: number) => void
  setHudVisible: (visible: boolean) => void
  setShowCompletedSessions: (show: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      mode: 'island',
      defaultMode: 'island',
      audioEnabled: DEFAULT_SETTINGS.audioEnabled,
      audioVolume: DEFAULT_SETTINGS.audioVolume,
      hudVisible: true,
      showCompletedSessions: false,
      setMode: (mode) => set({ mode }),
      setDefaultMode: (mode) => set({ defaultMode: mode }),
      setAudioEnabled: (enabled) => set({ audioEnabled: enabled }),
      setAudioVolume: (volume) => set({ audioVolume: Math.max(0, Math.min(1, volume)) }),
      setHudVisible: (visible) => set({ hudVisible: visible }),
      setShowCompletedSessions: (show) => set({ showCompletedSessions: show })
    }),
    {
      name: 'cocopilot-settings',
      partialize: (state) => ({
        defaultMode: state.defaultMode,
        audioEnabled: state.audioEnabled,
        audioVolume: state.audioVolume,
        hudVisible: state.hudVisible,
        showCompletedSessions: state.showCompletedSessions
      })
    }
  )
)

// On startup, set current mode to the persisted default mode
const { defaultMode } = useAppStore.getState()
if (defaultMode) {
  useAppStore.setState({ mode: defaultMode })
}
