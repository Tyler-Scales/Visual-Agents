import { Camera } from './Camera'
import { Grid, TileType, TILE_SIZE } from './Grid'
import { ParticleSystem } from './ParticleSystem'
import { drawTile, drawWallShadows, setAnimFrame } from '../office/TileRenderer'
import type { Character } from '../characters/Character'
import { drawCharacter } from '../characters/SpriteRenderer'
import { drawSpeechBubble } from '../ui/SpeechBubble'
import { AgentState } from '../characters/CharacterState'
import type { OfficeEditor } from '../editor/OfficeEditor'
import type { Minimap } from '../ui/Minimap'
import type { LightingState } from './DayNightCycle'

const STATE_SUMMARIES: Record<AgentState, string> = {
  [AgentState.IDLE]: 'Idle',
  [AgentState.WALKING]: 'On the move',
  [AgentState.TYPING]: 'Writing code',
  [AgentState.READING]: 'Reading files',
  [AgentState.THINKING]: 'Deep thought',
  [AgentState.WAITING]: 'Needs input',
  [AgentState.CELEBRATING]: 'Task done',
}

/** Global frame counter for animations (incremented in game loop) */
let renderFrameCount = 0
export function advanceRenderFrame(): void {
  renderFrameCount++
}

export function render(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  grid: Grid,
  characters: Character[],
  _interpolation: number,
  hoveredChar?: Character | null,
  particles?: ParticleSystem | null,
  editor?: OfficeEditor | null,
  minimap?: Minimap | null,
  lighting?: LightingState | null
): void {
  const canvas = ctx.canvas
  ctx.imageSmoothingEnabled = false

  // Update the animation frame for TileRenderer (server rack LEDs, etc.)
  setAnimFrame(renderFrameCount)

  // Clear
  ctx.fillStyle = '#0e0e1a'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Derive display dimensions from canvas & DPR
  const dpr = window.devicePixelRatio || 1
  const displayWidth = canvas.width / dpr
  const displayHeight = canvas.height / dpr

  ctx.save()
  ctx.scale(camera.zoom, camera.zoom)
  ctx.translate(-camera.x - camera.shakeOffsetX, -camera.y - camera.shakeOffsetY)

  // Viewport bounds for culling
  const startCol = Math.max(0, Math.floor(camera.x / TILE_SIZE))
  const startRow = Math.max(0, Math.floor(camera.y / TILE_SIZE))
  const endCol = Math.min(grid.cols, Math.ceil((camera.x + canvas.width / camera.zoom) / TILE_SIZE))
  const endRow = Math.min(grid.rows, Math.ceil((camera.y + canvas.height / camera.zoom) / TILE_SIZE))

  // Pass 1: Draw all tiles
  for (let row = startRow; row < endRow; row++) {
    for (let col = startCol; col < endCol; col++) {
      const tile = grid.getTile(col, row)
      drawTile(ctx, tile, col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, grid, col, row)
    }
  }

  // Pass 2: Wall depth shadows on floor tiles below walls
  for (let row = startRow; row < endRow; row++) {
    for (let col = startCol; col < endCol; col++) {
      const tile = grid.getTile(col, row)
      if (tile !== TileType.WALL && tile !== TileType.EMPTY) {
        drawWallShadows(ctx, grid, col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, col, row)
      }
    }
  }

  // Pass 3: Characters (y-sorted for depth)
  const sorted = [...characters].sort((a, b) => a.y - b.y)
  for (const char of sorted) {
    drawCharacter(ctx, char)
  }

  // Pass 3.5: Particles (above characters, below UI)
  if (particles) {
    particles.draw(ctx)
  }

  // Pass 4: Speech bubbles on top
  for (const char of sorted) {
    drawSpeechBubble(ctx, char)
  }

  // Pass 5: Hover tooltip
  if (hoveredChar) {
    drawHoverTooltip(ctx, hoveredChar)
  }

  // Pass 7: Day/Night lighting overlay (in world space)
  if (lighting && lighting.ambientOpacity > 0) {
    ctx.fillStyle = lighting.ambientTint
    ctx.globalAlpha = lighting.ambientOpacity
    ctx.fillRect(
      camera.x,
      camera.y,
      canvas.width / camera.zoom,
      canvas.height / camera.zoom
    )
    ctx.globalAlpha = 1.0

    // Night lamp glows at desk/chair positions
    if (lighting.lampGlow) {
      drawLampGlows(ctx, grid, startCol, startRow, endCol, endRow)
    }
  }

  // Pass 8: Editor overlay (grid lines, hover highlight, ghost preview)
  if (editor && editor.isActive()) {
    drawEditorOverlay(ctx, grid, editor, startCol, startRow, endCol, endRow)
  }

  ctx.restore()

  // Pass 6: Minimap (in screen space, after ctx.restore)
  if (minimap) {
    minimap.draw(ctx, camera, grid, characters, displayWidth, displayHeight)
  }
}

