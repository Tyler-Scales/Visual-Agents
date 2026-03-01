import { useState, useEffect } from 'react'

interface AchievementToastProps {
  name: string
  description: string
  onDismiss: () => void
}

export function AchievementToast({ name, description, onDismiss }: AchievementToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Slide in
    requestAnimationFrame(() => setVisible(true))

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 400) // wait for slide-out animation
    }, 5000)

    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div
      style={{
        ...styles.container,
        transform: visible ? 'translateX(0)' : 'translateX(120%)',
        opacity: visible ? 1 : 0
      }}
    >
      <div style={styles.icon}>★</div>
      <div style={styles.content}>
        <div style={styles.label}>Achievement Unlocked!</div>
        <div style={styles.name}>{name}</div>
        <div style={styles.description}>{description}</div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    bottom: 20,
    right: 20,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 16px',
    background: 'rgba(15, 15, 30, 0.92)',
    border: '1px solid rgba(255, 215, 0, 0.4)',
    borderRadius: 6,
    fontFamily: 'monospace',
    color: '#e0e0e0',
    zIndex: 50,
    transition: 'transform 0.4s ease, opacity 0.4s ease',
    maxWidth: 300
  },
  icon: {
    fontSize: 24,
    color: '#ffd700',
    flexShrink: 0
  },
  content: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2
  },
  label: {
    fontSize: 9,
    color: '#ffd700',
    textTransform: 'uppercase' as const,
    letterSpacing: 1
  },
  name: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff'
  },
  description: {
    fontSize: 10,
    color: '#aaa'
  }
}
