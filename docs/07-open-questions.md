# Open Questions for Discussion

## Architecture Decisions

### Q1: React Three Fiber vs Plain Three.js?
**Context**: `@react-three/fiber` (R3F) lets us write Three.js scenes as React components, which fits our React architecture. Plain Three.js gives more control but means managing two paradigms.

**Recommendation**: Use R3F + drei. It simplifies scene composition, state management, and integrating 3D with React UI. Well-maintained, large community.

**Decision needed**: Confirm R3F approach, or prefer vanilla Three.js?

### Q2: State Management Library?
**Options**:
- **Zustand**: Minimal, fast, works well with React and Three.js
- **Jotai**: Atomic state, great for fine-grained reactivity
- **Redux Toolkit**: Full-featured but heavier
- **None (React Context)**: Simple but may have performance issues with frequent updates

**Recommendation**: Zustand - it's lightweight, TypeScript-friendly, and commonly used with R3F.

**Decision needed**: Confirm Zustand or prefer another?

### Q3: Database for Historical Data?
For the future analytics/usage view, we need persistent storage.

**Options**:
- **SQLite** (via `better-sqlite3`): Robust, great for analytics queries
- **LevelDB/RocksDB**: Key-value, fast writes
- **JSON files**: Simple but limited querying
- **IndexedDB** (renderer): Web-native but limited from main process

**Recommendation**: SQLite via `better-sqlite3`. Perfect for aggregation queries, widely supported, and the data model fits well.

**Decision needed**: Confirm SQLite? Or defer persistent storage to later?

### Q4: How to Handle the `copilot-cli` Config Directory Location?
The config dir defaults to `~/.copilot` but can be overridden via:
- `XDG_CONFIG_HOME` environment variable
- `--config-dir` CLI flag

**Recommendation**: Default to `~/.copilot`, add a settings UI to change the watched directory. Support `XDG_CONFIG_HOME` detection automatically.

**Decision needed**: Is `~/.copilot` hardcoded OK for MVP?

---

## Feature Scope Questions

### Q5: Should the app auto-start on system login?
Many monitoring apps start automatically. Electron supports this natively.

**Decision needed**: Include auto-start as an option?

### Q6: System Tray / Menu Bar Integration?
Should cocopilot live in the system tray/menu bar when minimized?

**Recommendation**: Yes, it's natural for a monitoring app. Show status icon with quick info.

**Decision needed**: Implement tray integration from the start or add later?

### Q7: Multiple Windows?
Should users be able to pop out modes into separate windows? E.g., have Hack Mode on one monitor and Coco Mode on another.

**Decision needed**: Single window for MVP, or support multi-window?

### Q8: Notification System?
Should the app send desktop notifications for certain events?
- Session started/ended
- Errors
- Quota warnings (e.g., "80% of premium requests used")

**Decision needed**: Which events should trigger notifications?

---

## Visual & Audio Questions

### Q9: Art Style for 3D Scenes?
**Options**:
- **Low poly** (recommended): Easy to find assets, performant, charming
- **Pixel art 3D**: Retro feel
- **Realistic**: Complex, heavy, harder to find free assets
- **Voxel**: Minecraft-like

**Recommendation**: Low poly. Best balance of aesthetics, performance, and asset availability.

**Decision needed**: Confirm low poly style?

### Q10: Audio On by Default?
Audio can be surprising in a development tool. Should it be:
- Off by default, toggle on
- On by default at low volume
- Prompt on first launch

**Recommendation**: Off by default, with a clear toggle and volume control.

**Decision needed**: Confirm audio-off default?

### Q11: Coco Character Design?
Options for the main monkey character:
- Use a pre-made low poly monkey model from Quaternius/Poly Pizza
- Create a custom character (more work but unique)
- Start with Blender's "Suzanne" monkey head as placeholder

**Recommendation**: Start with a free model from Quaternius (they have excellent CC0 animal packs), customize later if desired.

**Decision needed**: Acceptable to use existing free model?

---

## Technical Questions

### Q12: Ephemeral Events?
Many events are marked `ephemeral: true` (streaming deltas, usage, idle). These aren't persisted in `events.jsonl` normally but are available via the SDK's real-time event stream.

Should cocopilot:
- Only read persisted events from `events.jsonl` (simpler, sufficient for most features)
- Also connect to the CLI via SDK for real-time ephemeral events (richer but more complex)

**Recommendation**: Start with `events.jsonl` file watching only. It captures all non-ephemeral events. Add SDK connection as a future enhancement for real-time streaming.

**Note**: The `assistant.usage` event (with token counts and quota) IS ephemeral, so we won't get it from file watching alone. We can estimate from `session.shutdown.modelMetrics` instead, or add SDK integration later.

**Decision needed**: File watching only for MVP?

### Q13: SDK Integration for Real-Time Data?
The Copilot SDK can connect to a running CLI server and receive real-time events including ephemeral ones. This would enable:
- Live token count updates
- Streaming response visualization
- Real-time quota tracking

But it requires:
- The CLI running in server mode (`copilot --acp`)
- SDK dependency management
- More complex error handling

**Recommendation**: Phase 2 feature. File watching is sufficient for MVP.

**Decision needed**: Defer SDK integration?

### Q14: Privacy & Data Handling?
The `events.jsonl` may contain sensitive information:
- User prompts (code, questions)
- File paths
- Repository names
- Tool outputs (code content)

Should cocopilot:
- Display all data locally (it's the user's own data)
- Have an option to redact sensitive content in the UI
- Never transmit any data externally (already planned)

**Recommendation**: Display all data (it's local-only). Add a "streaming mode" that hides sensitive content for screen sharing.

**Decision needed**: Any privacy controls needed for MVP?

---

## Implementation Priority

### Q15: MVP Feature Set?
Proposed MVP (v0.1.0):
1. ✅ Hack Mode with event timeline and session stats
2. ✅ File-system monitoring of `~/.copilot/session-state/`
3. ✅ Process monitoring
4. ✅ Source filter (cli/vscode/all)
5. ⬜ Coco Mode with basic 3D scene and animations
6. ⬜ Audio (ambient + event sounds)
7. ⬜ Ocean Mode placeholder

**Decision needed**: Is this the right MVP scope? Should Coco Mode be in MVP or v0.2?

### Q16: Implementation Order?
Proposed phases:
1. **Phase 1**: Project setup (electron-vite, TypeScript, CI) + Monitoring core + Hack Mode
2. **Phase 2**: Coco Mode (3D scene, character, animations)
3. **Phase 3**: Audio system, event-to-sound mapping
4. **Phase 4**: Ocean Mode, overlay system
5. **Phase 5**: Analytics/usage view, SQLite storage

**Decision needed**: Agree with this phasing?

---

## Naming & Branding

### Q17: App Icon?
Ideas:
- Monkey with headphones and coconut
- Coconut with a copilot-style wing
- Monkey face in a terminal

**Decision needed**: Any preference?

### Q18: Window Title Format?
Options:
- "Cocopilot"
- "Cocopilot - Coco the copilot for copilot"
- "🥥 Cocopilot"
- Dynamic: "Cocopilot - Monitoring 2 sessions"

**Decision needed**: Preference?
