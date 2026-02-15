import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useFlipperStore, type ErrorEvent, type SubAgent } from './flipper-state'

// ── Tool mapping ────────────────────────────────────────────────────────────────

const TOOL_GROUPS: Record<string, string[]> = {
  bash: ['bash'],
  edit: ['edit', 'create'],
  search: ['grep', 'glob'],
  view: ['view'],
  web: ['web_search', 'web_fetch']
}

function toolGroup(activeTool: string | null): string | null {
  if (!activeTool) return null
  for (const [group, tools] of Object.entries(TOOL_GROUPS)) {
    if (tools.includes(activeTool)) return group
  }
  return null
}

// ── Octopus (bash/terminal) ─────────────────────────────────────────────────────

function Octopus({
  position,
  isActive
}: {
  position: [number, number, number]
  isActive: boolean
}): React.JSX.Element {
  const ref = useRef<THREE.Group>(null)

  const tentacles = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        angle: (i / 5) * Math.PI * 2,
        phase: i * 1.2,
        key: i
      })),
    []
  )

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime
    // Gentle pulse when active
    const s = isActive ? 1.0 + Math.sin(t * 3) * 0.1 : 0.85
    ref.current.scale.setScalar(s)
  })

  return (
    <group ref={ref} position={position}>
      {/* Head */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshStandardMaterial
          color="#8B4583"
          flatShading
          emissive={isActive ? '#8B4583' : '#000000'}
          emissiveIntensity={isActive ? 0.4 : 0}
        />
      </mesh>
      {/* Eyes */}
      <mesh position={[0.1, 0.35, 0.2]}>
        <sphereGeometry args={[0.04, 5, 5]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-0.1, 0.35, 0.2]}>
        <sphereGeometry args={[0.04, 5, 5]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Tentacles */}
      {tentacles.map(({ angle, phase, key }) => (
        <OctopusTentacle key={key} angle={angle} phase={phase} isActive={isActive} />
      ))}
    </group>
  )
}

function OctopusTentacle({
  angle,
  phase,
  isActive
}: {
  angle: number
  phase: number
  isActive: boolean
}): React.JSX.Element {
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime
    const sway = Math.sin(t * 1.5 + phase) * 0.2
    ref.current.rotation.x = sway
    ref.current.rotation.z = Math.cos(t * 1.2 + phase) * 0.15
  })

  const x = Math.cos(angle) * 0.12
  const z = Math.sin(angle) * 0.12

  return (
    <mesh ref={ref} position={[x, 0, z]} castShadow>
      <cylinderGeometry args={[0.02, 0.035, 0.35, 4]} />
      <meshStandardMaterial
        color="#9B5593"
        flatShading
        emissive={isActive ? '#9B5593' : '#000000'}
        emissiveIntensity={isActive ? 0.3 : 0}
      />
    </mesh>
  )
}

// ── Seahorse (edit/create) ──────────────────────────────────────────────────────

