import { readdir, readFile, stat } from 'fs/promises'
import { join } from 'path'
import { homedir } from 'os'
import type { SessionInfo } from '../../shared/types'

const ACTIVE_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes

interface DesktopSessionMeta {
  cliSessionId?: string
  title?: string
  lastActivityAt?: string
  isArchived?: boolean
  cwd?: string
  model?: string
}

export class ClaudeDesktopDiscovery {
  private appSupportDir: string

  constructor() {
    this.appSupportDir = join(
      homedir(),
      'Library',
      'Application Support',
      'Claude'
    )
  }

  async discoverSessions(): Promise<SessionInfo[]> {
    const sessions: SessionInfo[] = []

    try {
      // Scan claude-code-sessions for session metadata JSON files
      const sessionsBaseDir = join(this.appSupportDir, 'claude-code-sessions')
      const accountDirs = await this.safeReaddir(sessionsBaseDir)

      for (const accountDir of accountDirs) {
        const accountPath = join(sessionsBaseDir, accountDir)
        const orgDirs = await this.safeReaddir(accountPath)

        for (const orgDir of orgDirs) {
          const orgPath = join(accountPath, orgDir)
          const sessionFiles = await this.safeReaddir(orgPath)

          for (const file of sessionFiles) {
            if (!file.endsWith('.json')) continue

            try {
              const filePath = join(orgPath, file)
              const content = await readFile(filePath, 'utf-8')
              const meta: DesktopSessionMeta = JSON.parse(content)

              if (meta.isArchived) continue

              // Check if recently active
              const lastActivity = meta.lastActivityAt
                ? new Date(meta.lastActivityAt).getTime()
                : 0
              if (Date.now() - lastActivity > ACTIVE_THRESHOLD_MS) continue

              const sessionId = meta.cliSessionId || file.replace('.json', '').replace('local_', '')
              const title = meta.title || 'Claude Desktop'

              sessions.push({
                sessionId,
                projectName: title,
                title,
                source: 'claude-desktop',
                isActive: true,
                lastActivityAt: lastActivity,
                cwd: meta.cwd || ''
              })
            } catch {
              // Skip malformed files
            }
          }
        }
      }
    } catch {
      // App support dir structure might not exist
    }

    return sessions
  }

  /**
   * Find the JSONL transcript path for a Desktop session.
   * These are deeply nested:
   * local-agent-mode-sessions/{account}/{org}/local_{sessionId}/.claude/projects/-sessions-{slug}/{cliSessionId}.jsonl
   */
  async findTranscriptPath(sessionId: string): Promise<string | null> {
    try {
      const agentBaseDir = join(this.appSupportDir, 'local-agent-mode-sessions')
      const accountDirs = await this.safeReaddir(agentBaseDir)

      for (const accountDir of accountDirs) {
        const orgDirs = await this.safeReaddir(join(agentBaseDir, accountDir))

        for (const orgDir of orgDirs) {
          const orgPath = join(agentBaseDir, accountDir, orgDir)
          const localDirs = await this.safeReaddir(orgPath)

          for (const localDir of localDirs) {
            if (!localDir.startsWith('local_')) continue

            const projectsDir = join(orgPath, localDir, '.claude', 'projects')
            const sessionDirs = await this.safeReaddir(projectsDir)

            for (const sessionDir of sessionDirs) {
              const dirPath = join(projectsDir, sessionDir)
              const files = await this.safeReaddir(dirPath)

              for (const file of files) {
                if (file.endsWith('.jsonl') && file.includes(sessionId)) {
                  return join(dirPath, file)
                }
              }
            }
          }
        }
      }
    } catch {
      // Structure doesn't exist
    }

    return null
  }

  private async safeReaddir(dirPath: string): Promise<string[]> {
    try {
      return await readdir(dirPath)
    } catch {
      return []
    }
  }
}
