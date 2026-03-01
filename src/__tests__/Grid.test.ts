import { describe, it, expect } from 'vitest'
import { Grid, TileType, TILE_SIZE } from '../renderer/src/engine/Grid'

describe('Grid', () => {
  it('initializes with EMPTY tiles', () => {
    const grid = new Grid(5, 5)
    expect(grid.getTile(0, 0)).toBe(TileType.EMPTY)
    expect(grid.getTile(4, 4)).toBe(TileType.EMPTY)
  })

  it('sets and gets tiles', () => {
    const grid = new Grid(5, 5)
    grid.setTile(2, 3, TileType.FLOOR)
    expect(grid.getTile(2, 3)).toBe(TileType.FLOOR)
  })

  it('returns EMPTY for out-of-bounds', () => {
    const grid = new Grid(5, 5)
    expect(grid.getTile(-1, 0)).toBe(TileType.EMPTY)
    expect(grid.getTile(5, 0)).toBe(TileType.EMPTY)
    expect(grid.getTile(0, -1)).toBe(TileType.EMPTY)
    expect(grid.getTile(0, 5)).toBe(TileType.EMPTY)
  })

  it('fillRect fills a rectangular region', () => {
    const grid = new Grid(10, 10)
    grid.fillRect(2, 2, 3, 3, TileType.WALL)
    expect(grid.getTile(2, 2)).toBe(TileType.WALL)
    expect(grid.getTile(4, 4)).toBe(TileType.WALL)
    expect(grid.getTile(1, 2)).toBe(TileType.EMPTY)
    expect(grid.getTile(5, 4)).toBe(TileType.EMPTY)
  })

  it('isWalkable returns true for FLOOR, DOOR, CHAIR, STOOL', () => {
    const grid = new Grid(10, 10)
    grid.setTile(0, 0, TileType.FLOOR)
    grid.setTile(1, 0, TileType.DOOR)
    grid.setTile(2, 0, TileType.CHAIR)
    grid.setTile(3, 0, TileType.STOOL)
    grid.setTile(4, 0, TileType.WALL)
    grid.setTile(5, 0, TileType.DESK)

    expect(grid.isWalkable(0, 0)).toBe(true)
    expect(grid.isWalkable(1, 0)).toBe(true)
    expect(grid.isWalkable(2, 0)).toBe(true)
    expect(grid.isWalkable(3, 0)).toBe(true)
    expect(grid.isWalkable(4, 0)).toBe(false)
    expect(grid.isWalkable(5, 0)).toBe(false)
  })

  it('getChairPositions returns all chairs', () => {
    const grid = new Grid(5, 5)
    grid.setTile(1, 1, TileType.CHAIR)
    grid.setTile(3, 2, TileType.CHAIR)
    const chairs = grid.getChairPositions()
    expect(chairs).toHaveLength(2)
    expect(chairs).toContainEqual({ col: 1, row: 1 })
    expect(chairs).toContainEqual({ col: 3, row: 2 })
  })

  it('tileToWorld converts tile coords to world center', () => {
    const grid = new Grid(5, 5)
    const pos = grid.tileToWorld(2, 3)
    expect(pos.x).toBe(2 * TILE_SIZE + TILE_SIZE / 2)
    expect(pos.y).toBe(3 * TILE_SIZE + TILE_SIZE / 2)
  })

  it('worldToTile converts world coords to tile', () => {
    const grid = new Grid(5, 5)
    const tile = grid.worldToTile(80, 112)
    expect(tile.col).toBe(Math.floor(80 / TILE_SIZE))
    expect(tile.row).toBe(Math.floor(112 / TILE_SIZE))
  })

  it('getFloorStyle returns room style or default wood', () => {
    const grid = new Grid(10, 10)
    grid.rooms = [{ col1: 2, row1: 2, col2: 5, row2: 5, floorStyle: 'metal' }]
    expect(grid.getFloorStyle(3, 3)).toBe('metal')
    expect(grid.getFloorStyle(0, 0)).toBe('wood')
  })

  it('serialize and deserialize round-trips', () => {
    const grid = new Grid(5, 5)
    grid.setTile(1, 1, TileType.WALL)
    grid.setTile(2, 2, TileType.FLOOR)
    grid.rooms = [{ col1: 0, row1: 0, col2: 4, row2: 4, floorStyle: 'carpet' }]

    const data = grid.serialize()
    const grid2 = new Grid(5, 5)
    grid2.deserialize(data)

    expect(grid2.getTile(1, 1)).toBe(TileType.WALL)
    expect(grid2.getTile(2, 2)).toBe(TileType.FLOOR)
    expect(grid2.rooms).toHaveLength(1)
    expect(grid2.rooms[0].floorStyle).toBe('carpet')
  })
})
