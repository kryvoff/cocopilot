import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const CORAL_COLORS = ['#e85d75', '#f0904e', '#9b59b6', '#e74c3c', '#ff69b4', '#ff8c42', '#c0392b']

/** Branching coral: a trunk with angled branches */
function BranchingCoral({
  position,
  color,
  scale = 1
}: {
  position: [number, number, number]
  color: string
  scale?: number
}): React.JSX.Element {
  const branches = useMemo(() => {
    const count = 4 + Math.floor(Math.random() * 3)
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3
      const tilt = 0.4 + Math.random() * 0.5
      const len = 0.4 + Math.random() * 0.4
      const yOff = 0.3 + Math.random() * 0.5
      return { angle, tilt, len, yOff, key: i }
    })
  }, [])

  return (
    <group position={position} scale={scale}>
      {/* Main trunk */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.1, 0.8, 5]} />
        <meshStandardMaterial color={color} flatShading roughness={0.7} />
      </mesh>
      {/* Branches */}
      {branches.map(({ angle, tilt, len, yOff, key }) => (
        <mesh
          key={key}
          position={[Math.cos(angle) * 0.12, yOff, Math.sin(angle) * 0.12]}
          rotation={[Math.sin(angle) * tilt, 0, Math.cos(angle) * tilt]}
          castShadow
        >
          <cylinderGeometry args={[0.02, 0.04, len, 4]} />
          <meshStandardMaterial color={color} flatShading roughness={0.7} />
        </mesh>
      ))}
      {/* Tips */}
      {branches.map(({ angle, tilt, len, yOff, key }) => (
        <mesh
          key={`tip-${key}`}
          position={[
            Math.cos(angle) * 0.12 + Math.cos(angle) * tilt * len * 0.4,
            yOff + len * 0.4,
            Math.sin(angle) * 0.12 + Math.sin(angle) * tilt * len * 0.4
          ]}
        >
          <sphereGeometry args={[0.04, 4, 4]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.15} flatShading />
        </mesh>
      ))}
    </group>
  )
}

/** Rounded brain coral */
function BrainCoral({
  position,
  scale = 1
}: {
  position: [number, number, number]
  scale?: number
}): React.JSX.Element {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshStandardMaterial
          color="#d4a574"
          flatShading
          roughness={0.9}
        />
      </mesh>
      {/* Surface ridges approximated with a slightly larger translucent shell */}
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.52, 6, 4]} />
        <meshStandardMaterial
          color="#c4956a"
          flatShading
          roughness={1}
          transparent
          opacity={0.4}
          wireframe
        />
      </mesh>
    </group>
  )
}

/** Anemone: cluster of small waving cylinders */
function Anemone({
  position,
  color
}: {
  position: [number, number, number]
  color: string
}): React.JSX.Element {
  const groupRef = useRef<THREE.Group>(null)

  const tentacles = useMemo(() => {
    const count = 8
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2
      const r = 0.08 + Math.random() * 0.06
      return {
        x: Math.cos(angle) * r,
        z: Math.sin(angle) * r,
        height: 0.2 + Math.random() * 0.15,
        phaseOffset: i * 0.8,
        key: i
      }
    })
  }, [])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const children = groupRef.current.children
    const t = clock.elapsedTime
    for (let i = 0; i < children.length; i++) {
      const tentacle = tentacles[i]
      if (!tentacle) continue
      children[i].rotation.x = Math.sin(t * 1.5 + tentacle.phaseOffset) * 0.2
      children[i].rotation.z = Math.cos(t * 1.2 + tentacle.phaseOffset) * 0.15
    }
  })

  return (
    <group position={position}>
      {/* Base disc */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.15, 0.18, 0.04, 8]} />
        <meshStandardMaterial color={color} flatShading roughness={0.8} />
      </mesh>
      {/* Tentacles */}
      <group ref={groupRef}>
        {tentacles.map(({ x, z, height, key }) => (
          <mesh key={key} position={[x, height / 2 + 0.04, z]}>
            <cylinderGeometry args={[0.012, 0.02, height, 4]} />
            <meshStandardMaterial color={color} flatShading roughness={0.6} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/** Stacked sphere coral formation */
function StackedCoral({
  position,
  color,
  scale = 1
}: {
  position: [number, number, number]
  color: string
  scale?: number
}): React.JSX.Element {
  const spheres = useMemo(
    () => [
      { pos: [0, 0.15, 0] as [number, number, number], r: 0.25 },
      { pos: [0.1, 0.45, 0.05] as [number, number, number], r: 0.18 },
      { pos: [-0.08, 0.65, -0.03] as [number, number, number], r: 0.12 },
      { pos: [0.15, 0.3, 0.12] as [number, number, number], r: 0.1 }
    ],
    []
  )

  return (
    <group position={position} scale={scale}>
      {spheres.map(({ pos, r }, i) => (
        <mesh key={i} position={pos} castShadow>
          <sphereGeometry args={[r, 6, 6]} />
          <meshStandardMaterial color={color} flatShading roughness={0.7} />
        </mesh>
      ))}
    </group>
  )
}

function CoralReef(): React.JSX.Element {
  return (
    <group>
      {/* Branching corals */}
      <BranchingCoral position={[-2, 0, -1]} color={CORAL_COLORS[0]} scale={1.2} />
      <BranchingCoral position={[3, 0, -2]} color={CORAL_COLORS[1]} />
      <BranchingCoral position={[-1, 0, 3]} color={CORAL_COLORS[2]} scale={0.9} />

      {/* Stacked corals */}
      <StackedCoral position={[1, 0, -3]} color={CORAL_COLORS[3]} scale={1.1} />
      <StackedCoral position={[-3, 0, -3]} color={CORAL_COLORS[4]} scale={0.8} />

      {/* Brain coral */}
      <BrainCoral position={[0, 0, 0]} scale={1.3} />
      <BrainCoral position={[4, 0, 1]} scale={0.7} />

      {/* Anemones */}
      <Anemone position={[-1.5, 0, 1]} color="#e85d75" />
      <Anemone position={[2, 0, 2]} color="#9b59b6" />
      <Anemone position={[0.5, 0, -2]} color="#ff69b4" />
    </group>
  )
}

export default CoralReef
