import { useState, useEffect, useCallback, useRef } from 'react'
import type { ErrorInfo } from '../../../shared/types'

const MAX_ERRORS = 5
const AUTO_DISMISS_MS = 10000

export function ErrorOverlay() {
  const [errors, setErrors] = useState<ErrorInfo[]>([])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismissError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const addError = useCallback(
    (error: ErrorInfo) => {
      setErrors((prev) => {
        const next = [...prev, error]
        // Keep only the last MAX_ERRORS
        if (next.length > MAX_ERRORS) {
          const removed = next.shift()!
          const timer = timersRef.current.get(removed.id)
          if (timer) {
            clearTimeout(timer)
            timersRef.current.delete(removed.id)
          }
        }
        return next
      })

      // Auto-dismiss after 10 seconds
      const timer = setTimeout(() => {
        dismissError(error.id)
      }, AUTO_DISMISS_MS)
      timersRef.current.set(error.id, timer)
    },
    [dismissError]
  )

  useEffect(() => {
    if (!window.api?.onError) return
    const cleanup = window.api.onError((error) => {
      addError(error)
    })
    return cleanup
  }, [addError])

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      for (const timer of timersRef.current.values()) {
        clearTimeout(timer)
      }
      timersRef.current.clear()
    }
  }, [])

  if (errors.length === 0) return null

  return (
    <div style={styles.container}>
      {errors.map((error) => (
        <div key={error.id} style={styles.toast}>
          <div style={styles.toastHeader}>
            <span style={styles.source}>{error.source}</span>
            <button
              style={styles.closeButton}
              onClick={() => dismissError(error.id)}
              aria-label="Dismiss error"
            >
              x
            </button>
          </div>
          <div style={styles.message}>{error.message}</div>
        </div>
      ))}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: 8,
    right: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    zIndex: 100,
    maxWidth: 360,
    pointerEvents: 'auto'
  },
  toast: {
    background: 'rgba(180, 40, 40, 0.92)',
    borderRadius: 4,
    border: '1px solid rgba(255, 80, 80, 0.4)',
    padding: '8px 10px',
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#ffe0e0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
    animation: 'fadeIn 200ms ease-out'
  },
  toastHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  source: {
    fontWeight: 'bold',
    fontSize: 10,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    color: '#ff9090'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#ff9090',
    cursor: 'pointer',
    fontSize: 12,
    fontFamily: 'monospace',
    padding: '0 2px',
    lineHeight: 1
  },
  message: {
    wordBreak: 'break-word' as const,
    lineHeight: 1.4
  }
}
