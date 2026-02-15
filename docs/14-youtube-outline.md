# YouTube Video Outline — Cocopilot Demo

**Target length**: ~10 minutes
**Title idea**: "I Built a Desktop App with Copilot CLI in One Day — Cocopilot"
**Thumbnail**: `docs/cover-youtube.png`

---

## 1. Hook & Intro (0:00–0:30)

- Quick visual: Copilot CLI doing something cool → Cocopilot reacting in real-time
- "I built a fun desktop app that watches GitHub Copilot CLI sessions — and the best part: every single file was written by Copilot CLI. I'm a Python developer — this is my first TypeScript app ever."

## 2. Demo: Copilot CLI Basics (0:30–2:30)

- Start a Copilot CLI session in the terminal
- Show **experimental mode** (selecting it on first run)
- Show **auto-accept** mode (`--auto-accept` flag — agent runs without asking for permission)
- Show **fleet/speed mode** — Copilot CLI spawning sub-agents for parallel work
- Point out the `~/.copilot/session-state/` directory and `events.jsonl` — "this is what Cocopilot reads"
- "Copilot CLI writes out every event to a JSONL file — this observability is what makes this whole project possible"

## 3. Demo: Cocopilot App — Vanilla Mode (2:30–4:00)

- Launch Cocopilot, show Vanilla dashboard
- Point out: session list, stats cards (events, tool calls, messages, errors)
- Event timeline — scroll through, show filtering by event type
- Activity chart — events over time
- Show how it updates in real-time when the Copilot CLI is running

## 4. Demo: Cocopilot App — Island Mode (4:00–5:00)

- Switch to Island mode
- Show the 3D tropical island with Coco the monkey
- Point out: palm trees, water, sky — "all procedurally generated in code, no downloaded assets"
- Coco reacts to agent activity — show him responding to tool calls and messages
- Mention the procedural audio (ocean waves, chimes for events)

## 5. Demo: Cocopilot App — Ocean Mode (5:00–5:30)

- Quick switch to Ocean mode
- 3D underwater scene with Flipper the dolphin
- Fish, coral, particles — all reactive to agent events

## 6. Demo: Cocopilot App — Learn Mode (5:30–6:30)

- Switch to Learn mode tabs:
  - **Concepts** — tutorials explaining how Copilot CLI works internally
  - **Events** — searchable catalog of all 26+ event types, with examples
  - **Playback** — session replay with speed control
  - **Schema** — data model documentation
  - **Sounds** — sound library with waveforms and spectrograms, click to play
- Run `npm run test:unit` — show 226 tests passing
- Run `npm run test:e2e` — show Playwright launching the app

## 7. Demo: Settings & Features (6:30–7:00)

- Settings panel: default mode, audio toggle, volume, HUD overlay
- Status bar: session count, event count, quick mode switching
- Dark mode throughout, custom scrollbars

## 8. How It Was Built — Docs & Process (7:00–8:30)

- Open the `docs/` folder, briefly scroll through:
  - `01-copilot-cli-internals.md` — reverse-engineered how Copilot CLI works
  - `02-electron-app-architecture.md` — app design
  - `09-sounds.md` — sound design documentation
  - `10-copilot-instructions.md` — the custom instructions that kept the agent on track
- Highlight **`progress.md`** — "This is the agent's memory across sessions — every session picks up where the last left off"
- Show `.github/copilot-instructions.md` — "These kept the agent on track: never commit, always update progress, follow the architecture"
- **Spec-first approach**: spent first 1–2 hours planning (docs 01–08), then iterated. Specs were fuzzy at first but got sharper as we learned.
- **Every file is agent-generated**: the human did manual testing, input, and many iterations — but never typed into any file

## 9. Learnings: What Worked & What Surprised Me (8:30–9:30)

**What worked:**
- Investing in testing and CI early paid off hugely — later sessions could make big changes confidently
- The debug HTTP server at `localhost:9876` let the agent verify its own work
- `progress.md` bridging sessions — the secret sauce for multi-session agent work

**The most fun surprise:**
- The plan was to download audio and 3D assets — the agent instead wrote Python scripts to generate all 11 sounds and wrote custom Three.js code for all 3D models
- Didn't even notice until review! End-of-turn summaries weren't always detailed enough to catch this
- Result: everything is code-generated, zero external assets — honestly better than the original plan

**What didn't work perfectly:**
- Initial scaffolding used old Electron/React versions (training data) — first hour was updating packages
- External code repos in `external/` weren't leveraged as much as hoped
- Progress tracking got confused sometimes between agent and human

**What I'd try differently:**
- Tell the agent upfront to use latest package versions
- Set up custom MCP servers or tools for more efficient agent workflows
- Could probably do this in a few hours instead of a full day with the right setup

## 10. Models, Costs & Cross-Model Thoughts (9:30–9:50)

- Roughly ~$10 in premium requests, $0 billed (covered by GitHub plan)
- Fantastic that we can use the latest models (Claude Opus 4.6) and latest Copilot CLI features with so few premium requests
- Had Gemini 3 and GPT-5.3-Codex do co-agent reviews — useful but human feedback was more important
- Would love to try building the same project with Gemini or GPT-5 Codex and compare

## 11. Outro & Links (9:50–10:00)

- GitHub link: github.com/kryvoff/cocopilot
- DEV.to article link
- "The `events.jsonl` observability in Copilot CLI is what made this possible — I hope this inspires more creative uses of that data!"
- Future: hook into the Copilot SDK for even richer monitoring
- Call to action: star the repo, try building with Copilot CLI

---

## Production Notes

- **Screen recording**: Use macOS screen recording or OBS
- **Terminal**: Ghostty with the same dark theme used during development
- **App resolution**: 1280×800 or similar, matching the screenshots
- **Transitions**: Simple cuts between sections, no fancy effects needed
- **Thumbnail**: `docs/cover-youtube.png` (1280×720)
