import { execFile } from 'child_process'
import { promisify } from 'util'
import { EventEmitter } from 'events'
import type { ProcessInfo } from '@shared/events'
import { PROCESS_POLL_INTERVAL_MS } from '@shared/config'

const execFileAsync = promisify(execFile)

export interface ProcessMonitorEvents {
  'processes-updated': [processes: ProcessInfo[]]
}

export class ProcessMonitor extends EventEmitter<ProcessMonitorEvents> {
  private interval: ReturnType<typeof setInterval> | null = null
  private _processes: ProcessInfo[] = []

  get processes(): ProcessInfo[] {
    return this._processes
  }

  start(): void {
    if (this.interval) return
    // Poll immediately, then on interval
    this.poll()
    this.interval = setInterval(() => this.poll(), PROCESS_POLL_INTERVAL_MS)
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  private async poll(): Promise<void> {
    try {
      const processes = await getCopilotProcesses()
      // Map processes to session IDs via lsof
      await mapProcessesToSessions(processes)
      this._processes = processes
      this.emit('processes-updated', processes)
    } catch (error) {
      console.warn('[ProcessMonitor] Poll error:', error)
    }
  }
}

/**
 * Get all running copilot CLI processes using `ps`.
 * Filters to only the copilot binary (not VS Code plugins, Cocopilot, etc.)
 */
async function getCopilotProcesses(): Promise<ProcessInfo[]> {
  const platform = process.platform

  try {
    if (platform === 'win32') {
      return await getWindowsProcesses()
    } else {
      return await getUnixProcesses()
    }
  } catch {
    return []
  }
}

async function getUnixProcesses(): Promise<ProcessInfo[]> {
  // ps -eo pid,ppid,rss,pcpu,thcount,etime,command
  // thcount may not be available on macOS, use different flags
  const isMac = process.platform === 'darwin'
  const psArgs = isMac
    ? ['-eo', 'pid,rss,pcpu,etime,command']
    : ['-eo', 'pid,rss,pcpu,thcount,etime,command']

  const { stdout } = await execFileAsync('ps', psArgs, { timeout: 5000 })
  const lines = stdout.trim().split('\n').slice(1) // skip header

  const processes: ProcessInfo[] = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // Parse ps output fields
    const parts = trimmed.split(/\s+/)
    if (parts.length < (isMac ? 5 : 6)) continue

    const command = isMac ? parts.slice(4).join(' ') : parts.slice(5).join(' ')

    // Only match standalone copilot CLI binary (not VS Code plugins, Cocopilot, etc.)
    const cmdBase = command.split('/').pop()?.split(' ')[0] ?? ''
    if (cmdBase !== 'copilot') continue
    // Exclude any Cocopilot or Code process
    if (command.includes('Cocopilot') || command.includes('Code')) continue

    const pid = parseInt(parts[0], 10)
    const rssKb = parseInt(parts[1], 10)
    const cpu = parseFloat(parts[2])
    const elapsed = isMac ? parts[3] : parts[4]
    const threads = isMac ? 0 : parseInt(parts[3], 10)

    processes.push({
      pid,
      cpu,
      rssKb,
      threads,
      command,
      elapsed,
      sessionId: null
    })
  }

  // Get thread count on macOS using ps -M
  if (isMac && processes.length > 0) {
    for (const proc of processes) {
      try {
        const { stdout: threadOut } = await execFileAsync('ps', ['-M', '-p', String(proc.pid)], {
          timeout: 3000
        })
        // Each line after header is a thread
        proc.threads = Math.max(0, threadOut.trim().split('\n').length - 1)
      } catch {
        // Process may have exited
      }
    }
  }

  return processes
}

async function getWindowsProcesses(): Promise<ProcessInfo[]> {
  try {
    const { stdout } = await execFileAsync(
      'tasklist',
      ['/FI', 'IMAGENAME eq copilot.exe', '/FO', 'CSV', '/V'],
      { timeout: 5000 }
    )
    const lines = stdout.trim().split('\n').slice(1)
    const processes: ProcessInfo[] = []

    for (const line of lines) {
      const fields = line.split('","').map((f) => f.replace(/"/g, ''))
      if (fields.length < 8) continue

      processes.push({
        pid: parseInt(fields[1], 10),
        cpu: 0, // tasklist doesn't provide CPU %
        rssKb: parseInt(fields[4].replace(/[^0-9]/g, ''), 10),
        threads: 0,
        command: fields[0],
        elapsed: fields[7] ?? '',
        sessionId: null
      })
    }
    return processes
  } catch {
    return []
  }
}

/**
 * Map copilot processes to session IDs by checking which session.db files
 * they have open via `lsof`.
 */
async function mapProcessesToSessions(processes: ProcessInfo[]): Promise<void> {
  if (processes.length === 0) return
  if (process.platform === 'win32') return // lsof not available on Windows

  const pids = processes.map((p) => String(p.pid))

  try {
    // Use lsof to find open session.db files for all copilot PIDs
    const { stdout } = await execFileAsync('lsof', ['-p', pids.join(','), '-Fn'], {
      timeout: 5000
    })

    // Parse lsof output: lines starting with 'p' = PID, 'n' = filename
    let currentPid: number | null = null
    for (const line of stdout.split('\n')) {
      if (line.startsWith('p')) {
        currentPid = parseInt(line.slice(1), 10)
      } else if (line.startsWith('n') && currentPid !== null) {
        const filepath = line.slice(1)
        // Match: .../session-state/<uuid>/session.db
        const match = filepath.match(/session-state\/([0-9a-f-]{36})\/session\.db/)
        if (match) {
          const sessionId = match[1]
          const proc = processes.find((p) => p.pid === currentPid)
          if (proc) {
            proc.sessionId = sessionId
          }
        }
      }
    }
  } catch {
    // lsof may fail (permissions, process exited, etc.)
  }
}
