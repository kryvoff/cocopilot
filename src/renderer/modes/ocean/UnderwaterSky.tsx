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

interface GodRayProps {
  pos: [number, number, number]
  angle: [number, number, number]
  height: number
  radius: number
  opacity: number
  speed: number
  phase: number
  color: string
}

/** Volumetric god ray cone emanating from the sun */
function GodRay({ pos, angle, height, radius, opacity, speed, phase, color }: GodRayProps): React.JSX.Element {
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime
    ref.current.rotation.x = angle[0] + Math.sin(t * speed + phase) * 0.06
    ref.current.rotation.z = angle[2] + Math.cos(t * speed * 0.8 + phase * 1.3) * 0.05
  })

  return (
    <mesh ref={ref} position={pos} rotation={[angle[0], angle[1], angle[2]]}>
      <coneGeometry args={[radius, height, 8, 1, true]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

function UnderwaterSky(): React.JSX.Element {
  const uniforms = useMemo(
    () => ({
      topColor: { value: new THREE.Color('#4fc3f7') },
      bottomColor: { value: new THREE.Color('#0288D1') },
      offset: { value: 20 },
      exponent: { value: 0.4 }
    }),
    []
  )

  const godRays = useMemo<GodRayProps[]>(
    () => [
      { pos: [0, 38, 0], angle: [-0.1, 0, -0.15], height: 35, radius: 2.0, opacity: 0.08, speed: 0.2, phase: 0, color: '#FFE082' },
      { pos: [2, 38, -1], angle: [-0.05, 0, 0.1], height: 30, radius: 1.5, opacity: 0.06, speed: 0.25, phase: 1.2, color: '#80D8FF' },
      { pos: [-3, 38, 1], angle: [0.08, 0, -0.08], height: 32, radius: 1.8, opacity: 0.07, speed: 0.18, phase: 2.5, color: '#FFE082' },
      { pos: [1, 38, 2], angle: [-0.12, 0, 0.05], height: 28, radius: 1.2, opacity: 0.05, speed: 0.3, phase: 3.8, color: '#80D8FF' },
      { pos: [-1, 38, -2], angle: [0.06, 0, 0.12], height: 33, radius: 2.2, opacity: 0.09, speed: 0.15, phase: 5.0, color: '#FFE082' },
      { pos: [3, 38, 1], angle: [-0.03, 0, -0.1], height: 26, radius: 1.0, opacity: 0.04, speed: 0.28, phase: 0.6, color: '#80D8FF' },
      { pos: [-2, 38, -1], angle: [0.1, 0, 0.03], height: 38, radius: 2.5, opacity: 0.1, speed: 0.22, phase: 4.2, color: '#FFE082' }
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

      {/* Sun disk at water surface */}
      <mesh position={[0, 40, 0]}>
        <sphereGeometry args={[15, 24, 24]} />
        <meshBasicMaterial color="#FFECB3" transparent opacity={0.35} />
      </mesh>

      {/* God rays from the sun */}
      {godRays.map((ray, i) => (
        <GodRay key={i} {...ray} />
      ))}
    </group>
  )
}

export default UnderwaterSky
