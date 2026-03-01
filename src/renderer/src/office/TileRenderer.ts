import { TileType, type Grid } from '../engine/Grid'

// === FLOOR PALETTES ===
const WOOD = { a: '#c4a97d', b: '#b99e74', dark: '#a88e68', line: 'rgba(0,0,0,0.07)', grain: 'rgba(0,0,0,0.04)' }
const TILE_F = { a: '#e2d8ca', b: '#ddd2c2', grout: '#c8bfb0', shine: 'rgba(255,255,255,0.06)' }
const CARPET = { a: '#3a5070', b: '#354b68', dot: 'rgba(255,255,255,0.04)' }
const METAL = { a: '#6a6e78', b: '#5e6270', seam: 'rgba(0,0,0,0.12)', shine: 'rgba(255,255,255,0.08)', rivet: '#555860' }
const CONCRETE = { a: '#8a8a88', b: '#828280', speckle1: 'rgba(0,0,0,0.06)', speckle2: 'rgba(255,255,255,0.04)', crack: 'rgba(0,0,0,0.08)' }

// === WALL COLORS ===
const WALL_C = { face: '#2c2c42', top: '#3a3a54', highlight: '#45456a', edge: '#222236', brick: 'rgba(0,0,0,0.08)' }

// Global frame counter for animations (updated externally via setAnimFrame)
let globalAnimFrame = 0

export function setAnimFrame(frame: number): void {
  globalAnimFrame = frame
}

export function drawTile(
  ctx: CanvasRenderingContext2D,
  type: TileType,
  x: number,
  y: number,
  s: number,
  grid: Grid,
  col: number,
  row: number
): void {
  const floorStyle = grid.getFloorStyle(col, row)

  switch (type) {
    case TileType.EMPTY:
      ctx.fillStyle = '#111122'
      ctx.fillRect(x, y, s, s)
      break
    case TileType.FLOOR:
      drawFloor(ctx, x, y, s, col, row, floorStyle)
      break
    case TileType.WALL:
      drawWall(ctx, x, y, s, grid, col, row)
      break
    case TileType.DESK:
      drawFloor(ctx, x, y, s, col, row, floorStyle)
      drawDesk(ctx, x, y, s, grid, col, row)
      break
    case TileType.CHAIR:
      drawFloor(ctx, x, y, s, col, row, floorStyle)
      drawChair(ctx, x, y, s)
      break
    case TileType.BOOKSHELF:
      drawFloor(ctx, x, y, s, col, row, floorStyle)
      drawBookshelf(ctx, x, y, s)
      break
    case TileType.DOOR:
      drawDoor(ctx, x, y, s, floorStyle)
      break
    case TileType.COUCH:
      drawFloor(ctx, x, y, s, col, row, floorStyle)
      drawCouch(ctx, x, y, s, grid, col, row)
      break
    case TileType.VENDING:
      drawFloor(ctx, x, y, s, col, row, floorStyle)
      drawVending(ctx, x, y, s, col)
      break
    case TileType.COUNTER:
      drawFloor(ctx, x, y, s, col, row, floorStyle)
      drawCounter(ctx, x, y, s)
      break
    case TileType.PLANT_TILE:
      drawFloor(ctx, x, y, s, col, row, floorStyle)
      drawPlant(ctx, x, y, s)
      break
    case TileType.WATER_COOLER:
      drawFloor(ctx, x, y, s, col, row, floorStyle)
      drawWaterCooler(ctx, x, y, s)
      break
    case TileType.PAINTING:
      drawFloor(ctx, x, y, s, col, row, floorStyle)
      drawPainting(ctx, x, y, s)
      break
    case TileType.CLOCK:
      drawFloor(ctx, x, y, s, col, row, floorStyle)
      drawClock(ctx, x, y, s)
      break
    case TileType.SERVER_RACK:
      drawFloor(ctx, x, y, s, col, row, floorStyle)
      drawServerRack(ctx, x, y, s)
      break
    case TileType.WHITEBOARD:
      drawFloor(ctx, x, y, s, col, row, floorStyle)
      drawWhiteboard(ctx, x, y, s)
      break
    case TileType.CONFERENCE_TABLE:
      drawFloor(ctx, x, y, s, col, row, floorStyle)
      drawConferenceTable(ctx, x, y, s, grid, col, row)
      break
    case TileType.STOOL:
      drawFloor(ctx, x, y, s, col, row, floorStyle)
      drawStool(ctx, x, y, s)
      break
    case TileType.ESPRESSO_MACHINE:
      drawFloor(ctx, x, y, s, col, row, floorStyle)
      drawEspressoMachine(ctx, x, y, s)
      break
  }
}

/** Draw wall depth shadow on floor tiles below a wall */
export function drawWallShadows(ctx: CanvasRenderingContext2D, grid: Grid, x: number, y: number, s: number, col: number, row: number): void {
  const above = grid.getTile(col, row - 1)
  if (above === TileType.WALL) {
    // Wall front face overhang
    ctx.fillStyle = WALL_C.face
    ctx.fillRect(x, y, s, 8)
    ctx.fillStyle = WALL_C.edge
    ctx.fillRect(x, y + 6, s, 2)
    // Gradient shadow fade
    ctx.fillStyle = 'rgba(0,0,0,0.12)'
    ctx.fillRect(x, y + 8, s, 3)
    ctx.fillStyle = 'rgba(0,0,0,0.06)'
    ctx.fillRect(x, y + 11, s, 2)
  }
}

// ============ FLOORS ============

function drawFloor(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, col: number, row: number, style: 'wood' | 'tile' | 'carpet' | 'metal' | 'concrete'): void {
  const alt = (col + row) % 2 === 0
  switch (style) {
    case 'wood': drawWoodFloor(ctx, x, y, s, alt, col, row); break
    case 'tile': drawTileFloor(ctx, x, y, s, alt); break
    case 'carpet': drawCarpetFloor(ctx, x, y, s, alt, col, row); break
    case 'metal': drawMetalFloor(ctx, x, y, s, alt, col, row); break
    case 'concrete': drawConcreteFloor(ctx, x, y, s, alt, col, row); break
  }
}

