import http from 'http'
import { BrowserWindow } from 'electron'
import type { SessionStore } from '../monitoring/session-store'
import type { ProcessMonitor } from '../monitoring/process-monitor'
import { DEBUG_SERVER_PORT } from '@shared/config'

let server: http.Server | null = null

const OPENAPI_SPEC = {
  openapi: '3.0.3',
  info: {
    title: 'Cocopilot Debug API',
    description:
      'Local debug API for inspecting Cocopilot monitoring state — sessions, events, and processes.',
    version: '0.1.0'
  },
  servers: [{ url: `http://127.0.0.1:${DEBUG_SERVER_PORT}` }],
  paths: {
    '/api/health': {
      get: {
        summary: 'Health check',
        operationId: 'getHealth',
        responses: {
          '200': {
            description: 'Server is running',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    uptime: { type: 'number', description: 'Process uptime in seconds' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/state': {
      get: {
        summary: 'Full application state',
        operationId: 'getState',
        responses: {
          '200': {
            description: 'Sessions, active sessions, processes, and schema compatibility',
            content: { 'application/json': { schema: { type: 'object' } } }
          }
        }
      }
    },
    '/api/sessions': {
      get: {
        summary: 'All sessions',
        operationId: 'getSessions',
        responses: {
          '200': {
            description: 'List of all monitored sessions',
            content: { 'application/json': { schema: { type: 'array', items: { type: 'object' } } } }
          }
        }
      }
    },
    '/api/events': {
      get: {
        summary: 'Events for a session',
        operationId: 'getEvents',
        parameters: [
          {
            name: 'session',
            in: 'query',
            description: 'Session ID (defaults to first active session)',
            schema: { type: 'string' }
          },
          {
            name: 'n',
            in: 'query',
            description: 'Number of events to return (default 20)',
            schema: { type: 'integer', default: 20 }
          }
        ],
        responses: {
          '200': {
            description: 'List of events',
            content: { 'application/json': { schema: { type: 'array', items: { type: 'object' } } } }
          }
        }
      }
    },
    '/api/processes': {
      get: {
        summary: 'Monitored processes',
        operationId: 'getProcesses',
        responses: {
          '200': {
            description: 'List of copilot CLI processes',
            content: { 'application/json': { schema: { type: 'array', items: { type: 'object' } } } }
          }
        }
      }
    },
    '/api/schema-compatibility': {
      get: {
        summary: 'Schema compatibility info',
        operationId: 'getSchemaCompatibility',
        responses: {
          '200': {
            description: 'Schema compatibility report',
            content: { 'application/json': { schema: { type: 'object' } } }
          }
        }
      }
    },
    '/api/renderer-state': {
      get: {
        summary: 'Renderer process debug state',
        operationId: 'getRendererState',
        description:
          'Returns renderer state available from the main process. Full renderer state (3D scene, audio, Coco) is available via window.__cocopilot_debug in the renderer devtools console.',
        responses: {
          '200': {
            description: 'Renderer state snapshot',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    note: { type: 'string' },
                    mainProcessInfo: { type: 'object' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/playback/start': {
      post: {
        summary: 'Start session playback',
        operationId: 'startPlayback',
        description: 'Replays the synthetic session JSONL into the renderer monitoring store.',
        parameters: [
          {
            name: 'speed',
            in: 'query',
            description: 'Speed multiplier (default 5.0, use 1.0 for real-time)',
            schema: { type: 'number', default: 5.0 }
          }
        ],
        responses: {
          '200': {
            description: 'Playback started',
            content: { 'application/json': { schema: { type: 'object' } } }
          }
        }
      }
    },
    '/api/playback/stop': {
      post: {
        summary: 'Stop session playback',
        operationId: 'stopPlayback',
        responses: {
          '200': {
            description: 'Playback stopped',
            content: { 'application/json': { schema: { type: 'object' } } }
          }
        }
      }
    },
    '/api/playback/status': {
      get: {
        summary: 'Playback status',
        operationId: 'getPlaybackStatus',
        responses: {
          '200': {
            description: 'Current playback progress',
            content: { 'application/json': { schema: { type: 'object' } } }
          }
        }
      }
    }
  }
}

function docsHtml(): string {
  return `<!doctype html>
<html>
<head>
  <title>Cocopilot Debug API</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body>
  <script id="api-reference" data-url="/api/openapi.json"></script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`
}

export function startDebugServer(store: SessionStore, processMonitor?: ProcessMonitor): void {
  server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', `http://127.0.0.1:${DEBUG_SERVER_PORT}`)

    try {
      switch (url.pathname) {
        case '/':
        case '/docs':
          res.setHeader('Content-Type', 'text/html')
          res.end(docsHtml())
          break

        case '/api/openapi.json':
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.end(JSON.stringify(OPENAPI_SPEC))
          break

        case '/api/health':
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }))
          break

        case '/api/state':
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.end(
            JSON.stringify({
              sessions: store.getAllSessions(),
              activeSessions: store.getActiveSessions(),
              processes: processMonitor?.processes ?? [],
              schemaCompatibility: store.getSchemaCompatibility()
            })
          )
          break

        case '/api/events': {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          const sessions = store.getActiveSessions()
          const sessionId = url.searchParams.get('session') ?? sessions[0]?.id
          const n = parseInt(url.searchParams.get('n') ?? '20', 10)
          if (sessionId) {
            res.end(JSON.stringify(store.getEvents(sessionId, n)))
          } else {
            res.end(JSON.stringify([]))
          }
          break
        }

        case '/api/sessions':
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.end(JSON.stringify(store.getAllSessions()))
          break

        case '/api/processes':
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.end(JSON.stringify(processMonitor?.processes ?? []))
          break

        case '/api/schema-compatibility':
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.end(JSON.stringify(store.getSchemaCompatibility()))
          break

        case '/api/renderer-state': {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          const win = BrowserWindow.getAllWindows()[0]
          if (win) {
            try {
              const rendererState = await win.webContents.executeJavaScript(
                'JSON.parse(JSON.stringify(window.__cocopilot_debug || null))'
              )
              res.end(
                JSON.stringify({
                  rendererState,
                  mainProcessInfo: {
                    activeSessions: store.getActiveSessions().length,
                    totalSessions: store.getAllSessions().length,
                    processCount: processMonitor?.processes?.length ?? 0,
                    uptime: process.uptime()
                  }
                })
              )
            } catch (err) {
              res.end(
                JSON.stringify({
                  rendererState: null,
                  error: 'Failed to query renderer: ' + String(err),
                  mainProcessInfo: {
                    activeSessions: store.getActiveSessions().length,
                    totalSessions: store.getAllSessions().length,
                    processCount: processMonitor?.processes?.length ?? 0,
                    uptime: process.uptime()
                  }
                })
              )
            }
          } else {
            res.end(
              JSON.stringify({
                rendererState: null,
                error: 'No renderer window available',
                mainProcessInfo: { uptime: process.uptime() }
              })
            )
          }
          break
        }

        case '/api/playback/start': {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          const pbWin = BrowserWindow.getAllWindows()[0]
          if (pbWin) {
            const speed = parseFloat(url.searchParams.get('speed') ?? '5')
            try {
              const result = await pbWin.webContents.executeJavaScript(
                `JSON.parse(JSON.stringify(window.__cocopilot_playback?.start(${speed}) || {error:'not available'}))`
              )
              res.end(JSON.stringify(result))
            } catch (err) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: String(err) }))
            }
          } else {
            res.statusCode = 503
            res.end(JSON.stringify({ error: 'No renderer window' }))
          }
          break
        }

        case '/api/playback/stop': {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          const stopWin = BrowserWindow.getAllWindows()[0]
          if (stopWin) {
            try {
              const result = await stopWin.webContents.executeJavaScript(
                `JSON.parse(JSON.stringify(window.__cocopilot_playback?.stop() || {error:'not available'}))`
              )
              res.end(JSON.stringify(result))
            } catch (err) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: String(err) }))
            }
          } else {
            res.statusCode = 503
            res.end(JSON.stringify({ error: 'No renderer window' }))
          }
          break
        }

        case '/api/playback/status': {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          const statusWin = BrowserWindow.getAllWindows()[0]
          if (statusWin) {
            try {
              const result = await statusWin.webContents.executeJavaScript(
                `JSON.parse(JSON.stringify(window.__cocopilot_playback?.status() || {error:'not available'}))`
              )
              res.end(JSON.stringify(result))
            } catch (err) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: String(err) }))
            }
          } else {
            res.statusCode = 503
            res.end(JSON.stringify({ error: 'No renderer window' }))
          }
          break
        }

        default:
          res.setHeader('Content-Type', 'application/json')
          res.statusCode = 404
          res.end(JSON.stringify({ error: 'Not found' }))
      }
    } catch (error) {
      res.setHeader('Content-Type', 'application/json')
      res.statusCode = 500
      res.end(JSON.stringify({ error: String(error) }))
    }
  })

  server.listen(DEBUG_SERVER_PORT, '127.0.0.1', () => {
    console.log(`[DebugServer] Listening on http://127.0.0.1:${DEBUG_SERVER_PORT}`)
  })

  server.on('error', (err) => {
    console.warn(`[DebugServer] Failed to start: ${err.message}`)
  })
}

export function stopDebugServer(): void {
  if (server) {
    server.close()
    server = null
  }
}
