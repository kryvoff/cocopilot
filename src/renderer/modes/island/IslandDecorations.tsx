import React from 'react'
import * as THREE from 'three'

// Shared geometries and materials for decorations
const rockGeo = new THREE.SphereGeometry(1, 4, 4)
const rockMat1 = new THREE.MeshStandardMaterial({ color: '#6b6b6b', flatShading: true })
const rockMat2 = new THREE.MeshStandardMaterial({ color: '#7a7a7a', flatShading: true })
const rockMat3 = new THREE.MeshStandardMaterial({ color: '#5e5e5e', flatShading: true })

const shellGeo1 = new THREE.ConeGeometry(1, 2, 5)
const shellMat1 = new THREE.MeshStandardMaterial({ color: '#f5cba7', flatShading: true })
const shellGeo2 = new THREE.ConeGeometry(1, 1.5, 5)
const shellMat2 = new THREE.MeshStandardMaterial({ color: '#fadbd8', flatShading: true })
const starfishGeo = new THREE.DodecahedronGeometry(1, 0)
const starfishMat = new THREE.MeshStandardMaterial({ color: '#e8a0bf', flatShading: true })

const stoneGeo = new THREE.SphereGeometry(1, 4, 4)
const stoneMat = new THREE.MeshStandardMaterial({ color: '#555555', flatShading: true })
const emberMat = new THREE.MeshStandardMaterial({ color: '#8b2500', emissive: '#ff4500', emissiveIntensity: 0.4, flatShading: true })

/** Small rocks scattered on the island surface */
function Rocks(): React.JSX.Element {
  return (
    <group>
      <mesh position={[1.8, 0.15, 1.2]} scale={[0.25, 0.15, 0.2]} castShadow geometry={rockGeo} material={rockMat1} />
      <mesh position={[-1.5, 0.12, 1.6]} scale={[0.18, 0.1, 0.15]} castShadow geometry={rockGeo} material={rockMat2} />
      <mesh position={[0.3, 0.1, -2.0]} scale={[0.3, 0.12, 0.22]} castShadow geometry={rockGeo} material={rockMat3} />
    </group>
  )
}

/** Small shells and starfish on the beach edge */
function Shells(): React.JSX.Element {
  return (
    <group>
      {/* Shell 1 — spiral shape approximated as a small cone */}
      <mesh position={[2.5, 0.02, 0.3]} rotation={[Math.PI / 2, 0, 0.4]} scale={0.08} geometry={shellGeo1} material={shellMat1} />
      {/* Shell 2 */}
      <mesh position={[-2.2, 0.02, -0.8]} rotation={[Math.PI / 2, 0, -0.6]} scale={0.06} geometry={shellGeo2} material={shellMat2} />
      {/* Starfish — flat star approximated as a flattened dodecahedron */}
      <mesh position={[1.0, 0.02, 2.3]} scale={[0.12, 0.02, 0.12]} geometry={starfishGeo} material={starfishMat} />
    </group>
  )
}

/** Small campfire: ring of stones with a warm glow */
function Campfire(): React.JSX.Element {
  const stoneAngles = [0, 1.05, 2.1, 3.15, 4.2, 5.25]
  const radius = 0.25

  return (
    <group position={[-0.6, 0.3, 1.2]}>
      {/* Stone ring */}
      {stoneAngles.map((angle, i) => (
        <mesh
          key={i}
          position={[Math.cos(angle) * radius, 0, Math.sin(angle) * radius]}
          scale={[0.07, 0.05, 0.07]}
          castShadow
          geometry={stoneGeo}
          material={stoneMat}
        />
      ))}
      {/* Warm glow */}
      <pointLight
        position={[0, 0.1, 0]}
        color="#ff8c42"
        intensity={0.6}
        distance={3}
        decay={2}
      />
      {/* Tiny ember pile */}
      <mesh position={[0, 0.02, 0]} scale={[0.12, 0.04, 0.12]} geometry={stoneGeo} material={emberMat} />
    </group>
  )
}

function IslandDecorations(): React.JSX.Element {
  return (
    <group>
      <Rocks />
      <Shells />
      <Campfire />
    </group>
  )
}

export default IslandDecorations
