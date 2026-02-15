# Visual Modes & Scene Design

## Mode Architecture

All visual modes share a common interface and receive the same monitoring data. The mode system is extensible - new modes are added by implementing `ModeComponent` and registering it.

```typescript
interface ModeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;                         // Emoji or icon path
  component: React.ComponentType<ModeProps>;
  thumbnail?: string;                   // Preview image
  supportsOverlay: boolean;             // Can show HUD overlay
  supportsAudio: boolean;               // Has audio component
}

interface ModeProps {
  // Monitoring data (read-only)
  sessions: Session[];
  activeSession: Session | null;
  latestEvents: CopilotEvent[];         // Last N events
  processes: ProcessInfo[];
  quota: QuotaInfo | null;
  
  // UI state
  overlayVisible: boolean;
  audioEnabled: boolean;
  settings: ModeSettings;
}
```

---

## Mode 1: Hack Mode (Dashboard)

**Purpose**: Developer-focused dashboard for monitoring and debugging copilot activity.

### Layout
```
┌──────────────────────────────────────────────┐
│ 🔧 Hack Mode          [Coco] [Ocean] [⚙️]   │
├──────────┬───────────────────────────────────┤
│ Sessions │  Event Timeline                   │
│          │  ┌──────────────────────────────┐ │
│ ● active │  │ 10:22:52 session.start       │ │
│ ○ idle   │  │ 10:22:53 user.message        │ │
│ ◌ done   │  │ 10:22:55 assistant.turn_start│ │
│          │  │ 10:22:56 tool.exec bash       │ │
│          │  │ 10:22:58 tool.exec grep       │ │
│          │  │ 10:23:00 assistant.message    │ │
│          │  └──────────────────────────────┘ │
├──────────┼───────────────────────────────────┤
│ Process  │  Session Stats                    │
│ Monitor  │  ┌──────────────────────────────┐ │
│          │  │ Duration: 5m 32s             │ │
│ PID 4308 │  │ Premium Requests: 3          │ │
│ CPU: 9%  │  │ Tokens: 50K in / 10K out    │ │
│ MEM: 373M│  │ Tools: 12 calls             │ │
│          │  │ Cost: ~$0.12                 │ │
│          │  │ Model: claude-sonnet-4.5     │ │
│          │  │ Mode: autopilot             │ │
│          │  └──────────────────────────────┘ │
└──────────┴───────────────────────────────────┘
```

### Key Components
- **Session List**: All discovered sessions with status indicators
- **Event Timeline**: Scrollable, filterable event log with color coding
- **Process Monitor**: CPU/memory for each copilot process
- **Session Stats**: Aggregated metrics for selected session
- **Usage Panel**: Quota remaining, cost estimates

---

## Mode 2: Coco Mode (Island & Monkeys)

**Purpose**: Fun, immersive 3D scene that brings copilot activity to life.

### Scene Description
A tropical island with a jungle interior, beach, and palm trees. "Coco" the monkey is the main character representing the copilot agent.

### Character Mapping
| Copilot Concept | Scene Element |
|----------------|---------------|
| Main agent session | **Coco** (main monkey) |
| Sub-agents (explore, task, etc.) | Smaller monkeys that appear when spawned |
| Tool calls | Coconuts being thrown/caught |
| User messages | Player character appears, speaks |
| Assistant thinking | Coco scratches head, looks thoughtful |
| Errors | Red flash, alarm sound |
| Idle/no sessions | Coco disappears into jungle, ambient sounds |
| Session start | Coco jumps out of jungle excitedly |
| Compaction | Storm/rain visual effect |

### State Transitions & Animations
```
Session States → Coco Behaviors:

  No Session     → Coco hidden in jungle (ambient jungle sounds)
  Session Start  → Coco jumps out, excited animation + monkey call
  User Message   → Thought bubble appears above Coco
  Thinking       → Coco paces, scratches chin
  Tool Call      → Coco picks up coconut, throws it
  Tool Complete  → Coconut lands (success=green, fail=red)
  Sub-agent      → New small monkey appears
  Sub-agent Done → Small monkey waves goodbye, disappears
  Autopilot      → Coco puts on sunglasses, confident pose
  Error          → Coco jumps back startled, red flash
  Session End    → Coco waves, walks back into jungle
```

### Scene Structure (Three.js)
```
Scene
├── Sky (gradient + clouds)
├── Ocean (water shader, distant)
├── Island
│   ├── Beach (sand plane)
│   ├── Terrain (heightmap)
│   ├── Palm Trees (instanced, swaying)
│   ├── Rocks
│   └── Jungle (dense background)
├── Characters
│   ├── Coco (main monkey, animated)
│   └── SubAgentMonkeys[] (dynamic)
├── Effects
│   ├── Coconuts[] (flying objects)
│   ├── Particles (sparkles, leaves)
│   └── TextBubbles[]
├── HUD Overlay (optional)
│   ├── StatusBar
│   ├── EventToast
│   └── MiniTimeline
├── Lighting
│   ├── Ambient light
│   ├── Directional light (sun)
│   └── Point lights (campfire)
└── Camera (orbit controls, auto-track Coco)
```

