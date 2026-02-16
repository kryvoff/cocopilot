import React, { useEffect } from 'react'
import { useAppStore } from './store/app-store'
import { useMonitoringStore } from './store/monitoring-store'
import { useAudio } from './audio/use-audio'
import { useEventSounds } from './audio/use-event-sounds'
import { useCocoStore } from './modes/island/coco-state'
import { useFlipperStore } from './modes/ocean/flipper-state'
import StatusBar from './components/StatusBar'
import ActivityBar from './components/ActivityBar'
import SettingsPanel from './components/SettingsPanel'
import VanillaMode from './modes/vanilla/VanillaMode'
import IslandMode from './modes/island/IslandMode'
import LearnMode from './modes/learn/LearnMode'
import OceanMode from './modes/ocean/OceanMode'

function App(): React.JSX.Element {
  const mode = useAppStore((s) => s.mode)
  const { fetchSessions, subscribeToEvents } = useMonitoringStore()

  // Global audio management — called once, manages ambient per mode
  useAudio()
  useEventSounds()

  useEffect(() => {
    fetchSessions()
    const unsubscribe = subscribeToEvents()
    return unsubscribe
  }, [fetchSessions, subscribeToEvents])

  // Reset playback state when leaving Learn mode so synthetic sessions
  // don't leak into Island/Ocean/Vanilla mode session selectors
  const prevModeRef = React.useRef(mode)
  useEffect(() => {
    if (prevModeRef.current === 'learn' && mode !== 'learn') {
      // Re-fetch real sessions to clear any playback data
      useMonitoringStore.getState().playbackReset()
      fetchSessions()
    }
    // Reset 3D character stores when entering their respective modes
    // to avoid stale animation states (phantom monkeys, dolphin float-up)
    if (mode === 'island') {
      useCocoStore.setState({
        state: 'hidden',
        toolActive: null,
        subAgentCount: 0,
        activeSubAgents: [],
        activityLevel: 0,
        recentEventTimestamps: []
      })
    }
    if (mode === 'ocean') {
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
    prevModeRef.current = mode
  }, [mode, fetchSessions])

  return (
    <div className="app">
      <main className="app-main">
        {mode === 'vanilla' && <VanillaMode />}
        {mode === 'island' && <IslandMode />}
        {mode === 'learn' && <LearnMode />}
        {mode === 'ocean' && <OceanMode />}
        {mode === 'settings' && <SettingsPanel />}
      </main>
      <ActivityBar />
      <StatusBar />
    </div>
  )
}

export default App
