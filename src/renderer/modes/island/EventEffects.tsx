import React, { useState, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useMonitoringStore } from '../../store/monitoring-store'

interface EventEffect {
  id: string
  type: 'success' | 'error' | 'info' | 'start' | 'end'
  position: [number, number, number]
  timestamp: number
}

const EFFECT_COLORS: Record<EventEffect['type'], string> = {
  success: '#4ecca3',
  error: '#e94560',
  info: '#2196f3',
  start: '#ffd700',
  end: '#ffffff'
}

function mapEventToEffectType(event: {
  type: string
  data: Record<string, unknown>
}): EventEffect['type'] {
  if (event.type === 'session.start') return 'start'
  if (event.type === 'session.shutdown') return 'end'
  if (event.type === 'tool.execution_complete') {
    return event.data?.success === false ? 'error' : 'success'
  }
  if (event.type.includes('error')) return 'error'
  return 'info'
}

function RisingParticle({
  effect,
  onComplete
}: {
  effect: EventEffect
  onComplete: () => void
}): React.JSX.Element {
  const ref = useRef<THREE.Mesh>(null)
  const startTime = useRef(Date.now())
  const completed = useRef(false)

  const color = EFFECT_COLORS[effect.type]

  useFrame(() => {
    if (!ref.current || completed.current) return
    const elapsed = (Date.now() - startTime.current) / 1000
    if (elapsed > 1.5) {
      completed.current = true
      onComplete()
      return
    }
    ref.current.position.y = effect.position[1] + elapsed * 2
    ref.current.scale.setScalar(1 - elapsed / 1.5)
    const mat = ref.current.material as THREE.MeshStandardMaterial
    mat.opacity = 1 - elapsed / 1.5
  })

  return (
    <mesh ref={ref} position={effect.position}>
      <sphereGeometry args={[0.1, 8, 8]} />
      <meshStandardMaterial
        color={color}
        transparent
        emissive={color}
        emissiveIntensity={2}
      />
    </mesh>
  )
}

function EventEffects(): React.JSX.Element {
  const [effects, setEffects] = useState<EventEffect[]>([])
  const events = useMonitoringStore((s) => s.events)
  const lastEventCount = useRef(0)

  useEffect(() => {
    if (events.length > lastEventCount.current) {
      const newEvents = events.slice(lastEventCount.current)
      const newEffects = newEvents.map((evt) => ({
        id: evt.id,
        type: mapEventToEffectType(evt),
        position: [0.8, 1.5, 0.8] as [number, number, number],
        timestamp: Date.now()
      }))
      setEffects((prev) => [...prev, ...newEffects])
      lastEventCount.current = events.length
    }
  }, [events])

  const removeEffect = (id: string): void => {
    setEffects((prev) => prev.filter((e) => e.id !== id))
  }

  return (
    <>
      {effects.map((effect) => (
        <RisingParticle
          key={effect.id}
          effect={effect}
          onComplete={() => removeEffect(effect.id)}
        />
      ))}
    </>
  )
}

export default EventEffects
export { mapEventToEffectType }
export type { EventEffect }
