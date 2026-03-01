import { Grid, TileType, type RoomZone } from '../engine/Grid'

export type EditorTool = 'select' | 'place' | 'erase' | 'paint_floor'

export type FloorStyle = 'wood' | 'tile' | 'carpet' | 'metal' | 'concrete'

export interface GridSnapshot {
  tiles: number[][]
  rooms: RoomZone[]
}

export interface EditorState {
  active: boolean
  tool: EditorTool
  selectedTileType: TileType
  selectedFloorStyle: FloorStyle
  hoveredTile: { col: number; row: number } | null
  undoStack: GridSnapshot[]
  redoStack: GridSnapshot[]
}

export class OfficeEditor {
  private state: EditorState = {
    active: false,
    tool: 'place',
    selectedTileType: TileType.WALL,
    selectedFloorStyle: 'wood',
    hoveredTile: null,
    undoStack: [],
    redoStack: [],
  }

  /** Whether a mouse drag is in progress (for committing undo snapshots) */
  private dragging = false
  /** Snapshot taken at the start of the current drag operation */
  private dragStartSnapshot: GridSnapshot | null = null

  isActive(): boolean {
    return this.state.active
  }

  toggle(): void {
    this.state.active = !this.state.active
  }

  getState(): EditorState {
    return this.state
  }

  setTool(tool: EditorTool): void {
    this.state.tool = tool
  }

  getTool(): EditorTool {
    return this.state.tool
  }

  setTileType(type: TileType): void {
    this.state.selectedTileType = type
  }

  getSelectedTileType(): TileType {
    return this.state.selectedTileType
  }

  setFloorStyle(style: FloorStyle): void {
    this.state.selectedFloorStyle = style
  }

  getSelectedFloorStyle(): FloorStyle {
    return this.state.selectedFloorStyle
  }

  getHoveredTile(): { col: number; row: number } | null {
    return this.state.hoveredTile
  }

  onMouseMove(col: number, row: number): void {
    this.state.hoveredTile = { col, row }
  }

  onMouseDown(col: number, row: number, grid: Grid): void {
    if (!this.state.active) return

    // Save snapshot at drag start for undo
    this.dragging = true
    this.dragStartSnapshot = this.takeSnapshot(grid)

    this.applyTool(col, row, grid)
  }

  onMouseDrag(col: number, row: number, grid: Grid): void {
    if (!this.state.active || !this.dragging) return
    this.applyTool(col, row, grid)
  }

  onMouseUp(): void {
    if (!this.dragging) return
    this.dragging = false

    // Commit the undo snapshot (the one from before we started dragging)
    if (this.dragStartSnapshot) {
      this.state.undoStack.push(this.dragStartSnapshot)
      this.dragStartSnapshot = null
      // Clear redo stack since we've made a new change
      this.state.redoStack = []
    }
  }

  private applyTool(col: number, row: number, grid: Grid): void {
    if (col < 0 || col >= grid.cols || row < 0 || row >= grid.rows) return

    switch (this.state.tool) {
      case 'place':
        grid.setTile(col, row, this.state.selectedTileType)
        break
      case 'erase':
        grid.setTile(col, row, TileType.FLOOR)
        break
      case 'paint_floor':
        this.paintFloorZone(col, row, grid)
        break
      case 'select':
        // No-op: just shows info about the tile at this position
        break
    }
  }

  private paintFloorZone(col: number, row: number, grid: Grid): void {
    // Find the room zone this tile belongs to and update its floor style
    for (const room of grid.rooms) {
      if (col >= room.col1 && col <= room.col2 && row >= room.row1 && row <= room.row2) {
        room.floorStyle = this.state.selectedFloorStyle
        return
      }
    }
    // If no existing room zone, create a single-tile zone
    grid.rooms.push({
      col1: col,
      row1: row,
      col2: col,
      row2: row,
      floorStyle: this.state.selectedFloorStyle,
    })
  }

  undo(grid: Grid): void {
    if (this.state.undoStack.length === 0) return

    // Save current state to redo stack before undoing
    const currentSnapshot = this.takeSnapshot(grid)
    this.state.redoStack.push(currentSnapshot)

    // Pop and restore
    const snapshot = this.state.undoStack.pop()!
    this.restoreSnapshot(grid, snapshot)
  }

  redo(grid: Grid): void {
    if (this.state.redoStack.length === 0) return

    // Save current state to undo stack before redoing
    const currentSnapshot = this.takeSnapshot(grid)
    this.state.undoStack.push(currentSnapshot)

    // Pop and restore
    const snapshot = this.state.redoStack.pop()!
    this.restoreSnapshot(grid, snapshot)
  }

  /**
   * BFS walkability check: from the entrance (any DOOR tile),
   * verify that all CHAIR positions are reachable.
   */
  validate(grid: Grid): boolean {
    // Find a door tile to use as the entrance
    let entrance: { col: number; row: number } | null = null
    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        if (grid.getTile(c, r) === TileType.DOOR) {
          entrance = { col: c, row: r }
          break
        }
      }
      if (entrance) break
    }

    if (!entrance) return false // No entrance found

    // BFS from entrance to find all reachable walkable tiles
    const key = (c: number, r: number) => `${c},${r}`
    const visited = new Set<string>()
    const queue: { col: number; row: number }[] = [entrance]
    visited.add(key(entrance.col, entrance.row))

    const DIRS = [
      { dc: 0, dr: -1 },
      { dc: 0, dr: 1 },
      { dc: -1, dr: 0 },
      { dc: 1, dr: 0 },
    ]

    while (queue.length > 0) {
      const current = queue.shift()!
      for (const dir of DIRS) {
        const nc = current.col + dir.dc
        const nr = current.row + dir.dr
        const nk = key(nc, nr)
        if (!visited.has(nk) && grid.isWalkable(nc, nr)) {
          visited.add(nk)
          queue.push({ col: nc, row: nr })
        }
      }
    }

    // Check that all chair positions are reachable
    const chairs = grid.getChairPositions()
    if (chairs.length === 0) return true // No chairs to validate

    for (const chair of chairs) {
      if (!visited.has(key(chair.col, chair.row))) {
        return false // Unreachable chair
      }
    }

    return true
  }

  takeSnapshot(grid: Grid): GridSnapshot {
    const serialized = grid.serialize()
    return {
      tiles: serialized.tiles,
      rooms: serialized.rooms.map((r) => ({ ...r })),
    }
  }

  restoreSnapshot(grid: Grid, snapshot: GridSnapshot): void {
    grid.deserialize({
      cols: grid.cols,
      rows: grid.rows,
      tiles: snapshot.tiles,
      rooms: snapshot.rooms,
    })
  }
}
