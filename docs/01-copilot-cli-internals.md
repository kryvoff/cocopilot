# Copilot CLI Internals & Monitoring

## Overview

The GitHub Copilot CLI (v0.0.410) is a single-binary desktop application that provides AI-powered coding assistance in the terminal. It communicates with GitHub's API servers via HTTPS and uses JSON-RPC internally when operating in server mode (for the SDK).

## Architecture

```
User Terminal
    ↓
copilot (single binary, bundled Node.js runtime)
    ↓ HTTPS
api.individual.githubcopilot.com
    ↓
LLM providers (Claude, GPT, Gemini)
```

- **Single process**: The `copilot` binary is a self-contained executable (~100MB) with embedded Node.js runtime
- **Session-based**: Each interactive session gets a UUID and persisted state
- **Event-sourced**: All session activity is recorded as JSONL events

## Session State (`~/.copilot/session-state/`)

Each session creates a directory at `~/.copilot/session-state/<session-uuid>/`:

```
<session-uuid>/
├── events.jsonl          # All session events (primary monitoring data source)
├── workspace.yaml        # Session metadata
├── checkpoints/
│   └── index.md          # Checkpoint history table
├── files/                # Session artifacts
└── rewind-snapshots/
    └── index.json        # Snapshot data for rewind
```

### workspace.yaml

```yaml
id: c2c1b3ae-fb8e-4886-bac2-cc28d750e50c
cwd: /Users/cdeil/code/projects/cocopilot
git_root: /Users/cdeil/code/projects/cocopilot
repository: kryvoff/cocopilot
branch: main
summary: Plan Cocopilot App Architecture
summary_count: 0
created_at: 2026-02-15T08:30:12.865Z
updated_at: 2026-02-15T09:22:58.227Z
```

## Event Types (from `session-events.schema.json`)

The events.jsonl file contains one JSON object per line. Each event has:
- `type`: Event type string
- `data`: Type-specific payload
- `id`: Unique event UUID
- `timestamp`: ISO 8601 timestamp
- `parentId`: Parent event UUID (for nesting/causality)
- `ephemeral`: If true, event is transient (not persisted across sessions)

### Complete Event Type Catalog

#### Session Lifecycle
| Type                          | Key Data Fields                                                                 | Ephemeral |
| ----------------------------- | ------------------------------------------------------------------------------- | --------- |
| `session.start`               | sessionId, copilotVersion, startTime, context{cwd, gitRoot, repository, branch} | No        |
| `session.resume`              | resumeTime, eventCount, context                                                 | No        |
| `session.idle`                | (empty)                                                                         | Yes       |
| `session.error`               | errorType, message, stack, statusCode                                           | No        |
| `session.shutdown`            | **totalPremiumRequests, totalApiDurationMs, codeChanges, modelMetrics**         | Yes       |
| `session.info`                | infoType, message                                                               | No        |
| `session.warning`             | warningType, message                                                            | No        |
| `session.model_change`        | previousModel, newModel                                                         | No        |
| `session.title_changed`       | title                                                                           | Yes       |
| `session.handoff`             | handoffTime, sourceType, repository, summary                                    | No        |
| `session.context_changed`     | cwd, gitRoot, repository, branch                                                | No        |
| `session.truncation`          | tokenLimit, pre/postTruncationTokens, tokensRemoved                             | No        |
| `session.snapshot_rewind`     | upToEventId, eventsRemoved                                                      | Yes       |
| `session.usage_info`          | tokenLimit, currentTokens, messagesLength                                       | Yes       |
| `session.compaction_start`    | (empty)                                                                         | No        |
| `session.compaction_complete` | success, pre/postCompactionTokens, summaryContent                               | No        |

#### User & Assistant
| Type                        | Key Data Fields                                                                       | Ephemeral |
| --------------------------- | ------------------------------------------------------------------------------------- | --------- |
| `user.message`              | content, attachments, **agentMode** (interactive/plan/autopilot/shell)                | No        |
| `assistant.turn_start`      | turnId                                                                                | No        |
| `assistant.turn_end`        | turnId                                                                                | No        |
| `assistant.intent`          | intent                                                                                | Yes       |
| `assistant.reasoning`       | reasoningId, content                                                                  | No        |
| `assistant.reasoning_delta` | reasoningId, deltaContent                                                             | Yes       |
| `assistant.message`         | messageId, content, toolRequests[], reasoningText                                     | No        |
| `assistant.message_delta`   | messageId, deltaContent                                                               | Yes       |
| `assistant.usage`           | **model, inputTokens, outputTokens, cacheReadTokens, cost, duration, quotaSnapshots** | Yes       |
| `pending_messages.modified` | (empty)                                                                               | Yes       |
| `abort`                     | reason                                                                                | No        |

#### Tool Execution
| Type                            | Key Data Fields                                   | Ephemeral |
| ------------------------------- | ------------------------------------------------- | --------- |
| `tool.user_requested`           | toolCallId, toolName, arguments                   | No        |
| `tool.execution_start`          | toolCallId, toolName, arguments, mcpServerName    | No        |
| `tool.execution_partial_result` | toolCallId, partialOutput                         | Yes       |
| `tool.execution_progress`       | toolCallId, progressMessage                       | Yes       |
| `tool.execution_complete`       | toolCallId, success, result, error, toolTelemetry | No        |

