import { AgentState } from './CharacterState'
import type { Character, CharacterAppearance } from './Character'

const STATE_LABELS: Record<AgentState, string | null> = {
  [AgentState.IDLE]: null,
  [AgentState.WALKING]: null,
  [AgentState.TYPING]: 'Writing',
  [AgentState.READING]: 'Reading',
  [AgentState.THINKING]: 'Thinking',
  [AgentState.WAITING]: 'Waiting',
  [AgentState.CELEBRATING]: 'Done',
}

/**
 * Draws detailed pixel art characters at 32px tile scale.
 * Characters are ~20px wide and ~36px tall.
 */
export function drawCharacter(ctx: CanvasRenderingContext2D, char: Character): void {
  const x = Math.round(char.x)
  const y = Math.round(char.y)
  const a = char.appearance
  const f = char.animFrame

  // Apply scale for subagents (scale !== 1.0)
  const needsScale = char.scale !== 1.0
  if (needsScale) {
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(char.scale, char.scale)
    ctx.translate(-x, -y)
  }

  // Ground shadow (elliptical)
  ctx.fillStyle = 'rgba(0,0,0,0.15)'
  ctx.fillRect(x - 8, y + 12, 16, 3)
  ctx.fillRect(x - 7, y + 11, 14, 1)
  ctx.fillRect(x - 7, y + 15, 14, 1)

  switch (char.state) {
    case AgentState.IDLE: drawIdle(ctx, x, y, a, f); break
    case AgentState.WALKING: drawWalking(ctx, x, y, a, f); break
    case AgentState.TYPING: drawTyping(ctx, x, y, a, f); break
    case AgentState.READING: drawReading(ctx, x, y, a, f); break
    case AgentState.THINKING: drawThinking(ctx, x, y, a, f); break
    case AgentState.WAITING: drawWaiting(ctx, x, y, a, f); break
    case AgentState.CELEBRATING: drawCelebrating(ctx, x, y, a, f); break
  }

  // Activity label (shows single-word state when active, nothing when idle/walking)
  const label = STATE_LABELS[char.state]
  if (label) {
    const labelWidth = label.length * 5 + 8
    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    ctx.fillRect(x - labelWidth / 2, y + 16, labelWidth, 10)
    ctx.fillStyle = '#e8e8e8'
    ctx.font = '8px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(label, x, y + 24)
  }

  if (needsScale) {
    ctx.restore()
  }
}

// ====== HEAD ======

