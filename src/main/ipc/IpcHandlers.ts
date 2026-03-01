import { ipcMain, type BrowserWindow } from 'electron'
import type {
  SessionInfo,
  SessionStats,
  ActivityUpdate,
  SubagentInfo,
  ErrorInfo,
  IpcChannelMap,
  SessionHistoryEntry,
  GlobalStats,
  AchievementDef,
  AchievementUnlockEvent
} from '../../shared/types'

export interface IpcDependencies {
  getSessionsFn: () => SessionInfo[]
  getSessionStatsFn: (sessionId: string) => SessionStats | null
  getSessionHistoryFn: () => SessionHistoryEntry[]
  getSessionTimelineFn: (sessionId: string) => SessionHistoryEntry | null
  getGlobalStatsFn: () => GlobalStats
  getAchievementsFn: () => AchievementDef[]
}

export class IpcHandlers {
  private win: BrowserWindow
  private deps: IpcDependencies

  constructor(win: BrowserWindow, deps: IpcDependencies) {
    this.win = win
    this.deps = deps
  }

  register(): void {
    ipcMain.handle('get-sessions', () => {
      return this.deps.getSessionsFn()
    })

    ipcMain.handle('get-session-stats', (_event, sessionId: string) => {
      return this.deps.getSessionStatsFn(sessionId)
    })

    ipcMain.handle('get-session-history', () => {
      return this.deps.getSessionHistoryFn()
    })

    ipcMain.handle('get-session-timeline', (_event, sessionId: string) => {
      return this.deps.getSessionTimelineFn(sessionId)
    })

    ipcMain.handle('get-global-stats', () => {
      return this.deps.getGlobalStatsFn()
    })

    ipcMain.handle('get-achievements', () => {
      return this.deps.getAchievementsFn()
    })
  }

  /**
   * Type-safe send to the renderer process.
   * Ensures the channel string and payload type always match.
   */
  send<C extends keyof IpcChannelMap>(channel: C, payload: IpcChannelMap[C]): void {
    if (!this.win.isDestroyed()) {
      this.win.webContents.send(channel, payload)
    }
  }

  sendActivityUpdate(update: ActivityUpdate): void {
    this.send('session-activity', update)
  }

  sendSessionSpawned(session: SessionInfo): void {
    this.send('session-spawned', session)
  }

  sendSessionEnded(sessionId: string): void {
    this.send('session-ended', sessionId)
  }

  sendSubagentSpawned(info: SubagentInfo): void {
    this.send('subagent-spawned', info)
  }

  sendError(error: ErrorInfo): void {
    this.send('error', error)
  }

  sendAchievementUnlocked(achievement: AchievementUnlockEvent): void {
    this.send('achievement-unlocked', achievement)
  }
}
