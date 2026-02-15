import React from 'react'

function LearnMode(): React.JSX.Element {
  return (
    <div className="mode-placeholder learn-placeholder">
      <div className="placeholder-icon">📚</div>
      <h2>Learn Mode</h2>
      <p className="placeholder-subtitle">Coming in v0.2.5!</p>
      <div className="placeholder-description">
        <p>Interactive tutorials that teach you how GitHub Copilot CLI works under the hood!</p>
        <ul>
          <li>🎬 Session playback — replay your sessions step by step</li>
          <li>📖 Event types explained — what each event means</li>
          <li>🤖 Agent modes — interactive, plan, autopilot, shell</li>
          <li>🛠️ Tool execution — how Copilot uses tools</li>
          <li>🚢 Fleet command — sub-agents and parallelism</li>
        </ul>
      </div>
    </div>
  )
}

export default LearnMode
