import { Grid, TILE_SIZE } from '../engine/Grid'
import { ParticleSystem } from '../engine/ParticleSystem'
import { Character, CharacterAppearance, createCharacter, updateCharacter } from './Character'
import { AgentState } from './CharacterState'
import { bfs } from './Pathfinding'
import {
  BREAK_ROOM_SPOTS,
  LOUNGE_SPOTS,
  SERVER_ROOM_SPOTS,
  CONFERENCE_SPOTS,
  COFFEE_BAR_SPOTS
} from '../office/OfficeLayout'
import type { ActivityType } from '../../../shared/types'
import type { SoundManager } from '../audio/SoundManager'
import type { ActivityLogEntry } from '../ui/DetailPanel'
import { IdleBehaviorManager } from './IdleBehavior'

/** Helper: extract the short filename from a full path */
function shortFile(filePath: string): string {
  const parts = filePath.replace(/\\/g, '/').split('/')
  return parts[parts.length - 1] || filePath
}

/** Truncate a string to a max length, adding ellipsis if needed */
function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max - 1) + '\u2026'
}

const BUBBLE_DURATION = 5000

const APPEARANCE_POOL: CharacterAppearance[] = [
  // Original 8
  { hairColor: '#2a1a0a', hairStyle: 'short', skinTone: '#f5d0a9', shirtColor: '#4a90d9', pantsColor: '#3a3a5a' },
  { hairColor: '#1a1010', hairStyle: 'medium', skinTone: '#c09060', shirtColor: '#d94a4a', pantsColor: '#2a2a4a' },
  { hairColor: '#f0c850', hairStyle: 'long', skinTone: '#f8dab8', shirtColor: '#4ad994', pantsColor: '#4a4a6a' },
  { hairColor: '#1a1a2a', hairStyle: 'spiky', skinTone: '#e8c090', shirtColor: '#d9b44a', pantsColor: '#3a3a4a' },
  { hairColor: '#6a3a2a', hairStyle: 'buzz', skinTone: '#a07050', shirtColor: '#9a4ad9', pantsColor: '#2a2a3a' },
  { hairColor: '#e0c0a0', hairStyle: 'short', skinTone: '#f0d8b0', shirtColor: '#d94a9a', pantsColor: '#4a4a5a' },
  { hairColor: '#4a2a1a', hairStyle: 'medium', skinTone: '#d0a878', shirtColor: '#4ad9d9', pantsColor: '#3a3a4a' },
  { hairColor: '#8a4a2a', hairStyle: 'long', skinTone: '#f5d0a9', shirtColor: '#d97a4a', pantsColor: '#2a2a4a' },
  // New styles: ponytail
  { hairColor: '#3a1a0a', hairStyle: 'ponytail', skinTone: '#f5d0a9', shirtColor: '#5a6ad9', pantsColor: '#3a3a5a', accessory: 'glasses' },
  { hairColor: '#f0a830', hairStyle: 'ponytail', skinTone: '#f8dab8', shirtColor: '#d95a8a', pantsColor: '#4a4a5a', accessory: 'headphones' },
  // bun
  { hairColor: '#1a1a1a', hairStyle: 'bun', skinTone: '#c09060', shirtColor: '#4ad9a0', pantsColor: '#2a2a4a', accessory: 'glasses' },
  { hairColor: '#8a3a1a', hairStyle: 'bun', skinTone: '#e8c090', shirtColor: '#d9d04a', pantsColor: '#3a3a4a' },
  // mohawk
  { hairColor: '#d94a4a', hairStyle: 'mohawk', skinTone: '#f0d8b0', shirtColor: '#3a3a5a', pantsColor: '#2a2a3a', accessory: 'headphones' },
  { hairColor: '#4ad9d9', hairStyle: 'mohawk', skinTone: '#a07050', shirtColor: '#5a5a7a', pantsColor: '#3a3a4a' },
  // curly
  { hairColor: '#4a2a1a', hairStyle: 'curly', skinTone: '#c09060', shirtColor: '#d97a4a', pantsColor: '#2a2a4a', accessory: 'hat' },
  { hairColor: '#2a1a0a', hairStyle: 'curly', skinTone: '#f5d0a9', shirtColor: '#4a90d9', pantsColor: '#4a4a6a' },
  // afro
  { hairColor: '#1a1010', hairStyle: 'afro', skinTone: '#a07050', shirtColor: '#d94a9a', pantsColor: '#2a2a3a', accessory: 'beanie' },
  { hairColor: '#3a2a1a', hairStyle: 'afro', skinTone: '#c09060', shirtColor: '#4ad994', pantsColor: '#3a3a4a' },
  // More accessories on classic styles
  { hairColor: '#f0c850', hairStyle: 'spiky', skinTone: '#f8dab8', shirtColor: '#9a4ad9', pantsColor: '#4a4a5a', accessory: 'hat' },
  { hairColor: '#1a1a2a', hairStyle: 'buzz', skinTone: '#e8c090', shirtColor: '#d9b44a', pantsColor: '#3a3a5a', accessory: 'beanie' },
  { hairColor: '#e0c0a0', hairStyle: 'medium', skinTone: '#f0d8b0', shirtColor: '#4ad9d9', pantsColor: '#2a2a4a', accessory: 'glasses' },
  { hairColor: '#6a3a2a', hairStyle: 'short', skinTone: '#d0a878', shirtColor: '#d94a4a', pantsColor: '#4a4a6a', accessory: 'headphones' },
  // Extra variety
  { hairColor: '#c0a060', hairStyle: 'ponytail', skinTone: '#f5d0a9', shirtColor: '#5aaa5a', pantsColor: '#3a3a4a', accessory: 'glasses' },
  { hairColor: '#1a1a1a', hairStyle: 'afro', skinTone: '#d0a878', shirtColor: '#aa5a5a', pantsColor: '#2a2a4a', accessory: 'headphones' },
]

