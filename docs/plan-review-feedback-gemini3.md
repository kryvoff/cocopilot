# Plan Review & Feedback

**Reviewer:** Gemini Agent
**Date:** February 15, 2026
**Status:** ✅ APPROVED (with minor recommendations)

## Executive Summary

The Cocopilot project plan is comprehensive, technically sound, and addresses a clear niche (educational/fun monitoring of local Copilot CLI sessions). The architecture (Electron + React + R3F + SQLite) is well-chosen for the goals. The "Agent-Native" design—building observability for coding agents *into* the app from day one—is a standout feature that will significantly accelerate development.

## Architecture Review

### 1. Electron vs. Tauri
**Decision:** Sticking with **Electron** is the correct choice for this specific project.
*   **Why:** While Tauri is lighter (Rust + system WebView), your heavy reliance on **React Three Fiber (WebGL)** makes Electron's bundled Chromium engine superior. It guarantees consistent 3D rendering across macOS, Windows, and Linux without worrying about Safari (WebKit) or Edge (WebView2) specific WebGL quirks.
*   **Trade-off:** The ~100MB binary size is an acceptable cost for rendering stability and developer velocity in a TypeScript-only stack.

### 2. Data Source Reliability
The strategy to prioritize **File Watching** (`~/.copilot/session-state/`) over **Process Monitoring** (`ps aux`) is correct.
*   **Process Monitoring is brittle:** Relying on `ps` to match "copilot" strings can fail if the user runs aliases, wrappers (e.g., `npx @githubnext/copilot-cli`), or if the binary name changes. Use process detection *only* for the "Running / Not Running" indicator, never for critical data.
*   **File System is truth:** The `events.jsonl` log is the definitive source of truth for the session state.

## Technical Recommendations

### 1. Defensive JSON Parsing
Since the Copilot CLI `events.jsonl` schema is undocumented and subject to change (beta software), your parser must be extremely resilient.
*   **Recommendation:** Use **Zod** for runtime schema validation.
*   **Why:** Instead of crashing on an unexpected field, `zod` allows you to `safeParse` and log warnings for unknown event types while still processing the rest of the stream. This future-proofs the app against CLI updates.

### 2. SQLite & File Locking
*   **Risk:** While `better-sqlite3` is synchronous and robust, ensure that the `~/.copilot` directory isn't being aggressively locked by antivirus or cloud sync tools (Dropbox/iCloud) which could cause read contention.
*   **Mitigation:** Wrap file reads in retry logic. Ensure the `FileWatcher` uses `awaitWriteFinish` (as planned) to avoid reading partial lines.

### 3. Performance & Memory
Electron + 3D Scene + File Watching can be heavy.
*   **Recommendation:** Aggressively dispose of 3D contexts when switching modes. Ensure `Howler.js` sounds are unloaded when not in use.
*   **Lazy Loading:** Use `React.lazy` for the heavy 3D modes (Island/Ocean) so the Vanilla dashboard loads instantly.

### 4. Agent-First Development
The `MockCopilot` and `localhost:9876` debug server are brilliant.
*   **Suggestion:** Extend the `MockCopilot` to support "fast-forward" playback. This allows E2E tests to simulate a 1-hour coding session in seconds to verify the "Summary" screens and memory leak stability.

## Action Items before Implementation

1.  **Add `zod`** to the project dependencies for robust event parsing.
2.  **Refine "Process Monitor":** Downgrade its importance in the architecture. It should be a "hint" system, not a primary data source.
3.  **Start Implementation:** The plan is ready. Begin with the `FileWatcher` and `EventParser` core—this is the hardest part to get right and blocks everything else.

## Conclusion
The plan is approved. The focus on "fun" (Island/Ocean modes) combined with rigorous "engineering" (SQLite, Agent Observability) makes this a high-quality project. Proceed to scaffolding.
