import React, { useMemo, useState, useEffect } from 'react'
import { useMonitoringStore } from '../store/monitoring-store'
import { useAppStore } from '../store/app-store'
import type { ParsedEvent } from '@shared/events'

type AgentState = 'active' | 'thinking' | 'tool' | 'idle' | 'error'

interface AgentStateInfo {
  state: AgentState
  label: string
  dot: string
  toolName?: string
}

function computeAgentState(events: ParsedEvent[]): AgentStateInfo {
  // Walk events in reverse to find the most recent relevant event
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i]
    switch (e.type) {
      case 'tool.execution_complete': {
        const success = e.data?.success as boolean | undefined
        if (success === false) return { state: 'error', label: 'Error', dot: '🔴' }
        return { state: 'idle', label: 'Idle', dot: '⚪' }
      }
      case 'assistant.turn_end':
        return { state: 'idle', label: 'Idle', dot: '⚪' }
      case 'tool.execution_start': {
        const name = (e.data?.toolName as string) ?? 'unknown'
        return { state: 'tool', label: `Running tool: ${name}`, dot: '🔵', toolName: name }
      }
      case 'assistant.turn_start':
        // Check if any tool started after this turn_start
        // If we got here, no tool.execution_start was found after this event
        return { state: 'thinking', label: 'Thinking', dot: '🟡' }
      case 'session.shutdown':
        return { state: 'idle', label: 'Idle', dot: '⚪' }
      case 'session.start':
        return { state: 'active', label: 'Active', dot: '🟢' }
      default:
        continue
    }
  }
  return { state: 'idle', label: 'Idle', dot: '⚪' }
}

function computeActiveToolIds(events: ParsedEvent[]): Set<string> {
  const started = new Map<string, boolean>()
  for (const e of events) {
    if (e.type === 'tool.execution_start') {
      const id = (e.data?.toolCallId as string) ?? e.id
      started.set(id, true)
    } else if (e.type === 'tool.execution_complete') {
      const id = (e.data?.toolCallId as string) ?? e.id
      started.delete(id)
    }
  }
  return new Set(started.keys())
}

function computeActiveSubAgentIds(events: ParsedEvent[]): Set<string> {
  const started = new Map<string, boolean>()
  for (const e of events) {
    if (e.type === 'subagent.started') {
      const id = (e.data?.toolCallId as string) ?? e.id
      started.set(id, true)
    } else if (e.type === 'subagent.completed' || e.type === 'subagent.failed') {
      const id = (e.data?.toolCallId as string) ?? e.id
      started.delete(id)
    }
  }
  return new Set(started.keys())
}

function computeEventRate(events: ParsedEvent[]): number {
  const now = Date.now()
  const windowMs = 60_000
  let count = 0
  for (let i = events.length - 1; i >= 0; i--) {
    const t = new Date(events[i].timestamp).getTime()
    if (isNaN(t)) continue
    if (now - t <= windowMs) count++
    else break
  }
  return count
}

function findSessionStartTime(events: ParsedEvent[]): number | null {
  for (const e of events) {
    if (e.type === 'session.start') {
      return new Date(e.timestamp).getTime()
    }
  }
  return events.length > 0 ? new Date(events[0].timestamp).getTime() : null
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}m ${s.toString().padStart(2, '0')}s`
}

function ActivityBar(): React.JSX.Element {
  const events = useMonitoringStore((s) => s.events)
  const mode = useAppStore((s) => s.mode)
  const [now, setNow] = useState(Date.now())

  // Tick every second for session duration
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const agentState = useMemo(() => computeAgentState(events), [events])
  const activeToolIds = useMemo(() => computeActiveToolIds(events), [events])
  const activeSubAgentIds = useMemo(() => computeActiveSubAgentIds(events), [events])
  const eventRate = useMemo(() => computeEventRate(events), [events])
  const sessionStart = useMemo(() => findSessionStartTime(events), [events])

  const duration = sessionStart !== null ? formatDuration(now - sessionStart) : '--'

  const isCanvas = mode === 'island' || mode === 'ocean'
  const bg = isCanvas ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.4)'

  return (
    <div
      style={{
        height: 28,
        background: bg,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 0,
        fontFamily: "'SF Mono', 'Fira Code', monospace",
        fontSize: 11,
        color: '#fff',
        userSelect: 'none'
      }}
    >
      <span>{agentState.dot} {agentState.label}</span>
      <Divider />
      <span>🐒 {activeSubAgentIds.size} agent{activeSubAgentIds.size !== 1 ? 's' : ''}</span>
      <Divider />
      <span>⚙️ {activeToolIds.size} tool{activeToolIds.size !== 1 ? 's' : ''}</span>
      <Divider />
      <span>📊 {eventRate} events/min</span>
      <Divider />
      <span>⏱️ {duration}</span>
    </div>
  )
}

function Divider(): React.JSX.Element {
  return (
    <span
      style={{
        width: 1,
        height: 14,
        background: 'rgba(255,255,255,0.25)',
        margin: '0 10px',
        flexShrink: 0
      }}
    />
  )
}

export default ActivityBar
