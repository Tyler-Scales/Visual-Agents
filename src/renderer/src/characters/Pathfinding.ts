import { Grid } from '../engine/Grid'

interface TilePos {
  col: number
  row: number
}

const DIRS = [
  { dc: 0, dr: -1 }, // up
  { dc: 0, dr: 1 },  // down
  { dc: -1, dr: 0 }, // left
  { dc: 1, dr: 0 }   // right
]

export function bfs(grid: Grid, start: TilePos, end: TilePos): TilePos[] {
  if (start.col === end.col && start.row === end.row) return []

  const key = (c: number, r: number) => `${c},${r}`
  const visited = new Set<string>()
  const parent = new Map<string, string>()
  const queue: TilePos[] = [start]
  visited.add(key(start.col, start.row))

  while (queue.length > 0) {
    const current = queue.shift()!
    if (current.col === end.col && current.row === end.row) {
      return reconstructPath(parent, start, end)
    }

    for (const dir of DIRS) {
      const nc = current.col + dir.dc
      const nr = current.row + dir.dr
      const nk = key(nc, nr)

      if (!visited.has(nk) && grid.isWalkable(nc, nr)) {
        visited.add(nk)
        parent.set(nk, key(current.col, current.row))
        queue.push({ col: nc, row: nr })
      }
    }
  }

  return [] // no path found
}

function reconstructPath(parent: Map<string, string>, start: TilePos, end: TilePos): TilePos[] {
  const key = (c: number, r: number) => `${c},${r}`
  const path: TilePos[] = []
  let current = key(end.col, end.row)
  const startKey = key(start.col, start.row)

  while (current !== startKey) {
    const [c, r] = current.split(',').map(Number)
    path.unshift({ col: c, row: r })
    const p = parent.get(current)
    if (!p) break
    current = p
  }

  return path
}
