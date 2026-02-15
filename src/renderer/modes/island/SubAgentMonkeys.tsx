import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useCocoStore } from './coco-state'

const BROWN = '#8B5E3C'
const TAN = '#A0704F'
const WHITE = '#ffffff'
const BLACK = '#1a1a1a'

const ENTER_DURATION = 1000
const EXIT_DURATION = 800
const JUMP_HEIGHT = 2.5

/** Slot positions in a semicircle behind Coco */
const SLOT_POSITIONS: [number, number, number][] = [
  [-1.2, 0.45, 0.2],
  [-0.5, 0.45, -0.8],
  [2.0, 0.45, 0.2],
  [1.5, 0.45, -0.8],
  [-1.8, 0.45, -0.3],
  [2.5, 0.45, -0.3]
]

const ENTER_ORIGIN_X = -8
const EXIT_TARGET_X = 8

interface AnimatedMonkey {
  id: string
  name: string
  phase: 'entering' | 'active' | 'exiting'
  slotIndex: number
  startTime: number
  phaseDuration: number
}

function AnimatedMiniMonkey({
  monkey,
  onExitComplete,
  onEnterComplete
}: {
  monkey: AnimatedMonkey
  onExitComplete: (id: string) => void
  onEnterComplete: (id: string) => void
}): React.JSX.Element {
  const ref = useRef<THREE.Group>(null)
  const slot = SLOT_POSITIONS[monkey.slotIndex % SLOT_POSITIONS.length]

  useFrame(() => {
    if (!ref.current) return

    const progress = Math.min(1, (Date.now() - monkey.startTime) / monkey.phaseDuration)
    const arcY = JUMP_HEIGHT * Math.sin(progress * Math.PI)

    if (monkey.phase === 'entering') {
      const x = THREE.MathUtils.lerp(ENTER_ORIGIN_X, slot[0], progress)
      const z = THREE.MathUtils.lerp(slot[2], slot[2], progress)
      ref.current.position.set(x, slot[1] + arcY, z)
      ref.current.rotation.y = Math.PI * 0.5 // face right (toward island)
      ref.current.scale.setScalar(0.5)
      if (progress >= 1) onEnterComplete(monkey.id)
    } else if (monkey.phase === 'active') {
      const bobY = Math.sin(Date.now() * 0.003) * 0.05
      ref.current.position.set(slot[0], slot[1] + bobY, slot[2])
      // Face toward Coco at roughly (0.8, ?, 0.8)
      const angle = Math.atan2(0.8 - slot[2], 0.8 - slot[0])
      ref.current.rotation.y = angle
      ref.current.scale.setScalar(0.5)
    } else {
      // exiting
      const x = THREE.MathUtils.lerp(slot[0], EXIT_TARGET_X, progress)
      ref.current.position.set(x, slot[1] + arcY, slot[2])
      ref.current.rotation.y = -Math.PI * 0.5 // face right (toward exit)
      ref.current.scale.setScalar(0.5)
      if (progress >= 1) onExitComplete(monkey.id)
    }
  })

  return (
    <group ref={ref} position={[ENTER_ORIGIN_X, slot[1], slot[2]]} scale={0.5}>
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
  const [monkeys, setMonkeys] = useState<AnimatedMonkey[]>([])
  const prevAgentIds = useRef<Set<string>>(new Set())

  // Detect additions and removals
  useEffect(() => {
    const currentIds = new Set(activeSubAgents.map((a) => a.id))
    const prevIds = prevAgentIds.current

    // New agents → add as entering
    for (const agent of activeSubAgents) {
      if (!prevIds.has(agent.id)) {
        setMonkeys((prev) => {
          // Skip if already tracked (avoid duplicates from strict mode)
          if (prev.some((m) => m.id === agent.id)) return prev
          return [
            ...prev,
            {
              id: agent.id,
              name: agent.name,
              phase: 'entering' as const,
              slotIndex: prev.filter((m) => m.phase !== 'exiting').length,
              startTime: Date.now(),
              phaseDuration: ENTER_DURATION
            }
          ]
        })
      }
    }

    // Removed agents → mark as exiting
    for (const id of prevIds) {
      if (!currentIds.has(id)) {
        setMonkeys((prev) =>
          prev.map((m) =>
            m.id === id && m.phase !== 'exiting'
              ? { ...m, phase: 'exiting' as const, startTime: Date.now(), phaseDuration: EXIT_DURATION }
              : m
          )
        )
      }
    }

    prevAgentIds.current = currentIds
  }, [activeSubAgents])

  const handleEnterComplete = useCallback((id: string) => {
    setMonkeys((prev) =>
      prev.map((m) => (m.id === id && m.phase === 'entering' ? { ...m, phase: 'active' as const } : m))
    )
  }, [])

  const handleExitComplete = useCallback((id: string) => {
    setMonkeys((prev) => prev.filter((m) => m.id !== id))
  }, [])

  return (
    <>
      {monkeys.map((monkey) => (
        <AnimatedMiniMonkey
          key={monkey.id}
          monkey={monkey}
          onEnterComplete={handleEnterComplete}
          onExitComplete={handleExitComplete}
        />
      ))}
    </>
  )
}

export default SubAgentMonkeys
