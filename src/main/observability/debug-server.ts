import http from 'http'
import type { SessionStore } from '../monitoring/session-store'
import type { ProcessMonitor } from '../monitoring/process-monitor'
import { DEBUG_SERVER_PORT } from '@shared/config'

let server: http.Server | null = null

export function startDebugServer(store: SessionStore, processMonitor?: ProcessMonitor): void {
  server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Access-Control-Allow-Origin', '*')

    const url = new URL(req.url ?? '/', `http://127.0.0.1:${DEBUG_SERVER_PORT}`)

    try {
      switch (url.pathname) {
        case '/api/health':
          res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }))
          break

        case '/api/state':
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
          res.end(JSON.stringify(store.getAllSessions()))
          break

        case '/api/processes':
          res.end(JSON.stringify(processMonitor?.processes ?? []))
          break

        case '/api/schema-compatibility':
          res.end(JSON.stringify(store.getSchemaCompatibility()))
          break

        default:
          res.statusCode = 404
          res.end(JSON.stringify({ error: 'Not found' }))
      }
    } catch (error) {
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
