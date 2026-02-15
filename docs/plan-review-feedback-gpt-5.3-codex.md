# Cocopilot Plan Review Feedback (Constructive)

First: the planning docs are unusually thoughtful and cohesive. The vision is clear ("fun + educational"), the architecture is understandable, and the versioned mode roadmap is easy to follow.

## What is already strong

- Strong product positioning: educational monitor, not another generic dashboard.
- Good architecture split (main process monitoring + renderer mode system).
- Good decision hygiene (`docs/07-decisions-log.md`) and explicit defer list (`docs/08-future-ideas.md`).
- Testing mindset is excellent early (debug HTTP server + unit/integration/e2e strategy).
- Privacy model is simple and strong: local-only, read-only.

## What to discuss and adjust before implementation

## 1) Scope control for v0.1

`docs/progress.md` and `docs/06-ci-cd-release.md` currently bundle many high-effort areas at once (monitoring core + SQLite + observability API + cross-platform CI + e2e + release setup).  
Recommendation: make v0.1 a strict "Vanilla reliability" milestone and treat 3D/audio/advanced Learn content as explicitly out of scope until core telemetry quality is proven.

## 2) Missing `.github/workflows` vs planned CI/CD

`docs/06-ci-cd-release.md` is detailed, but there are currently no workflow files in `.github/workflows/`.  
Recommendation: align docs and repo state immediately by creating minimal CI first (lint, typecheck, unit tests, build), then layer integration/e2e and release workflows.

## 3) Security baseline should be explicit and testable

Architecture docs mention security principles, but Electron hardening should be tracked as non-optional acceptance criteria:

- `contextIsolation: true`
- `sandbox: true` (or documented exception)
- `nodeIntegration: false` in renderer
- strict IPC channel allowlist + sender validation
- strict CSP for renderer

Recommendation: add a small "security checklist" section to implementation tracking so this is verifiable, not implicit.

## 4) Visual regression strategy can become flaky quickly

Cross-OS screenshot testing in CI is valuable, but expensive and noisy if enabled too early.  
Recommendation: start visual snapshot baselines in one canonical environment (e.g. Linux + Chromium), then add per-OS baselines later when UI stabilizes.

## 5) Native module risk: `better-sqlite3`

`better-sqlite3` is fast and appropriate, but has packaging/ABI risk in Electron CI pipelines if rebuild/unpack is not handled carefully.  
Recommendation: before feature-heavy implementation, run a packaging spike that validates:

- `electron-rebuild` strategy in CI
- ASAR unpack rules for native `.node` binaries
- install/build behavior on macOS + Windows + Linux

If this spike is painful, consider an alternative SQLite driver with lower native packaging friction.

## 6) Clarify product success criteria now

The docs describe features well, but success metrics are not yet explicit.  
Recommendation: define measurable pre-launch KPIs, for example:

- app startup time target
- idle memory target
- event parse reliability target (no drops on append bursts)
- max acceptable UI latency from event write to render
- crash-free session percentage

This will help prioritize engineering decisions and avoid "feature-complete but unstable."

## Alternatives worth considering (without derailing)

- **Framework check:** keep Electron as default, but run a tiny Tauri comparison spike only to validate assumptions on memory/startup/security complexity.
- **Timeline visualization:** Nivo is a good choice overall, but it does not provide a native Gantt chart; for tool execution timelines, evaluate whether custom Nivo composition is enough before adding another chart dependency.
- **Data source evolution:** start file-watch only (good decision), but define interfaces now so SDK/ephemeral streams can be added cleanly later.

## What I would do differently

If I were executing this from zero, I would sequence as:

1. Hardened Electron shell + settings + minimal Vanilla UI frame.
2. Real event ingestion reliability (tailing, malformed lines, session switching).
3. Deterministic tests and CI in one environment.
4. SQLite persistence and historical analytics basics.
5. Expand to cross-OS visual regression and release signing/notarization.
6. Only then invest heavily in Island/Ocean polish.

This keeps momentum high while reducing the biggest technical and release risks early.

## Suggested immediate next discussion topics

1. Exact v0.1 in-scope vs out-of-scope list (single page, strict).
2. Security acceptance checklist for Electron defaults and IPC.
3. CI rollout order (minimal CI first, then e2e/visual, then release).
4. `better-sqlite3` risk mitigation plan (or fallback decision).
5. Concrete KPIs for performance and monitoring correctness.

---

Overall: the strategy is strong and very promising. A little more scope discipline and explicit risk gating before coding will materially increase the chance of a smooth and successful implementation.
