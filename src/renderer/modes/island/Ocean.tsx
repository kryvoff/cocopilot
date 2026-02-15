import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface OceanProps {
  activityLevel?: number // 0-1, controls wave intensity
}

function Ocean({ activityLevel = 0.2 }: OceanProps): React.JSX.Element {
  const meshRef = useRef<THREE.Mesh>(null)
  const geometryRef = useRef<THREE.PlaneGeometry>(null)

  // Store original vertex positions for wave displacement
  const originalPositions = useMemo(() => {
    const geo = new THREE.PlaneGeometry(100, 100, 64, 64)
    return new Float32Array(geo.attributes.position.array)
  }, [])

  useFrame(({ clock }) => {
    if (!geometryRef.current) return
    const positions = geometryRef.current.attributes.position
    const time = clock.elapsedTime
    const waveHeight = 0.1 + activityLevel * 0.4
    const waveSpeed = 0.5 + activityLevel * 1.5

    for (let i = 0; i < positions.count; i++) {
      const x = originalPositions[i * 3]
      const y = originalPositions[i * 3 + 1]
      // Multiple overlapping waves for natural motion
      const z =
        Math.sin(x * 0.3 + time * waveSpeed) * waveHeight * 0.5 +
        Math.sin(y * 0.5 + time * waveSpeed * 0.7) * waveHeight * 0.3 +
        Math.cos(x * 0.2 + y * 0.3 + time * waveSpeed * 0.5) * waveHeight * 0.2
      positions.setZ(i, z)
    }
    positions.needsUpdate = true
    geometryRef.current.computeVertexNormals()
  })

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]} receiveShadow>
      <planeGeometry ref={geometryRef} args={[100, 100, 64, 64]} />
      <meshPhongMaterial
        color="#1a8faa"
        specular={new THREE.Color('#4fc3f7')}
        shininess={100}
        transparent
        opacity={0.85}
        flatShading
      />
    </mesh>
  )
}

export default Ocean
