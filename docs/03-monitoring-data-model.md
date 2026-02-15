# Monitoring & Data Model

## Data Sources

### 1. File System Watching (Primary)

Watch `~/.copilot/session-state/` for:
- New session directories appearing (new sessions started)
- Changes to `events.jsonl` (new events appended)
- Changes to `workspace.yaml` (session metadata updates)

**Implementation**: Use `chokidar` (cross-platform file watcher) in the main process.

```typescript
// Pseudo-code for monitoring
const watcher = chokidar.watch(path.join(copilotDir, 'session-state'), {
  depth: 2,
  ignoreInitial: false,
  awaitWriteFinish: { stabilityThreshold: 100 }
});

watcher.on('add', (filepath) => {
  if (filepath.endsWith('events.jsonl')) {
    startTailing(filepath);
  }
  if (filepath.endsWith('workspace.yaml')) {
    loadSessionMetadata(filepath);
  }
});
```

### 2. Process Monitoring (Secondary)

Poll for copilot processes using platform-specific approaches:

| Platform | Method |
|----------|--------|
| macOS | `ps aux \| grep copilot` |
| Linux | `/proc/<pid>/` filesystem |
| Windows | `tasklist /FI "IMAGENAME eq copilot.exe"` |

Cross-platform: Use the `ps-list` npm package.

Collected per-process: PID, CPU%, memory (RSS), command line, uptime.

### 3. Log File Parsing (Supplementary)

Parse `~/.copilot/logs/process-*.log` for:
- Startup information (version, node version)
- MCP server connections
- API errors and retries
- Memory warnings

## Data Model

### Core Types

```typescript
// Monitoring source filter
type MonitoringSource = 'copilot-cli' | 'copilot-vscode' | 'all';

// Session state
interface Session {
  id: string;                    // UUID
  cwd: string;
  gitRoot?: string;
  repository?: string;
  branch?: string;
  summary?: string;
  copilotVersion?: string;
  model?: string;
  agentMode?: 'interactive' | 'plan' | 'autopilot' | 'shell';
  status: 'active' | 'idle' | 'completed' | 'error';
  startTime: Date;
  endTime?: Date;
  
  // Aggregated stats (computed from events)
  stats: SessionStats;
  
  // Raw events
  events: CopilotEvent[];
}

interface SessionStats {
  totalPremiumRequests: number;
  totalApiDurationMs: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheReadTokens: number;
  totalCost: number;              // Estimated cost in USD
  linesAdded: number;
  linesRemoved: number;
  filesModified: string[];
  toolCalls: number;
  toolCallsByName: Record<string, number>;
  subagentsStarted: number;
  userMessages: number;
  assistantTurns: number;
  errors: number;
  modelMetrics: Record<string, ModelMetric>;
}

interface ModelMetric {
  requests: number;
  cost: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
}

// Process info
interface ProcessInfo {
  pid: number;
  cpu: number;           // Percentage
  memory: number;        // RSS in bytes
  command: string;       // Full command line
  source: 'copilot-cli' | 'copilot-vscode' | 'unknown';
  uptime?: number;       // Seconds
  sessionId?: string;    // Correlated session if possible
}

// Copilot event (parsed from events.jsonl)
interface CopilotEvent {
  type: string;
  data: Record<string, unknown>;
  id: string;
  timestamp: Date;
  parentId: string | null;
  ephemeral?: boolean;
}

// Quota info (from assistant.usage)
interface QuotaInfo {
  entitlementRequests: number;
  usedRequests: number;
  remainingPercentage: number;
  resetDate?: Date;
  isUnlimited: boolean;
}
```

### State Machine

```
Session States:
  ┌──────────┐    events.jsonl    ┌────────┐
  │ Detected ├──────────────────→ │ Active │
  └──────────┘    appears         └───┬────┘
                                      │
                           ┌──────────┼──────────┐
                           ▼          ▼          ▼
                      ┌────────┐ ┌────────┐ ┌───────┐
                      │ Idle   │ │ Error  │ │ Done  │
                      └────────┘ └────────┘ └───────┘

Agent Activity States (per session):
  Idle → UserPrompt → Thinking → ToolCall → Thinking → Response → Idle
                        ↑                       │
                        └───────────────────────┘
                              (multi-turn)
```

### Aggregation for Analytics (Future)

```typescript
// Historical analytics (future feature)
interface UsageAnalytics {
  // Per-day aggregation
  dailySummaries: DailySummary[];
  
  // Running totals
  totalSessions: number;
  totalPremiumRequests: number;
  totalCostUsd: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  
  // Current billing period
  currentPeriod: {
    startDate: Date;
    endDate: Date;
    premiumRequestsUsed: number;
    premiumRequestsLimit: number;
    estimatedCostUsd: number;
  };
}

interface DailySummary {
  date: string;           // YYYY-MM-DD
  sessions: number;
  premiumRequests: number;
  costUsd: number;
  inputTokens: number;
  outputTokens: number;
  toolCalls: number;
  linesAdded: number;
  linesRemoved: number;
  modelsUsed: string[];
}
```

## Data Flow

```
 ┌──────────────────────────────────────────────────┐
 │                  Main Process                     │
 │                                                   │
 │  ~/.copilot/session-state/**/events.jsonl         │
 │         │                                         │
 │         ▼                                         │
 │  ┌──────────────┐     ┌─────────────────┐        │
 │  │ EventParser   │────→│  SessionStore   │        │
 │  │ (line-by-line │     │                 │        │
 │  │  JSONL parse) │     │ - sessions Map  │        │
 │  └──────────────┘     │ - events Map    │        │
 │                        │ - stats cache   │        │
 │  ┌────────────────┐   │ - processes     │        │
 │  │ ProcessMonitor  │──→│                 │        │
 │  │ (5s interval)   │   └────────┬────────┘        │
 │  └────────────────┘            │                  │
 │                                │ IPC events       │
 ├────────────────────────────────┼──────────────────┤
 │                                ▼                  │
 │  ┌──────────────────────────────────────┐        │
 │  │          MonitoringStore              │        │
 │  │  (Zustand/Jotai - reactive state)    │        │
 │  └──────────────────┬───────────────────┘        │
 │                     │                             │
 │          ┌──────────┼──────────┐                  │
 │          ▼          ▼          ▼                  │
 │     HackMode   CocoMode   OceanMode              │
 │                                                   │
 │              Renderer Process                     │
 └──────────────────────────────────────────────────┘
```

## Cost Estimation

Based on GitHub Copilot pricing (as of Feb 2026):
- Premium requests: ~$0.04 per request (Copilot Pro)
- Model multipliers vary: Claude Opus 4.6 = higher cost per request

The `assistant.usage` event includes:
- `cost`: Per-request cost (when available)
- `quotaSnapshots`: Remaining quota information

We can estimate session cost by summing `assistant.usage.cost` values or falling back to `totalPremiumRequests * $0.04`.
