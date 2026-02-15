# Cocopilot Progress Tracker

## Current Phase: Planning & Documentation (v0.1 prep)

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

#### Next Steps
- [x] User reviews updated docs and plan
- [x] Scaffold electron-vite project with TypeScript
- [x] Set up CI/CD GitHub Actions
- [x] Implement monitoring core (file watcher, event parser)
- [x] Implement SQLite schema and data layer
- [x] Build Vanilla Mode dashboard
- [x] Set up test infrastructure (Vitest, Playwright, fixtures)
- [x] CI passes on all 3 OS (ubuntu, macos, windows): lint, typecheck, 21 unit tests, build

#### Upcoming
- [ ] Create app settings panel
- [ ] Add more dashboard components (usage charts, session info panels)

---

## Version Roadmap

| Version | Milestone | Status |
|---------|-----------|--------|
| v0.1 | Vanilla Mode + Monitoring + SQLite + Tests + CI/CD | 🔧 Planning |
| v0.2 | Island Mode (Coco + 3D scene + audio) | 📋 Spec'd |
| v0.2.5 | Learn Mode (tutorials + session playback) | 📋 Spec'd |
| v0.3 | Ocean Mode (Flipper + ocean scene) | 📋 Spec'd |
