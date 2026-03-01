import { useState, useEffect, useRef } from 'react'
import type { SessionHistoryEntry } from '../../../shared/types'

interface TimelinePanelProps {
  visible: boolean
}

/** Activity type -> color mapping */
const ACTIVITY_COLORS: Record<string, string> = {
  writing: '#4a90d9',
  reading: '#4ad994',
  running: '#d9b44a',
  searching: '#9a4ad9',
  thinking: '#9a4ad9',
  waiting: '#d94a4a',
  idle: '#666',
  celebrating: '#d9b44a'
}

/** Format timestamp to a short time label */
function formatTime(ts: number): string {
  const d = new Date(ts)
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

/** Format duration in ms to a readable label */
function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m`
  return `${totalSeconds}s`
}

const LANE_HEIGHT = 26
const TIME_AXIS_HEIGHT = 20
const LABEL_WIDTH = 120

export function TimelinePanel({ visible }: TimelinePanelProps) {
  const [history, setHistory] = useState<SessionHistoryEntry[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!visible) return

    const fetchHistory = async () => {
      try {
        const h = await window.api.getSessionHistory()
        setHistory(h)
      } catch {
        // Ignore
      }
    }

    fetchHistory()
    const timer = setInterval(fetchHistory, 5000)
    return () => clearInterval(timer)
  }, [visible])

  if (!visible) return null
  if (history.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyMessage}>No session history yet</div>
      </div>
    )
  }

  // Find global time range across all sessions
  const allStarts = history.map((h) => h.startedAt)
  const allEnds = history.map((h) => h.endedAt ?? Date.now())
  const globalStart = Math.min(...allStarts)
  const globalEnd = Math.max(...allEnds)
  const globalDuration = globalEnd - globalStart || 1

  // Width of the timeline area (pixels)
  const TIMELINE_WIDTH = 600

  // Generate time axis ticks (roughly every 5 minutes)
  const tickIntervalMs = Math.max(
    5 * 60 * 1000,
    Math.ceil(globalDuration / 10 / (5 * 60 * 1000)) * (5 * 60 * 1000)
  )
  const ticks: { position: number; label: string }[] = []
  const firstTick = Math.ceil(globalStart / tickIntervalMs) * tickIntervalMs
  for (let t = firstTick; t <= globalEnd; t += tickIntervalMs) {
    const position = ((t - globalStart) / globalDuration) * TIMELINE_WIDTH
    ticks.push({ position, label: formatTime(t) })
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>Session Timeline</span>
        <span style={styles.range}>
          {formatTime(globalStart)} - {formatTime(globalEnd)} ({formatDuration(globalDuration)})
        </span>
      </div>

      <div style={styles.scrollArea} ref={scrollRef}>
        {history.map((entry) => {
          const sessionStart = entry.startedAt
          const sessionEnd = entry.endedAt ?? Date.now()

          // Build activity segments for this session
          const segments: { left: number; width: number; color: string; type: string }[] = []

          if (entry.activities.length > 0) {
            for (let i = 0; i < entry.activities.length; i++) {
              const act = entry.activities[i]
              const nextTs =
                i + 1 < entry.activities.length
                  ? entry.activities[i + 1].timestamp
                  : sessionEnd

              const left = ((act.timestamp - globalStart) / globalDuration) * TIMELINE_WIDTH
              const width = Math.max(
                ((nextTs - act.timestamp) / globalDuration) * TIMELINE_WIDTH,
                1
              )

              segments.push({
                left,
                width,
                color: ACTIVITY_COLORS[act.type] || '#666',
                type: act.type
              })
            }
          } else {
            // No activities - show as idle
            const left = ((sessionStart - globalStart) / globalDuration) * TIMELINE_WIDTH
            const width = Math.max(
              ((sessionEnd - sessionStart) / globalDuration) * TIMELINE_WIDTH,
              2
            )
            segments.push({ left, width, color: '#666', type: 'idle' })
          }

          return (
            <div key={entry.sessionId} style={styles.lane}>
              <div style={styles.laneLabel} title={entry.projectName}>
                <span style={styles.laneName}>
                  {entry.projectName.length > 14
                    ? entry.projectName.slice(0, 14) + '...'
                    : entry.projectName}
                </span>
                <span style={styles.laneSource}>
                  {entry.source === 'claude-desktop' ? 'Desktop' : 'CLI'}
                </span>
              </div>
              <div style={styles.laneTrack}>
                {segments.map((seg, i) => (
                  <div
                    key={i}
                    title={`${seg.type}`}
                    style={{
                      position: 'absolute' as const,
                      left: seg.left,
                      width: seg.width,
                      height: LANE_HEIGHT - 8,
                      top: 4,
                      backgroundColor: seg.color,
                      borderRadius: 2
                    }}
                  />
                ))}
              </div>
            </div>
          )
        })}

        {/* Time axis */}
        <div style={{ ...styles.timeAxis, width: LABEL_WIDTH + TIMELINE_WIDTH }}>
          <div style={{ width: LABEL_WIDTH, flexShrink: 0 }} />
          <div style={{ position: 'relative' as const, flex: 1, height: TIME_AXIS_HEIGHT }}>
            {ticks.map((tick, i) => (
              <span
                key={i}
                style={{
                  position: 'absolute' as const,
                  left: tick.position,
                  top: 2,
                  fontSize: 8,
                  color: '#555',
                  transform: 'translateX(-50%)',
                  whiteSpace: 'nowrap' as const
                }}
              >
                {tick.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'rgba(10, 10, 25, 0.92)',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#e0e0e0',
    zIndex: 15,
    maxHeight: 200
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.08)'
  },
  title: {
    fontWeight: 'bold',
    fontSize: 11,
    letterSpacing: 0.5
  },
  range: {
    color: '#888',
    fontSize: 9
  },
  scrollArea: {
    overflowX: 'auto',
    overflowY: 'auto',
    maxHeight: 160,
    padding: '4px 0'
  },
  emptyMessage: {
    padding: '12px 16px',
    color: '#666',
    textAlign: 'center' as const
  },
  lane: {
    display: 'flex',
    height: LANE_HEIGHT,
    alignItems: 'center'
  },
  laneLabel: {
    width: LABEL_WIDTH,
    flexShrink: 0,
    paddingLeft: 12,
    paddingRight: 8,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 1,
    overflow: 'hidden'
  },
  laneName: {
    fontSize: 9,
    color: '#ccc',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  laneSource: {
    fontSize: 7,
    color: '#666',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5
  },
  laneTrack: {
    flex: 1,
    position: 'relative' as const,
    height: LANE_HEIGHT,
    background: 'rgba(255,255,255,0.02)'
  },
  timeAxis: {
    display: 'flex',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    height: TIME_AXIS_HEIGHT
  }
}
