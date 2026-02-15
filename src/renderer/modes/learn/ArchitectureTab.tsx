import React from 'react'

const PIPELINE_STEPS = [
  {
    num: 1,
    icon: '📁',
    title: 'File Watcher',
    desc: 'Watches ~/.copilot/session-state/ for new/modified events.jsonl files using chokidar. Detects new sessions automatically when a Copilot CLI starts.'
  },
  {
    num: 2,
    icon: '📝',
    title: 'Event Parser',
    desc: 'Parses each JSONL line with Zod schemas. Unknown event types are tracked but never crash the app — forward compatibility is built in.'
  },
  {
    num: 3,
    icon: '💾',
    title: 'SQLite Storage',
    desc: 'Events persisted to cocopilot.db via better-sqlite3. Sessions, events, and usage records stored for history and offline analysis.'
  },
  {
    num: 4,
    icon: '🔄',
    title: 'IPC Bridge',
    desc: 'Main process sends events to renderer via Electron IPC (contextBridge). Type-safe channels ensure reliable communication between processes.'
  },
  {
    num: 5,
    icon: '📊',
    title: 'Zustand Store',
    desc: 'Renderer state management. Incoming events trigger UI updates across all modes simultaneously — dashboard, 3D scenes, and audio.'
  },
  {
    num: 6,
    icon: '🎨',
    title: 'Visualization',
    desc: 'Each mode renders events differently: Vanilla shows charts and timelines, Island animates Coco the monkey, Ocean animates Flipper the dolphin.'
  }
]

const DEBUG_ENDPOINTS = [
  { method: 'GET', path: '/api/state', desc: 'Full monitoring state (sessions, processes, config)' },
  { method: 'GET', path: '/api/sessions', desc: 'All tracked sessions with metadata' },
  { method: 'GET', path: '/api/events/:id', desc: 'Events for a specific session' },
  { method: 'GET', path: '/api/processes', desc: 'Currently running Copilot CLI processes' },
  { method: 'GET', path: '/api/renderer-state', desc: 'Renderer Zustand store snapshot' },
  { method: 'POST', path: '/api/playback/start', desc: 'Start session playback from recorded events' }
]