function drawWoodFloor(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, alt: boolean, col: number, _row: number): void {
  // Base color
  ctx.fillStyle = alt ? WOOD.a : WOOD.b
  ctx.fillRect(x, y, s, s)

  // Horizontal plank lines
  ctx.fillStyle = WOOD.grain
  ctx.fillRect(x, y + 7, s, 1)
  ctx.fillRect(x, y + 15, s, 1)
  ctx.fillRect(x, y + 23, s, 1)

  // Vertical plank joints (staggered)
  const offset = (col % 3) * 10 + 4
  ctx.fillStyle = WOOD.line
  ctx.fillRect(x + (offset % s), y, 1, 8)
  ctx.fillRect(x + ((offset + 16) % s), y + 8, 1, 8)
  ctx.fillRect(x + ((offset + 8) % s), y + 16, 1, 8)
  ctx.fillRect(x + ((offset + 24) % s), y + 24, 1, 8)

  // Subtle wood grain dots
  ctx.fillStyle = WOOD.grain
  const seed = (col * 7 + _row * 13) % 10
  ctx.fillRect(x + 4 + seed, y + 4, 2, 1)
  ctx.fillRect(x + 18 - seed, y + 12, 3, 1)
  ctx.fillRect(x + 8 + seed, y + 20, 2, 1)
  ctx.fillRect(x + 22 - seed, y + 28, 2, 1)

  // Edge border
  ctx.fillStyle = WOOD.line
  ctx.fillRect(x, y + s - 1, s, 1)
}

function drawTileFloor(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, alt: boolean): void {
  ctx.fillStyle = alt ? TILE_F.a : TILE_F.b
  ctx.fillRect(x, y, s, s)

  // Grout lines
  ctx.fillStyle = TILE_F.grout
  ctx.fillRect(x, y + s - 1, s, 1)
  ctx.fillRect(x + s - 1, y, 1, s)

  // Subtle shine highlight
  ctx.fillStyle = TILE_F.shine
  ctx.fillRect(x + 4, y + 4, 6, 6)
  ctx.fillRect(x + 3, y + 5, 1, 4)
  ctx.fillRect(x + 10, y + 5, 1, 4)
}

function drawCarpetFloor(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, alt: boolean, col: number, row: number): void {
  ctx.fillStyle = alt ? CARPET.a : CARPET.b
  ctx.fillRect(x, y, s, s)

  // Carpet texture dots
  ctx.fillStyle = CARPET.dot
  const seed = (col * 7 + row * 13) % 8
  ctx.fillRect(x + 5 + seed, y + 8, 1, 1)
  ctx.fillRect(x + 15 - seed, y + 20, 1, 1)
  ctx.fillRect(x + 10, y + 4 + seed, 1, 1)
  ctx.fillRect(x + 22 - seed, y + 14, 1, 1)
  ctx.fillRect(x + 8 + seed, y + 26, 1, 1)
}

function drawMetalFloor(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, alt: boolean, col: number, row: number): void {
  // Base metallic gray
  ctx.fillStyle = alt ? METAL.a : METAL.b
  ctx.fillRect(x, y, s, s)

  // Seam lines (grid pattern)
  ctx.fillStyle = METAL.seam
  ctx.fillRect(x, y + s - 1, s, 1)
  ctx.fillRect(x + s - 1, y, 1, s)

  // Diagonal shine highlight
  ctx.fillStyle = METAL.shine
  ctx.fillRect(x + 4, y + 2, 8, 2)
  ctx.fillRect(x + 6, y + 4, 4, 1)

  // Rivets at corners
  ctx.fillStyle = METAL.rivet
  ctx.fillRect(x + 2, y + 2, 2, 2)
  ctx.fillRect(x + s - 4, y + 2, 2, 2)
  ctx.fillRect(x + 2, y + s - 4, 2, 2)
  ctx.fillRect(x + s - 4, y + s - 4, 2, 2)

  // Rivet highlights
  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  ctx.fillRect(x + 2, y + 2, 1, 1)
  ctx.fillRect(x + s - 4, y + 2, 1, 1)
  ctx.fillRect(x + 2, y + s - 4, 1, 1)
  ctx.fillRect(x + s - 4, y + s - 4, 1, 1)

  // Anti-slip texture pattern
  const seed = (col * 11 + row * 7) % 6
  ctx.fillStyle = 'rgba(255,255,255,0.03)'
  ctx.fillRect(x + 10 + seed, y + 10, 2, 2)
  ctx.fillRect(x + 20 - seed, y + 18, 2, 2)
  ctx.fillRect(x + 14, y + 24 - seed, 2, 2)
}

function drawConcreteFloor(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, alt: boolean, col: number, row: number): void {
  // Base concrete gray
  ctx.fillStyle = alt ? CONCRETE.a : CONCRETE.b
  ctx.fillRect(x, y, s, s)

  // Aggregate speckles
  const seed = (col * 13 + row * 7) % 10
  ctx.fillStyle = CONCRETE.speckle1
  ctx.fillRect(x + 3 + seed, y + 5, 1, 1)
  ctx.fillRect(x + 14 - seed, y + 11, 2, 1)
  ctx.fillRect(x + 8 + seed, y + 22, 1, 2)
  ctx.fillRect(x + 20, y + 7 + seed, 1, 1)
  ctx.fillRect(x + 25 - seed, y + 18, 2, 1)

  // Light speckles
  ctx.fillStyle = CONCRETE.speckle2
  ctx.fillRect(x + 7, y + 3 + seed, 1, 1)
  ctx.fillRect(x + 18 + seed, y + 14, 1, 1)
  ctx.fillRect(x + 12 - seed, y + 26, 2, 1)
  ctx.fillRect(x + 22, y + 9 - seed, 1, 1)

  // Subtle crack line
  const crackSeed = (col * 3 + row * 5) % 4
  if (crackSeed === 0) {
    ctx.fillStyle = CONCRETE.crack
    ctx.fillRect(x + 8, y + 12, 6, 1)
    ctx.fillRect(x + 13, y + 13, 1, 4)
  } else if (crackSeed === 1) {
    ctx.fillStyle = CONCRETE.crack
    ctx.fillRect(x + 16, y + 8, 1, 5)
    ctx.fillRect(x + 17, y + 12, 4, 1)
  }

  // Subtle edge lines
  ctx.fillStyle = 'rgba(0,0,0,0.03)'
  ctx.fillRect(x, y + s - 1, s, 1)
  ctx.fillRect(x + s - 1, y, 1, s)
}