function Seahorse({
  position,
  isActive
}: {
  position: [number, number, number]
  isActive: boolean
}): React.JSX.Element {
  const ref = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime
    ref.current.position.y = position[1] + Math.sin(t * 1.5) * 0.08
    const s = isActive ? 1.1 : 0.9
    ref.current.scale.setScalar(s)
  })

  const mat = (
    <meshStandardMaterial
      color="#F0C040"
      flatShading
      emissive={isActive ? '#F0C040' : '#000000'}
      emissiveIntensity={isActive ? 0.4 : 0}
    />
  )

  return (
    <group ref={ref} position={position}>
      {/* Body — curved using stacked spheres */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <sphereGeometry args={[0.12, 6, 6]} />
        {mat}
      </mesh>
      <mesh position={[0, 0.15, 0.03]} castShadow>
        <sphereGeometry args={[0.1, 6, 6]} />
        {mat}
      </mesh>
      <mesh position={[0, 0.02, 0.06]} castShadow>
        <sphereGeometry args={[0.08, 6, 6]} />
        {mat}
      </mesh>
      {/* Tail curl */}
      <mesh position={[0, -0.08, 0.1]} castShadow>
        <sphereGeometry args={[0.05, 5, 5]} />
        {mat}
      </mesh>
      {/* Head/snout */}
      <mesh position={[0, 0.42, -0.05]} castShadow rotation={[0.3, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.04, 0.15, 4]} />
        {mat}
      </mesh>
      {/* Eye */}
      <mesh position={[0.05, 0.36, 0.06]}>
        <sphereGeometry args={[0.02, 4, 4]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
    </group>
  )
}

// ── Starfish (search: grep/glob) ────────────────────────────────────────────────

function Starfish({
  position,
  isActive
}: {
  position: [number, number, number]
  isActive: boolean
}): React.JSX.Element {
  const ref = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime
    ref.current.rotation.y = t * 0.2
    const s = isActive ? 1.2 : 1.0
    ref.current.scale.setScalar(s)
  })

  // 5 arms radiating from center
  const arms = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        angle: (i / 5) * Math.PI * 2,
        key: i
      })),
    []
  )

  return (
    <group ref={ref} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Center */}
      <mesh castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.04, 8]} />
        <meshStandardMaterial
          color="#E86733"
          flatShading
          emissive={isActive ? '#E86733' : '#000000'}
          emissiveIntensity={isActive ? 0.4 : 0}
        />
      </mesh>
      {/* Arms */}
      {arms.map(({ angle, key }) => {
        const x = Math.cos(angle) * 0.18
        const z = Math.sin(angle) * 0.18
        return (
          <mesh key={key} position={[x, 0, z]} rotation={[0, 0, angle]} castShadow>
            <boxGeometry args={[0.06, 0.03, 0.2]} />
            <meshStandardMaterial
              color="#E86733"
              flatShading
              emissive={isActive ? '#E86733' : '#000000'}
              emissiveIntensity={isActive ? 0.4 : 0}
            />
          </mesh>
        )
      })}
    </group>
  )
}

// ── Sea Turtle (view) ───────────────────────────────────────────────────────────

function SeaTurtle({
  position,
  isActive
}: {
  position: [number, number, number]
  isActive: boolean
}): React.JSX.Element {
  const ref = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime
    ref.current.position.y = position[1] + Math.sin(t * 0.8) * 0.05
    const s = isActive ? 1.1 : 0.9
    ref.current.scale.setScalar(s)
  })

  return (
    <group ref={ref} position={position}>
      {/* Shell */}
      <mesh position={[0, 0.12, 0]} castShadow>
        <sphereGeometry args={[0.22, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#2E8B57"
          flatShading
          emissive={isActive ? '#2E8B57' : '#000000'}
          emissiveIntensity={isActive ? 0.4 : 0}
        />
      </mesh>
      {/* Belly */}
      <mesh position={[0, 0.1, 0]} castShadow rotation={[Math.PI, 0, 0]}>
        <sphereGeometry args={[0.2, 8, 4, 0, Math.PI * 2, 0, Math.PI / 4]} />
        <meshStandardMaterial color="#90C490" flatShading />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.12, 0.25]} castShadow>
        <sphereGeometry args={[0.08, 6, 6]} />
        <meshStandardMaterial
          color="#3A9B6A"
          flatShading
          emissive={isActive ? '#3A9B6A' : '#000000'}
          emissiveIntensity={isActive ? 0.3 : 0}
        />
      </mesh>
      {/* Eyes */}
      <mesh position={[0.04, 0.15, 0.3]}>
        <sphereGeometry args={[0.02, 4, 4]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[-0.04, 0.15, 0.3]}>
        <sphereGeometry args={[0.02, 4, 4]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Flippers */}
      {[1, -1].map((side) => (
        <mesh key={side} position={[side * 0.2, 0.08, 0.05]} castShadow>
          <boxGeometry args={[0.12, 0.02, 0.08]} />
          <meshStandardMaterial color="#2E8B57" flatShading />
        </mesh>
      ))}
    </group>
  )
}

// ── ToolCreatures container ─────────────────────────────────────────────────────