function drawHead(ctx: CanvasRenderingContext2D, x: number, y: number, a: CharacterAppearance, frame: number): void {
  // Face
  ctx.fillStyle = a.skinTone
  ctx.fillRect(x - 5, y - 18, 10, 10)

  // Hair
  ctx.fillStyle = a.hairColor
  switch (a.hairStyle) {
    case 'short':
      ctx.fillRect(x - 5, y - 22, 10, 5)
      ctx.fillRect(x - 6, y - 20, 1, 4)
      ctx.fillRect(x + 5, y - 20, 1, 4)
      break
    case 'medium':
      ctx.fillRect(x - 6, y - 23, 12, 6)
      ctx.fillRect(x - 7, y - 21, 1, 7)
      ctx.fillRect(x + 6, y - 21, 1, 7)
      // Hair highlight
      ctx.fillStyle = lighten(a.hairColor, 0.15)
      ctx.fillRect(x - 4, y - 23, 4, 2)
      break
    case 'long':
      ctx.fillRect(x - 6, y - 23, 12, 6)
      ctx.fillRect(x - 7, y - 21, 2, 14)
      ctx.fillRect(x + 5, y - 21, 2, 14)
      // Hair highlight
      ctx.fillStyle = lighten(a.hairColor, 0.12)
      ctx.fillRect(x - 4, y - 23, 3, 2)
      // Hair tips
      ctx.fillStyle = darken(a.hairColor, 0.1)
      ctx.fillRect(x - 7, y - 9, 2, 2)
      ctx.fillRect(x + 5, y - 9, 2, 2)
      break
    case 'spiky':
      ctx.fillRect(x - 5, y - 22, 10, 4)
      // Spikes
      ctx.fillRect(x - 6, y - 26, 3, 6)
      ctx.fillRect(x - 1, y - 28, 3, 8)
      ctx.fillRect(x + 3, y - 26, 3, 6)
      // Spike tips
      ctx.fillStyle = lighten(a.hairColor, 0.2)
      ctx.fillRect(x - 5, y - 26, 1, 2)
      ctx.fillRect(x, y - 28, 1, 2)
      ctx.fillRect(x + 4, y - 26, 1, 2)
      break
    case 'buzz':
      ctx.fillRect(x - 5, y - 20, 10, 3)
      ctx.fillStyle = darken(a.hairColor, 0.1)
      ctx.fillRect(x - 6, y - 19, 1, 2)
      ctx.fillRect(x + 5, y - 19, 1, 2)
      break
    case 'ponytail':
      // Top hair
      ctx.fillRect(x - 6, y - 23, 12, 6)
      // Side tufts
      ctx.fillRect(x - 7, y - 21, 1, 5)
      ctx.fillRect(x + 6, y - 21, 1, 5)
      // Ponytail hanging behind (right side)
      ctx.fillRect(x + 5, y - 18, 3, 2)
      ctx.fillRect(x + 6, y - 16, 2, 6)
      ctx.fillRect(x + 7, y - 10, 1, 4)
      // Hair tie
      ctx.fillStyle = darken(a.hairColor, 0.25)
      ctx.fillRect(x + 5, y - 16, 3, 1)
      // Highlight
      ctx.fillStyle = lighten(a.hairColor, 0.15)
      ctx.fillRect(x - 4, y - 23, 4, 2)
      break
    case 'bun':
      // Base hair
      ctx.fillRect(x - 6, y - 23, 12, 6)
      ctx.fillRect(x - 7, y - 21, 1, 4)
      ctx.fillRect(x + 6, y - 21, 1, 4)
      // Bun on top
      ctx.fillRect(x - 3, y - 27, 6, 4)
      ctx.fillRect(x - 2, y - 28, 4, 1)
      // Bun highlight
      ctx.fillStyle = lighten(a.hairColor, 0.18)
      ctx.fillRect(x - 1, y - 27, 2, 2)
      break
    case 'mohawk':
      // Shaved sides (skin showing)
      ctx.fillStyle = darken(a.skinTone, 0.08)
      ctx.fillRect(x - 5, y - 20, 3, 3)
      ctx.fillRect(x + 3, y - 20, 3, 3)
      // Mohawk strip
      ctx.fillStyle = a.hairColor
      ctx.fillRect(x - 2, y - 28, 4, 10)
      ctx.fillRect(x - 1, y - 30, 2, 2)
      // Highlight on tips
      ctx.fillStyle = lighten(a.hairColor, 0.25)
      ctx.fillRect(x - 1, y - 30, 1, 2)
      ctx.fillRect(x, y - 28, 1, 2)
      break
    case 'curly':
      // Voluminous curly hair
      ctx.fillRect(x - 7, y - 24, 14, 7)
      ctx.fillRect(x - 8, y - 22, 1, 6)
      ctx.fillRect(x + 7, y - 22, 1, 6)
      // Curl texture (darker spots)
      ctx.fillStyle = darken(a.hairColor, 0.12)
      ctx.fillRect(x - 6, y - 23, 2, 2)
      ctx.fillRect(x - 2, y - 24, 2, 2)
      ctx.fillRect(x + 2, y - 23, 2, 2)
      ctx.fillRect(x + 5, y - 22, 2, 2)
      ctx.fillRect(x - 4, y - 20, 2, 2)
      ctx.fillRect(x + 1, y - 21, 2, 2)
      // Highlight
      ctx.fillStyle = lighten(a.hairColor, 0.15)
      ctx.fillRect(x - 3, y - 24, 1, 1)
      ctx.fillRect(x + 3, y - 24, 1, 1)
      break
    case 'afro':
      // Large round afro
      ctx.fillRect(x - 8, y - 28, 16, 12)
      ctx.fillRect(x - 9, y - 26, 1, 8)
      ctx.fillRect(x + 8, y - 26, 1, 8)
      ctx.fillRect(x - 7, y - 29, 14, 1)
      // Texture
      ctx.fillStyle = darken(a.hairColor, 0.1)
      ctx.fillRect(x - 7, y - 27, 2, 2)
      ctx.fillRect(x - 3, y - 28, 2, 2)
      ctx.fillRect(x + 2, y - 27, 2, 2)
      ctx.fillRect(x + 5, y - 26, 2, 2)
      ctx.fillRect(x - 5, y - 23, 2, 2)
      ctx.fillRect(x, y - 24, 2, 2)
      ctx.fillRect(x + 4, y - 23, 2, 2)
      // Highlight
      ctx.fillStyle = lighten(a.hairColor, 0.12)
      ctx.fillRect(x - 2, y - 28, 3, 1)
      ctx.fillRect(x - 6, y - 25, 1, 2)
      break
  }

  // Eyes
  const blink = frame === 3
  if (!blink) {
    // Eye whites
    ctx.fillStyle = '#f0f0f0'
    ctx.fillRect(x - 4, y - 16, 3, 3)
    ctx.fillRect(x + 1, y - 16, 3, 3)
    // Pupils
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(x - 3, y - 15, 2, 2)
    ctx.fillRect(x + 2, y - 15, 2, 2)
    // Eye shine (crucial for life!)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(x - 4, y - 16, 1, 1)
    ctx.fillRect(x + 1, y - 16, 1, 1)
  } else {
    // Blink
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(x - 4, y - 15, 3, 1)
    ctx.fillRect(x + 1, y - 15, 3, 1)
  }

  // Cheek blush
  ctx.fillStyle = 'rgba(255,120,120,0.12)'
  ctx.fillRect(x - 5, y - 13, 3, 2)
  ctx.fillRect(x + 3, y - 13, 3, 2)

  // Mouth
  ctx.fillStyle = darken(a.skinTone, 0.2)
  ctx.fillRect(x - 1, y - 11, 3, 1)

  // Neck
  ctx.fillStyle = a.skinTone
  ctx.fillRect(x - 2, y - 9, 4, 2)

  // Accessory (drawn on top of everything)
  drawAccessory(ctx, x, y, a)
}

