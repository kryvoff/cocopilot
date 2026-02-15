import React from 'react'
import { useAppStore } from '../store/app-store'
import type { AppMode } from '@shared/events'

const MODES: { id: AppMode; label: string; description: string }[] = [
  { id: 'vanilla', label: '📊 Vanilla', description: 'Dashboard with event timeline and stats' },
  { id: 'island', label: '🏝️ Island', description: '3D island with Coco the monkey' },
  { id: 'learn', label: '📚 Learn', description: 'Interactive Copilot CLI tutorials' },
  { id: 'ocean', label: '🌊 Ocean', description: '3D ocean with Flipper the dolphin' }
]

function SettingsPanel(): React.JSX.Element {
  const defaultMode = useAppStore((s) => s.defaultMode)
  const setDefaultMode = useAppStore((s) => s.setDefaultMode)
  const audioEnabled = useAppStore((s) => s.audioEnabled)
  const setAudioEnabled = useAppStore((s) => s.setAudioEnabled)
  const audioVolume = useAppStore((s) => s.audioVolume)
  const setAudioVolume = useAppStore((s) => s.setAudioVolume)
  const showCompletedSessions = useAppStore((s) => s.showCompletedSessions)
  const setShowCompletedSessions = useAppStore((s) => s.setShowCompletedSessions)

  return (
    <div className="settings-screen">
      <div className="settings-header">
        <h2>⚙️ Settings</h2>
      </div>

      <div className="settings-content">
        <div className="settings-section">
          <h3>Default Mode</h3>
          <div className="settings-modes">
            {MODES.map((m) => (
              <label key={m.id} className={`settings-mode-option ${defaultMode === m.id ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="mode"
                  value={m.id}
                  checked={defaultMode === m.id}
                  onChange={() => setDefaultMode(m.id)}
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
              <label>Volume: {Math.round(audioVolume * 100)}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(audioVolume * 100)}
                onChange={(e) => setAudioVolume(Number(e.target.value) / 100)}
              />
            </div>
          )}
        </div>

        <div className="settings-section">
          <h3>Sessions</h3>
          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={showCompletedSessions}
              onChange={(e) => setShowCompletedSessions(e.target.checked)}
            />
            <span>Show completed sessions in selector</span>
          </label>
          <p className="settings-hint">When enabled, completed (past) sessions appear in the session dropdown alongside active ones.</p>
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
