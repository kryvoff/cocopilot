# Project Review — Cocopilot v0.5

> Review date: 2025-07-28
> Reviewer: Copilot CLI (automated review)

## 1. What We Built

Cocopilot ("Coco the copilot for copilot") is an Electron desktop app that monitors GitHub Copilot CLI sessions in real time and visualizes them through dashboards, 3D scenes, and sound. It watches `~/.copilot/session-state/` for `events.jsonl` files and renders the activity in four distinct modes:

| Mode    | Version | Description                                                   |
|---------|---------|---------------------------------------------------------------|
| Vanilla | v0.1    | Dashboard with event timeline, stats cards, Nivo charts       |
| Island  | v0.2    | 3D tropical island with Coco the monkey, speech bubbles       |
| Learn   | v0.2.5  | Tutorials, architecture docs, event catalog, session playback |
| Ocean   | v0.3    | 3D underwater world with Flipper the dolphin, coral reef      |

The entire app was written by GitHub Copilot CLI (Claude Opus 4.6) with human guidance — zero hand-written code.

## 2. Architecture

### Stack

| Layer           | Technology                                 |
|-----------------|-------------------------------------------|
| Desktop shell   | Electron 40 + electron-vite 5             |
| Language        | TypeScript 5.7 (strict)                   |
| UI framework    | React 19                                  |
| State           | Zustand 5 (app-store + monitoring-store)  |
| Schema          | Zod 4 with safeParse (resilient parsing)  |
| Charts          | Nivo (line + bar)                         |
| 3D              | Three.js via @react-three/fiber + drei    |
| Audio           | Howler.js (11 procedurally generated WAV→MP3 sounds) |
| Database        | SQLite via better-sqlite3                 |
| File watching   | Chokidar                                  |
| Testing         | Vitest 4 (unit) + Playwright (E2E)        |
| CI              | GitHub Actions (3-OS matrix)              |

### Process Architecture

```
Main Process                          Renderer Process
┌──────────────────────────┐         ┌─────────────────────────┐
│ FileWatcher (chokidar)   │         │ React 19 UI             │
│   → EventParser (Zod)    │   IPC   │   ├── VanillaMode       │
│   → SessionStore         │ ──────→ │   ├── IslandMode (R3F)  │
│   → SQLite (persistence) │         │   ├── OceanMode (R3F)   │
│ ProcessMonitor (ps/lsof) │         │   ├── LearnMode         │
│ DebugServer (:9876)      │         │   └── SettingsPanel     │
└──────────────────────────┘         │ Zustand stores          │
                                     │ AudioManager (Howler)   │
                                     └─────────────────────────┘
```

### Security Model

- Renderer sandboxed (`sandbox: true`, `contextIsolation: true`)
- Read-only access to `~/.copilot/` — never writes
- No network calls, no telemetry
- Context bridge exposes typed IPC API only

## 3. What Works Well

### Monitoring Pipeline
- **Robust event parsing** — Zod `safeParse` with `passthrough()` never crashes on unknown event types. Schema drift is detected and surfaced, not fatal.
- **SQLite persistence** — Sessions and events survive app restarts. Stale sessions auto-detected via filesystem mtime.
- **Process monitoring** — `ps`/`lsof`-based process detection maps PIDs to session directories, tracks CPU/memory/threads.
- **Session lifecycle** — Proper active/idle/completed state transitions with process-aware reactivation.

### 3D Scenes
- **Procedural characters** — Coco (monkey, 7 states) and Flipper (dolphin, 8 states) are fully procedural low-poly geometry, no external models needed.
- **Event-driven animation** — Characters react to real monitoring events via Zustand stores (coco-state, flipper-state).
- **Rich environments** — Island has palm trees, clouds, campfire, ocean waves; Ocean has coral reef, seaweed, god rays, ocean creatures.
- **Sub-agent visualization** — Mini-monkeys (Island) and fish schools (Ocean) spawn/despawn with sub-agent events.
- **Speech bubbles** — Contextual activity text above characters.

### Audio System
- **11 procedurally generated sounds** — All synthesized via Python (sine waves, noise, envelopes). No external audio assets needed.
- **Mode-aware ambient** — Island and Ocean each have their own ambient loop; stops when leaving mode.
- **Event-sound mapping** — Real-time events trigger appropriate sounds (typewriter for edits, coconut crack for bash, etc.).
- **Global audio hooks** — `useAudio` + `useEventSounds` in App.tsx manage audio lifecycle globally.

