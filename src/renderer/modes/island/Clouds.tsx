import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface CloudProps {
  position: [number, number, number]
  speed: number
  scale: number
}

function Cloud({ position, speed, scale }: CloudProps): React.JSX.Element {
  const ref = useRef<THREE.Group>(null)

  useFrame(() => {
    if (!ref.current) return
    ref.current.position.x += speed
    if (ref.current.position.x > 40) ref.current.position.x = -40
  })

  return (
    <group ref={ref} position={position} scale={[scale, scale * 0.4, scale]}>
      <mesh>
        <sphereGeometry args={[1.5, 8, 8]} />
        <meshStandardMaterial color="white" transparent opacity={0.8} />
      </mesh>
      <mesh position={[1.2, 0.2, 0]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color="white" transparent opacity={0.7} />
      </mesh>
      <mesh position={[-1, -0.1, 0.3]}>
        <sphereGeometry args={[1.2, 8, 8]} />
        <meshStandardMaterial color="white" transparent opacity={0.75} />
      </mesh>
    </group>
  )
}

const cloudData: CloudProps[] = [
  { position: [-15, 18, -10], speed: 0.005, scale: 1.8 },
  { position: [5, 22, -15], speed: 0.003, scale: 2.2 },
  { position: [20, 16, 5], speed: 0.004, scale: 1.5 },
  { position: [-25, 24, 12], speed: 0.006, scale: 2.0 },
  { position: [10, 20, 18], speed: 0.0035, scale: 1.6 }
]

function Clouds(): React.JSX.Element {
  return (
    <group>
      {cloudData.map((cloud, i) => (
        <Cloud key={i} {...cloud} />
      ))}
    </group>
  )
}

export default Clouds
