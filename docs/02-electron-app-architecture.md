# Electron App Architecture

## Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | Electron | 34.x |
| Build Tool | electron-vite | latest |
| Language | TypeScript | 5.x |
| 3D Rendering | Three.js | latest |
| Audio | Howler.js | 2.x |
| UI Framework | React 19 | (for dashboard/controls) |
| Testing | Vitest + Playwright | latest |
| Packaging | electron-builder | latest |
| CI/CD | GitHub Actions | N/A |

## Why electron-vite?

- Purpose-built for Electron + Vite integration
- Fast HMR for renderer process
- Proper main/preload/renderer separation
- TypeScript support out of the box
- Active maintenance and community

## Project Structure

```
cocopilot/
├── docs/                          # Specifications and documentation
├── external/                      # Cloned reference repos (gitignored)
│   ├── copilot-sdk/
│   └── copilot-cli/
├── assets/                        # Static assets
│   ├── models/                    # 3D models (.glb/.gltf)
│   ├── textures/                  # Textures and images
│   ├── sounds/                    # Sound effects (.mp3/.ogg)
│   └── music/                     # Background music
├── src/
│   ├── main/                      # Electron main process
│   │   ├── index.ts               # App entry point
│   │   ├── monitoring/            # Copilot monitoring (main process)
│   │   │   ├── file-watcher.ts    # Watch ~/.copilot/session-state/
│   │   │   ├── event-parser.ts    # Parse events.jsonl
│   │   │   ├── process-monitor.ts # Monitor copilot processes
│   │   │   ├── session-store.ts   # In-memory session/event store
│   │   │   └── types.ts           # Monitoring types
│   │   └── ipc/                   # IPC handlers (main ↔ renderer)
│   │       └── monitoring-ipc.ts
│   ├── preload/                   # Preload scripts
│   │   └── index.ts               # contextBridge API exposure
│   ├── renderer/                  # Renderer process (React + Three.js)
│   │   ├── index.html
│   │   ├── main.tsx               # React entry
│   │   ├── App.tsx                # Root component with mode switching
│   │   ├── store/                 # State management
│   │   │   ├── app-store.ts       # App-level state (mode, settings)
│   │   │   └── monitoring-store.ts # Monitoring data (sessions, events)
│   │   ├── hooks/                 # Custom React hooks
│   │   │   ├── use-monitoring.ts  # Subscribe to monitoring events
│   │   │   └── use-audio.ts       # Audio management hook
│   │   ├── modes/                 # Scene modes
│   │   │   ├── ModeRegistry.ts    # Mode registration system
│   │   │   ├── hack/              # Hack Mode (dashboard)
│   │   │   │   ├── HackMode.tsx
│   │   │   │   ├── EventTimeline.tsx
│   │   │   │   ├── SessionInfo.tsx
│   │   │   │   ├── ProcessMonitor.tsx
│   │   │   │   └── UsageStats.tsx
│   │   │   ├── coco/              # Coco Mode (island/monkeys)
│   │   │   │   ├── CocoMode.tsx
│   │   │   │   ├── scene/
│   │   │   │   │   ├── Island.tsx
│   │   │   │   │   ├── Monkey.tsx  # "Coco" main character
│   │   │   │   │   ├── SubAgentMonkey.tsx
│   │   │   │   │   ├── Jungle.tsx
│   │   │   │   │   └── Coconut.tsx
│   │   │   │   └── audio/
│   │   │   │       └── CocoAudio.ts
│   │   │   └── ocean/             # Ocean Mode (dolphins/waves)
│   │   │       ├── OceanMode.tsx
│   │   │       ├── scene/
│   │   │       │   ├── Ocean.tsx
│   │   │       │   ├── Dolphin.tsx
│   │   │       │   └── Waves.tsx
│   │   │       └── audio/
│   │   │           └── OceanAudio.ts
│   │   ├── components/            # Shared UI components
│   │   │   ├── ModeSelector.tsx
│   │   │   ├── StatusBar.tsx
│   │   │   ├── SettingsPanel.tsx
│   │   │   └── Overlay.tsx        # HUD overlay for 3D scenes
│   │   └── styles/
│   │       └── global.css
│   └── shared/                    # Shared types (main + renderer)
│       ├── events.ts              # Event type definitions
│       ├── ipc-channels.ts        # IPC channel constants
│       └── config.ts              # App configuration types
├── test/
│   ├── unit/                      # Vitest unit tests
│   │   ├── monitoring/
│   │   ├── store/
│   │   └── modes/
│   ├── e2e/                       # Playwright E2E tests
│   │   ├── app-launch.spec.ts
│   │   ├── hack-mode.spec.ts
│   │   └── monitoring.spec.ts
│   └── fixtures/                  # Test data
│       ├── events.jsonl           # Sample events
│       └── sessions/              # Sample session directories
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Build + test on PR
│       ├── release.yml            # Build + publish releases
│       └── e2e.yml                # E2E test suite
├── electron.vite.config.ts
├── electron-builder.yml
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── tsconfig.web.json
└── vitest.config.ts
```