### Learn Mode
- **4 tabs**: Tutorial (Copilot CLI lifecycle), Architecture (how Cocopilot works), Event Catalog (18 event types), Session Playback.
- **Session playback** — Replays synthetic JSONL sessions with speed control (1x/2x/5x/10x) and annotations.
- **Self-documenting** — The app teaches users how Copilot CLI works and how Cocopilot monitors it.

### Testing
- **226 unit tests** — Covering event parser, session store, process monitor, coco-state, flipper-state, ocean events, learn mode, audio manager, playback integration.
- **15 test files** across monitoring, database, island, ocean, learn, audio, and integration.
- **7 E2E tests** — App launch, mode switching (4 modes), status bar, activity bar.
- **4 visual regression screenshots** — One per mode (macOS baseline).
- **Smoke test** — `npm run test:smoke` builds and verifies debug server responds.
- **Debug HTTP API** — 8+ endpoints for agent-driven verification at `localhost:9876`.

### Developer Experience
- **Hot reload** — `npm run dev` with electron-vite HMR.
- **Schema checker** — `npm run check` CLI scans real sessions for compatibility.
- **3-OS CI** — Unit tests on Ubuntu/macOS/Windows, E2E on macOS.

## 4. What's Missing or Incomplete

### 4.1 Empty Test Fixture Directories

The directories `test/fixtures/sessions/active/` and `test/fixtures/sessions/completed/` exist but are **empty**. These were planned in the testing strategy (see `docs/05-testing-strategy.md`) to contain mock session directories with `workspace.yaml` and `events.jsonl` for integration testing of directory-level monitoring. They were never populated.

**Impact**: Low — unit tests use `test/fixtures/events/*.jsonl` directly, and the E2E tests use the real app. But the testing strategy doc references these as if they exist.

### 4.2 Visual Regression Screenshots May Be Stale

Visual regression baselines in `test/e2e/visual-regression.test.ts-snapshots/` were captured at a specific point in development. Since then, multiple UI changes have been made (ActivityBar moved to bottom, settings became a page, ocean scene brightened, etc.). The CI workflow runs visual regression with `--update-snapshots` which means it always passes but never actually catches regressions.

**Impact**: Medium — visual regression testing is effectively a no-op in CI.

### 4.3 No Production Audio

All 11 sounds are procedurally synthesized using a Python script (`resources/audio/generate_sounds.py`). While functional and clever, they sound synthetic and placeholder-like. No professionally recorded or designed audio assets are used.

**Impact**: Low for a demo/experiment; would matter for a polished product.

### ~~4.4 Settings Page Audio Controls Use Local State~~ (Fixed in v0.6)

Fixed — Settings now uses `useAppStore` for audio toggle and volume, matching the StatusBar's behavior.

### 4.5 No Persistence of User Preferences

The app store (`src/renderer/store/app-store.ts`) is a plain Zustand store with no persistence middleware. On app restart:
- Mode resets to `island` (hardcoded default)
- Audio settings reset
- HUD visibility resets

**Impact**: Medium — minor annoyance for regular users.

### 4.6 E2E Tests May Be Fragile

E2E tests depend on:
- Electron app launching cleanly (rebuild step in `pretest:e2e`)
- Specific CSS class names (`.mode-button.active`, `.status-bar`)
- `waitForTimeout` delays (500ms–3000ms) rather than deterministic waits
- 3D canvas rendering within fixed timeouts

**Impact**: Medium — these may flake in different environments or under load.

### 4.7 No CI for Visual Regression on Linux/Windows

Visual regression tests only run on macOS in CI. There are no Linux or Windows screenshot baselines. The CI workflow uses `--update-snapshots` on macOS, so even macOS regressions aren't caught.

**Impact**: Low for a macOS-focused demo; matters for cross-platform polish.

### 4.8 Debug API `/docs` Endpoint in Production

The debug server at `:9876` serves an OpenAPI docs page with Scalar at `/docs`. This endpoint loads Scalar's JavaScript from a CDN URL embedded in an HTML template. In production builds or offline environments, this CDN fetch would fail, resulting in a broken docs page.

**Impact**: Low — the debug server is a development aid, not user-facing.

### 4.9 Testing Strategy Doc vs Reality

`docs/05-testing-strategy.md` references several things that don't exist:
- `npm run test:integration` — no such script in package.json
- `npm run test:coverage` — no such script
- `npm run lint` — exists but uses eslint v9 flat config, not called in CI
- Test file paths like `test/unit/monitoring/source-filter.test.ts`, `test/unit/database/schema.test.ts`, `test/unit/database/analytics.test.ts`, `test/unit/modes/vanilla/EventTimeline.test.tsx` — don't exist
- MockCopilot class described but not implemented as shown

