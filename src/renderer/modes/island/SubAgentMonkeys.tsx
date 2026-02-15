import React, { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useCocoStore } from './coco-state'

const BROWN = '#8B5E3C'
const TAN = '#A0704F'
const WHITE = '#ffffff'
const BLACK = '#1a1a1a'

/** Positions for sub-agent monkeys in a semicircle behind Coco */
const POSITIONS: [number, number, number][] = [
  [-1.5, 0.35, -0.5],
  [-1.0, 0.35, -1.0],
  [2.0, 0.35, -0.5],
  [2.5, 0.35, -1.0]
]

function MiniMonkey({ position }: { position: [number, number, number] }): React.JSX.Element {
  const ref = useRef<THREE.Group>(null)
  const [scale, setScale] = useState(0)

  useFrame((_, delta) => {
    if (!ref.current) return
    // Pop-in animation
    const target = 0.5
    const newScale = THREE.MathUtils.lerp(scale, target, delta * 3)
    setScale(newScale)
    ref.current.scale.setScalar(newScale)
    // Bobbing
    ref.current.position.y = position[1] + Math.sin(Date.now() * 0.003) * 0.05
  })

  return (
    <group ref={ref} position={position}>
      {/* Head */}
      <mesh position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshStandardMaterial color={BROWN} flatShading />
      </mesh>
      {/* Left eye */}
      <mesh position={[0.09, 0.6, 0.2]}>
        <sphereGeometry args={[0.05, 6, 6]} />
        <meshStandardMaterial color={WHITE} />
      </mesh>
      <mesh position={[0.09, 0.6, 0.24]}>
        <sphereGeometry args={[0.025, 5, 5]} />
        <meshStandardMaterial color={BLACK} />
      </mesh>
      {/* Right eye */}
      <mesh position={[-0.09, 0.6, 0.2]}>
        <sphereGeometry args={[0.05, 6, 6]} />
        <meshStandardMaterial color={WHITE} />
      </mesh>
      <mesh position={[-0.09, 0.6, 0.24]}>
        <sphereGeometry args={[0.025, 5, 5]} />
        <meshStandardMaterial color={BLACK} />
      </mesh>
      {/* Body */}
      <mesh position={[0, 0.15, 0]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial color={TAN} flatShading />
      </mesh>
    </group>
  )
}

function SubAgentMonkeys(): React.JSX.Element {
  const activeSubAgents = useCocoStore((s) => s.activeSubAgents)

  return (
    <>
      {activeSubAgents.map((agent, i) => (
        <MiniMonkey key={agent.id} position={POSITIONS[i % POSITIONS.length]} />
      ))}
    </>
  )
}

export default SubAgentMonkeys