function drawAccessory(ctx: CanvasRenderingContext2D, x: number, y: number, a: CharacterAppearance): void {
  const accessory = a.accessory || 'none'
  if (accessory === 'none') return

  switch (accessory) {
    case 'glasses':
      // Frames
      ctx.fillStyle = '#3a3a4a'
      // Left lens frame
      ctx.fillRect(x - 5, y - 17, 4, 4)
      // Right lens frame
      ctx.fillRect(x + 1, y - 17, 4, 4)
      // Bridge
      ctx.fillRect(x - 1, y - 16, 2, 1)
      // Temples (arms going to ears)
      ctx.fillRect(x - 6, y - 16, 1, 1)
      ctx.fillRect(x + 5, y - 16, 1, 1)
      // Lens tint (semi-transparent)
      ctx.fillStyle = 'rgba(180,210,240,0.2)'
      ctx.fillRect(x - 4, y - 16, 2, 2)
      ctx.fillRect(x + 2, y - 16, 2, 2)
      break

    case 'headphones':
      // Headband on top of head
      ctx.fillStyle = '#2a2a3a'
      ctx.fillRect(x - 6, y - 23, 12, 2)
      // Headband arch
      ctx.fillRect(x - 3, y - 24, 6, 1)
      // Left ear cup
      ctx.fillRect(x - 7, y - 18, 3, 5)
      ctx.fillStyle = '#4a4a5a'
      ctx.fillRect(x - 6, y - 17, 1, 3)
      // Right ear cup
      ctx.fillStyle = '#2a2a3a'
      ctx.fillRect(x + 4, y - 18, 3, 5)
      ctx.fillStyle = '#4a4a5a'
      ctx.fillRect(x + 5, y - 17, 1, 3)
      break

    case 'hat':
      // Baseball cap brim
      ctx.fillStyle = '#3a4a6a'
      ctx.fillRect(x - 7, y - 20, 14, 2)
      // Cap dome
      ctx.fillRect(x - 6, y - 24, 12, 4)
      ctx.fillRect(x - 5, y - 25, 10, 1)
      // Cap button on top
      ctx.fillStyle = lighten('#3a4a6a', 0.2)
      ctx.fillRect(x, y - 25, 1, 1)
      // Brim highlight
      ctx.fillStyle = lighten('#3a4a6a', 0.1)
      ctx.fillRect(x - 6, y - 20, 10, 1)
      break

    case 'beanie':
      // Beanie covering top of head
      ctx.fillStyle = '#8a3040'
      ctx.fillRect(x - 6, y - 24, 12, 6)
      ctx.fillRect(x - 5, y - 25, 10, 1)
      // Fold/rim at bottom
      ctx.fillStyle = darken('#8a3040', 0.15)
      ctx.fillRect(x - 6, y - 19, 12, 2)
      // Pom pom on top
      ctx.fillStyle = lighten('#8a3040', 0.2)
      ctx.fillRect(x - 1, y - 27, 3, 3)
      ctx.fillRect(x, y - 28, 1, 1)
      // Stripe
      ctx.fillStyle = lighten('#8a3040', 0.15)
      ctx.fillRect(x - 5, y - 23, 10, 1)
      break
  }
}

