import React, { useEffect } from 'react'
import { useAppStore } from './store/app-store'
import { useMonitoringStore } from './store/monitoring-store'
import { useAudio } from './audio/use-audio'
import { useEventSounds } from './audio/use-event-sounds'
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