const colors = {
  green: '#4ecca3',
  blue: '#5b9bd5',
  orange: '#e8a838',
  purple: '#c07ef0',
  gray: '#a0a0a0',
  red: '#e94560',
  bg: '#16213e',
  border: '#2a2a4a',
  text: '#e0e0e0',
  textMuted: '#a0a0a0',
  dark: '#0f0f1a'
}

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
    color: colors.text
  } as React.CSSProperties,
  introText: {
    fontSize: 14,
    lineHeight: 1.7,
    color: colors.textMuted,
    marginBottom: 8
  } as React.CSSProperties,
  // Architecture diagram
  diagramOuter: {
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    padding: 20,
    background: colors.dark,
    overflow: 'auto'
  } as React.CSSProperties,
  electronBox: {
    border: `2px solid ${colors.border}`,
    borderRadius: 10,
    padding: 16,
    marginBottom: 0,
    position: 'relative' as const
  } as React.CSSProperties,
  electronLabel: {
    fontSize: 14,
    fontWeight: 700,
    color: colors.text,
    marginBottom: 14,
    textAlign: 'center' as const
  } as React.CSSProperties,
  processRow: {
    display: 'flex',
    gap: 12,
    marginBottom: 14
  } as React.CSSProperties,
  archBox: (borderColor: string) =>
    ({
      flex: 1,
      border: `2px solid ${borderColor}`,
      borderRadius: 8,
      padding: '12px 14px',
      background: colors.bg,
      transition: 'transform 0.15s, box-shadow 0.15s',
      cursor: 'default'
    }) as React.CSSProperties,
  archBoxTitle: (color: string) =>
    ({
      fontSize: 13,
      fontWeight: 700,
      color,
      marginBottom: 8,
      textAlign: 'center' as const
    }) as React.CSSProperties,
  archItem: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 1.6,
    fontFamily: "'SF Mono', 'Fira Code', monospace"
  } as React.CSSProperties,
  arrowDown: {
    display: 'flex',
    justifyContent: 'center',
    padding: '6px 0',
    fontSize: 18,
    color: colors.green,
    letterSpacing: 2
  } as React.CSSProperties,
  arrowRight: {
    display: 'flex',
    alignItems: 'center',
    color: colors.green,
    fontSize: 18,
    padding: '0 2px',
    flexShrink: 0
  } as React.CSSProperties,
  arrowBetween: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '8px 0',
    gap: 2
  } as React.CSSProperties,
  arrowLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic' as const
  } as React.CSSProperties,
  externalBox: (borderColor: string) =>
    ({
      border: `2px solid ${borderColor}`,
      borderRadius: 8,
      padding: '12px 16px',
      background: colors.bg,
      textAlign: 'center' as const,
      maxWidth: 280,
      margin: '0 auto',
      transition: 'transform 0.15s, box-shadow 0.15s',
      cursor: 'default'
    }) as React.CSSProperties,
  // Pipeline steps
  pipelineStep: {
    display: 'flex',
    gap: 14,
    padding: '14px 16px',
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'flex-start'
  } as React.CSSProperties,
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: colors.green,
    color: colors.dark,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0
  } as React.CSSProperties,
  stepIcon: {
    fontSize: 22,
    flexShrink: 0,
    lineHeight: 1.3
  } as React.CSSProperties,
  stepContent: {
    flex: 1
  } as React.CSSProperties,
  stepTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.text,
    marginBottom: 4
  } as React.CSSProperties,
  stepDesc: {
    fontSize: 12,
    lineHeight: 1.6,
    color: colors.textMuted
  } as React.CSSProperties,
  // Process monitor
  monitorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 12
  } as React.CSSProperties,
  monitorCard: {
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    padding: '14px 16px'
  } as React.CSSProperties,
  monitorTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.text,
    marginBottom: 6
  } as React.CSSProperties,
  monitorText: {
    fontSize: 12,
    lineHeight: 1.6,
    color: colors.textMuted
  } as React.CSSProperties,
  // Debug API
  endpointRow: {
    display: 'flex',
    gap: 10,
    padding: '10px 14px',
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    marginBottom: 6,
    alignItems: 'center'
  } as React.CSSProperties,
  methodBadge: (method: string) =>
    ({
      fontSize: 10,
      fontWeight: 700,
      fontFamily: "'SF Mono', 'Fira Code', monospace",
      padding: '2px 8px',
      borderRadius: 4,
      background: method === 'GET' ? '#1a3a2a' : '#3a2a1a',
      color: method === 'GET' ? colors.green : colors.orange,
      flexShrink: 0
    }) as React.CSSProperties,
  endpointPath: {
    fontSize: 12,
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    color: colors.text,
    flexShrink: 0,
    minWidth: 160
  } as React.CSSProperties,
  endpointDesc: {
    fontSize: 12,
    color: colors.textMuted
  } as React.CSSProperties,
  codeInline: {
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    color: colors.green,
    fontSize: 12
  } as React.CSSProperties
}

