import React, { useState, useCallback } from 'react'
import { Howl } from 'howler'

// Import audio files as URLs via Vite
import ambientIslandSrc from '../../../../resources/audio/ambient-island.mp3'
import ambientOceanSrc from '../../../../resources/audio/ambient-ocean.mp3'
import monkeyCallSrc from '../../../../resources/audio/monkey-call.mp3'
import dolphinCallSrc from '../../../../resources/audio/dolphin-call.mp3'
import bubbleSrc from '../../../../resources/audio/bubble.mp3'
import chimeSrc from '../../../../resources/audio/chime.mp3'
import typewriterSrc from '../../../../resources/audio/typewriter.mp3'
import coconutCrackSrc from '../../../../resources/audio/coconut-crack.mp3'
import errorSrc from '../../../../resources/audio/error.mp3'
import successSrc from '../../../../resources/audio/success.mp3'
import goodbyeSrc from '../../../../resources/audio/goodbye.mp3'

// Import SVG visualizations as URLs
import ambientIslandWaveform from '../../../../resources/audio/visualizations/ambient-island-waveform.svg'
import ambientIslandSpectrogram from '../../../../resources/audio/visualizations/ambient-island-spectrogram.svg'
import ambientOceanWaveform from '../../../../resources/audio/visualizations/ambient-ocean-waveform.svg'
import ambientOceanSpectrogram from '../../../../resources/audio/visualizations/ambient-ocean-spectrogram.svg'
import monkeyCallWaveform from '../../../../resources/audio/visualizations/monkey-call-waveform.svg'
import monkeyCallSpectrogram from '../../../../resources/audio/visualizations/monkey-call-spectrogram.svg'
import dolphinCallWaveform from '../../../../resources/audio/visualizations/dolphin-call-waveform.svg'
import dolphinCallSpectrogram from '../../../../resources/audio/visualizations/dolphin-call-spectrogram.svg'
import bubbleWaveform from '../../../../resources/audio/visualizations/bubble-waveform.svg'
import bubbleSpectrogram from '../../../../resources/audio/visualizations/bubble-spectrogram.svg'
import chimeWaveform from '../../../../resources/audio/visualizations/chime-waveform.svg'
import chimeSpectrogram from '../../../../resources/audio/visualizations/chime-spectrogram.svg'
import typewriterWaveform from '../../../../resources/audio/visualizations/typewriter-waveform.svg'
import typewriterSpectrogram from '../../../../resources/audio/visualizations/typewriter-spectrogram.svg'
import coconutCrackWaveform from '../../../../resources/audio/visualizations/coconut-crack-waveform.svg'
import coconutCrackSpectrogram from '../../../../resources/audio/visualizations/coconut-crack-spectrogram.svg'
import errorWaveform from '../../../../resources/audio/visualizations/error-waveform.svg'
import errorSpectrogram from '../../../../resources/audio/visualizations/error-spectrogram.svg'
import successWaveform from '../../../../resources/audio/visualizations/success-waveform.svg'
import successSpectrogram from '../../../../resources/audio/visualizations/success-spectrogram.svg'
import goodbyeWaveform from '../../../../resources/audio/visualizations/goodbye-waveform.svg'
import goodbyeSpectrogram from '../../../../resources/audio/visualizations/goodbye-spectrogram.svg'

interface SoundEntry {
  id: string
  name: string
  icon: string
  duration: string
  usedFor: string
  technique: string
  src: string
  waveform: string
  spectrogram: string
}

