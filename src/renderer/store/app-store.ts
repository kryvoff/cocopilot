import { create } from 'zustand'
import type { AppMode } from '@shared/events'

interface AppState {
  mode: AppMode
  setMode: (mode: AppMode) => void
}

export const useAppStore = create<AppState>((set) => ({
  mode: 'vanilla',
  setMode: (mode) => set({ mode })
}))
