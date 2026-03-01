import { Grid } from '../engine/Grid'
import { AgentState } from './CharacterState'
import { bfs } from './Pathfinding'
import type { Character } from './Character'
import {
  BREAK_ROOM_SPOTS,
  LOUNGE_SPOTS,
  COFFEE_BAR_SPOTS
} from '../office/OfficeLayout'

type IdleAction = 'wander' | 'get_coffee' | 'chat' | 'read_book' | 'stretch'

const IDLE_COOLDOWN = 5000 // 5 seconds between actions per character
const BUBBLE_DURATION = 4000

const ALL_IDLE_SPOTS = [...BREAK_ROOM_SPOTS, ...LOUNGE_SPOTS, ...COFFEE_BAR_SPOTS]

/** Weighted random pick from actions */
function pickIdleAction(): IdleAction {
  const roll = Math.random() * 100
  if (roll < 40) return 'wander'
  if (roll < 60) return 'get_coffee'
  if (roll < 80) return 'chat'
  if (roll < 90) return 'read_book'
  return 'stretch'
}

export class IdleBehaviorManager {
  /** Per-character cooldown tracking: characterId -> remaining cooldown (ms) */
  private cooldowns = new Map<string, number>()

  update(dt: number, characters: Map<string, Character>, grid: Grid): void {
    for (const char of characters.values()) {
      // Only run idle behaviors for on-break + idle characters
      if (!char.isOnBreak) continue
      if (char.state !== AgentState.IDLE) continue

      // Update cooldown
      const remaining = (this.cooldowns.get(char.id) ?? 0) - dt
      if (remaining > 0) {
        this.cooldowns.set(char.id, remaining)
        continue
      }

      // Cooldown expired — pick an action
      const action = pickIdleAction()
      this.cooldowns.set(char.id, IDLE_COOLDOWN)

      switch (action) {
        case 'wander': {
          // Pathfind to a random nearby idle spot
          const spot = ALL_IDLE_SPOTS[Math.floor(Math.random() * ALL_IDLE_SPOTS.length)]
          const currentTile = grid.worldToTile(char.x, char.y)
          const path = bfs(grid, currentTile, spot)
          if (path.length > 0 && path.length <= 20) {
            char.path = path
            char.pathIndex = 0
            char.state = AgentState.WALKING
          }
          break
        }

        case 'get_coffee': {
          // Pathfind to a coffee bar spot
          const coffeeSpots = COFFEE_BAR_SPOTS
          const spot = coffeeSpots[Math.floor(Math.random() * coffeeSpots.length)]
          const currentTile = grid.worldToTile(char.x, char.y)
          const path = bfs(grid, currentTile, spot)
          if (path.length > 0) {
            char.path = path
            char.pathIndex = 0
            char.state = AgentState.WALKING
            char.bubbleText = 'Coffee time!'
            char.bubbleTimer = BUBBLE_DURATION
          } else {
            // Can't reach coffee — just show bubble
            char.bubbleText = 'Coffee time!'
            char.bubbleTimer = BUBBLE_DURATION
          }
          break
        }

        case 'chat': {
          // Find a nearby idle character on break
          const chatPartner = this.findNearbyIdleCharacter(char, characters)
          if (chatPartner) {
            // Both show chat bubbles
            char.bubbleText = 'Hey!'
            char.bubbleTimer = BUBBLE_DURATION
            chatPartner.bubbleText = 'Hi there!'
            chatPartner.bubbleTimer = BUBBLE_DURATION

            // Face each other
            const dx = chatPartner.x - char.x
            if (Math.abs(dx) > 2) {
              char.direction = dx > 0 ? 'right' : 'left'
              chatPartner.direction = dx > 0 ? 'left' : 'right'
            }

            // Reset both cooldowns so they don't immediately do something else
            this.cooldowns.set(chatPartner.id, IDLE_COOLDOWN)
          } else {
            // No one nearby to chat with
            char.bubbleText = 'Hmm...'
            char.bubbleTimer = BUBBLE_DURATION / 2
          }
          break
        }

        case 'read_book': {
          char.bubbleText = 'Reading...'
          char.bubbleTimer = BUBBLE_DURATION
          // Stay in place, just show the bubble
          break
        }

        case 'stretch': {
          char.bubbleText = 'Stretching...'
          char.bubbleTimer = BUBBLE_DURATION
          // Stay in place, just show the bubble
          break
        }
      }
    }
  }

  cleanup(characterId: string): void {
    this.cooldowns.delete(characterId)
  }

  /**
   * Find another idle, on-break character within ~3 tiles of the given character.
   */
  private findNearbyIdleCharacter(char: Character, characters: Map<string, Character>): Character | null {
    const maxDist = 96 // ~3 tiles in pixels
    let closest: Character | null = null
    let closestDist = Infinity

    for (const other of characters.values()) {
      if (other.id === char.id) continue
      if (!other.isOnBreak) continue
      if (other.state !== AgentState.IDLE) continue

      const dx = other.x - char.x
      const dy = other.y - char.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < maxDist && dist < closestDist) {
        closest = other
        closestDist = dist
      }
    }

    return closest
  }
}
