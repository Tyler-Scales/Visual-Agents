import type { Character } from '../characters/Character'

export interface ActivityLogEntry {
  activity: string
  toolName?: string
  filePath?: string
  timestamp: number
}

interface DetailPanelProps {
  character: Character
  activityLog: ActivityLogEntry[]
  onClose: () => void
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

function formatTime(ts: number): string {
  const d = new Date(ts)
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  const s = d.getSeconds().toString().padStart(2, '0')
  return `${h}:${m}:${s}`
}

export function DetailPanel({ character, activityLog, onClose }: DetailPanelProps) {
  const stateLabel = stateLabels[character.state] || character.state
  const sourceLabel = character.source === 'claude-desktop' ? 'Claude Desktop' : 'Claude Code'

  // Show last 20 entries, most recent first
  const recentLog = activityLog.slice(-20).reverse()

  // Find the most recent file path from log entries
  const currentFile = recentLog.find((e) => e.filePath)?.filePath ?? null

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>{character.name}</span>
        <button style={styles.closeBtn} onClick={onClose}>
          X
        </button>
      </div>

      <div style={styles.section}>
        <div style={styles.row}>
          <span style={styles.label}>Source:</span>
          <span style={styles.value}>{sourceLabel}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>State:</span>
          <span style={styles.value}>{stateLabel}</span>
        </div>
        {character.isSubagent && (
          <div style={styles.row}>
            <span style={styles.label}>Type:</span>
            <span style={styles.value}>Subagent</span>
          </div>
        )}
        {currentFile && (
          <div style={styles.row}>
            <span style={styles.label}>File:</span>
            <span style={{ ...styles.value, ...styles.filePath }}>{currentFile}</span>
          </div>
        )}
      </div>

      <div style={styles.logHeader}>Recent Activity</div>
      <div style={styles.logContainer}>
        {recentLog.length === 0 ? (
          <div style={styles.emptyLog}>No activity yet</div>
        ) : (
          recentLog.map((entry, i) => (
            <div key={`${entry.timestamp}-${i}`} style={styles.logEntry}>
              <span style={styles.logTime}>{formatTime(entry.timestamp)}</span>
              <span style={styles.logActivity}>{entry.activity}</span>
              {entry.toolName && (
                <span style={styles.logTool}>{entry.toolName}</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: 8,
    right: 8,
    bottom: 8,
    width: 280,
    background: 'rgba(15, 15, 30, 0.88)',
    borderRadius: 4,
    border: '1px solid rgba(255,255,255,0.1)',
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#e0e0e0',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 10,
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 10px',
    borderBottom: '1px solid rgba(255,255,255,0.1)'
  },
  title: {
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 0.5,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 3,
    color: '#ccc',
    fontFamily: 'monospace',
    fontSize: 11,
    padding: '2px 6px',
    cursor: 'pointer',
    lineHeight: 1
  },
  section: {
    padding: '8px 10px',
    borderBottom: '1px solid rgba(255,255,255,0.1)'
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '2px 0'
  },
  label: {
    color: '#888',
    fontSize: 10,
    flexShrink: 0
  },
  value: {
    color: '#e0e0e0',
    fontSize: 11,
    textAlign: 'right' as const
  },
  filePath: {
    color: '#7ab0e0',
    maxWidth: 180,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    direction: 'rtl' as const // show the filename end
  },
  logHeader: {
    padding: '6px 10px',
    color: '#888',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    borderBottom: '1px solid rgba(255,255,255,0.06)'
  },
  logContainer: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '4px 0'
  },
  emptyLog: {
    padding: '8px 10px',
    color: '#555',
    fontStyle: 'italic'
  },
  logEntry: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '3px 10px',
    borderBottom: '1px solid rgba(255,255,255,0.03)'
  },
  logTime: {
    color: '#555',
    fontSize: 9,
    flexShrink: 0,
    fontVariantNumeric: 'tabular-nums'
  },
  logActivity: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const
  },
  logTool: {
    color: '#7a7ad9',
    fontSize: 9,
    flexShrink: 0
  }
}