// ============ WALLS ============

function drawWall(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, grid: Grid, col: number, row: number): void {
  const below = grid.getTile(col, row + 1)
  const isTopEdge = below !== TileType.WALL && below !== TileType.EMPTY

  if (isTopEdge) {
    // Front-facing wall (visible from top)
    ctx.fillStyle = WALL_C.top
    ctx.fillRect(x, y, s, s)

    // Top highlight strip
    ctx.fillStyle = WALL_C.highlight
    ctx.fillRect(x, y, s, 3)

    // Brick texture
    ctx.fillStyle = WALL_C.brick
    const off = col % 2 === 0 ? 0 : 16
    ctx.fillRect(x + off, y + 8, 16, 1)
    ctx.fillRect(x + off, y + 18, 16, 1)
    ctx.fillRect(x + off, y + 28, 16, 1)
    ctx.fillRect(x + 8 + off, y + 13, 1, 5)
    ctx.fillRect(x + 24 - off, y + 23, 1, 5)
  } else {
    // Interior/top wall
    ctx.fillStyle = WALL_C.face
    ctx.fillRect(x, y, s, s)

    // Subtle texture
    ctx.fillStyle = 'rgba(255,255,255,0.02)'
    ctx.fillRect(x + 4, y + 4, 8, 8)
    ctx.fillRect(x + 20, y + 20, 8, 8)
  }

  // Vertical edge highlight
  const left = grid.getTile(col - 1, row)
  if (left !== TileType.WALL && left !== TileType.EMPTY) {
    ctx.fillStyle = WALL_C.highlight
    ctx.fillRect(x, y, 2, s)
  }
}

// ============ FURNITURE ============

function drawDesk(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, grid: Grid, col: number, row: number): void {
  const hasAboveDesk = grid.getTile(col, row - 1) === TileType.DESK
  const hasBelowDesk = grid.getTile(col, row + 1) === TileType.DESK
  const hasRightDesk = grid.getTile(col + 1, row) === TileType.DESK

  // Desk surface
  ctx.fillStyle = '#9a7a40'
  ctx.fillRect(x + 2, y + 2, s - 4, s - 4)

  // Top edge highlight
  ctx.fillStyle = '#b08e50'
  ctx.fillRect(x + 2, y + 2, s - 4, 2)

  // Wood grain lines
  ctx.fillStyle = 'rgba(0,0,0,0.06)'
  ctx.fillRect(x + 4, y + 10, s - 8, 1)
  ctx.fillRect(x + 6, y + 18, s - 10, 1)
  ctx.fillRect(x + 4, y + 25, s - 8, 1)

  // Darker shade at bottom
  ctx.fillStyle = '#876b35'
  ctx.fillRect(x + 2, y + s - 6, s - 4, 4)

  // Connect to adjacent desks
  if (hasRightDesk) {
    ctx.fillStyle = '#9a7a40'
    ctx.fillRect(x + s - 2, y + 2, 4, s - 4)
  }
  if (hasBelowDesk) {
    ctx.fillStyle = '#9a7a40'
    ctx.fillRect(x + 2, y + s - 2, s - 4, 4)
  }

  // Front face of desk
  if (!hasBelowDesk) {
    ctx.fillStyle = '#6b5528'
    ctx.fillRect(x + 2, y + s - 6, s - 4, 4)
    ctx.fillStyle = '#5a471f'
    ctx.fillRect(x + 2, y + s - 2, s - 4, 2)
    // Drawer handle
    ctx.fillStyle = '#8a7a50'
    ctx.fillRect(x + 12, y + s - 5, 6, 2)
    // Desk legs
    ctx.fillStyle = '#4a3a15'
    ctx.fillRect(x + 3, y + s - 2, 3, 2)
    ctx.fillRect(x + s - 6, y + s - 2, 3, 2)
  }

  // === ITEMS ON DESK ===
  // Back row: monitor
  if (!hasAboveDesk) {
    // Monitor body
    ctx.fillStyle = '#2a2a3a'
    ctx.fillRect(x + 4, y + 3, 22, 14)
    // Screen
    ctx.fillStyle = '#3a6888'
    ctx.fillRect(x + 5, y + 4, 20, 12)
    // Code lines on screen
    ctx.fillStyle = '#66aacc'
    ctx.fillRect(x + 7, y + 6, 10, 1)
    ctx.fillRect(x + 7, y + 8, 14, 1)
    ctx.fillStyle = '#88ccaa'
    ctx.fillRect(x + 9, y + 10, 8, 1)
    ctx.fillRect(x + 7, y + 12, 12, 1)
    ctx.fillStyle = '#cc9966'
    ctx.fillRect(x + 7, y + 14, 6, 1)
    // Screen glow
    ctx.fillStyle = 'rgba(100,180,220,0.15)'
    ctx.fillRect(x + 6, y + 4, 4, 4)
    // Monitor stand
    ctx.fillStyle = '#2a2a3a'
    ctx.fillRect(x + 12, y + 17, 6, 3)
    ctx.fillRect(x + 8, y + 20, 14, 2)
    // Monitor bezel highlight
    ctx.fillStyle = '#3a3a4a'
    ctx.fillRect(x + 4, y + 3, 22, 1)
  }

  // Front row: keyboard + mouse
  if (hasAboveDesk) {
    // Keyboard
    ctx.fillStyle = '#333340'
    ctx.fillRect(x + 5, y + 5, 16, 8)
    ctx.fillStyle = '#444455'
    ctx.fillRect(x + 6, y + 6, 14, 6)
    // Key grid
    ctx.fillStyle = '#555566'
    for (let kx = 0; kx < 5; kx++) {
      for (let ky = 0; ky < 3; ky++) {
        ctx.fillRect(x + 7 + kx * 3, y + 7 + ky * 2, 2, 1)
      }
    }
    // Spacebar
    ctx.fillStyle = '#4a4a5a'
    ctx.fillRect(x + 10, y + 12, 8, 1)

    // Mouse + pad
    ctx.fillStyle = '#444450'
    ctx.fillRect(x + 23, y + 6, 6, 8)
    ctx.fillStyle = '#555560'
    ctx.fillRect(x + 24, y + 7, 4, 5)
    ctx.fillStyle = '#666670'
    ctx.fillRect(x + 24, y + 7, 4, 2)

    // Mug (on some desks)
    if (col % 3 === 0) {
      // Mug body
      ctx.fillStyle = '#e0d8cc'
      ctx.fillRect(x + 2, y + 15, 6, 8)
      // Coffee inside
      ctx.fillStyle = '#5c3a1a'
      ctx.fillRect(x + 3, y + 15, 4, 3)
      // Mug handle
      ctx.fillStyle = '#d0c8bc'
      ctx.fillRect(x + 8, y + 17, 2, 4)
      ctx.fillRect(x + 8, y + 17, 2, 1)
      ctx.fillRect(x + 8, y + 20, 2, 1)
    }

    // Notepad on some other desks
    if (col % 3 === 1) {
      ctx.fillStyle = '#f0ead8'
      ctx.fillRect(x + 2, y + 16, 8, 10)
      ctx.fillStyle = '#ddd8c8'
      ctx.fillRect(x + 3, y + 18, 6, 1)
      ctx.fillRect(x + 3, y + 20, 4, 1)
      ctx.fillRect(x + 3, y + 22, 5, 1)
      // Pencil
      ctx.fillStyle = '#c8a030'
      ctx.fillRect(x + 2, y + 26, 8, 1)
      ctx.fillStyle = '#eee'
      ctx.fillRect(x + 2, y + 26, 2, 1)
    }
  }
}

