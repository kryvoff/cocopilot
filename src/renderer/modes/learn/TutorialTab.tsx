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
  },
  {
    title: 'Autopilot Mode',
    icon: '🚀',
    text: 'In autopilot mode, Copilot CLI runs fully autonomously — accepting all tool calls without confirmation. Ideal for well-defined tasks like "fix all lint errors" or "add tests for this module".'
  },
  {
    title: 'Fleet Mode',
    icon: '🚢',
    text: 'Fleet mode dispatches multiple sub-agents in parallel to work on independent tasks simultaneously. A coordinator agent decomposes work into todos and assigns them to specialized workers.'
  },
  {
    title: 'Plan Mode',
    icon: '📋',
    text: 'Plan mode creates a structured plan before implementing. The agent writes a plan.md file, breaks work into todos with dependencies, and only starts coding when instructed.'
  },
  {
    title: 'Background Agents',
    icon: '🔄',
    text: 'Sub-agents can run in the background while the main agent continues working. Use read_agent to check status and retrieve results. Enables true parallel execution.'
  },
  {
    title: 'Context Windows',
    icon: '🪟',
    text: 'Each agent has a limited context window (tokens). When it fills up, the CLI creates checkpoints and truncates older context. The agent can still access history via summaries.'
  },
  {
    title: 'Model Selection',
    icon: '🤖',
    text: 'Different agent types use different models: explore agents use fast/cheap models (Haiku), while general-purpose agents use premium models (Sonnet, Opus). You can override with the model parameter.'
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
          GitHub Copilot CLI is a terminal-based AI coding assistant that runs as an autonomous agent.
          It supports interactive, plan, autopilot, and fleet modes — from simple Q&amp;A to fully
          autonomous multi-agent task execution. All activity is recorded as JSON events that
          Cocopilot monitors in real-time.
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

      {/* Agent Architecture */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Agent Architecture</h3>
        <p style={styles.introText}>
          Copilot CLI uses a hierarchical agent system. The main agent coordinates work
          and can spawn specialized sub-agents for specific tasks.
        </p>
        <div style={styles.conceptGrid}>
          <div style={{...styles.conceptCard, borderLeft: '3px solid #4ecca3'}}>
            <div style={styles.conceptTitle}>🎯 Main Agent</div>
            <div style={styles.conceptText}>
              The primary agent that receives user messages and coordinates work.
              Has access to all tools and can dispatch sub-agents.
            </div>
          </div>
          <div style={{...styles.conceptCard, borderLeft: '3px solid #5b9bd5'}}>
            <div style={styles.conceptTitle}>🔍 Explore Agent</div>
            <div style={styles.conceptText}>
              Fast, lightweight agent for searching and reading code. Uses Haiku model.
              Can run in parallel. Returns focused answers under 300 words.
            </div>
          </div>
          <div style={{...styles.conceptCard, borderLeft: '3px solid #e8a838'}}>
            <div style={styles.conceptTitle}>⚡ Task Agent</div>
            <div style={styles.conceptText}>
              Executes commands (tests, builds, lints). Returns brief summary on success,
              full output on failure. Keeps main context clean.
            </div>
          </div>
          <div style={{...styles.conceptCard, borderLeft: '3px solid #c07ef0'}}>
            <div style={styles.conceptTitle}>🧠 General-Purpose Agent</div>
            <div style={styles.conceptText}>
              Full-capability agent with complete toolset and premium model (Sonnet).
              Runs in a separate context window for complex multi-step tasks.
            </div>
          </div>
          <div style={{...styles.conceptCard, borderLeft: '3px solid #e94560'}}>
            <div style={styles.conceptTitle}>👀 Code Review Agent</div>
            <div style={styles.conceptText}>
              Reviews code changes with high signal-to-noise ratio. Only surfaces genuine
              bugs, security issues, and logic errors. Never comments on style.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TutorialTab
