import type { BrowserWindow } from 'electron'
import type { SessionInfo } from '../../shared/types'
import { ClaudeCodeDiscovery } from './ClaudeCodeDiscovery'
import { ClaudeDesktopDiscovery } from './ClaudeDesktopDiscovery'
import { JsonlWatcher, type JsonlEvent } from '../watchers/JsonlWatcher'
import { ActivityDetector } from '../watchers/ActivityDetector'
import { SubagentWatcher } from '../watchers/SubagentWatcher'
import { IpcHandlers } from '../ipc/IpcHandlers'
import { SessionStore } from '../storage/SessionStore'
import { StatsStore } from '../stats/StatsStore'
import { NotificationManager } from '../notifications/NotificationManager'

const POLL_INTERVAL_MS = 10000 // 10 seconds

let errorCounter = 0

function createErrorId(): string {
  errorCounter++
  return `err-${Date.now()}-${errorCounter}`
}

export class SessionManager {
  private sessions = new Map<string, SessionInfo>()
  private codeDiscovery: ClaudeCodeDiscovery
  private desktopDiscovery: ClaudeDesktopDiscovery
  private jsonlWatcher: JsonlWatcher
  private activityDetector: ActivityDetector
  private subagentWatcher: SubagentWatcher
  private notificationManager: NotificationManager
  private ipc: IpcHandlers
  private sessionStore: SessionStore
  private statsStore: StatsStore
  private pollTimer: ReturnType<typeof setInterval> | null = null
  private timeoutTimer: ReturnType<typeof setInterval> | null = null
  /** Maps sessionId -> project directory name (for finding subagent dirs) */
  private sessionProjectDirs = new Map<string, string>()

  constructor(win: BrowserWindow) {
    this.codeDiscovery = new ClaudeCodeDiscovery()
    this.desktopDiscovery = new ClaudeDesktopDiscovery()
    this.activityDetector = new ActivityDetector()
    this.subagentWatcher = new SubagentWatcher()
    this.notificationManager = new NotificationManager()
    this.sessionStore = new SessionStore()
    this.statsStore = new StatsStore()

    this.jsonlWatcher = new JsonlWatcher((filePath, event) => {
      this.onJsonlEvent(filePath, event)
    })

    this.ipc = new IpcHandlers(win, {
      getSessionsFn: () => this.getActiveSessions(),
      getSessionStatsFn: (sessionId) => this.activityDetector.getStats(sessionId),
      getSessionHistoryFn: () => this.sessionStore.getHistory(),
      getSessionTimelineFn: (sessionId) => this.sessionStore.getTimeline(sessionId),
      getGlobalStatsFn: () => this.statsStore.getStats(),
      getAchievementsFn: () => this.statsStore.getAchievements()
    })
  }

  async initialize(): Promise<void> {
    this.ipc.register()

    // Initial discovery
    try {
      await this.discoverAll()
      console.log('[SessionManager] Discovered sessions:', [...this.sessions.keys()])
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[SessionManager] Discovery failed:', message)
      this.ipc.sendError({
        id: createErrorId(),
        message: `Session discovery failed: ${message}`,
        source: 'SessionManager',
        timestamp: Date.now()
      })
    }

    // Watch the Claude Code projects directory for new JSONL files
    try {
      const watchDir = this.codeDiscovery.getProjectsDir()
      console.log('[SessionManager] Watching directory:', watchDir)
      this.jsonlWatcher.watchDirectory(watchDir)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[SessionManager] Watch failed:', message)
      this.ipc.sendError({
        id: createErrorId(),
        message: `File watcher failed: ${message}`,
        source: 'SessionManager',
        timestamp: Date.now()
      })
    }

    // Periodic poll for new sessions and stale session cleanup
    this.pollTimer = setInterval(() => this.pollForChanges(), POLL_INTERVAL_MS)

    // Check for idle/waiting timeouts every 5 seconds
    this.timeoutTimer = setInterval(() => {
      const updates = this.activityDetector.checkTimeouts()
      for (const update of updates) {
        this.ipc.sendActivityUpdate(update)
      }
    }, 5000)
  }

