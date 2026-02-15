import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { FileWatcher, SessionStore } from './monitoring'
import { registerIpcHandlers } from './ipc/monitoring-ipc'
import { startDebugServer, stopDebugServer } from './observability/debug-server'

const sessionStore = new SessionStore()
const fileWatcher = new FileWatcher()

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Cocopilot — No active sessions',
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Forward events to renderer
  sessionStore.on('session-updated', (session) => {
    mainWindow.webContents.send('monitoring:session-update', session)
    const title = session.summary
      ? `Cocopilot — ${session.summary}`
      : `Cocopilot — Session ${session.id.slice(0, 8)}`
    mainWindow.setTitle(title)
  })

  sessionStore.on('event-added', (sessionId, event) => {
    mainWindow.webContents.send('monitoring:event', sessionId, event)
  })

  return mainWindow
}

app.whenReady().then(() => {
  app.name = 'Cocopilot'
  electronApp.setAppUserModelId('com.cocopilot.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Set up monitoring
  registerIpcHandlers(sessionStore)
  startDebugServer(sessionStore)

  fileWatcher.on('session-discovered', (sessionId, dir) => {
    sessionStore.addSession(sessionId, dir)
  })

  fileWatcher.on('event', (sessionId, event) => {
    sessionStore.addEvent(sessionId, event)
  })

  fileWatcher.start().catch((err) => {
    console.error('[Main] Failed to start file watcher:', err)
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  fileWatcher.stop()
  stopDebugServer()
})
