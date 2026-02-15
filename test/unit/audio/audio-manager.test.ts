import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Howler before importing AudioManager
const mockPlay = vi.fn()
const mockStop = vi.fn()
const mockPlaying = vi.fn(() => false)
const mockUnload = vi.fn()

vi.mock('howler', () => ({
  Howl: class MockHowl {
    play = mockPlay
    stop = mockStop
    playing = mockPlaying
    unload = mockUnload
    constructor() {}
  },
  Howler: { volume: vi.fn() }
}))

// Mock all audio imports
vi.mock('../../../resources/audio/ambient-island.mp3', () => ({ default: 'ambient-island.mp3' }))
vi.mock('../../../resources/audio/ambient-ocean.mp3', () => ({ default: 'ambient-ocean.mp3' }))
vi.mock('../../../resources/audio/monkey-call.mp3', () => ({ default: 'monkey-call.mp3' }))
vi.mock('../../../resources/audio/dolphin-call.mp3', () => ({ default: 'dolphin-call.mp3' }))
vi.mock('../../../resources/audio/bubble.mp3', () => ({ default: 'bubble.mp3' }))
vi.mock('../../../resources/audio/chime.mp3', () => ({ default: 'chime.mp3' }))
vi.mock('../../../resources/audio/typewriter.mp3', () => ({ default: 'typewriter.mp3' }))
vi.mock('../../../resources/audio/coconut-crack.mp3', () => ({ default: 'coconut-crack.mp3' }))
vi.mock('../../../resources/audio/error.mp3', () => ({ default: 'error.mp3' }))
vi.mock('../../../resources/audio/success.mp3', () => ({ default: 'success.mp3' }))
vi.mock('../../../resources/audio/goodbye.mp3', () => ({ default: 'goodbye.mp3' }))

import { AudioManager } from '../../../src/renderer/audio/audio-manager'

describe('AudioManager', () => {
  let mgr: AudioManager

  beforeEach(() => {
    AudioManager.resetInstance()
    vi.clearAllMocks()
    mgr = AudioManager.getInstance()
    mgr.init()
  })

  describe('singleton', () => {
    it('returns the same instance', () => {
      expect(AudioManager.getInstance()).toBe(mgr)
    })

    it('creates new instance after reset', () => {
      AudioManager.resetInstance()
      const newMgr = AudioManager.getInstance()
      expect(newMgr).not.toBe(mgr)
    })
  })

  describe('initialization', () => {
    it('loads all sound definitions', () => {
      const state = mgr.getState()
      expect(state.initialized).toBe(true)
      expect(state.soundCount).toBeGreaterThanOrEqual(11)
    })

    it('is idempotent', () => {
      // init() should not create more Howl instances on second call
      mgr.init()
      // No error thrown, still same sound count
      expect(mgr.getState().soundCount).toBeGreaterThanOrEqual(11)
    })
  })

  describe('play', () => {
    it('does not play when disabled', () => {
      mgr.play('chime')
      expect(mockPlay).not.toHaveBeenCalled()
    })

    it('plays one-shot sound when enabled', () => {
      mgr.setEnabled(true)
      mgr.play('user-message')
      expect(mockPlay).toHaveBeenCalled()
    })

    it('does not play ambient sounds via play()', () => {
      mgr.setEnabled(true)
      mgr.play('ambient-island')
      expect(mockPlay).not.toHaveBeenCalled()
    })

    it('ignores unknown sound IDs', () => {
      mgr.setEnabled(true)
      mgr.play('nonexistent')
      expect(mockPlay).not.toHaveBeenCalled()
    })
  })

  describe('ambient management', () => {
    it('starts island ambient', () => {
      mgr.setEnabled(true)
      mgr.startAmbient('island')
      expect(mockPlay).toHaveBeenCalled()
      expect(mgr.getState().activeAmbientId).toBe('ambient-island')
    })

    it('starts ocean ambient', () => {
      mgr.setEnabled(true)
      mgr.startAmbient('ocean')
      expect(mockPlay).toHaveBeenCalled()
      expect(mgr.getState().activeAmbientId).toBe('ambient-ocean')
    })

    it('stops previous ambient when switching modes', () => {
      mgr.setEnabled(true)
      mockPlaying.mockReturnValue(true)

      mgr.startAmbient('island')
      expect(mgr.getState().activeAmbientId).toBe('ambient-island')

      mgr.startAmbient('ocean')
      expect(mockStop).toHaveBeenCalled()
      expect(mgr.getState().activeAmbientId).toBe('ambient-ocean')
    })

    it('stopAmbient clears active ambient', () => {
      mgr.setEnabled(true)
      mgr.startAmbient('island')
      mockPlaying.mockReturnValue(true)

      mgr.stopAmbient()
      expect(mockStop).toHaveBeenCalled()
      expect(mgr.getState().activeAmbientId).toBeNull()
    })

    it('does not start ambient when disabled', () => {
      mgr.startAmbient('island')
      expect(mockPlay).not.toHaveBeenCalled()
      expect(mgr.getState().activeAmbientId).toBeNull()
    })

    it('stops ambient when audio is disabled', () => {
      mgr.setEnabled(true)
      mgr.startAmbient('island')
      mockPlaying.mockReturnValue(true)

      mgr.setEnabled(false)
      expect(mockStop).toHaveBeenCalled()
      expect(mgr.getState().activeAmbientId).toBeNull()
    })
  })

  describe('volume', () => {
    it('clamps volume to [0, 1]', () => {
      mgr.setVolume(-0.5)
      expect(mgr.getVolume()).toBe(0)

      mgr.setVolume(1.5)
      expect(mgr.getVolume()).toBe(1)
    })
  })

  describe('getState', () => {
    it('returns complete state snapshot', () => {
      const state = mgr.getState()
      expect(state).toHaveProperty('initialized')
      expect(state).toHaveProperty('enabled')
      expect(state).toHaveProperty('volume')
      expect(state).toHaveProperty('soundCount')
      expect(state).toHaveProperty('ambientPlaying')
      expect(state).toHaveProperty('activeAmbientId')
    })
  })

  describe('dispose', () => {
    it('unloads all sounds and resets state', () => {
      mgr.setEnabled(true)
      mgr.startAmbient('island')

      mgr.dispose()
      expect(mgr.getState().initialized).toBe(false)
      expect(mgr.getState().soundCount).toBe(0)
      expect(mgr.getState().activeAmbientId).toBeNull()
    })
  })
})
