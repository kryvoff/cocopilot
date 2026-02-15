# Visual Modes & Scene Design

## Mode System

All visual modes share a common interface and receive the same monitoring data. New modes are added by implementing `ModeComponent` and registering it.

```typescript
interface ModeDefinition {
  id: 'vanilla' | 'island' | 'learn' | 'ocean';
  name: string;
  description: string;
  icon: string;
  component: React.ComponentType<ModeProps>;
  supportsOverlay: boolean;
  supportsAudio: boolean;
}

interface ModeProps {
  // Monitoring data (read-only, one selected session)
  selectedSession: Session | null;
  allProcesses: ProcessInfo[];        // All detected copilot CLIs
  processCount: number;               // How many copilot CLIs running
  latestEvents: CopilotEvent[];
  quota: QuotaInfo | null;

  // UI state
  overlayVisible: boolean;
  audioEnabled: boolean;
  settings: AppSettings;
}
```

---

## Mode 1: Vanilla Mode (v0.1) — Default Dashboard

**Purpose**: Clean, informative dashboard for monitoring copilot activity. "Vanilla" because it's the default, straightforward mode — nice but not flashy.

### Layout
```
┌──────────────────────────────────────────────────┐
│ 🥥 Cocopilot              [Vanilla] [⚙️ Settings]│
│ Monitoring: copilot (PID 4308)  [2 CLIs ▼]      │
├──────────┬───────────────────────────────────────┤
│ Session  │  Event Timeline (Nivo)                │
│ Info     │  ┌──────────────────────────────────┐ │
│          │  │ ● session.start      10:22:52    │ │
│ Duration │  │ ● user.message       10:22:53    │ │
│ 5m 32s   │  │ ● assistant.turn     10:22:55    │ │
│          │  │ ● tool.bash          10:22:56    │ │
│ Model    │  │ ● tool.grep          10:22:58    │ │
│ sonnet   │  │ ● assistant.msg      10:23:00    │ │
│          │  └──────────────────────────────────┘ │
│ Mode     ├───────────────────────────────────────┤
│ autopilot│  Usage Charts (Nivo)                  │
│          │  ┌──────────────────────────────────┐ │
│ Requests │  │ Tokens: ████████░░ 50K/10K       │ │
│ 3        │  │ Tools:  bash(5) grep(3) edit(2)  │ │
│          │  │ Cost:   ~$0.12                    │ │
│ Cost     │  │ Quota:  85% remaining             │ │
│ ~$0.12   │  └──────────────────────────────────┘ │
├──────────┼───────────────────────────────────────┤
│ Process  │  Tool Call Timeline (Nivo bar/gantt)  │
│ CPU: 9%  │  ┌──────────────────────────────────┐ │
│ MEM: 373M│  │ ─bash─────  ─grep─  ─edit──     │ │
│          │  │        ─view─    ─bash───        │ │
│          │  └──────────────────────────────────┘ │
└──────────┴───────────────────────────────────────┘
```

### Key Components
- **Process Selector**: Dropdown showing active copilot CLIs, select which to monitor
- **Session Info**: Duration, model, mode, premium requests, cost
- **Event Timeline**: Scrollable, filterable event log with color-coded types
- **Usage Charts**: Nivo visualizations for tokens, tools, cost breakdown
- **Tool Call Timeline**: Gantt-style chart showing tool execution timing
- **Process Monitor**: CPU/memory for the monitored process

---

## Mode 2: Island Mode (v0.2) — Coco's Tropical Island

**Purpose**: Fun, immersive 3D scene that brings copilot activity to life with Coco the monkey.

### Scene Description
A tropical island with a **jungle background** and **beach at the front/bottom**. This creates a "stage" where Coco and other characters can jump onto and do things. The camera looks at the beach from a slight angle, with the dense jungle behind.

### Characters
- **Coco** — A small low-poly monkey. Main character. Represents the active copilot session.
- **Sub-agent monkeys** — Smaller monkeys that appear when sub-agents spawn. Coco gestures at them to tell them what to do.
- **Tools** — Represented as objects. E.g., the "edit" tool → a typewriter that Coco types on.

