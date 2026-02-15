import { create } from 'zustand'
import type { ParsedEvent } from '@shared/events'
import type { CocoState } from './Coco'

interface CocoStore {
  state: CocoState
  toolActive: string | null
  subAgentCount: number
  setState: (state: CocoState) => void
  processEvent: (event: ParsedEvent) => void
}

export const useCocoStore = create<CocoStore>((set, get) => ({
  state: 'hidden',
  toolActive: null,
  subAgentCount: 0,

  setState: (state: CocoState) => set({ state }),

  processEvent: (event: ParsedEvent) => {
    const { setState } = get()

    switch (event.type) {
      case 'session.start': {
        set({ state: 'entering', toolActive: null, subAgentCount: 0 })
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
        set((s) => ({ subAgentCount: s.subAgentCount + 1 }))
        break

      case 'subagent.completed':
      case 'subagent.failed':
        set((s) => ({ subAgentCount: Math.max(0, s.subAgentCount - 1) }))
        break

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
