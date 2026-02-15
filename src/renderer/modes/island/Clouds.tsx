import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Shared geometries and materials for all clouds (reduced segments for distant objects)
const cloudGeoLarge = new THREE.SphereGeometry(1.5, 6, 6)
const cloudGeoMedSmall = new THREE.SphereGeometry(1, 6, 6)
const cloudGeoMedLarge = new THREE.SphereGeometry(1.2, 6, 6)

interface CloudProps {
  position: [number, number, number]
  speed: number
  scale: number
}

function Cloud({ position, speed, scale }: CloudProps): React.JSX.Element {
  const ref = useRef<THREE.Group>(null)

  const matMain = useMemo(() => new THREE.MeshStandardMaterial({ color: 'white', transparent: true, opacity: 0.8 }), [])
  const matSmall = useMemo(() => new THREE.MeshStandardMaterial({ color: 'white', transparent: true, opacity: 0.7 }), [])
  const matMed = useMemo(() => new THREE.MeshStandardMaterial({ color: 'white', transparent: true, opacity: 0.75 }), [])

  useFrame(() => {
    if (!ref.current) return
    ref.current.position.x += speed
    if (ref.current.position.x > 40) ref.current.position.x = -40
  })

  return (
    <group ref={ref} position={position} scale={[scale, scale * 0.4, scale]}>
      <mesh geometry={cloudGeoLarge} material={matMain} />
      <mesh position={[1.2, 0.2, 0]} geometry={cloudGeoMedSmall} material={matSmall} />
      <mesh position={[-1, -0.1, 0.3]} geometry={cloudGeoMedLarge} material={matMed} />
    </group>
  )
}

const cloudData: CloudProps[] = [
  { position: [-15, 18, -10], speed: 0.005, scale: 1.8 },
  { position: [5, 22, -15], speed: 0.003, scale: 2.2 },
  { position: [20, 16, 5], speed: 0.004, scale: 1.5 },
  { position: [-25, 24, 12], speed: 0.006, scale: 2.0 },
  { position: [10, 20, 18], speed: 0.0035, scale: 1.6 },
  { position: [-8, 19, -20], speed: 0.0045, scale: 1.9 },
  { position: [15, 21, -8], speed: 0.0032, scale: 1.7 },
  { position: [-20, 17, 8], speed: 0.0055, scale: 2.1 },
  { position: [25, 23, -5], speed: 0.0028, scale: 1.4 },
  { position: [-12, 25, 15], speed: 0.004, scale: 1.3 }
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