### Character Mapping
| Copilot Concept | Scene Element |
|----------------|---------------|
| Main agent session | **Coco** (monkey on beach) |
| Sub-agents (explore, task) | Smaller monkeys appearing from jungle |
| Tool: edit/create | Typewriter with clicking sounds |
| Tool: bash | Coconut being cracked open |
| Tool: grep/glob | Coco looking through binoculars |
| Tool: web_search | Coco checking a message in a bottle |
| User message | Speech bubble appears |
| Assistant thinking | Coco scratches head |
| Errors | Red flash, Coco jumps back startled |
| Idle/no sessions | Coco disappears into jungle, ambient sounds only |
| Session start | Coco jumps out of jungle excitedly |
| Compaction | Brief rain/storm visual effect |

### State Transitions
```
No Session     → Coco hidden in jungle (ambient sounds)
Session Start  → Coco jumps out, monkey call sound
User Message   → Thought bubble appears
Thinking       → Coco paces, scratches chin
Tool Call      → Coco interacts with tool object (typewriter, binoculars, etc.)
Tool Complete  → Tool effect (success=sparkle, fail=puff of smoke)
Sub-agent      → New small monkey appears from jungle
Sub-agent Done → Small monkey waves, disappears into jungle
Autopilot      → Coco puts on sunglasses, confident pose
Error          → Coco jumps back, red flash
Session End    → Coco waves goodbye, walks into jungle
```

### Scene Structure (React Three Fiber)
```
<Canvas>
  <Sky />
  <Ocean />                         {/* distant water */}
  <Island>
    <Beach />                       {/* sand plane at front */}
    <Terrain />                     {/* heightmap */}
    <PalmTrees />                   {/* instanced, swaying */}
    <Jungle />                      {/* dense background */}
  </Island>
  <Coco state={agentState} />       {/* main monkey */}
  {subAgents.map(a => <SubAgentMonkey key={a.id} />)}
  <ToolObjects />                   {/* typewriter, binoculars, etc. */}
  <Effects />                       {/* particles, sparkles */}
  <TextBubbles />
  <AmbientLight />
  <DirectionalLight />              {/* sun */}
  <OrbitControls />                 {/* camera auto-tracks Coco */}
</Canvas>
```

### Audio Design (Howler.js)
| Category | Sound | Source |
|----------|-------|--------|
| Ambient | Chill island/Hawaii vibes, birds, gentle waves | Pixabay |
| Session start | Monkey excited call | Pixabay |
| User message | Soft chime | Mixkit |
| Tool: edit | Typewriter clicking | Pixabay |
| Tool: bash | Coconut crack | Freesound |
| Tool success | Satisfying "thunk" | Mixkit |
| Tool failure | Bonk/error | Mixkit |
| Sub-agent spawn | Playful monkey chatter | Pixabay |
| Error | Alarm/warning | Mixkit |
| Session end | Peaceful goodbye melody | Pixabay |

---

## Mode 3: Learn Mode (v0.2.5) — Copilot CLI Tutorials

**Purpose**: Interactive educational content explaining how Copilot CLI works.

### Lessons
| Lesson | Content |
|--------|---------|
| **How Copilot CLI Works** | Architecture diagram, session lifecycle, event flow |
| **Session Anatomy** | Walkthrough of a typical session with event playback |
| **Agent Modes** | Interactive vs Plan vs Autopilot vs Shell |
| **Tool Calls** | What tools exist, when they're used, timing |
| **Sub-Agents & Fleet** | How sub-agents spawn, parallel execution |
| **Autopilot Mode** | What happens in autonomous mode, event patterns |
| **Usage & Billing** | Premium requests, model costs, quota management |

### Visualizations
- **Session Playback**: Replay recorded sessions as animated timelines
- **Event Graphs**: Nivo-powered graphs showing event relationships (parent→child)
- **Timeline/Train Graphs**: Gantt-style visualization of tool execution overlap
- **Statistics**: Charts showing typical session patterns

