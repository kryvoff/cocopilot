import { describe, it, expect } from 'vitest'
import { mapEventToEffectType } from '../../../src/renderer/modes/island/EventEffects'

describe('mapEventToEffectType', () => {
  it('maps session.start to start', () => {
    expect(mapEventToEffectType({ type: 'session.start', data: {} })).toBe('start')
  })

  it('maps session.shutdown to end', () => {
    expect(mapEventToEffectType({ type: 'session.shutdown', data: {} })).toBe('end')
  })

  it('maps tool.execution_complete with success to success', () => {
    expect(
      mapEventToEffectType({ type: 'tool.execution_complete', data: { success: true } })
    ).toBe('success')
  })

  it('maps tool.execution_complete with failure to error', () => {
    expect(
      mapEventToEffectType({ type: 'tool.execution_complete', data: { success: false } })
    ).toBe('error')
  })

  it('maps session.error to error', () => {
    expect(mapEventToEffectType({ type: 'session.error', data: {} })).toBe('error')
  })

  it('maps user.message to info', () => {
    expect(mapEventToEffectType({ type: 'user.message', data: {} })).toBe('info')
  })

  it('maps assistant.turn_start to info', () => {
    expect(mapEventToEffectType({ type: 'assistant.turn_start', data: {} })).toBe('info')
  })

  it('maps unknown events to info', () => {
    expect(mapEventToEffectType({ type: 'foo.bar', data: {} })).toBe('info')
  })
})
