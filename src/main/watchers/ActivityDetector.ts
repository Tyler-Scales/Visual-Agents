import type { ActivityType, ActivityUpdate, SessionStats } from '../../shared/types'
import type { JsonlEvent } from './JsonlWatcher'

/** Map Claude Code tool names to visual activity types */
const TOOL_ACTIVITY_MAP: Record<string, ActivityType> = {
  // Writing tools
  Edit: 'writing',
  Write: 'writing',
  NotebookEdit: 'writing',
  TodoWrite: 'writing',
  // Reading tools
  Read: 'reading',
  Grep: 'reading',
  Glob: 'reading',
  // Search tools
  WebFetch: 'searching',
  WebSearch: 'searching',
  // Execution tools
  Bash: 'running',
  Task: 'running',
  // Common tools that should show thinking
  AskUserQuestion: 'waiting',
  EnterPlanMode: 'thinking',
  ExitPlanMode: 'thinking',
  Skill: 'running',
}

/** Tools that carry a file path in their input arguments */
const FILE_PATH_TOOLS = new Set(['Edit', 'Read', 'Write', 'Grep', 'Glob'])

interface SessionState {
  lastActivityType: ActivityType
  lastActivityAt: number
  lastUserMessageAt: number
  isWaiting: boolean
  // Phase 5: stats tracking
  startedAt: number
  toolCallCount: number
  toolBreakdown: Record<string, number>
  lastToolName?: string
  lastFilePath?: string
}

/** Detect celebration-worthy output patterns in tool results */
function isCelebrationTrigger(text: string): boolean {
  // Git commit patterns
  if (/\[(main|master|dev|develop|feature\/|fix\/|release\/)\s+[a-f0-9]{7,}]/.test(text)) return true
  if (/create mode \d+/.test(text)) return true
  if (/files? changed/.test(text)) return true
  if (/insertions?\(\+\)/.test(text)) return true
  if (/deletions?\(-\)/.test(text)) return true

  // Test pass patterns
  if (/tests?\s+passed/i.test(text)) return true
  if (/\bPASS\b/.test(text)) return true
  if (/all tests passed/i.test(text)) return true
  if (/\u2713/.test(text)) return true // checkmark character
  if (/tests?:\s*\d+\s+passed/i.test(text)) return true
  if (/\d+\s+passing/i.test(text)) return true

  return false
}

/** Extract a file path from a tool_use input block */
function extractFilePath(toolName: string, input: unknown): string | undefined {
  if (!FILE_PATH_TOOLS.has(toolName)) return undefined
  if (typeof input !== 'object' || input === null) return undefined

  const obj = input as Record<string, unknown>

  // Edit, Read, Write use file_path
  if (typeof obj.file_path === 'string') return obj.file_path
  // Grep / Glob may use path
  if (typeof obj.path === 'string') return obj.path

  return undefined
}

export class ActivityDetector {
  private sessions = new Map<string, SessionState>()
  private idleTimeoutMs = 60000 // 60 seconds

