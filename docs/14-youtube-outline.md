# YouTube Video Outline — Cocopilot

**Target length**: ~5 minutes
**Title**: "Exploring Copilot CLI's New Features — Autopilot, Fleet & events.jsonl"
**Thumbnail**: `docs/cover-youtube.png`

---

## 1. Hook (0:00–0:30)

- "I tried the new experimental Copilot CLI features — autopilot, fleet, sub-agents — and discovered something cool: it writes every event to a JSONL file. So I built a side app to visualize what the agent is actually doing."

## 2. The Key Discovery: events.jsonl (0:30–1:30)

- Show `~/.copilot/session-state/` and an `events.jsonl` file
- "Copilot CLI emits fine-grained events — tool calls, sub-agent spawns, messages, errors — all in real time"
- Show autopilot mode running, fleet spawning sub-agents
- "This observability is what made the whole project possible"

## 3. Quick Demo: Cocopilot App (1:30–3:00)

- Launch app, briefly show the dashboard with live events
- Switch through the modes — 3D island, underwater scene
- "All built by Copilot CLI itself — I didn't write any code"
- Show it reacting in real-time to agent activity

## 4. How I Worked With the Agent (3:00–4:00)

- Spec-first: started with docs, then had the agent implement
- `progress.md` as agent memory across sessions — works OK, still learning
- Testing feedback loop: debug server + Playwright so the agent can verify its own work
- "We're all still figuring out how to use these agent loops effectively"

## 5. Honest Takeaways & Outro (4:00–5:00)

- This is an unfinished experiment, not a product — there are performance issues and the event schema isn't fully understood
- But the core insight stands: `events.jsonl` gives you incredible observability into what the agent is doing
- I'm just one developer trying to figure out how to work with agents, super excited about what Copilot CLI makes possible
- Links: GitHub repo, DEV.to article
- "If you're curious about agent observability, check it out — and let me know what you build!"

---

## Production Notes

- **Screen recording**: macOS or OBS
- **Terminal**: Ghostty
- **App resolution**: 1280×800
- **Thumbnail**: `docs/cover-youtube.png` (1280×720)
