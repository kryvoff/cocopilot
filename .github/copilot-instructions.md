# Copilot Instructions for Cocopilot

## Project Overview

**Cocopilot** ("Coco the copilot for copilot") is an Electron desktop app that monitors GitHub Copilot CLI activity and visualizes it through dashboards, 3D scenes, and audio. It's designed to be fun and educational.

## How We Work

- **NEVER commit, push, or create releases** — the user reviews, tests manually, and commits themselves
- Make changes, then summarize what was done so the user can review
- Keep docs and code in sync — update docs when changing features
- Track progress in `docs/progress.md`
- **Always update `docs/progress.md`** at the end of every turn with current status

## Iteration Workflow

We work in iterations. At the end of each session, update `docs/progress.md` with two sections:

- **Next iteration** — Concrete fixes and improvements to do next (bugs reported, UI polish, small features). These are the immediate next steps.
- **Later** — Larger features, ideas, and enhancements that are planned but not urgent. These move to "Next iteration" when the time comes.

Always keep both sections current. When starting a new session, check "Next iteration" first.

## Key Locations

| What | Where |
|------|-------|
| Specifications | `docs/` folder (numbered markdown files) |
| Copilot CLI internals | `docs/01-copilot-cli-internals.md` |
| App architecture | `docs/02-electron-app-architecture.md` |
| Data model | `docs/03-monitoring-data-model.md` |
| Visual modes | `docs/04-visual-modes-scenes.md` |
| Testing strategy | `docs/05-testing-strategy.md` |
| CI/CD | `docs/06-ci-cd-release.md` |
| Decided questions | `docs/07-decisions-log.md` |
| Future ideas | `docs/08-future-ideas.md` |
| Progress tracking | `docs/progress.md` |
| Reference: Copilot SDK | `external/copilot-sdk/` (gitignored) |
| Reference: Copilot CLI | `external/copilot-cli/` (gitignored) |
| Copilot events schema | `external/copilot-sdk/nodejs/src/generated/session-events.ts` |
| Real session data | `~/.copilot/session-state/` |

## Tech Stack

- **Electron** + **electron-vite** + **TypeScript**
- **React 19** + **Zustand** (state) + **Nivo** (charts)
- **Three.js** via **@react-three/fiber** + **drei** (3D scenes)
- **Howler.js** (audio)
- **SQLite** via **better-sqlite3** (persistence)
- **Vitest** (unit/integration tests) + **Playwright** (E2E + visual regression)

## App Modes

| Mode | Version | Description |
|------|---------|-------------|
| Vanilla | v0.1 | Default dashboard (event timeline, stats, charts) |
| Island | v0.2 | 3D island with Coco (monkey) |
| Learn | v0.2.5 | Copilot CLI tutorials and session playback |
| Ocean | v0.3 | 3D ocean with Flipper (dolphin) |

## Monitoring Architecture

The app watches `~/.copilot/session-state/` for `events.jsonl` files. Each line is a JSON event with a `type` field. Key event types: `session.start`, `user.message`, `assistant.turn_start`, `tool.execution_start`, `tool.execution_complete`, `subagent.started`, `session.shutdown`.

The app monitors **one copilot CLI at a time**. If multiple CLIs are running, show count and let user select.

## Testing

- Debug HTTP server at `localhost:9876` for agent-driven verification
- `npm run test:unit` for fast feedback
- `npm run test:e2e` for full app testing
- Playwright `toHaveScreenshot()` for visual regression
- `MockCopilot` helper simulates copilot activity in tests

## Design Principles

1. Fun & educational — help users learn how Copilot CLI works
2. Single-session focus — deep understanding of one session
3. Read-only & local-only — never write to copilot state or send data online
4. Observable & testable — agents can verify the app works
5. Extensible — clean mode system for new visualizations
