import { TILE_SIZE } from '../engine/Grid'
import { AgentState } from './CharacterState'

export interface CharacterAppearance {
  hairColor: string
  hairStyle: 'short' | 'medium' | 'long' | 'spiky' | 'buzz' | 'ponytail' | 'bun' | 'mohawk' | 'curly' | 'afro'
  skinTone: string
  shirtColor: string
  pantsColor: string
  accessory?: 'none' | 'glasses' | 'headphones' | 'hat' | 'beanie'
}

export interface Character {
  id: string
  name: string
  x: number
  y: number
  path: { col: number; row: number }[]
  pathIndex: number
  state: AgentState
  animFrame: number
  animTimer: number
  color: string
  appearance: CharacterAppearance
  deskTile: { col: number; row: number } | null
  source: 'claude-code' | 'claude-desktop'
  direction: 'left' | 'right' | 'up' | 'down'
  bubbleText: string | null
  bubbleTimer: number
  pendingActivity: string | null
  isOnBreak: boolean
  isSubagent: boolean
  parentId: string | null
  scale: number
  lastDustEmit: number
}

const WALK_SPEED = 0.08 // pixels per ms (scaled for 32px tiles)
const ANIM_SPEED = 200   // ms per frame

export function createCharacter(
  id: string,
  name: string,
  x: number,
  y: number,
  appearance: CharacterAppearance,
  source: 'claude-code' | 'claude-desktop'
): Character {
  return {
    id,
    name,
    x,
    y,
    path: [],
    pathIndex: 0,
    state: AgentState.IDLE,
    animFrame: 0,
    animTimer: 0,
    color: appearance.shirtColor,
    appearance,
    deskTile: null,
    source,
    direction: 'down',
    bubbleText: null,
    bubbleTimer: 0,
    pendingActivity: null,
    isOnBreak: false,
    isSubagent: false,
    parentId: null,
    scale: 1.0,
    lastDustEmit: 0
  }
}

export function updateCharacter(char: Character, dt: number): void {
  char.animTimer += dt

  // Advance animation frame
  if (char.animTimer >= ANIM_SPEED) {
    char.animTimer -= ANIM_SPEED
    char.animFrame = (char.animFrame + 1) % 4
  }

  // Bubble timer
  if (char.bubbleTimer > 0) {
    char.bubbleTimer -= dt
    if (char.bubbleTimer <= 0) {
      char.bubbleText = null
      char.bubbleTimer = 0
    }
  }

  // Walking movement
  if (char.state === AgentState.WALKING && char.path.length > 0) {
    const target = char.path[char.pathIndex]
    const tx = target.col * TILE_SIZE + TILE_SIZE / 2
    const ty = target.row * TILE_SIZE + TILE_SIZE / 2

    const dx = tx - char.x
    const dy = ty - char.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < 1) {
      // Arrived at waypoint
      char.x = tx
      char.y = ty
      char.pathIndex++

      if (char.pathIndex >= char.path.length) {
        // Path complete - apply pending activity or go idle
        char.path = []
        char.pathIndex = 0
        if (char.pendingActivity) {
          // Will be applied by CharacterManager on next onActivity call
          // For now set to idle; the pending state is handled externally
          char.state = AgentState.IDLE
        } else {
          char.state = AgentState.IDLE
        }
      }
    } else {
      // Move toward target
      const speed = WALK_SPEED * dt
      const moveX = (dx / dist) * Math.min(speed, dist)
      const moveY = (dy / dist) * Math.min(speed, dist)
      char.x += moveX
      char.y += moveY

      // Update facing direction
      if (Math.abs(dx) > Math.abs(dy)) {
        char.direction = dx > 0 ? 'right' : 'left'
      } else {
        char.direction = dy > 0 ? 'down' : 'up'
      }
    }
  }
}