/** Generate a random appearance for when the pool is exhausted */
function generateRandomAppearance(): CharacterAppearance {
  const hairColors = ['#1a1010', '#2a1a0a', '#4a2a1a', '#6a3a2a', '#8a4a2a', '#f0c850', '#e0c0a0', '#c0a060', '#3a1a0a', '#1a1a1a', '#d94a4a', '#4ad9d9']
  const hairStyles: CharacterAppearance['hairStyle'][] = ['short', 'medium', 'long', 'spiky', 'buzz', 'ponytail', 'bun', 'mohawk', 'curly', 'afro']
  const skinTones = ['#f5d0a9', '#f8dab8', '#f0d8b0', '#e8c090', '#d0a878', '#c09060', '#a07050']
  const shirtColors = ['#4a90d9', '#d94a4a', '#4ad994', '#d9b44a', '#9a4ad9', '#d94a9a', '#4ad9d9', '#d97a4a', '#5a6ad9', '#d95a8a', '#3a3a5a', '#5aaa5a', '#aa5a5a']
  const pantsColors = ['#3a3a5a', '#2a2a4a', '#4a4a6a', '#3a3a4a', '#2a2a3a', '#4a4a5a']
  const accessories: CharacterAppearance['accessory'][] = ['none', 'glasses', 'headphones', 'hat', 'beanie', 'none', 'none']

  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

  return {
    hairColor: pick(hairColors),
    hairStyle: pick(hairStyles),
    skinTone: pick(skinTones),
    shirtColor: pick(shirtColors),
    pantsColor: pick(pantsColors),
    accessory: pick(accessories)
  }
}

const ALL_BREAK_SPOTS = [...BREAK_ROOM_SPOTS, ...LOUNGE_SPOTS, ...COFFEE_BAR_SPOTS]

export const MAX_AGENTS = 12

const DUST_EMIT_INTERVAL = 300 // ms between dust particle emissions while walking
const ACTIVITY_LOG_MAX = 50 // max entries per session
const SUBAGENT_FOLLOW_DISTANCE = 64 // 2 tiles in pixels — subagents pathfind when farther

interface QueuedSpawn {
  sessionId: string
  name: string
  source: 'claude-code' | 'claude-desktop'
}

export class CharacterManager {
  private characters = new Map<string, Character>()
  private assignedDesks = new Set<string>()
  private colorIndex = 0
  private grid: Grid
  private entranceTile: { col: number; row: number }
  private particles: ParticleSystem | null = null
  sounds: SoundManager | null = null
  private activityLogs = new Map<string, ActivityLogEntry[]>()
  private lastTypingSoundAt = 0
  private spawnQueue: QueuedSpawn[] = []
  private celebrationTimers = new Map<string, ReturnType<typeof setTimeout>>()
  private idleBehavior: IdleBehaviorManager

