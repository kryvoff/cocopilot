# Cocopilot — Development Notes & Learnings

A running log of thoughts, learnings, and observations from building Cocopilot entirely with GitHub Copilot CLI.

---

## 2026-02-15 — Session 1–3: Initial Build

### Learning #1: Specify latest package versions upfront

When scaffolding the project, we didn't explicitly request "use the latest stable versions of all packages." The initial scaffold used whatever versions `npm init` defaulted to, which were outdated:

- Electron 34 (latest was 40)
- electron-vite 3 (latest was 5)
- Vitest 3 (latest was 4)
- Zod 3 (latest was 4)

We had to immediately do a full dependency upgrade, which involved migrating APIs (Zod 4 native imports, electron-vite 5 removing `externalizeDepsPlugin`, etc.). **Next time: always say "use latest stable versions" in the initial scaffold prompt.**

### Observation: Copilot handles dependency upgrades well

Despite the version jumps being significant (Zod 3→4 is a major API change), Copilot researched the migration guides and handled the migration cleanly. The Zod 4 v3 compat layer had a bug with `z.record(z.unknown())` but switching to native `zod/v4` imports resolved it immediately.

### Observation: CI/CD was set up and green in one shot

The GitHub Actions CI with 3-OS matrix (ubuntu, macOS, Windows) passed on the first push. This is impressive — native modules like `better-sqlite3` can be tricky across platforms.

### Learning #2: ESM-only packages don't work with Electron

Chokidar 5 is ESM-only, which conflicts with electron-vite's default behavior of externalizing dependencies (main process loads them at runtime as CJS). We stayed on chokidar 4 — the API is identical, just CJS-compatible.

### Thought: Schema resilience is the right call

The Zod `safeParse` + `passthrough()` strategy means the app never crashes on unknown Copilot CLI events. This already proved useful — the app handles 40+ event types gracefully and logs any new ones it hasn't seen before. As Copilot CLI evolves rapidly, this will be essential.

### Observation: The app already works!

Even in this early state, the app correctly discovers and monitors real Copilot CLI sessions. The status bar shows active sessions and event counts. The meta moment of watching Cocopilot monitor itself being built by Copilot is deeply satisfying.

---

*This file is a living document. New entries will be added as development continues.*
