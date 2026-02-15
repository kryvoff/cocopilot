import React, { useMemo } from 'react'
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

function SkyDome(): React.JSX.Element {
  const uniforms = useMemo(
    () => ({
      topColor: { value: new THREE.Color('#2563EB') },
      bottomColor: { value: new THREE.Color('#87CEEB') },
      offset: { value: 20 },
      exponent: { value: 0.6 }
    }),
    []
  )

  return (
    <group>
      {/* Gradient sky dome */}
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

      {/* Sun */}
      <mesh position={[100, 100, 50]}>
        <sphereGeometry args={[8, 16, 16]} />
        <meshBasicMaterial color="#FFF176" />
      </mesh>
    </group>
  )
}

export default SkyDome
