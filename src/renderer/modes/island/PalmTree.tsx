import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Shared materials across all PalmTree instances
const trunkMat = new THREE.MeshStandardMaterial({ color: '#8b6914', flatShading: true })
const frondMat = new THREE.MeshStandardMaterial({
  color: '#27ae60',
  flatShading: true,
  side: THREE.DoubleSide
})
const coconutGeo = new THREE.SphereGeometry(0.09, 6, 6)
const coconutMat = new THREE.MeshStandardMaterial({ color: '#8b4513', flatShading: true })

// Create a palm frond shape — long tapered leaf
function createFrondGeometry(): THREE.BufferGeometry {
  const points: number[] = []
  const indices: number[] = []
  const segments = 8
  const length = 1.8
  const width = 0.25

  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const x = t * length
    // Droop curve: fronds bend downward
    const y = -t * t * 0.8
    // Width tapers to point at tip
    const w = width * Math.sin(t * Math.PI) * (1 - t * 0.3)
    // Left vertex
    points.push(x, y, -w)
    // Right vertex
    points.push(x, y, w)
  }

  for (let i = 0; i < segments; i++) {
    const a = i * 2
    const b = a + 1
    const c = a + 2
    const d = a + 3
    indices.push(a, c, b)
    indices.push(b, c, d)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

const frondGeo = createFrondGeometry()

interface PalmTreeProps {
  position: [number, number, number]
  height?: number
  lean?: number
  scale?: number
}

function PalmTree({ position, height = 3, lean = 0.3, scale = 1 }: PalmTreeProps): React.JSX.Element {
  const treeRef = useRef<THREE.Group>(null)

  // Curved trunk segments for a natural look
  const trunkSegments = useMemo(() => {
    const segs: { pos: [number, number, number]; rot: [number, number, number]; radius: number; len: number }[] = []
    const count = 5
    for (let i = 0; i < count; i++) {
      const t = i / count
      const segLen = height / count
      const curve = lean * t * t
      const taper = 0.12 - t * 0.06
      segs.push({
        pos: [curve, t * height + segLen / 2, 0],
        rot: [0, 0, -lean * t * 0.6],
        radius: Math.max(taper, 0.04),
        len: segLen + 0.05
      })
    }
    return segs
  }, [height, lean])

  const frondCount = 7
  const fronds = useMemo(
    () =>
      Array.from({ length: frondCount }, (_, i) => {
        const angle = (i / frondCount) * Math.PI * 2 + Math.random() * 0.3
        // Vary the droop angle for each frond
        const tilt = 0.3 + Math.random() * 0.4
        return { angle, tilt, key: i }
      }),
    []
  )

  // Crown position (top of curved trunk)
  const crownX = lean
  const crownY = height

  // Gentle sway animation
  useFrame(() => {
    if (treeRef.current) {
      treeRef.current.rotation.z = Math.sin(Date.now() * 0.0008 + position[0] * 2) * 0.03
    }
  })

  return (
    <group position={position} scale={scale} ref={treeRef}>
      {/* Curved trunk segments */}
      {trunkSegments.map((seg, i) => (
        <mesh
          key={i}
          position={seg.pos}
          rotation={seg.rot}
          castShadow
          material={trunkMat}
        >
          <cylinderGeometry args={[seg.radius * 0.8, seg.radius, seg.len, 6]} />
        </mesh>
      ))}

      {/* Crown group — fronds + coconuts */}
      <group position={[crownX, crownY, 0]}>
        {/* Drooping palm fronds */}
        {fronds.map(({ angle, tilt, key }) => (
          <mesh
            key={key}
            rotation={[tilt, angle, 0]}
            castShadow
            geometry={frondGeo}
            material={frondMat}
          />
        ))}

        {/* Coconut cluster — 3 coconuts nestled at the crown */}
        <mesh position={[0.1, -0.12, 0.08]} geometry={coconutGeo} material={coconutMat} />
        <mesh position={[-0.08, -0.14, -0.06]} geometry={coconutGeo} material={coconutMat} />
        <mesh position={[0.02, -0.1, -0.1]} geometry={coconutGeo} material={coconutMat} />
      </group>
    </group>
  )
}

export default PalmTree
