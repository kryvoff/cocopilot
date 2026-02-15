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

#### Next Steps
- [ ] User reviews updated docs and plan
- [ ] Scaffold electron-vite project with TypeScript
- [ ] Set up CI/CD GitHub Actions
- [ ] Implement monitoring core (file watcher, event parser)
- [ ] Implement SQLite schema and data layer
- [ ] Build Vanilla Mode dashboard
- [ ] Set up test infrastructure (Vitest, Playwright, fixtures)
- [ ] Create app settings panel

---

## Version Roadmap

| Version | Milestone | Status |
|---------|-----------|--------|
| v0.1 | Vanilla Mode + Monitoring + SQLite + Tests + CI/CD | 🔧 Planning |
| v0.2 | Island Mode (Coco + 3D scene + audio) | 📋 Spec'd |
| v0.2.5 | Learn Mode (tutorials + session playback) | 📋 Spec'd |
| v0.3 | Ocean Mode (Flipper + ocean scene) | 📋 Spec'd |
