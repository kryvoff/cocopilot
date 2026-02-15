import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Shared geometries and materials for seaweed
const seaweedSegGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.4, 4)
const seaweedSegMat = new THREE.MeshStandardMaterial({ color: '#2d8a4e', flatShading: true })
const seaweedTipGeo = new THREE.ConeGeometry(0.06, 0.3, 4)
const seaweedTipMat = new THREE.MeshStandardMaterial({ color: '#34a853', flatShading: true })

// Shared geometries for ocean floor rocks and decorations
const oceanRockGeo = new THREE.SphereGeometry(1, 4, 4)
const shellGeo = new THREE.TorusGeometry(0.12, 0.03, 6, 8)
const starfishGeo = new THREE.CircleGeometry(0.15, 5)

/** Tall seaweed strand with sine-wave sway */
function Seaweed({
  position,
  height,
  swayOffset
}: {
  position: [number, number, number]
  height: number
  swayOffset: number
}): React.JSX.Element {
  const ref = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime
    ref.current.rotation.x = Math.sin(t * 0.8 + swayOffset) * 0.15
    ref.current.rotation.z = Math.cos(t * 0.6 + swayOffset * 0.7) * 0.1
  })

  const segments = useMemo(() => {
    const count = Math.floor(height / 0.4)
    return Array.from({ length: count }, (_, i) => ({
      y: i * 0.4 + 0.2,
      key: i
    }))
  }, [height])

  return (
    <group position={position}>
      <group ref={ref}>
        {segments.map(({ y, key }) => (
          <mesh key={key} position={[0, y, 0]} geometry={seaweedSegGeo} material={seaweedSegMat} />
        ))}
        {/* Leaf tip */}
        <mesh position={[0, height, 0]} geometry={seaweedTipGeo} material={seaweedTipMat} />
      </group>
    </group>
  )
}

