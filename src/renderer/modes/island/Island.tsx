import React from 'react'
import PalmTree from './PalmTree'

function Island(): React.JSX.Element {
  return (
    <group>
      {/* Main island — flattened cylinder, lowered so waves overlap edges */}
      <mesh position={[0, -0.15, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[3, 3.5, 1.0, 8]} />
        <meshStandardMaterial color="#f4d03f" flatShading />
      </mesh>

      {/* Slightly raised center mound */}
      <mesh position={[0, 0.35, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.8, 2.2, 0.4, 7]} />
        <meshStandardMaterial color="#f5d76e" flatShading />
      </mesh>

      {/* Palm trees scattered around the island with varied sizes */}
      <PalmTree position={[-1, 0.5, -1]} height={3.5} scale={1.2} lean={0.1} />
      <PalmTree position={[1.5, 0.5, -0.5]} height={2.8} scale={0.8} lean={-0.15} />
      <PalmTree position={[-0.5, 0.5, 1.5]} height={3.0} scale={1.0} lean={0.05} />
      <PalmTree position={[2, 0.5, 1]} height={2.5} scale={0.9} lean={0.2} />
      <PalmTree position={[-1.5, 0.5, 0.5]} height={2.2} scale={1.1} lean={-0.1} />
    </group>
  )
}

export default Island