**Impact**: Low — docs are aspirational, actual testing is solid.

## 5. Code Quality

### Strengths
- **Type safety** — Full TypeScript with separate tsconfig for node and web; `npm run typecheck` clean
- **226 unit tests** — Good coverage of core logic (monitoring, state machines, audio mapping, database)
- **Clean architecture** — Clear separation: main/preload/renderer/shared, mode-specific folders
- **Zustand stores** — Clean state management with derived state and event-driven updates
- **Zod schemas** — Resilient parsing that never crashes on unknown events

### Areas for Improvement
- **No ESLint in CI** — `npm run lint` exists but isn't run in the CI pipeline
- **No test coverage metrics** — No coverage reporter configured
- **Large components** — Some files (ActivityBar, StatusBar, SettingsPanel) mix logic and presentation
- **Inline styles in ActivityBar** — While functional, inconsistent with CSS-based styling elsewhere

## 6. Technical Debt

| Item                                    | Severity | Notes                                              |
|-----------------------------------------|----------|-----------------------------------------------------|
| ~~Settings audio uses local state~~   | ~~Medium~~ | Fixed in v0.6 — now uses `useAppStore`         |
| No preference persistence               | Medium   | Add Zustand `persist` middleware or electron-store  |
| Empty fixture directories               | Low      | Either populate or remove from test strategy doc    |
| Visual regression always updates         | Medium   | CI should compare, not update; update manually      |
| Testing strategy doc outdated            | Low      | Update to match actual scripts and file structure   |
| ~~`package.json` version still 0.1.0~~ | ~~Low~~  | Fixed in v0.6 — bumped to 0.6.0                |
| Debug server loads CDN in production     | Low      | Bundle Scalar or skip in prod                       |
| `waitForTimeout` in E2E tests           | Low      | Replace with `waitForSelector` or `waitForResponse` |
| `predev`/`prebuild` run electron-rebuild | Low      | Slows every dev start; consider caching             |

## 7. Recommendations for v1.0

### Must Fix
1. **Wire Settings audio to app store** — Replace `useState` with `useAppStore` in SettingsPanel.tsx
2. **Persist user preferences** — Add `zustand/middleware` persist or save to `electron-store`
3. **Fix visual regression CI** — Split into separate "compare" (fails on diff) and manual "update" workflows
4. **Update `package.json` version** — Bump to 0.5.0 or 1.0.0

### Should Fix
5. **Update testing strategy doc** — Align `docs/05-testing-strategy.md` with actual scripts and file structure
6. **Add ESLint to CI** — Include `npm run lint` in the CI workflow
7. **Clean up empty fixture dirs** — Either populate `test/fixtures/sessions/active/` and `completed/` or remove references
8. **Replace `waitForTimeout`** — Use proper Playwright waiting strategies in E2E tests

### Nice to Have
9. **Professional audio** — Replace synthesized sounds with designed audio assets
10. **Test coverage metrics** — Add vitest coverage reporter, set minimum thresholds
11. **Cross-platform visual regression** — Add Linux/Windows screenshot baselines in CI
12. **Bundle debug API docs** — Inline Scalar or serve locally instead of CDN
13. **Add keyboard shortcuts** — Mode switching, settings, audio toggle
14. **Performance profiling** — Measure and optimize 3D scene frame rates under load

## 8. Project Statistics

### Codebase

| Category         | Files | Lines  |
|------------------|------:|-------:|
| TypeScript (src) |    64 |  8,883 |
| Tests            |    18 |  3,538 |
| CSS              |     1 |    511 |
| Docs (markdown)  |    12 |  2,242 |
| Python (audio)   |     2 |    699 |
| Audio (MP3)      |    11 |      — |
| Config files     |     6 |      — |
| **Total**        |   114 | 15,873 |

- 13 runtime dependencies, 19 dev dependencies
- 226 unit tests across 15 test files
- 33 git commits

### Development Sessions (Sunday, Feb 15 2026)

All code was written by GitHub Copilot CLI v0.0.410 (Claude Opus 4.6) in a single day.

See [`docs/11-development.md`](11-development.md) for detailed session metrics, cost estimates, and column explanations.

---

*This review was generated by automated analysis of the codebase, documentation, and test infrastructure.*
