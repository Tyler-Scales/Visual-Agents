import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronAPI, IpcChannelMap } from '../shared/types'

/**
 * Creates a typed IPC listener that subscribes to a channel and returns
 * an unsubscribe function. Eliminates manual `as` casts for every listener.
 */
function createListener<C extends keyof IpcChannelMap>(
  channel: C,
  callback: (payload: IpcChannelMap[C]) => void
): () => void {
  const handler = (_event: Electron.IpcRendererEvent, payload: IpcChannelMap[C]) => {
    callback(payload)
  }
  ipcRenderer.on(channel, handler)
  return () => ipcRenderer.removeListener(channel, handler)
}

const api: ElectronAPI = {
  getSessions: () => ipcRenderer.invoke('get-sessions'),

  onSessionActivity: (callback) => createListener('session-activity', callback),

  onSessionSpawned: (callback) => createListener('session-spawned', callback),

  onSessionEnded: (callback) => createListener('session-ended', callback),

  onSubagentSpawned: (callback) => createListener('subagent-spawned', callback),

  onError: (callback) => createListener('error', callback),

  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),

  // Phase 5: Session stats
  getSessionStats: (sessionId) => ipcRenderer.invoke('get-session-stats', sessionId),

  // Phase 5: Session history & timeline
  getSessionHistory: () => ipcRenderer.invoke('get-session-history'),
  getSessionTimeline: (sessionId) => ipcRenderer.invoke('get-session-timeline', sessionId),

  // Phase 5: Achievements & global stats
  getGlobalStats: () => ipcRenderer.invoke('get-global-stats'),
  getAchievements: () => ipcRenderer.invoke('get-achievements'),
  onAchievementUnlocked: (callback) => createListener('achievement-unlocked', callback)
}

contextBridge.exposeInMainWorld('api', api)
