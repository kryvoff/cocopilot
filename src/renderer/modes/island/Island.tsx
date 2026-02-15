import React from 'react'
import PalmTree from './PalmTree'

function Island(): React.JSX.Element {
  return (
    <group>
      {/* Main island — flattened cylinder */}
      <mesh position={[0, -0.1, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[3, 3.5, 0.5, 8]} />
        <meshStandardMaterial color="#f4d03f" flatShading />
      </mesh>

      {/* Slightly raised center mound */}
      <mesh position={[0, 0.15, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.8, 2.2, 0.3, 7]} />
        <meshStandardMaterial color="#f5d76e" flatShading />
      </mesh>

      {/* Palm trees scattered around the island */}
      <PalmTree position={[0, 0.3, 0]} height={3.5} lean={0} />
      <PalmTree position={[1.5, 0.1, 0.8]} height={2.8} lean={0.3} />
      <PalmTree position={[-1.2, 0.1, 1.0]} height={3.0} lean={-0.25} />
      <PalmTree position={[0.5, 0.1, -1.5]} height={2.5} lean={0.15} />
      <PalmTree position={[-1.0, 0.1, -0.8]} height={2.2} lean={-0.4} />
    </group>
  )
}

export default Island