/** Draw warm glow circles at desk/chair positions during night */
function drawLampGlows(
  ctx: CanvasRenderingContext2D,
  grid: Grid,
  startCol: number,
  startRow: number,
  endCol: number,
  endRow: number
): void {
  for (let row = startRow; row < endRow; row++) {
    for (let col = startCol; col < endCol; col++) {
      const tile = grid.getTile(col, row)
      if (tile === TileType.DESK || tile === TileType.CHAIR) {
        const cx = col * TILE_SIZE + TILE_SIZE / 2
        const cy = row * TILE_SIZE + TILE_SIZE / 2

        // Approximate a radial gradient with concentric rectangles
        const layers = [
          { size: 24, alpha: 0.04 },
          { size: 18, alpha: 0.06 },
          { size: 12, alpha: 0.08 },
          { size: 6, alpha: 0.10 },
        ]
        for (const layer of layers) {
          ctx.fillStyle = `rgba(255,220,150,${layer.alpha})`
          ctx.fillRect(cx - layer.size, cy - layer.size, layer.size * 2, layer.size * 2)
        }
      }
    }
  }
}

function drawHoverTooltip(ctx: CanvasRenderingContext2D, char: Character): void {
  const x = Math.round(char.x)
  const y = Math.round(char.y) - 40
  const summary = STATE_SUMMARIES[char.state] || 'Active'

  ctx.font = '7px monospace'
  const textWidth = ctx.measureText(summary).width
  const padding = 5
  const w = textWidth + padding * 2
  const h = 14
  const bx = x - w / 2
  const by = y - h

  // Tooltip background
  ctx.fillStyle = 'rgba(30,30,50,0.88)'
  ctx.fillRect(bx - 1, by - 1, w + 2, h + 2)
  ctx.fillStyle = '#1e1e32'
  ctx.fillRect(bx, by, w, h)

  // Highlight border
  ctx.fillStyle = '#4a90d9'
  ctx.fillRect(bx, by, w, 1)
  ctx.fillRect(bx, by, 1, h)
  ctx.fillRect(bx + w - 1, by, 1, h)
  ctx.fillRect(bx, by + h - 1, w, 1)

  // Triangle pointer
  ctx.fillStyle = '#1e1e32'
  ctx.fillRect(x - 2, by + h, 4, 2)
  ctx.fillRect(x - 1, by + h + 2, 2, 1)

  // Text
  ctx.fillStyle = '#e0e8f0'
  ctx.textAlign = 'center'
  ctx.fillText(summary, x, by + h - 4)
}

/** Hit-test: find the character under a world position */
export function findCharacterAt(characters: Character[], wx: number, wy: number): Character | null {
  const HIT_W = 14 // half-width for hit box
  const HIT_TOP = 28 // pixels above char.y
  const HIT_BOT = 14 // pixels below char.y

  for (const char of characters) {
    if (
      wx >= char.x - HIT_W && wx <= char.x + HIT_W &&
      wy >= char.y - HIT_TOP && wy <= char.y + HIT_BOT
    ) {
      return char
    }
  }
  return null
}

/** Draw editor overlay: grid lines, hovered tile highlight, ghost preview */
function drawEditorOverlay(
  ctx: CanvasRenderingContext2D,
  grid: Grid,
  editor: OfficeEditor,
  startCol: number,
  startRow: number,
  endCol: number,
  endRow: number
): void {
  // Grid lines (thin lines at tile boundaries)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
  ctx.lineWidth = 0.5
  for (let row = startRow; row <= endRow; row++) {
    ctx.beginPath()
    ctx.moveTo(startCol * TILE_SIZE, row * TILE_SIZE)
    ctx.lineTo(endCol * TILE_SIZE, row * TILE_SIZE)
    ctx.stroke()
  }
  for (let col = startCol; col <= endCol; col++) {
    ctx.beginPath()
    ctx.moveTo(col * TILE_SIZE, startRow * TILE_SIZE)
    ctx.lineTo(col * TILE_SIZE, endRow * TILE_SIZE)
    ctx.stroke()
  }

  const hovered = editor.getHoveredTile()
  if (!hovered) return
  if (hovered.col < 0 || hovered.col >= grid.cols || hovered.row < 0 || hovered.row >= grid.rows) return

  const hx = hovered.col * TILE_SIZE
  const hy = hovered.row * TILE_SIZE

  const tool = editor.getTool()

  // Ghost preview of tile being placed (semi-transparent)
  if (tool === 'place') {
    const tileType = editor.getSelectedTileType()
    ctx.save()
    ctx.globalAlpha = 0.45
    drawTile(ctx, tileType, hx, hy, TILE_SIZE, grid, hovered.col, hovered.row)
    ctx.restore()
  }

  // Highlight hovered tile (semi-transparent white overlay)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)'
  ctx.fillRect(hx, hy, TILE_SIZE, TILE_SIZE)

  // Border around hovered tile
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.lineWidth = 1
  ctx.strokeRect(hx + 0.5, hy + 0.5, TILE_SIZE - 1, TILE_SIZE - 1)

  // For erase tool, show a red-tinted overlay
  if (tool === 'erase') {
    ctx.fillStyle = 'rgba(255, 60, 60, 0.15)'
    ctx.fillRect(hx, hy, TILE_SIZE, TILE_SIZE)
  }

  // For paint_floor tool, show floor style color hint
  if (tool === 'paint_floor') {
    ctx.fillStyle = 'rgba(60, 200, 120, 0.15)'
    ctx.fillRect(hx, hy, TILE_SIZE, TILE_SIZE)
  }

  // For select tool, show tile info text
  if (tool === 'select') {
    const currentTile = grid.getTile(hovered.col, hovered.row)
    const tileName = TileType[currentTile] || '?'
    ctx.font = '6px monospace'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
    ctx.textAlign = 'center'
    ctx.fillText(tileName, hx + TILE_SIZE / 2, hy + TILE_SIZE / 2 + 2)
  }
}
