import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ProcessMonitor } from '../../../src/main/monitoring/process-monitor'

describe('ProcessMonitor', () => {
  let monitor: ProcessMonitor

  beforeEach(() => {
    monitor = new ProcessMonitor()
  })

  afterEach(() => {
    monitor.stop()
  })

  it('starts with empty processes', () => {
    expect(monitor.processes).toEqual([])
  })

  it('emits processes-updated on poll', async () => {
    const handler = vi.fn()
    monitor.on('processes-updated', handler)
    monitor.start()

    // Wait for initial poll
    await new Promise((resolve) => setTimeout(resolve, 1000))

    expect(handler).toHaveBeenCalled()
    const processes = handler.mock.calls[0][0]
    expect(Array.isArray(processes)).toBe(true)
  })

  it('stops polling when stop is called', () => {
    monitor.start()
    monitor.stop()
    // Should not throw
    monitor.stop()
  })

  it('does not start twice', () => {
    monitor.start()
    monitor.start() // should be no-op
    monitor.stop()
  })

  it('processes array is updated after poll', async () => {
    monitor.start()
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Should have an array (may be empty if no copilot processes running)
    expect(Array.isArray(monitor.processes)).toBe(true)
  })

  it('detects running copilot processes if any', async () => {
    monitor.start()
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // We can't guarantee copilot is running in test, but verify structure
    for (const proc of monitor.processes) {
      expect(proc).toHaveProperty('pid')
      expect(proc).toHaveProperty('cpu')
      expect(proc).toHaveProperty('rssKb')
      expect(proc).toHaveProperty('threads')
      expect(proc).toHaveProperty('command')
      expect(proc).toHaveProperty('elapsed')
      expect(proc).toHaveProperty('sessionId')
      expect(typeof proc.pid).toBe('number')
      expect(typeof proc.cpu).toBe('number')
      expect(typeof proc.rssKb).toBe('number')
      expect(proc.command).toContain('copilot')
    }
  })
})

describe('SessionStore.updateProcesses', () => {
  it('marks session active when process is found', async () => {
    const { SessionStore } = await import('../../../src/main/monitoring/session-store')
    const store = new SessionStore()
    store.addSession('test-session-1', '/tmp/test1')

    // Manually mark as completed
    const session = store.getSession('test-session-1')!
    session.status = 'completed'

    // Simulate process found for this session
    store.updateProcesses([
      {
        pid: 12345,
        cpu: 5.0,
        rssKb: 100000,
        threads: 10,
        command: 'copilot',
        elapsed: '00:05:00',
        sessionId: 'test-session-1'
      }
    ])

    expect(store.getSession('test-session-1')!.status).toBe('active')
    expect(store.getSession('test-session-1')!.pid).toBe(12345)
  })

  it('marks session completed when process disappears', async () => {
    const { SessionStore } = await import('../../../src/main/monitoring/session-store')
    const store = new SessionStore()
    store.addSession('test-session-2', '/tmp/test2')

    // First: set PID
    const session = store.getSession('test-session-2')!
    session.pid = 99999

    // Then: no processes running
    store.updateProcesses([])

    expect(store.getSession('test-session-2')!.status).toBe('completed')
    expect(store.getSession('test-session-2')!.pid).toBeUndefined()
  })

  it('emits processes-updated event', async () => {
    const { SessionStore } = await import('../../../src/main/monitoring/session-store')
    const store = new SessionStore()
    const handler = vi.fn()
    store.on('processes-updated', handler)

    store.updateProcesses([])

    expect(handler).toHaveBeenCalledWith([])
  })
})
