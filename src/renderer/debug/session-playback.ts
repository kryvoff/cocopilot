import { useMonitoringStore } from '../store/monitoring-store'
import type { ParsedEvent, SessionInfo } from '@shared/events'

export interface PlaybackOptions {
  speedMultiplier?: number // 1.0 = real-time, 10.0 = 10x faster
  onEvent?: (event: ParsedEvent) => void
  onComplete?: () => void
}

export class SessionPlayback {
  private events: ParsedEvent[] = []
  private currentIndex = 0
  private timer: ReturnType<typeof setTimeout> | null = null
  private running = false
  private speed: number
  private onEvent?: (event: ParsedEvent) => void
  private onComplete?: () => void

  constructor(options: PlaybackOptions = {}) {
    this.speed = options.speedMultiplier ?? 5.0
    this.onEvent = options.onEvent
    this.onComplete = options.onComplete
  }

  load(jsonlContent: string): void {
    this.stop()
    this.events = jsonlContent
      .trim()
      .split('\n')
      .filter((line) => line.length > 0)
      .map((line) => {
        const raw = JSON.parse(line)
        return {
          type: raw.type,
          id: raw.id ?? crypto.randomUUID(),
          timestamp: raw.timestamp ?? new Date().toISOString(),
          parentId: raw.parentId ?? null,
          ephemeral: raw.ephemeral ?? false,
          data: raw.data ?? {},
          knownType: true
        } satisfies ParsedEvent
      })
    this.currentIndex = 0
  }

  start(): void {
    if (this.events.length === 0) return
    this.running = true

    const store = useMonitoringStore.getState()

    // Create a synthetic session from the session.start event
    const startEvent = this.events.find((e) => e.type === 'session.start')
    const sessionId =
      (startEvent?.data?.sessionId as string) ?? 'playback-' + Date.now()

    const session: SessionInfo = {
      id: sessionId,
      cwd: (startEvent?.data?.context as Record<string, string>)?.cwd ?? '/playback',
      gitRoot: (startEvent?.data?.context as Record<string, string>)?.gitRoot,
      repository: (startEvent?.data?.context as Record<string, string>)?.repository,
      branch: (startEvent?.data?.context as Record<string, string>)?.branch,
      copilotVersion: (startEvent?.data?.copilotVersion as string) ?? 'playback',
      status: 'active',
      startTime: startEvent?.timestamp ?? new Date().toISOString(),
      eventCount: this.events.length
    }

    store.playbackSetSession(session)
    this.playNext()
  }

  private playNext(): void {
    if (!this.running || this.currentIndex >= this.events.length) {
      this.running = false
      this.onComplete?.()
      return
    }

    const event = this.events[this.currentIndex]

    // Inject event into monitoring store
    const store = useMonitoringStore.getState()
    store.playbackAddEvent(event)
    this.onEvent?.(event)
    this.currentIndex++

    // Calculate delay to next event
    if (this.currentIndex < this.events.length) {
      const nextEvent = this.events[this.currentIndex]
      const currentTime = new Date(event.timestamp).getTime()
      const nextTime = new Date(nextEvent.timestamp).getTime()
      const delay = Math.max(50, (nextTime - currentTime) / this.speed)
      this.timer = setTimeout(() => this.playNext(), delay)
    } else {
      this.running = false
      this.onComplete?.()
    }
  }

  stop(): void {
    this.running = false
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  isRunning(): boolean {
    return this.running
  }

  getProgress(): { current: number; total: number } {
    return { current: this.currentIndex, total: this.events.length }
  }
}
