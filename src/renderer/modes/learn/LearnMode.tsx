import React, { useState } from 'react'
import TutorialTab from './TutorialTab'
import ArchitectureTab from './ArchitectureTab'
import EventCatalogTab from './EventCatalogTab'
import PlaybackTab from './PlaybackTab'

type LearnTab = 'tutorial' | 'architecture' | 'catalog' | 'playback'

const TABS: { id: LearnTab; label: string; icon: string }[] = [
  { id: 'tutorial', label: 'How Copilot CLI Works', icon: '📖' },
  { id: 'architecture', label: 'How Cocopilot Works', icon: '🏗️' },
  { id: 'catalog', label: 'Event Catalog', icon: '📋' },
  { id: 'playback', label: 'Session Playback', icon: '🎬' }
]

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    overflow: 'hidden'
  } as React.CSSProperties,
  tabBar: {
    display: 'flex',
    gap: 0,
    borderBottom: '1px solid #2a2a4a',
    background: '#16213e',
    flexShrink: 0
  } as React.CSSProperties,
  tab: {
    padding: '10px 20px',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
    color: '#a0a0a0',
    borderBottom: '2px solid transparent',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'color 0.15s, border-color 0.15s'
  } as React.CSSProperties,
  tabActive: {
    color: '#4ecca3',
    borderBottomColor: '#4ecca3'
  } as React.CSSProperties,
  content: {
    flex: 1,
    overflow: 'auto',
    minHeight: 0
  } as React.CSSProperties
}

function LearnMode(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<LearnTab>('tutorial')

  return (
    <div style={styles.container}>
      <div style={styles.tabBar}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.tabActive : {})
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
      <div style={styles.content}>
        {activeTab === 'tutorial' && <TutorialTab />}
        {activeTab === 'architecture' && <ArchitectureTab />}
        {activeTab === 'catalog' && <EventCatalogTab />}
        {activeTab === 'playback' && <PlaybackTab />}
      </div>
    </div>
  )
}

export default LearnMode
