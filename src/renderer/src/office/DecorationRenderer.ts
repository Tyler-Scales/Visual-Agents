import type { Grid } from '../engine/Grid'

/**
 * Decorations are now rendered inline by TileRenderer for each tile type.
 * This module is kept as a no-op for API compatibility.
 */
export function drawDecorations(_ctx: CanvasRenderingContext2D, _grid: Grid): void {
  // All decorations (monitors, mugs, plants, etc.) are drawn
  // directly by TileRenderer as part of each tile's draw function.
}
