export enum TileType {
  EMPTY = 0,
  FLOOR = 1,
  WALL = 2,
  DESK = 3,
  CHAIR = 4,
  BOOKSHELF = 5,
  DOOR = 6,
  COUCH = 7,
  VENDING = 8,
  COUNTER = 9,
  PLANT_TILE = 10,
  WATER_COOLER = 11,
  PAINTING = 12,
  CLOCK = 13,
  SERVER_RACK = 14,
  WHITEBOARD = 15,
  CONFERENCE_TABLE = 16,
  STOOL = 17,
  ESPRESSO_MACHINE = 18
}

export const TILE_SIZE = 32

const WALKABLE = new Set([TileType.FLOOR, TileType.DOOR, TileType.CHAIR, TileType.STOOL])

export interface RoomZone {
  col1: number
  row1: number
  col2: number
  row2: number
  floorStyle: 'wood' | 'tile' | 'carpet' | 'metal' | 'concrete'
}

export class Grid {
  readonly cols: number
  readonly rows: number
  private tiles: TileType[][]
  rooms: RoomZone[] = []

  constructor(cols: number, rows: number) {
    this.cols = cols
    this.rows = rows
    this.tiles = Array.from({ length: rows }, () =>
      new Array(cols).fill(TileType.EMPTY)
    )
  }

  getTile(col: number, row: number): TileType {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
      return TileType.EMPTY
    }
    return this.tiles[row][col]
  }

  setTile(col: number, row: number, type: TileType): void {
    if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
      this.tiles[row][col] = type
    }
  }

  fillRect(col: number, row: number, w: number, h: number, type: TileType): void {
    for (let r = row; r < row + h; r++) {
      for (let c = col; c < col + w; c++) {
        this.setTile(c, r, type)
      }
    }
  }

  isWalkable(col: number, row: number): boolean {
    return WALKABLE.has(this.getTile(col, row))
  }

  getChairPositions(): { col: number; row: number }[] {
    const chairs: { col: number; row: number }[] = []
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.tiles[r][c] === TileType.CHAIR) chairs.push({ col: c, row: r })
      }
    }
    return chairs
  }

  tileToWorld(col: number, row: number): { x: number; y: number } {
    return { x: col * TILE_SIZE + TILE_SIZE / 2, y: row * TILE_SIZE + TILE_SIZE / 2 }
  }

  worldToTile(x: number, y: number): { col: number; row: number } {
    return { col: Math.floor(x / TILE_SIZE), row: Math.floor(y / TILE_SIZE) }
  }

  getFloorStyle(col: number, row: number): 'wood' | 'tile' | 'carpet' | 'metal' | 'concrete' {
    for (const room of this.rooms) {
      if (col >= room.col1 && col <= room.col2 && row >= room.row1 && row <= room.row2) {
        return room.floorStyle
      }
    }
    return 'wood'
  }

  /** Export the full grid state for serialization / snapshots */
  serialize(): { cols: number; rows: number; tiles: number[][]; rooms: RoomZone[] } {
    // Deep-copy tiles
    const tilesCopy = this.tiles.map((row) => [...row])
    // Deep-copy rooms
    const roomsCopy = this.rooms.map((r) => ({ ...r }))
    return {
      cols: this.cols,
      rows: this.rows,
      tiles: tilesCopy,
      rooms: roomsCopy,
    }
  }

  /** Import grid state from serialized data (resize if needed) */
  deserialize(data: { cols: number; rows: number; tiles: number[][]; rooms: RoomZone[] }): void {
    // Apply tiles — clamp to current grid dimensions
    const rowCount = Math.min(data.tiles.length, this.rows)
    for (let r = 0; r < rowCount; r++) {
      const colCount = Math.min(data.tiles[r].length, this.cols)
      for (let c = 0; c < colCount; c++) {
        this.tiles[r][c] = data.tiles[r][c] as TileType
      }
    }
    // Apply rooms
    this.rooms = data.rooms.map((r) => ({ ...r }))
  }
}