function drawChair(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  const cx = x + s / 2
  const cy = y + s / 2

  // Chair shadow
  ctx.fillStyle = 'rgba(0,0,0,0.08)'
  ctx.fillRect(cx - 10, cy + 4, 20, 6)

  // Wheel base (5-star)
  ctx.fillStyle = '#3a3a3a'
  ctx.fillRect(cx - 8, cy + 6, 16, 3)
  ctx.fillRect(cx - 2, cy + 4, 4, 2)

  // Seat cushion
  ctx.fillStyle = '#6a6050'
  ctx.fillRect(cx - 10, cy - 4, 20, 10)
  ctx.fillStyle = '#7a7060'
  ctx.fillRect(cx - 9, cy - 3, 18, 8)
  // Cushion highlight
  ctx.fillStyle = '#8a8070'
  ctx.fillRect(cx - 7, cy - 2, 14, 3)

  // Backrest
  ctx.fillStyle = '#5a5545'
  ctx.fillRect(cx - 10, cy - 10, 20, 7)
  ctx.fillStyle = '#6a6555'
  ctx.fillRect(cx - 9, cy - 9, 18, 5)
  // Backrest detail
  ctx.fillStyle = '#7a7565'
  ctx.fillRect(cx - 7, cy - 8, 14, 2)

  // Armrests
  ctx.fillStyle = '#4a4540'
  ctx.fillRect(cx - 12, cy - 6, 3, 10)
  ctx.fillRect(cx + 9, cy - 6, 3, 10)
  // Armrest tops
  ctx.fillStyle = '#5a5550'
  ctx.fillRect(cx - 12, cy - 6, 3, 2)
  ctx.fillRect(cx + 9, cy - 6, 3, 2)
}

function drawBookshelf(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  // Frame
  ctx.fillStyle = '#5a3a20'
  ctx.fillRect(x, y, s, s)
  // Back panel
  ctx.fillStyle = '#4a2a15'
  ctx.fillRect(x + 2, y + 2, s - 4, s - 4)

  // Shelf planks
  ctx.fillStyle = '#6a4a28'
  ctx.fillRect(x + 2, y + 10, s - 4, 2)
  ctx.fillRect(x + 2, y + 21, s - 4, 2)

  // Top shelf: colorful books
  const topBooks = ['#8b2020', '#7a2030', '#204070', '#6b3020', '#205030', '#503060', '#704020', '#206060']
  for (let i = 0; i < 8; i++) {
    const bw = 3
    const bh = 6 + (i % 3)
    ctx.fillStyle = topBooks[i % topBooks.length]
    ctx.fillRect(x + 3 + i * bw + i, y + 10 - bh, bw, bh)
    // Book highlight
    ctx.fillStyle = 'rgba(255,255,255,0.12)'
    ctx.fillRect(x + 3 + i * bw + i, y + 10 - bh, 1, bh)
  }

  // Middle shelf: books + small item
  const midBooks = ['#205040', '#704020', '#303080', '#804030', '#406040', '#602040']
  for (let i = 0; i < 6; i++) {
    const bw = 3 + (i % 2)
    const bh = 7 + (i % 3)
    ctx.fillStyle = midBooks[i % midBooks.length]
    ctx.fillRect(x + 3 + i * 4 + i, y + 21 - bh, bw, bh)
  }

  // Bottom shelf: box files and folders
  ctx.fillStyle = '#c0a060'
  ctx.fillRect(x + 3, y + 23, 10, 7)
  ctx.fillStyle = '#b09050'
  ctx.fillRect(x + 4, y + 24, 8, 5)
  // Label
  ctx.fillStyle = '#f0e8d0'
  ctx.fillRect(x + 5, y + 25, 6, 3)

  ctx.fillStyle = '#707090'
  ctx.fillRect(x + 15, y + 23, 8, 7)
  ctx.fillStyle = '#606080'
  ctx.fillRect(x + 16, y + 24, 6, 5)

  ctx.fillStyle = '#556655'
  ctx.fillRect(x + 25, y + 23, 4, 7)
}

