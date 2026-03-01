import { useState, useCallback } from 'react'
import { TileType } from '../engine/Grid'
import type { Grid } from '../engine/Grid'
import type { OfficeEditor, EditorTool, FloorStyle } from '../editor/OfficeEditor'
import type { OfficeStorage } from '../editor/OfficeStorage'

interface EditorToolbarProps {
  editor: OfficeEditor
  storage: OfficeStorage
  grid: Grid
  onSave: (name: string) => void
  onLoad: (name: string) => void
  onClose: () => void
}

const TILE_OPTIONS: { type: TileType; label: string }[] = [
  { type: TileType.FLOOR, label: 'Floor' },
  { type: TileType.WALL, label: 'Wall' },
  { type: TileType.DESK, label: 'Desk' },
  { type: TileType.CHAIR, label: 'Chair' },
  { type: TileType.BOOKSHELF, label: 'Books' },
  { type: TileType.DOOR, label: 'Door' },
  { type: TileType.COUCH, label: 'Couch' },
  { type: TileType.VENDING, label: 'Vending' },
  { type: TileType.COUNTER, label: 'Counter' },
  { type: TileType.PLANT_TILE, label: 'Plant' },
  { type: TileType.WATER_COOLER, label: 'Cooler' },
  { type: TileType.PAINTING, label: 'Art' },
  { type: TileType.CLOCK, label: 'Clock' },
  { type: TileType.SERVER_RACK, label: 'Server' },
  { type: TileType.WHITEBOARD, label: 'Board' },
  { type: TileType.CONFERENCE_TABLE, label: 'Table' },
  { type: TileType.STOOL, label: 'Stool' },
  { type: TileType.ESPRESSO_MACHINE, label: 'Coffee' },
]

const FLOOR_STYLES: { style: FloorStyle; label: string }[] = [
  { style: 'wood', label: 'Wood' },
  { style: 'tile', label: 'Tile' },
  { style: 'carpet', label: 'Carpet' },
  { style: 'metal', label: 'Metal' },
  { style: 'concrete', label: 'Concrete' },
]

const TOOL_OPTIONS: { tool: EditorTool; label: string }[] = [
  { tool: 'select', label: 'Select' },
  { tool: 'place', label: 'Place' },
  { tool: 'erase', label: 'Erase' },
  { tool: 'paint_floor', label: 'Paint' },
]

