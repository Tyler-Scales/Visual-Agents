import { useState, useCallback, useEffect, useRef } from 'react'
import { GameCanvas } from './components/GameCanvas'
import { StatusPanel } from './ui/StatusPanel'
import { ErrorOverlay } from './ui/ErrorOverlay'
import { EditorToolbar } from './ui/EditorToolbar'
import { DetailPanel } from './ui/DetailPanel'
import { AchievementToast } from './ui/AchievementToast'
import { StatsOverlay } from './ui/StatsOverlay'
import type { Character } from './characters/Character'
import type { Grid } from './engine/Grid'
import type { OfficeEditor } from './editor/OfficeEditor'
import type { OfficeStorage } from './editor/OfficeStorage'
import type { AchievementUnlockEvent } from '../../shared/types'
import type { ActivityLogEntry } from './ui/DetailPanel'

interface EditorInfo {
  active: boolean
  editor: OfficeEditor
  storage: OfficeStorage
  grid: Grid
}

export default function App() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editorInfo, setEditorInfo] = useState<EditorInfo | null>(null)
  const [achievementQueue, setAchievementQueue] = useState<AchievementUnlockEvent[]>([])
  const [showStats, setShowStats] = useState(false)

  // Ref to CharacterManager for getting activity logs
  const charManagerRef = useRef<{ getActivityLog: (id: string) => ActivityLogEntry[] } | null>(null)

  const handleCharactersUpdate = useCallback((chars: Character[]) => {
    setCharacters(chars)
  }, [])

  const handleCharacterSelect = useCallback((id: string | null) => {
    setSelectedId(id)
  }, [])

  const handleEditorStateChange = useCallback(
    (active: boolean, editor: OfficeEditor, storage: OfficeStorage, grid: Grid) => {
      if (active) {
        setEditorInfo({ active, editor, storage, grid })
      } else {
        setEditorInfo(null)
      }
    },
    []
  )

  const handleEditorSave = useCallback(
    (name: string) => {
      if (editorInfo) {
        editorInfo.storage.saveLayout(name, editorInfo.grid)
      }
    },
    [editorInfo]
  )

  const handleEditorLoad = useCallback(
    (name: string) => {
      if (editorInfo) {
        const save = editorInfo.storage.loadLayout(name)
        if (save) {
          editorInfo.storage.applyLayout(save, editorInfo.grid)
        }
      }
    },
    [editorInfo]
  )

  const handleEditorClose = useCallback(() => {
    if (editorInfo) {
      editorInfo.editor.toggle()
      setEditorInfo(null)
    }
  }, [editorInfo])

  // Listen for achievement unlocks
  useEffect(() => {
    if (!window.api) return
    const cleanup = window.api.onAchievementUnlocked((event) => {
      setAchievementQueue((prev) => [...prev, event])
    })
    return cleanup
  }, [])

  // Keyboard shortcut for stats overlay ('A' key)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'a' || e.key === 'A') {
        setShowStats((prev) => !prev)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const dismissAchievement = useCallback(() => {
    setAchievementQueue((prev) => prev.slice(1))
  }, [])

  const selectedChar = selectedId ? characters.find((c) => c.id === selectedId) : null

  return (
    <>
      <GameCanvas
        onCharactersUpdate={handleCharactersUpdate}
        onCharacterSelect={handleCharacterSelect}
        selectedId={selectedId}
        onEditorStateChange={handleEditorStateChange}
      />
      <StatusPanel characters={characters} />
      <ErrorOverlay />

      {selectedChar && (
        <DetailPanel
          character={selectedChar}
          activityLog={[]}
          onClose={() => setSelectedId(null)}
        />
      )}

      {editorInfo && (
        <EditorToolbar
          editor={editorInfo.editor}
          storage={editorInfo.storage}
          grid={editorInfo.grid}
          onSave={handleEditorSave}
          onLoad={handleEditorLoad}
          onClose={handleEditorClose}
        />
      )}

      {achievementQueue.length > 0 && (
        <AchievementToast
          name={achievementQueue[0].name}
          description={achievementQueue[0].description}
          onDismiss={dismissAchievement}
        />
      )}

      {showStats && <StatsOverlay onClose={() => setShowStats(false)} />}
    </>
  )
}
