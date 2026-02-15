import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Shared geometries and materials across all PalmTree instances
const leafGeo = new THREE.ConeGeometry(0.15, 1.2, 4)
const leafMat = new THREE.MeshStandardMaterial({ color: '#27ae60', flatShading: true })
const coconutGeo = new THREE.SphereGeometry(0.08, 4, 4)
const coconutMat = new THREE.MeshStandardMaterial({ color: '#8b4513', flatShading: true })
const trunkMat = new THREE.MeshStandardMaterial({ color: '#8b6914', flatShading: true })

interface PalmTreeProps {
  position: [number, number, number]
  height?: number
  lean?: number
  scale?: number
}

function PalmTree({ position, height = 3, lean = 0.3, scale = 1 }: PalmTreeProps): React.JSX.Element {
  const leavesRef = useRef<THREE.Group>(null)

  // Trunk geometry depends on height prop
  const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.08, 0.15, height, 6), [height])

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
    <group position={position} scale={scale}>
      {/* Trunk — tapered cylinder leaning slightly */}
      <group rotation={[lean * 0.3, 0, lean]}>
        <mesh position={[0, height / 2, 0]} castShadow geometry={trunkGeo} material={trunkMat} />

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
              geometry={leafGeo}
              material={leafMat}
            />
          ))}
          {/* Coconut cluster */}
          <mesh position={[0, -0.15, 0]} geometry={coconutGeo} material={coconutMat} />
        </group>
      </group>
    </group>
  )
}

export default PalmTree