### Audio Design (Howler.js)
| Event | Sound |
|-------|-------|
| Ambient | Jungle sounds (birds, insects, wind) - looped |
| Session start | Monkey excited call |
| User message | Soft chime |
| Tool call | Coconut throw "whoosh" |
| Tool success | Satisfying "thunk" |
| Tool failure | Bonk/error sound |
| Sub-agent spawn | Playful monkey chatter |
| Error | Alarm/warning |
| Compaction | Thunder rumble |
| Session end | Peaceful goodbye melody |

---

## Mode 3: Ocean Mode (Dolphins & Waves)

**Purpose**: Calming ocean-themed visualization.

### Scene Description
Open ocean with waves, a coral reef visible below, and marine creatures representing copilot activity.

### Character Mapping
| Copilot Concept | Scene Element |
|----------------|---------------|
| Main agent session | **Splash** (main dolphin) |
| Sub-agents | Smaller fish/dolphins |
| Tool calls | Bubbles rising |
| User messages | Message in a bottle floats by |
| Thinking | Dolphin swims in circles |
| Idle | Calm ocean, whale song |
| Errors | Red jellyfish pulses |
| Session start | Dolphin leaps from water |

### Audio Design
| Event | Sound |
|-------|-------|
| Ambient | Ocean waves, distant whale song |
| Session start | Dolphin splash |
| Tool call | Bubble sounds |
| Error | Sonar ping |

---

## 3D Asset Sources (Free/Open)

### Models
| Asset | Source | License |
|-------|--------|---------|
| Low poly monkey | [Quaternius](https://quaternius.com/) | CC0 |
| Tropical island | [Poly Pizza](https://poly.pizza/) | CC-BY 3.0 |
| Palm trees | [three-low-poly](https://github.com/jasonsturges/three-low-poly) (npm) | MIT |
| Coconuts | Procedural (Three.js sphere + texture) | N/A |
| Dolphin | [Quaternius](https://quaternius.com/) | CC0 |
| Low poly ocean | Procedural (Three.js water shader) | N/A |
| Rocks, vegetation | [Poly Pizza](https://poly.pizza/) | CC-BY 3.0 |
| Fish | [Quaternius](https://quaternius.com/) | CC0 |

### Textures
| Asset | Source | License |
|-------|--------|---------|
| Sand, grass | [Poly Haven](https://polyhaven.com/) | CC0 |
| Water normal maps | Three.js examples | MIT |
| Sky gradients | Procedural | N/A |

### Audio
| Asset | Source | License |
|-------|--------|---------|
| Jungle ambient | [Pixabay](https://pixabay.com/sound-effects/) | Pixabay License (free) |
| Monkey calls | [Pixabay](https://pixabay.com/sound-effects/) | Pixabay License (free) |
| Ocean waves | [Pixabay](https://pixabay.com/sound-effects/) | Pixabay License (free) |
| UI sounds | [Mixkit](https://mixkit.co/free-sound-effects/) | Free |
| Coconut throw | [Freesound](https://freesound.org/) | CC0/CC-BY |
| Background music | [Pixabay](https://pixabay.com/music/) | Pixabay License (free) |

### NPM Packages for 3D
| Package | Purpose |
|---------|---------|
| `three` | 3D rendering engine |
| `@react-three/fiber` | React renderer for Three.js |
| `@react-three/drei` | Useful Three.js helpers (sky, water, etc.) |
| `three-low-poly` | Procedural low-poly environment objects |
| `howler` | Audio playback |

### Key Libraries
- **@react-three/fiber**: React bindings for Three.js - declarative scene composition
- **@react-three/drei**: Pre-built components (Sky, Water, OrbitControls, Text, etc.)
- **@react-three/postprocessing**: Visual effects (bloom, vignette)
- These allow writing Three.js scenes as React components, perfect for our architecture

## Overlay System

Both Coco and Ocean modes support an optional HUD overlay:

```
┌─────────────────────────────────────────┐
│  ┌─────────────────────────────────┐    │
│  │         3D Scene                │    │
│  │                                 │    │
│  │     🐒 Coco doing things       │    │
│  │                                 │    │
│  │  ┌────────────────┐            │    │
│  │  │ Events:         │            │    │
│  │  │ • bash (2.3s)   │            │    │
│  │  │ • grep (0.1s)   │            │    │
│  │  │ • edit (0.5s)   │            │    │
│  │  └────────────────┘            │    │
│  │                                 │    │
│  │  Session: 5m | Cost: $0.08     │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

The overlay is semi-transparent and can be toggled on/off. It shows:
- Recent events (compact format)
- Session duration and cost
- Current model and mode
- Quota remaining
