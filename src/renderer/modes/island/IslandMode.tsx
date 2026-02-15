import React from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Island from './Island'
import Ocean from './Ocean'
import Coco from './Coco'
import SubAgentMonkeys from './SubAgentMonkeys'
import ToolObjects from './ToolObjects'
import HudOverlay from './HudOverlay'
import DebugPanel from './DebugPanel'
import SkyDome from './SkyDome'
import Clouds from './Clouds'
import IslandDecorations from './IslandDecorations'
import { useIslandEvents } from './use-island-events'
import ThoughtBubble from './ThoughtBubble'
import EventEffects from './EventEffects'
import { useCocoStore } from './coco-state'

function IslandMode(): React.JSX.Element {
  const cocoState = useIslandEvents()
  const toolActive = useCocoStore((s) => s.toolActive)
  const activityLevel = useCocoStore((s) => s.activityLevel)

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas
        shadows
        camera={{ position: [6, 4, 6], fov: 50 }}
      >
        <color attach="background" args={['#87CEEB']} />

        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={0.5}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />

        {/* Sky */}
        <SkyDome />
        <Clouds />

        {/* Scene objects */}
        <Ocean activityLevel={activityLevel} />
        <Island />
        <IslandDecorations />
        <Coco state={cocoState} position={[0.8, 0.85, 0.8]} />
        <ThoughtBubble state={cocoState} toolName={toolActive} position={[0.8, 0.85, 0.8]} />
        <SubAgentMonkeys />
        <EventEffects />
        <ToolObjects activeTool={toolActive} />

        {/* Controls */}
        <OrbitControls
          autoRotate
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={5}
          maxDistance={20}
          target={[0, 1, 0]}
        />
      </Canvas>
      <HudOverlay />
      <DebugPanel />
    </div>
  )
}

export default IslandMode