function drawCouch(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, grid: Grid, col: number, row: number): void {
  const aboveCouch = grid.getTile(col, row - 1) === TileType.COUCH
  const belowCouch = grid.getTile(col, row + 1) === TileType.COUCH

  // Couch body
  ctx.fillStyle = '#8b3030'
  ctx.fillRect(x + 2, y, s - 4, s)

  // Cushion
  ctx.fillStyle = '#a04040'
  ctx.fillRect(x + 8, y + 3, s - 10, s - 6)

  // Cushion highlight
  ctx.fillStyle = '#b05050'
  ctx.fillRect(x + 10, y + 5, s - 14, 4)

  // Back rest
  ctx.fillStyle = '#7a2828'
  ctx.fillRect(x + 2, y, 6, s)

  // Armrests
  if (!aboveCouch) {
    ctx.fillStyle = '#7a2828'
    ctx.fillRect(x + 2, y, s - 4, 5)
    ctx.fillStyle = '#8b3030'
    ctx.fillRect(x + 4, y + 2, s - 8, 2)
  }
  if (!belowCouch) {
    ctx.fillStyle = '#7a2828'
    ctx.fillRect(x + 2, y + s - 5, s - 4, 5)
    ctx.fillStyle = '#8b3030'
    ctx.fillRect(x + 4, y + s - 3, s - 8, 2)
  }

  // Cushion stitch lines
  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  ctx.fillRect(x + 12, y + 8, s - 16, 1)
  ctx.fillRect(x + 12, y + s - 10, s - 16, 1)
}

function drawVending(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, col: number): void {
  // Machine body
  ctx.fillStyle = '#3a3a4a'
  ctx.fillRect(x + 2, y, s - 4, s)
  // Front panel
  ctx.fillStyle = '#4a4a5a'
  ctx.fillRect(x + 3, y + 1, s - 6, s - 2)

  // Display window
  const isSnack = col % 2 === 0
  ctx.fillStyle = isSnack ? '#2a5a4a' : '#5a2a2a'
  ctx.fillRect(x + 5, y + 3, s - 10, 14)

  // Items in window
  ctx.fillStyle = isSnack ? '#40806a' : '#804040'
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      ctx.fillRect(x + 7 + j * 6, y + 4 + i * 4, 4, 3)
    }
  }
  // Shelf lines in window
  ctx.fillStyle = 'rgba(0,0,0,0.2)'
  ctx.fillRect(x + 5, y + 7, s - 10, 1)
  ctx.fillRect(x + 5, y + 11, s - 10, 1)

  // Buttons panel
  ctx.fillStyle = '#555560'
  ctx.fillRect(x + 5, y + 18, 8, 4)
  ctx.fillStyle = '#888890'
  ctx.fillRect(x + 6, y + 19, 2, 2)
  ctx.fillRect(x + 9, y + 19, 2, 2)

  // Delivery slot
  ctx.fillStyle = '#222230'
  ctx.fillRect(x + 8, y + 24, 10, 4)
  ctx.fillStyle = '#333340'
  ctx.fillRect(x + 9, y + 25, 8, 2)

  // Brand stripe
  ctx.fillStyle = isSnack ? '#308060' : '#803030'
  ctx.fillRect(x + 3, y + s - 3, s - 6, 2)
}

function drawCounter(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  // Counter top surface
  ctx.fillStyle = '#d0c0a0'
  ctx.fillRect(x, y + 4, s, s - 8)
  // Top surface highlight
  ctx.fillStyle = '#e0d0b0'
  ctx.fillRect(x, y + 4, s, 5)

  // Front face
  ctx.fillStyle = '#b0a080'
  ctx.fillRect(x, y + s - 7, s, 7)
  ctx.fillStyle = '#9a8a70'
  ctx.fillRect(x, y + s - 2, s, 2)

  // Cabinet doors
  ctx.fillStyle = '#a09070'
  ctx.fillRect(x + 3, y + s - 10, 10, 8)
  ctx.fillRect(x + 16, y + s - 10, 10, 8)
  // Door handles
  ctx.fillStyle = '#c0b090'
  ctx.fillRect(x + 10, y + s - 7, 3, 2)
  ctx.fillRect(x + 23, y + s - 7, 3, 2)

  // Items on counter
  // Coffee maker
  ctx.fillStyle = '#2a2a2a'
  ctx.fillRect(x + 4, y + 4, 8, 10)
  ctx.fillStyle = '#3a3a3a'
  ctx.fillRect(x + 5, y + 5, 6, 6)
  ctx.fillStyle = '#cc4444'
  ctx.fillRect(x + 5, y + 12, 2, 2)
}

function drawWaterCooler(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  // Base stand
  ctx.fillStyle = '#e0e0e0'
  ctx.fillRect(x + 8, y + 16, 16, 14)
  ctx.fillStyle = '#d0d0d0'
  ctx.fillRect(x + 6, y + 26, 20, 4)

  // Water jug
  ctx.fillStyle = '#a0d0e8'
  ctx.fillRect(x + 10, y + 2, 12, 16)
  ctx.fillStyle = '#80c0d8'
  ctx.fillRect(x + 12, y + 3, 8, 13)
  // Water level inside
  ctx.fillStyle = '#70b8d0'
  ctx.fillRect(x + 12, y + 8, 8, 8)
  // Highlight on jug
  ctx.fillStyle = 'rgba(255,255,255,0.2)'
  ctx.fillRect(x + 12, y + 4, 2, 8)

  // Spout area
  ctx.fillStyle = '#cccccc'
  ctx.fillRect(x + 8, y + 18, 4, 4)
  ctx.fillStyle = '#4488cc'
  ctx.fillRect(x + 9, y + 19, 2, 2)

  // Cap
  ctx.fillStyle = '#c0c0c0'
  ctx.fillRect(x + 10, y, 12, 3)
}

function drawPlant(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  // Pot
  ctx.fillStyle = '#a0522d'
  ctx.fillRect(x + 8, y + 20, 16, 8)
  ctx.fillStyle = '#8b4513'
  ctx.fillRect(x + 6, y + 28, 20, 4)
  // Pot rim
  ctx.fillStyle = '#b86b3a'
  ctx.fillRect(x + 6, y + 20, 20, 2)

  // Soil
  ctx.fillStyle = '#3a2010'
  ctx.fillRect(x + 9, y + 20, 14, 2)

  // Stem
  ctx.fillStyle = '#2a6a2a'
  ctx.fillRect(x + 15, y + 14, 2, 6)

  // Leaves cluster
  ctx.fillStyle = '#2a7a2a'
  ctx.fillRect(x + 6, y + 4, 20, 14)
  ctx.fillStyle = '#38963a'
  ctx.fillRect(x + 8, y + 2, 16, 12)
  ctx.fillStyle = '#45aa48'
  ctx.fillRect(x + 4, y + 6, 10, 8)
  ctx.fillRect(x + 18, y + 4, 10, 8)
  // Individual leaf highlights
  ctx.fillStyle = '#55bb55'
  ctx.fillRect(x + 6, y + 4, 4, 4)
  ctx.fillRect(x + 20, y + 6, 4, 4)
  ctx.fillRect(x + 12, y + 1, 6, 3)
  // Leaf tips
  ctx.fillStyle = '#60cc60'
  ctx.fillRect(x + 4, y + 8, 2, 2)
  ctx.fillRect(x + 26, y + 6, 2, 2)
  ctx.fillRect(x + 14, y, 4, 2)
}

