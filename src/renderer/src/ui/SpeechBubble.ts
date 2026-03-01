import type { Character } from '../characters/Character'
import { AgentState } from '../characters/CharacterState'

/** Map agent states to indicator dot colors */
const STATE_DOT_COLORS: Record<AgentState, string> = {
  [AgentState.IDLE]: '#999999',
  [AgentState.WALKING]: '#999999',
  [AgentState.TYPING]: '#4a90d9',     // blue  — writing
  [AgentState.READING]: '#4ad994',     // green — reading
  [AgentState.THINKING]: '#9a4ad9',    // purple — thinking
  [AgentState.WAITING]: '#d94a4a',     // red   — waiting
  [AgentState.CELEBRATING]: '#ffd700', // gold  — celebrating
}

const MAX_DISPLAY_CHARS = 22

export function drawSpeechBubble(ctx: CanvasRenderingContext2D, char: Character): void {
  if (!char.bubbleText) return

  // Truncate displayed text at 22 chars with ellipsis
  let text = char.bubbleText
  if (text.length > MAX_DISPLAY_CHARS) {
    text = text.slice(0, MAX_DISPLAY_CHARS - 1) + '\u2026'
  }

  const x = Math.round(char.x)
  const y = Math.round(char.y) - 36

  // Apply fade-out when bubbleTimer < 500ms
  const prevAlpha = ctx.globalAlpha
  if (char.bubbleTimer > 0 && char.bubbleTimer < 500) {
    ctx.globalAlpha = char.bubbleTimer / 500
  }

  ctx.font = '6px monospace'
  const dotSpace = 6 // space for the color indicator dot
  const textWidth = ctx.measureText(text).width
  const padding = 4
  const bubbleW = textWidth + padding * 2 + dotSpace
  const bubbleH = 12
  const bx = x - bubbleW / 2
  const by = y - bubbleH

  // Drop shadow below the bubble
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.fillRect(bx + 1, by + 1, bubbleW, bubbleH)

  // Bubble background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(bx, by, bubbleW, bubbleH)

  // Border
  ctx.strokeStyle = '#333333'
  ctx.lineWidth = 0.5
  ctx.strokeRect(bx, by, bubbleW, bubbleH)

  // Triangle pointer
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.moveTo(x - 3, by + bubbleH)
  ctx.lineTo(x, by + bubbleH + 4)
  ctx.lineTo(x + 3, by + bubbleH)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Activity-type color indicator dot (left of text)
  const dotColor = STATE_DOT_COLORS[char.state] || '#999999'
  const dotX = bx + padding + 1
  const dotY = by + bubbleH / 2 - 1
  ctx.fillStyle = dotColor
  ctx.fillRect(dotX, dotY, 3, 3)

  // Text (shifted right to account for dot)
  ctx.fillStyle = '#333333'
  ctx.textAlign = 'center'
  const textCenterX = bx + dotSpace + padding + textWidth / 2
  ctx.fillText(text, textCenterX, by + bubbleH - 3)

  // Restore alpha
  ctx.globalAlpha = prevAlpha
}