// ====== BODY ======

function drawShirt(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  // Main shirt
  ctx.fillStyle = color
  ctx.fillRect(x - 7, y - 7, 14, 11)

  // Collar
  ctx.fillStyle = lighten(color, 0.2)
  ctx.fillRect(x - 4, y - 7, 8, 2)

  // Shirt details
  ctx.fillStyle = darken(color, 0.08)
  ctx.fillRect(x + 2, y - 4, 3, 3) // pocket
  ctx.fillRect(x - 7, y + 2, 14, 2) // bottom shade

  // Shoulder highlights
  ctx.fillStyle = lighten(color, 0.1)
  ctx.fillRect(x - 7, y - 7, 2, 4)
  ctx.fillRect(x + 5, y - 7, 2, 4)
}

function drawBelt(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = '#3a3020'
  ctx.fillRect(x - 7, y + 4, 14, 2)
  // Buckle
  ctx.fillStyle = '#c0a040'
  ctx.fillRect(x - 2, y + 4, 4, 2)
}

// ====== ARMS ======

function drawArmsAtSides(ctx: CanvasRenderingContext2D, x: number, y: number, skinTone: string): void {
  ctx.fillStyle = skinTone
  ctx.fillRect(x - 9, y - 6, 2, 8)
  ctx.fillRect(x + 7, y - 6, 2, 8)
  // Hands
  ctx.fillStyle = darken(skinTone, 0.05)
  ctx.fillRect(x - 9, y + 1, 2, 3)
  ctx.fillRect(x + 7, y + 1, 2, 3)
}

function drawArmsSwinging(ctx: CanvasRenderingContext2D, x: number, y: number, skinTone: string, frame: number): void {
  const swing = frame % 2 === 0 ? -2 : 2
  ctx.fillStyle = skinTone
  ctx.fillRect(x - 9, y - 6 + swing, 2, 8)
  ctx.fillRect(x + 7, y - 6 - swing, 2, 8)
  ctx.fillStyle = darken(skinTone, 0.05)
  ctx.fillRect(x - 9, y + 1 + swing, 2, 3)
  ctx.fillRect(x + 7, y + 1 - swing, 2, 3)
}

function drawArmsTyping(ctx: CanvasRenderingContext2D, x: number, y: number, skinTone: string, frame: number): void {
  ctx.fillStyle = skinTone
  // Arms extended forward
  ctx.fillRect(x - 8, y - 4, 3, 5)
  ctx.fillRect(x + 5, y - 4, 3, 5)
  // Fingers wiggle
  const w = frame % 2
  ctx.fillRect(x - 6 + w, y, 2, 2)
  ctx.fillRect(x + 5 - w, y, 2, 2)
}

// ====== LEGS ======

