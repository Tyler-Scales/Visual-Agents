import { Grid, TileType, type RoomZone } from '../engine/Grid'

export interface OfficeSave {
  version: number
  cols: number
  rows: number
  tiles: number[][] // TileType values
  rooms: Array<{
    col1: number
    row1: number
    col2: number
    row2: number
    floorStyle: string
  }>
}

const STORAGE_PREFIX = 'visual-agents-layout-'
const CURRENT_VERSION = 1

export class OfficeStorage {
  /**
   * Serialize the grid to an OfficeSave and store it in localStorage
   * under the key `visual-agents-layout-${name}`.
   */
  saveLayout(name: string, grid: Grid): void {
    const serialized = grid.serialize()
    const save: OfficeSave = {
      version: CURRENT_VERSION,
      cols: serialized.cols,
      rows: serialized.rows,
      tiles: serialized.tiles,
      rooms: serialized.rooms.map((r) => ({
        col1: r.col1,
        row1: r.row1,
        col2: r.col2,
        row2: r.row2,
        floorStyle: r.floorStyle,
      })),
    }
    try {
      localStorage.setItem(STORAGE_PREFIX + name, JSON.stringify(save))
    } catch {
      console.warn(`Failed to save layout "${name}" to localStorage`)
    }
  }

  /**
   * Retrieve and parse a saved layout from localStorage.
   * Returns null if not found or if parsing fails.
   */
  loadLayout(name: string): OfficeSave | null {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + name)
      if (!raw) return null
      const parsed = JSON.parse(raw) as OfficeSave
      // Basic validation
      if (
        typeof parsed.cols !== 'number' ||
        typeof parsed.rows !== 'number' ||
        !Array.isArray(parsed.tiles) ||
        !Array.isArray(parsed.rooms)
      ) {
        return null
      }
      return parsed
    } catch {
      return null
    }
  }

  /**
   * List all saved layout names by scanning localStorage keys.
   */
  listLayouts(): string[] {
    const names: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(STORAGE_PREFIX)) {
        names.push(key.slice(STORAGE_PREFIX.length))
      }
    }
    return names.sort()
  }

  /**
   * Delete a saved layout from localStorage.
   */
  deleteLayout(name: string): void {
    localStorage.removeItem(STORAGE_PREFIX + name)
  }

  /**
   * Deserialize an OfficeSave and apply it to the given grid.
   * This updates all tiles and room zones.
   */
  applyLayout(save: OfficeSave, grid: Grid): void {
    const rooms: RoomZone[] = save.rooms.map((r) => ({
      col1: r.col1,
      row1: r.row1,
      col2: r.col2,
      row2: r.row2,
      floorStyle: r.floorStyle as RoomZone['floorStyle'],
    }))

    grid.deserialize({
      cols: save.cols,
      rows: save.rows,
      tiles: save.tiles,
      rooms,
    })
  }
}
