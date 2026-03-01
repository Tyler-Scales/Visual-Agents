export type ActivityType =
  | 'writing'
  | 'reading'
  | 'running'
  | 'searching'
  | 'thinking'
  | 'waiting'
  | 'idle'
  | 'celebrating'

export interface SessionInfo {
  sessionId: string
  projectName: string
  title: string
  source: 'claude-code' | 'claude-desktop'
  isActive: boolean
  lastActivityAt: number
  cwd: string
}

export interface ActivityUpdate {
  sessionId: string
  activityType: ActivityType
  toolName?: string
  filePath?: string
  timestamp: number
}

export interface SubagentInfo {
  parentSessionId: string
  agentId: string
  slug: string
}

export interface ErrorInfo {
  id: string
  message: string
  source: string
  timestamp: number
}

export interface SessionStats {
  startedAt: number
  toolCallCount: number
  toolBreakdown: Record<string, number> // toolName -> count
  lastToolName?: string
  lastFilePath?: string
}

// ---------------------------------------------------------------------------
// Session History — persistence types for session timeline tracking
// ---------------------------------------------------------------------------

export interface SessionHistoryActivity {
  type: ActivityType
  timestamp: number
  toolName?: string
}

export interface SessionHistoryEntry {
  sessionId: string
  projectName: string
  source: 'claude-code' | 'claude-desktop'
  startedAt: number
  endedAt?: number
  activities: SessionHistoryActivity[]
}

// ---------------------------------------------------------------------------
// Global Stats & Achievements
// ---------------------------------------------------------------------------

export interface GlobalStats {
  totalSessions: number
  totalToolCalls: number
  totalWriteOps: number
  totalReadOps: number
  totalBashCalls: number
  longestSessionMs: number
  maxConcurrentSessions: number
  hadNightSession: boolean
  achievementsUnlocked: string[]
}

export interface AchievementDef {
  id: string
  name: string
  description: string
}

export interface AchievementUnlockEvent {
  id: string
  name: string
  description: string
}

// ---------------------------------------------------------------------------
// IPC Channel Map — single source of truth for channel <-> payload types
// ---------------------------------------------------------------------------

export interface IpcChannelMap {
  // Main -> Renderer (one-way sends)
  'session-activity': ActivityUpdate
  'session-spawned': SessionInfo
  'session-ended': string
  'subagent-spawned': SubagentInfo
  'error': ErrorInfo
  'achievement-unlocked': AchievementUnlockEvent

  // Renderer -> Main (invoke/handle)
  'get-sessions': SessionInfo[]
  'toggle-fullscreen': void
  'get-session-stats': SessionStats | null
  'get-session-history': SessionHistoryEntry[]
  'get-session-timeline': SessionHistoryEntry | null
  'get-global-stats': GlobalStats
  'get-achievements': AchievementDef[]
}

// ---------------------------------------------------------------------------
// ElectronAPI — the renderer-visible API surface exposed via contextBridge
// ---------------------------------------------------------------------------

export interface ElectronAPI {
  getSessions(): Promise<SessionInfo[]>
  onSessionActivity(callback: (update: ActivityUpdate) => void): () => void
  onSessionSpawned(callback: (session: SessionInfo) => void): () => void
  onSessionEnded(callback: (sessionId: string) => void): () => void
  onSubagentSpawned(callback: (info: SubagentInfo) => void): () => void
  onError(callback: (error: ErrorInfo) => void): () => void
  toggleFullscreen(): Promise<void>

  // Phase 5: Session stats
  getSessionStats(sessionId: string): Promise<SessionStats | null>

  // Phase 5: Session history & timeline
  getSessionHistory(): Promise<SessionHistoryEntry[]>
  getSessionTimeline(sessionId: string): Promise<SessionHistoryEntry | null>

  // Phase 5: Achievements & global stats
  getGlobalStats(): Promise<GlobalStats>
  getAchievements(): Promise<AchievementDef[]>
  onAchievementUnlocked(callback: (event: AchievementUnlockEvent) => void): () => void
}
