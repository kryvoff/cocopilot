import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '@shared/ipc-channels'

const api = {
  getSessions: () => ipcRenderer.invoke(IPC_CHANNELS.SESSION_LIST),
  getMonitoringState: () => ipcRenderer.invoke(IPC_CHANNELS.MONITORING_STATE),
  getEvents: (sessionId: string, limit?: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.MONITORING_EVENT, sessionId, limit),
  getSchemaCompatibility: () => ipcRenderer.invoke(IPC_CHANNELS.SCHEMA_COMPATIBILITY),

  onSessionUpdate: (callback: (session: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, session: unknown): void => callback(session)
    ipcRenderer.on(IPC_CHANNELS.MONITORING_SESSION_UPDATE, handler)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.MONITORING_SESSION_UPDATE, handler)
  },

  onEvent: (callback: (sessionId: string, event: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, sessionId: string, evt: unknown): void =>
      callback(sessionId, evt)
    ipcRenderer.on(IPC_CHANNELS.MONITORING_EVENT, handler)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.MONITORING_EVENT, handler)
  }
}

export type CocopilotAPI = typeof api

contextBridge.exposeInMainWorld('cocopilot', api)
