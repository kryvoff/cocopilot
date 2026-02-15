# Testing & Observability Strategy

## Goal

Every change must be verifiable by automated tests AND by coding agents inspecting the running app. This is critical for iterative development with Copilot CLI, autopilot, and fleet.

## Testing Priority Order

Tests are prioritized by speed, reliability, and development phase:

1. **Unit tests (Vitest)** — fast, deterministic, run first and most often
2. **Integration tests (Vitest)** — IPC, SQLite, file watcher + parser chains
3. **Debug server API tests** — `curl` against `localhost:9876` for agent verification
4. **E2E functional tests (Playwright)** — app launches, mode switching, monitoring works
5. **Visual regression (Playwright)** — screenshot baselines, added last when UI stabilizes

Visual regression testing is deferred until the UI is stable. When added:
- Start with one canonical environment (Linux + Chromium in CI)
- Use `toHaveScreenshot()` with generous tolerance (1-2%)
- Add per-OS baselines only after UI stabilizes
- Keep screenshot test count small — most verification is text/API-based

## Testing Pyramid

```
        ╱╲
       ╱  ╲        E2E + Visual Regression (Playwright)
      ╱    ╲       - App launch, mode switching, screenshots
     ╱──────╲      - Visual regression with toHaveScreenshot()
    ╱        ╲
   ╱          ╲    Integration Tests (Vitest)
  ╱            ╲   - IPC roundtrip, file watcher + parser
 ╱──────────────╲  - SQLite queries
╱                ╲
╱  Unit Tests     ╲  (Vitest)
╱  - Event parser  ╲ - Session stats, cost estimation
╱  - Data model     ╲- Mode state machines
╱────────────────────╲
```

## Observability for Coding Agents

### Problem
When a coding agent (Copilot CLI, autopilot, fleet) makes changes to the app, it needs to verify the app actually works — not just that the code compiles, but that the UI renders correctly and monitoring is functioning.

### Solution: Built-in Debug Server

A lightweight HTTP server on `localhost:9876` (main process) exposes:

```
GET /api/health             → { "status": "ok", "uptime": 120 }
GET /api/state              → Full app state JSON (sessions, events, settings, mode)
GET /api/screenshot         → PNG screenshot of current window
GET /api/events?n=20        → Last N monitoring events
GET /api/processes          → Detected copilot processes
GET /api/mode               → Current mode and its state
GET /api/metrics            → Session stats, token counts, cost
```

### Usage by Coding Agents

```bash
# Verify app is running
curl -s http://localhost:9876/api/health | jq .status

# Check if monitoring is working
curl -s http://localhost:9876/api/state | jq '.sessions | length'

# Take a screenshot to "see" the app
curl -s http://localhost:9876/api/screenshot > /tmp/cocopilot.png

# Check what events are flowing
curl -s http://localhost:9876/api/events?n=5 | jq '.[].type'
```

### Playwright Integration

For richer agent-driven testing, Playwright can be invoked:

```bash
# Run specific smoke test
npx playwright test --grep "app launches" --reporter=list

# Visual regression check
npx playwright test --grep "vanilla mode" --update-snapshots

# Take named screenshot during test
npx playwright test --grep "screenshot"
```

## Unit Tests (Vitest)

### Monitoring Core
```
test/unit/monitoring/
├── event-parser.test.ts        # Parse every event type
├── session-store.test.ts       # Session state management
├── process-monitor.test.ts     # Process detection logic
├── stats-computer.test.ts      # Aggregate statistics, cost estimation
└── source-filter.test.ts       # CLI filtering
```

Key scenarios:
- Parse every event type from the schema
- Handle malformed/partial JSON lines gracefully
- Handle concurrent session writes
- Compute correct stats from event sequences
- Cost estimation accuracy (premium requests × multiplier)
- Process detection on macOS, Linux, Windows

