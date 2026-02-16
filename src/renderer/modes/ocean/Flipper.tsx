import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

type FlipperState =
  | 'hidden'
  | 'entering'
  | 'idle'
  | 'swimming'
  | 'diving'
  | 'jumping'
  | 'startled'
  | 'waving'

interface FlipperProps {
  state: FlipperState
  position?: [number, number, number]
}

const BODY = '#5f8fa3'
const BELLY = '#b8d8e8'
const DARK = '#4a7a8d'
const SNOUT = '#7ab0c4'
const WHITE = '#ffffff'
const BLACK = '#1a1a1a'

function Flipper({ state, position = [0, 0, 0] }: FlipperProps): React.JSX.Element {
  const groupRef = useRef<THREE.Group>(null)
  const tailRef = useRef<THREE.Group>(null)
  const bodyRef = useRef<THREE.Group>(null)

  const anim = useRef({
    enterX: -4,
    startledOffset: 0,
    time: 0,
    prevState: state as FlipperState,
    jumpStart: 0
  })

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const a = anim.current
    a.time += delta

    // Reset on state change
    if (a.prevState !== state) {
      if (state === 'entering') {
        a.enterX = -4
      }
      if (state === 'startled') {
        a.startledOffset = 0
      }
      if (state === 'jumping') {
        a.jumpStart = a.time
      }
      a.prevState = state
    }

    const t = a.time

    // --- Scale (hidden vs visible) ---
    const targetScale = state === 'hidden' ? 0 : 1
    const s = groupRef.current.scale
    // Instant scale when transitioning from hidden to visible (avoid float-up on mode switch)
    if (s.x < 0.01 && targetScale === 1) {
      s.set(1, 1, 1)
    } else {
      s.x = THREE.MathUtils.lerp(s.x, targetScale, delta * 6)
      s.y = THREE.MathUtils.lerp(s.y, targetScale, delta * 6)
      s.z = THREE.MathUtils.lerp(s.z, targetScale, delta * 6)
    }

    // --- Entering: swim in from left ---
    if (state === 'entering') {
      a.enterX = THREE.MathUtils.lerp(a.enterX, 0, delta * 3)
      groupRef.current.position.x = position[0] + a.enterX
      groupRef.current.position.y = position[1] + Math.sin(t * 4) * 0.1
      if (tailRef.current) {
        tailRef.current.rotation.y = Math.sin(t * 8) * 0.3
      }
    }

    // --- Idle: gentle floating bob ---
    if (state === 'idle') {
      groupRef.current.position.x = THREE.MathUtils.lerp(
        groupRef.current.position.x,
        position[0],
        delta * 5
      )
      groupRef.current.position.y = position[1] + Math.sin(t * 1.5) * 0.15
      groupRef.current.rotation.z = Math.sin(t * 1.2) * 0.04
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        0,
        delta * 4
      )
      if (tailRef.current) {
        tailRef.current.rotation.y = Math.sin(t * 2) * 0.12
      }
    }

    // --- Swimming: vigorous undulation ---
    if (state === 'swimming') {
      groupRef.current.position.x = position[0] + Math.sin(t * 0.5) * 0.3
      groupRef.current.position.y = position[1] + Math.sin(t * 3) * 0.25
      groupRef.current.rotation.z = Math.sin(t * 2.5) * 0.08
      if (bodyRef.current) {
        bodyRef.current.rotation.z = Math.sin(t * 4) * 0.05
      }
      if (tailRef.current) {
        tailRef.current.rotation.y = Math.sin(t * 6) * 0.35
      }
    }

    // --- Diving: tilt downward, move down ---
    if (state === 'diving') {
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        0.6,
        delta * 3
      )
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        position[1] - 1.5,
        delta * 2
      )
      if (tailRef.current) {
        tailRef.current.rotation.y = Math.sin(t * 5) * 0.25
      }
    }

    // --- Jumping: parabolic arc ---
    if (state === 'jumping') {
      const elapsed = t - a.jumpStart
      const jumpDuration = 2.0
      const progress = Math.min(elapsed / jumpDuration, 1)
      groupRef.current.position.y = position[1] + Math.sin(progress * Math.PI) * 2.5
      groupRef.current.rotation.x = -progress * Math.PI * 0.6
      groupRef.current.position.x = position[0]
      if (tailRef.current) {
        tailRef.current.rotation.y = Math.sin(t * 10) * 0.2
      }
      if (progress >= 1) {
        a.jumpStart = t
      }
    }

    // --- Startled: quick jerk/shake ---
    if (state === 'startled') {
      a.startledOffset = THREE.MathUtils.lerp(a.startledOffset, 0, delta * 3)
      if (a.startledOffset < 0.01) a.startledOffset = 0.5
      groupRef.current.position.x =
        position[0] + Math.sin(t * 20) * a.startledOffset * 0.3
      groupRef.current.position.y =
        position[1] + Math.sin(t * 15) * a.startledOffset * 0.15
      groupRef.current.rotation.z = Math.sin(t * 18) * a.startledOffset * 0.1
      if (tailRef.current) {
        tailRef.current.rotation.y = Math.sin(t * 12) * 0.4
      }
    }

    // --- Waving: tail wave, then gentle fade ---
    if (state === 'waving') {
      groupRef.current.position.y = position[1] + Math.sin(t * 2) * 0.1
      groupRef.current.rotation.z = Math.sin(t * 2) * 0.03
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        0,
        delta * 4
      )
      if (tailRef.current) {
        tailRef.current.rotation.y = Math.sin(t * 6) * 0.45
      }
    }

    // --- Reset rotations for non-diving/non-jumping states ---
    if (state !== 'diving' && state !== 'jumping' && state !== 'startled') {
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        0,
        delta * 4
      )
    }
    if (state !== 'startled' && state !== 'entering') {
      groupRef.current.position.x = THREE.MathUtils.lerp(
        groupRef.current.position.x,
        position[0],
        delta * 3
      )
    }
  })

  return (
    <group ref={groupRef} position={position} scale={state === 'hidden' ? [0, 0, 0] : [1, 1, 1]}>
      <group ref={bodyRef}>
        {/* Body — sleek elongated dolphin shape */}
        <mesh castShadow scale={[2.4, 0.6, 0.7]}>
          <sphereGeometry args={[0.5, 14, 10]} />
          <meshStandardMaterial color={BODY} flatShading />
        </mesh>

        {/* Belly — lighter underside */}
        <mesh position={[0.1, -0.12, 0]} scale={[2.2, 0.4, 0.55]}>
          <sphereGeometry args={[0.4, 10, 8]} />
          <meshStandardMaterial color={BELLY} flatShading />
        </mesh>

        {/* Head — tapers forward, slightly smaller */}
        <mesh castShadow position={[0.9, 0.05, 0]} scale={[1, 0.85, 0.85]}>
          <sphereGeometry args={[0.3, 10, 8]} />
          <meshStandardMaterial color={BODY} flatShading />
        </mesh>

        {/* Rostrum/snout — long pointed beak, signature dolphin feature */}
        <mesh position={[1.35, -0.02, 0]} rotation={[0, 0, -Math.PI / 2]} scale={[0.8, 1, 0.7]}>
          <coneGeometry args={[0.08, 0.6, 8]} />
          <meshStandardMaterial color={SNOUT} flatShading />
        </mesh>

        {/* Melon (forehead bump) */}
        <mesh position={[1.0, 0.15, 0]} scale={[0.7, 0.6, 0.65]}>
          <sphereGeometry args={[0.18, 8, 6]} />
          <meshStandardMaterial color={BODY} flatShading />
        </mesh>

        {/* Dorsal fin — tall, curved back */}
        <mesh castShadow position={[-0.1, 0.35, 0]} rotation={[0, 0, -0.25]}>
          <coneGeometry args={[0.15, 0.55, 4]} />
          <meshStandardMaterial color={DARK} flatShading />
        </mesh>

        {/* Left pectoral fin — swept back */}
        <mesh position={[0.4, -0.18, 0.35]} rotation={[0.6, 0.2, 0.4]} scale={[0.7, 0.08, 0.35]}>
          <sphereGeometry args={[0.3, 6, 6]} />
          <meshStandardMaterial color={BODY} flatShading />
        </mesh>
        {/* Right pectoral fin */}
        <mesh position={[0.4, -0.18, -0.35]} rotation={[-0.6, -0.2, 0.4]} scale={[0.7, 0.08, 0.35]}>
          <sphereGeometry args={[0.3, 6, 6]} />
          <meshStandardMaterial color={BODY} flatShading />
        </mesh>

        {/* Left eye — white sclera */}
        <mesh position={[0.95, 0.1, 0.22]}>
          <sphereGeometry args={[0.06, 6, 6]} />
          <meshStandardMaterial color={WHITE} />
        </mesh>
        {/* Left eye — pupil */}
        <mesh position={[0.97, 0.11, 0.26]}>
          <sphereGeometry args={[0.035, 5, 5]} />
          <meshStandardMaterial color={BLACK} />
        </mesh>
        {/* Right eye — white sclera */}
        <mesh position={[0.95, 0.1, -0.22]}>
          <sphereGeometry args={[0.06, 6, 6]} />
          <meshStandardMaterial color={WHITE} />
        </mesh>
        {/* Right eye — pupil */}
        <mesh position={[0.97, 0.11, -0.26]}>
          <sphereGeometry args={[0.035, 5, 5]} />
          <meshStandardMaterial color={BLACK} />
        </mesh>

        {/* Mouth line — small dark mark */}
        <mesh position={[1.25, -0.06, 0]} rotation={[0, 0, 0]} scale={[0.3, 0.02, 0.08]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={DARK} />
        </mesh>
      </group>

      {/* Tail group — peduncle + flukes */}
      <group ref={tailRef} position={[-1.1, 0, 0]}>
        {/* Tail peduncle (narrow section before flukes) */}
        <mesh rotation={[0, 0, Math.PI / 2]} scale={[1, 0.7, 0.6]}>
          <coneGeometry args={[0.14, 0.5, 6]} />
          <meshStandardMaterial color={BODY} flatShading />
        </mesh>
        {/* Left fluke — horizontal (dolphins have horizontal tail flukes) */}
        <mesh position={[-0.3, 0, 0.18]} rotation={[0.2, 0, 0]} scale={[0.9, 0.08, 0.5]}>
          <sphereGeometry args={[0.3, 6, 6]} />
          <meshStandardMaterial color={DARK} flatShading />
        </mesh>
        {/* Right fluke */}
        <mesh position={[-0.3, 0, -0.18]} rotation={[-0.2, 0, 0]} scale={[0.9, 0.08, 0.5]}>
          <sphereGeometry args={[0.3, 6, 6]} />
          <meshStandardMaterial color={DARK} flatShading />
        </mesh>
      </group>
    </group>
  )
}

export default Flipper
export type { FlipperState, FlipperProps }
