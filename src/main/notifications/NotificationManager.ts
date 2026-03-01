import { Notification } from 'electron'

const COOLDOWN_MS = 30_000 // 30 seconds per session

export class NotificationManager {
  private lastNotifiedAt = new Map<string, number>()

  /**
   * Show an OS notification for a session, respecting the 30-second cooldown.
   * Silently does nothing if Notification is not supported or cooldown hasn't elapsed.
   */
  notify(sessionId: string, title: string, body: string): void {
    // Check if Notification API is supported
    if (!Notification.isSupported()) return

    // Enforce per-session cooldown
    const now = Date.now()
    const lastTime = this.lastNotifiedAt.get(sessionId) ?? 0
    if (now - lastTime < COOLDOWN_MS) return

    this.lastNotifiedAt.set(sessionId, now)

    const notification = new Notification({
      title,
      body,
      silent: false
    })

    notification.show()
  }

  /** Remove tracking for a session that has ended. */
  removeSession(sessionId: string): void {
    this.lastNotifiedAt.delete(sessionId)
  }
}
