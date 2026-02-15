import React, { useEffect, useState } from 'react'
import { useAppStore } from './store/app-store'
import { useMonitoringStore } from './store/monitoring-store'
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
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    fetchSessions()
    const unsubscribe = subscribeToEvents()
    return unsubscribe
  }, [fetchSessions, subscribeToEvents])

  return (
    <div className="app">
      <ActivityBar />
      {settingsOpen ? (
        <main className="app-main">
          <SettingsPanel onClose={() => setSettingsOpen(false)} />
        </main>
      ) : (
        <main className="app-main">
          {mode === 'vanilla' && <VanillaMode />}
          {mode === 'island' && <IslandMode />}
          {mode === 'learn' && <LearnMode />}
          {mode === 'ocean' && <OceanMode />}
        </main>
      )}
      <StatusBar onSettingsClick={() => setSettingsOpen(!settingsOpen)} />
    </div>
  )
}

export default App
