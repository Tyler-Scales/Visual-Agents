import { useRef, useEffect, useCallback, useState } from 'react'
import { GameLoop } from '../engine/GameLoop'
import { Camera } from '../engine/Camera'
import { ParticleSystem } from '../engine/ParticleSystem'
import { TILE_SIZE } from '../engine/Grid'
import type { Grid } from '../engine/Grid'
import { render, findCharacterAt, advanceRenderFrame } from '../engine/Renderer'
import { createDefaultOffice, ENTRANCE_TILE } from '../office/OfficeLayout'
import { CharacterManager } from '../characters/CharacterManager'
import { SoundManager } from '../audio/SoundManager'
import { OfficeEditor } from '../editor/OfficeEditor'
import { OfficeStorage } from '../editor/OfficeStorage'
import type { Character } from '../characters/Character'
import { Minimap } from '../ui/Minimap'
import { DayNightCycle } from '../engine/DayNightCycle'

interface GameCanvasProps {
  onCharactersUpdate?: (characters: Character[]) => void
  onCharacterSelect?: (id: string | null) => void
  selectedId?: string | null
  onEditorStateChange?: (active: boolean, editor: OfficeEditor, storage: OfficeStorage, grid: Grid) => void
}

export function GameCanvas({ onCharactersUpdate, onCharacterSelect, selectedId, onEditorStateChange }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const charManagerRef = useRef<CharacterManager | null>(null)
  const selectedIdRef = useRef<string | null>(selectedId ?? null)
  const editorRef = useRef<OfficeEditor | null>(null)
  const storageRef = useRef<OfficeStorage | null>(null)
  const gridRef = useRef<Grid | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Setup
    const grid = createDefaultOffice()
    const camera = new Camera()
    const particles = new ParticleSystem()
    const soundManager = new SoundManager()
    const charManager = new CharacterManager(grid, ENTRANCE_TILE)
    charManager.setParticles(particles)
    charManager.setSounds(soundManager)
    charManagerRef.current = charManager

    // Editor setup
    const editor = new OfficeEditor()
    const storage = new OfficeStorage()
    editorRef.current = editor
    storageRef.current = storage
    gridRef.current = grid

    // Minimap and Day/Night cycle
    const minimap = new Minimap()
    const dayNight = new DayNightCycle()

    // Try to load saved default layout from localStorage
    const defaultSave = storage.loadLayout('default')
    if (defaultSave) {
      storage.applyLayout(defaultSave, grid)
    }

    // Center camera on the office
    const officeWidth = grid.cols * TILE_SIZE
    const officeHeight = grid.rows * TILE_SIZE

    // Lower default zoom for the larger 26x18 grid
    camera.setZoom(3)

    // Set world bounds for camera clamping
    camera.setBounds(officeWidth, officeHeight)

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const displayWidth = window.innerWidth
      const displayHeight = window.innerHeight

      // Set the actual pixel dimensions (backing store)
      canvas.width = Math.round(displayWidth * dpr)
      canvas.height = Math.round(displayHeight * dpr)

      // Set the CSS display size
      canvas.style.width = `${displayWidth}px`
      canvas.style.height = `${displayHeight}px`

      // Scale the context so drawing operations use CSS pixels
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      camera.centerOn(
        officeWidth / 2,
        officeHeight / 2,
        displayWidth,
        displayHeight
      )
      camera.clamp(displayWidth, displayHeight)
    }
    resize()
    window.addEventListener('resize', resize)

    // Spawn demo characters so the office isn't empty when no sessions are active
    spawnDemoCharacters(charManager)

    // Hover state
    let hoveredChar: Character | null = null

    // Game loop
    let frameCount = 0
    const gameLoop = new GameLoop(
      ctx,
      (dt) => {
        charManager.updateAll(dt)
        particles.update(dt)
        dayNight.update()
        advanceRenderFrame()

        // Camera follow selected character
        const selId = selectedIdRef.current
        if (selId) {
          const selChar = charManager.getCharacter(selId)
          if (selChar) {
            camera.smoothCenterOn(selChar.x, selChar.y, window.innerWidth, window.innerHeight)
          }
        }

        camera.update(dt)
        frameCount++
        if (frameCount % 30 === 0 && onCharactersUpdate) {
          onCharactersUpdate([...charManager.getAll()])
        }
      },
      (_ctx, interpolation) => {
        const lighting = dayNight.getLighting()
        render(_ctx, camera, grid, charManager.getAll(), interpolation, hoveredChar, particles, editor, minimap, lighting)
      }
    )
    gameLoop.start()

    // Mouse interaction: pan with middle button drag, zoom with scroll
    let isPanning = false
    let panStartX = 0
    let panStartY = 0
    let editorMouseDown = false

    const onMouseDown = (e: MouseEvent) => {
      // Editor takes priority for left-click when active
      if (editor.isActive() && e.button === 0 && !e.altKey) {
        const world = camera.screenToWorld(e.clientX, e.clientY)
        const tile = grid.worldToTile(world.wx, world.wy)
        editor.onMouseDown(tile.col, tile.row, grid)
        editorMouseDown = true
        e.preventDefault()
        return
      }

      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        isPanning = true
        panStartX = e.clientX
        panStartY = e.clientY
        camera.clearTarget()
        e.preventDefault()
      }
    }

    const onClick = (e: MouseEvent) => {
      // Skip character selection when editor is active
      if (editor.isActive()) return

      // Left click (not alt-click)
      if (e.button === 0 && !e.altKey) {
        // Check if click is on the minimap first
        const minimapHit = minimap.hitTest(e.clientX, e.clientY, window.innerWidth, grid)
        if (minimapHit) {
          // Navigate camera to the clicked world position
          const worldX = minimapHit.col * TILE_SIZE + TILE_SIZE / 2
          const worldY = minimapHit.row * TILE_SIZE + TILE_SIZE / 2
          camera.smoothCenterOn(worldX, worldY, window.innerWidth, window.innerHeight)
          return
        }

        // Character selection
        const world = camera.screenToWorld(e.clientX, e.clientY)
        const clicked = findCharacterAt(charManager.getAll(), world.wx, world.wy)
        if (clicked) {
          onCharacterSelect?.(clicked.id)
          camera.smoothCenterOn(clicked.x, clicked.y, window.innerWidth, window.innerHeight)
        } else {
          onCharacterSelect?.(null)
          camera.clearTarget()
        }
      }
    }

    const onMouseMove = (e: MouseEvent) => {
      // Editor hover and drag tracking
      if (editor.isActive()) {
        const world = camera.screenToWorld(e.clientX, e.clientY)
        const tile = grid.worldToTile(world.wx, world.wy)
        editor.onMouseMove(tile.col, tile.row)
        if (editorMouseDown) {
          editor.onMouseDrag(tile.col, tile.row, grid)
        }
        canvas.style.cursor = 'crosshair'
        // Still allow panning with alt held
        if (isPanning) {
          const dx = (panStartX - e.clientX) / camera.zoom
          const dy = (panStartY - e.clientY) / camera.zoom
          camera.pan(dx, dy)
          camera.clamp(window.innerWidth, window.innerHeight)
          panStartX = e.clientX
          panStartY = e.clientY
        }
        return
      }

      if (isPanning) {
        const dx = (panStartX - e.clientX) / camera.zoom
        const dy = (panStartY - e.clientY) / camera.zoom
        camera.pan(dx, dy)
        camera.clamp(window.innerWidth, window.innerHeight)
        panStartX = e.clientX
        panStartY = e.clientY
      } else {
        // Hit-test for hover tooltip
        const world = camera.screenToWorld(e.clientX, e.clientY)
        hoveredChar = findCharacterAt(charManager.getAll(), world.wx, world.wy)
        canvas.style.cursor = hoveredChar ? 'pointer' : 'default'
      }
    }

    const onMouseUp = () => {
      isPanning = false
      if (editorMouseDown) {
        editor.onMouseUp()
        editorMouseDown = false
      }
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (e.deltaY < 0) camera.zoomIn()
      else camera.zoomOut()

      // Re-center after zoom
      camera.centerOn(
        officeWidth / 2,
        officeHeight / 2,
        window.innerWidth,
        window.innerHeight
      )
      camera.clamp(window.innerWidth, window.innerHeight)
    }

    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('click', onClick)
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('mouseleave', () => {
      isPanning = false
      editorMouseDown = false
      hoveredChar = null
      canvas.style.cursor = 'default'
    })
    canvas.addEventListener('wheel', onWheel, { passive: false })

    // Status panel visibility state
    let statusPanelVisible = true

    // Keyboard shortcuts
    const onKeyDown = (e: KeyboardEvent) => {
      // Don't fire shortcuts when typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      switch (e.key) {
        case 'e':
        case 'E':
          // Toggle office editor
          editor.toggle()
          onEditorStateChange?.(editor.isActive(), editor, storage, grid)
          break

        case 'r':
        case 'R':
          // Reset zoom to 4x and re-center on office
          camera.resetZoom()
          camera.centerOn(
            officeWidth / 2,
            officeHeight / 2,
            window.innerWidth,
            window.innerHeight
          )
          camera.clamp(window.innerWidth, window.innerHeight)
          break

        case 'c':
        case 'C':
          // Center camera on office
          camera.centerOn(
            officeWidth / 2,
            officeHeight / 2,
            window.innerWidth,
            window.innerHeight
          )
          camera.clamp(window.innerWidth, window.innerHeight)
          break

        case 'Tab': {
          // Cycle agents: select next character
          e.preventDefault()
          const allChars = charManager.getAll()
          if (allChars.length === 0) break
          const currentIdx = selectedIdRef.current
            ? allChars.findIndex((c) => c.id === selectedIdRef.current)
            : -1
          const nextIdx = (currentIdx + 1) % allChars.length
          const nextChar = allChars[nextIdx]
          onCharacterSelect?.(nextChar.id)
          camera.smoothCenterOn(nextChar.x, nextChar.y, window.innerWidth, window.innerHeight)
          break
        }

        case '+':
        case '=':
          // Zoom in
          camera.zoomIn()
          camera.centerOn(
            officeWidth / 2,
            officeHeight / 2,
            window.innerWidth,
            window.innerHeight
          )
          camera.clamp(window.innerWidth, window.innerHeight)
          break

        case '-':
          // Zoom out
          camera.zoomOut()
          camera.centerOn(
            officeWidth / 2,
            officeHeight / 2,
            window.innerWidth,
            window.innerHeight
          )
          camera.clamp(window.innerWidth, window.innerHeight)
          break

        case 's':
        case 'S':
          // Toggle status panel visibility
          statusPanelVisible = !statusPanelVisible
          // Dispatch a custom event so the parent component can react
          window.dispatchEvent(new CustomEvent('toggle-status-panel', { detail: { visible: statusPanelVisible } }))
          break

        case 'f':
        case 'F':
          // Toggle fullscreen
          if (window.api) {
            window.api.toggleFullscreen()
          } else if (document.fullscreenElement) {
            document.exitFullscreen()
          } else {
            document.documentElement.requestFullscreen()
          }
          break
      }
    }
    window.addEventListener('keydown', onKeyDown)

    // Listen for IPC events from main process
    const cleanups: (() => void)[] = []

    if (window.api) {
      // Load existing sessions - remove demos if real sessions found
      window.api.getSessions().then((sessions) => {
        if (sessions.length > 0) {
          charManager.removeCharacter('demo-1')
          charManager.removeCharacter('demo-2')
        }
        for (const session of sessions) {
          charManager.spawnCharacter(session.sessionId, session.projectName, session.source)
        }
      }).catch(() => {
        // API not available (dev mode without main process)
      })

      cleanups.push(
        window.api.onSessionActivity((update) => {
          charManager.onActivity(update.sessionId, update.activityType, update.toolName, update.filePath)
        })
      )

      cleanups.push(
        window.api.onSessionSpawned((session) => {
          charManager.removeCharacter('demo-1')
          charManager.removeCharacter('demo-2')
          charManager.spawnCharacter(session.sessionId, session.projectName, session.source)
        })
      )

      cleanups.push(
        window.api.onSessionEnded((sessionId) => {
          charManager.removeCharacter(sessionId)
        })
      )

      cleanups.push(
        window.api.onSubagentSpawned((info) => {
          charManager.spawnSubagent(info.agentId, info.parentSessionId, info.slug)
        })
      )
    }

    return () => {
      gameLoop.stop()
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', onKeyDown)
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('click', onClick)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('wheel', onWheel)
      for (const cleanup of cleanups) cleanup()
    }
  }, [])

  // Keep selectedIdRef in sync with the prop
  useEffect(() => {
    selectedIdRef.current = selectedId ?? null
  }, [selectedId])

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', cursor: 'default' }}
    />
  )
}

