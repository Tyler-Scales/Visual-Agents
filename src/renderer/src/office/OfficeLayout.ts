import { Grid, TileType } from '../engine/Grid'

export const GRID_COLS = 26
export const GRID_ROWS = 18
export const ENTRANCE_TILE = { col: 5, row: 16 }

export function createDefaultOffice(): Grid {
  const grid = new Grid(GRID_COLS, GRID_ROWS)

  // === WALLS (fill everything, then carve rooms) ===
  grid.fillRect(0, 0, GRID_COLS, GRID_ROWS, TileType.WALL)

  // === ROOM INTERIORS ===
  // Main office (cols 1-10, rows 1-12)
  grid.fillRect(1, 1, 10, 12, TileType.FLOOR)
  // Break room (cols 12-16, rows 1-5)
  grid.fillRect(12, 1, 5, 5, TileType.FLOOR)
  // Server Room (cols 18-24, rows 1-5)
  grid.fillRect(18, 1, 7, 5, TileType.FLOOR)
  // Lounge (cols 12-16, rows 8-12)
  grid.fillRect(12, 8, 5, 5, TileType.FLOOR)
  // Conference Room (cols 12-16, rows 14-17)
  grid.fillRect(12, 14, 5, 4, TileType.FLOOR)
  // Coffee Bar (cols 18-24, rows 8-12)
  grid.fillRect(18, 8, 7, 5, TileType.FLOOR)

  // === ROOM ZONES (for floor style lookups) ===
  grid.rooms = [
    { col1: 1, row1: 1, col2: 10, row2: 12, floorStyle: 'wood' },
    { col1: 12, row1: 1, col2: 16, row2: 5, floorStyle: 'tile' },
    { col1: 18, row1: 1, col2: 24, row2: 5, floorStyle: 'metal' },
    { col1: 12, row1: 8, col2: 16, row2: 12, floorStyle: 'carpet' },
    { col1: 12, row1: 14, col2: 16, row2: 17, floorStyle: 'concrete' },
    { col1: 18, row1: 8, col2: 24, row2: 12, floorStyle: 'tile' }
  ]

  // === DOORS ===
  // Main entrance (bottom wall of main office)
  grid.setTile(5, 13, TileType.DOOR)
  grid.setTile(6, 13, TileType.DOOR)
  // Door to break room (right wall of main office)
  grid.setTile(11, 3, TileType.DOOR)
  // Door to lounge (right wall of main office)
  grid.setTile(11, 10, TileType.DOOR)
  // Door from break room to server room (right wall of break room)
  grid.setTile(17, 3, TileType.DOOR)
  // Door from main office to conference room (bottom-right area of main office)
  grid.setTile(11, 15, TileType.DOOR)
  // Door from lounge to coffee bar (right wall of lounge)
  grid.setTile(17, 10, TileType.DOOR)

  // === Extra floor tiles for door connectivity ===
  // Corridor between main office door (col 11) and conference room (cols 12-16)
  // The door at col 11, row 15 needs floor on both sides
  // Main office extends rows 1-12, so rows 13-17 at col 11 need a path
  grid.setTile(5, 14, TileType.FLOOR)
  grid.setTile(5, 15, TileType.FLOOR)
  grid.setTile(5, 16, TileType.FLOOR)
  grid.setTile(6, 14, TileType.FLOOR)
  grid.setTile(6, 15, TileType.FLOOR)
  grid.setTile(6, 16, TileType.FLOOR)
  // Extend a hallway from main office bottom to conference room
  grid.setTile(1, 13, TileType.FLOOR)
  grid.setTile(2, 13, TileType.FLOOR)
  grid.setTile(3, 13, TileType.FLOOR)
  grid.setTile(4, 13, TileType.FLOOR)
  grid.setTile(7, 13, TileType.FLOOR)
  grid.setTile(8, 13, TileType.FLOOR)
  grid.setTile(9, 13, TileType.FLOOR)
  grid.setTile(10, 13, TileType.FLOOR)
  // Hallway row 14-16 from main to conference
  for (let c = 1; c <= 10; c++) {
    grid.setTile(c, 14, TileType.FLOOR)
    grid.setTile(c, 15, TileType.FLOOR)
    grid.setTile(c, 16, TileType.FLOOR)
  }

  // === BOOKSHELVES along top wall of main office ===
  for (let c = 1; c <= 4; c++) grid.setTile(c, 1, TileType.BOOKSHELF)
  for (let c = 7; c <= 10; c++) grid.setTile(c, 1, TileType.BOOKSHELF)

  // Clock and painting between bookshelves
  grid.setTile(5, 1, TileType.CLOCK)
  grid.setTile(6, 1, TileType.PAINTING)

  // === WORKSTATIONS (12 individual single-person desks) ===
  // Row 1 (top): 4 workstations in main office
  placeWorkstation(grid, 2, 3)
  placeWorkstation(grid, 5, 3)
  placeWorkstation(grid, 8, 3)

  // Row 2: 3 workstations
  placeWorkstation(grid, 2, 7)
  placeWorkstation(grid, 5, 7)
  placeWorkstation(grid, 8, 7)

  // Row 3 (bottom hallway area): 3 more workstations in the expanded lower area
  placeWorkstation(grid, 2, 10)
  placeWorkstation(grid, 5, 10)
  placeWorkstation(grid, 8, 10)

  // === PLANTS in main office ===
  grid.setTile(1, 6, TileType.PLANT_TILE)
  grid.setTile(10, 6, TileType.PLANT_TILE)
  grid.setTile(1, 12, TileType.PLANT_TILE)
  grid.setTile(10, 12, TileType.PLANT_TILE)

  // === BREAK ROOM FURNITURE ===
  grid.setTile(12, 1, TileType.VENDING)
  grid.setTile(13, 1, TileType.VENDING)
  grid.setTile(15, 1, TileType.COUNTER)
  grid.setTile(16, 1, TileType.COUNTER)
  grid.setTile(16, 2, TileType.WATER_COOLER)
  grid.setTile(14, 1, TileType.CLOCK)
  grid.setTile(12, 4, TileType.PLANT_TILE)

  // === LOUNGE FURNITURE ===
  grid.setTile(12, 8, TileType.BOOKSHELF)
  grid.setTile(13, 8, TileType.BOOKSHELF)
  grid.setTile(15, 8, TileType.PAINTING)
  grid.setTile(14, 10, TileType.COUCH)
  grid.setTile(14, 11, TileType.COUCH)
  grid.setTile(12, 12, TileType.PLANT_TILE)
  grid.setTile(16, 12, TileType.PLANT_TILE)

  // === SERVER ROOM FURNITURE (cols 18-24, rows 1-5) ===
  // Server racks along walls
  grid.setTile(18, 1, TileType.SERVER_RACK)
  grid.setTile(19, 1, TileType.SERVER_RACK)
  grid.setTile(20, 1, TileType.SERVER_RACK)
  grid.setTile(22, 1, TileType.SERVER_RACK)
  grid.setTile(23, 1, TileType.SERVER_RACK)
  grid.setTile(24, 1, TileType.SERVER_RACK)
  // Racks along the right wall
  grid.setTile(24, 2, TileType.SERVER_RACK)
  grid.setTile(24, 4, TileType.SERVER_RACK)
  // Clock on wall
  grid.setTile(21, 1, TileType.CLOCK)

  // === CONFERENCE ROOM FURNITURE (cols 12-16, rows 14-17) ===
  // Whiteboard on top wall
  grid.setTile(13, 14, TileType.WHITEBOARD)
  grid.setTile(14, 14, TileType.WHITEBOARD)
  grid.setTile(15, 14, TileType.WHITEBOARD)
  // Conference table in center (2x3)
  grid.setTile(13, 15, TileType.CONFERENCE_TABLE)
  grid.setTile(14, 15, TileType.CONFERENCE_TABLE)
  grid.setTile(13, 16, TileType.CONFERENCE_TABLE)
  grid.setTile(14, 16, TileType.CONFERENCE_TABLE)
  grid.setTile(13, 17, TileType.CONFERENCE_TABLE)
  grid.setTile(14, 17, TileType.CONFERENCE_TABLE)
  // Plants in conference room corners
  grid.setTile(12, 17, TileType.PLANT_TILE)
  grid.setTile(16, 17, TileType.PLANT_TILE)

  // === COFFEE BAR FURNITURE (cols 18-24, rows 8-12) ===
  // Counter along top wall
  grid.setTile(18, 8, TileType.COUNTER)
  grid.setTile(19, 8, TileType.COUNTER)
  grid.setTile(20, 8, TileType.COUNTER)
  // Espresso machine on counter
  grid.setTile(21, 8, TileType.ESPRESSO_MACHINE)
  grid.setTile(22, 8, TileType.COUNTER)
  // More counter and plant on right
  grid.setTile(24, 8, TileType.PLANT_TILE)
  grid.setTile(23, 8, TileType.COUNTER)
  // Stools (walkable) for sitting at bar
  grid.setTile(19, 9, TileType.STOOL)
  grid.setTile(20, 9, TileType.STOOL)
  grid.setTile(22, 9, TileType.STOOL)
  grid.setTile(23, 9, TileType.STOOL)
  // Painting on right wall
  grid.setTile(24, 10, TileType.PAINTING)
  // Cozy seating
  grid.setTile(18, 12, TileType.COUCH)
  grid.setTile(19, 12, TileType.COUCH)
  // Plant
  grid.setTile(24, 12, TileType.PLANT_TILE)

  return grid
}

