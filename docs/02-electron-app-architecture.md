# Electron App Architecture

## Tech Stack (Decided)

| Component        | Technology                           | Rationale                                                  |
| ---------------- | ------------------------------------ | ---------------------------------------------------------- |
| Framework        | Electron 34.x                        | Cross-platform desktop                                     |
| Build Tool       | electron-vite                        | Purpose-built for Electron+Vite, fast HMR                  |
| Language         | TypeScript 5.x                       | Type safety throughout                                     |
| 3D Rendering     | Three.js + @react-three/fiber + drei | Declarative 3D as React components                         |
| Audio            | Howler.js 2.x                        | Cross-platform audio playback                              |
| UI Framework     | React 19                             | Component model, works with R3F                            |
| State Management | Zustand                              | Lightweight, TypeScript-friendly, works with R3F           |
| Charting         | Nivo                                 | React-native, timeline/calendar visualizations, SVG+Canvas |
| Database         | SQLite (better-sqlite3)              | Persistent analytics, aggregation queries                  |
| Testing          | Vitest + Playwright                  | Unit/integration + E2E with visual regression              |
| Packaging        | electron-builder                     | Cross-platform builds                                      |
| CI/CD            | GitHub Actions                       | Build/test/release pipeline                                |

## Design Principles

1. **Fun & educational** — The app exists to help users learn how Copilot CLI works and have fun doing it
2. **Single-session focus** — Monitor one copilot CLI process in depth; show process count for switching
3. **Read-only & local-only** — Never write to copilot state or transmit data externally
4. **Extensible modes** — Clean mode system for adding new visualizations
5. **Observable & testable** — Built-in observability so coding agents can verify the app works

## App Modes

| Mode        | Version | Description                                                 |
| ----------- | ------- | ----------------------------------------------------------- |
| **Vanilla** | v0.1    | Default dashboard with event timeline, stats, and charts    |
| **Island**  | v0.2    | 3D tropical island with Coco (monkey) and sub-agent monkeys |
| **Learn**   | v0.2.5  | Interactive tutorials explaining Copilot CLI features       |
| **Ocean**   | v0.3    | 3D ocean scene with Flipper (dolphin) and sea creatures     |

### Characters
- **Coco** — A small monkey, main character in Island mode, represents the active copilot session
- **Flipper** — A friendly dolphin, main character in Ocean mode, same role as Coco

## Project Structure

```
cocopilot/
├── .github/
│   ├── copilot-instructions.md        # Instructions for coding agents
│   └── workflows/
│       ├── ci.yml
│       └── release.yml
├── docs/                              # Specifications and documentation
├── external/                          # Cloned reference repos (gitignored)
├── assets/                            # Static assets
│   ├── models/                        # 3D models (.glb/.gltf)
│   ├── textures/
│   ├── sounds/                        # Sound effects
│   └── music/                         # Ambient music
├── src/
│   ├── main/                          # Electron main process
│   │   ├── index.ts
│   │   ├── monitoring/
│   │   │   ├── file-watcher.ts        # Watch ~/.copilot/session-state/
│   │   │   ├── event-parser.ts        # Parse events.jsonl
│   │   │   ├── process-monitor.ts     # Monitor copilot processes
│   │   │   └── session-store.ts       # In-memory + SQLite session store
│   │   ├── database/
│   │   │   ├── schema.ts              # SQLite schema
│   │   │   └── queries.ts             # Data access layer
│   │   ├── ipc/
│   │   │   └── monitoring-ipc.ts      # IPC handlers
│   │   └── observability/
│   │       └── debug-server.ts        # HTTP debug endpoint for agents
│   ├── preload/
│   │   └── index.ts                   # contextBridge API
│   ├── renderer/
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx                    # Root with mode switching
│   │   ├── store/
│   │   │   ├── app-store.ts           # Zustand: mode, settings
│   │   │   └── monitoring-store.ts    # Zustand: sessions, events
│   │   ├── hooks/
│   │   │   ├── use-monitoring.ts
│   │   │   └── use-audio.ts
│   │   ├── modes/
│   │   │   ├── ModeRegistry.ts
│   │   │   ├── vanilla/               # Vanilla Mode (dashboard)
│   │   │   │   ├── VanillaMode.tsx
│   │   │   │   ├── EventTimeline.tsx
│   │   │   │   ├── SessionInfo.tsx
│   │   │   │   ├── ProcessSelector.tsx
│   │   │   │   └── UsageCharts.tsx    # Nivo charts
│   │   │   ├── island/                # Island Mode (3D)
│   │   │   │   ├── IslandMode.tsx
│   │   │   │   ├── scene/
│   │   │   │   │   ├── Island.tsx
│   │   │   │   │   ├── Coco.tsx       # Main monkey
│   │   │   │   │   ├── SubAgentMonkey.tsx
│   │   │   │   │   ├── Jungle.tsx
│   │   │   │   │   └── Coconut.tsx
│   │   │   │   └── audio/
│   │   │   │       └── IslandAudio.ts
│   │   │   ├── learn/                 # Learn Mode (tutorials)
│   │   │   │   ├── LearnMode.tsx
│   │   │   │   ├── lessons/
│   │   │   │   │   ├── LessonRegistry.ts
│   │   │   │   │   ├── HowCopilotWorks.tsx
│   │   │   │   │   ├── AutopilotMode.tsx
│   │   │   │   │   ├── FleetCommand.tsx
│   │   │   │   │   └── SessionAnatomy.tsx
│   │   │   │   └── visualizations/
│   │   │   │       ├── SessionPlayback.tsx
│   │   │   │       └── EventGraph.tsx
│   │   │   └── ocean/                 # Ocean Mode (3D)
│   │   │       ├── OceanMode.tsx
│   │   │       ├── scene/
│   │   │       │   ├── Ocean.tsx
│   │   │       │   ├── Flipper.tsx    # Main dolphin
│   │   │       │   └── Waves.tsx
│   │   │       └── audio/
│   │   │           └── OceanAudio.ts
│   │   ├── components/
│   │   │   ├── ModeSelector.tsx
│   │   │   ├── StatusBar.tsx
│   │   │   ├── SettingsPanel.tsx
│   │   │   └── Overlay.tsx
│   │   └── styles/
│   └── shared/
│       ├── events.ts
│       ├── ipc-channels.ts
│       └── config.ts
├── test/
│   ├── unit/
│   ├── e2e/
│   └── fixtures/
│       ├── events/                    # Sample events.jsonl files
│       └── sessions/                  # Sample session directories
├── electron.vite.config.ts
├── electron-builder.yml
├── package.json
└── tsconfig.json
```

