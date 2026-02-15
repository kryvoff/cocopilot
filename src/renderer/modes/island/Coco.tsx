import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

type CocoState = 'hidden' | 'idle' | 'entering' | 'thinking' | 'working' | 'startled' | 'waving'

interface CocoProps {
  state: CocoState
  position?: [number, number, number]
}

const BROWN = '#8B5E3C'
const TAN = '#D2A679'
const WHITE = '#ffffff'
const BLACK = '#1a1a1a'

function Coco({ state, position = [0, 0, 0] }: CocoProps): React.JSX.Element {
  const groupRef = useRef<THREE.Group>(null)
  const headRef = useRef<THREE.Group>(null)
  const leftArmRef = useRef<THREE.Group>(null)
  const rightArmRef = useRef<THREE.Group>(null)
  const tailRef = useRef<THREE.Group>(null)
  const bodyRef = useRef<THREE.Group>(null)

  // Track animation progress
  const anim = useRef({
    enterY: -2,
    enterBounce: 0,
    startledZ: 0,
    time: 0,
    prevState: state as CocoState
  })

  // Tail segments for curved tail
  const tailSegments = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        key: i,
        y: -i * 0.08,
        x: i * 0.06,
        z: -i * 0.04
      })),
    []
  )

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const a = anim.current
    a.time += delta

    // Reset on state change
    if (a.prevState !== state) {
      if (state === 'entering') {
        a.enterY = -2
        a.enterBounce = 0
      }
      if (state === 'startled') {
        a.startledZ = 0
      }
      a.prevState = state
    }

    const t = a.time

    // --- Scale (hidden vs visible) ---
    const targetScale = state === 'hidden' ? 0 : 1
    const s = groupRef.current.scale
    s.x = THREE.MathUtils.lerp(s.x, targetScale, delta * 6)
    s.y = THREE.MathUtils.lerp(s.y, targetScale, delta * 6)
    s.z = THREE.MathUtils.lerp(s.z, targetScale, delta * 6)

    // --- Entering ---
    if (state === 'entering') {
      a.enterY = THREE.MathUtils.lerp(a.enterY, 0, delta * 4)
      a.enterBounce = Math.sin(t * 8) * Math.max(0, 0.3 - t * 0.3)
      groupRef.current.position.y = position[1] + a.enterY + a.enterBounce
    } else {
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        position[1],
        delta * 5
      )
    }

    // --- Idle: gentle bob + tail sway ---
    if (state === 'idle') {
      if (bodyRef.current) {
        bodyRef.current.position.y = Math.sin(t * 2) * 0.03
      }
      if (headRef.current) {
        headRef.current.position.y = 0.38 + Math.sin(t * 2) * 0.03
        headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, 0, delta * 4)
      }
      if (tailRef.current) {
        tailRef.current.rotation.z = Math.sin(t * 3) * 0.3
      }
      if (leftArmRef.current) {
        leftArmRef.current.rotation.z = THREE.MathUtils.lerp(
          leftArmRef.current.rotation.z,
          0.3,
          delta * 4
        )
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(
          leftArmRef.current.rotation.x,
          0,
          delta * 4
        )
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(
          rightArmRef.current.rotation.z,
          -0.3,
          delta * 4
        )
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(
          rightArmRef.current.rotation.x,
          0,
          delta * 4
        )
      }
    }

    // --- Thinking: head tilts, right arm scratches head ---
    if (state === 'thinking') {
      if (headRef.current) {
        headRef.current.rotation.z = Math.sin(t * 1.5) * 0.2
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.z = -2.2
        rightArmRef.current.rotation.x = Math.sin(t * 3) * 0.15
      }
      if (leftArmRef.current) {
        leftArmRef.current.rotation.z = THREE.MathUtils.lerp(
          leftArmRef.current.rotation.z,
          0.3,
          delta * 4
        )
      }
      if (tailRef.current) {
        tailRef.current.rotation.z = Math.sin(t * 2) * 0.2
      }
    }

    // --- Working: arms pump up/down, body leans forward ---
    if (state === 'working') {
      if (bodyRef.current) {
        bodyRef.current.rotation.x = THREE.MathUtils.lerp(
          bodyRef.current.rotation.x,
          0.15,
          delta * 4
        )
      }
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = Math.sin(t * 6) * 0.4
        leftArmRef.current.rotation.z = 0.6
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = Math.sin(t * 6 + Math.PI) * 0.4
        rightArmRef.current.rotation.z = -0.6
      }
      if (headRef.current) {
        headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, 0, delta * 4)
        headRef.current.position.y = 0.38 + Math.sin(t * 6) * 0.02
      }
      if (tailRef.current) {
        tailRef.current.rotation.z = Math.sin(t * 4) * 0.15
      }
    }

    // --- Startled: jump back, arms up ---
    if (state === 'startled') {
      a.startledZ = THREE.MathUtils.lerp(a.startledZ, 0, delta * 3)
      if (a.startledZ < 0.01) a.startledZ = 0.8 // retriggered bounce-back feel
      groupRef.current.position.z = position[2] + Math.sin(a.startledZ * Math.PI) * 0.5

      if (leftArmRef.current) {
        leftArmRef.current.rotation.z = THREE.MathUtils.lerp(
          leftArmRef.current.rotation.z,
          1.8,
          delta * 8
        )
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(
          rightArmRef.current.rotation.z,
          -1.8,
          delta * 8
        )
      }
      if (headRef.current) {
        headRef.current.rotation.z = 0
        headRef.current.position.y = 0.43
      }
    } else {
      groupRef.current.position.z = THREE.MathUtils.lerp(
        groupRef.current.position.z,
        position[2],
        delta * 5
      )
    }

    // --- Waving: right arm waves ---
    if (state === 'waving') {
      if (rightArmRef.current) {
        rightArmRef.current.rotation.z = -2.5 + Math.sin(t * 5) * 0.4
      }
      if (leftArmRef.current) {
        leftArmRef.current.rotation.z = THREE.MathUtils.lerp(
          leftArmRef.current.rotation.z,
          0.3,
          delta * 4
        )
      }
      if (headRef.current) {
        headRef.current.rotation.z = Math.sin(t * 5) * 0.1
        headRef.current.position.y = 0.38
      }
      if (bodyRef.current) {
        bodyRef.current.position.y = Math.sin(t * 2) * 0.02
      }
      if (tailRef.current) {
        tailRef.current.rotation.z = Math.sin(t * 3) * 0.3
      }
    }

    // --- Reset body lean for non-working states ---
    if (state !== 'working' && bodyRef.current) {
      bodyRef.current.rotation.x = THREE.MathUtils.lerp(
        bodyRef.current.rotation.x,
        0,
        delta * 4
      )
    }
  })

  return (
    <group ref={groupRef} position={position} scale={state === 'hidden' ? [0, 0, 0] : [1, 1, 1]}>
      {/* Body group — contains torso, arms, legs, tail */}
      <group ref={bodyRef}>
        {/* Torso — slightly flattened ellipsoid */}
        <mesh castShadow>
          <sphereGeometry args={[0.22, 6, 5]} />
          <meshStandardMaterial color={BROWN} flatShading />
        </mesh>

        {/* Belly patch */}
        <mesh position={[0, -0.02, 0.15]}>
          <sphereGeometry args={[0.14, 5, 4]} />
          <meshStandardMaterial color={TAN} flatShading />
        </mesh>

        {/* Left arm */}
        <group ref={leftArmRef} position={[0.25, 0.08, 0]} rotation={[0, 0, 0.3]}>
          <mesh position={[0.12, -0.02, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.035, 0.3, 5]} />
            <meshStandardMaterial color={BROWN} flatShading />
          </mesh>
        </group>

        {/* Right arm */}
        <group ref={rightArmRef} position={[-0.25, 0.08, 0]} rotation={[0, 0, -0.3]}>
          <mesh position={[-0.12, -0.02, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.035, 0.3, 5]} />
            <meshStandardMaterial color={BROWN} flatShading />
          </mesh>
        </group>

        {/* Left leg */}
        <mesh position={[0.1, -0.3, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.04, 0.2, 5]} />
          <meshStandardMaterial color={BROWN} flatShading />
        </mesh>
        {/* Left foot */}
        <mesh position={[0.1, -0.42, 0.04]} castShadow>
          <sphereGeometry args={[0.05, 5, 4]} />
          <meshStandardMaterial color={TAN} flatShading />
        </mesh>

        {/* Right leg */}
        <mesh position={[-0.1, -0.3, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.04, 0.2, 5]} />
          <meshStandardMaterial color={BROWN} flatShading />
        </mesh>
        {/* Right foot */}
        <mesh position={[-0.1, -0.42, 0.04]} castShadow>
          <sphereGeometry args={[0.05, 5, 4]} />
          <meshStandardMaterial color={TAN} flatShading />
        </mesh>

        {/* Tail */}
        <group ref={tailRef} position={[0, -0.1, -0.18]}>
          {tailSegments.map(({ key, y, x, z }) => (
            <mesh key={key} position={[x, y, z]} castShadow>
              <sphereGeometry args={[0.03, 4, 3]} />
              <meshStandardMaterial color={BROWN} flatShading />
            </mesh>
          ))}
        </group>
      </group>

      {/* Head group — closer to body */}
      <group ref={headRef} position={[0, 0.38, 0]}>
        {/* Head sphere */}
        <mesh castShadow>
          <sphereGeometry args={[0.25, 6, 5]} />
          <meshStandardMaterial color={BROWN} flatShading />
        </mesh>

        {/* Muzzle */}
        <mesh position={[0, -0.06, 0.2]}>
          <sphereGeometry args={[0.13, 5, 4]} />
          <meshStandardMaterial color={TAN} flatShading />
        </mesh>

        {/* Left eye white */}
        <mesh position={[0.09, 0.05, 0.2]}>
          <sphereGeometry args={[0.055, 5, 4]} />
          <meshStandardMaterial color={WHITE} flatShading />
        </mesh>

        {/* Left eye pupil */}
        <mesh position={[0.09, 0.05, 0.25]}>
          <sphereGeometry args={[0.03, 4, 3]} />
          <meshStandardMaterial color={BLACK} flatShading />
        </mesh>

        {/* Right eye white */}
        <mesh position={[-0.09, 0.05, 0.2]}>
          <sphereGeometry args={[0.055, 5, 4]} />
          <meshStandardMaterial color={WHITE} flatShading />
        </mesh>

        {/* Right eye pupil */}
        <mesh position={[-0.09, 0.05, 0.25]}>
          <sphereGeometry args={[0.03, 4, 3]} />
          <meshStandardMaterial color={BLACK} flatShading />
        </mesh>

        {/* Left ear */}
        <mesh position={[0.24, 0.1, 0]} castShadow>
          <sphereGeometry args={[0.08, 5, 4]} />
          <meshStandardMaterial color={BROWN} flatShading />
        </mesh>
        {/* Left ear inner */}
        <mesh position={[0.24, 0.1, 0.03]}>
          <sphereGeometry args={[0.05, 4, 3]} />
          <meshStandardMaterial color={TAN} flatShading />
        </mesh>

        {/* Right ear */}
        <mesh position={[-0.24, 0.1, 0]} castShadow>
          <sphereGeometry args={[0.08, 5, 4]} />
          <meshStandardMaterial color={BROWN} flatShading />
        </mesh>
        {/* Right ear inner */}
        <mesh position={[-0.24, 0.1, 0.03]}>
          <sphereGeometry args={[0.05, 4, 3]} />
          <meshStandardMaterial color={TAN} flatShading />
        </mesh>
      </group>
    </group>
  )
}

export default Coco
export type { CocoState, CocoProps }
