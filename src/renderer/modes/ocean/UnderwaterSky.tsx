import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const vertexShader = `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform vec3 topColor;
  uniform vec3 bottomColor;
  uniform float offset;
  uniform float exponent;
  varying vec3 vWorldPosition;
  void main() {
    float h = normalize(vWorldPosition + offset).y;
    gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
  }
`

/** Single sun ray cone that sways gently */
function SunRay({
  position,
  swayOffset
}: {
  position: [number, number, number]
  swayOffset: number
}): React.JSX.Element {
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime
    ref.current.rotation.x = Math.sin(t * 0.3 + swayOffset) * 0.08
    ref.current.rotation.z = Math.cos(t * 0.25 + swayOffset * 1.3) * 0.06
  })

  return (
    <mesh ref={ref} position={position}>
      <coneGeometry args={[1.5, 40, 8, 1, true]} />
      <meshBasicMaterial
        color="#4a90d9"
        transparent
        opacity={0.06}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

function UnderwaterSky(): React.JSX.Element {
  const uniforms = useMemo(
    () => ({
      topColor: { value: new THREE.Color('#1e4d7b') },
      bottomColor: { value: new THREE.Color('#0a1628') },
      offset: { value: 20 },
      exponent: { value: 0.4 }
    }),
    []
  )

  const rays = useMemo(
    () => [
      { position: [-4, 20, -2] as [number, number, number], swayOffset: 0 },
      { position: [2, 22, -5] as [number, number, number], swayOffset: 1.5 },
      { position: [6, 19, 1] as [number, number, number], swayOffset: 3.0 },
      { position: [-1, 21, 4] as [number, number, number], swayOffset: 4.5 }
    ],
    []
  )

  return (
    <group>
      {/* Gradient underwater dome */}
      <mesh>
        <sphereGeometry args={[400, 32, 15]} />
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Diffuse sun glow at the surface */}
      <mesh position={[0, 35, 0]}>
        <sphereGeometry args={[12, 16, 16]} />
        <meshBasicMaterial color="#2a6fa8" transparent opacity={0.12} />
      </mesh>

      {/* Sun ray cones */}
      {rays.map((ray, i) => (
        <SunRay key={i} position={ray.position} swayOffset={ray.swayOffset} />
      ))}
    </group>
  )
}

export default UnderwaterSky
