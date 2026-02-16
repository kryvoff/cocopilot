---
title: Exploring Copilot CLI's New Features by Building a Monitoring App
published: true
cover_image: https://raw.githubusercontent.com/kryvoff/cocopilot/main/docs/cover-devto.png
tags: devchallenge, githubchallenge, cli, githubcopilot
---

*This is a submission for the [GitHub Copilot CLI Challenge](https://dev.to/challenges/github-2026-01-21)*

## What I Built

I wanted to try the new experimental GitHub Copilot CLI features — **autopilot mode**, **fleet (sub-agents)**, and **plan mode** — and really understand what's happening under the hood. The key insight: Copilot CLI writes every single event to `~/.copilot/session-state/*/events.jsonl` — tool calls, sub-agent spawns, messages, errors — all in real time. That level of observability is incredible.

So I built **Cocopilot**, a side project that watches those JSONL files and visualizes agent activity through dashboards, 3D scenes, and sound. The whole thing was built by Copilot CLI itself (Claude Opus 4.6) — I didn't write any code, just prompted, reviewed, and iterated.

🔗 **GitHub**: [github.com/kryvoff/cocopilot](https://github.com/kryvoff/cocopilot)

![Cocopilot Demo](https://raw.githubusercontent.com/kryvoff/cocopilot/main/docs/demo.gif)

## My Experience with Copilot CLI

I'm a Python developer with ~20 years of experience. This was my first TypeScript/Electron app — I relied entirely on the agent for the tech choices and implementation.

**What worked:**
- **Spec-first approach** — starting with specification docs kept the agent focused as the project grew
- **`progress.md` as agent memory** — this file bridged sessions, letting each new one pick up where the last left off. It works OK, but we're all still learning how to do multi-session agent work effectively
- **Testing as feedback loop** — a debug HTTP server at `localhost:9876` and Playwright E2E tests let the agent verify its own work. This was essential.
- **Fleet mode** — watching Copilot CLI spawn parallel sub-agents for independent tasks was genuinely exciting

**What I'm still figuring out:**
- Progress tracking between sessions isn't always smooth — sometimes the agent or I lost track of what had been done
- The event schema isn't fully documented, so there's guesswork involved
- Agent loops are powerful but still early — I'm learning alongside everyone else

## Honest Assessment

This is very much an unfinished experiment, not a product. There are performance issues, the app isn't feature-complete, and the Copilot CLI event schema isn't fully understood yet. But the core discovery stands: `events.jsonl` gives you fine-grained observability into what the agent is doing, and you can build all kinds of audio/visual monitoring on top of it.

I'm just one developer trying to figure out how to work with agents, and I'm super excited about what Copilot CLI makes possible. If you're curious about agent observability or want to see what a fully agent-generated Electron app looks like, check out the repo!
