import React from 'react'
import { Canvas } from '@react-three/fiber'
import { Sky, OrbitControls } from '@react-three/drei'
import Island from './Island'
import Ocean from './Ocean'
import Coco from './Coco'
import HudOverlay from './HudOverlay'
import DebugPanel from './DebugPanel'
import { useIslandEvents } from './use-island-events'

function IslandMode(): React.JSX.Element {
  const cocoState = useIslandEvents()

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas
        shadows
        camera={{ position: [8, 5, 8], fov: 50 }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
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
        <Sky
          sunPosition={[50, 80, 30]}
          turbidity={10}
          rayleigh={2}
          mieCoefficient={0.005}
          mieDirectionalG={0.8}
        />

        {/* Scene objects */}
        <Ocean />
        <Island />
        <Coco state={cocoState} position={[0.8, 0.55, 0.8]} />

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
