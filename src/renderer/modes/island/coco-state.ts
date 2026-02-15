import { create } from 'zustand'
import type { ParsedEvent } from '@shared/events'
import type { CocoState } from './Coco'

export interface SubAgent {
  id: string
  name: string
  startTime: number
}

interface CocoStore {
  state: CocoState
  toolActive: string | null
  subAgentCount: number
  activeSubAgents: SubAgent[]
  activityLevel: number
  recentEventTimestamps: number[]
  setState: (state: CocoState) => void
  processEvent: (event: ParsedEvent) => void
}

export const useCocoStore = create<CocoStore>((set, get) => ({
  state: 'hidden',
  toolActive: null,
  subAgentCount: 0,
  activeSubAgents: [],
  activityLevel: 0,
  recentEventTimestamps: [],

  setState: (state: CocoState) => set({ state }),

  processEvent: (event: ParsedEvent) => {
    const { setState } = get()

    // Update activity level based on recent event frequency
    const now = Date.now()
    const windowMs = 30_000 // 30-second window
    const maxEventsForFullActivity = 20
    const recent = [...get().recentEventTimestamps, now].filter((t) => now - t < windowMs)
    const activityLevel = Math.min(1, recent.length / maxEventsForFullActivity)
    set({ recentEventTimestamps: recent, activityLevel })

    switch (event.type) {
      case 'session.start': {
        set({ state: 'entering', toolActive: null, subAgentCount: 0, activeSubAgents: [] })
        setTimeout(() => {
          if (get().state === 'entering') setState('idle')
        }, 1500)
        break
      }

      case 'user.message':
        set({ state: 'idle' })
        break

      case 'assistant.turn_start':
        set({ state: 'thinking' })
        // Return to idle if no further events within 30s (stale session)
        setTimeout(() => {
          if (get().state === 'thinking') setState('idle')
        }, 30_000)
        break

      case 'tool.execution_start': {
        const toolName = (event.data?.toolName as string) ?? null
        set({ state: 'working', toolActive: toolName })
        break
      }

      case 'tool.execution_complete': {
        const success = event.data?.success as boolean | undefined
        if (success === false) {
          set({ state: 'startled', toolActive: null })
          setTimeout(() => {
            if (get().state === 'startled') setState('idle')
          }, 1000)
        } else {
          set({ state: 'idle', toolActive: null })
        }
        break
      }

      case 'subagent.started':
        set((s) => ({
          subAgentCount: s.subAgentCount + 1,
          activeSubAgents: [
            ...s.activeSubAgents,
            {
              id: (event.data?.agentId as string) ?? event.id,
              name: (event.data?.agentName as string) ?? 'sub-agent',
              startTime: Date.now()
            }
          ]
        }))
        break

      case 'subagent.completed':
      case 'subagent.failed': {
        const agentId = (event.data?.agentId as string) ?? event.id
        set((s) => ({
          subAgentCount: Math.max(0, s.subAgentCount - 1),
          activeSubAgents: s.activeSubAgents.filter((a) => a.id !== agentId)
        }))
        break
      }

      case 'session.shutdown': {
        set({ state: 'waving', toolActive: null })
        setTimeout(() => {
          if (get().state === 'waving') setState('hidden')
        }, 2000)
        break
      }

      // Unknown events are silently ignored
      default:
        break
    }
  }
}))
