// IPC channel names shared between main and renderer
export const IPC_CHANNELS = {
  // Monitoring
  MONITORING_STATE: 'monitoring:state',
  MONITORING_EVENT: 'monitoring:event',
  MONITORING_SESSION_UPDATE: 'monitoring:session-update',
  MONITORING_PROCESSES: 'monitoring:processes',

  // Session
  SESSION_SELECT: 'session:select',
  SESSION_LIST: 'session:list',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',

  // App
  APP_MODE_CHANGE: 'app:mode-change',

  // Schema compatibility
  SCHEMA_COMPATIBILITY: 'schema:compatibility'
} as const