Each lesson combines text explanation + interactive Nivo visualizations + optional session playback.

---

## Mode 4: Ocean Mode (v0.3) — Flipper's Ocean

**Purpose**: Calming ocean-themed visualization with Flipper the dolphin.

### Scene Description
Open ocean with waves, coral reef visible below, and marine creatures representing copilot activity.

### Characters
- **Flipper** — A friendly low-poly dolphin. Equivalent of Coco for ocean mode.
- **Sub-agent fish** — Smaller fish that appear for sub-agents.

### Character Mapping
| Copilot Concept | Scene Element |
|----------------|---------------|
| Main agent session | **Flipper** (dolphin) |
| Sub-agents | Smaller fish/dolphins |
| Tool calls | Bubbles rising |
| User messages | Message in a bottle floats by |
| Thinking | Flipper swims in circles |
| Idle | Calm ocean, distant whale song |
| Errors | Red jellyfish pulses |
| Session start | Flipper leaps from water |

### Audio Design
| Category | Sound | Vibe |
|----------|-------|------|
| Ambient | Ocean waves, whale song, Moana/Vaiana-style islander music | Relaxing, playful |
| Session start | Dolphin splash + cheerful melody | Exciting |
| Tool call | Bubble sounds | Gentle |
| Error | Sonar ping | Alerting |

---

## HUD Overlay (for 3D modes)

Both Island and Ocean modes support an optional semi-transparent overlay:

```
┌─────────────────────────────────────────┐
│         3D Scene                        │
│                                         │
│     🐒 Coco on the beach               │
│                                         │
│  ┌────────────────┐                     │
│  │ Recent Events:  │                    │
│  │ • bash (2.3s)   │                    │
│  │ • grep (0.1s)   │                    │
│  └────────────────┘                     │
│                                         │
│  Session: 5m | Cost: $0.08 | sonnet-4.5│
└─────────────────────────────────────────┘
```

Toggle with a button. Shows recent events (compact), session duration, cost, model.

---

## Asset Sources (Free/Open)

### 3D Models
| Asset | Source | License |
|-------|--------|---------|
| Monkey (Coco) | [Quaternius](https://quaternius.com/) animal pack | CC0 |
| Dolphin (Flipper) | [Quaternius](https://quaternius.com/) | CC0 |
| Tropical island parts | [Poly Pizza](https://poly.pizza/) | CC-BY 3.0 |
| Palm trees | [three-low-poly](https://www.npmjs.com/package/three-low-poly) | MIT |
| Typewriter | [Poly Pizza](https://poly.pizza/) | CC-BY 3.0 |
| Coconuts | Procedural (sphere + texture) | N/A |
| Fish | [Quaternius](https://quaternius.com/) | CC0 |

### Audio
| Asset | Source | License |
|-------|--------|---------|
| Jungle/island ambient | [Pixabay](https://pixabay.com/sound-effects/) | Pixabay License |
| Monkey calls | [Pixabay](https://pixabay.com/sound-effects/) | Pixabay License |
| Typewriter clicks | [Pixabay](https://pixabay.com/sound-effects/) | Pixabay License |
| Ocean waves | [Pixabay](https://pixabay.com/sound-effects/) | Pixabay License |
| Hawaii/island music | [Pixabay](https://pixabay.com/music/) | Pixabay License |
| Vaiana-style music | [Pixabay](https://pixabay.com/music/) | Pixabay License |
| UI sounds | [Mixkit](https://mixkit.co/free-sound-effects/) | Free |

### NPM Packages
| Package | Purpose |
|---------|---------|
| `three` | 3D rendering engine |
| `@react-three/fiber` | React renderer for Three.js |
| `@react-three/drei` | Sky, Water, OrbitControls, Text, etc. |
| `@react-three/postprocessing` | Bloom, vignette effects |
| `three-low-poly` | Procedural low-poly environment |
| `howler` | Audio playback |
| `@nivo/core`, `@nivo/bar`, `@nivo/line`, `@nivo/calendar` | Charts |
