import { app, shell, BrowserWindow, Menu } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { FileWatcher, SessionStore, ProcessMonitor } from './monitoring'
import { registerIpcHandlers } from './ipc/monitoring-ipc'
import { startDebugServer, stopDebugServer } from './observability/debug-server'
import { getDatabase, closeDatabase } from './database/schema'
import { Queries } from './database/queries'
import { DEBUG_SERVER_PORT } from '@shared/config'

let sessionStore: SessionStore
const fileWatcher = new FileWatcher()
const processMonitor = new ProcessMonitor()

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

  sessionStore.on('processes-updated', (processes) => {
    mainWindow.webContents.send('monitoring:processes', processes)
  })

  return mainWindow
}

app.whenReady().then(() => {
  app.name = 'Cocopilot'
  electronApp.setAppUserModelId('com.cocopilot.app')

  if (process.platform === 'darwin') {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'Cocopilot',
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      },
      { role: 'fileMenu' },
      { role: 'editMenu' },
      { role: 'viewMenu' },
      { role: 'windowMenu' },
      {
        role: 'help',
        submenu: [
          {
            label: 'Debug API',
            click: () =>
              shell.openExternal(`http://127.0.0.1:${DEBUG_SERVER_PORT}/api/health`)
          }
        ]
      }
    ]
    Menu.setApplicationMenu(Menu.buildFromTemplate(template))
  }

  // Initialize database and session store
  const db = getDatabase()
  const queries = new Queries(db)
  sessionStore = new SessionStore(queries)
  sessionStore.loadFromDatabase()

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Set up monitoring
  registerIpcHandlers(sessionStore, processMonitor)
  startDebugServer(sessionStore, processMonitor)

  fileWatcher.on('session-discovered', (sessionId, dir) => {
    sessionStore.addSession(sessionId, dir)
  })

  fileWatcher.on('event', (sessionId, event) => {
    sessionStore.addEvent(sessionId, event)
  })

  fileWatcher.start().catch((err) => {
    console.error('[Main] Failed to start file watcher:', err)
  })

  // Start process monitor — polls for copilot CLI processes
  processMonitor.on('processes-updated', (processes) => {
    sessionStore.updateProcesses(processes)
  })
  processMonitor.start()

  // After initial file scan, mark stale sessions (give chokidar time to discover all sessions)
  setTimeout(() => {
    sessionStore.markStaleSessions()
  }, 3000)

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

app.on('will-quit', async () => {
  await fileWatcher.stop()
  processMonitor.stop()
  stopDebugServer()
  closeDatabase()
})
