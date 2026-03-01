import { watch, type FSWatcher } from 'chokidar'
import { readFile } from 'fs/promises'
import { basename } from 'path'
import type { SubagentInfo } from '../../shared/types'

type SubagentCallback = (info: SubagentInfo) => void

export class SubagentWatcher {
  private watchers: FSWatcher[] = []
  private knownAgents = new Set<string>()

  /**
   * Watch a session's subagents directory for new agent JSONL files.
   * Directory path: ~/.claude/projects/{project}/{sessionId}/subagents/
   */
  watchSubagents(subagentDir: string, parentSessionId: string, onSpawn: SubagentCallback): void {
    const watcher = watch(`${subagentDir}/agent-*.jsonl`, {
      persistent: true,
      usePolling: true,
      interval: 2000,
      ignoreInitial: false
    })

    watcher.on('add', async (filePath) => {
      const filename = basename(filePath, '.jsonl')
      const agentId = filename.replace('agent-', '')

      if (this.knownAgents.has(agentId)) return
      this.knownAgents.add(agentId)

      // Try to read slug from first lines of the file
      let slug = agentId
      try {
        const content = await readFile(filePath, 'utf-8')
        const firstLine = content.split('\n')[0]
        if (firstLine) {
          const parsed = JSON.parse(firstLine)
          if (parsed.slug) slug = parsed.slug
          else if (parsed.agentId) slug = parsed.agentId
        }
      } catch {
        // Use agentId as slug fallback
      }

      onSpawn({
        parentSessionId,
        agentId,
        slug
      })
    })

    this.watchers.push(watcher)
  }

  async close(): Promise<void> {
    for (const watcher of this.watchers) {
      await watcher.close()
    }
    this.watchers = []
    this.knownAgents.clear()
  }
}