#### Sub-agents & Fleet
| Type                 | Key Data Fields                                           | Ephemeral |
| -------------------- | --------------------------------------------------------- | --------- |
| `subagent.started`   | toolCallId, agentName, agentDisplayName, agentDescription | No        |
| `subagent.completed` | toolCallId, agentName, agentDisplayName                   | No        |
| `subagent.failed`    | toolCallId, agentName, error                              | No        |
| `subagent.selected`  | agentName, agentDisplayName, tools[]                      | No        |

#### Skills & Hooks
| Type             | Key Data Fields                             | Ephemeral |
| ---------------- | ------------------------------------------- | --------- |
| `skill.invoked`  | name, path, content, allowedTools           | No        |
| `hook.start`     | hookInvocationId, hookType, input           | No        |
| `hook.end`       | hookInvocationId, hookType, output, success | No        |
| `system.message` | content, role, name, metadata               | No        |

## Critical Data for Cocopilot

### session.shutdown (Gold Mine)
```json
{
  "type": "session.shutdown",
  "data": {
    "totalPremiumRequests": 5,
    "totalApiDurationMs": 45000,
    "sessionStartTime": 1739601012863,
    "codeChanges": {
      "linesAdded": 150,
      "linesRemoved": 30,
      "filesModified": ["src/app.ts", "src/utils.ts"]
    },
    "modelMetrics": {
      "claude-sonnet-4.5": {
        "requests": { "count": 5, "cost": 0.20 },
        "usage": {
          "inputTokens": 50000,
          "outputTokens": 10000,
          "cacheReadTokens": 30000,
          "cacheWriteTokens": 5000
        }
      }
    }
  }
}
```

### assistant.usage (Per-Request Billing)
```json
{
  "type": "assistant.usage",
  "data": {
    "model": "claude-sonnet-4.5",
    "inputTokens": 10000,
    "outputTokens": 2000,
    "cacheReadTokens": 5000,
    "cost": 0.04,
    "duration": 8500,
    "quotaSnapshots": {
      "premium": {
        "entitlementRequests": 300,
        "usedRequests": 45,
        "remainingPercentage": 85,
        "resetDate": "2026-03-01T00:00:00Z"
      }
    }
  }
}
```

## Other Monitoring Sources

### Process Monitoring
```bash
# Detect running copilot CLI processes
ps aux | grep copilot | grep -v grep

# Example output:
# cdeil  4308  9.7  2.2  copilot --yolo
# cdeil  7320  0.0  0.1  copilot
```

Process info available: PID, CPU%, MEM%, command line args.

### Log Files (`~/.copilot/logs/`)
Format: `process-<timestamp>-<pid>.log`
Contains timestamped log entries with levels: INFO, ERROR, DEBUG.
Useful for: startup details, MCP server connections, API errors, memory status.

### Config Files
- `~/.copilot/config.json`: User preferences (model, theme, experimental mode)
- `~/.copilot/permissions-config.json`: Tool permissions per workspace
- `~/.copilot/command-history-state.json`: Command history

### IDE Lock Files (`~/.copilot/ide/`)
Lock files indicate active IDE connections.

## Agent Modes

The `user.message.data.agentMode` field indicates the current mode:
- `"interactive"`: Standard interactive mode
- `"plan"`: Plan mode (Shift+Tab to cycle)
- `"autopilot"`: Autonomous mode (experimental) - agent continues until task complete
- `"shell"`: Shell command mode (prefix with `!`)

## Monitoring Strategy for Cocopilot

### Primary: File System Watching
1. Watch `~/.copilot/session-state/` for new session directories
2. Tail `events.jsonl` files in active sessions using `fs.watch` or `chokidar`
3. Parse each new line as JSON, emit typed events to the app

### Secondary: Process Monitoring
1. Periodically scan for `copilot` processes via `ps`
2. Track PID, CPU, memory usage
3. Correlate processes with sessions

### Filtering Copilot Sources
- **copilot-cli** (default): Process name is `copilot`, events have `producer: "copilot-agent"`
- **copilot-vscode**: Processes contain `copilot-typescript-server-plugin` (future support)
- **all**: Monitor everything (future support)

### Single-CLI Monitoring Focus
Cocopilot monitors **one copilot CLI process at a time**. If the user has multiple copilot CLI instances running (e.g. in 2-3 terminals), the app:
1. Detects all active copilot CLI processes and shows the count
2. Allows the user to select which one to monitor
3. Focuses all dashboards and scenes on that single session

This keeps the app simple and educational — users learn how one copilot CLI session works in depth. Power users who want to monitor multiple sessions can open multiple Cocopilot app instances, each selecting a different CLI process.

### Security Model
Cocopilot achieves security through two simple principles:
1. **Read-only**: We never write to `~/.copilot/` or interact with copilot processes in any way
2. **Local-only**: We never transmit any data to the internet — no telemetry, no API calls, no cloud

The app displays all session data transparently because it only runs on the user's own machine where they're already authenticated with GitHub.

### Data Architecture
```
~/.copilot/session-state/ ──→ FileWatcher ──→ EventParser ──→ EventStore (SQLite)
                                                                    ↓
ps aux (copilot processes) ──→ ProcessMonitor ──→ ──────────→ AppState
                                                                    ↓
                                                          Mode Renderers
                                                    (Vanilla/Island/Ocean/Learn)
```
