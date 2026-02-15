# Monitoring & Data Model

## Single-CLI Focus

Cocopilot monitors **one copilot CLI session at a time**. The monitoring pipeline:
1. Discovers all active copilot CLI processes
2. Shows the count in the UI with a process selector
3. User selects which session to monitor (or auto-selects if only one)
4. All modes (Vanilla, Island, Learn, Ocean) visualize that single session

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

| Platform | Method                                    |               |
| -------- | ----------------------------------------- | ------------- |
| macOS    | `ps aux \                                 | grep copilot` |
| Linux    | `/proc/<pid>/` filesystem                 |               |
| Windows  | `tasklist /FI "IMAGENAME eq copilot.exe"` |               |

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

## Schema Resilience & CLI Evolution

The Copilot CLI is evolving rapidly (beta software). Our parsing must be robust against:
- New event types we haven't seen before
- Changed/removed fields in existing event types
- New fields added to existing events
- Changes to the `events.jsonl` format

### Strategy: Defensive Parsing with Zod

Use **Zod** for runtime schema validation with `safeParse`:

```typescript
import { z } from 'zod';

// Base event envelope — always required
const BaseEventSchema = z.object({
  type: z.string(),
  id: z.string(),
  timestamp: z.string(),
  parentId: z.string().nullable().optional(),
  ephemeral: z.boolean().optional(),
  data: z.record(z.unknown()).optional().default({}),
});

// Known event types get specific schemas (validated, typed)
const SessionStartDataSchema = z.object({
  sessionId: z.string().optional(),
  copilotVersion: z.string().optional(),
  startTime: z.number().optional(),
  context: z.object({
    cwd: z.string().optional(),
    gitRoot: z.string().optional(),
    repository: z.string().optional(),
    branch: z.string().optional(),
  }).optional(),
}).passthrough(); // Allow unknown extra fields

// Parsing strategy:
// 1. Parse base envelope (must succeed)
// 2. If type is known, parse data with specific schema
// 3. If type is unknown, store raw data + log warning
// 4. Never crash — always store the event
function parseEvent(line: string): ParsedEvent | null {
  const json = JSON.parse(line); // wrapped in try/catch
  const base = BaseEventSchema.safeParse(json);
  if (!base.success) {
    logger.warn('Unparseable event line', { errors: base.error });
    return null;
  }
  const schema = knownSchemas.get(base.data.type);
  if (!schema) {
    logger.warn('Unknown event type', { type: base.data.type });
    schemaTracker.recordUnknownType(base.data.type);
  }
  return { ...base.data, validated: !!schema };
}
```

### Schema Drift Detection

Track and surface schema changes to the user:

```typescript
interface SchemaCompatibility {
  copilotVersion: string;          // e.g. "0.0.410"
  knownEventTypes: string[];       // Types we have schemas for
  unknownEventTypes: string[];     // Types seen but not recognized
  deprecatedFields: string[];      // Fields we expected but are missing
  newFields: string[];             // Fields present but not in our schema
  lastChecked: Date;
}
```

Exposed in the UI:
- Status bar indicator: "✓ Schema compatible" or "⚠ 3 unknown event types"
- Settings panel: detailed compatibility report
- Debug server: `GET /api/schema-compatibility`

### `cocopilot check` CLI Command

A CLI subcommand to validate compatibility:

```bash
$ cocopilot check
Copilot CLI version: 0.0.420
Cocopilot version:   0.1.0
Schema compatibility: ⚠ Partial

Known event types:    40/43 (3 new types detected)
New types:            assistant.thinking, tool.retry, session.checkpoint
Missing types:        0 (all expected types still present)

Recommendation: Update Cocopilot for full support of new event types.
```

### Design Principles

1. **Never crash on unknown data** — `safeParse` + `passthrough()` everywhere
2. **Store everything** — even unparseable events get stored as raw JSON
3. **Warn, don't block** — unknown events show warnings, app keeps working
4. **Version-aware** — record copilot version per session for compatibility tracking
5. **Forward-compatible** — use `.passthrough()` so new fields flow through

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
 │  │ (line-by-line │     │  + SQLite DB    │        │
 │  │  JSONL parse) │     │                 │        │
 │  └──────────────┘     │ - sessions Map  │        │
 │                        │ - events table  │        │
 │  ┌────────────────┐   │ - analytics     │        │
 │  │ ProcessMonitor  │──→│ - processes     │        │
 │  │ (5s interval)   │   └────────┬────────┘        │
 │  └────────────────┘            │                  │
 │                                │ IPC events       │
 ├────────────────────────────────┼──────────────────┤
 │                                ▼                  │
 │  ┌──────────────────────────────────────┐        │
 │  │       Zustand MonitoringStore         │        │
 │  └──────────────────┬───────────────────┘        │
 │                     │                             │
 │       ┌─────────────┼──────────┬──────────┐      │
 │       ▼             ▼          ▼          ▼      │
 │   Vanilla       Island      Learn      Ocean     │
 │                                                   │
 │              Renderer Process                     │
 └──────────────────────────────────────────────────┘
```

## SQLite Schema

The SQLite database (`cocopilot.db` in the app data directory) stores historical data for analytics:

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  cwd TEXT,
  git_root TEXT,
  repository TEXT,
  branch TEXT,
  copilot_version TEXT,
  model TEXT,
  agent_mode TEXT,
  status TEXT,
  start_time TEXT,
  end_time TEXT,
  total_premium_requests INTEGER,
  total_api_duration_ms INTEGER,
  total_cost_usd REAL,
  lines_added INTEGER,
  lines_removed INTEGER,
  summary TEXT
);

CREATE TABLE events (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id),
  type TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  parent_id TEXT,
  data_json TEXT,
  ephemeral BOOLEAN DEFAULT FALSE
);

CREATE TABLE usage_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT REFERENCES sessions(id),
  model TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  cache_read_tokens INTEGER,
  cache_write_tokens INTEGER,
  cost REAL,
  duration_ms INTEGER,
  timestamp TEXT
);

CREATE INDEX idx_events_session ON events(session_id);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_sessions_start ON sessions(start_time);
```
