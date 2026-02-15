import { BaseEventSchema, KNOWN_EVENT_SCHEMAS, type ParsedEvent } from '@shared/events'

export interface SchemaTracker {
  unknownTypes: Set<string>
  recordUnknownType(type: string): void
  getCompatibility(): { knownTypes: string[]; unknownTypes: string[] }
}

const schemaTracker: SchemaTracker = {
  unknownTypes: new Set<string>(),

  recordUnknownType(type: string): void {
    if (!this.unknownTypes.has(type)) {
      this.unknownTypes.add(type)
      console.warn(`[EventParser] Unknown event type: "${type}"`)
    }
  },

  getCompatibility() {
    return {
      knownTypes: Object.keys(KNOWN_EVENT_SCHEMAS),
      unknownTypes: [...this.unknownTypes]
    }
  }
}

/**
 * Parse a single line from events.jsonl into a typed event.
 * Uses Zod safeParse — never throws on malformed input.
 */
export function parseEventLine(line: string): ParsedEvent | null {
  const trimmed = line.trim()
  if (!trimmed) return null

  let json: unknown
  try {
    json = JSON.parse(trimmed)
  } catch {
    console.warn('[EventParser] Invalid JSON line:', trimmed.slice(0, 100))
    return null
  }

  const baseResult = BaseEventSchema.safeParse(json)
  if (!baseResult.success) {
    console.warn('[EventParser] Event missing required fields:', baseResult.error.issues)
    return null
  }

  const event = baseResult.data
  const dataSchema = KNOWN_EVENT_SCHEMAS[event.type]

  if (dataSchema) {
    const dataResult = dataSchema.safeParse(event.data)
    if (dataResult.success) {
      event.data = dataResult.data as Record<string, unknown>
    }
    // If data validation fails, we still keep the raw data — just log
  } else {
    schemaTracker.recordUnknownType(event.type)
  }

  return {
    type: event.type,
    id: event.id,
    timestamp: event.timestamp,
    parentId: event.parentId ?? null,
    ephemeral: event.ephemeral ?? false,
    data: event.data,
    knownType: !!dataSchema
  }
}

/**
 * Parse multiple lines from events.jsonl content.
 */
export function parseEventsContent(content: string): ParsedEvent[] {
  return content
    .split('\n')
    .map(parseEventLine)
    .filter((e): e is ParsedEvent => e !== null)
}

export { schemaTracker }