  private async discoverAll(): Promise<void> {
    const [codeSessions, desktopSessions] = await Promise.all([
      this.codeDiscovery.discoverSessions(),
      this.desktopDiscovery.discoverSessions()
    ])

    const allSessions = [...codeSessions, ...desktopSessions]

    for (const session of allSessions) {
      if (!this.sessions.has(session.sessionId)) {
        this.sessions.set(session.sessionId, session)
        this.ipc.sendSessionSpawned(session)

        // Phase 5: Track in session store and stats
        this.sessionStore.startSession(session)
        const newAchievements = this.statsStore.recordSession(session.sessionId)
        this.emitAchievements(newAchievements)
      }
    }
  }

  private async pollForChanges(): Promise<void> {
    try {
      const [codeSessions, desktopSessions] = await Promise.all([
        this.codeDiscovery.discoverSessions(),
        this.desktopDiscovery.discoverSessions()
      ])

      const currentIds = new Set<string>()
      const allSessions = [...codeSessions, ...desktopSessions]

      // Detect new sessions
      for (const session of allSessions) {
        currentIds.add(session.sessionId)
        if (!this.sessions.has(session.sessionId)) {
          this.sessions.set(session.sessionId, session)
          this.ipc.sendSessionSpawned(session)

          // Phase 5: Track in session store and stats
          this.sessionStore.startSession(session)
          const newAchievements = this.statsStore.recordSession(session.sessionId)
          this.emitAchievements(newAchievements)
        }
      }

      // Detect ended sessions (not seen in discovery anymore)
      for (const [sessionId] of this.sessions) {
        if (!currentIds.has(sessionId)) {
          this.sessions.delete(sessionId)
          this.activityDetector.removeSession(sessionId)
          this.ipc.sendSessionEnded(sessionId)

          // Phase 5: End session in stores
          this.sessionStore.endSession(sessionId)
          this.statsStore.endSession(sessionId)
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[SessionManager] Poll failed:', message)
      this.ipc.sendError({
        id: createErrorId(),
        message: `Session poll failed: ${message}`,
        source: 'SessionManager',
        timestamp: Date.now()
      })
    }
  }

  private onJsonlEvent(filePath: string, event: JsonlEvent): void {
    // Prefer sessionId from file path (matches discovery) over event field
    const sessionId = this.extractSessionIdFromPath(filePath) || event.sessionId
    if (!sessionId) return

    console.log('[SessionManager] JSONL event:', event.type, 'session:', sessionId.slice(0, 8))

    const update = this.activityDetector.processEvent(sessionId, event)
    if (update) {
      console.log('[SessionManager] Activity update:', update.activityType, 'tool:', update.toolName)
      this.ipc.sendActivityUpdate(update)

      // Phase 5: Record activity in session store
      this.sessionStore.recordActivity(sessionId, update.activityType, update.toolName)

      // Phase 5: Record tool call in stats store if it has a tool name
      if (update.toolName) {
        const newAchievements = this.statsStore.recordToolCall(update.toolName)
        this.emitAchievements(newAchievements)
      }
    }
  }

  /** Send achievement unlock events to the renderer */
  private emitAchievements(achievements: { id: string; name: string; description: string }[]): void {
    for (const achievement of achievements) {
      console.log('[SessionManager] Achievement unlocked:', achievement.name)
      this.ipc.sendAchievementUnlocked({
        id: achievement.id,
        name: achievement.name,
        description: achievement.description
      })
    }
  }

  private extractSessionIdFromPath(filePath: string): string | null {
    // Path format: ~/.claude/projects/{project}/{sessionId}.jsonl
    const match = filePath.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/)
    return match ? match[1] : null
  }

  private getActiveSessions(): SessionInfo[] {
    return Array.from(this.sessions.values())
  }

  async shutdown(): Promise<void> {
    if (this.pollTimer) clearInterval(this.pollTimer)
    if (this.timeoutTimer) clearInterval(this.timeoutTimer)

    // Flush stores before closing
    this.sessionStore.flush()
    this.statsStore.flush()

    await this.jsonlWatcher.close()
    await this.subagentWatcher.close()
  }
}
