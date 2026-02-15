import React, { useState } from 'react'
import { useAppStore } from '../store/app-store'
import type { AppMode } from '@shared/events'

const MODES: { id: AppMode; label: string; description: string }[] = [
  { id: 'vanilla', label: '📊 Vanilla', description: 'Dashboard with event timeline and stats' },
  { id: 'island', label: '🏝️ Island', description: '3D island with Coco the monkey' },
  { id: 'learn', label: '📚 Learn', description: 'Interactive Copilot CLI tutorials' },
  { id: 'ocean', label: '🌊 Ocean', description: '3D ocean with Flipper the dolphin' }
]

function SettingsPanel({ onClose }: { onClose: () => void }): React.JSX.Element {
  const mode = useAppStore((s) => s.mode)
  const setMode = useAppStore((s) => s.setMode)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [audioVolume, setAudioVolume] = useState(50)

  return (
    <div className="settings-screen">
      <div className="settings-header">
        <h2>⚙️ Settings</h2>
        <button className="settings-close" onClick={onClose}>
          ← Back
        </button>
      </div>

      <div className="settings-content">
        <div className="settings-section">
          <h3>Default Mode</h3>
          <div className="settings-modes">
            {MODES.map((m) => (
              <label key={m.id} className={`settings-mode-option ${mode === m.id ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="mode"
                  value={m.id}
                  checked={mode === m.id}
                  onChange={() => setMode(m.id)}
                />
                <span className="mode-label">{m.label}</span>
                <span className="mode-desc">{m.description}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="settings-section">
          <h3>Audio</h3>
          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={audioEnabled}
              onChange={(e) => setAudioEnabled(e.target.checked)}
            />
            <span>Enable sound effects</span>
          </label>
          {audioEnabled && (
            <div className="settings-slider">
              <label>Volume: {audioVolume}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={audioVolume}
                onChange={(e) => setAudioVolume(Number(e.target.value))}
              />
            </div>
          )}
        </div>

        <div className="settings-section">
          <h3>Monitoring</h3>
          <div className="settings-info">
            <div>
              <strong>Copilot config directory</strong>
              <code>~/.copilot</code>
            </div>
            <div>
              <strong>Debug API</strong>
              <code>http://localhost:9876</code>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>About</h3>
          <p className="settings-about">
            🐵 <strong>Cocopilot</strong> — Coco the copilot for copilot!
            <br />A fun experiment in monitoring GitHub Copilot CLI.
            <br />
            <small>Read-only • Local-only • Open source</small>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SettingsPanel