export function EditorToolbar({ editor, storage, grid, onSave, onLoad, onClose }: EditorToolbarProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [validationResult, setValidationResult] = useState<boolean | null>(null)

  // Force re-renders when editor state changes
  const [, forceUpdate] = useState(0)
  const refresh = useCallback(() => forceUpdate((n) => n + 1), [])

  const currentTool = editor.getTool()
  const selectedTileType = editor.getSelectedTileType()
  const selectedFloorStyle = editor.getSelectedFloorStyle()
  const editorState = editor.getState()

  const handleToolSelect = (tool: EditorTool) => {
    editor.setTool(tool)
    refresh()
  }

  const handleTileSelect = (type: TileType) => {
    editor.setTileType(type)
    editor.setTool('place')
    refresh()
  }

  const handleFloorStyleSelect = (style: FloorStyle) => {
    editor.setFloorStyle(style)
    editor.setTool('paint_floor')
    refresh()
  }

  const handleUndo = () => {
    editor.undo(grid)
    refresh()
  }

  const handleRedo = () => {
    editor.redo(grid)
    refresh()
  }

  const handleValidate = () => {
    const result = editor.validate(grid)
    setValidationResult(result)
    setTimeout(() => setValidationResult(null), 3000)
  }

  const handleSave = () => {
    if (saveName.trim()) {
      onSave(saveName.trim())
      setShowSaveDialog(false)
      setSaveName('')
    }
  }

  const handleLoad = (name: string) => {
    onLoad(name)
    setShowLoadDialog(false)
  }

  const handleDeleteLayout = (name: string) => {
    storage.deleteLayout(name)
    refresh()
  }

  const layouts = showLoadDialog ? storage.listLayouts() : []

  return (
    <div style={styles.container}>
      {/* Tool buttons */}
      <div style={styles.section}>
        <span style={styles.sectionLabel}>Tool:</span>
        {TOOL_OPTIONS.map(({ tool, label }) => (
          <button
            key={tool}
            style={{
              ...styles.btn,
              ...(currentTool === tool ? styles.btnActive : {}),
            }}
            onClick={() => handleToolSelect(tool)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div style={styles.divider} />

      {/* Tile type selector */}
      <div style={styles.section}>
        <span style={styles.sectionLabel}>Tile:</span>
        <div style={styles.tileGrid}>
          {TILE_OPTIONS.map(({ type, label }) => (
            <button
              key={type}
              style={{
                ...styles.tileBtn,
                ...(selectedTileType === type && currentTool === 'place'
                  ? styles.btnActive
                  : {}),
              }}
              onClick={() => handleTileSelect(type)}
              title={label}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={styles.divider} />

      {/* Floor style picker */}
      <div style={styles.section}>
        <span style={styles.sectionLabel}>Floor:</span>
        {FLOOR_STYLES.map(({ style, label }) => (
          <button
            key={style}
            style={{
              ...styles.btn,
              ...(selectedFloorStyle === style && currentTool === 'paint_floor'
                ? styles.btnActive
                : {}),
            }}
            onClick={() => handleFloorStyleSelect(style)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div style={styles.divider} />

      {/* Undo/Redo */}
      <div style={styles.section}>
        <button
          style={{
            ...styles.btn,
            ...(editorState.undoStack.length === 0 ? styles.btnDisabled : {}),
          }}
          onClick={handleUndo}
          disabled={editorState.undoStack.length === 0}
        >
          Undo
        </button>
        <button
          style={{
            ...styles.btn,
            ...(editorState.redoStack.length === 0 ? styles.btnDisabled : {}),
          }}
          onClick={handleRedo}
          disabled={editorState.redoStack.length === 0}
        >
          Redo
        </button>
      </div>

      {/* Divider */}
      <div style={styles.divider} />

      {/* Save/Load/Validate */}
      <div style={styles.section}>
        <button style={styles.btn} onClick={() => setShowSaveDialog(!showSaveDialog)}>
          Save
        </button>
        <button style={styles.btn} onClick={() => setShowLoadDialog(!showLoadDialog)}>
          Load
        </button>
        <button style={styles.btn} onClick={handleValidate}>
          Validate
        </button>
      </div>

      {/* Validation result indicator */}
      {validationResult !== null && (
        <div
          style={{
            ...styles.validationBadge,
            backgroundColor: validationResult
              ? 'rgba(40, 180, 80, 0.85)'
              : 'rgba(200, 50, 50, 0.85)',
          }}
        >
          {validationResult ? 'VALID: All chairs reachable' : 'INVALID: Unreachable chairs detected'}
        </div>
      )}

      {/* Close button */}
      <div style={styles.section}>
        <button style={{ ...styles.btn, ...styles.closeBtn }} onClick={onClose}>
          X Close
        </button>
      </div>

      {/* Save dialog */}
      {showSaveDialog && (
        <div style={styles.dialog}>
          <div style={styles.dialogTitle}>Save Layout</div>
          <input
            style={styles.input}
            type="text"
            placeholder="Layout name..."
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') setShowSaveDialog(false)
            }}
            autoFocus
          />
          <div style={styles.dialogButtons}>
            <button style={styles.btn} onClick={handleSave}>
              Save
            </button>
            <button style={styles.btn} onClick={() => setShowSaveDialog(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Load dialog */}
      {showLoadDialog && (
        <div style={styles.dialog}>
          <div style={styles.dialogTitle}>Load Layout</div>
          {layouts.length === 0 ? (
            <div style={styles.emptyMessage}>No saved layouts</div>
          ) : (
            <div style={styles.layoutList}>
              {layouts.map((name) => (
                <div key={name} style={styles.layoutItem}>
                  <button
                    style={{ ...styles.btn, flex: 1, textAlign: 'left' as const }}
                    onClick={() => handleLoad(name)}
                  >
                    {name}
                  </button>
                  <button
                    style={{ ...styles.btn, ...styles.deleteBtn }}
                    onClick={() => handleDeleteLayout(name)}
                  >
                    Del
                  </button>
                </div>
              ))}
            </div>
          )}
          <div style={styles.dialogButtons}>
            <button style={styles.btn} onClick={() => setShowLoadDialog(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
    padding: '6px 10px',
    background: 'rgba(15, 15, 30, 0.92)',
    borderBottom: '1px solid rgba(255,255,255,0.15)',
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#e0e0e0',
    zIndex: 100,
    userSelect: 'none' as const,
  },
  section: {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    flexShrink: 0,
  },
  sectionLabel: {
    color: '#999',
    fontSize: 10,
    marginRight: 2,
    whiteSpace: 'nowrap' as const,
  },
  divider: {
    width: 1,
    height: 22,
    background: 'rgba(255,255,255,0.15)',
    margin: '0 4px',
    flexShrink: 0,
  },
  tileGrid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 2,
    maxWidth: 360,
  },
  btn: {
    background: 'rgba(60, 60, 90, 0.7)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 3,
    color: '#ddd',
    fontFamily: 'monospace',
    fontSize: 10,
    padding: '3px 6px',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    lineHeight: 1.2,
  },
  tileBtn: {
    background: 'rgba(60, 60, 90, 0.7)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 2,
    color: '#ccc',
    fontFamily: 'monospace',
    fontSize: 9,
    padding: '2px 4px',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    lineHeight: 1.2,
  },
  btnActive: {
    background: 'rgba(80, 140, 220, 0.8)',
    borderColor: 'rgba(100, 180, 255, 0.6)',
    color: '#fff',
  },
  btnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  closeBtn: {
    background: 'rgba(150, 50, 50, 0.7)',
    borderColor: 'rgba(200, 80, 80, 0.5)',
  },
  deleteBtn: {
    background: 'rgba(150, 50, 50, 0.5)',
    borderColor: 'rgba(200, 80, 80, 0.3)',
    fontSize: 9,
    padding: '2px 5px',
  },
  validationBadge: {
    padding: '3px 8px',
    borderRadius: 3,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    whiteSpace: 'nowrap' as const,
  },
  dialog: {
    position: 'absolute' as const,
    top: '100%',
    left: 10,
    marginTop: 4,
    background: 'rgba(20, 20, 40, 0.95)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 4,
    padding: 10,
    minWidth: 220,
    zIndex: 110,
  },
  dialogTitle: {
    fontWeight: 'bold',
    fontSize: 11,
    marginBottom: 8,
    color: '#ccc',
  },
  dialogButtons: {
    display: 'flex',
    gap: 6,
    marginTop: 8,
  },
  input: {
    width: '100%',
    background: 'rgba(40, 40, 60, 0.8)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 3,
    color: '#e0e0e0',
    fontFamily: 'monospace',
    fontSize: 11,
    padding: '4px 6px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  emptyMessage: {
    color: '#888',
    fontSize: 10,
    fontStyle: 'italic',
  },
  layoutList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 3,
    maxHeight: 150,
    overflowY: 'auto' as const,
  },
  layoutItem: {
    display: 'flex',
    gap: 4,
    alignItems: 'center',
  },
}
