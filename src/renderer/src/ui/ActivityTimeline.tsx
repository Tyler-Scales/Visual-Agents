import { useState, useEffect } from 'react'
import type { SessionHistoryEntry } from '../../../shared/types'

interface ActivityTimelineProps {
  sessionId: string
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

const MAX_SEGMENTS = 30

export function ActivityTimeline({ sessionId }: ActivityTimelineProps) {
  const [timeline, setTimeline] = useState<SessionHistoryEntry | null>(null)

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const t = await window.api.getSessionTimeline(sessionId)
        setTimeline(t)
      } catch {
        // Ignore
      }
    }

    fetchTimeline()
    const timer = setInterval(fetchTimeline, 5000)
    return () => clearInterval(timer)
  }, [sessionId])

  if (!timeline || timeline.activities.length === 0) return null

  // Group consecutive activities of same type and compute durations
  const activities = timeline.activities
  const segments: { type: string; duration: number }[] = []

  for (let i = 0; i < activities.length; i++) {
    const activity = activities[i]
    const nextTimestamp = i + 1 < activities.length ? activities[i + 1].timestamp : Date.now()
    const duration = Math.max(nextTimestamp - activity.timestamp, 100) // min 100ms for visibility

    // Merge consecutive same-type segments
    if (segments.length > 0 && segments[segments.length - 1].type === activity.type) {
      segments[segments.length - 1].duration += duration
    } else {
      segments.push({ type: activity.type, duration })
    }
  }

  // Take only the last MAX_SEGMENTS
  const recentSegments = segments.slice(-MAX_SEGMENTS)

  // Calculate total duration for width proportions
  const totalDuration = recentSegments.reduce((sum, s) => sum + s.duration, 0)
  if (totalDuration === 0) return null

  return (
    <div style={styles.container}>
      {recentSegments.map((seg, i) => (
        <div
          key={i}
          title={`${seg.type} (${Math.round(seg.duration / 1000)}s)`}
          style={{
            height: '100%',
            width: `${(seg.duration / totalDuration) * 100}%`,
            backgroundColor: ACTIVITY_COLORS[seg.type] || '#666',
            minWidth: 2
          }}
        />
      ))}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    height: 6,
    marginTop: 4,
    marginLeft: 14,
    borderRadius: 3,
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.03)'
  }
}