## Process Architecture

```
┌─────────────────────────────────────────┐
│              Main Process               │
│                                         │
│  ┌──────────────┐  ┌────────────────┐  │
│  │ FileWatcher   │  │ ProcessMonitor │  │
│  │ (chokidar)    │  │ (ps polling)   │  │
│  └──────┬───────┘  └───────┬────────┘  │
│         │                   │           │
│         ▼                   ▼           │
│  ┌──────────────────────────────────┐  │
│  │         SessionStore             │  │
│  │  - sessions[]                    │  │
│  │  - events[]                      │  │
│  │  - processes[]                   │  │
│  └──────────────┬───────────────────┘  │
│                 │ IPC                   │
├─────────────────┼───────────────────────┤
│                 ▼                       │
│          Renderer Process               │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │       MonitoringStore            │  │
│  │  (mirrors main process state)    │  │
│  └──────────────┬───────────────────┘  │
│                 │                       │
│    ┌────────────┼────────────┐          │
│    ▼            ▼            ▼          │
│  HackMode   CocoMode    OceanMode      │
│  (React)    (Three.js)   (Three.js)    │
│             + Howler.js  + Howler.js    │
└─────────────────────────────────────────┘
```

## IPC Communication

### Main → Renderer (Events)
```typescript
// Channels
'monitoring:session-discovered'    // New session found
'monitoring:session-updated'       // Session metadata changed
'monitoring:event-received'        // New event from events.jsonl
'monitoring:process-update'        // Process CPU/memory update
```

### Renderer → Main (Commands)
```typescript
// Channels
'monitoring:set-source-filter'     // 'copilot-cli' | 'copilot-vscode' | 'all'
'monitoring:get-sessions'          // Request session list
'monitoring:get-session-events'    // Request events for session
'app:get-settings'                 // Read settings
'app:set-settings'                 // Write settings
```

## Security Model

- **Read-only**: Cocopilot never writes to `~/.copilot/` or interacts with copilot processes
- **Local-only**: No network access, no external APIs, no telemetry
- **contextBridge**: Renderer process has no direct Node.js access
- **File access**: Only reads from `~/.copilot/` directory

## Mode System

Modes are registered via a `ModeRegistry`:

```typescript
interface Mode {
  id: string;           // 'hack' | 'coco' | 'ocean'
  name: string;         // Display name
  description: string;
  icon: string;
  component: React.ComponentType<ModeProps>;
  supportsOverlay: boolean;  // Can show dashboard overlay
}

interface ModeProps {
  sessions: Session[];
  activeSession: Session | null;
  events: CopilotEvent[];
  processes: ProcessInfo[];
  settings: AppSettings;
}
```

This makes adding new modes trivial - just implement the component and register it.