  constructor(grid: Grid, entranceTile: { col: number; row: number }) {
    this.grid = grid
    this.entranceTile = entranceTile
    this.idleBehavior = new IdleBehaviorManager()
  }

  setParticles(particles: ParticleSystem): void {
    this.particles = particles
  }

  setSounds(sounds: SoundManager): void {
    this.sounds = sounds
  }

  spawnCharacter(sessionId: string, name: string, source: 'claude-code' | 'claude-desktop'): Character | null {
    if (this.characters.has(sessionId)) return this.characters.get(sessionId)!

    // If we're at the agent limit, queue the spawn for later
    if (this.characters.size >= MAX_AGENTS) {
      // Don't double-queue the same session
      if (!this.spawnQueue.some((q) => q.sessionId === sessionId)) {
        this.spawnQueue.push({ sessionId, name, source })
      }
      return null
    }

    // Spawn at entrance
    const pos = this.grid.tileToWorld(this.entranceTile.col, this.entranceTile.row)
    let appearance: CharacterAppearance
    if (this.colorIndex < APPEARANCE_POOL.length) {
      appearance = APPEARANCE_POOL[this.colorIndex]
    } else {
      appearance = generateRandomAppearance()
    }
    this.colorIndex++

    const char = createCharacter(sessionId, name, pos.x, pos.y, appearance, source)

    // Find and assign a free desk
    const desk = this.findFreeDesk()
    if (desk) {
      char.deskTile = desk
      this.assignedDesks.add(`${desk.col},${desk.row}`)

      // Pathfind to desk
      const currentTile = this.grid.worldToTile(char.x, char.y)
      const path = bfs(this.grid, currentTile, desk)
      if (path.length > 0) {
        char.path = path
        char.pathIndex = 0
        char.state = AgentState.WALKING
      }
    }

    this.characters.set(sessionId, char)
    return char
  }

  removeCharacter(sessionId: string): void {
    const char = this.characters.get(sessionId)
    if (char?.deskTile) {
      this.assignedDesks.delete(`${char.deskTile.col},${char.deskTile.row}`)
    }
    // Clear any pending celebration timer
    const celebTimer = this.celebrationTimers.get(sessionId)
    if (celebTimer) {
      clearTimeout(celebTimer)
      this.celebrationTimers.delete(sessionId)
    }
    this.idleBehavior.cleanup(sessionId)
    this.characters.delete(sessionId)
    this.activityLogs.delete(sessionId)

    // Also remove from the spawn queue if queued
    this.spawnQueue = this.spawnQueue.filter((q) => q.sessionId !== sessionId)

    // Process the queue now that a desk may have freed up
    this.processQueue()
  }

  /**
   * Spawn a subagent character near its parent at 0.7 scale.
   * Subagents don't get desks — they follow their parent character.
   */
  spawnSubagent(agentId: string, parentSessionId: string, slug: string): Character | null {
    if (this.characters.has(agentId)) return this.characters.get(agentId)!

    const parent = this.characters.get(parentSessionId)
    // Spawn near parent, or at entrance if parent not found
    const spawnX = parent ? parent.x + 16 : this.grid.tileToWorld(this.entranceTile.col, this.entranceTile.row).x
    const spawnY = parent ? parent.y + 16 : this.grid.tileToWorld(this.entranceTile.col, this.entranceTile.row).y

    let appearance: CharacterAppearance
    if (this.colorIndex < APPEARANCE_POOL.length) {
      appearance = APPEARANCE_POOL[this.colorIndex]
    } else {
      appearance = generateRandomAppearance()
    }
    this.colorIndex++

    const char = createCharacter(agentId, slug, spawnX, spawnY, appearance, 'claude-code')
    char.isSubagent = true
    char.parentId = parentSessionId
    char.scale = 0.7
    // No desk assignment for subagents

    this.characters.set(agentId, char)
    return char
  }

  /** Get the activity log for a session (most recent entries). */
  getActivityLog(sessionId: string): ActivityLogEntry[] {
    return this.activityLogs.get(sessionId) ?? []
  }