## Process Architecture

```
┌──────────────────────────────────────────────┐
│              Main Process                     │
│                                               │
│  ┌──────────────┐  ┌────────────────┐        │
│  │ FileWatcher   │  │ ProcessMonitor │        │
│  │ (chokidar)    │  │ (ps polling)   │        │
│  └──────┬───────┘  └───────┬────────┘        │
│         │                   │                 │
│         ▼                   ▼                 │
│  ┌──────────────────────────────────────┐    │
│  │       SessionStore + SQLite          │    │
│  │  - active sessions                   │    │
│  │  - event history                     │    │
│  │  - session analytics                 │    │
│  └──────────────┬───────────────────────┘    │
│                 │ IPC                         │
│  ┌──────────────┴───────────────────────┐    │
│  │     Debug HTTP Server (:9876)        │    │
│  │  GET /api/state  → current state     │    │
│  │  GET /api/screenshot → app capture   │    │
│  └──────────────────────────────────────┘    │
├──────────────────┬───────────────────────────┤
│                  ▼                            │
│          Renderer Process                     │
│                                               │
│  ┌──────────────────────────────────────┐    │
│  │       Zustand MonitoringStore        │    │
│  └──────────────┬───────────────────────┘    │
│                 │                             │
│    ┌────────────┼────────────┬──────────┐    │
│    ▼            ▼            ▼          ▼    │
│  Vanilla    Island       Learn      Ocean    │
│  (React     (R3F +       (Nivo +    (R3F +   │
│   + Nivo)   Howler)      React)     Howler)  │
└──────────────────────────────────────────────┘
```

## App Settings

Persisted settings (in app data directory):

```typescript
interface AppSettings {
  // Mode
  defaultMode: 'vanilla' | 'island' | 'learn' | 'ocean';  // default: 'vanilla'
  
  // Audio
  audioEnabled: boolean;           // default: false
  audioVolume: number;             // default: 0.5 (0-1)
  
  // Monitoring
  monitoringSource: 'copilot-cli'; // only option for now
  copilotConfigDir: string;        // default: '~/.copilot'
  
  // Display
  showOverlay: boolean;            // default: true (for 3D modes)
  theme: 'auto' | 'dark' | 'light'; // default: 'auto'
  
  // System tray
  minimizeToTray: boolean;         // default: true
}
```

## Window Title

Dynamic: `"Cocopilot — Monitoring <session-summary>"` or `"Cocopilot — No active sessions"`.

## System Tray

The app lives in the system tray when minimized, showing a quick status icon. Click to restore. Menu items:
- Show/Hide window
- Current session info (if any)
- Quit

## Observability for Coding Agents

A built-in debug HTTP server (only on localhost) enables coding agents to inspect app state:

```
GET /api/state         → JSON: current sessions, events, settings, mode
GET /api/screenshot    → PNG: current app window screenshot
GET /api/events?n=20   → JSON: last N events
GET /api/processes     → JSON: detected copilot processes
```

This allows agents to programmatically verify that monitoring is working, events are flowing, and visualizations are correct. Playwright E2E tests also use `toHaveScreenshot()` for visual regression testing.