  processEvent(sessionId: string, event: JsonlEvent): ActivityUpdate | null {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        lastActivityType: 'idle',
        lastActivityAt: Date.now(),
        lastUserMessageAt: 0,
        isWaiting: false,
        startedAt: Date.now(),
        toolCallCount: 0,
        toolBreakdown: {}
      })
    }

    const state = this.sessions.get(sessionId)!
    const now = Date.now()

    // User message -> agent is about to think/respond
    if (event.type === 'user') {
      state.lastUserMessageAt = now
      state.isWaiting = false
      state.lastActivityType = 'thinking'
      state.lastActivityAt = now
      return {
        sessionId,
        activityType: 'thinking',
        timestamp: now
      }
    }

    // Assistant message with tool_use
    if (event.type === 'assistant' && event.message?.content) {
      state.isWaiting = false
      const content = event.message.content

      if (Array.isArray(content)) {
        // Look for tool_use blocks
        for (const block of content) {
          if (typeof block === 'object' && block !== null && 'type' in block) {
            const b = block as { type: string; name?: string; input?: unknown }
            if (b.type === 'tool_use' && b.name) {
              const activityType = TOOL_ACTIVITY_MAP[b.name] || 'thinking'
              state.lastActivityType = activityType
              state.lastActivityAt = now

              // Phase 5: track stats
              state.toolCallCount++
              state.toolBreakdown[b.name] = (state.toolBreakdown[b.name] || 0) + 1
              state.lastToolName = b.name

              const filePath = extractFilePath(b.name, b.input)
              if (filePath) {
                state.lastFilePath = filePath
              }

              return {
                sessionId,
                activityType,
                toolName: b.name,
                filePath,
                timestamp: now
              }
            }
          }
        }

        // Text-only assistant response (thinking/responding)
        const hasText = content.some(
          (block: unknown) =>
            typeof block === 'object' && block !== null && 'type' in block && (block as { type: string }).type === 'text'
        )
        if (hasText) {
          state.lastActivityType = 'thinking'
          state.lastActivityAt = now
          return {
            sessionId,
            activityType: 'thinking',
            timestamp: now
          }
        }
      }
    }

    // Result events (tool results coming back) - check for celebration triggers
    if (event.type === 'result') {
      state.lastActivityAt = now

      // Check if the result content triggers a celebration
      const resultText = extractResultText(event)
      if (resultText && isCelebrationTrigger(resultText)) {
        state.lastActivityType = 'celebrating'
        return {
          sessionId,
          activityType: 'celebrating',
          timestamp: now
        }
      }

      return null
    }

    // Queue operation
    if (event.type === 'queue-operation' && event.operation === 'enqueue') {
      state.lastUserMessageAt = now
      state.lastActivityType = 'thinking'
      state.lastActivityAt = now
      return {
        sessionId,
        activityType: 'thinking',
        timestamp: now
      }
    }

    return null
  }

  /** Check all sessions for idle/waiting timeouts */
  checkTimeouts(): ActivityUpdate[] {
    const updates: ActivityUpdate[] = []
    const now = Date.now()

    for (const [sessionId, state] of this.sessions) {
      const timeSinceActivity = now - state.lastActivityAt

      // If no activity for a long time, go idle
      if (timeSinceActivity > this.idleTimeoutMs && state.lastActivityType !== 'idle') {
        state.lastActivityType = 'idle'
        updates.push({
          sessionId,
          activityType: 'idle',
          timestamp: now
        })
      }
    }

    return updates
  }

  /** Get stats for a specific session */
  getStats(sessionId: string): SessionStats | null {
    const state = this.sessions.get(sessionId)
    if (!state) return null

    return {
      startedAt: state.startedAt,
      toolCallCount: state.toolCallCount,
      toolBreakdown: { ...state.toolBreakdown },
      lastToolName: state.lastToolName,
      lastFilePath: state.lastFilePath
    }
  }

  removeSession(sessionId: string): void {
    this.sessions.delete(sessionId)
  }
}

/** Extract text content from a result event for celebration detection */
function extractResultText(event: JsonlEvent): string | null {
  // Result events may have content as a string
  if (typeof event.content === 'string') return event.content

  // Or may have message.content
  if (event.message?.content) {
    const content = event.message.content
    if (typeof content === 'string') return content
    if (Array.isArray(content)) {
      const texts: string[] = []
      for (const block of content) {
        if (typeof block === 'string') {
          texts.push(block)
        } else if (typeof block === 'object' && block !== null && 'type' in block) {
          const b = block as { type: string; text?: string }
          if (b.type === 'text' && typeof b.text === 'string') {
            texts.push(b.text)
          }
        }
      }
      if (texts.length > 0) return texts.join('\n')
    }
  }

  // Check data field
  if (event.data) {
    const d = event.data
    if (typeof d.result === 'string') return d.result
    if (typeof d.output === 'string') return d.output
    if (typeof d.stdout === 'string') return d.stdout
  }

  return null
}
