import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/ipc-channels'
import type { SessionStore } from '../monitoring/session-store'

export function registerIpcHandlers(store: SessionStore): void {
  ipcMain.handle(IPC_CHANNELS.SESSION_LIST, () => {
    return store.getAllSessions()
  })

  ipcMain.handle(IPC_CHANNELS.MONITORING_STATE, () => {
    return {
      sessions: store.getAllSessions(),
      activeSessions: store.getActiveSessions()
    }
  })

  ipcMain.handle(IPC_CHANNELS.MONITORING_EVENT, (_e, sessionId: string, limit?: number) => {
    return store.getEvents(sessionId, limit)
  })

  ipcMain.handle(IPC_CHANNELS.SCHEMA_COMPATIBILITY, () => {
    return store.getSchemaCompatibility()
  })
}
