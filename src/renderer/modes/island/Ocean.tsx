import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface OceanProps {
  activityLevel?: number // 0-1, controls wave intensity
}

function Ocean({ activityLevel = 0.2 }: OceanProps): React.JSX.Element {
  const meshRef = useRef<THREE.Mesh>(null)
  const geometryRef = useRef<THREE.PlaneGeometry>(null)

  // Store original vertex positions for wave displacement (48×48 reduces vertex count by 44%)
  const originalPositions = useMemo(() => {
    const geo = new THREE.PlaneGeometry(100, 100, 48, 48)
    return new Float32Array(geo.attributes.position.array)
  }, [])

  useFrame(({ clock }) => {
    if (!geometryRef.current) return
    const positions = geometryRef.current.attributes.position
    const arr = positions.array as Float32Array
    const time = clock.elapsedTime
    const waveHeight = 0.1 + activityLevel * 0.4
    const waveSpeed = 0.5 + activityLevel * 1.5
    const count = positions.count

    for (let i = 0; i < count; i++) {
      const idx = i * 3
      const x = originalPositions[idx]
      const y = originalPositions[idx + 1]
      // Multiple overlapping waves for natural motion
      arr[idx + 2] =
        Math.sin(x * 0.3 + time * waveSpeed) * waveHeight * 0.5 +
        Math.sin(y * 0.5 + time * waveSpeed * 0.7) * waveHeight * 0.3 +
        Math.cos(x * 0.2 + y * 0.3 + time * waveSpeed * 0.5) * waveHeight * 0.2
    }
    positions.needsUpdate = true
    geometryRef.current.computeVertexNormals()
  })

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]} receiveShadow>
      <planeGeometry ref={geometryRef} args={[100, 100, 48, 48]} />
      <meshPhongMaterial
        color="#0e7490"
        specular={new THREE.Color('#e0f7fa')}
        shininess={150}
        transparent
        opacity={0.8}
        flatShading
      />
    </mesh>
  )
}

export default Ocean