function OceanFloor(): React.JSX.Element {
  const geometryRef = useRef<THREE.PlaneGeometry>(null)

  // Apply subtle bumps to the sand floor
  const originalPositions = useMemo(() => {
    const geo = new THREE.PlaneGeometry(60, 60, 48, 48)
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const bump =
        Math.sin(x * 0.5) * 0.25 +
        Math.cos(y * 0.7) * 0.2 +
        Math.sin(x * 1.2 + y * 0.9) * 0.15 +
        Math.sin(x * 3.0 + y * 2.5) * 0.08
      pos.setZ(i, bump)
    }
    geo.computeVertexNormals()
    return new Float32Array(pos.array)
  }, [])

  // Copy bumps to the rendered geometry once
  useFrame(() => {
    if (!geometryRef.current) return
    const pos = geometryRef.current.attributes.position
    if ((pos as THREE.BufferAttribute & { _bumped?: boolean })._bumped) return
    for (let i = 0; i < pos.count; i++) {
      pos.setZ(i, originalPositions[i * 3 + 2])
    }
    pos.needsUpdate = true
    geometryRef.current.computeVertexNormals()
    ;(pos as THREE.BufferAttribute & { _bumped?: boolean })._bumped = true
  })

  const seaweedPatches = useMemo(
    () => [
      { position: [-5, 0, -3] as [number, number, number], height: 2.5, swayOffset: 0 },
      { position: [-3, 0, 4] as [number, number, number], height: 3.0, swayOffset: 1.2 },
      { position: [4, 0, -5] as [number, number, number], height: 2.0, swayOffset: 2.4 },
      { position: [6, 0, 2] as [number, number, number], height: 2.8, swayOffset: 3.6 },
      { position: [-7, 0, 1] as [number, number, number], height: 1.8, swayOffset: 4.8 },
      { position: [2, 0, 6] as [number, number, number], height: 3.2, swayOffset: 0.8 },
      { position: [-1, 0, -6] as [number, number, number], height: 2.2, swayOffset: 2.0 },
      { position: [8, 0, -2] as [number, number, number], height: 1.6, swayOffset: 5.0 }
    ],
    []
  )

  const rocks = useMemo(
    () => [
      { pos: [3, 0.1, 3] as [number, number, number], scale: [0.4, 0.2, 0.35] as [number, number, number], color: '#5a5a5a' },
      { pos: [-4, 0.08, -4] as [number, number, number], scale: [0.3, 0.15, 0.25] as [number, number, number], color: '#686868' },
      { pos: [7, 0.12, -1] as [number, number, number], scale: [0.5, 0.18, 0.4] as [number, number, number], color: '#4e4e4e' },
      { pos: [-2, 0.06, 5] as [number, number, number], scale: [0.2, 0.1, 0.18] as [number, number, number], color: '#606060' },
      { pos: [1, 0.07, -3] as [number, number, number], scale: [0.25, 0.12, 0.2] as [number, number, number], color: '#555555' },
      { pos: [-6, 0.15, 2] as [number, number, number], scale: [0.8, 0.3, 0.6] as [number, number, number], color: '#4a4a4a' },
      { pos: [5, 0.2, -5] as [number, number, number], scale: [0.9, 0.35, 0.7] as [number, number, number], color: '#525252' },
      { pos: [-8, 0.1, -2] as [number, number, number], scale: [0.6, 0.22, 0.5] as [number, number, number], color: '#5e5e5e' },
      { pos: [9, 0.08, 4] as [number, number, number], scale: [0.35, 0.14, 0.3] as [number, number, number], color: '#636363' },
      { pos: [-1, 0.18, 8] as [number, number, number], scale: [0.85, 0.28, 0.65] as [number, number, number], color: '#4c4c4c' }
    ],
    []
  )

  const decorations = useMemo(
    () => [
      { pos: [2, 0.02, 1] as [number, number, number], rot: -0.3, geo: shellGeo, color: '#e8a87c' },
      { pos: [-3, 0.02, 3] as [number, number, number], rot: 1.1, geo: starfishGeo, color: '#d4645c' },
      { pos: [5, 0.02, -3] as [number, number, number], rot: 0.7, geo: shellGeo, color: '#f0c987' },
      { pos: [-6, 0.02, -1] as [number, number, number], rot: 2.0, geo: starfishGeo, color: '#c94c4c' },
      { pos: [0, 0.02, 5] as [number, number, number], rot: -1.5, geo: shellGeo, color: '#e8c1a0' },
      { pos: [7, 0.02, 3] as [number, number, number], rot: 0.4, geo: starfishGeo, color: '#d98a76' }
    ],
    []
  )

  return (
    <group>
      {/* Sandy floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry ref={geometryRef} args={[60, 60, 48, 48]} />
        <meshStandardMaterial color="#c2a86e" flatShading roughness={1.0} metalness={0} />
      </mesh>

      {/* Depth variation overlay */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]}>
        <planeGeometry args={[60, 60, 24, 24]} />
        <meshStandardMaterial color="#a08850" flatShading roughness={1.0} metalness={0} transparent opacity={0.3} />
      </mesh>

      {/* Seaweed strands */}
      {seaweedPatches.map((sw, i) => (
        <Seaweed key={i} position={sw.position} height={sw.height} swayOffset={sw.swayOffset} />
      ))}

      {/* Scattered rocks */}
      {rocks.map((rock, i) => (
        <mesh key={i} position={rock.pos} scale={rock.scale} castShadow geometry={oceanRockGeo}>
          <meshStandardMaterial color={rock.color} flatShading roughness={0.8} />
        </mesh>
      ))}

      {/* Shells and starfish */}
      {decorations.map((dec, i) => (
        <mesh
          key={`deco-${i}`}
          position={dec.pos}
          rotation={[-Math.PI / 2, dec.rot, 0]}
          geometry={dec.geo}
        >
          <meshStandardMaterial color={dec.color} flatShading roughness={0.6} />
        </mesh>
      ))}
    </group>
  )
}

export default OceanFloor
