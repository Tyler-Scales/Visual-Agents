import { describe, it, expect } from 'vitest'
import { Grid, TileType } from '../renderer/src/engine/Grid'
import { bfs } from '../renderer/src/characters/Pathfinding'

describe('BFS Pathfinding', () => {
  function makeSimpleGrid(): Grid {
    const grid = new Grid(5, 5)
    // Create a small floor area
    grid.fillRect(0, 0, 5, 5, TileType.FLOOR)
    return grid
  }

  it('returns empty path when start equals end', () => {
    const grid = makeSimpleGrid()
    const path = bfs(grid, { col: 2, row: 2 }, { col: 2, row: 2 })
    expect(path).toHaveLength(0)
  })

  it('finds a straight-line path', () => {
    const grid = makeSimpleGrid()
    const path = bfs(grid, { col: 0, row: 0 }, { col: 4, row: 0 })
    expect(path.length).toBeGreaterThan(0)
    // Path should end at destination
    expect(path[path.length - 1]).toEqual({ col: 4, row: 0 })
    // Path should not include start
    expect(path[0]).not.toEqual({ col: 0, row: 0 })
  })

  it('navigates around walls', () => {
    const grid = new Grid(5, 5)
    grid.fillRect(0, 0, 5, 5, TileType.FLOOR)
    // Put a wall in the middle row except for a gap at col 4
    grid.setTile(0, 2, TileType.WALL)
    grid.setTile(1, 2, TileType.WALL)
    grid.setTile(2, 2, TileType.WALL)
    grid.setTile(3, 2, TileType.WALL)
    // Col 4, row 2 is still floor — the gap

    const path = bfs(grid, { col: 0, row: 0 }, { col: 0, row: 4 })
    expect(path.length).toBeGreaterThan(0)
    expect(path[path.length - 1]).toEqual({ col: 0, row: 4 })
    // Path should go through the gap at col 4
    const goesThrough4 = path.some((p) => p.col === 4 && p.row === 2)
    expect(goesThrough4).toBe(true)
  })

  it('returns empty path when no route exists', () => {
    const grid = new Grid(5, 5)
    grid.fillRect(0, 0, 5, 5, TileType.FLOOR)
    // Complete wall barrier
    for (let c = 0; c < 5; c++) {
      grid.setTile(c, 2, TileType.WALL)
    }

    const path = bfs(grid, { col: 0, row: 0 }, { col: 0, row: 4 })
    expect(path).toHaveLength(0)
  })

  it('can pathfind through doors', () => {
    const grid = new Grid(5, 5)
    grid.fillRect(0, 0, 5, 5, TileType.WALL)
    grid.setTile(0, 0, TileType.FLOOR)
    grid.setTile(1, 0, TileType.DOOR)
    grid.setTile(2, 0, TileType.FLOOR)

    const path = bfs(grid, { col: 0, row: 0 }, { col: 2, row: 0 })
    expect(path.length).toBe(2)
    expect(path[0]).toEqual({ col: 1, row: 0 })
    expect(path[1]).toEqual({ col: 2, row: 0 })
  })

  it('finds shortest path (BFS guarantees this)', () => {
    const grid = makeSimpleGrid()
    const path = bfs(grid, { col: 0, row: 0 }, { col: 2, row: 2 })
    // Manhattan distance is 4, BFS should find path of length 4
    expect(path).toHaveLength(4)
  })
})