function ToolCreatures({ activeTool }: { activeTool: string | null }): React.JSX.Element {
  const group = toolGroup(activeTool)

  return (
    <group>
      <Octopus position={[2.5, 0.3, 1.5]} isActive={group === 'bash'} />
      <Seahorse position={[-2, 0.8, 0]} isActive={group === 'edit'} />
      <Starfish position={[1, 0.05, -2.5]} isActive={group === 'search'} />
      <SeaTurtle position={[-1, 0.5, 2.5]} isActive={group === 'view'} />
    </group>
  )
}

// ── Fish Schools (sub-agents) ───────────────────────────────────────────────────

const FISH_COLORS = ['#FFD700', '#FF8C00', '#4169E1', '#00CED1', '#FF6347']
const SCHOOL_SLOTS: [number, number, number][] = [
  [-1, 1.5, 0.5],
  [1, 2, -1],
  [-0.5, 1.8, -1.5],
  [2, 1.2, 0],
  [-2, 2.2, -0.5],
  [0, 1, 1.5]
]
const ENTER_ORIGIN_X = -10
const EXIT_TARGET_X = 10
const ENTER_DURATION = 1200
const EXIT_DURATION = 800

interface AnimatedSchool {
  id: string
  name: string
  phase: 'entering' | 'active' | 'exiting'
  slotIndex: number
  startTime: number
  phaseDuration: number
  colorIndex: number
}

