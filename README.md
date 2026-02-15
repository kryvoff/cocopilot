# 🐵 Cocopilot — Coco the Copilot for Copilot!

> **A fun desktop companion that watches your GitHub Copilot CLI sessions and brings them to life with dashboards, 3D scenes, and sound!**

[![CI](https://github.com/kryvoff/cocopilot/actions/workflows/ci.yml/badge.svg)](https://github.com/kryvoff/cocopilot/actions/workflows/ci.yml)

## 🎉 What is this?

Cocopilot is a **Sunday vibe coding experiment** born from the pure joy of exploring [GitHub Copilot CLI](https://docs.github.com/en/copilot/copilot-cli) features — especially **autopilot mode** and **fleet (sub-agents)**! We wanted to understand how Copilot CLI actually works under the hood, and what better way than to build a fun monitoring app that visualizes every event, tool call, and token in real time?

This project is our entry for the [GitHub Challenge on DEV.to](https://dev.to/challenges/github-2026-01-21) 🏆

**The best part?** This entire app — every single line — was written *by* Copilot CLI (Claude Opus 4.6 model), *about* Copilot CLI. The human wrote zero code — just guided the AI. It's copilots all the way down! 🐒

## ✨ Features

### 📊 Vanilla Mode (v0.1)
- **Live event timeline** — watch every Copilot CLI event as it happens
- **Session info** — repository, branch, model, version at a glance
- **Stats cards** — requests, turns, tool calls, errors, sub-agents, duration
- **Activity chart** — Nivo line chart showing event activity over time
- **Event type distribution** — bar chart of event types
- **Session filtering** — active sessions shown by default, toggle to see all history
- **SQLite persistence** — sessions and events persist across restarts
- **Schema resilience** — gracefully handles unknown event types as Copilot evolves
- **Debug API** — `localhost:9876` endpoint for agent-driven verification
- **CLI check** — `npm run check` validates schema compatibility

### 🏝️ Island Mode (v0.2)
A 3D tropical island where **Coco the monkey** 🐵 reacts to your coding session:
- Procedural low-poly monkey with 7 animation states
- Speech bubbles showing current activity (✏️ Editing..., 🔍 Searching...)
- Sub-agent monkeys jump in from the left, exit to the right
- Tool objects (typewriter, binoculars, coconut, bottle) glow when active
- Animated ocean waves respond to activity level — calm when idle, stormy when busy
- Drifting clouds, palm trees, campfire, decorations
- Git-like event log panel with collapsible user message groups
- 8 sound effects with Howler.js audio system

### 📚 Learn Mode (v0.2.5)
Interactive tutorials that explain how Copilot CLI works:
- **Tutorial** — visual session lifecycle, event format, key concepts
- **Event Catalog** — 18 event types with descriptions, data fields, example JSON
- **Session Playback** — replay synthetic sessions with speed control and annotations

### 🌊 Ocean Mode (v0.3)
A deep underwater world with **Flipper the dolphin** 🐬:
- Procedural dolphin with 8 animation states (swimming, diving, jumping...)
- Coral reef with branching corals, brain corals, and waving anemones
- Ocean creatures: octopus (bash), seahorse (edit), starfish (search), sea turtle (view)
- Fish schools for sub-agents, jellyfish for errors, bubble effects
- Swaying seaweed, scattered rocks, animated sun rays

### 🎯 Across All Modes
- **Activity Bar** — top overlay showing agent state, sub-agent count, tool count, event rate
- **Session selector** — switch between copilot sessions from the status bar
- **Process monitoring** — tracks copilot CLI processes with CPU%, memory, threads
- **Session playback** — replay synthetic sessions for testing and demos

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) 22+ (LTS recommended)
- [GitHub Copilot CLI](https://docs.github.com/en/copilot/copilot-cli) installed and used at least once

### Install & Run

```bash
# Clone the repo
git clone https://github.com/kryvoff/cocopilot.git
cd cocopilot

# Install dependencies
npm install

# Start the app in dev mode (with hot reload!)
npm run dev
```

That's it! 🎉 The app will start monitoring your `~/.copilot/session-state/` directory. Open a terminal, start a Copilot CLI session (`copilot`), and watch Cocopilot light up!

### Check Schema Compatibility

```bash
# Scan your copilot sessions and check for unknown event types
npm run check
```

This runs the standalone `cocopilot check` CLI that inspects your `~/.copilot/session-state/`, parses all events, and reports whether the schemas are compatible.

### Build for Production

```bash
# Build the app
npm run build

# Preview the production build
npm run preview

# Package as a distributable (.dmg / .exe / .AppImage)
npm run build && npx electron-builder
```

### Install Stable + Dev Side-by-Side

You can run both a stable installed version and a dev version simultaneously:

```bash
# Build and install a stable version
npm run build && npx electron-builder
# Install the .dmg (macOS) / .exe (Windows) / .AppImage (Linux)
# The installed app uses its own data directory

# Run the dev version alongside it
npm run dev
# Dev uses the same ~/.copilot/ monitoring but separate app data
```

The installed app and dev version run independently — different Electron processes, different app data directories. They both monitor the same `~/.copilot/session-state/` (read-only), so you can have the stable version running while developing.

### Run Tests

```bash
# Unit tests (fast!)
npm run test:unit

# Type checking
npm run typecheck

# Smoke test — launches app, verifies debug server responds, exits
npm run test:smoke

# Everything
npm run typecheck && npm run test:unit && npm run build
```

> **Note:** The smoke test (`test:smoke`) builds the app, launches Electron, waits for the debug server at `localhost:9876` to respond, then exits. This catches runtime errors (like native module mismatches) that unit tests miss.

## 🏗️ How It Works

Cocopilot is a **read-only, local-only** Electron app that:

1. **Watches** `~/.copilot/session-state/` for `events.jsonl` files
2. **Parses** each event using [Zod](https://zod.dev/) schemas with `safeParse` — never crashes on unknown events!
3. **Displays** the events in real-time through the active mode (Vanilla, Island, Learn, or Ocean)

```
~/.copilot/session-state/*/events.jsonl
        ↓
  FileWatcher (chokidar)
        ↓
  EventParser (Zod safeParse — resilient to schema changes!)
        ↓
  SessionStore → IPC → React UI (Zustand)
        ↓
  📊 Vanilla | 🏝️ Island | 📚 Learn | 🌊 Ocean
```

### Privacy & Security

- **Read-only** — we never write to `~/.copilot/` or interact with Copilot processes
- **Local-only** — zero network calls, no telemetry, no cloud
- **Sandboxed** — Electron renderer runs with `sandbox: true` and `contextIsolation: true`

## 🧪 100% Built by Copilot

**Every single line of code in this project was written by GitHub Copilot CLI**, primarily using the **Claude Opus 4.6** model. The human's role was providing direction, reviewing output, and clicking "accept" — zero manual coding!

We're using:

- **Copilot CLI interactive mode** — for regular development
- **Autopilot mode** — for autonomous multi-file changes
- **Fleet (sub-agents)** — for parallel tasks like tests + implementation
- **Plan mode** — for architecture and design

The meta-beauty: a copilot monitoring app, built by copilot, monitored by itself! 🤯

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Electron + electron-vite |
| Language | TypeScript |
| UI | React 19 + Zustand |
| Schema Validation | Zod (resilient parsing) |
| Charts | Nivo |
| Database | SQLite (better-sqlite3) |
| File Watching | Chokidar |
| Testing | Vitest |
| CI/CD | GitHub Actions (3 OS) |

## 📁 Project Structure

```
src/
├── main/              # Electron main process
│   ├── monitoring/    # File watcher, event parser, session store
│   ├── database/      # SQLite schema and queries
│   ├── cli/           # Standalone CLI commands (cocopilot check)
│   ├── ipc/           # IPC handlers
│   └── observability/ # Debug HTTP server (:9876)
├── preload/           # Secure context bridge
├── renderer/          # React UI
│   ├── modes/         # Vanilla, Island, Learn, Ocean
│   ├── store/         # Zustand stores
│   └── components/    # StatusBar, SettingsPanel
└── shared/            # Types, IPC channels, config

scripts/
└── smoke-test.sh      # Launch app & verify debug server responds
```

## 🤝 Contributing

This is a fun weekend project — contributions, ideas, and feedback are welcome! Feel free to open issues or PRs.

## 📄 License

MIT — go wild! 🐵

---

*Made with ❤️ and way too many premium requests. Zero lines of human-written code — 100% Copilot CLI (Claude Opus 4.6).*