const SOUNDS: SoundEntry[] = [
  {
    id: 'ambient-island', name: 'Ambient Island', icon: '🏝️',
    duration: '30s loop', usedFor: 'Island mode background (waves + bird chirps)',
    technique: 'Filtered noise + sine sweeps',
    src: ambientIslandSrc, waveform: ambientIslandWaveform, spectrogram: ambientIslandSpectrogram
  },
  {
    id: 'ambient-ocean', name: 'Ambient Ocean', icon: '🌊',
    duration: '16s loop', usedFor: 'Ocean mode background (deep rumble + bubbles)',
    technique: 'Low-pass noise + sine swells',
    src: ambientOceanSrc, waveform: ambientOceanWaveform, spectrogram: ambientOceanSpectrogram
  },
  {
    id: 'monkey-call', name: 'Monkey Call', icon: '🐒',
    duration: '1.5s', usedFor: 'Session start (Island mode)',
    technique: 'Frequency sweeps + harmonics',
    src: monkeyCallSrc, waveform: monkeyCallWaveform, spectrogram: monkeyCallSpectrogram
  },
  {
    id: 'dolphin-call', name: 'Dolphin Call', icon: '🐬',
    duration: '0.8s', usedFor: 'Session start (Ocean mode)',
    technique: 'Sine wave frequency modulation',
    src: dolphinCallSrc, waveform: dolphinCallWaveform, spectrogram: dolphinCallSpectrogram
  },
  {
    id: 'bubble', name: 'Bubble', icon: '🫧',
    duration: '0.2s', usedFor: 'Bubble effect sounds',
    technique: 'Upward sine sweep (400→1200 Hz)',
    src: bubbleSrc, waveform: bubbleWaveform, spectrogram: bubbleSpectrogram
  },
  {
    id: 'chime', name: 'Chime', icon: '🔔',
    duration: '1.2s', usedFor: 'User message / notification',
    technique: 'Harmonics at 880, 1760, 2640, 3520 Hz',
    src: chimeSrc, waveform: chimeWaveform, spectrogram: chimeSpectrogram
  },
  {
    id: 'typewriter', name: 'Typewriter', icon: '⌨️',
    duration: '1.5s', usedFor: 'Edit/create tool execution',
    technique: 'Filtered noise bursts',
    src: typewriterSrc, waveform: typewriterWaveform, spectrogram: typewriterSpectrogram
  },
  {
    id: 'coconut-crack', name: 'Coconut Crack', icon: '🥥',
    duration: '0.8s', usedFor: 'Bash tool execution',
    technique: 'Sharp transient + decay',
    src: coconutCrackSrc, waveform: coconutCrackWaveform, spectrogram: coconutCrackSpectrogram
  },
  {
    id: 'error', name: 'Error', icon: '❌',
    duration: '0.6s', usedFor: 'Tool execution failure',
    technique: 'Descending sine tone',
    src: errorSrc, waveform: errorWaveform, spectrogram: errorSpectrogram
  },
  {
    id: 'success', name: 'Success', icon: '✅',
    duration: '0.8s', usedFor: 'Tool execution success / turn end',
    technique: 'Ascending sine arpeggio',
    src: successSrc, waveform: successWaveform, spectrogram: successSpectrogram
  },
  {
    id: 'goodbye', name: 'Goodbye', icon: '👋',
    duration: '2.5s', usedFor: 'Session shutdown',
    technique: 'Descending chords with reverb',
    src: goodbyeSrc, waveform: goodbyeWaveform, spectrogram: goodbyeSpectrogram
  }
]

type VizMode = 'waveform' | 'spectrogram'

const styles = {
  container: {
    padding: 20,
    maxWidth: 900,
    margin: '0 auto'
  } as React.CSSProperties,
  intro: {
    color: '#a0a0a0',
    lineHeight: 1.6,
    marginBottom: 24,
    fontSize: 14
  } as React.CSSProperties,
  vizToggle: {
    display: 'flex',
    gap: 0,
    marginBottom: 20
  } as React.CSSProperties,
  vizButton: {
    padding: '6px 16px',
    fontSize: 13,
    cursor: 'pointer',
    border: '1px solid #2a2a4a',
    background: 'transparent',
    color: '#a0a0a0'
  } as React.CSSProperties,
  vizButtonActive: {
    background: '#4ecca3',
    color: '#1a1a2e',
    borderColor: '#4ecca3'
  } as React.CSSProperties,
  soundCard: {
    background: '#16213e',
    border: '1px solid #2a2a4a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    cursor: 'pointer',
    transition: 'border-color 0.15s'
  } as React.CSSProperties,
  soundCardPlaying: {
    borderColor: '#4ecca3'
  } as React.CSSProperties,
  soundHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8
  } as React.CSSProperties,
  soundName: {
    fontSize: 16,
    fontWeight: 600,
    color: '#e0e0e0'
  } as React.CSSProperties,
  soundDuration: {
    fontSize: 12,
    color: '#a0a0a0',
    background: '#1a1a2e',
    padding: '2px 8px',
    borderRadius: 4
  } as React.CSSProperties,
  playButton: {
    marginLeft: 'auto',
    padding: '4px 12px',
    fontSize: 13,
    cursor: 'pointer',
    border: '1px solid #4ecca3',
    background: 'transparent',
    color: '#4ecca3',
    borderRadius: 4
  } as React.CSSProperties,
  soundMeta: {
    fontSize: 13,
    color: '#a0a0a0',
    marginBottom: 8,
    lineHeight: 1.5
  } as React.CSSProperties,
  vizImage: {
    width: '100%',
    height: 'auto',
    borderRadius: 4,
    marginTop: 8
  } as React.CSSProperties,
  techniqueRow: {
    fontSize: 12,
    color: '#888',
    fontFamily: "'SF Mono', 'Fira Code', monospace"
  } as React.CSSProperties
}