function drawPantsAndShoes(ctx: CanvasRenderingContext2D, x: number, y: number, pantsColor: string, walking: boolean, frame: number): void {
  ctx.fillStyle = pantsColor
  if (walking) {
    const phase = frame % 4
    const offL = phase < 2 ? 1 : -1
    const offR = phase < 2 ? -1 : 1
    // Left leg
    ctx.fillRect(x - 5 + offL, y + 6, 4, 5)
    // Right leg
    ctx.fillRect(x + 1 + offR, y + 6, 4, 5)
    // Shoes
    ctx.fillStyle = '#2a2020'
    ctx.fillRect(x - 5 + offL, y + 11, 5, 2)
    ctx.fillRect(x + 1 + offR, y + 11, 5, 2)
  } else {
    // Standing
    ctx.fillRect(x - 5, y + 6, 4, 5)
    ctx.fillRect(x + 1, y + 6, 4, 5)
    // Shoes
    ctx.fillStyle = '#2a2020'
    ctx.fillRect(x - 5, y + 11, 5, 2)
    ctx.fillRect(x + 1, y + 11, 5, 2)
    // Shoe highlight
    ctx.fillStyle = '#3a3030'
    ctx.fillRect(x - 4, y + 11, 2, 1)
    ctx.fillRect(x + 2, y + 11, 2, 1)
  }
}

function drawSeatedLegs(ctx: CanvasRenderingContext2D, x: number, y: number, pantsColor: string): void {
  ctx.fillStyle = pantsColor
  ctx.fillRect(x - 5, y + 6, 4, 3)
  ctx.fillRect(x + 1, y + 6, 4, 3)
  // Shoes peeking
  ctx.fillStyle = '#2a2020'
  ctx.fillRect(x - 5, y + 9, 4, 1)
  ctx.fillRect(x + 1, y + 9, 4, 1)
}

// ====== STATE DRAWINGS ======

function drawIdle(ctx: CanvasRenderingContext2D, x: number, y: number, a: CharacterAppearance, frame: number): void {
  drawHead(ctx, x, y, a, frame)
  drawShirt(ctx, x, y, a.shirtColor)
  drawArmsAtSides(ctx, x, y, a.skinTone)
  drawBelt(ctx, x, y)
  drawPantsAndShoes(ctx, x, y, a.pantsColor, false, frame)
}

function drawWalking(ctx: CanvasRenderingContext2D, x: number, y: number, a: CharacterAppearance, frame: number): void {
  const bob = frame % 2 === 0 ? -1 : 0
  drawHead(ctx, x, y + bob, a, frame)
  drawShirt(ctx, x, y + bob, a.shirtColor)
  drawArmsSwinging(ctx, x, y + bob, a.skinTone, frame)
  drawBelt(ctx, x, y + bob)
  drawPantsAndShoes(ctx, x, y, a.pantsColor, true, frame)
}

function drawTyping(ctx: CanvasRenderingContext2D, x: number, y: number, a: CharacterAppearance, frame: number): void {
  // Head bobs slightly while typing
  const headBob = frame % 2 === 0 ? 0 : -1
  drawHead(ctx, x, y + headBob, a, frame)
  drawShirt(ctx, x, y, a.shirtColor)
  drawArmsTyping(ctx, x, y, a.skinTone, frame)
  drawBelt(ctx, x, y)
  drawSeatedLegs(ctx, x, y, a.pantsColor)
}

function drawReading(ctx: CanvasRenderingContext2D, x: number, y: number, a: CharacterAppearance, frame: number): void {
  drawHead(ctx, x, y, a, frame)
  drawShirt(ctx, x, y, a.shirtColor)

  // Arms holding document
  ctx.fillStyle = a.skinTone
  ctx.fillRect(x - 8, y - 8, 3, 6)
  ctx.fillRect(x + 5, y - 8, 3, 6)

  // Document/tablet
  ctx.fillStyle = '#e8e8e0'
  ctx.fillRect(x - 5, y - 14, 10, 7)
  // Text lines
  ctx.fillStyle = '#bbb'
  ctx.fillRect(x - 4, y - 13, 6, 1)
  ctx.fillRect(x - 4, y - 11, 8, 1)
  ctx.fillRect(x - 4, y - 9, 5, 1)

  drawBelt(ctx, x, y)
  drawSeatedLegs(ctx, x, y, a.pantsColor)
}

