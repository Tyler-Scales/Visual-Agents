import { watch, type FSWatcher } from 'chokidar'
import { open, stat } from 'fs/promises'

export interface JsonlEvent {
  type: string
  timestamp?: string
  sessionId?: string
  uuid?: string
  parentUuid?: string | null
  message?: {
    role: string
    content: unknown
    model?: string
  }
  subtype?: string
  operation?: string
  content?: string
  data?: Record<string, unknown>
  [key: string]: unknown
}

type EventCallback = (filePath: string, event: JsonlEvent) => void

export class JsonlWatcher {
  private fileOffsets = new Map<string, number>()
  private watchers: FSWatcher[] = []
  private callback: EventCallback

  constructor(callback: EventCallback) {
    this.callback = callback
  }

  /** Start watching a single JSONL file, tailing new lines only */
  async watchFile(filePath: string): Promise<void> {
    try {
      const stats = await stat(filePath)
      this.fileOffsets.set(filePath, stats.size)
    } catch {
      this.fileOffsets.set(filePath, 0)
    }

    const watcher = watch(filePath, {
      persistent: true,
      usePolling: true,
      interval: 500
    })

    watcher.on('change', async () => {
      await this.readNewLines(filePath)
    })

    this.watchers.push(watcher)
  }

  /**
   * Watch a directory for new/changed .jsonl files.
   * NOTE: chokidar v4 does NOT support glob patterns — we watch
   * the directory itself and filter for .jsonl in the handlers.
   */
  watchDirectory(dirPath: string): void {
    const watcher = watch(dirPath, {
      persistent: true,
      usePolling: true,
      interval: 500,
      ignoreInitial: false
    })

    watcher.on('add', async (filePath) => {
      if (!filePath.endsWith('.jsonl')) return

      // New file appeared - start tailing from end
      try {
        const stats = await stat(filePath)
        this.fileOffsets.set(filePath, stats.size)
        console.log('[JsonlWatcher] Tracking file:', filePath.slice(-60), 'offset:', stats.size)
      } catch {
        this.fileOffsets.set(filePath, 0)
      }
    })

    watcher.on('change', async (filePath) => {
      if (!filePath.endsWith('.jsonl')) return
      console.log('[JsonlWatcher] File changed:', filePath.slice(-60))
      await this.readNewLines(filePath)
    })

    this.watchers.push(watcher)
  }

  /** Read only newly appended bytes from the file using byte offsets */
  private async readNewLines(filePath: string): Promise<void> {
    const offset = this.fileOffsets.get(filePath) ?? 0

    try {
      const fileHandle = await open(filePath, 'r')
      try {
        const stats = await fileHandle.stat()
        if (stats.size <= offset) return

        const bytesToRead = stats.size - offset
        const buffer = Buffer.alloc(bytesToRead)
        await fileHandle.read(buffer, 0, bytesToRead, offset)
        this.fileOffsets.set(filePath, stats.size)

        const newContent = buffer.toString('utf-8')
        if (!newContent.trim()) return

        const lines = newContent.split('\n').filter((l) => l.trim())
        for (const line of lines) {
          try {
            const event = JSON.parse(line) as JsonlEvent
            this.callback(filePath, event)
          } catch {
            // Skip malformed lines
          }
        }
      } finally {
        await fileHandle.close()
      }
    } catch {
      // File may have been deleted or is inaccessible
    }
  }

  async close(): Promise<void> {
    for (const watcher of this.watchers) {
      await watcher.close()
    }
    this.watchers = []
    this.fileOffsets.clear()
  }
}
