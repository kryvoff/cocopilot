# Testing Strategy

## Testing Pyramid

```
        ╱╲
       ╱  ╲        E2E Tests (Playwright)
      ╱    ╲       - Full app launch, mode switching
     ╱──────╲      - Monitoring with mock data
    ╱        ╲
   ╱          ╲    Integration Tests (Vitest)
  ╱            ╲   - IPC communication
 ╱──────────────╲  - File watcher + event parser
╱                ╲
╱                  ╲  Unit Tests (Vitest)
╱                    ╲ - Event parser, data model
╱────────────────────╲ - Session stats computation
                       - Mode components (shallow)
```

## Unit Tests (Vitest)

### Monitoring Core
```
test/unit/monitoring/
├── event-parser.test.ts        # Parse events.jsonl lines
├── session-store.test.ts       # Session state management
├── process-monitor.test.ts     # Process detection logic
├── stats-computer.test.ts      # Aggregate session statistics
└── source-filter.test.ts       # CLI vs VSCode vs all filtering
```

Key test scenarios:
- Parse every event type from the schema
- Handle malformed/partial JSON lines
- Handle empty events.jsonl
- Handle concurrent session writes
- Compute correct statistics from event sequences
- Filter events by monitoring source
- Handle session resume correctly
- Cost estimation accuracy

### UI Components
```
test/unit/modes/
├── hack/
│   ├── EventTimeline.test.tsx
│   ├── SessionInfo.test.tsx
│   └── ProcessMonitor.test.tsx
├── coco/
│   ├── state-machine.test.ts    # Coco state transitions
│   └── audio-mapping.test.ts    # Event → sound mapping
└── mode-registry.test.ts        # Mode registration
```

### Shared
```
test/unit/shared/
├── types.test.ts
└── config.test.ts
```

## Test Fixtures

### Sample Events
Create comprehensive fixtures from real captured data:

```
test/fixtures/
├── events/
│   ├── simple-session.jsonl       # Basic: start → prompt → response → end
│   ├── multi-tool-session.jsonl   # Multiple tool calls
│   ├── subagent-session.jsonl     # Fleet/sub-agent events
│   ├── autopilot-session.jsonl    # Autopilot mode session
│   ├── error-session.jsonl        # Session with errors
│   ├── compaction-session.jsonl   # Session with compaction
│   ├── long-session.jsonl         # Extended session (many events)
│   └── shutdown-with-stats.jsonl  # Session with shutdown metrics
├── sessions/                      # Full session directory mocks
│   ├── active/
│   │   ├── workspace.yaml
│   │   └── events.jsonl
│   └── completed/
│       ├── workspace.yaml
│       └── events.jsonl
└── workspace/
    └── workspace.yaml
```

### Fixture Generation Script
```typescript
// scripts/generate-fixtures.ts
// Reads from ~/.copilot/session-state/ (with consent)
// Sanitizes sensitive content but preserves event structure
// Outputs to test/fixtures/
```

## Integration Tests (Vitest)

Test the interaction between components:

```
test/integration/
├── file-watcher-parser.test.ts    # FileWatcher + EventParser together
├── ipc-roundtrip.test.ts          # Main → Renderer IPC
└── monitoring-pipeline.test.ts    # Full monitoring pipeline
```

### Mock File System
Use `memfs` or `tmp` directories to simulate `~/.copilot/session-state/`:

```typescript
import { vol } from 'memfs';

beforeEach(() => {
  vol.fromJSON({
    '/mock-copilot/session-state/abc-123/events.jsonl': 
      '{"type":"session.start","data":{"sessionId":"abc-123"},...}\n',
    '/mock-copilot/session-state/abc-123/workspace.yaml':
      'id: abc-123\ncwd: /home/user/project\n'
  });
});
```

## E2E Tests (Playwright)

### Setup
Use `@playwright/test` with Electron support:

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test/e2e',
  timeout: 60000,
  use: {
    // Launch Electron app
    launchOptions: {
      executablePath: electronPath,
      args: ['.'],
    }
  }
});
```

### Test Scenarios
```
test/e2e/
├── app-launch.spec.ts
│   - App window opens
│   - Default mode (Hack) is displayed
│   - Status bar shows "No active sessions"
│
├── mode-switching.spec.ts
│   - Switch between Hack, Coco, Ocean modes
│   - Each mode renders correctly
│   - Mode preference persists
│
├── hack-mode.spec.ts
│   - Event timeline populates with mock events
│   - Session list shows sessions
│   - Stats panel shows correct data
│   - Filtering by source works
│
├── monitoring-live.spec.ts
│   - Detects new session appearing
│   - Events stream in real-time
│   - Session completion detected
│
├── coco-mode.spec.ts
│   - 3D scene renders (canvas exists)
│   - Coco appears when session active
│   - Coco hides when no sessions
│
└── settings.spec.ts
    - Audio toggle works
    - Source filter changes
    - Overlay toggle works
```

### Mock Copilot for E2E
Create a test helper that simulates copilot activity:

```typescript
// test/helpers/mock-copilot.ts
export class MockCopilot {
  private sessionDir: string;
  
  async startSession(sessionId: string): Promise<void> {
    // Create session directory
    // Write workspace.yaml
    // Write session.start event
  }
  
  async emitEvent(event: Partial<CopilotEvent>): Promise<void> {
    // Append to events.jsonl
  }
  
  async endSession(): Promise<void> {
    // Write session.shutdown event
  }
  
  async simulateFullSession(): Promise<void> {
    await this.startSession(uuid());
    await this.emitEvent({ type: 'user.message', ... });
    await sleep(500);
    await this.emitEvent({ type: 'assistant.turn_start', ... });
    await this.emitEvent({ type: 'tool.execution_start', ... });
    await sleep(1000);
    await this.emitEvent({ type: 'tool.execution_complete', ... });
    await this.emitEvent({ type: 'assistant.message', ... });
    await this.emitEvent({ type: 'assistant.turn_end', ... });
    await this.endSession();
  }
}
```

## Development Workflow

### Running Tests

```bash
# Unit tests (fast, run frequently)
npm run test:unit

# Unit tests in watch mode
npm run test:unit:watch

# Integration tests
npm run test:integration

# E2E tests (requires app build)
npm run test:e2e

# All tests
npm run test

# Coverage report
npm run test:coverage
```

### CI/CD Test Matrix

```yaml
# .github/workflows/ci.yml
test:
  strategy:
    matrix:
      os: [ubuntu-latest, macos-latest, windows-latest]
      node: [20]
  steps:
    - run: npm ci
    - run: npm run lint
    - run: npm run typecheck
    - run: npm run test:unit
    - run: npm run test:integration
    - run: npm run build
    - run: npx playwright install --with-deps
    - run: npm run test:e2e
```

## Debug Workflow

### For Agent Development
Copilot agents (and autopilot) can verify their changes by:

1. **Type checking**: `npm run typecheck` — catches type errors
2. **Unit tests**: `npm run test:unit` — fast feedback on logic
3. **Build**: `npm run build` — ensures the app compiles
4. **E2E smoke**: `npm run test:e2e -- --grep "app-launch"` — verify app starts

### For Manual Testing
1. Start the Electron app in dev mode: `npm run dev`
2. Open a separate terminal and run `copilot`
3. Observe events appearing in the app
4. Switch modes and verify visualizations

### For Automated Testing
The `MockCopilot` helper lets tests simulate copilot activity without actually running copilot:
- Write events to a temp `~/.copilot-test/session-state/` directory
- Configure the app to watch the test directory
- Assert UI state based on the mock events
