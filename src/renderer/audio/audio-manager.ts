import { Howl, Howler } from 'howler'

// Import audio files as URLs via Vite's asset handling.
// Vite resolves these to correct URLs in both dev and production.
import ambientSrc from '../../../resources/audio/ambient-island.mp3'
import monkeyCallSrc from '../../../resources/audio/monkey-call.mp3'
import chimeSrc from '../../../resources/audio/chime.mp3'
import typewriterSrc from '../../../resources/audio/typewriter.mp3'
import coconutCrackSrc from '../../../resources/audio/coconut-crack.mp3'
import errorSrc from '../../../resources/audio/error.mp3'
import successSrc from '../../../resources/audio/success.mp3'
import goodbyeSrc from '../../../resources/audio/goodbye.mp3'

/** Sound definition for registration */
interface SoundDef {
  src: string
  loop?: boolean
  volume?: number
}

/** Registry of all sound IDs to their definitions */
const SOUND_DEFS: Record<string, SoundDef> = {
  ambient: { src: ambientSrc, loop: true, volume: 0.3 },
  'session-start': { src: monkeyCallSrc },
  'user-message': { src: chimeSrc },
  'tool-edit': { src: typewriterSrc },
  'tool-bash': { src: coconutCrackSrc },
  'tool-success': { src: successSrc },
  'tool-error': { src: errorSrc },
  'session-end': { src: goodbyeSrc }
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

    for (const [id, def] of Object.entries(SOUND_DEFS)) {
      const howl = new Howl({
        src: [def.src],
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

  /** Whether sounds have been loaded. */
  isInitialized(): boolean {
    return this.initialized
  }

  /** Snapshot of audio manager state for debugging. */
  getState(): {
    initialized: boolean
    enabled: boolean
    volume: number
    soundCount: number
    ambientPlaying: boolean
  } {
    return {
      initialized: this.initialized,
      enabled: this.enabled,
      volume: this.volume,
      soundCount: this.sounds.size,
      ambientPlaying: this.ambientSound?.playing() ?? false
    }
  }

  /** Reset singleton (for testing). */
  static resetInstance(): void {
    if (AudioManager.instance) {
      AudioManager.instance.dispose()
      AudioManager.instance = null
    }
  }
}
