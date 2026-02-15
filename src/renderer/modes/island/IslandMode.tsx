import React from 'react'

function IslandMode(): React.JSX.Element {
  return (
    <div className="mode-placeholder island-placeholder">
      <div className="placeholder-icon">🏝️</div>
      <h2>Island Mode</h2>
      <p className="placeholder-subtitle">Coming in v0.2!</p>
      <div className="placeholder-description">
        <p>
          A 3D tropical island where <strong>Coco the monkey</strong> 🐵 reacts to your Copilot CLI
          session in real time!
        </p>
        <ul>
          <li>🥥 Tool calls make coconuts fall from palm trees</li>
          <li>🐒 Sub-agents spawn as baby monkeys</li>
          <li>⛈️ Errors cause dramatic thunder storms</li>
          <li>🌅 Session completion triggers a beautiful sunset</li>
        </ul>
      </div>
    </div>
  )
}

export default IslandMode
