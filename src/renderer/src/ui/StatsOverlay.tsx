import { useState, useEffect } from 'react'
import type { GlobalStats, AchievementDef } from '../../../shared/types'

interface StatsOverlayProps {
  onClose: () => void
}

export function StatsOverlay({ onClose }: StatsOverlayProps) {
  const [stats, setStats] = useState<GlobalStats | null>(null)
  const [achievements, setAchievements] = useState<AchievementDef[]>([])

  useEffect(() => {
    if (!window.api) return

    window.api.getGlobalStats().then(setStats).catch(() => {})
    window.api.getAchievements().then(setAchievements).catch(() => {})
  }, [])

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={styles.title}>Stats & Achievements</span>
          <button style={styles.closeBtn} onClick={onClose}>X</button>
        </div>

        {stats && (
          <div style={styles.statsGrid}>
            <StatItem label="Total Sessions" value={stats.totalSessions} />
            <StatItem label="Total Tool Calls" value={stats.totalToolCalls} />
            <StatItem label="Write Ops" value={stats.totalWriteOps} />
            <StatItem label="Read Ops" value={stats.totalReadOps} />
            <StatItem label="Bash Calls" value={stats.totalBashCalls} />
            <StatItem label="Max Concurrent" value={stats.maxConcurrentSessions} />
            <StatItem
              label="Longest Session"
              value={stats.longestSessionMs > 0
                ? `${Math.round(stats.longestSessionMs / 60000)}m`
                : '0m'}
            />
          </div>
        )}

        <div style={styles.achievementsHeader}>Achievements</div>
        <div style={styles.achievementGrid}>
          {achievements.map((a) => {
            const unlocked = stats?.achievementsUnlocked.includes(a.id)
            return (
              <div
                key={a.id}
                style={{
                  ...styles.achievementCard,
                  opacity: unlocked ? 1 : 0.35,
                  borderColor: unlocked ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.08)'
                }}
              >
                <div style={{ ...styles.achievementIcon, color: unlocked ? '#ffd700' : '#444' }}>
                  {unlocked ? '★' : '☆'}
                </div>
                <div style={styles.achievementName}>{a.name}</div>
                <div style={styles.achievementDesc}>{a.description}</div>
              </div>
            )
          })}
          {achievements.length === 0 && (
            <div style={styles.empty}>No achievements defined yet</div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={styles.statItem}>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    fontFamily: 'monospace'
  },
  panel: {
    background: 'rgba(15, 15, 30, 0.95)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 8,
    width: 480,
    maxHeight: '80vh',
    overflowY: 'auto' as const,
    color: '#e0e0e0'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.1)'
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 3,
    color: '#ccc',
    fontFamily: 'monospace',
    fontSize: 11,
    padding: '2px 6px',
    cursor: 'pointer'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 1,
    padding: 16
  },
  statItem: {
    textAlign: 'center' as const,
    padding: '8px 4px'
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff'
  },
  statLabel: {
    fontSize: 9,
    color: '#888',
    marginTop: 2
  },
  achievementsHeader: {
    padding: '8px 16px',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#888',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    borderBottom: '1px solid rgba(255,255,255,0.06)'
  },
  achievementGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 8,
    padding: 16
  },
  achievementCard: {
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 4,
    textAlign: 'center' as const
  },
  achievementIcon: {
    fontSize: 20,
    marginBottom: 4
  },
  achievementName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#e0e0e0'
  },
  achievementDesc: {
    fontSize: 9,
    color: '#888',
    marginTop: 2
  },
  empty: {
    gridColumn: '1 / -1',
    textAlign: 'center' as const,
    color: '#555',
    padding: 16,
    fontStyle: 'italic'
  }
}