/** Single-person workstation: back desk (monitor) + front desk (keyboard) + chair */
function placeWorkstation(grid: Grid, col: number, row: number): void {
  grid.setTile(col, row, TileType.DESK)
  grid.setTile(col, row + 1, TileType.DESK)
  grid.setTile(col, row + 2, TileType.CHAIR)
}

/** Walkable floor spots in the break room (cols 12-16, rows 1-5) */
export const BREAK_ROOM_SPOTS = [
  { col: 13, row: 2 }, { col: 14, row: 2 }, { col: 15, row: 2 },
  { col: 13, row: 3 }, { col: 14, row: 3 }, { col: 15, row: 3 },
  { col: 13, row: 4 }, { col: 14, row: 4 }, { col: 15, row: 4 },
  { col: 13, row: 5 }, { col: 14, row: 5 }, { col: 15, row: 5 }
]

/** Walkable floor spots in the lounge (cols 12-16, rows 8-12) */
export const LOUNGE_SPOTS = [
  { col: 13, row: 9 }, { col: 15, row: 9 }, { col: 16, row: 9 },
  { col: 13, row: 10 }, { col: 15, row: 10 }, { col: 16, row: 10 },
  { col: 13, row: 11 }, { col: 15, row: 11 }, { col: 16, row: 11 }
]

