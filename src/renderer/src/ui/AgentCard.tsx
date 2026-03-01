import { useState, useEffect, useRef } from 'react'
import type { Character } from '../characters/Character'
import type { SessionStats } from '../../../shared/types'
import { ActivityTimeline } from './ActivityTimeline'

interface AgentCardProps {
  character: Character
  onSelect?: (id: string) => void
}

/** Format a duration in ms to a human-readable string like "2m 30s" or "1h 5m" */
function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}

/** Activity type colors for the mini bar chart */
const ACTIVITY_COLORS: Record<string, string> = {
  Edit: '#4a90d9',
  Write: '#4a90d9',
  NotebookEdit: '#4a90d9',
  TodoWrite: '#4a90d9',
  Read: '#4ad994',
  Grep: '#4ad994',
  Glob: '#4ad994',
  Bash: '#d9b44a',
  Task: '#d9b44a',
  Skill: '#d9b44a',
  WebFetch: '#9a4ad9',
  WebSearch: '#9a4ad9',
  AskUserQuestion: '#d94a4a',
  EnterPlanMode: '#9a4ad9',
  ExitPlanMode: '#9a4ad9'
}

const DEFAULT_TOOL_COLOR = '#666'

const stateLabels: Record<string, string> = {
  idle: 'Idle',
  walking: 'Walking',
  typing: 'Writing',
  reading: 'Reading',
  thinking: 'Thinking',
  waiting: 'Waiting',
  celebrating: 'Done!'
}

export function AgentCard({ character, onSelect }: AgentCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [stats, setStats] = useState<SessionStats | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Fetch stats periodically
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const s = await window.api.getSessionStats(character.id)
        setStats(s)
      } catch {
        // Ignore fetch errors
      }
    }

    fetchStats()
    const timer = setInterval(fetchStats, 3000)
    return () => clearInterval(timer)
  }, [character.id])

  // Duration timer
  useEffect(() => {
    if (stats?.startedAt) {
      setElapsed(Date.now() - stats.startedAt)
      intervalRef.current = setInterval(() => {
        setElapsed(Date.now() - stats.startedAt)
      }, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [stats?.startedAt])

  const totalTools = stats?.toolCallCount ?? 0
  const breakdown = stats?.toolBreakdown ?? {}

  // Build mini bar segments from tool breakdown
  const barSegments: { color: string; width: number; label: string }[] = []
  if (totalTools > 0) {
    for (const [toolName, count] of Object.entries(breakdown)) {
      barSegments.push({
        color: ACTIVITY_COLORS[toolName] || DEFAULT_TOOL_COLOR,
        width: (count / totalTools) * 100,
        label: `${toolName}: ${count}`
      })
    }
  }

  // Truncate file path to last 40 chars
  const displayPath = stats?.lastFilePath
    ? stats.lastFilePath.length > 40
      ? '...' + stats.lastFilePath.slice(-40)
      : stats.lastFilePath
    : null

  return (
    <div style={styles.card}>
      <div
        style={styles.cardHeader}
        onClick={() => {
          setExpanded(!expanded)
          onSelect?.(character.id)
        }}
      >
        <span style={{ ...styles.dot, backgroundColor: character.color }} />
        <span style={styles.name}>{character.name}</span>
        <span style={styles.sourceBadge}>
          {character.source === 'claude-desktop' ? 'Desktop' : 'CLI'}
        </span>
        <span style={styles.duration}>{formatDuration(elapsed)}</span>
        <span style={styles.expandIcon}>{expanded ? '-' : '+'}</span>
      </div>

      {/* Compact info row - always visible */}
      <div style={styles.compactRow}>
        <span style={styles.stateLabel}>
          {stateLabels[character.state] || character.state}
        </span>
        <span style={styles.toolCount}>{totalTools} calls</span>
      </div>

      {/* Mini bar chart */}
      {totalTools > 0 && (
        <div style={styles.barContainer}>
          {barSegments.map((seg, i) => (
            <div
              key={i}
              title={seg.label}
              style={{
                height: '100%',
                width: `${seg.width}%`,
                backgroundColor: seg.color,
                minWidth: 2
              }}
            />
          ))}
        </div>
      )}

      {/* Activity timeline */}
      <ActivityTimeline sessionId={character.id} />

      {/* Expanded details */}
      {expanded && (
        <div style={styles.details}>
          {stats?.lastToolName && (
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Tool:</span>
              <span style={styles.detailValue}>{stats.lastToolName}</span>
            </div>
          )}
          {displayPath && (
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>File:</span>
              <span style={styles.detailValue}>{displayPath}</span>
            </div>
          )}
          {totalTools > 0 && (
            <div style={styles.breakdownSection}>
              <span style={styles.detailLabel}>Breakdown:</span>
              {Object.entries(breakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([toolName, count]) => (
                  <div key={toolName} style={styles.breakdownRow}>
                    <span
                      style={{
                        ...styles.breakdownDot,
                        backgroundColor: ACTIVITY_COLORS[toolName] || DEFAULT_TOOL_COLOR
                      }}
                    />
                    <span style={styles.breakdownName}>{toolName}</span>
                    <span style={styles.breakdownCount}>{count}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    padding: '6px 10px'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
    userSelect: 'none' as const
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0
  },
  name: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    fontWeight: 'bold' as const,
    fontSize: 11
  },
  sourceBadge: {
    fontSize: 8,
    color: '#888',
    background: 'rgba(255,255,255,0.06)',
    padding: '1px 4px',
    borderRadius: 2,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5
  },
  duration: {
    fontSize: 10,
    color: '#8ab4f8',
    fontVariantNumeric: 'tabular-nums'
  },
  expandIcon: {
    fontSize: 12,
    color: '#666',
    width: 12,
    textAlign: 'center' as const,
    lineHeight: 1
  },
  compactRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 3,
    paddingLeft: 14
  },
  stateLabel: {
    fontSize: 9,
    color: '#aaa',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5
  },
  toolCount: {
    fontSize: 9,
    color: '#888'
  },
  barContainer: {
    display: 'flex',
    height: 4,
    marginTop: 4,
    marginLeft: 14,
    borderRadius: 2,
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.05)'
  },
  details: {
    marginTop: 6,
    paddingLeft: 14,
    borderTop: '1px solid rgba(255,255,255,0.05)',
    paddingTop: 6
  },
  detailRow: {
    display: 'flex',
    gap: 6,
    marginBottom: 3,
    fontSize: 10
  },
  detailLabel: {
    color: '#666',
    flexShrink: 0
  },
  detailValue: {
    color: '#ccc',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const
  },
  breakdownSection: {
    marginTop: 4
  },
  breakdownRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 9,
    marginTop: 2,
    paddingLeft: 4
  },
  breakdownDot: {
    width: 5,
    height: 5,
    borderRadius: '50%',
    flexShrink: 0
  },
  breakdownName: {
    color: '#aaa',
    flex: 1
  },
  breakdownCount: {
    color: '#888',
    fontVariantNumeric: 'tabular-nums'
  }
}
