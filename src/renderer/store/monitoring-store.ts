import { create } from 'zustand'
import type { SessionInfo, ParsedEvent } from '@shared/events'

interface CocopilotAPI {
  getSessions: () => Promise<unknown[]>
  getMonitoringState: () => Promise<unknown>
  getEvents: (sessionId: string, limit?: number) => Promise<unknown[]>
  getSchemaCompatibility: () => Promise<unknown>
  onSessionUpdate: (callback: (session: unknown) => void) => () => void
  onEvent: (callback: (sessionId: string, event: unknown) => void) => () => void
}

declare global {
  interface Window {
    cocopilot: CocopilotAPI
  }
}

interface MonitoringState {
  sessions: SessionInfo[]
  selectedSessionId: string | null
  events: ParsedEvent[]

  fetchSessions: () => Promise<void>
  selectSession: (id: string) => void
  subscribeToEvents: () => () => void
}

export const useMonitoringStore = create<MonitoringState>((set, get) => ({
  sessions: [],
  selectedSessionId: null,
  events: [],

  fetchSessions: async () => {
    try {
      const sessions = await window.cocopilot.getSessions()
      set({ sessions: sessions as SessionInfo[] })
      // Auto-select first active session
      const active = (sessions as SessionInfo[]).find(
        (s) => s.status === 'active' || s.status === 'idle'
      )
      if (active && !get().selectedSessionId) {
        set({ selectedSessionId: active.id })
        const events = await window.cocopilot.getEvents(active.id, 100)
        set({ events: events as ParsedEvent[] })
      }
    } catch {
      // API not available (e.g., in tests without preload)
    }
  },

  selectSession: (id: string) => {
    set({ selectedSessionId: id })
    window.cocopilot
      .getEvents(id, 100)
      .then((events) => set({ events: events as ParsedEvent[] }))
      .catch(() => {})
  },

  subscribeToEvents: () => {
    const unsubSession = window.cocopilot.onSessionUpdate((session) => {
      set((state) => {
        const sessions = state.sessions.map((s) =>
          s.id === (session as SessionInfo).id ? (session as SessionInfo) : s
        )
        const exists = sessions.find((s) => s.id === (session as SessionInfo).id)
        if (!exists) sessions.push(session as SessionInfo)
        return { sessions }
      })
    })

    const unsubEvent = window.cocopilot.onEvent((sessionId, event) => {
      const state = get()
      if (sessionId === state.selectedSessionId) {
        set({ events: [...state.events, event as ParsedEvent] })
      }
    })

    return () => {
      unsubSession()
      unsubEvent()
    }
  }
}))
