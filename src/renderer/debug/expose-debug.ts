import { useAppStore } from '../store/app-store'
import { useCocoStore } from '../modes/island/coco-state'
import { useMonitoringStore } from '../store/monitoring-store'
import { AudioManager } from '../audio/audio-manager'
import { SessionPlayback } from './session-playback'
import syntheticSession from '../../../test/fixtures/events/synthetic-session.jsonl?raw'

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
    activeAmbientId: string | null
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

  // Expose playback controls for debug API and DebugPanel
  let activePlayback: SessionPlayback | null = null

  const playbackApi = {
    start: (speed?: number) => {
      activePlayback?.stop()
      activePlayback = new SessionPlayback({
        speedMultiplier: speed ?? 5.0,
        onComplete: () => {
          console.log('[Playback] Complete')
        }
      })
      useMonitoringStore.getState().playbackReset()
      activePlayback.load(syntheticSession)
      activePlayback.start()
      return { status: 'started', events: activePlayback.getProgress().total }
    },
    stop: () => {
      activePlayback?.stop()
      return { status: 'stopped' }
    },
    status: () => ({
      running: activePlayback?.isRunning() ?? false,
      progress: activePlayback?.getProgress() ?? { current: 0, total: 0 }
    })
  }

  ;(window as unknown as Record<string, unknown>).__cocopilot_playback = playbackApi
}
