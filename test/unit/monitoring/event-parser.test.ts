import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { parseEventLine, parseEventsContent, schemaTracker } from '../../../src/main/monitoring/event-parser'

const fixturesDir = resolve(__dirname, '../../fixtures/events')

function loadFixture(name: string): string {
  return readFileSync(resolve(fixturesDir, name), 'utf-8')
}

describe('parseEventLine', () => {
  it('returns null for empty lines', () => {
    expect(parseEventLine('')).toBeNull()
    expect(parseEventLine('  ')).toBeNull()
  })

  it('returns null for invalid JSON', () => {
    expect(parseEventLine('this is not json')).toBeNull()
  })

  it('returns null for JSON missing required fields', () => {
    expect(parseEventLine('{"totally_wrong": true}')).toBeNull()
  })

  it('parses a valid session.start event', () => {
    const line = '{"type":"session.start","id":"evt-001","timestamp":"2026-02-15T08:00:00.000Z","parentId":null,"data":{"sessionId":"test-session-1","copilotVersion":"0.0.410","startTime":1739606400000,"context":{"cwd":"/test","gitRoot":"/test","repository":"test/repo","branch":"main"}}}'
    const event = parseEventLine(line)

    expect(event).not.toBeNull()
    expect(event!.type).toBe('session.start')
    expect(event!.id).toBe('evt-001')
    expect(event!.knownType).toBe(true)
    expect(event!.data.copilotVersion).toBe('0.0.410')
  })

  it('parses unknown event types without crashing', () => {
    const line = '{"type":"future.new_event","id":"evt-999","timestamp":"2026-02-15T10:00:00.000Z","data":{"someNewField":"hello"}}'
    const event = parseEventLine(line)

    expect(event).not.toBeNull()
    expect(event!.type).toBe('future.new_event')
    expect(event!.knownType).toBe(false)
    expect(event!.data.someNewField).toBe('hello')
  })

  it('preserves extra fields via passthrough', () => {
    const line = '{"type":"user.message","id":"evt-100","timestamp":"2026-02-15T08:00:00.000Z","data":{"content":"test","agentMode":"interactive","brandNewField":"surprise"}}'
    const event = parseEventLine(line)

    expect(event).not.toBeNull()
    expect(event!.data.content).toBe('test')
    expect(event!.data.brandNewField).toBe('surprise')
    expect(event!.knownType).toBe(true)
  })

  it('handles ephemeral events', () => {
    const line = '{"type":"assistant.usage","id":"evt-200","timestamp":"2026-02-15T08:00:00.000Z","ephemeral":true,"data":{"model":"claude-sonnet-4.5","inputTokens":5000}}'
    const event = parseEventLine(line)

    expect(event).not.toBeNull()
    expect(event!.ephemeral).toBe(true)
    expect(event!.data.model).toBe('claude-sonnet-4.5')
  })

  it('parses session.shutdown with complex nested data', () => {
    const line = '{"type":"session.shutdown","id":"evt-300","timestamp":"2026-02-15T08:00:00.000Z","ephemeral":true,"data":{"totalPremiumRequests":5,"totalApiDurationMs":45000,"codeChanges":{"linesAdded":150,"linesRemoved":30,"filesModified":["src/app.ts"]}}}'
    const event = parseEventLine(line)

    expect(event).not.toBeNull()
    expect(event!.data.totalPremiumRequests).toBe(5)
    const codeChanges = event!.data.codeChanges as Record<string, unknown>
    expect(codeChanges.linesAdded).toBe(150)
  })
})

describe('parseEventsContent', () => {
  it('parses simple-session.jsonl fixture', () => {
    const content = loadFixture('simple-session.jsonl')
    const events = parseEventsContent(content)

    expect(events.length).toBe(8)
    expect(events[0].type).toBe('session.start')
    expect(events[events.length - 1].type).toBe('session.shutdown')
    expect(events.every((e) => e.knownType)).toBe(true)
  })

  it('parses multi-tool-session.jsonl fixture', () => {
    const content = loadFixture('multi-tool-session.jsonl')
    const events = parseEventsContent(content)

    expect(events.length).toBe(10)
    const toolStarts = events.filter((e) => e.type === 'tool.execution_start')
    expect(toolStarts.length).toBe(2)
    const subagents = events.filter((e) => e.type === 'subagent.started')
    expect(subagents.length).toBe(1)
  })

  it('handles malformed and unknown events gracefully', () => {
    const content = loadFixture('malformed-and-unknown.jsonl')
    const events = parseEventsContent(content)

    // Should parse: session.start, future.new_event, user.message (3 valid events)
    // Should skip: "this is not json", {"totally_wrong": true}, empty line
    expect(events.length).toBe(3)

    const unknown = events.find((e) => e.type === 'future.new_event')
    expect(unknown).toBeDefined()
    expect(unknown!.knownType).toBe(false)
  })
})

describe('schemaTracker', () => {
  beforeEach(() => {
    schemaTracker.unknownTypes.clear()
  })

  it('tracks unknown event types', () => {
    parseEventLine('{"type":"brand.new.type","id":"x","timestamp":"2026-01-01T00:00:00Z","data":{}}')
    const compat = schemaTracker.getCompatibility()

    expect(compat.unknownTypes).toContain('brand.new.type')
    expect(compat.knownTypes.length).toBeGreaterThan(30)
  })

  it('deduplicates unknown types', () => {
    parseEventLine('{"type":"repeat.type","id":"x1","timestamp":"2026-01-01T00:00:00Z","data":{}}')
    parseEventLine('{"type":"repeat.type","id":"x2","timestamp":"2026-01-01T00:00:00Z","data":{}}')
    const compat = schemaTracker.getCompatibility()

    expect(compat.unknownTypes.filter((t) => t === 'repeat.type').length).toBe(1)
  })
})
