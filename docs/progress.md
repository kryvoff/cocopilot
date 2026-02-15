# Cocopilot Progress Tracker

## Current Phase: v0.2 Development

### 2026-02-15

#### Session 1: Initial Planning
- [x] Researched `~/.copilot/session-state/` structure and event types
- [x] Discovered 40+ event types with rich data (see `docs/01-copilot-cli-internals.md`)
- [x] Found `session.shutdown` contains total premium requests, costs, per-model metrics
- [x] Found `assistant.usage` has per-request tokens and quota (ephemeral)
- [x] Cloned `copilot-sdk` and `copilot-cli` to `external/`
- [x] Researched Electron+Vite+Three.js best practices → chose electron-vite
- [x] Researched 3D assets → Quaternius (CC0), Poly Pizza (CC-BY)
- [x] Researched audio → Pixabay, Mixkit, Freesound
- [x] Researched charting → chose Nivo for timeline/dashboard visualizations
- [x] Created 8 specification documents in `docs/`
- [x] Created copilot instructions at `.github/copilot-instructions.md`
- [x] Resolved all 18 open questions with user feedback
- [x] Renamed modes: hack→vanilla, coco→island, added learn mode
- [x] Named characters: Coco (monkey), Flipper (dolphin)
- [x] Decided: React Three Fiber, Zustand, SQLite, Nivo
- [x] Decided: SQLite storage early (before visual modes)
- [x] Added observability (debug HTTP server) as v0.1 requirement
- [x] Created future ideas backlog (`docs/08-future-ideas.md`)

#### Session 2: Plan Review & Feedback Integration
- [x] Reviewed feedback from Gemini 3 and GPT-5.3-Codex
- [x] Key decision: Schema resilience via Zod `safeParse` + `passthrough()` (never crash on unknown events)
- [x] Key decision: Schema drift detection — track unknown event types, warn in UI
- [x] Key decision: `cocopilot check` CLI command for version/schema compatibility
- [x] Key decision: Defer visual regression, prioritize text/API-based testing
- [x] Key decision: Accept better-sqlite3 risk, validate in CI matrix
- [x] Updated `docs/03-monitoring-data-model.md` with schema resilience strategy
- [x] Updated `docs/05-testing-strategy.md` with testing priority order
- [x] Updated `docs/07-decisions-log.md` with decisions Q19-Q24

#### Session 3: Scaffold, CI/CD, Full Dependency Upgrade
- [x] Scaffolded electron-vite project with TypeScript + React 19
- [x] Implemented monitoring core (file watcher, Zod event parser, session store)
- [x] Implemented SQLite schema and data layer
- [x] Set up test infrastructure (Vitest, 21 tests, 3 fixtures)
- [x] Built Vanilla Mode dashboard shell
- [x] Set up CI/CD GitHub Actions (all green on 3 OS)
- [x] Created README with usage instructions and DEV.to challenge link
- [x] Added settings panel with mode selector, audio toggle, about section
- [x] Added mode placeholders (Island, Learn, Ocean) with feature previews
- [x] Optimized CI (build on ubuntu-only, tests still 3 OS)
- [x] **Full dependency upgrade to latest stable versions:**
  - Electron 34 → 40 (Chromium 144, Node.js 24)
  - electron-vite 3 → 5 (removed deprecated externalizeDepsPlugin)
  - Vitest 3 → 4
  - Zod 3 → 4 (migrated to native v4 import, z.record(key, val) API)
  - better-sqlite3 11 → 12
  - @vitejs/plugin-react 4 → 5
  - TypeScript 5.7 → 5.9
- [x] CI passes on all 3 OS: 21 tests pass, typecheck clean, build succeeds