function drawPainting(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  // Frame
  ctx.fillStyle = '#6a4a20'
  ctx.fillRect(x + 2, y + 2, s - 4, s - 8)
  // Inner frame
  ctx.fillStyle = '#7a5a30'
  ctx.fillRect(x + 3, y + 3, s - 6, 1)
  ctx.fillRect(x + 3, y + 3, 1, s - 10)

  // Canvas
  ctx.fillStyle = '#88b0d0'
  ctx.fillRect(x + 4, y + 4, s - 8, s - 12)

  // Landscape: sky
  ctx.fillStyle = '#7aa0c0'
  ctx.fillRect(x + 4, y + 4, s - 8, 6)
  // Sun
  ctx.fillStyle = '#e8d040'
  ctx.fillRect(x + 18, y + 4, 6, 4)
  ctx.fillStyle = '#f0e060'
  ctx.fillRect(x + 19, y + 5, 4, 2)
  // Clouds
  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  ctx.fillRect(x + 6, y + 5, 6, 2)
  ctx.fillRect(x + 5, y + 6, 4, 1)

  // Mountains
  ctx.fillStyle = '#4a8050'
  ctx.fillRect(x + 4, y + 10, s - 8, 4)
  ctx.fillStyle = '#3a7040'
  ctx.fillRect(x + 8, y + 8, 8, 4)
  ctx.fillStyle = '#5a9060'
  ctx.fillRect(x + 18, y + 9, 6, 3)

  // Ground/trees
  ctx.fillStyle = '#5a9060'
  ctx.fillRect(x + 4, y + 14, s - 8, 6)
  ctx.fillStyle = '#4a7a50'
  ctx.fillRect(x + 10, y + 13, 4, 3)
  ctx.fillRect(x + 20, y + 13, 3, 3)
}

function drawClock(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  const cx = x + s / 2
  const cy = y + s / 2 - 2

  // Clock body (circle approximation)
  ctx.fillStyle = '#e0e0e0'
  ctx.fillRect(cx - 10, cy - 8, 20, 17)
  ctx.fillRect(cx - 8, cy - 10, 16, 21)
  ctx.fillRect(cx - 6, cy - 11, 12, 23)

  // Face
  ctx.fillStyle = '#f8f8f0'
  ctx.fillRect(cx - 8, cy - 6, 16, 13)
  ctx.fillRect(cx - 6, cy - 8, 12, 17)
  ctx.fillRect(cx - 4, cy - 9, 8, 19)

  // Hour marks
  ctx.fillStyle = '#333'
  ctx.fillRect(cx - 1, cy - 8, 2, 2)  // 12
  ctx.fillRect(cx + 6, cy - 1, 2, 2)  // 3
  ctx.fillRect(cx - 1, cy + 7, 2, 2)  // 6
  ctx.fillRect(cx - 8, cy - 1, 2, 2)  // 9

  // Real-time clock hands
  const now = new Date()
  const hours = now.getHours() % 12
  const minutes = now.getMinutes()

  // Hour hand angle: each hour = 30 degrees, plus partial from minutes
  const hourAngle = (hours + minutes / 60) * (Math.PI / 6) - Math.PI / 2
  const hourLen = 4
  const hx = Math.round(Math.cos(hourAngle) * hourLen)
  const hy = Math.round(Math.sin(hourAngle) * hourLen)

  // Minute hand angle: each minute = 6 degrees
  const minAngle = (minutes / 60) * Math.PI * 2 - Math.PI / 2
  const minLen = 6
  const mx = Math.round(Math.cos(minAngle) * minLen)
  const my = Math.round(Math.sin(minAngle) * minLen)

  // Draw hour hand (thicker)
  ctx.fillStyle = '#222'
  drawHandPixels(ctx, cx, cy, hx, hy, 2)

  // Draw minute hand (thinner)
  ctx.fillStyle = '#444'
  drawHandPixels(ctx, cx, cy, mx, my, 1)

  // Center dot
  ctx.fillStyle = '#cc3333'
  ctx.fillRect(cx - 1, cy - 1, 2, 2)
}

/** Draw a line from center to offset using pixel rects */
function drawHandPixels(ctx: CanvasRenderingContext2D, cx: number, cy: number, dx: number, dy: number, thickness: number): void {
  const steps = Math.max(Math.abs(dx), Math.abs(dy))
  if (steps === 0) return
  for (let i = 0; i <= steps; i++) {
    const px = Math.round(cx + (dx * i) / steps)
    const py = Math.round(cy + (dy * i) / steps)
    ctx.fillRect(px - Math.floor(thickness / 2), py - Math.floor(thickness / 2), thickness, thickness)
  }
}

function drawDoor(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, floorStyle: 'wood' | 'tile' | 'carpet' | 'metal' | 'concrete'): void {
  // Floor underneath
  switch (floorStyle) {
    case 'wood': ctx.fillStyle = WOOD.a; break
    case 'tile': ctx.fillStyle = TILE_F.a; break
    case 'carpet': ctx.fillStyle = CARPET.a; break
    case 'metal': ctx.fillStyle = METAL.a; break
    case 'concrete': ctx.fillStyle = CONCRETE.a; break
  }
  ctx.fillRect(x, y, s, s)

  // Doormat
  ctx.fillStyle = '#8b7355'
  ctx.fillRect(x + 4, y + 6, s - 8, s - 8)
  ctx.fillStyle = '#7a6345'
  ctx.fillRect(x + 6, y + 8, s - 12, s - 12)
  // Mat texture
  ctx.fillStyle = 'rgba(0,0,0,0.05)'
  ctx.fillRect(x + 8, y + 10, s - 16, 1)
  ctx.fillRect(x + 8, y + 14, s - 16, 1)
  ctx.fillRect(x + 8, y + 18, s - 16, 1)
}

