import { readdir, stat } from 'fs/promises'
import { join, basename } from 'path'
import { homedir } from 'os'
import type { SessionInfo } from '../../shared/types'

const ACTIVE_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes

export class ClaudeCodeDiscovery {
  private claudeDir: string

  constructor() {
    this.claudeDir = join(homedir(), '.claude', 'projects')
  }

  async discoverSessions(): Promise<SessionInfo[]> {
    const sessions: SessionInfo[] = []

    try {
      const projectDirs = await readdir(this.claudeDir, { withFileTypes: true })

      for (const dir of projectDirs) {
        if (!dir.isDirectory()) continue

        const projectPath = join(this.claudeDir, dir.name)
        const projectName = this.decodeProjectName(dir.name)

        try {
          const files = await readdir(projectPath)
          for (const file of files) {
            if (!file.endsWith('.jsonl')) continue

            const filePath = join(projectPath, file)
            const sessionId = basename(file, '.jsonl')

            try {
              const fileStat = await stat(filePath)
              const isActive = Date.now() - fileStat.mtimeMs < ACTIVE_THRESHOLD_MS

              if (isActive) {
                sessions.push({
                  sessionId,
                  projectName,
                  title: projectName,
                  source: 'claude-code',
                  isActive: true,
                  lastActivityAt: fileStat.mtimeMs,
                  cwd: projectName
                })
              }
            } catch {
              // Skip inaccessible files
            }
          }
        } catch {
          // Skip inaccessible directories
        }
      }
    } catch {
      // Claude dir might not exist
    }

    return sessions
  }

  /** Get the JSONL file path for a session */
  getJsonlPath(projectDirName: string, sessionId: string): string {
    return join(this.claudeDir, projectDirName, `${sessionId}.jsonl`)
  }

  /** Get the subagents directory for a session */
  getSubagentDir(projectDirName: string, sessionId: string): string {
    return join(this.claudeDir, projectDirName, sessionId, 'subagents')
  }

  getProjectsDir(): string {
    return this.claudeDir
  }

  /**
   * Decode project name from directory format.
   * '-Users-tswallac-MyProject' -> 'MyProject'
   */
  private decodeProjectName(dirName: string): string {
    // Directory names encode the full path with dashes
    // e.g., '-Users-tswallac-Visual-Agents' -> extract the last meaningful segment
    const parts = dirName.split('-').filter(Boolean)

    // Skip 'Users' and username, take the rest
    if (parts.length >= 3 && parts[0] === 'Users') {
      return parts.slice(2).join('-')
    }

    return dirName
  }
}
