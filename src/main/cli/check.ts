#!/usr/bin/env node
/**
 * cocopilot check — inspect ~/.copilot/session-state/ and report schema compatibility.
 * Standalone CLI script, no Electron dependency.
 */
import fs from 'fs'
import path from 'path'

import { DEFAULT_COPILOT_DIR, SESSION_STATE_DIR, EVENTS_FILE } from '@shared/config'
import { KNOWN_EVENT_SCHEMAS } from '@shared/events'
import { parseEventsContent } from '../monitoring/event-parser'

interface CheckResult {
  sessionsFound: number
  totalEvents: number
  copilotVersions: Set<string>
  knownTypes: Set<string>
  unknownTypes: Set<string>
}

function runCheck(): void {
  const sessionStateDir = path.join(DEFAULT_COPILOT_DIR, SESSION_STATE_DIR)

  console.log('🐵 Cocopilot Schema Check')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log()

  // Check if directory exists
  if (!fs.existsSync(sessionStateDir)) {
    console.log(`Directory not found: ${sessionStateDir}`)
    console.log('No Copilot CLI session data to check.')
    process.exit(0)
  }

  // List session directories
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(sessionStateDir, { withFileTypes: true })
  } catch (err) {
    console.error(`Cannot read directory: ${sessionStateDir}`)
    console.error((err as Error).message)
    process.exit(1)
  }

  const sessionDirs = entries.filter((e) => e.isDirectory())

  if (sessionDirs.length === 0) {
    console.log('Sessions found: 0')
    console.log('No session data to analyze.')
    process.exit(0)
  }

  const result: CheckResult = {
    sessionsFound: 0,
    totalEvents: 0,
    copilotVersions: new Set(),
    knownTypes: new Set(),
    unknownTypes: new Set()
  }

  for (const dir of sessionDirs) {
    const eventsPath = path.join(sessionStateDir, dir.name, EVENTS_FILE)
    if (!fs.existsSync(eventsPath)) continue

    result.sessionsFound++

    let content: string
    try {
      content = fs.readFileSync(eventsPath, 'utf-8')
    } catch {
      // Skip unreadable files (permission errors, etc.)
      continue
    }

    const events = parseEventsContent(content)
    result.totalEvents += events.length

    for (const event of events) {
      if (event.knownType) {
        result.knownTypes.add(event.type)
      } else {
        result.unknownTypes.add(event.type)
      }

      // Extract copilot version from session.start events
      if (
        (event.type === 'session.start' || event.type === 'session.resume') &&
        event.data?.copilotVersion
      ) {
        result.copilotVersions.add(event.data.copilotVersion as string)
      }
    }
  }

  // Format output
  console.log(`Sessions found: ${result.sessionsFound.toLocaleString()}`)
  console.log(`Total events:   ${result.totalEvents.toLocaleString()}`)
  console.log()

  if (result.copilotVersions.size > 0) {
    console.log(`Copilot version(s): ${[...result.copilotVersions].sort().join(', ')}`)
  } else {
    console.log('Copilot version(s): unknown')
  }

  const knownSchemaCount = Object.keys(KNOWN_EVENT_SCHEMAS).length
  console.log(`Known event types:  ${knownSchemaCount} (${result.knownTypes.size} seen)`)

  const unknownCount = result.unknownTypes.size
  console.log(`Unknown event types: ${unknownCount}`)

  if (unknownCount > 0) {
    for (const t of [...result.unknownTypes].sort()) {
      console.log(`  ⚠ ${t}`)
    }
  }

  console.log()
  if (unknownCount === 0) {
    console.log('Verdict: ✅ Compatible')
  } else {
    console.log(`Verdict: ⚠ ${unknownCount} unknown event type${unknownCount > 1 ? 's' : ''} detected`)
  }
}

runCheck()
