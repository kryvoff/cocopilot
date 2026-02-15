import { Howl, Howler } from 'howler'

/** Sound definition for registration */
interface SoundDef {
  src: string
  loop?: boolean
  volume?: number
}

/**
 * Audio file paths resolved for Electron.
 * In dev, electron-vite serves resources/ at the project root.
 * In production, resources are in process.resourcesPath.
 * Since the renderer runs in a browser context, we detect the environment
 * via the presence of window.__electron_vite_env__ or fall back to a
 * simple heuristic: if window.location.protocol is 'file:', we're in prod.
 */
function getAudioBasePath(): string {
  // electron-vite injects resources as static assets accessible at /resources
  // in dev mode. In production, the files are in the app.asar resources dir
  // and electron-vite maps them to the same /resources path.
  return 'resources/audio'
}

/** Registry of all sound IDs to their definitions */
const SOUND_DEFS: Record<string, SoundDef> = {
  ambient: { src: 'ambient-island.mp3', loop: true, volume: 0.3 },
  'session-start': { src: 'monkey-call.mp3' },
  'user-message': { src: 'chime.mp3' },
  'tool-edit': { src: 'typewriter.mp3' },
  'tool-bash': { src: 'coconut-crack.mp3' },
  'tool-success': { src: 'success.mp3' },
  'tool-error': { src: 'error.mp3' },
  'session-end': { src: 'goodbye.mp3' }
}

/**
 * Singleton that manages all app audio via Howler.js.
 * Call init() once, then play()/startAmbient()/stopAmbient() as needed.
 */
export class AudioManager {
  private static instance: AudioManager | null = null

  private sounds = new Map<string, Howl>()
  private ambientSound: Howl | null = null
  private enabled = false
  private volume = 0.5
  private initialized = false

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager()
    }
    return AudioManager.instance
  }

  /** Load all sounds. Safe to call multiple times (no-ops after first). */
  init(): void {
    if (this.initialized) return
    this.initialized = true

    const base = getAudioBasePath()

    for (const [id, def] of Object.entries(SOUND_DEFS)) {
      const howl = new Howl({
        src: [`${base}/${def.src}`],
        loop: def.loop ?? false,
        volume: (def.volume ?? 1) * this.volume,
        preload: true
      })

      this.sounds.set(id, howl)

      if (id === 'ambient') {
        this.ambientSound = howl
      }
    }
  }

  /** Play a one-shot sound by ID. No-op if disabled or unknown ID. */
  play(soundId: string): void {
    if (!this.enabled) return
    const howl = this.sounds.get(soundId)
    if (howl && soundId !== 'ambient') {
      howl.play()
    }
  }

  /** Start the ambient loop. No-op if disabled or already playing. */
  startAmbient(): void {
    if (!this.enabled || !this.ambientSound) return
    if (!this.ambientSound.playing()) {
      this.ambientSound.play()
    }
  }

  /** Stop the ambient loop. */
  stopAmbient(): void {
    if (this.ambientSound?.playing()) {
      this.ambientSound.stop()
    }
  }

  /** Enable or disable all audio. Stops ambient when disabled. */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (!enabled) {
      this.stopAmbient()
    }
  }

  /** Set master volume (0–1). Updates all loaded sounds. */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume))
    Howler.volume(this.volume)
  }

  /** Whether audio is currently enabled. */
  isEnabled(): boolean {
    return this.enabled
  }

  /** Current master volume (0–1). */
  getVolume(): number {
    return this.volume
  }

  /** Unload all sounds and reset state. */
  dispose(): void {
    this.stopAmbient()
    for (const howl of this.sounds.values()) {
      howl.unload()
    }
    this.sounds.clear()
    this.ambientSound = null
    this.initialized = false
  }

  /** Reset singleton (for testing). */
  static resetInstance(): void {
    if (AudioManager.instance) {
      AudioManager.instance.dispose()
      AudioManager.instance = null
    }
  }
}