/** Walkable floor spots in the server room (cols 18-24, rows 1-5) */
export const SERVER_ROOM_SPOTS = [
  { col: 19, row: 2 }, { col: 20, row: 2 }, { col: 21, row: 2 }, { col: 22, row: 2 }, { col: 23, row: 2 },
  { col: 18, row: 3 }, { col: 19, row: 3 }, { col: 20, row: 3 }, { col: 21, row: 3 }, { col: 22, row: 3 }, { col: 23, row: 3 },
  { col: 18, row: 4 }, { col: 19, row: 4 }, { col: 20, row: 4 }, { col: 21, row: 4 }, { col: 22, row: 4 }, { col: 23, row: 4 },
  { col: 18, row: 5 }, { col: 19, row: 5 }, { col: 20, row: 5 }, { col: 21, row: 5 }, { col: 22, row: 5 }, { col: 23, row: 5 }, { col: 24, row: 5 }
]

/** Walkable floor spots in the conference room (cols 12-16, rows 14-17) */
export const CONFERENCE_SPOTS = [
  { col: 12, row: 15 }, { col: 15, row: 15 }, { col: 16, row: 15 },
  { col: 12, row: 16 }, { col: 15, row: 16 }, { col: 16, row: 16 },
  { col: 15, row: 17 }
]

/** Walkable floor spots in the coffee bar (cols 18-24, rows 8-12) */
export const COFFEE_BAR_SPOTS = [
  { col: 18, row: 9 }, { col: 19, row: 9 }, { col: 20, row: 9 }, { col: 21, row: 9 }, { col: 22, row: 9 }, { col: 23, row: 9 },
  { col: 18, row: 10 }, { col: 19, row: 10 }, { col: 20, row: 10 }, { col: 21, row: 10 }, { col: 22, row: 10 }, { col: 23, row: 10 },
  { col: 18, row: 11 }, { col: 19, row: 11 }, { col: 20, row: 11 }, { col: 21, row: 11 }, { col: 22, row: 11 }, { col: 23, row: 11 }
]
