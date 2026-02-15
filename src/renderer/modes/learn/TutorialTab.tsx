import React from 'react'

const LIFECYCLE_STEPS = [
  { type: 'session.start', icon: '🚀', label: 'Session Start', desc: 'CLI launches, creates session directory' },
  { type: 'user.message', icon: '💬', label: 'User Message', desc: 'You type a prompt' },
  { type: 'assistant.turn_start', icon: '🤔', label: 'Turn Start', desc: 'Agent begins thinking' },
  { type: 'tool.*', icon: '⚙️', label: 'Tool Calls', desc: 'grep, edit, bash, view...' },
  { type: 'assistant.message', icon: '🤖', label: 'Response', desc: 'Agent responds with text' },
  { type: 'assistant.turn_end', icon: '✅', label: 'Turn End', desc: 'Agent finishes its turn' },
  { type: 'session.shutdown', icon: '👋', label: 'Shutdown', desc: 'Session ends, usage recorded' }
]

const CONCEPTS = [
  {
    title: 'Agent Modes',
    icon: '🎯',
    text: 'Copilot CLI supports interactive, plan, autopilot, and shell modes. Each mode controls how much autonomy the agent has.'
  },
  {
    title: 'Tool Execution',
    icon: '🛠️',
    text: 'The agent uses tools like grep, edit, bash, and view to read and modify your codebase. Each tool call produces start/complete event pairs.'
  },
  {
    title: 'Sub-Agents',
    icon: '🐒',
    text: 'Complex tasks spawn sub-agents (explore, task, general-purpose) that run in parallel. Each sub-agent has its own lifecycle events.'
  },
  {
    title: 'Usage Tracking',
    icon: '📊',
    text: 'Every API call records token usage (input, output, cache). The session shutdown event contains total cost and request counts.'
  },
  {
    title: 'Event Sourcing',
    icon: '📝',
    text: 'All activity is recorded as JSONL events in ~/.copilot/session-state/<id>/events.jsonl. This is the primary data source Cocopilot monitors.'
  },
  {
    title: 'Checkpoints & Rewind',
    icon: '⏪',
    text: 'The CLI periodically saves snapshots so it can rewind to earlier states. Truncation events fire when the context window fills up.'
  }
]

const styles = {
  container: {
    maxWidth: 800,
    margin: '0 auto',
    padding: '24px 16px'
  } as React.CSSProperties,
  section: {
    marginBottom: 32
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 12,
    color: '#e0e0e0'
  } as React.CSSProperties,
  introText: {
    fontSize: 14,
    lineHeight: 1.7,
    color: '#a0a0a0',
    marginBottom: 8
  } as React.CSSProperties,
  lifecycle: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 4,
    flexWrap: 'wrap' as const,
    padding: '16px 0'
  } as React.CSSProperties,
  lifecycleStep: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 6,
    padding: '12px 8px',
    background: '#16213e',
    border: '1px solid #2a2a4a',
    borderRadius: 8,
    minWidth: 90,
    flex: 1,
    textAlign: 'center' as const
  } as React.CSSProperties,
  stepIcon: {
    fontSize: 24
  } as React.CSSProperties,
  stepLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#e0e0e0'
  } as React.CSSProperties,
  stepDesc: {
    fontSize: 11,
    color: '#a0a0a0'
  } as React.CSSProperties,
  stepType: {
    fontSize: 10,
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    color: '#4ecca3',
    marginTop: 2
  } as React.CSSProperties,
  arrow: {
    display: 'flex',
    alignItems: 'center',
    color: '#4ecca3',
    fontSize: 18,
    padding: '12px 0'
  } as React.CSSProperties,
  conceptGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 12
  } as React.CSSProperties,
  conceptCard: {
    background: '#16213e',
    border: '1px solid #2a2a4a',
    borderRadius: 8,
    padding: '14px 16px'
  } as React.CSSProperties,
  conceptTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#e0e0e0',
    marginBottom: 6
  } as React.CSSProperties,
  conceptText: {
    fontSize: 12,
    lineHeight: 1.6,
    color: '#a0a0a0'
  } as React.CSSProperties,
  codeBlock: {
    background: '#0f0f1a',
    border: '1px solid #2a2a4a',
    borderRadius: 6,
    padding: '12px 16px',
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    fontSize: 12,
    color: '#a0a0a0',
    overflowX: 'auto' as const,
    whiteSpace: 'pre' as const,
    lineHeight: 1.6
  } as React.CSSProperties
}

function TutorialTab(): React.JSX.Element {
  return (
    <div style={styles.container}>
      {/* Intro */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>What is Copilot CLI?</h3>
        <p style={styles.introText}>
          GitHub Copilot CLI is a terminal-based AI coding assistant. It runs as a single process,
          communicates with LLM providers via HTTPS, and records all activity as JSON events.
          Cocopilot monitors these events in real-time to visualize what the agent is doing.
        </p>
        <p style={styles.introText}>
          Each session creates a directory at <code style={{ color: '#4ecca3' }}>~/.copilot/session-state/&lt;uuid&gt;/</code> containing
          an <code style={{ color: '#4ecca3' }}>events.jsonl</code> file — one JSON object per line.
        </p>
      </div>

      {/* Session Lifecycle */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Session Lifecycle</h3>
        <p style={styles.introText}>
          A typical session flows through these stages. The user and agent take turns,
          with tool calls happening during agent turns.
        </p>
        <div style={styles.lifecycle}>
          {LIFECYCLE_STEPS.map((step, i) => (
            <React.Fragment key={step.type}>
              {i > 0 && <div style={styles.arrow}>→</div>}
              <div style={styles.lifecycleStep}>
                <span style={styles.stepIcon}>{step.icon}</span>
                <span style={styles.stepLabel}>{step.label}</span>
                <span style={styles.stepDesc}>{step.desc}</span>
                <span style={styles.stepType}>{step.type}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Event Format */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Event Format</h3>
        <p style={styles.introText}>
          Every event in the JSONL file follows this envelope structure:
        </p>
        <pre style={styles.codeBlock}>{`{
  "type": "tool.execution_start",
  "id": "evt-004",
  "timestamp": "2026-01-15T10:00:05.000Z",
  "parentId": "evt-003",
  "ephemeral": false,
  "data": {
    "toolName": "grep",
    "toolCallId": "tc-001",
    "arguments": { "pattern": "app.get", "glob": "src/**/*.ts" }
  }
}`}</pre>
      </div>

      {/* Key Concepts */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Key Concepts</h3>
        <div style={styles.conceptGrid}>
          {CONCEPTS.map((c) => (
            <div key={c.title} style={styles.conceptCard}>
              <div style={styles.conceptTitle}>{c.icon} {c.title}</div>
              <div style={styles.conceptText}>{c.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TutorialTab
