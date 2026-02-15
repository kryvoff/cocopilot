# Testing & Observability Strategy

## Goal

Every change must be verifiable by automated tests AND by coding agents inspecting the running app. This is critical for iterative development with Copilot CLI, autopilot, and fleet.

## Testing Pyramid

```
        ╱╲
       ╱  ╲        E2E + Visual Regression (Playwright)
      ╱    ╲       - App launch, mode switching, screenshots
     ╱──────╲      - Visual regression with toHaveScreenshot()
    ╱        ╲
   ╱          ╲    Integration Tests (Vitest)
  ╱            ╲   - Playback pipeline, ocean events
 ╱──────────────╲
╱                ╲
╱  Unit Tests     ╲  (Vitest)
╱  - Event parser  ╲ - Session stats, coco/flipper state
╱  - Data model     ╲- Audio, learn mode
╱────────────────────╲
```

## Observability for Coding Agents

### Built-in Debug Server

A lightweight HTTP server on `localhost:9876` (main process) exposes:

```
GET /api/health             → { "status": "ok", "uptime": 120 }
GET /api/state              → Full app state JSON (sessions, events, settings, mode)
GET /api/screenshot         → PNG screenshot of current window
GET /api/events?n=20        → Last N monitoring events
GET /api/processes          → Detected copilot processes
GET /api/renderer-state     → Renderer-side state via IPC
```

```bash
# Verify app is running
curl -s http://localhost:9876/api/health | jq .status

# Take a screenshot to "see" the app
curl -s http://localhost:9876/api/screenshot > /tmp/cocopilot.png
```

## Unit Tests (Vitest)

226 tests across these files:

```
test/unit/
├── audio/
│   └── audio-manager.test.ts       # AudioManager singleton, enable/disable, volume
├── dashboard/
│   └── stats-logic.test.ts         # Stats computation, duration formatting, time bucketing
├── database/
│   └── queries.test.ts             # Schema creation, upsert, insert, listing, filtering
├── integration/
│   ├── ocean-playback.test.ts      # Ocean mode playback pipeline
│   └── playback-integration.test.ts # Playback → monitoring → coco state → sound
├── island/
│   ├── coco-state.test.ts          # Coco animation state transitions, timeouts
│   ├── event-effects.test.ts       # Particle effects mapping
│   └── event-sound-mapping.test.ts # Event type → sound mapping
├── learn/
│   └── learn-mode.test.ts          # Tutorial, event catalog, playback tab
├── monitoring/
│   ├── event-parser.test.ts        # Parse all event types, malformed input
│   ├── process-monitor.test.ts     # Process detection, polling, events
│   ├── session-playback.test.ts    # JSONL replay with speed control
│   └── session-store.test.ts       # Session state management
└── ocean/
    ├── flipper-state.test.ts       # Flipper animation states, activity level
    └── ocean-events.test.ts        # Ocean event wiring
```

## Test Fixtures

```
test/fixtures/events/
├── simple-session.jsonl            # start → prompt → response → end
├── multi-tool-session.jsonl        # Multiple tool calls
├── malformed-and-unknown.jsonl     # Bad JSON, unknown event types
├── synthetic-session.jsonl         # 27 events for playback testing
└── synthetic-error-session.jsonl   # Error scenarios
```

## E2E Tests (Playwright)

### Configuration

```typescript
// playwright.config.ts — 2% pixel diff tolerance, 60s timeout, serial (Electron)
```

### Test Files

```
test/e2e/
├── app-launch.test.ts          # Window opens, mode switching, debug server
├── visual-regression.test.ts   # Screenshot baselines for each mode
└── electron-app.ts             # Electron app helper
```

### Visual Regression in CI

CI compares screenshots against committed baselines. If they don't match, the job fails. To update baselines locally:

```bash
npm run test:e2e:update   # Regenerate screenshot baselines
```

## Development Workflow

### Commands

```bash
npm run dev              # Start app in dev mode with HMR
npm run build            # Production build
npm run test:unit        # Fast unit tests (226 tests)
npm run test:unit:watch  # Watch mode
npm run test:e2e         # Full E2E (builds first via pretest:e2e)
npm run test:e2e:update  # E2E with --update-snapshots
npm run test:smoke       # Build + launch + verify debug server
npm run test             # Alias for test:unit
npm run typecheck        # TypeScript type checking
npm run lint             # ESLint
npm run check            # cocopilot schema compatibility checker
```

### Agent Development Loop

1. `npm run typecheck` — type errors?
2. `npm run test:unit` — logic correct?
3. `npm run build` — compiles?
4. `npm run test:e2e` — app works?
5. `curl http://localhost:9876/api/screenshot > /tmp/check.png` — looks right?

### CI Jobs

| Job              | OS                              | What                                          |
| ---------------- | ------------------------------- | --------------------------------------------- |
| lint-and-typecheck | ubuntu-latest                 | `npm run typecheck`                           |
| unit-tests       | ubuntu, macos, windows          | `npm run test:unit`                           |
| build            | ubuntu-latest                   | `npm run build`                               |
| e2e-tests        | macos-latest                    | Functional E2E + visual regression (Playwright) |
