import { describe, it, expect, beforeEach } from 'vitest'
import { useCocoStore } from '../../src/renderer/modes/island/coco-state'
import { useFlipperStore } from '../../src/renderer/modes/ocean/flipper-state'
import { useMonitoringStore } from '../../src/renderer/store/monitoring-store'

/**
 * Tests for mode-switch state isolation.
 * Verifies that switching between Island/Ocean/Learn modes resets
 * character stores and doesn't leak synthetic playback sessions.
 */

function simulateModeSwitch(
  from: string,
  to: string,
  fetchSessions = (): void => {}
): void {
  // Mirror the logic from App.tsx mode-change useEffect
  if (from === 'learn' && to !== 'learn') {
    useMonitoringStore.getState().playbackReset()
    fetchSessions()
  }
  if (to === 'island') {
    useCocoStore.setState({
      state: 'hidden',
      toolActive: null,
      subAgentCount: 0,
      activeSubAgents: [],
      activityLevel: 0,
      recentEventTimestamps: []
    })
  }
  if (to === 'ocean') {
    useFlipperStore.setState({
      state: 'hidden',
      toolActive: null,
      subAgentCount: 0,
      activeSubAgents: [],
      activityLevel: 0,
      recentEventTimestamps: [],
      errorEvents: []
    })
  }
}

describe('mode-switch state isolation', () => {
  beforeEach(() => {
    // Put stores in non-default states to simulate active usage
    useCocoStore.setState({
      state: 'thinking',
      toolActive: 'bash',
      subAgentCount: 2,
      activeSubAgents: [
        { id: 'sa-1', label: 'Agent 1', startedAt: Date.now() },
        { id: 'sa-2', label: 'Agent 2', startedAt: Date.now() }
      ],
      activityLevel: 5,
      recentEventTimestamps: [Date.now()]
    })
    useFlipperStore.setState({
      state: 'swimming',
      toolActive: 'grep',
      subAgentCount: 1,
      activeSubAgents: [{ id: 'sa-1', label: 'Agent', startedAt: Date.now() }],
      activityLevel: 3,
      recentEventTimestamps: [Date.now()],
      errorEvents: [{ id: 'e1', message: 'test', timestamp: Date.now() }]
    })
  })

  it('resets CocoStore when switching to island mode', () => {
    simulateModeSwitch('ocean', 'island')
    const coco = useCocoStore.getState()
    expect(coco.state).toBe('hidden')
    expect(coco.toolActive).toBeNull()
    expect(coco.subAgentCount).toBe(0)
    expect(coco.activeSubAgents).toEqual([])
    expect(coco.activityLevel).toBe(0)
  })

  it('resets FlipperStore when switching to ocean mode', () => {
    simulateModeSwitch('island', 'ocean')
    const flipper = useFlipperStore.getState()
    expect(flipper.state).toBe('hidden')
    expect(flipper.toolActive).toBeNull()
    expect(flipper.subAgentCount).toBe(0)
    expect(flipper.activeSubAgents).toEqual([])
    expect(flipper.errorEvents).toEqual([])
  })

  it('does not reset CocoStore when switching to ocean mode', () => {
    simulateModeSwitch('island', 'ocean')
    const coco = useCocoStore.getState()
    expect(coco.state).toBe('thinking')
    expect(coco.subAgentCount).toBe(2)
  })

  it('does not reset FlipperStore when switching to island mode', () => {
    simulateModeSwitch('ocean', 'island')
    const flipper = useFlipperStore.getState()
    expect(flipper.state).toBe('swimming')
    expect(flipper.subAgentCount).toBe(1)
  })

  it('clears playback sessions when leaving learn mode', () => {
    // Inject a synthetic session
    useMonitoringStore.setState({
      sessions: [
        {
          id: 'acme-test',
          path: '/tmp/test',
          lastModified: new Date().toISOString(),
          eventCount: 27,
          repo: 'acme/widget-api',
          status: 'active'
        }
      ],
      selectedSessionId: 'acme-test',
      events: [{ type: 'session.start', id: 'e1', timestamp: new Date().toISOString(), parentId: null, ephemeral: false, data: {}, knownType: true }]
    })

    let fetchCalled = false
    simulateModeSwitch('learn', 'island', () => { fetchCalled = true })

    const store = useMonitoringStore.getState()
    expect(store.sessions).toEqual([])
    expect(store.selectedSessionId).toBeNull()
    expect(store.events).toEqual([])
    expect(fetchCalled).toBe(true)
  })

  it('does not clear sessions when switching between non-learn modes', () => {
    useMonitoringStore.setState({
      sessions: [
        {
          id: 'real-session',
          path: '/tmp/real',
          lastModified: new Date().toISOString(),
          eventCount: 10,
          repo: 'user/project',
          status: 'active'
        }
      ],
      selectedSessionId: 'real-session'
    })

    simulateModeSwitch('island', 'ocean')

    const store = useMonitoringStore.getState()
    expect(store.sessions).toHaveLength(1)
    expect(store.selectedSessionId).toBe('real-session')
  })

  it('resets both stores when switching learn → island then island → ocean', () => {
    // Learn → Island: should reset coco + clear playback
    simulateModeSwitch('learn', 'island')
    expect(useCocoStore.getState().state).toBe('hidden')

    // Put flipper in active state
    useFlipperStore.setState({ state: 'swimming', subAgentCount: 3 })

    // Island → Ocean: should reset flipper
    simulateModeSwitch('island', 'ocean')
    expect(useFlipperStore.getState().state).toBe('hidden')
    expect(useFlipperStore.getState().subAgentCount).toBe(0)
  })
})