// ============ NEW FURNITURE (Phase 6) ============

function drawServerRack(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  // Rack frame (tall dark cabinet)
  ctx.fillStyle = '#1a1a2a'
  ctx.fillRect(x + 2, y, s - 4, s)

  // Side panels
  ctx.fillStyle = '#252538'
  ctx.fillRect(x + 3, y + 1, s - 6, s - 2)

  // Rack unit slots (horizontal server units)
  for (let i = 0; i < 4; i++) {
    const uy = y + 2 + i * 7

    // Server unit body
    ctx.fillStyle = '#2a2a3e'
    ctx.fillRect(x + 4, uy, s - 8, 6)

    // Front plate
    ctx.fillStyle = '#333348'
    ctx.fillRect(x + 5, uy + 1, s - 10, 4)

    // Ventilation slots
    ctx.fillStyle = '#1a1a28'
    for (let v = 0; v < 4; v++) {
      ctx.fillRect(x + 6 + v * 5, uy + 2, 3, 1)
    }

    // LED indicators (animated based on frame)
    const ledPhase = (globalAnimFrame + i * 7) % 12
    // Green LED (activity)
    if (ledPhase < 6) {
      ctx.fillStyle = '#00ff44'
    } else if (ledPhase < 9) {
      ctx.fillStyle = '#00aa22'
    } else {
      ctx.fillStyle = '#006611'
    }
    ctx.fillRect(x + s - 9, uy + 2, 2, 2)

    // Orange LED (power)
    ctx.fillStyle = '#ff8800'
    ctx.fillRect(x + s - 12, uy + 2, 2, 2)

    // Blue LED (network) - blinks differently
    const blueLed = (globalAnimFrame + i * 3) % 8
    if (blueLed < 4) {
      ctx.fillStyle = '#4488ff'
    } else {
      ctx.fillStyle = '#223366'
    }
    ctx.fillRect(x + s - 15, uy + 2, 2, 2)
  }

  // Cable bundles on right side
  ctx.fillStyle = '#222235'
  ctx.fillRect(x + s - 6, y + 4, 2, s - 8)
  // Individual cable colors
  ctx.fillStyle = '#4466aa'
  ctx.fillRect(x + s - 6, y + 6, 1, s - 12)
  ctx.fillStyle = '#aa4444'
  ctx.fillRect(x + s - 5, y + 8, 1, s - 16)

  // Top ventilation
  ctx.fillStyle = '#1a1a28'
  ctx.fillRect(x + 6, y + 30, s - 12, 1)

  // Frame edge highlights
  ctx.fillStyle = '#3a3a50'
  ctx.fillRect(x + 2, y, 1, s)
  ctx.fillRect(x + s - 3, y, 1, s)
}

function drawWhiteboard(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  // Metal frame
  ctx.fillStyle = '#b0b0b8'
  ctx.fillRect(x + 1, y + 1, s - 2, s - 4)

  // Frame highlight
  ctx.fillStyle = '#c8c8d0'
  ctx.fillRect(x + 1, y + 1, s - 2, 2)

  // White board surface
  ctx.fillStyle = '#f4f4f0'
  ctx.fillRect(x + 3, y + 3, s - 6, s - 8)

  // Faint marker traces (remnants of erased content)
  ctx.fillStyle = 'rgba(50,50,200,0.06)'
  ctx.fillRect(x + 6, y + 6, 12, 1)
  ctx.fillRect(x + 8, y + 10, 8, 1)
  ctx.fillRect(x + 5, y + 14, 14, 1)

  ctx.fillStyle = 'rgba(200,50,50,0.05)'
  ctx.fillRect(x + 10, y + 8, 10, 1)
  ctx.fillRect(x + 6, y + 18, 6, 1)

  ctx.fillStyle = 'rgba(50,150,50,0.06)'
  ctx.fillRect(x + 14, y + 12, 8, 1)
  ctx.fillRect(x + 8, y + 16, 10, 1)

  // Marker tray at bottom
  ctx.fillStyle = '#888890'
  ctx.fillRect(x + 3, y + s - 5, s - 6, 3)
  ctx.fillStyle = '#707078'
  ctx.fillRect(x + 3, y + s - 3, s - 6, 1)

  // Markers in tray
  ctx.fillStyle = '#2244aa' // blue marker
  ctx.fillRect(x + 6, y + s - 5, 6, 2)
  ctx.fillStyle = '#cc2222' // red marker
  ctx.fillRect(x + 14, y + s - 5, 6, 2)
  ctx.fillStyle = '#22aa22' // green marker
  ctx.fillRect(x + 22, y + s - 5, 5, 2)
}

