import React from 'react'

function OceanMode(): React.JSX.Element {
  return (
    <div className="mode-placeholder ocean-placeholder">
      <div className="placeholder-icon">🌊</div>
      <h2>Ocean Mode</h2>
      <p className="placeholder-subtitle">Coming in v0.3!</p>
      <div className="placeholder-description">
        <p>
          A serene 3D ocean scene with <strong>Flipper the dolphin</strong> 🐬 swimming through your
          code events!
        </p>
        <ul>
          <li>🐬 Flipper jumps for successful completions</li>
          <li>🌊 Calm waves during idle time</li>
          <li>🐙 Tool calls summon helpful octopi</li>
          <li>🌅 Beautiful ambient ocean soundtrack</li>
        </ul>
      </div>
    </div>
  )
}

export default OceanMode
