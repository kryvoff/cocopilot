import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ToolObjectProps {
  position: [number, number, number]
  color: string
  shape: 'box' | 'sphere' | 'cylinder'
  isActive: boolean
}

function ToolObject({ position, color, shape, isActive }: ToolObjectProps): React.JSX.Element {
  const ref = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (!ref.current) return
    const target = isActive ? 1.3 : 1.0
    ref.current.scale.lerp(new THREE.Vector3(target, target, target), delta * 5)
    if (isActive) {
      ref.current.position.y = position[1] + Math.sin(Date.now() * 0.005) * 0.05
    } else {
      ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, position[1], delta * 5)
    }
  })

  return (
    <mesh ref={ref} position={position} castShadow>
      {shape === 'box' && <boxGeometry args={[0.3, 0.2, 0.3]} />}
      {shape === 'sphere' && <sphereGeometry args={[0.15, 8, 8]} />}
      {shape === 'cylinder' && <cylinderGeometry args={[0.08, 0.08, 0.3, 8]} />}
      <meshStandardMaterial
        color={color}
        flatShading
        emissive={isActive ? color : '#000000'}
        emissiveIntensity={isActive ? 0.5 : 0}
      />
    </mesh>
  )
}

const TOOL_MAP: Record<string, string[]> = {
  edit: ['edit', 'create'],
  bash: ['bash'],
  grep: ['grep', 'glob'],
  web: ['web_search', 'web_fetch']
}

function isToolInGroup(activeTool: string | null, group: string): boolean {
  if (!activeTool) return false
  return TOOL_MAP[group]?.includes(activeTool) ?? false
}

interface ToolObjectsProps {
  activeTool: string | null
}

function ToolObjects({ activeTool }: ToolObjectsProps): React.JSX.Element {
  return (
    <group>
      <ToolObject position={[-0.5, 0.35, 0.5]} color="#4A4A4A" shape="box" isActive={isToolInGroup(activeTool, 'edit')} />
      <ToolObject position={[1.8, 0.35, 0.5]} color="#8B4513" shape="sphere" isActive={isToolInGroup(activeTool, 'bash')} />
      <ToolObject position={[0.8, 0.35, -0.3]} color="#2196F3" shape="cylinder" isActive={isToolInGroup(activeTool, 'grep')} />
      <ToolObject position={[0.8, 0.35, 1.8]} color="#4CAF50" shape="cylinder" isActive={isToolInGroup(activeTool, 'web')} />
    </group>
  )
}

export default ToolObjects
