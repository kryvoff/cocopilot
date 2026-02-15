# Development Usage Summary

All code was written by GitHub Copilot CLI v0.0.410 (Claude Opus 4.6) in a single day (Sunday, Feb 15, 2026). The human's role was providing direction, reviewing output, and clicking "accept" — zero manual coding.

## Copilot CLI Session Metrics

| Session  | Events | Duration | Messages | Turns | Tools | Sub-agents |
|----------|-------:|:--------:|:--------:|------:|------:|-----------:|
| b05e65df |  1,296 |   65 min |        3 |    82 |   435 |         17 |
| 36d3ab10 |  4,675 |  317 min |       14 |   412 | 1,424 |         50 |
| c7100ec6 |  2,280 |   99 min |        5 |   312 |   601 |         14 |
| 5ea20091 |  1,008 |   60 min |        5 |   170 |   240 |          1 |
| 14e1df8a |    133 |    9 min |        2 |    16 |    40 |          0 |
| c2c1b3ae |    354 |  114 min |        2 |    50 |    98 |          0 |
| fc85eb9e |    291 |    8 min |        2 |    11 |   112 |          2 |
| a7011e76 |    474 |   45 min |        2 |    57 |   133 |          5 |
| 24069c42 |      5 |    — |        1 |     1 |     0 |          0 |
| f4a9250d |      5 |    — |        1 |     1 |     0 |          0 |
| 6016083e |    — |    — |      — |   — |   — |        — |
| **Total** | **10,521+** | **~12.8 hrs** | **37+** | **1,112+** | **3,083+** | **89+** |

Sessions 24069c42 and f4a9250d were started but effectively abandoned (1 message, no tool calls). Session 6016083e is the current/final session (this doc update). The "Duration" column is wall-clock time and includes idle time (see below).

## Column Explanations

- **Session**: Short hex prefix of the session UUID (from `~/.copilot/session-state/<uuid>/`).
- **Events**: Total number of events in the session's `events.jsonl` file. An "event" is a single JSON line representing one discrete thing that happened during the Copilot CLI session — for example `session.start`, `user.message`, `assistant.turn_start`, `tool.execution_start`, `tool.execution_complete`, `subagent.started`, etc. See `docs/01-copilot-cli-internals.md` for a full list of event types and their data fields.
- **Duration**: Wall-clock time from first to last event in the session. **Important caveat**: this is NOT the time the agent was actively running. It includes all idle time where the terminal was sitting open with no activity — e.g. while the human reviewed output, tested the app, took breaks, or switched to other tasks. The actual agent compute time is significantly less. For example, session c2c1b3ae shows 114 min duration but only has 2 messages and 50 turns — most of that time was idle.
- **Messages**: Number of `user.message` events — how many times the human sent a prompt to the agent.
- **Turns**: Number of `assistant.turn_start` events — how many times the agent started processing. Multiple turns per message happen when the agent uses tools and then continues reasoning.
- **Tools**: Number of `tool.execution_complete` events — total tool calls (file reads, edits, bash commands, grep searches, etc.).
- **Sub-agents**: Number of `subagent.started` events — fleet sub-agents spawned for parallel work.

## Model & Token Usage (from terminal log)

The Copilot CLI reports usage statistics at session end. Terminal output was captured for 3 of the 8 main sessions (see `docs/12-copilot-terminal-log.md`):

| Session  | Est. Premium Requests | API Time  | Code Changes | Model                |
|----------|-----------------------|-----------|--------------|----------------------|
| 36d3ab10 |                    42 | 1h 59m    | +982 / -190  | Claude Opus 4.6      |
| b05e65df |                     9 | 33m       | +99 / -65    | Claude Opus 4.6      |
| a7011e76 |                     6 | 11m 48s   | +345 / -109  | Claude Opus 4.6      |
| **Subtotal** |               **57** | **2h 44m** | **+1,426 / -364** |              |

All sessions also used **Claude Haiku 4.5** for sub-agent tasks (explore, task agents), but Haiku does not consume premium requests.

> **Note**: Terminal logs for the other 5 main sessions (c7100ec6, 5ea20091, 14e1df8a, c2c1b3ae, fc85eb9e) were not captured. Ghostty terminal does not store scrollback history to disk. The `events.jsonl` files do not contain `session.shutdown` events with premium request totals either.

## Cost Breakdown

### Copilot Premium Requests

GitHub charges **$0.04 per premium request**. One premium request is consumed per agent run — that is, per user message and per sub-agent spawn. The model used was almost exclusively **Claude Opus 4.6**, which has a **3× multiplier** (each run consumes 3 premium requests).

| Item                | Count | Multiplier | Premium Requests |
|---------------------|------:|-----------:|-----------------:|
| User messages       |    37 |         3× |              111 |
| Sub-agents          |    89 |         3× |              267 |
| **Total**           |       |            |          **378** |

However, sub-agents typically use a cheaper model (Haiku, 1× multiplier). Adjusting:

| Item                | Count | Multiplier | Premium Requests |
|---------------------|------:|-----------:|-----------------:|
| User messages       |    37 |         3× |              111 |
| Sub-agents (Haiku)  |    89 |         1× |               89 |
| **Total**           |       |            |          **200** |

At $0.04/request: **~$8.00** estimated for Copilot CLI usage.

The 3 sessions with terminal log data reported **57 estimated premium requests** total. Extrapolating to all sessions based on message+sub-agent counts gives ~200 total. From the actual GitHub billing page (captured mid-day on Feb 15): **146 premium requests = $5.84** (gross). The final total is higher as sessions continued after that snapshot.

### GitHub Actions CI/CD

The CI/CD pipeline runs unit tests on 3 OS and E2E tests on macOS. From the GitHub billing page on Feb 15, 2026:

| Runner           | Minutes | Price/min | Cost  |
|------------------|--------:|----------:|------:|
| Actions Linux    |      73 |    $0.006 | $0.44 |
| Actions macOS    |      42 |    $0.062 | $2.60 |
| Actions Windows  |      51 |    $0.010 | $0.51 |
| Actions storage  | 4.53 GB-hr | $0.000336 | <$0.01 |
| **Total**        |         |           | **$3.55** |

> macOS runners are ~10× more expensive per minute than Linux. The E2E tests (Playwright + Electron) only run on macOS, which accounts for most of the Actions cost.

### Total Project Cost (Feb 15, 2026)

| Category              | Cost   |
|-----------------------|-------:|
| Copilot Premium Requests | ~$8.00 |
| GitHub Actions        | $3.55  |
| Codespaces storage    | <$0.01 |
| **Total gross**       | **~$11.55** |
| **Billed**            | **$0** |

All costs were covered by the GitHub plan's included allowances — the billed amount was $0.

## Development Timeline

All development sessions documented in `docs/progress.md` happened within a single day. The project went from zero to a full-featured Electron app with 4 visual modes, 226 tests, CI/CD, and documentation — entirely AI-written.
