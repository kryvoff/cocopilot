import React from 'react'

/** Small rocks scattered on the island surface */
function Rocks(): React.JSX.Element {
  return (
    <group>
      <mesh position={[1.8, 0.15, 1.2]} scale={[0.25, 0.15, 0.2]} castShadow>
        <sphereGeometry args={[1, 5, 5]} />
        <meshStandardMaterial color="#6b6b6b" flatShading />
      </mesh>
      <mesh position={[-1.5, 0.12, 1.6]} scale={[0.18, 0.1, 0.15]} castShadow>
        <sphereGeometry args={[1, 5, 5]} />
        <meshStandardMaterial color="#7a7a7a" flatShading />
      </mesh>
      <mesh position={[0.3, 0.1, -2.0]} scale={[0.3, 0.12, 0.22]} castShadow>
        <sphereGeometry args={[1, 5, 5]} />
        <meshStandardMaterial color="#5e5e5e" flatShading />
      </mesh>
    </group>
  )
}

/** Small shells and starfish on the beach edge */
function Shells(): React.JSX.Element {
  return (
    <group>
      {/* Shell 1 — spiral shape approximated as a small cone */}
      <mesh position={[2.5, 0.02, 0.3]} rotation={[Math.PI / 2, 0, 0.4]} scale={0.08}>
        <coneGeometry args={[1, 2, 5]} />
        <meshStandardMaterial color="#f5cba7" flatShading />
      </mesh>
      {/* Shell 2 */}
      <mesh position={[-2.2, 0.02, -0.8]} rotation={[Math.PI / 2, 0, -0.6]} scale={0.06}>
        <coneGeometry args={[1, 1.5, 5]} />
        <meshStandardMaterial color="#fadbd8" flatShading />
      </mesh>
      {/* Starfish — flat star approximated as a flattened dodecahedron */}
      <mesh position={[1.0, 0.02, 2.3]} scale={[0.12, 0.02, 0.12]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#e8a0bf" flatShading />
      </mesh>
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
        >
          <sphereGeometry args={[1, 4, 4]} />
          <meshStandardMaterial color="#555555" flatShading />
        </mesh>
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
      <mesh position={[0, 0.02, 0]} scale={[0.12, 0.04, 0.12]}>
        <sphereGeometry args={[1, 4, 4]} />
        <meshStandardMaterial color="#8b2500" emissive="#ff4500" emissiveIntensity={0.4} flatShading />
      </mesh>
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