function SingleFish({
  offset,
  color,
  isActive
}: {
  offset: [number, number, number]
  color: string
  isActive: boolean
}): React.JSX.Element {
  const ref = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!ref.current || !isActive) return
    const t = clock.elapsedTime + offset[0] * 10
    ref.current.position.x = offset[0] + Math.sin(t * 2) * 0.05
    ref.current.position.y = offset[1] + Math.sin(t * 1.5 + 1) * 0.03
  })

  return (
    <group ref={ref} position={offset}>
      {/* Body */}
      <mesh castShadow>
        <sphereGeometry args={[0.06, 6, 4]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      {/* Tail */}
      <mesh position={[-0.08, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
        <coneGeometry args={[0.04, 0.06, 3]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
    </group>
  )
}

function AnimatedFishSchool({
  school,
  onEnterComplete,
  onExitComplete
}: {
  school: AnimatedSchool
  onEnterComplete: (id: string) => void
  onExitComplete: (id: string) => void
}): React.JSX.Element {
  const ref = useRef<THREE.Group>(null)
  const slot = SCHOOL_SLOTS[school.slotIndex % SCHOOL_SLOTS.length]
  const color = FISH_COLORS[school.colorIndex % FISH_COLORS.length]

  // 3-5 fish per school
  const fishOffsets = useMemo<[number, number, number][]>(() => {
    const count = 3 + (school.colorIndex % 3)
    return Array.from({ length: count }, (_, i) => [
      (i - count / 2) * 0.15,
      Math.sin(i * 1.5) * 0.08,
      Math.cos(i * 2) * 0.1
    ])
  }, [school.colorIndex])

  useFrame(() => {
    if (!ref.current) return
    const progress = Math.min(1, (Date.now() - school.startTime) / school.phaseDuration)

    if (school.phase === 'entering') {
      const x = THREE.MathUtils.lerp(ENTER_ORIGIN_X, slot[0], progress)
      ref.current.position.set(x, slot[1], slot[2])
      ref.current.scale.setScalar(0.8 + progress * 0.2)
      if (progress >= 1) onEnterComplete(school.id)
    } else if (school.phase === 'active') {
      const bobY = Math.sin(Date.now() * 0.002) * 0.1
      ref.current.position.set(slot[0], slot[1] + bobY, slot[2])
      ref.current.scale.setScalar(1)
    } else {
      const x = THREE.MathUtils.lerp(slot[0], EXIT_TARGET_X, progress)
      ref.current.position.set(x, slot[1], slot[2])
      ref.current.scale.setScalar(1 - progress * 0.3)
      if (progress >= 1) onExitComplete(school.id)
    }
  })

  return (
    <group ref={ref} position={[ENTER_ORIGIN_X, slot[1], slot[2]]}>
      {fishOffsets.map((offset, i) => (
        <SingleFish key={i} offset={offset} color={color} isActive={school.phase === 'active'} />
      ))}
    </group>
  )
}

function FishSchools(): React.JSX.Element {
  const activeSubAgents = useFlipperStore((s) => s.activeSubAgents)
  const [schools, setSchools] = useState<AnimatedSchool[]>([])
  const prevAgentIds = useRef<Set<string>>(new Set())
  const colorCounter = useRef(0)

  useEffect(() => {
    const currentIds = new Set(activeSubAgents.map((a: SubAgent) => a.id))
    const prevIds = prevAgentIds.current

    for (const agent of activeSubAgents) {
      if (!prevIds.has(agent.id)) {
        const ci = colorCounter.current++
        setSchools((prev) => {
          if (prev.some((s) => s.id === agent.id)) return prev
          return [
            ...prev,
            {
              id: agent.id,
              name: agent.name,
              phase: 'entering' as const,
              slotIndex: prev.filter((s) => s.phase !== 'exiting').length,
              startTime: Date.now(),
              phaseDuration: ENTER_DURATION,
              colorIndex: ci
            }
          ]
        })
      }
    }

    for (const id of prevIds) {
      if (!currentIds.has(id)) {
        setSchools((prev) =>
          prev.map((s) =>
            s.id === id && s.phase !== 'exiting'
              ? { ...s, phase: 'exiting' as const, startTime: Date.now(), phaseDuration: EXIT_DURATION }
              : s
          )
        )
      }
    }

    prevAgentIds.current = currentIds
  }, [activeSubAgents])

  const handleEnterComplete = useCallback((id: string) => {
    setSchools((prev) =>
      prev.map((s) => (s.id === id && s.phase === 'entering' ? { ...s, phase: 'active' as const } : s))
    )
  }, [])

  const handleExitComplete = useCallback((id: string) => {
    setSchools((prev) => prev.filter((s) => s.id !== id))
  }, [])

  return (
    <>
      {schools.map((school) => (
        <AnimatedFishSchool
          key={school.id}
          school={school}
          onEnterComplete={handleEnterComplete}
          onExitComplete={handleExitComplete}
        />
      ))}
    </>
  )
}

// ── Jellyfish (errors) ──────────────────────────────────────────────────────────

const JELLYFISH_LIFETIME = 3000

function Jellyfish({
  error,
  onComplete
}: {
  error: ErrorEvent
  onComplete: (id: string) => void
}): React.JSX.Element {
  const ref = useRef<THREE.Group>(null)
  const startY = useMemo(() => 0.5 + Math.random() * 0.5, [])
  const startX = useMemo(() => -2 + Math.random() * 4, [])
  const startZ = useMemo(() => -2 + Math.random() * 4, [])

  const tentacles = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        angle: (i / 5) * Math.PI * 2,
        len: 0.2 + Math.random() * 0.15,
        phase: i * 1.3,
        key: i
      })),
    []
  )

  useFrame(({ clock }) => {
    if (!ref.current) return
    const elapsed = Date.now() - error.timestamp
    const progress = Math.min(1, elapsed / JELLYFISH_LIFETIME)
    const t = clock.elapsedTime

    // Drift upward, wobble horizontally
    ref.current.position.set(
      startX + Math.sin(t * 0.8) * 0.3,
      startY + progress * 3,
      startZ + Math.cos(t * 0.6) * 0.2
    )

    // Fade out
    ref.current.traverse((child) => {
      if ((child as THREE.Mesh).material) {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial
        if (mat.opacity !== undefined) {
          mat.opacity = 1 - progress * 0.8
        }
      }
    })

    if (progress >= 1) onComplete(error.id)
  })

  return (
    <group ref={ref} position={[startX, startY, startZ]}>
      {/* Dome */}
      <mesh castShadow>
        <sphereGeometry args={[0.15, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#FF4444"
          flatShading
          transparent
          opacity={0.7}
          emissive="#FF2200"
          emissiveIntensity={0.5}
        />
      </mesh>
      {/* Tentacles */}
      {tentacles.map(({ angle, len, phase, key }) => (
        <JellyfishTentacle key={key} angle={angle} len={len} phase={phase} />
      ))}
    </group>
  )
}

function JellyfishTentacle({
  angle,
  len,
  phase
}: {
  angle: number
  len: number
  phase: number
}): React.JSX.Element {
  const ref = useRef<THREE.Mesh>(null)
  const x = Math.cos(angle) * 0.06
  const z = Math.sin(angle) * 0.06

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime
    ref.current.rotation.x = Math.sin(t * 2 + phase) * 0.3
    ref.current.rotation.z = Math.cos(t * 1.5 + phase) * 0.2
  })

  return (
    <mesh ref={ref} position={[x, -len / 2, z]}>
      <cylinderGeometry args={[0.008, 0.015, len, 3]} />
      <meshStandardMaterial
        color="#FF6644"
        flatShading
        transparent
        opacity={0.6}
        emissive="#FF3300"
        emissiveIntensity={0.3}
      />
    </mesh>
  )
}

