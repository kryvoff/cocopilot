import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface PalmTreeProps {
  position: [number, number, number]
  height?: number
  lean?: number
}

function PalmTree({ position, height = 3, lean = 0.3 }: PalmTreeProps): React.JSX.Element {
  const leavesRef = useRef<THREE.Group>(null)

  // Gentle sway animation
  useFrame(() => {
    if (leavesRef.current) {
      leavesRef.current.rotation.z = Math.sin(Date.now() * 0.001 + position[0]) * 0.05
    }
  })

  const leafCount = 6
  const leaves = useMemo(
    () =>
      Array.from({ length: leafCount }, (_, i) => {
        const angle = (i / leafCount) * Math.PI * 2
        return { angle, key: i }
      }),
    []
  )

  return (
    <group position={position}>
      {/* Trunk — tapered cylinder leaning slightly */}
      <group rotation={[lean * 0.3, 0, lean]}>
        <mesh position={[0, height / 2, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.15, height, 6]} />
          <meshStandardMaterial color="#8b6914" flatShading />
        </mesh>

        {/* Leaves group at the top */}
        <group ref={leavesRef} position={[0, height, 0]}>
          {leaves.map(({ angle, key }) => (
            <mesh
              key={key}
              position={[Math.cos(angle) * 0.6, 0.1, Math.sin(angle) * 0.6]}
              rotation={[
                Math.sin(angle) * 0.8,
                angle,
                Math.cos(angle) * 0.8 - 0.5
              ]}
              castShadow
            >
              <coneGeometry args={[0.15, 1.2, 4]} />
              <meshStandardMaterial color="#27ae60" flatShading />
            </mesh>
          ))}
          {/* Coconut cluster */}
          <mesh position={[0, -0.15, 0]}>
            <sphereGeometry args={[0.08, 4, 4]} />
            <meshStandardMaterial color="#8b4513" flatShading />
          </mesh>
        </group>
      </group>
    </group>
  )
}

export default PalmTree
