# Future Ideas & Deferred Features

Ideas we've discussed but deferred for later. This is our backlog of possibilities.

## Monitoring Enhancements

### SDK Real-Time Integration
Connect to running Copilot CLI via the SDK (JSON-RPC) to receive **ephemeral events** in real-time:
- `assistant.usage` — Live token counts, cost, and quota snapshots per API call
- `assistant.message_delta` — Streaming response visualization (word by word)
- `assistant.reasoning_delta` — Live reasoning stream
- `assistant.intent` — Current agent intent updates
- `session.idle` — Immediate idle detection
- `tool.execution_partial_result` — Live tool output streaming
- `tool.execution_progress` — Progress messages during long tool runs

**What we'd gain**: Much richer real-time experience. Currently we only see events after they're persisted to `events.jsonl` (non-ephemeral). With SDK, we'd get streaming updates including billing data that's otherwise only available in the shutdown event.

**Architecture**: The app is already designed with a clean separation between monitoring backend and visual frontend. Adding SDK as a second data source alongside file watching is straightforward — both would feed into the same `SessionStore`.

**Requires**: Copilot CLI running in server mode (`copilot --acp`), SDK dependency management, more complex error handling.

### Multi-Session Monitoring
Monitor multiple copilot CLI sessions simultaneously:
- Split-screen or tabbed view
- Aggregate statistics across sessions
- Compare sessions side by side

### VS Code Copilot Monitoring
Extend monitoring to VS Code Copilot Chat extension:
- Detect copilot-related VS Code processes
- Parse VS Code extension logs
- Filter: `copilot-cli`, `copilot-vscode`, `all`

### Cloud Agent Monitoring
Monitor GitHub Copilot cloud agents (github.com):
- GitHub API integration (read-only)
- Remote session status and events
- Cross-reference local and cloud sessions

### GitHub API Integration
Read user account info:
- Current Copilot plan (Free, Pro, Business, Enterprise)
- Premium request quota and usage
- Billing period info
- Could use `gh` CLI or GitHub API (read-only)

## Notification System
Desktop notifications for:
- Session started/ended
- Errors during session
- Quota warnings (e.g., "80% of premium requests used")
- Unusual activity (e.g., very high token usage)

## Usage & Analytics View
Similar to https://github.com/settings/billing/premium_requests_usage but local:
- Historical session data browsing
- Daily/weekly/monthly summaries
- Cost breakdown by model, repository, project
- Token usage trends
- Tool call frequency analysis
- Session duration patterns

## Visual Enhancements

### More Scene Modes
- **Space Mode** — Astronaut copilot in space station
- **City Mode** — Retro pixel city with characters
- **Garden Mode** — Zen garden with peaceful animations

### Advanced Coco Animations
- Coco learns new tricks based on session patterns
- Achievements/badges for milestones (100 sessions, etc.)
- Season/weather changes based on time of day

### Multi-Monitor Support
Pop out modes into separate windows for multi-monitor setups.

### Auto-Start on Login
Option to start Cocopilot automatically when the computer starts.

## Educational Enhancements

### Interactive Playground
Let users trigger mock copilot events to see how the app reacts:
- "Send a user message" → see Coco react
- "Start a sub-agent" → see a monkey appear
- Great for demos and learning

### Session Recording & Sharing
- Record sessions for playback
- Export as video or animated GIF
- Share interesting sessions with team

## Technical

### Plugin System
Allow community-created modes, sound packs, character skins.

### Configuration Sync
Sync settings across machines via GitHub (in a gist or config repo).
