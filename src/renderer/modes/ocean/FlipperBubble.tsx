import React, { useState, useEffect } from 'react'
import { Html } from '@react-three/drei'
import type { FlipperState } from './Flipper'

interface FlipperBubbleProps {
  state: FlipperState
  toolName: string | null
  position: [number, number, number]
}

function getBubbleText(state: FlipperState, toolName: string | null): string | null {
  switch (state) {
    case 'hidden':
      return null
    case 'entering':
      return '🌊 Splash!'
    case 'idle':
      return null
    case 'swimming': {
      if (toolName === 'edit' || toolName === 'create') return '✏️ Editing...'
      if (toolName === 'bash') return '🔨 Running...'
      if (toolName === 'grep' || toolName === 'glob') return '🔍 Searching...'
      if (toolName === 'view') return '👁️ Reading...'
      if (toolName === 'task') return '🐬 Dispatching...'
      return '🌊 Swimming...'
    }
    case 'diving':
      return '🫧 Diving deep...'
    case 'jumping':
      return '🐬 Jumping!'
    case 'startled':
      return '😱 Error!'
    case 'waving':
      return '👋 Goodbye!'
    default:
      return null
  }
}

const bubbleStyle: React.CSSProperties = {
  background: 'rgba(220, 240, 255, 0.92)',
  borderRadius: 12,
  padding: '6px 12px',
  fontSize: 13,
  color: '#1a3a4a',
  fontFamily: 'system-ui, sans-serif',
  maxWidth: 150,
  textAlign: 'center',
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  position: 'relative',
  whiteSpace: 'nowrap',
  pointerEvents: 'none' as const,
  userSelect: 'none' as const,
  transition: 'opacity 0.3s ease'
}

const tailStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: -8,
  left: '50%',
  transform: 'translateX(-50%)',
  width: 0,
  height: 0,
  borderLeft: '8px solid transparent',
  borderRight: '8px solid transparent',
  borderTop: '8px solid rgba(220, 240, 255, 0.92)'
}

function FlipperBubble({
  state,
  toolName,
  position
}: FlipperBubbleProps): React.JSX.Element | null {
  const text = getBubbleText(state, toolName)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (text) {
      setVisible(true)
      return
    }
    const timer = setTimeout(() => setVisible(false), 300)
    return () => clearTimeout(timer)
  }, [text])

  if (!visible && !text) return null

  return (
    <Html
      position={[position[0], position[1] + 1.5, position[2]]}
      center
      zIndexRange={[10, 0]}
      style={{ pointerEvents: 'none' }}
    >
      <div style={{ ...bubbleStyle, opacity: text ? 1 : 0 }}>
        {text}
        <div style={tailStyle} />
      </div>
    </Html>
  )
}

export default FlipperBubble
export { getBubbleText }