function SoundsTab(): React.JSX.Element {
  const [vizMode, setVizMode] = useState<VizMode>('waveform')
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [currentHowl, setCurrentHowl] = useState<Howl | null>(null)

  const playSound = useCallback((sound: SoundEntry) => {
    // Stop any currently playing sound
    if (currentHowl) {
      currentHowl.stop()
    }

    if (playingId === sound.id) {
      setPlayingId(null)
      setCurrentHowl(null)
      return
    }

    const howl = new Howl({
      src: [sound.src],
      volume: 0.5,
      onend: () => {
        setPlayingId(null)
        setCurrentHowl(null)
      }
    })
    howl.play()
    setPlayingId(sound.id)
    setCurrentHowl(howl)
  }, [playingId, currentHowl])

  return (
    <div style={styles.container}>
      <h2 style={{ color: '#4ecca3', marginBottom: 8 }}>🔊 Sound Library</h2>
      <p style={styles.intro}>
        All 11 sounds are procedurally generated using pure Python — sine waves, filtered noise,
        frequency sweeps, and envelopes. No external audio libraries, just math and the standard
        library&apos;s <code style={{ color: '#4ecca3', background: '#1a1a2e', padding: '1px 4px', borderRadius: 3 }}>wave</code> module.
        Click any sound to play it.
      </p>

      <div style={styles.vizToggle}>
        <button
          style={{ ...styles.vizButton, borderRadius: '4px 0 0 4px', ...(vizMode === 'waveform' ? styles.vizButtonActive : {}) }}
          onClick={() => setVizMode('waveform')}
        >
          Waveform
        </button>
        <button
          style={{ ...styles.vizButton, borderRadius: '0 4px 4px 0', ...(vizMode === 'spectrogram' ? styles.vizButtonActive : {}) }}
          onClick={() => setVizMode('spectrogram')}
        >
          Spectrogram
        </button>
      </div>

      {SOUNDS.map((sound) => (
        <div
          key={sound.id}
          style={{ ...styles.soundCard, ...(playingId === sound.id ? styles.soundCardPlaying : {}) }}
          onClick={() => playSound(sound)}
        >
          <div style={styles.soundHeader}>
            <span style={{ fontSize: 24 }}>{sound.icon}</span>
            <span style={styles.soundName}>{sound.name}</span>
            <span style={styles.soundDuration}>{sound.duration}</span>
            <button
              style={styles.playButton}
              onClick={(e) => { e.stopPropagation(); playSound(sound) }}
            >
              {playingId === sound.id ? '⏹ Stop' : '▶ Play'}
            </button>
          </div>
          <div style={styles.soundMeta}>{sound.usedFor}</div>
          <div style={styles.techniqueRow}>Synthesis: {sound.technique}</div>
          <img
            src={vizMode === 'waveform' ? sound.waveform : sound.spectrogram}
            alt={`${sound.name} ${vizMode}`}
            style={styles.vizImage}
          />
        </div>
      ))}
    </div>
  )
}

export default SoundsTab
