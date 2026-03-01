import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import type { GlobalStats, AchievementDef } from '../../shared/types'

// ---------------------------------------------------------------------------
// Achievement definitions
// ---------------------------------------------------------------------------

interface AchievementInternal {
  id: string
  name: string
  description: string
  condition: (stats: GlobalStats) => boolean
}

const ACHIEVEMENTS: AchievementInternal[] = [
  {
    id: 'hello-world',
    name: 'Hello World',
    description: 'First session detected',
    condition: (stats) => stats.totalSessions >= 1
  },
  {
    id: 'tool-master',
    name: 'Tool Master',
    description: '100 tool calls',
    condition: (stats) => stats.totalToolCalls >= 100
  },
  {
    id: 'deep-focus',
    name: 'Deep Focus',
    description: '1 hour continuous session',
    condition: (stats) => stats.longestSessionMs >= 3600000
  },
  {
    id: 'shell-master',
    name: 'Shell Master',
    description: '100 Bash calls',
    condition: (stats) => stats.totalBashCalls >= 100
  },
  {
    id: 'bookworm',
    name: 'Bookworm',
    description: '50 file reads',
    condition: (stats) => stats.totalReadOps >= 50
  },
  {
    id: 'prolific',
    name: 'Prolific Writer',
    description: '50 write operations',
    condition: (stats) => stats.totalWriteOps >= 50
  },
  {
    id: 'multitasker',
    name: 'Multitasker',
    description: '3 concurrent sessions',
    condition: (stats) => stats.maxConcurrentSessions >= 3
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Session after midnight',
    condition: (stats) => stats.hadNightSession
  }
]

const SAVE_DEBOUNCE_MS = 5000

function defaultStats(): GlobalStats {
  return {
    totalSessions: 0,
    totalToolCalls: 0,
    totalWriteOps: 0,
    totalReadOps: 0,
    totalBashCalls: 0,
    longestSessionMs: 0,
    maxConcurrentSessions: 0,
    hadNightSession: false,
    achievementsUnlocked: []
  }
}

// Write-related tool names
const WRITE_TOOLS = new Set(['Edit', 'Write', 'NotebookEdit', 'TodoWrite'])
// Read-related tool names
const READ_TOOLS = new Set(['Read', 'Grep', 'Glob'])

export class StatsStore {
  private filePath: string
  private stats: GlobalStats
  private saveTimer: ReturnType<typeof setTimeout> | null = null
  private dirty = false
  private activeSessions = new Set<string>()
  private sessionStartTimes = new Map<string, number>()

  constructor() {
    this.filePath = join(app.getPath('userData'), 'stats.json')
    this.stats = this.loadFromDisk()
  }

  /** Record a tool call and return any newly unlocked achievement IDs */
  recordToolCall(toolName: string): AchievementInternal[] {
    this.stats.totalToolCalls++

    if (WRITE_TOOLS.has(toolName)) {
      this.stats.totalWriteOps++
    }
    if (READ_TOOLS.has(toolName)) {
      this.stats.totalReadOps++
    }
    if (toolName === 'Bash') {
      this.stats.totalBashCalls++
    }

    this.markDirty()
    return this.checkAchievements()
  }

  /** Record a new session and return any newly unlocked achievement IDs */
  recordSession(sessionId: string): AchievementInternal[] {
    if (this.activeSessions.has(sessionId)) return []

    this.activeSessions.add(sessionId)
    this.sessionStartTimes.set(sessionId, Date.now())
    this.stats.totalSessions++

    // Track max concurrent sessions
    if (this.activeSessions.size > this.stats.maxConcurrentSessions) {
      this.stats.maxConcurrentSessions = this.activeSessions.size
    }

    // Check for night owl (session started between midnight and 5am)
    const hour = new Date().getHours()
    if (hour >= 0 && hour < 5) {
      this.stats.hadNightSession = true
    }

    this.markDirty()
    return this.checkAchievements()
  }

  /** Record that a session has ended, update longest session if needed */
  endSession(sessionId: string): void {
    this.activeSessions.delete(sessionId)
    const startTime = this.sessionStartTimes.get(sessionId)
    if (startTime) {
      const duration = Date.now() - startTime
      if (duration > this.stats.longestSessionMs) {
        this.stats.longestSessionMs = duration
      }
      this.sessionStartTimes.delete(sessionId)
    }
    this.markDirty()
  }

  /** Get the current global stats */
  getStats(): GlobalStats {
    return { ...this.stats }
  }

  /** Get all achievement definitions (for display in UI) */
  getAchievements(): AchievementDef[] {
    return ACHIEVEMENTS.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description
    }))
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

  private checkAchievements(): AchievementInternal[] {
    const newlyUnlocked: AchievementInternal[] = []

    for (const achievement of ACHIEVEMENTS) {
      if (this.stats.achievementsUnlocked.includes(achievement.id)) continue
      if (achievement.condition(this.stats)) {
        this.stats.achievementsUnlocked.push(achievement.id)
        newlyUnlocked.push(achievement)
      }
    }

    if (newlyUnlocked.length > 0) {
      this.markDirty()
    }

    return newlyUnlocked
  }

  private markDirty(): void {
    this.dirty = true
    if (!this.saveTimer) {
      this.saveTimer = setTimeout(() => {
        this.saveToDisk()
        this.saveTimer = null
      }, SAVE_DEBOUNCE_MS)
    }
  }

  private loadFromDisk(): GlobalStats {
    try {
      if (!existsSync(this.filePath)) {
        console.log('[StatsStore] No stats file found, starting fresh')
        return defaultStats()
      }

      const raw = readFileSync(this.filePath, 'utf-8')
      const data = JSON.parse(raw)

      // Merge with defaults to handle newly added fields
      const stats = { ...defaultStats(), ...data }
      console.log('[StatsStore] Loaded stats, total sessions:', stats.totalSessions)
      return stats
    } catch (err) {
      console.error('[StatsStore] Failed to load stats:', err)
      return defaultStats()
    }
  }

  private saveToDisk(): void {
    try {
      writeFileSync(this.filePath, JSON.stringify(this.stats, null, 2), 'utf-8')
      this.dirty = false
      console.log('[StatsStore] Saved stats')
    } catch (err) {
      console.error('[StatsStore] Failed to save:', err)
    }
  }
}