function drawThinking(ctx: CanvasRenderingContext2D, x: number, y: number, a: CharacterAppearance, frame: number): void {
  drawHead(ctx, x, y, a, frame)
  drawShirt(ctx, x, y, a.shirtColor)

  // Left arm at side
  ctx.fillStyle = a.skinTone
  ctx.fillRect(x - 9, y - 6, 2, 8)
  ctx.fillRect(x - 9, y + 1, 2, 3)

  // Right arm - hand on chin
  ctx.fillRect(x + 5, y - 12, 3, 6)
  ctx.fillRect(x + 2, y - 12, 4, 2)

  drawBelt(ctx, x, y)
  drawPantsAndShoes(ctx, x, y, a.pantsColor, false, frame)

  // Thinking dots (bubble trail)
  const phase = frame % 3
  ctx.fillStyle = '#e0e0e0'
  if (phase >= 0) {
    ctx.fillRect(x + 8, y - 22, 3, 3)
  }
  if (phase >= 1) {
    ctx.fillRect(x + 11, y - 27, 3, 3)
  }
  if (phase >= 2) {
    // Thought bubble
    ctx.fillRect(x + 8, y - 34, 8, 6)
    ctx.fillRect(x + 7, y - 33, 10, 4)
    ctx.fillStyle = '#ccc'
    ctx.fillRect(x + 9, y - 32, 3, 1)
    ctx.fillRect(x + 9, y - 30, 5, 1)
  }
}

function drawWaiting(ctx: CanvasRenderingContext2D, x: number, y: number, a: CharacterAppearance, frame: number): void {
  const bounce = frame % 2 === 0 ? -1 : 0
  drawHead(ctx, x, y + bounce, a, frame)
  drawShirt(ctx, x, y + bounce, a.shirtColor)

  // Arms raised slightly
  ctx.fillStyle = a.skinTone
  ctx.fillRect(x - 9, y - 8 + bounce, 2, 8)
  ctx.fillRect(x + 7, y - 8 + bounce, 2, 8)

  drawBelt(ctx, x, y + bounce)
  drawPantsAndShoes(ctx, x, y, a.pantsColor, false, frame)

  // Exclamation mark
  ctx.fillStyle = '#ff5555'
  ctx.fillRect(x - 1, y - 32, 3, 8)
  ctx.fillRect(x - 1, y - 22, 3, 3)
}

function drawCelebrating(ctx: CanvasRenderingContext2D, x: number, y: number, a: CharacterAppearance, frame: number): void {
  drawHead(ctx, x, y, a, frame)
  drawShirt(ctx, x, y, a.shirtColor)

  // Arms raised high
  ctx.fillStyle = a.skinTone
  ctx.fillRect(x - 10, y - 16, 3, 8)
  ctx.fillRect(x + 7, y - 16, 3, 8)

  drawBelt(ctx, x, y)
  drawPantsAndShoes(ctx, x, y, a.pantsColor, false, frame)

  // Stars/sparkles
  const colors = ['#ffd700', '#ff6b6b', '#4ecdc4']
  for (let i = 0; i < 3; i++) {
    const sx = x - 12 + i * 12
    const sy = y - 30 - ((frame + i) % 3) * 3
    ctx.fillStyle = colors[i]
    // Star shape
    ctx.fillRect(sx, sy, 3, 3)
    ctx.fillRect(sx - 1, sy + 1, 1, 1)
    ctx.fillRect(sx + 3, sy + 1, 1, 1)
    ctx.fillRect(sx + 1, sy - 1, 1, 1)
    ctx.fillRect(sx + 1, sy + 3, 1, 1)
  }
}

// ====== HELPERS ======

function darken(hex: string, amount: number): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) * (1 - amount))
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) * (1 - amount))
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) * (1 - amount))
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`
}

function lighten(hex: string, amount: number): string {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + (255 - parseInt(hex.slice(1, 3), 16)) * amount)
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + (255 - parseInt(hex.slice(3, 5), 16)) * amount)
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + (255 - parseInt(hex.slice(5, 7), 16)) * amount)
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`
}
