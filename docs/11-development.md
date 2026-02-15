# Development Sessions

All code was written by GitHub Copilot CLI v0.0.410 (Claude Opus 4.6) in a single day (Sunday, Feb 15, 2026). The human's role was providing direction, reviewing output, and clicking "accept" — zero manual coding.

## Session Metrics

| Session  | Events | Duration | Messages | Turns | Tools | Sub-agents |
|----------|-------:|:--------:|:--------:|------:|------:|-----------:|
| b05e65df |    910 |   58 min |        3 |    57 |   303 |         14 |
| 36d3ab10 |  4,675 |  318 min |       14 |   412 | 1,424 |         50 |
| c7100ec6 |  2,280 |  100 min |        5 |   312 |   601 |         14 |
| 5ea20091 |  1,008 |   60 min |        5 |   170 |   240 |          1 |
| 14e1df8a |    133 |   10 min |        2 |    16 |    40 |          0 |
| c2c1b3ae |    354 |  114 min |        2 |    50 |    98 |          0 |
| fc85eb9e |    291 |    8 min |        2 |    11 |   112 |          2 |
| **Total** | **9,651** | **11.1 hrs** | **33** | **1,028** | **2,818** | **81** |

## Column Explanations

- **Session**: Short hex prefix of the session UUID (from `~/.copilot/session-state/<uuid>/`)
- **Events**: Total number of events in the session's `events.jsonl` file. An "event" is a JSON line representing one thing that happened during the Copilot CLI session — e.g. a user message, an assistant turn starting, a tool execution, a sub-agent spawning, etc. See `docs/01-copilot-cli-internals.md` for all event types.
- **Duration**: Wall-clock time from first to last event in the session. **Important**: this is NOT the time the agent was actively running. It includes idle time where the terminal was sitting open with no activity (e.g. while the human reviewed output, took breaks, or switched to other tasks). The actual agent compute time is significantly less — likely 30-50% of the duration shown.
- **Messages**: Number of `user.message` events — i.e. how many times the human sent a prompt to the agent.
- **Turns**: Number of `assistant.turn_start` events — i.e. how many times the agent started processing. Multiple turns per message happen when the agent uses tools and then continues.
- **Tools**: Number of `tool.execution_complete` events — total tool calls (file reads, edits, bash commands, grep searches, etc.).
- **Sub-agents**: Number of `subagent.started` events — fleet sub-agents spawned for parallel work.

## Estimated Cost

Per-model token usage and exact costs are only available in `session.shutdown` events, which fire when a Copilot CLI session ends. Since these sessions were analyzed while still active during initial development, exact cost data is not available.

**Rough estimate** assuming ~1 premium request per assistant turn:

- Total turns: **1,028**
- At $0.04 per premium request: **~$41**
- This is a rough upper bound — some turns may not consume a full premium request, and pricing may vary by model and plan.

> Note: This estimate uses the assumption that one premium request costs approximately $0.04 (4 cents), which is the approximate rate for Claude Sonnet 4 on GitHub Copilot Pro+. The actual model used (Claude Opus 4.6) may have different pricing. Check [GitHub's billing documentation](https://docs.github.com/en/copilot/managing-copilot/managing-billing-for-github-copilot) for current rates.

## Development Timeline

All 19 development sessions documented in `docs/progress.md` happened within a single day. The project went from zero to a full-featured Electron app with 4 visual modes, 226 tests, CI/CD, and documentation — entirely AI-written.