#### Session 4: Dashboard, Database Persistence, CLI, Tests
- [x] **Database persistence**: Wired SQLite into SessionStore — sessions, events, and usage records now persist to `cocopilot.db` across restarts
- [x] SessionStore constructor accepts optional Queries (backward-compatible)
- [x] Added `loadFromDatabase()` to hydrate in-memory state on startup
- [x] `assistant.usage` events automatically create usage_records in DB
- [x] **Dashboard StatsCards**: Shows requests, turns, tool calls, errors, sub-agents, duration — computed from live events
- [x] **Dashboard EventTypeChart**: Pure CSS horizontal bar chart showing event type distribution sorted by count
- [x] **Dashboard ActivityChart**: Nivo line chart with area fill showing event activity over time, adaptive time bucketing (5s–5min), dark theme with tooltips
- [x] **`cocopilot check` CLI**: Standalone schema compatibility checker (`npm run check`) — scans all sessions, reports copilot versions, known/unknown event types, verdict
- [x] **Database tests**: 9 tests covering schema creation, upsert, insert, duplicate handling, listing, filtering, limits
- [x] **Dashboard logic tests**: 23 tests covering stats computation, duration formatting, event type grouping, time bucketing algorithms
- [x] All 53 tests pass, typecheck clean, build succeeds
- [x] **Fix**: Use `predev`/`prebuild` scripts for electron-rebuild (not postinstall, to avoid breaking unit tests)

#### Session 5: UX Polish, Session Filtering, Smoke Test
- [x] **Session status fix**: Stale sessions (no events in last hour) auto-marked as "completed" on startup
- [x] **Session filtering**: "Show all" toggle in Vanilla Mode, only active/idle sessions shown by default
- [x] **macOS menu fix**: Menu bar now shows "Cocopilot" instead of "Electron" (custom Menu template)
- [x] **StatusBar reorder**: Learn mode button moved next to settings gear (Vanilla | Island | Ocean | Learn | ⚙️)
- [x] **Smoke test**: `npm run test:smoke` — builds app, launches Electron, verifies debug server at :9876 responds
- [x] **README update**: Added CLI check docs, smoke test, dev vs stable instructions, updated feature list & project structure
- [x] 53 tests pass, typecheck clean, build succeeds

#### Session 6: Release Workflow
- [x] Created `.github/workflows/release.yml` — builds macOS/Linux/Windows distributables on `v*` tag push
- [x] Uploads artifacts per platform, creates draft GitHub Release with auto-generated notes
- [x] `CSC_IDENTITY_AUTO_DISCOVERY=false` prevents macOS code signing in CI
- [x] Updated `docs/06-ci-cd-release.md` to match actual workflow and electron-builder config

#### Session 7: v0.1 Release — Bug Fixes, Build, Release
- [x] **Fix stale sessions (root cause)**: New sessions from filesystem now use `events.jsonl` mtime to detect staleness — sessions with no activity >1hr are immediately marked "completed" instead of "active"
- [x] **Fix session update propagation**: `markStaleSessions()` now emits `session-updated` events so the renderer UI updates in real-time
- [x] **Disable code signing**: Added `mac.identity: null` + `forceCodeSigning: false` in electron-builder.yml, `CSC_IDENTITY_AUTO_DISCOVERY=false` in CI
- [x] **Fix build warnings**: Added `author` field to package.json, removed redundant `@electron/rebuild` devDependency (bundled in electron-builder)
- [x] **Release workflow**: Separated build (3 platforms) and release (single job downloads all artifacts, creates draft release)
- [x] **Verified**: 53 tests pass, typecheck clean, build succeeds, smoke test passes, DMG builds (203MB universal), debug API shows 1 active / 20 completed sessions
- [x] Committed and tagged v0.1.0

#### Session 8: Process Monitoring & Session Detection
- [x] **Process monitor**: New `ProcessMonitor` module polls `ps` every 5s for copilot CLI processes, tracks CPU%, RSS, threads, command, elapsed time
- [x] **Process-to-session mapping**: Uses `lsof` to map copilot PIDs to session directories via open `session.db` files
- [x] **Session reactivation**: Sessions automatically marked active when a copilot process is detected, marked completed when process stops
- [x] **Stale session fix (final)**: Root cause found — `user.message`/`assistant.turn_start` events replayed from disk were re-activating old sessions. Fix: only set status to "active" for events less than 1 hour old
- [x] **filesystem-based staleness**: `markStaleSessions()` now checks `events.jsonl` and directory mtimes on disk, not just in-memory timestamps
- [x] **Directory watching**: FileWatcher now detects new session directories via `addDir` event (not just events.jsonl files)
- [x] **Session selector always visible**: Dropdown always shown in UI even with 1 session, with process count badge and 🟢/🟡/⚪ status indicators
- [x] **Process info in dashboard**: Selected session shows CPU%, memory, threads, uptime when copilot process is running
- [x] **Debug API expanded**: Added `/api/processes` endpoint, added processes to `/api/state`
- [x] **Debug server fix**: Fixed URL to use `127.0.0.1` instead of `localhost` in Help menu
- [x] **Graceful shutdown**: FileWatcher now awaited before closing database (fixes shutdown race condition)
- [x] **Tests**: 9 new tests for ProcessMonitor (polling, events, structure) and SessionStore.updateProcesses. 62 tests pass
- [x] Typecheck clean, build succeeds, smoke test passes