  onActivity(sessionId: string, activityType: ActivityType, toolName?: string, filePath?: string): void {
    const char = this.characters.get(sessionId)
    if (!char) return

    // --- Activity log ---
    if (!this.activityLogs.has(sessionId)) {
      this.activityLogs.set(sessionId, [])
    }
    const log = this.activityLogs.get(sessionId)!
    log.push({ activity: activityType, toolName, filePath, timestamp: Date.now() })
    if (log.length > ACTIVITY_LOG_MAX) {
      log.splice(0, log.length - ACTIVITY_LOG_MAX)
    }

    // --- Sound effects ---
    if (this.sounds) {
      if (activityType === 'writing' || activityType === 'running') {
        this.sounds.playTypingClick()
      }
      if (activityType === 'celebrating') {
        this.sounds.playChime()
      }
    }

    // === IDLE: send agent to appropriate room ===
    if (activityType === 'idle') {
      if (char.state === AgentState.WALKING) {
        char.pendingActivity = 'idle'
        return
      }
      if (!char.isOnBreak) {
        this.sendToRoom(char, 'idle')
      }
      return
    }

    // === ACTIVE: need to be at desk ===
    if (char.state === AgentState.WALKING) {
      char.pendingActivity = activityType
      // If walking to break room, redirect to desk
      if (char.isOnBreak && char.deskTile) {
        const currentTile = this.grid.worldToTile(char.x, char.y)
        const path = bfs(this.grid, currentTile, char.deskTile)
        if (path.length > 0) {
          char.path = path
          char.pathIndex = 0
        }
        char.isOnBreak = false
      }
      return
    }

    if (char.isOnBreak) {
      // On break — walk back to desk, apply activity on arrival
      char.pendingActivity = activityType
      char.isOnBreak = false
      if (char.deskTile) {
        const currentTile = this.grid.worldToTile(char.x, char.y)
        const path = bfs(this.grid, currentTile, char.deskTile)
        if (path.length > 0) {
          char.path = path
          char.pathIndex = 0
          char.state = AgentState.WALKING
        }
      }
      return
    }

    // At desk — apply activity directly with meaningful bubble text
    switch (activityType) {
      case 'writing': {
        char.state = AgentState.TYPING
        const file = filePath ? shortFile(filePath) : null
        const label = file ? `Edit ${file}` : (toolName === 'Write' ? 'Writing file' : 'Editing code')
        char.bubbleText = truncate(label, 22)
        char.bubbleTimer = BUBBLE_DURATION
        break
      }
      case 'reading': {
        char.state = AgentState.READING
        const file = filePath ? shortFile(filePath) : null
        if (toolName === 'Grep') {
          char.bubbleText = truncate(file ? `Grep ${file}` : 'Grep files', 22)
        } else if (toolName === 'Glob') {
          char.bubbleText = truncate(file ? `Glob ${file}` : 'Finding files', 22)
        } else {
          char.bubbleText = truncate(file ? `Read ${file}` : 'Reading files', 22)
        }
        char.bubbleTimer = BUBBLE_DURATION
        break
      }
      case 'running': {
        char.state = AgentState.TYPING
        if (toolName === 'Bash') {
          char.bubbleText = 'Running bash'
        } else if (toolName === 'Task') {
          char.bubbleText = 'Running task'
        } else {
          char.bubbleText = 'Running...'
        }
        char.bubbleTimer = BUBBLE_DURATION
        break
      }
      case 'searching': {
        char.state = AgentState.READING
        char.bubbleText = 'Searching...'
        char.bubbleTimer = BUBBLE_DURATION
        break
      }
      case 'thinking': {
        char.state = AgentState.THINKING
        char.bubbleText = 'Thinking...'
        char.bubbleTimer = BUBBLE_DURATION
        break
      }
      case 'waiting': {
        char.state = AgentState.WAITING
        char.bubbleText = 'Need input!'
        char.bubbleTimer = BUBBLE_DURATION
        break
      }
      case 'celebrating': {
        char.state = AgentState.CELEBRATING
        char.bubbleText = 'Done!'
        char.bubbleTimer = BUBBLE_DURATION

        // Clear any previous celebration timer for this session
        const prevTimer = this.celebrationTimers.get(sessionId)
        if (prevTimer) clearTimeout(prevTimer)

        // Auto-revert to idle after 5 seconds
        const timer = setTimeout(() => {
          this.celebrationTimers.delete(sessionId)
          const c = this.characters.get(sessionId)
          if (c && c.state === AgentState.CELEBRATING) {
            c.state = AgentState.IDLE
          }
        }, 5000)
        this.celebrationTimers.set(sessionId, timer)
        break
      }
    }
  }

