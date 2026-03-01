import { describe, it, expect } from 'vitest'
import { ActivityDetector } from '../main/watchers/ActivityDetector'
import type { JsonlEvent } from '../main/watchers/JsonlWatcher'

function toolUseEvent(toolName: string, input?: Record<string, unknown>): JsonlEvent {
  return {
    type: 'assistant',
    message: {
      role: 'assistant',
      content: [{ type: 'tool_use', name: toolName, input: input ?? {} }]
    }
  }
}

describe('ActivityDetector', () => {
  it('maps Edit tool to writing activity', () => {
    const detector = new ActivityDetector()
    const result = detector.processEvent('session-1', toolUseEvent('Edit'))
    expect(result).not.toBeNull()
    expect(result!.activityType).toBe('writing')
    expect(result!.toolName).toBe('Edit')
  })

  it('maps Read tool to reading activity', () => {
    const detector = new ActivityDetector()
    const result = detector.processEvent('session-1', toolUseEvent('Read'))
    expect(result).not.toBeNull()
    expect(result!.activityType).toBe('reading')
  })

  it('maps Bash tool to running activity', () => {
    const detector = new ActivityDetector()
    const result = detector.processEvent('session-1', toolUseEvent('Bash'))
    expect(result).not.toBeNull()
    expect(result!.activityType).toBe('running')
  })

  it('maps Grep/Glob to reading', () => {
    const detector = new ActivityDetector()

    const r1 = detector.processEvent('s1', toolUseEvent('Grep'))
    expect(r1?.activityType).toBe('reading')

    const r2 = detector.processEvent('s1', toolUseEvent('Glob'))
    expect(r2?.activityType).toBe('reading')
  })

  it('maps user messages to thinking', () => {
    const detector = new ActivityDetector()
    const result = detector.processEvent('s1', { type: 'user' })
    expect(result?.activityType).toBe('thinking')
  })

  it('extracts file path from Edit tool input', () => {
    const detector = new ActivityDetector()
    const result = detector.processEvent('s1', toolUseEvent('Edit', { file_path: '/src/app.tsx' }))
    expect(result).not.toBeNull()
    expect(result!.filePath).toBe('/src/app.tsx')
  })

  it('extracts file path from Grep tool input', () => {
    const detector = new ActivityDetector()
    const result = detector.processEvent('s1', toolUseEvent('Grep', { path: '/src/' }))
    expect(result).not.toBeNull()
    expect(result!.filePath).toBe('/src/')
  })

  it('tracks stats per session', () => {
    const detector = new ActivityDetector()

    detector.processEvent('s1', toolUseEvent('Edit'))
    detector.processEvent('s1', toolUseEvent('Edit'))
    detector.processEvent('s1', toolUseEvent('Read'))

    const stats = detector.getStats('s1')
    expect(stats).not.toBeNull()
    expect(stats!.toolCallCount).toBe(3)
    expect(stats!.toolBreakdown['Edit']).toBe(2)
    expect(stats!.toolBreakdown['Read']).toBe(1)
  })

  it('removeSession clears state', () => {
    const detector = new ActivityDetector()
    detector.processEvent('s1', toolUseEvent('Edit'))
    detector.removeSession('s1')
    expect(detector.getStats('s1')).toBeNull()
  })

  it('detects celebration from git commit output', () => {
    const detector = new ActivityDetector()
    const result = detector.processEvent('s1', {
      type: 'result',
      content: '[main abc1234] Fix the bug\n 2 files changed, 10 insertions(+)'
    })
    expect(result).not.toBeNull()
    expect(result!.activityType).toBe('celebrating')
  })

  it('detects celebration from test pass output', () => {
    const detector = new ActivityDetector()
    const result = detector.processEvent('s1', {
      type: 'result',
      content: 'Tests: 42 passed, 42 total'
    })
    // The regex looks for 'tests? passed' pattern
    expect(result).not.toBeNull()
    expect(result!.activityType).toBe('celebrating')
  })
})
