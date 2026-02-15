import React, { useEffect, useState } from 'react'
import { useAppStore } from './store/app-store'
import { useMonitoringStore } from './store/monitoring-store'
import StatusBar from './components/StatusBar'
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
      <main className="app-main">
        {mode === 'vanilla' && <VanillaMode />}
        {mode === 'island' && <IslandMode />}
        {mode === 'learn' && <LearnMode />}
        {mode === 'ocean' && <OceanMode />}
      </main>
      <StatusBar onSettingsClick={() => setSettingsOpen(true)} />
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}

export default App