/** Spawn a couple demo characters so the office isn't empty when no sessions are active */
function spawnDemoCharacters(charManager: CharacterManager): void {
  const demo1 = charManager.spawnCharacter('demo-1', 'Agent-1', 'claude-code')
  if (demo1) {
    setTimeout(() => {
      charManager.onActivity('demo-1', 'writing', 'Edit', '/src/components/app.tsx')
    }, 3000)
    setTimeout(() => {
      charManager.onActivity('demo-1', 'reading', 'Read', '/src/utils/helpers.ts')
    }, 8000)
    setTimeout(() => {
      charManager.onActivity('demo-1', 'thinking')
    }, 12000)
    setTimeout(() => {
      charManager.onActivity('demo-1', 'celebrating')
    }, 15000)
    // Done — walk to break room
    setTimeout(() => {
      charManager.onActivity('demo-1', 'idle')
    }, 20000)
  }

  const demo2 = charManager.spawnCharacter('demo-2', 'Agent-2', 'claude-desktop')
  if (demo2) {
    setTimeout(() => {
      charManager.onActivity('demo-2', 'reading', 'Grep', '/src/shared/')
    }, 2000)
    setTimeout(() => {
      charManager.onActivity('demo-2', 'writing', 'Write', '/src/config.json')
    }, 6000)
    setTimeout(() => {
      charManager.onActivity('demo-2', 'running', 'Bash')
    }, 9000)
    setTimeout(() => {
      charManager.onActivity('demo-2', 'waiting')
    }, 12000)
    // Done — walk to lounge
    setTimeout(() => {
      charManager.onActivity('demo-2', 'idle')
    }, 16000)
  }
}
