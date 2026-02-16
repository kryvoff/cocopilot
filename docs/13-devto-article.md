---
title: Exploring Copilot CLI's New Features by Building a Monitoring App
published: true
cover_image: https://raw.githubusercontent.com/kryvoff/cocopilot/main/docs/cover-devto.png
tags: devchallenge, githubchallenge, cli, githubcopilot
---

*This is a submission for the [GitHub Copilot CLI Challenge](https://dev.to/challenges/github-2026-01-21)*

## What I Built

I wanted to try the new experimental GitHub Copilot CLI features — **autopilot mode**, **fleet (sub-agents)**, and **plan mode** — and try and understand what's happening under the hood.

I built **Cocopilot**, an Electron app that monitors  `~/.copilot/session-state/*/events.jsonl` and visualises and makes sounds when Copilot does things. It was an experiment with spec-driven development and vibe coding trying to keep going via a `progress.md` and many agent turns and fleet using Claude Opus 4.6 with the Copilot CLI.

Overall it worked and I'm happy with the result:

🔗 **GitHub**: [github.com/kryvoff/cocopilot](https://github.com/kryvoff/cocopilot)

![Cocopilot Demo](https://raw.githubusercontent.com/kryvoff/cocopilot/main/docs/demo.gif)

## My Experience with Copilot CLI

- The new Copilot autopilot mode and fleet of sub-agents is awesome!
- I managed to vibe-code an app in a day for a few Euros
- Establishing a debug and test feedback loop where the agents can "see" the app is important
- Spec-driven development and a `progress.md` can work, but was a bit rocky
- See 🎥 **YouTube**: [Exploring Copilot CLI's New Features](https://youtu.be/i8tTvALxEC8) 

# Try it today

Type `copilot --yolo`, set `/experimental on`, shift tab to `autopilot` and type `/fleet Let's go ...`