function ArchitectureTab(): React.JSX.Element {
  return (
    <div style={styles.container}>
      {/* Section 1: Architecture Diagram */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Cocopilot Architecture</h3>
        <p style={styles.introText}>
          Cocopilot is an Electron app with two processes. The main process watches files and
          manages data; the renderer process visualizes everything with React, Three.js, and audio.
        </p>

        <div style={styles.diagramOuter}>
          {/* 1. Copilot CLI at the top — source of all data */}
          <div style={styles.externalBox(colors.red)}>
            <div style={styles.archBoxTitle(colors.red)}>GitHub Copilot CLI</div>
            <div style={styles.archItem}>copilot agent</div>
          </div>

          {/* Arrow: writes events */}
          <div style={styles.arrowBetween}>
            <div style={{ fontSize: 18, color: colors.green }}>▼</div>
            <div style={styles.arrowLabel}>writes events to disk</div>
          </div>

          {/* 2. File system — event log */}
          <div style={styles.externalBox(colors.gray)}>
            <div style={styles.archBoxTitle(colors.gray)}>~/.copilot/</div>
            <div style={styles.archItem}>session-state/&lt;uuid&gt;/</div>
            <div style={styles.archItem}>events.jsonl &nbsp; session.db</div>
          </div>

          {/* Arrow: watches files */}
          <div style={styles.arrowBetween}>
            <div style={{ fontSize: 18, color: colors.green }}>▼</div>
            <div style={styles.arrowLabel}>Cocopilot watches files</div>
          </div>

          {/* 3. Electron App container */}
          <div style={styles.electronBox}>
            <div style={styles.electronLabel}>Cocopilot Electron App</div>

            {/* Three main boxes */}
            <div style={styles.processRow}>
              <div style={styles.archBox(colors.green)}>
                <div style={styles.archBoxTitle(colors.green)}>Main Process</div>
                <div style={styles.archItem}>• FileWatcher</div>
                <div style={styles.archItem}>• ProcessMonitor</div>
                <div style={styles.archItem}>• SQLite DB</div>
                <div style={styles.archItem}>• Debug API</div>
              </div>

              <div style={styles.arrowRight}>▶</div>

              <div style={styles.archBox(colors.blue)}>
                <div style={styles.archBoxTitle(colors.blue)}>Renderer Process</div>
                <div style={styles.archItem}>• React UI</div>
                <div style={styles.archItem}>• Zustand Store</div>
                <div style={styles.archItem}>• Nivo Charts</div>
                <div style={styles.archItem}>• Howler Audio</div>
              </div>

              <div style={styles.arrowRight}>▶</div>

              <div style={styles.archBox(colors.orange)}>
                <div style={styles.archBoxTitle(colors.orange)}>3D Scene</div>
                <div style={styles.archItem}>• Three.js / R3F</div>
                <div style={styles.archItem}>• Island Mode</div>
                <div style={styles.archItem}>• Ocean Mode</div>
                <div style={styles.archItem}>• Coco 🐵 Flipper 🐬</div>
              </div>
            </div>

            {/* Debug server */}
            <div style={styles.arrowDown}>▼</div>
            <div style={{ maxWidth: 280 }}>
              <div style={styles.archBox(colors.purple)}>
                <div style={styles.archBoxTitle(colors.purple)}>Debug Server</div>
                <div style={styles.archItem}>http://localhost:9876</div>
                <div style={styles.archItem}>/api/state &nbsp;/api/events</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Data Pipeline */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Data Pipeline</h3>
        <p style={styles.introText}>
          Events flow through six stages from the file system to your screen.
          Each stage is designed to be resilient — errors at any stage are logged, never fatal.
        </p>
        {PIPELINE_STEPS.map((step) => (
          <div key={step.num} style={styles.pipelineStep}>
            <div style={styles.stepNum}>{step.num}</div>
            <div style={styles.stepIcon}>{step.icon}</div>
            <div style={styles.stepContent}>
              <div style={styles.stepTitle}>{step.title}</div>
              <div style={styles.stepDesc}>{step.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Section 3: Process Monitor */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Process Monitor</h3>
        <p style={styles.introText}>
          Cocopilot detects running Copilot CLI processes to show live status and resource usage.
          If multiple CLIs are running, the app shows a count and lets you select which one to monitor.
        </p>
        <div style={styles.monitorGrid}>
          <div style={styles.monitorCard}>
            <div style={styles.monitorTitle}>🔍 Process Discovery</div>
            <div style={styles.monitorText}>
              Polls <code style={styles.codeInline}>ps</code> every 5 seconds looking for
              Copilot CLI processes by their command-line signature.
            </div>
          </div>
          <div style={styles.monitorCard}>
            <div style={styles.monitorTitle}>📂 Session Mapping</div>
            <div style={styles.monitorText}>
              Uses <code style={styles.codeInline}>lsof</code> to map each PID to its session
              directory, connecting processes to their event streams.
            </div>
          </div>
          <div style={styles.monitorCard}>
            <div style={styles.monitorTitle}>📈 Resource Tracking</div>
            <div style={styles.monitorText}>
              Tracks CPU usage, memory (RSS), and thread count for each process.
              Displayed in the dashboard and used by 3D scene animations.
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Debug API */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Debug API</h3>
        <p style={styles.introText}>
          A built-in HTTP server at{' '}
          <code style={styles.codeInline}>localhost:9876</code> exposes internal state for
          debugging and agent-driven testing. Used by Playwright E2E tests to verify app behavior.
        </p>
        {DEBUG_ENDPOINTS.map((ep) => (
          <div key={ep.path} style={styles.endpointRow}>
            <span style={styles.methodBadge(ep.method)}>{ep.method}</span>
            <span style={styles.endpointPath}>{ep.path}</span>
            <span style={styles.endpointDesc}>{ep.desc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ArchitectureTab
