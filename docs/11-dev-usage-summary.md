# Development Usage Summary

All code was written by GitHub Copilot CLI v0.0.410 (Claude Opus 4.6) in a single day (Sunday, Feb 15, 2026). The human's role was providing direction, reviewing output, and clicking "accept" — zero manual coding.

## Copilot CLI Session Metrics

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

- **Session**: Short hex prefix of the session UUID (from `~/.copilot/session-state/<uuid>/`).
- **Events**: Total number of events in the session's `events.jsonl` file. An "event" is a single JSON line representing one discrete thing that happened during the Copilot CLI session — for example `session.start`, `user.message`, `assistant.turn_start`, `tool.execution_start`, `tool.execution_complete`, `subagent.started`, `session.shutdown`, etc. See `docs/01-copilot-cli-internals.md` for a full list of ~40 event types and their data fields.
- **Duration**: Wall-clock time from first to last event in the session. **Important caveat**: this is NOT the time the agent was actively running. It includes all idle time where the terminal was sitting open with no activity — e.g. while the human reviewed output, tested the app, took breaks, or switched to other tasks. The actual agent compute time is significantly less. For example, session c2c1b3ae shows 114 min duration but only has 2 messages and 50 turns — most of that time was idle.
- **Messages**: Number of `user.message` events — how many times the human sent a prompt to the agent.
- **Turns**: Number of `assistant.turn_start` events — how many times the agent started processing. Multiple turns per message happen when the agent uses tools and then continues reasoning.
- **Tools**: Number of `tool.execution_complete` events — total tool calls (file reads, edits, bash commands, grep searches, etc.).
- **Sub-agents**: Number of `subagent.started` events — fleet sub-agents spawned for parallel work.

## Cost Breakdown

### Copilot Premium Requests

GitHub charges **$0.04 per premium request**. One premium request is consumed per agent run — that is, per user message and per sub-agent spawn. The model used was almost exclusively **Claude Opus 4.6**, which has a **3× multiplier** (each run consumes 3 premium requests).

| Item                | Count | Multiplier | Premium Requests |
|---------------------|------:|-----------:|-----------------:|
| User messages       |    33 |         3× |               99 |
| Sub-agents          |    81 |         3× |              243 |
| **Total**           |       |            |          **342** |

However, sub-agents typically use a cheaper model (Haiku, 1× multiplier). Adjusting:

| Item                | Count | Multiplier | Premium Requests |
|---------------------|------:|-----------:|-----------------:|
| User messages       |    33 |         3× |               99 |
| Sub-agents (Haiku)  |    81 |         1× |               81 |
| **Total**           |       |            |          **180** |

At $0.04/request: **~$7.20** estimated for Copilot CLI usage.

From the actual GitHub billing page on Feb 15, 2026: **146 premium requests = $5.84** (gross). The difference from our estimate is because some sessions were still active when the billing data was captured, and not all turns/sub-agents may have consumed full premium requests.

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
| Copilot Premium Requests | $5.84 |
| GitHub Actions        | $3.55  |
| Codespaces storage    | <$0.01 |
| **Total gross**       | **$9.40** |
| **Billed**            | **$0** |

All costs were covered by the GitHub plan's included allowances — the billed amount was $0.

## Development Timeline

All development sessions documented in `docs/progress.md` happened within a single day. The project went from zero to a full-featured Electron app with 4 visual modes, 226 tests, CI/CD, and documentation — entirely AI-written.
