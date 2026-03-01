import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import type {
  ActivityType,
  SessionInfo,
  SessionHistoryEntry,
  SessionHistoryActivity
} from '../../shared/types'

const MAX_SESSIONS = 100
const SAVE_DEBOUNCE_MS = 5000

export class SessionStore {
  private filePath: string
  private entries: Map<string, SessionHistoryEntry> = new Map()
  private saveTimer: ReturnType<typeof setTimeout> | null = null
  private dirty = false

  constructor() {
    this.filePath = join(app.getPath('userData'), 'session-history.json')
    this.loadFromDisk()
  }

  /** Record an activity for a session */
  recordActivity(sessionId: string, activity: ActivityType, toolName?: string): void {
    const entry = this.entries.get(sessionId)
    if (!entry) return

    const act: SessionHistoryActivity = {
      type: activity,
      timestamp: Date.now()
    }
    if (toolName) {
      act.toolName = toolName
    }

    entry.activities.push(act)
    this.markDirty()
  }

  /** Start tracking a new session */
  startSession(info: SessionInfo): void {
    if (this.entries.has(info.sessionId)) return

    const entry: SessionHistoryEntry = {
      sessionId: info.sessionId,
      projectName: info.projectName,
      source: info.source,
      startedAt: Date.now(),
      activities: []
    }

    this.entries.set(info.sessionId, entry)
    this.pruneOldest()
    this.markDirty()
  }

  /** Mark a session as ended */
  endSession(sessionId: string): void {
    const entry = this.entries.get(sessionId)
    if (!entry) return

    entry.endedAt = Date.now()
    this.markDirty()
  }

  /** Get all session history entries */
  getHistory(): SessionHistoryEntry[] {
    return Array.from(this.entries.values())
  }

  /** Get timeline for a specific session */
  getTimeline(sessionId: string): SessionHistoryEntry | null {
    return this.entries.get(sessionId) ?? null
  }

  /** Flush any pending saves immediately */
  flush(): void {
    if (this.dirty) {
      this.saveToDisk()
    }
    if (this.saveTimer) {
      clearTimeout(this.saveTimer)
      this.saveTimer = null
    }
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private markDirty(): void {
    this.dirty = true
    if (!this.saveTimer) {
      this.saveTimer = setTimeout(() => {
        this.saveToDisk()
        this.saveTimer = null
      }, SAVE_DEBOUNCE_MS)
    }
  }

  private pruneOldest(): void {
    if (this.entries.size <= MAX_SESSIONS) return

    // Sort by startedAt and remove oldest
    const sorted = Array.from(this.entries.entries()).sort(
      (a, b) => a[1].startedAt - b[1].startedAt
    )

    while (sorted.length > MAX_SESSIONS) {
      const oldest = sorted.shift()
      if (oldest) {
        this.entries.delete(oldest[0])
      }
    }
  }

  private loadFromDisk(): void {
    try {
      if (!existsSync(this.filePath)) {
        console.log('[SessionStore] No history file found, starting fresh')
        return
      }

      const raw = readFileSync(this.filePath, 'utf-8')
      const data = JSON.parse(raw)

      if (Array.isArray(data)) {
        for (const entry of data) {
          if (entry && typeof entry.sessionId === 'string') {
            this.entries.set(entry.sessionId, entry as SessionHistoryEntry)
          }
        }
        console.log('[SessionStore] Loaded', this.entries.size, 'session entries')
      }
    } catch (err) {
      console.error('[SessionStore] Failed to load history:', err)
    }
  }

  private saveToDisk(): void {
    try {
      const data = Array.from(this.entries.values())
      writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8')
      this.dirty = false
      console.log('[SessionStore] Saved', data.length, 'entries')
    } catch (err) {
      console.error('[SessionStore] Failed to save:', err)
    }
  }
}
