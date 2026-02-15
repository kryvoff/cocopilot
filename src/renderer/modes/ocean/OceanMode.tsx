import React from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import UnderwaterSky from './UnderwaterSky'
import OceanFloor from './OceanFloor'
import CoralReef from './CoralReef'
import { useOceanEvents } from './use-ocean-events'
import { useFlipperStore } from './flipper-state'
import OceanCreatures from './OceanCreatures'
import HudOverlay from '../island/HudOverlay'

function OceanMode(): React.JSX.Element {
  // Drive flipper state from events (used once Flipper component is added)
  useOceanEvents()
  const activityLevel = useFlipperStore((s) => s.activityLevel)
  const toolActive = useFlipperStore((s) => s.toolActive)

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas
        shadows
        camera={{ position: [6, 4, 8], fov: 55, near: 0.1, far: 500 }}
      >
        <color attach="background" args={['#87CEEB']} />

        {/* Lighting — blue-tinted ambient + sun from above filtered through water */}
        <ambientLight intensity={0.8 + activityLevel * 0.15} color="#87CEEB" />
        <directionalLight
          position={[2, 15, 3]}
          intensity={1.2}
          color="#ffe4b5"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={0.5}
          shadow-camera-far={40}
          shadow-camera-left={-12}
          shadow-camera-right={12}
          shadow-camera-top={12}
          shadow-camera-bottom={-12}
        />
        {/* Secondary fill light from below for underwater feel */}
        <pointLight position={[0, -2, 0]} intensity={0.3} color="#4fc3f7" distance={20} />

        {/* Underwater sky dome + sun rays */}
        <UnderwaterSky />

        {/* Scene objects */}
        <OceanFloor />
        <CoralReef />
        <OceanCreatures activeTool={toolActive} activityLevel={activityLevel} />

        {/* Water surface visible from below */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 12, 0]}>
          <planeGeometry args={[200, 200, 32, 32]} />
          <meshPhongMaterial
            color="#4fc3f7"
            specular={new THREE.Color('#ffffff')}
            shininess={200}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
            flatShading
          />
        </mesh>

        {/* Flipper the dolphin — created in separate file */}
        {/* <Flipper state={flipperState} position={[0, 2, 0]} /> */}

        {/* Controls — allow more vertical movement for underwater exploration */}
        <OrbitControls
          autoRotate
          autoRotateSpeed={0.3}
          maxPolarAngle={Math.PI / 1.5}
          minPolarAngle={Math.PI / 6}
          minDistance={4}
          maxDistance={25}
          target={[0, 1, 0]}
        />
      </Canvas>

      {/* Shared HUD overlay — reads from monitoring store, mode-agnostic */}
      <HudOverlay />
    </div>
  )
}

export default OceanMode
