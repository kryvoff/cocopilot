import { create } from 'zustand'
import type { AppMode } from '@shared/events'
import { DEFAULT_SETTINGS } from '@shared/events'

interface AppState {
  mode: AppMode
  audioEnabled: boolean
  audioVolume: number
  setMode: (mode: AppMode) => void
  setAudioEnabled: (enabled: boolean) => void
  setAudioVolume: (volume: number) => void
}

export const useAppStore = create<AppState>((set) => ({
  mode: 'island',
  audioEnabled: DEFAULT_SETTINGS.audioEnabled,
  audioVolume: DEFAULT_SETTINGS.audioVolume,
  setMode: (mode) => set({ mode }),
  setAudioEnabled: (enabled) => set({ audioEnabled: enabled }),
  setAudioVolume: (volume) => set({ audioVolume: Math.max(0, Math.min(1, volume)) })
}))
