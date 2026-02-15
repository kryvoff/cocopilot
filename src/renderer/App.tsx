import { useEffect } from 'react'
import { useAppStore } from './store/app-store'
import { useMonitoringStore } from './store/monitoring-store'
import StatusBar from './components/StatusBar'
import VanillaMode from './modes/vanilla/VanillaMode'

function App(): React.JSX.Element {
  const mode = useAppStore((s) => s.mode)
  const { fetchSessions, subscribeToEvents } = useMonitoringStore()

  useEffect(() => {
    fetchSessions()
    const unsubscribe = subscribeToEvents()
    return unsubscribe
  }, [fetchSessions, subscribeToEvents])

  return (
    <div className="app">
      <main className="app-main">
        {mode === 'vanilla' && <VanillaMode />}
        {mode === 'island' && <div className="placeholder">Island Mode — Coming in v0.2</div>}
        {mode === 'learn' && <div className="placeholder">Learn Mode — Coming in v0.2.5</div>}
        {mode === 'ocean' && <div className="placeholder">Ocean Mode — Coming in v0.3</div>}
      </main>
      <StatusBar />
    </div>
  )
}

export default App