### Database
```
test/unit/database/
├── schema.test.ts              # Table creation, migrations
├── queries.test.ts             # Insert/query sessions, events, usage
└── analytics.test.ts           # Aggregation queries
```

### UI Components
```
test/unit/modes/
├── vanilla/
│   ├── EventTimeline.test.tsx
│   └── UsageCharts.test.tsx
├── island/
│   └── coco-state-machine.test.ts
└── mode-registry.test.ts
```

## Test Fixtures

Generated from real Copilot CLI sessions (sanitized):

```
test/fixtures/
├── events/
│   ├── simple-session.jsonl       # start → prompt → response → end
│   ├── multi-tool-session.jsonl   # Multiple tool calls
│   ├── subagent-session.jsonl     # Fleet/sub-agent events
│   ├── autopilot-session.jsonl    # Autopilot mode
│   ├── error-session.jsonl        # With errors
│   └── shutdown-with-stats.jsonl  # Full shutdown metrics
├── sessions/                      # Full session directory mocks
│   ├── active/
│   │   ├── workspace.yaml
│   │   └── events.jsonl
│   └── completed/
└── workspace.yaml
```

### MockCopilot Helper

Simulates copilot activity for testing:

```typescript
class MockCopilot {
  constructor(private baseDir: string) {}

  async startSession(id: string): Promise<void> {
    // Create session dir, write workspace.yaml + session.start event
  }

  async emitEvent(event: Partial<CopilotEvent>): Promise<void> {
    // Append to events.jsonl with proper structure
  }

  async simulateFullSession(): Promise<void> {
    // Emit a complete session: start → prompt → tools → response → end
  }

  async endSession(): Promise<void> {
    // Write session.shutdown with metrics
  }
}
```

## E2E Tests (Playwright)

### Configuration
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './test/e2e',
  timeout: 60000,
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,  // 1% tolerance for visual regression
    }
  }
});
```

### Test Scenarios
```
test/e2e/
├── app-launch.spec.ts          # Window opens, default mode, status bar
├── vanilla-mode.spec.ts        # Event timeline, stats, charts render
├── mode-switching.spec.ts      # Switch between modes
├── monitoring.spec.ts          # Detects sessions, events stream
├── process-selector.spec.ts   # Shows multiple CLIs, allows selection
├── settings.spec.ts            # Settings panel, persistence
├── visual-regression.spec.ts   # Screenshot comparisons for each mode
└── debug-server.spec.ts        # Debug HTTP endpoints work
```

### Visual Regression
```typescript
test('vanilla mode matches baseline', async ({ page }) => {
  // Feed mock events
  // Wait for render
  await expect(page).toHaveScreenshot('vanilla-mode.png');
});

test('island mode renders 3D scene', async ({ page }) => {
  // Switch to island mode
  // Verify canvas exists and renders
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page).toHaveScreenshot('island-mode.png');
});
```

## Development Workflow

### Commands
```bash
npm run dev              # Start app in dev mode with HMR
npm run build            # Production build
npm run test:unit        # Fast unit tests
npm run test:unit:watch  # Watch mode
npm run test:integration # Integration tests (SQLite, IPC)
npm run test:e2e         # Full E2E (requires build)
npm run test             # All tests
npm run typecheck        # TypeScript type checking
npm run lint             # ESLint
npm run test:coverage    # Coverage report
```

### Agent Development Loop
When a coding agent makes changes:
1. `npm run typecheck` — type errors?
2. `npm run test:unit` — logic correct?
3. `npm run build` — compiles?
4. `npm run test:e2e -- --grep "smoke"` — app works?
5. `curl http://localhost:9876/api/screenshot > /tmp/check.png` — looks right?

### CI Matrix
```yaml
strategy:
  matrix:
    os: [ubuntu-latest, macos-latest, windows-latest]
steps:
  - npm ci
  - npm run lint && npm run typecheck
  - npm run test:unit && npm run test:integration
  - npm run build
  - npx playwright install --with-deps
  - npm run test:e2e
```
