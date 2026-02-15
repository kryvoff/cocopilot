import { z } from 'zod'

// Base event envelope — every event must have these fields
export const BaseEventSchema = z.object({
  type: z.string(),
  id: z.string(),
  timestamp: z.string(),
  parentId: z.string().nullable().optional(),
  ephemeral: z.boolean().optional(),
  data: z.record(z.unknown()).optional().default({})
})

export type BaseEvent = z.infer<typeof BaseEventSchema>

// --- Known event data schemas (all use passthrough for forward-compat) ---

export const SessionStartDataSchema = z
  .object({
    sessionId: z.string().optional(),
    copilotVersion: z.string().optional(),
    startTime: z.number().optional(),
    context: z
      .object({
        cwd: z.string().optional(),
        gitRoot: z.string().optional(),
        repository: z.string().optional(),
        branch: z.string().optional()
      })
      .passthrough()
      .optional()
  })
  .passthrough()

export const SessionShutdownDataSchema = z
  .object({
    totalPremiumRequests: z.number().optional(),
    totalApiDurationMs: z.number().optional(),
    sessionStartTime: z.number().optional(),
    codeChanges: z
      .object({
        linesAdded: z.number().optional(),
        linesRemoved: z.number().optional(),
        filesModified: z.array(z.string()).optional()
      })
      .passthrough()
      .optional(),
    modelMetrics: z.record(z.unknown()).optional()
  })
  .passthrough()

export const UserMessageDataSchema = z
  .object({
    content: z.string().optional(),
    agentMode: z.enum(['interactive', 'plan', 'autopilot', 'shell']).optional(),
    attachments: z.array(z.unknown()).optional()
  })
  .passthrough()

export const AssistantUsageDataSchema = z
  .object({
    model: z.string().optional(),
    inputTokens: z.number().optional(),
    outputTokens: z.number().optional(),
    cacheReadTokens: z.number().optional(),
    cacheWriteTokens: z.number().optional(),
    cost: z.number().optional(),
    duration: z.number().optional(),
    quotaSnapshots: z.record(z.unknown()).optional()
  })
  .passthrough()

export const ToolExecutionStartDataSchema = z
  .object({
    toolCallId: z.string().optional(),
    toolName: z.string().optional(),
    arguments: z.record(z.unknown()).optional(),
    mcpServerName: z.string().optional()
  })
  .passthrough()

export const ToolExecutionCompleteDataSchema = z
  .object({
    toolCallId: z.string().optional(),
    success: z.boolean().optional(),
    result: z.unknown().optional(),
    error: z.unknown().optional(),
    toolTelemetry: z.record(z.unknown()).optional()
  })
  .passthrough()

export const SubagentStartedDataSchema = z
  .object({
    toolCallId: z.string().optional(),
    agentName: z.string().optional(),
    agentDisplayName: z.string().optional(),
    agentDescription: z.string().optional()
  })
  .passthrough()

export const AssistantTurnDataSchema = z
  .object({
    turnId: z.string().optional()
  })
  .passthrough()

export const SessionErrorDataSchema = z
  .object({
    errorType: z.string().optional(),
    message: z.string().optional(),
    stack: z.string().optional(),
    statusCode: z.number().optional()
  })
  .passthrough()

// Registry of known event types → their data schemas
export const KNOWN_EVENT_SCHEMAS: Record<string, z.ZodTypeAny> = {
  'session.start': SessionStartDataSchema,
  'session.resume': SessionStartDataSchema,
  'session.shutdown': SessionShutdownDataSchema,
  'session.error': SessionErrorDataSchema,
  'session.idle': z.object({}).passthrough(),
  'session.info': z.object({ infoType: z.string().optional(), message: z.string().optional() }).passthrough(),
  'session.warning': z.object({ warningType: z.string().optional(), message: z.string().optional() }).passthrough(),
  'session.model_change': z
    .object({ previousModel: z.string().optional(), newModel: z.string().optional() })
    .passthrough(),
  'session.title_changed': z.object({ title: z.string().optional() }).passthrough(),
  'session.context_changed': z
    .object({
      cwd: z.string().optional(),
      gitRoot: z.string().optional(),
      repository: z.string().optional(),
      branch: z.string().optional()
    })
    .passthrough(),
  'session.truncation': z.object({}).passthrough(),
  'session.snapshot_rewind': z.object({}).passthrough(),
  'session.usage_info': z.object({}).passthrough(),
  'session.compaction_start': z.object({}).passthrough(),
  'session.compaction_complete': z.object({}).passthrough(),
  'session.handoff': z.object({}).passthrough(),
  'user.message': UserMessageDataSchema,
  'assistant.turn_start': AssistantTurnDataSchema,
  'assistant.turn_end': AssistantTurnDataSchema,
  'assistant.intent': z.object({ intent: z.string().optional() }).passthrough(),
  'assistant.reasoning': z.object({}).passthrough(),
  'assistant.reasoning_delta': z.object({}).passthrough(),
  'assistant.message': z.object({}).passthrough(),
  'assistant.message_delta': z.object({}).passthrough(),
  'assistant.usage': AssistantUsageDataSchema,
  'pending_messages.modified': z.object({}).passthrough(),
  abort: z.object({ reason: z.string().optional() }).passthrough(),
  'tool.user_requested': ToolExecutionStartDataSchema,
  'tool.execution_start': ToolExecutionStartDataSchema,
  'tool.execution_partial_result': z.object({}).passthrough(),
  'tool.execution_progress': z.object({}).passthrough(),
  'tool.execution_complete': ToolExecutionCompleteDataSchema,
  'subagent.started': SubagentStartedDataSchema,
  'subagent.completed': z.object({}).passthrough(),
  'subagent.failed': z.object({}).passthrough(),
  'subagent.selected': z.object({}).passthrough(),
  'skill.invoked': z.object({}).passthrough(),
  'hook.start': z.object({}).passthrough(),
  'hook.end': z.object({}).passthrough(),
  'system.message': z.object({}).passthrough()
}

// Parsed event with validation metadata
export interface ParsedEvent {
  type: string
  id: string
  timestamp: string
  parentId: string | null
  ephemeral: boolean
  data: Record<string, unknown>
  /** Whether the event type has a known schema */
  knownType: boolean
}

// App-level types
export type AppMode = 'vanilla' | 'island' | 'learn' | 'ocean'

export interface AppSettings {
  defaultMode: AppMode
  audioEnabled: boolean
  audioVolume: number
  copilotConfigDir: string
  showOverlay: boolean
  theme: 'auto' | 'dark' | 'light'
  minimizeToTray: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  defaultMode: 'vanilla',
  audioEnabled: false,
  audioVolume: 0.5,
  copilotConfigDir: '~/.copilot',
  showOverlay: true,
  theme: 'auto',
  minimizeToTray: true
}

export interface SessionInfo {
  id: string
  cwd: string
  gitRoot?: string
  repository?: string
  branch?: string
  copilotVersion?: string
  status: 'active' | 'idle' | 'completed' | 'error'
  startTime: string
  endTime?: string
  eventCount: number
  summary?: string
}

export interface SchemaCompatibility {
  copilotVersion: string | null
  knownEventTypes: string[]
  unknownEventTypes: string[]
  lastChecked: string
}