#### Session 9: Island Mode v0.2
- [x] Installed 3D dependencies: three, @react-three/fiber, @react-three/drei
- [x] Installed audio dependencies: howler, @types/howler
- [x] Generated synthesized placeholder audio assets (8 sounds: ambient island loop, monkey call, chime, typewriter, coconut crack, error, success, goodbye) in resources/audio/
- [x] Built procedural 3D island scene: Canvas with Sky, ocean plane, sandy island platform, 5 palm trees with coconut clusters, sway animations
- [x] Created Coco the monkey as procedural low-poly character: sphere-based head/body/limbs, face details (eyes, ears, muzzle), 7 animation states (hidden, idle, entering, thinking, working, startled, waving)
- [x] Created Howler.js AudioManager singleton: loads 8 sounds, ambient loop, enable/disable/volume controls
- [x] Created useAudio and useEventSounds hooks: auto-start ambient in island mode, map events to sounds
- [x] Extracted event-sound mapping to pure function for testability
- [x] Created Coco state store (Zustand): maps monitoring events to animation states with auto-reverting timeouts
- [x] Created useIslandEvents hook: wires monitoring store → coco state + audio
- [x] Built HUD overlay: semi-transparent panel showing session status, event count, duration, recent events list
- [x] Built DebugPanel: toggle with 'D' key, shows FPS, Coco state, event queue, audio status
- [x] Changed default mode from vanilla to island, audio enabled by default
- [x] Added 35 new unit tests: 20 for coco-state store (all state transitions, timeouts, sub-agents), 15 for event-sound mapping
- [x] Fixed "Object has been destroyed" error: guarded IPC sends against destroyed window, cleanup listeners on window close
- [x] Added OpenAPI docs page at /docs with Scalar API reference UI
- [x] 97 tests pass (up from 62), typecheck clean, build succeeds

#### Session 10: Island Mode Fixes
- [x] Fixed audio loading: switched to Vite asset imports for MP3 files (was returning 404)
- [x] Fixed canvas: removed padding from .app-main so Island scene fills full viewport
- [x] Fixed sky: raised sun position for tropical look
- [x] Added session selector dropdown to StatusBar (works across all modes)
- [x] Added debug infrastructure: window.__cocopilot_debug, /api/renderer-state endpoint
- [x] Added audio indicator in HUD overlay, copy debug state button in debug panel
- [x] Consolidated all Island UI into StatusBar: HUD toggle, audio toggle (🔊/🔇)
- [x] Removed floating buttons from 3D viewport — clean scene
- [x] Fixed sky: added fallback background color, tuned Sky shader (turbidity=2, rayleigh=0.5)
- [x] 97 tests pass, build succeeds

#### Next Iteration
- [ ] Download high-quality audio assets from Pixabay to replace synthesized placeholders
- [ ] Add tool-specific objects on the island (typewriter, binoculars, coconut, bottle)
- [ ] Add sub-agent monkeys spawning from jungle

#### Later
- [ ] Add particle effects (sparkles for success, smoke for errors)
- [ ] Add thought/speech bubbles
- [ ] Begin Learn Mode (v0.2.5)

---

## Version Roadmap

| Version | Milestone | Status |
|---------|-----------|--------|
| v0.1 | Vanilla Mode + Monitoring + SQLite + Tests + CI/CD | ✅ Released |
| v0.2 | Island Mode (Coco + 3D scene + audio) | 🚧 In Progress |
| v0.2.5 | Learn Mode (tutorials + session playback) | 📋 Spec'd |
| v0.3 | Ocean Mode (Flipper + ocean scene) | 📋 Spec'd |
