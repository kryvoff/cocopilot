import os from 'os'
import path from 'path'

export const DEFAULT_COPILOT_DIR = path.join(os.homedir(), '.copilot')
export const SESSION_STATE_DIR = 'session-state'
export const EVENTS_FILE = 'events.jsonl'
export const WORKSPACE_FILE = 'workspace.yaml'
export const DEBUG_SERVER_PORT = 9876
export const PROCESS_POLL_INTERVAL_MS = 5000
