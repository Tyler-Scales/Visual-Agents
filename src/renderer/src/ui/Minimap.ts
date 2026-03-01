import { Grid, TileType, TILE_SIZE } from '../engine/Grid'
import { Camera } from '../engine/Camera'
import type { Character } from '../characters/Character'
import { AgentState } from '../characters/CharacterState'

const SCALE = 3 // 3px per tile
const PADDING = 10

/** Colors for each tile type on the minimap */
function tileColor(type: TileType, floorStyle: string): string {
  switch (type) {
    case TileType.EMPTY: return '#111122'
    case TileType.WALL: return '#2c2c42'
    case TileType.FLOOR:
    case TileType.DOOR:
      switch (floorStyle) {
        case 'wood': return '#b99e74'
        case 'tile': return '#ddd2c2'
        case 'carpet': return '#354b68'
        case 'metal': return '#5e6270'
        case 'concrete': return '#828280'
        default: return '#b99e74'
      }
    case TileType.DESK: return '#9a7a40'
    case TileType.CHAIR: return '#6a6050'
    case TileType.BOOKSHELF: return '#5a3a20'
    case TileType.COUCH: return '#8b3030'
    case TileType.VENDING: return '#3a3a4a'
    case TileType.COUNTER: return '#d0c0a0'
    case TileType.PLANT_TILE: return '#38963a'
    case TileType.WATER_COOLER: return '#a0d0e8'
    case TileType.PAINTING: return '#88b0d0'
    case TileType.CLOCK: return '#e0e0e0'
    case TileType.SERVER_RACK: return '#1a1a2a'
    case TileType.WHITEBOARD: return '#f4f4f0'
    case TileType.CONFERENCE_TABLE: return '#4a3520'
    case TileType.STOOL: return '#6a6a70'
    case TileType.ESPRESSO_MACHINE: return '#c0c0c8'
    default: return '#111122'
  }
}

/** Colors for character dots on minimap by state */
const CHAR_DOT_COLORS: Record<AgentState, string> = {
  [AgentState.IDLE]: '#cccccc',
  [AgentState.WALKING]: '#ffffff',
  [AgentState.TYPING]: '#4a90d9',
  [AgentState.READING]: '#4ad994',
  [AgentState.THINKING]: '#9a4ad9',
  [AgentState.WAITING]: '#d94a4a',
  [AgentState.CELEBRATING]: '#ffd700',
}

export class Minimap {
  private cachedBg: HTMLCanvasElement | null = null
  private cachedGridCols = 0
  private cachedGridRows = 0
  private dirty = true

  /** Mark the background cache as dirty (call when grid changes) */
  invalidate(): void {
    this.dirty = true
  }

  /** Get the minimap dimensions in screen pixels */
  getSize(grid: Grid): { width: number; height: number } {
    return {
      width: grid.cols * SCALE,
      height: grid.rows * SCALE,
    }
  }

  /** Get the top-left position of the minimap on screen */
  getPosition(canvasWidth: number, grid: Grid): { x: number; y: number } {
    const size = this.getSize(grid)
    return {
      x: canvasWidth - size.width - PADDING,
      y: PADDING,
    }
  }

  /**
   * Build (or return cached) offscreen canvas with tile background.
   */
  private buildBackground(grid: Grid): HTMLCanvasElement {
    if (this.cachedBg && !this.dirty && grid.cols === this.cachedGridCols && grid.rows === this.cachedGridRows) {
      return this.cachedBg
    }

    const w = grid.cols * SCALE
    const h = grid.rows * SCALE
    const offscreen = document.createElement('canvas')
    offscreen.width = w
    offscreen.height = h
    const offCtx = offscreen.getContext('2d')!

    for (let row = 0; row < grid.rows; row++) {
      for (let col = 0; col < grid.cols; col++) {
        const type = grid.getTile(col, row)
        const style = grid.getFloorStyle(col, row)
        offCtx.fillStyle = tileColor(type, style)
        offCtx.fillRect(col * SCALE, row * SCALE, SCALE, SCALE)
      }
    }

    this.cachedBg = offscreen
    this.cachedGridCols = grid.cols
    this.cachedGridRows = grid.rows
    this.dirty = false
    return offscreen
  }

  /**
   * Draw the minimap in screen space (call after ctx.restore()).
   */
  draw(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    grid: Grid,
    characters: Character[],
    canvasWidth: number,
    canvasHeight: number
  ): void {
    const bg = this.buildBackground(grid)
    const pos = this.getPosition(canvasWidth, grid)
    const size = this.getSize(grid)

    // Semi-transparent dark background overlay
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(pos.x - 2, pos.y - 2, size.width + 4, size.height + 4)

    // Border
    ctx.fillStyle = 'rgba(100,100,140,0.6)'
    ctx.fillRect(pos.x - 1, pos.y - 1, size.width + 2, size.height + 2)

    // Draw cached tile background
    ctx.drawImage(bg, pos.x, pos.y)

    // Character dots
    for (const char of characters) {
      const tileCol = char.x / TILE_SIZE
      const tileRow = char.y / TILE_SIZE
      const dotX = pos.x + tileCol * SCALE
      const dotY = pos.y + tileRow * SCALE

      // Dot color based on state
      ctx.fillStyle = CHAR_DOT_COLORS[char.state] || '#ffffff'

      // Draw a small colored dot (2x2)
      ctx.fillRect(Math.round(dotX) - 1, Math.round(dotY) - 1, 2, 2)
    }

    // Viewport rectangle
    const viewW = canvasWidth / camera.zoom
    const viewH = canvasHeight / camera.zoom
    const vpX = pos.x + (camera.x / TILE_SIZE) * SCALE
    const vpY = pos.y + (camera.y / TILE_SIZE) * SCALE
    const vpW = (viewW / TILE_SIZE) * SCALE
    const vpH = (viewH / TILE_SIZE) * SCALE

    ctx.strokeStyle = 'rgba(255,255,255,0.6)'
    ctx.lineWidth = 1
    ctx.strokeRect(
      Math.round(vpX),
      Math.round(vpY),
      Math.round(vpW),
      Math.round(vpH)
    )
  }

  /**
   * Hit-test: check if a screen position is within the minimap and return
   * the corresponding world tile coordinate. Returns null if outside.
   */
  hitTest(
    screenX: number,
    screenY: number,
    canvasWidth: number,
    grid: Grid
  ): { col: number; row: number } | null {
    const pos = this.getPosition(canvasWidth, grid)
    const size = this.getSize(grid)

    const relX = screenX - pos.x
    const relY = screenY - pos.y

    if (relX < 0 || relX >= size.width || relY < 0 || relY >= size.height) {
      return null
    }

    const col = Math.floor(relX / SCALE)
    const row = Math.floor(relY / SCALE)

    return { col, row }
  }
}
