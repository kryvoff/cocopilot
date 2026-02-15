# Decisions Log

All architecture and design decisions, resolved during the planning phase.

## Architecture

| #   | Decision           | Choice                                         | Rationale                                                                        |
| --- | ------------------ | ---------------------------------------------- | -------------------------------------------------------------------------------- |
| Q1  | 3D Framework       | React Three Fiber + drei                       | Declarative 3D as React components; fits our React architecture; large ecosystem |
| Q2  | State Management   | Zustand                                        | Lightweight, TypeScript-friendly, works seamlessly with R3F                      |
| Q3  | Persistent Storage | SQLite (better-sqlite3)                        | Robust analytics queries; moved early in plan (before visual modes)              |
| Q4  | Config Directory   | `~/.copilot` default, configurable in settings | Support `XDG_CONFIG_HOME` auto-detection                                         |
| Q9  | Art Style          | Low poly                                       | Best balance of aesthetics, performance, asset availability                      |
| Q18 | Window Title       | Dynamic: `"Cocopilot — Monitoring <info>"`     | Informative at a glance                                                          |

## Features

| #   | Decision              | Choice                                              | Rationale                                     |
| --- | --------------------- | --------------------------------------------------- | --------------------------------------------- |
| Q5  | Auto-start on login   | No                                                  | Monitoring app, user starts when needed       |
| Q6  | System tray           | Yes                                                 | Natural for monitoring app, show quick status |
| Q7  | Window model          | Single window                                       | Multiple app instances for power users        |
| Q8  | Desktop notifications | No (future idea)                                    | Keep it simple for now                        |
| Q10 | Audio default         | Off, configurable in settings                       | Don't surprise users; persist preference      |
| Q11 | Character assets      | Pre-made from Quaternius/Poly Pizza                 | Start with free CC0 models, customize later   |
| Q12 | Ephemeral events      | File watching only (events.jsonl)                   | Simpler; sufficient for most features         |
| Q13 | SDK integration       | Deferred to later                                   | File watching is enough for MVP               |
| Q14 | Privacy               | Fully transparent, local-only                       | Read-only + local-only = secure               |
| Q15 | Version plan          | Vanilla=v0.1, Island=v0.2, Learn=v0.2.5, Ocean=v0.3 | Progressive enhancement                       |
| Q17 | App icon              | Monkey-themed copilot variant                       | Create variants for review                    |

## Naming

| Item                   | Name             |
| ---------------------- | ---------------- |
| Default dashboard mode | **Vanilla** mode |
| Tropical 3D mode       | **Island** mode  |
| Main monkey character  | **Coco**         |
| Educational mode       | **Learn** mode   |
| Ocean 3D mode          | **Ocean** mode   |
| Main dolphin character | **Flipper**      |

## Charting Library

**Nivo** — React-native with SVG+Canvas support, excellent for timeline/calendar/bar visualizations. Better than D3 (too low-level), Recharts (less flexible), Victory (smaller community).

## Schema Resilience & CLI Evolution

| #   | Decision                  | Choice                                  | Rationale                                                                            |
| --- | ------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------ |
| Q19 | Schema validation         | Zod with `safeParse`                    | Copilot CLI is evolving fast; graceful handling of unknown/changed event types       |
| Q20 | Unknown event types       | Parse & store raw, log warnings         | Never crash on new events; show drift warnings in UI                                 |
| Q21 | Copilot version tracking  | Record per session from `session.start` | Enables compatibility analysis and drift detection                                   |
| Q22 | Compatibility check       | `cocopilot check` CLI command           | Checks installed copilot version, validates schema compatibility                     |
| Q23 | better-sqlite3 risk       | Accept, validate in CI                  | Cross-platform native module issues will surface in CI matrix                        |
| Q24 | Visual regression testing | Defer, text/API-first                   | Start with unit/integration tests; add screenshot baselines later when UI stabilizes |

## Monitoring Approach

**Single-CLI focus**: Monitor one copilot CLI at a time. Show count of all active CLIs. Allow switching. This keeps the UX focused and educational.
