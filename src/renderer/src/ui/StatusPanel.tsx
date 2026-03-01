import { useState } from 'react'
import type { Character } from '../characters/Character'

interface StatusPanelProps {
  characters: Character[]
  onSelectCharacter?: (id: string) => void
}

const stateIcons: Record<string, string> = {
  idle: '  ',
  walking: '  ',
  typing: '  ',
  reading: '  ',
  thinking: '  ',
  waiting: '  ',
  celebrating: '  '
}

const stateLabels: Record<string, string> = {
  idle: 'Idle',
  walking: 'Walking',
  typing: 'Writing',
  reading: 'Reading',
  thinking: 'Thinking',
  waiting: 'Waiting',
  celebrating: 'Done!'
}

export function StatusPanel({ characters, onSelectCharacter }: StatusPanelProps) {
  const [collapsed, setCollapsed] = useState(false)

  if (characters.length === 0) return null

  return (
    <div style={styles.container}>
      <div style={styles.header} onClick={() => setCollapsed(!collapsed)}>
        <span style={styles.title}>
          Agents ({characters.length})
        </span>
        <span style={styles.toggle}>{collapsed ? '+' : '-'}</span>
      </div>
      {!collapsed && (
        <div style={styles.list}>
          {characters.map((char) => (
            <div
              key={char.id}
              style={styles.agent}
              onClick={() => onSelectCharacter?.(char.id)}
            >
              <span
                style={{
                  ...styles.dot,
                  backgroundColor: char.color
                }}
              />
              <span style={styles.name}>{char.name}</span>
              <span style={styles.state}>
                {stateLabels[char.state] || char.state}
              </span>
              <span style={styles.source}>
                {char.source === 'claude-desktop' ? 'Desktop' : 'CLI'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    background: 'rgba(15, 15, 30, 0.85)',
    borderRadius: 4,
    border: '1px solid rgba(255,255,255,0.1)',
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#e0e0e0',
    minWidth: 200,
    maxWidth: 320,
    zIndex: 10
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 10px',
    cursor: 'pointer',
    userSelect: 'none' as const
  },
  title: {
    fontWeight: 'bold',
    letterSpacing: 0.5
  },
  toggle: {
    fontSize: 14,
    lineHeight: 1
  },
  list: {
    borderTop: '1px solid rgba(255,255,255,0.1)',
    maxHeight: 200,
    overflowY: 'auto' as const
  },
  agent: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    cursor: 'pointer',
    borderBottom: '1px solid rgba(255,255,255,0.05)'
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    flexShrink: 0
  },
  name: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const
  },
  state: {
    color: '#aaa',
    fontSize: 10
  },
  source: {
    color: '#666',
    fontSize: 9
  }
}
