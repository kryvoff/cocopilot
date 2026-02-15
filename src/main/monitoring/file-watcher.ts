import { watch, type FSWatcher } from 'chokidar'
import { readFile, stat } from 'fs/promises'
import path from 'path'
import { EventEmitter } from 'events'
import { DEFAULT_COPILOT_DIR, SESSION_STATE_DIR, EVENTS_FILE } from '@shared/config'
import type { ParsedEvent } from '@shared/events'
import { parseEventLine } from './event-parser'

export interface FileWatcherEvents {
  event: [sessionId: string, event: ParsedEvent]
  'session-discovered': [sessionId: string, dir: string]
  error: [error: Error]
}

export class FileWatcher extends EventEmitter<FileWatcherEvents> {
  private watcher: FSWatcher | null = null
  private fileOffsets = new Map<string, number>()
  private copilotDir: string

  constructor(copilotDir?: string) {
    super()
    this.copilotDir = copilotDir ?? DEFAULT_COPILOT_DIR
  }

  async start(): Promise<void> {
    const sessionDir = path.join(this.copilotDir, SESSION_STATE_DIR)

    try {
      await stat(sessionDir)
    } catch {
      console.warn(`[FileWatcher] Session directory not found: ${sessionDir}`)
      return
    }

    this.watcher = watch(sessionDir, {
      depth: 2,
      ignoreInitial: false,
      awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
      ignorePermissionErrors: true
    })

    this.watcher.on('add', (filepath) => this.onFileAdded(filepath))
    this.watcher.on('addDir', (dirpath) => this.onDirAdded(dirpath))
    this.watcher.on('change', (filepath) => this.onFileChanged(filepath))
    this.watcher.on('error', (error) => this.emit('error', error as Error))

    console.log(`[FileWatcher] Watching: ${sessionDir}`)
  }

  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close()
      this.watcher = null
    }
    this.fileOffsets.clear()
  }

  private async onFileAdded(filepath: string): Promise<void> {
    if (!filepath.endsWith(EVENTS_FILE)) return

    const sessionId = this.extractSessionId(filepath)
    if (sessionId) {
      this.emit('session-discovered', sessionId, path.dirname(filepath))
    }

    // Read entire file for initial load
    await this.readNewEvents(filepath)
  }

  private onDirAdded(dirpath: string): void {
    // Detect new session directories: .../session-state/<uuid>/
    const dirName = path.basename(dirpath)
    // UUID pattern
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(dirName)) {
      this.emit('session-discovered', dirName, dirpath)
    }
  }

  private async onFileChanged(filepath: string): Promise<void> {
    if (!filepath.endsWith(EVENTS_FILE)) return
    await this.readNewEvents(filepath)
  }

  private async readNewEvents(filepath: string): Promise<void> {
    try {
      const content = await readFile(filepath, 'utf-8')
      const offset = this.fileOffsets.get(filepath) ?? 0
      const newContent = content.slice(offset)
      this.fileOffsets.set(filepath, content.length)

      if (!newContent.trim()) return

      const sessionId = this.extractSessionId(filepath)
      if (!sessionId) return

      const lines = newContent.split('\n')
      for (const line of lines) {
        const event = parseEventLine(line)
        if (event) {
          this.emit('event', sessionId, event)
        }
      }
    } catch (error) {
      this.emit('error', error as Error)
    }
  }

  private extractSessionId(filepath: string): string | null {
    // filepath: .../session-state/<uuid>/events.jsonl
    const parts = filepath.split(path.sep)
    const eventsIdx = parts.indexOf(EVENTS_FILE)
    if (eventsIdx > 0) {
      return parts[eventsIdx - 1]
    }
    return null
  }
}