function JellyfishErrors(): React.JSX.Element {
  const errorEvents = useFlipperStore((s) => s.errorEvents)
  const removeError = useFlipperStore((s) => s.removeError)

  return (
    <>
      {errorEvents.map((err) => (
        <Jellyfish key={err.id} error={err} onComplete={removeError} />
      ))}
    </>
  )
}

// ── Bubble Effects ──────────────────────────────────────────────────────────────

interface Bubble {
  id: number
  x: number
  z: number
  speed: number
  size: number
  startY: number
  wobblePhase: number
}

function BubbleEffects({ activityLevel }: { activityLevel: number }): React.JSX.Element {
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const idCounter = useRef(0)
  const lastSpawn = useRef(0)

  useFrame(() => {
    const now = Date.now()
    // Spawn rate based on activity: 0.5-3 bubbles/sec
    const interval = THREE.MathUtils.lerp(2000, 300, activityLevel)
    if (now - lastSpawn.current > interval) {
      lastSpawn.current = now
      const id = idCounter.current++
      setBubbles((prev) => [
        ...prev.slice(-30), // cap at ~30 bubbles
        {
          id,
          x: -3 + Math.random() * 6,
          z: -3 + Math.random() * 6,
          speed: 0.3 + Math.random() * 0.5,
          size: 0.02 + Math.random() * 0.04,
          startY: -0.5 + Math.random() * 0.5,
          wobblePhase: Math.random() * Math.PI * 2
        }
      ])
    }
  })

  return (
    <>
      {bubbles.map((b) => (
        <AnimatedBubble
          key={b.id}
          bubble={b}
          onComplete={(id) => setBubbles((prev) => prev.filter((p) => p.id !== id))}
        />
      ))}
    </>
  )
}

function AnimatedBubble({
  bubble,
  onComplete
}: {
  bubble: Bubble
  onComplete: (id: number) => void
}): React.JSX.Element {
  const ref = useRef<THREE.Mesh>(null)
  const startTime = useMemo(() => Date.now(), [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const elapsed = (Date.now() - startTime) / 1000
    const y = bubble.startY + elapsed * bubble.speed
    const wobble = Math.sin(clock.elapsedTime * 2 + bubble.wobblePhase) * 0.15

    ref.current.position.set(bubble.x + wobble, y, bubble.z)

    // Fade and remove when high enough
    if (y > 6) {
      onComplete(bubble.id)
    }
  })

  return (
    <mesh ref={ref} position={[bubble.x, bubble.startY, bubble.z]}>
      <sphereGeometry args={[bubble.size, 6, 6]} />
      <meshStandardMaterial color="#ffffff" transparent opacity={0.4} />
    </mesh>
  )
}

// ── Main OceanCreatures component ───────────────────────────────────────────────

interface OceanCreaturesProps {
  activeTool: string | null
  activityLevel: number
}

function OceanCreatures({ activeTool, activityLevel }: OceanCreaturesProps): React.JSX.Element {
  return (
    <group>
      <ToolCreatures activeTool={activeTool} />
      <FishSchools />
      <JellyfishErrors />
      <BubbleEffects activityLevel={activityLevel} />
    </group>
  )
}

export default OceanCreatures
