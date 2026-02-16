# 🐵 Cocopilot

> **An experiment exploring GitHub Copilot CLI's new features — autopilot, fleet (sub-agents), and the `events.jsonl` observability layer — by building a desktop app that visualizes agent activity in real time.**

[![CI](https://github.com/kryvoff/cocopilot/actions/workflows/ci.yml/badge.svg)](https://github.com/kryvoff/cocopilot/actions/workflows/ci.yml) · [DEV.to article](docs/13-devto-article.md) · [YouTube outline](docs/14-youtube-outline.md)

![Cocopilot Demo](docs/demo.gif)

## What is this?

I wanted to try the new experimental [GitHub Copilot CLI](https://docs.github.com/en/copilot/copilot-cli) features — **autopilot mode**, **fleet (sub-agents)**, and **plan mode** — and see how they actually work. The key discovery: Copilot CLI writes every event to `~/.copilot/session-state/*/events.jsonl` — tool calls, sub-agent spawns, messages, errors — all in real time. That's an incredible level of observability.

So I built **Cocopilot**, an Electron app that watches those JSONL files and turns them into dashboards, 3D scenes, and sound. It has a few visualization modes — a stats dashboard, a 3D island with a monkey character, an underwater scene, and a learning/tutorial mode.

**The whole thing was built by Copilot CLI itself** (Claude Opus 4.6 model). I didn't write any code — I just prompted, reviewed, tested manually, and iterated. It was also an experiment in whether agents can create, test, and drive Electron apps end-to-end.

This project is a submission for the [GitHub Challenge on DEV.to](https://dev.to/challenges/github-2026-01-21).

## What I learned

- **`events.jsonl` is gold** — Copilot CLI emits fine-grained events that let you monitor exactly what the agent is doing at every moment. You can build audio/visual indicators, dashboards, anything.
- **Spec-first workflow works** — I started with specification docs, then had the agent implement. Using `progress.md` as agent memory across sessions worked OK but is still rough — I'm still learning how to work effectively in these agent loops.
- **Agents can build and test apps** — I set up a debug HTTP server (`localhost:9876`) and Playwright E2E tests so the agent could verify its own work. This feedback loop was essential.
- **We're all still learning** — autopilot, fleet mode, and multi-session agent work are powerful but early. Sometimes the agent went in unexpected directions, progress tracking got confused, and there are still performance issues in the app.

## Quick Start

```bash
git clone https://github.com/kryvoff/cocopilot.git
cd cocopilot
npm install
npm run dev
```

The app watches `~/.copilot/session-state/` (read-only, local-only). Start a Copilot CLI session and watch it light up.

## Tech Stack

Electron + TypeScript + React 19 + Zustand · Three.js (3D scenes) · Nivo (charts) · Howler.js (audio) · SQLite · Vitest + Playwright (testing) · GitHub Actions CI

## ⚠️ Status: Experiment, Not a Product

This is very much an unfinished experiment. The app has performance issues, the event schema isn't fully understood, and it's not feature-complete. It's not a product — it's a weekend exploration by one developer trying to figure out how to work with agents and getting excited about discovering what Copilot CLI can do.

Feel free to fork it (MIT licensed), report bugs, or just poke around the code to see what agent-generated code looks like.

## 📄 License

MIT

---

*A vibe coding experiment — built by Copilot CLI, about Copilot CLI. ~$10 in premium requests, zero lines of human-written code.*