  updateAll(dt: number): void {
    for (const char of this.characters.values()) {
      const wasWalking = char.state === AgentState.WALKING
      updateCharacter(char, dt)

      // Subagent follow behavior: pathfind to parent when distance > 2 tiles (64px)
      if (char.isSubagent && char.parentId) {
        const parent = this.characters.get(char.parentId)
        if (parent) {
          const dx = parent.x - char.x
          const dy = parent.y - char.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist > SUBAGENT_FOLLOW_DISTANCE && char.state !== AgentState.WALKING) {
            const currentTile = this.grid.worldToTile(char.x, char.y)
            const parentTile = this.grid.worldToTile(parent.x, parent.y)
            const path = bfs(this.grid, currentTile, parentTile)
            if (path.length > 0) {
              char.path = path
              char.pathIndex = 0
              char.state = AgentState.WALKING
            }
          }
        }
      }

      // Emit particles based on state
      if (this.particles) {
        // Confetti when celebrating
        if (char.state === AgentState.CELEBRATING) {
          this.particles.emit(char.x, char.y - 16, 'confetti', 1)
        }

        // Dust particles while walking (every ~300ms)
        if (char.state === AgentState.WALKING) {
          char.lastDustEmit += dt
          if (char.lastDustEmit >= DUST_EMIT_INTERVAL) {
            char.lastDustEmit = 0
            this.particles.emit(char.x, char.y + 4, 'dust', 2)
          }
        } else {
          char.lastDustEmit = 0
        }
      }

      // Apply pending activity once character finishes walking
      if (wasWalking && char.state === AgentState.IDLE && char.pendingActivity) {
        const pending = char.pendingActivity
        char.pendingActivity = null
        this.onActivity(char.id, pending as ActivityType)
      }
    }

    // Update idle behaviors for on-break characters
    this.idleBehavior.update(dt, this.characters, this.grid)
  }

  getAll(): Character[] {
    return Array.from(this.characters.values())
  }

  getCharacter(sessionId: string): Character | undefined {
    return this.characters.get(sessionId)
  }

  /** Returns the number of sessions waiting in the spawn queue */
  getQueueLength(): number {
    return this.spawnQueue.length
  }

  /**
   * Process the spawn queue: spawn the next queued character if
   * the active count is below MAX_AGENTS and a desk is available.
   */
  private processQueue(): void {
    while (this.spawnQueue.length > 0 && this.characters.size < MAX_AGENTS) {
      const next = this.spawnQueue.shift()!
      const spawned = this.spawnCharacter(next.sessionId, next.name, next.source)
      // If spawn returned null (e.g. no desk), stop processing
      if (!spawned) break
    }
  }

  /**
   * Send a character to an appropriate room based on the activity type.
   * - 'running' activities -> server room
   * - 'thinking' break activities -> conference room
   * - 'idle' -> random: coffee bar, break room, or lounge
   */
  sendToRoom(char: Character, activityType: string): void {
    let spots: { col: number; row: number }[]

    if (activityType === 'running') {
      spots = SERVER_ROOM_SPOTS
    } else if (activityType === 'thinking') {
      spots = CONFERENCE_SPOTS
    } else {
      // 'idle' — pick randomly between coffee bar, break room, and lounge
      const roll = Math.random()
      if (roll < 0.33) {
        spots = COFFEE_BAR_SPOTS
      } else if (roll < 0.66) {
        spots = BREAK_ROOM_SPOTS
      } else {
        spots = LOUNGE_SPOTS
      }
    }

    const spot = spots[Math.floor(Math.random() * spots.length)]
    const currentTile = this.grid.worldToTile(char.x, char.y)
    const path = bfs(this.grid, currentTile, spot)
    if (path.length > 0) {
      char.path = path
      char.pathIndex = 0
      char.state = AgentState.WALKING
      char.isOnBreak = true
    } else {
      char.state = AgentState.IDLE
      char.isOnBreak = true
    }
  }

  private findFreeDesk(): { col: number; row: number } | null {
    const chairs = this.grid.getChairPositions()
    for (const chair of chairs) {
      const key = `${chair.col},${chair.row}`
      if (!this.assignedDesks.has(key)) {
        return chair
      }
    }
    return null
  }
}
