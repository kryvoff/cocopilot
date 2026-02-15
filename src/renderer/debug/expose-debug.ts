import { useAppStore } from '../store/app-store'
import { useCocoStore } from '../modes/island/coco-state'
import { AudioManager } from '../audio/audio-manager'

export interface RendererDebugState {
  timestamp: string
  mode: string
  audioEnabled: boolean
  audioVolume: number
  audio: {
    initialized: boolean
    enabled: boolean
    volume: number
    soundCount: number
    ambientPlaying: boolean
  }
  coco: {
    state: string
    toolActive: string | null
    subAgentCount: number
  }
}

function captureDebugState(): RendererDebugState {
  const appState = useAppStore.getState()
  const cocoState = useCocoStore.getState()
  const audio = AudioManager.getInstance()

  return {
    timestamp: new Date().toISOString(),
    mode: appState.mode,
    audioEnabled: appState.audioEnabled,
    audioVolume: appState.audioVolume,
    audio: audio.getState(),
    coco: {
      state: cocoState.state,
      toolActive: cocoState.toolActive,
      subAgentCount: cocoState.subAgentCount
    }
  }
}

/** Call once during app init to expose debug state on window. Updates every second. */
export function exposeDebugState(): void {
  const update = (): void => {
    ;(window as unknown as Record<string, unknown>).__cocopilot_debug = captureDebugState()
  }

  update()
  setInterval(update, 1000)
}
