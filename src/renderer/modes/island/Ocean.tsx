import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function Ocean(): React.JSX.Element {
  const meshRef = useRef<THREE.Mesh>(null)

  // Subtle vertical bob to simulate waves
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(Date.now() * 0.0005) * 0.05 - 0.15
    }
  })

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial
        color="#2980b9"
        flatShading
        transparent
        opacity={0.85}
      />
    </mesh>
  )
}

export default Ocean