function drawConferenceTable(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, grid: Grid, col: number, row: number): void {
  const hasAbove = grid.getTile(col, row - 1) === TileType.CONFERENCE_TABLE
  const hasBelow = grid.getTile(col, row + 1) === TileType.CONFERENCE_TABLE
  const hasRight = grid.getTile(col + 1, row) === TileType.CONFERENCE_TABLE
  const hasLeft = grid.getTile(col - 1, row) === TileType.CONFERENCE_TABLE

  // Dark wood table surface
  ctx.fillStyle = '#4a3520'
  ctx.fillRect(x + 1, y + 1, s - 2, s - 2)

  // Lighter center wood
  ctx.fillStyle = '#5a4530'
  ctx.fillRect(x + 3, y + 3, s - 6, s - 6)

  // Wood grain
  ctx.fillStyle = 'rgba(0,0,0,0.05)'
  ctx.fillRect(x + 4, y + 8, s - 8, 1)
  ctx.fillRect(x + 6, y + 16, s - 10, 1)
  ctx.fillRect(x + 4, y + 24, s - 8, 1)

  // Table edge highlight
  ctx.fillStyle = '#6a5540'
  ctx.fillRect(x + 1, y + 1, s - 2, 2)

  // Connect to adjacent table tiles seamlessly
  if (hasRight) {
    ctx.fillStyle = '#5a4530'
    ctx.fillRect(x + s - 3, y + 3, 6, s - 6)
    ctx.fillStyle = '#4a3520'
    ctx.fillRect(x + s - 1, y + 1, 2, s - 2)
  }
  if (hasBelow) {
    ctx.fillStyle = '#5a4530'
    ctx.fillRect(x + 3, y + s - 3, s - 6, 6)
    ctx.fillStyle = '#4a3520'
    ctx.fillRect(x + 1, y + s - 1, s - 2, 2)
  }

  // Rounded corner bevels (only on outer corners)
  if (!hasAbove && !hasLeft) {
    ctx.fillStyle = '#3a2510'
    ctx.fillRect(x + 1, y + 1, 2, 2)
  }
  if (!hasAbove && !hasRight) {
    ctx.fillStyle = '#3a2510'
    ctx.fillRect(x + s - 3, y + 1, 2, 2)
  }
  if (!hasBelow && !hasLeft) {
    ctx.fillStyle = '#3a2510'
    ctx.fillRect(x + 1, y + s - 3, 2, 2)
  }
  if (!hasBelow && !hasRight) {
    ctx.fillStyle = '#3a2510'
    ctx.fillRect(x + s - 3, y + s - 3, 2, 2)
  }

  // Front face shadow (only on bottom edge)
  if (!hasBelow) {
    ctx.fillStyle = '#3a2510'
    ctx.fillRect(x + 1, y + s - 3, s - 2, 2)
    // Table legs visible below
    ctx.fillStyle = '#2a1a08'
    ctx.fillRect(x + 4, y + s - 1, 3, 1)
    ctx.fillRect(x + s - 7, y + s - 1, 3, 1)
  }
}

function drawStool(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  const cx = x + s / 2
  const cy = y + s / 2

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)'
  ctx.fillRect(cx - 6, cy + 6, 12, 3)

  // Metal legs (4 legs in X pattern)
  ctx.fillStyle = '#888890'
  // Front-left
  ctx.fillRect(cx - 6, cy + 2, 2, 6)
  // Front-right
  ctx.fillRect(cx + 4, cy + 2, 2, 6)
  // Back-left
  ctx.fillRect(cx - 5, cy - 2, 2, 6)
  // Back-right
  ctx.fillRect(cx + 3, cy - 2, 2, 6)

  // Central pole
  ctx.fillStyle = '#707078'
  ctx.fillRect(cx - 1, cy - 2, 2, 6)

  // Footrest ring
  ctx.fillStyle = '#999'
  ctx.fillRect(cx - 5, cy + 4, 10, 1)

  // Round seat (circle approximation)
  ctx.fillStyle = '#5a5a60'
  ctx.fillRect(cx - 7, cy - 4, 14, 4)
  ctx.fillRect(cx - 8, cy - 3, 16, 2)

  // Seat cushion top
  ctx.fillStyle = '#6a6a70'
  ctx.fillRect(cx - 6, cy - 4, 12, 2)

  // Seat highlight
  ctx.fillStyle = '#7a7a80'
  ctx.fillRect(cx - 4, cy - 4, 8, 1)
}

function drawEspressoMachine(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  // Counter underneath (same as normal counter base)
  ctx.fillStyle = '#d0c0a0'
  ctx.fillRect(x, y + 4, s, s - 8)
  ctx.fillStyle = '#e0d0b0'
  ctx.fillRect(x, y + 4, s, 5)
  ctx.fillStyle = '#b0a080'
  ctx.fillRect(x, y + s - 7, s, 7)
  ctx.fillStyle = '#9a8a70'
  ctx.fillRect(x, y + s - 2, s, 2)

  // Machine body (chrome)
  ctx.fillStyle = '#c0c0c8'
  ctx.fillRect(x + 4, y + 2, 22, 16)

  // Machine front panel
  ctx.fillStyle = '#d0d0d8'
  ctx.fillRect(x + 5, y + 3, 20, 14)

  // Top section (boiler area)
  ctx.fillStyle = '#b0b0b8'
  ctx.fillRect(x + 4, y + 2, 22, 4)

  // Pressure gauge
  ctx.fillStyle = '#f0f0e8'
  ctx.fillRect(x + 7, y + 3, 4, 4)
  ctx.fillStyle = '#222'
  ctx.fillRect(x + 8, y + 4, 2, 2)
  // Gauge needle
  ctx.fillStyle = '#cc2222'
  ctx.fillRect(x + 9, y + 4, 1, 1)

  // Group head (portafilter area)
  ctx.fillStyle = '#888890'
  ctx.fillRect(x + 12, y + 8, 8, 3)
  // Portafilter handle
  ctx.fillStyle = '#2a2a2a'
  ctx.fillRect(x + 10, y + 10, 12, 2)
  ctx.fillRect(x + 8, y + 11, 4, 2)

  // Drip tray
  ctx.fillStyle = '#3a3a40'
  ctx.fillRect(x + 8, y + 14, 14, 3)
  ctx.fillStyle = '#444448'
  ctx.fillRect(x + 9, y + 15, 12, 1)

  // Steam wand (right side)
  ctx.fillStyle = '#aaa'
  ctx.fillRect(x + 24, y + 6, 2, 8)
  ctx.fillRect(x + 23, y + 12, 3, 2)
  // Steam effect (animated)
  if (globalAnimFrame % 8 < 4) {
    ctx.fillStyle = 'rgba(200,200,220,0.2)'
    ctx.fillRect(x + 23, y + 4, 3, 2)
  }

  // Cup on drip tray
  ctx.fillStyle = '#f0e8e0'
  ctx.fillRect(x + 12, y + 12, 5, 5)
  ctx.fillStyle = '#e0d8d0'
  ctx.fillRect(x + 13, y + 13, 3, 3)
  // Coffee in cup
  ctx.fillStyle = '#5a3a1a'
  ctx.fillRect(x + 13, y + 13, 3, 1)

  // Brand logo area
  ctx.fillStyle = '#aa4444'
  ctx.fillRect(x + 16, y + 4, 6, 2)

  // Chrome highlight
  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  ctx.fillRect(x + 5, y + 3, 2, 10)
}
